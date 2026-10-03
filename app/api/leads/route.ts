import { NextResponse } from "next/server";
import { leadSubmissionSchema } from "@/lib/validations/estimator";
import { calculateRoofingEstimate } from "@/lib/pricing";
import { createAdminClient } from "@/lib/supabase/admin";
import { CrmWebhookPayload } from "@/lib/types/estimator";

export async function POST(request: Request) {
  try {
    let json: unknown;
    try {
      json = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: "Format JSON invalide dans le corps de la requête.",
        },
        { status: 400 }
      );
    }

    // 1. Revalidation stricte côté serveur avec Zod
    const validationResult = leadSubmissionSchema.safeParse(json);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Les données fournies sont incomplètes ou invalides.",
          errors: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { project, contact } = validationResult.data;

    // 2. Recalcul de l'estimation côté serveur (moteur de tarification pure)
    // Garantit l'exactitude des calculs sans se fier aveuglément aux valeurs du client
    const serverEstimate = calculateRoofingEstimate(project);

    // Génération des identifiants uniques
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const referenceNumber = `TB-2026-${randomSuffix}`;
    const leadId = `lead_${Date.now()}_${randomSuffix}`;
    const createdAt = new Date().toISOString();

    const supabase = createAdminClient();

    // 3. Enregistrement initial dans la base Supabase
    let dbInsertSuccess = false;
    try {
      const { error: insertError } = await supabase.from("leads").insert([
        {
          id: leadId,
          reference_number: referenceNumber,
          full_name: contact.fullName,
          email: contact.email,
          phone: contact.phone,
          city: contact.city,
          message: contact.message || null,
          project_type: project.projectType,
          material: project.material,
          surface_sqft: project.surfaceSqFt,
          slope: project.slope,
          demolition: project.demolition,
          subtotal: serverEstimate.subtotal,
          range_min: serverEstimate.rangeMin,
          range_max: serverEstimate.rangeMax,
          tps: serverEstimate.tps,
          tvq: serverEstimate.tvq,
          total_with_taxes: serverEstimate.totalWithTaxes,
          crm_status: "pending",
          status: "nouveau",
          created_at: createdAt,
        },
      ]);

      if (insertError) {
        console.error("Erreur lors de l'insertion dans Supabase :", insertError);
      } else {
        dbInsertSuccess = true;
      }
    } catch (dbErr) {
      console.error("Exception lors de la connexion à Supabase :", dbErr);
    }

    // 4. Préparation du payload pour le webhook CRM externe
    const crmPayload: CrmWebhookPayload = {
      leadId,
      referenceNumber,
      timestamp: createdAt,
      source: "estimateur_web_toitures_boreal",
      contact: {
        fullName: contact.fullName,
        email: contact.email,
        phone: contact.phone,
        city: contact.city,
        message: contact.message || undefined,
      },
      project: {
        type: project.projectType,
        material: project.material,
        surfaceSqFt: project.surfaceSqFt,
        slope: project.slope,
        demolition: project.demolition,
      },
      estimate: {
        subtotal: serverEstimate.subtotal,
        rangeMin: serverEstimate.rangeMin,
        rangeMax: serverEstimate.rangeMax,
        tps: serverEstimate.tps,
        tvq: serverEstimate.tvq,
        totalWithTaxes: serverEstimate.totalWithTaxes,
        currency: "CAD",
      },
    };

    // 5. Transmission au webhook externe simulant le CRM
    const webhookUrl = process.env.CRM_WEBHOOK_URL;
    let crmSuccess = false;
    let crmResponseData: Record<string, unknown> | null = null;
    let crmErrorMessage = "";

    if (webhookUrl) {
      try {
        console.log(`[CRM INTEGRATION] Envoi du webhook vers ${webhookUrl} pour le lead ${referenceNumber}...`);
        
        // Timeout de 8 secondes pour éviter de bloquer l'utilisateur indéfiniment
        const crmResponse = await fetch(webhookUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "User-Agent": "ToituresBoreal-CRM-Client/1.0",
          },
          body: JSON.stringify(crmPayload),
          signal: AbortSignal.timeout(8000),
        });

        if (crmResponse.ok) {
          crmSuccess = true;
          try {
            crmResponseData = await crmResponse.json();
          } catch {
            crmResponseData = { rawStatus: crmResponse.status, statusText: crmResponse.statusText };
          }
          console.log(`[CRM INTEGRATION] Succès pour ${referenceNumber}:`, crmResponseData);
        } else {
          let errorDetail = "";
          try {
            const errJson = await crmResponse.json();
            errorDetail = errJson.message || JSON.stringify(errJson);
          } catch {
            errorDetail = `HTTP ${crmResponse.status} ${crmResponse.statusText}`;
          }
          crmErrorMessage = `Le webhook CRM a répondu avec le statut ${crmResponse.status} : ${errorDetail}`;
          crmResponseData = { error: crmErrorMessage, status: crmResponse.status };
          console.error(`[CRM INTEGRATION] Erreur webhook :`, crmErrorMessage);
        }
      } catch (webhookError: unknown) {
        const error = webhookError as Error;
        crmErrorMessage = error.name === "TimeoutError" 
          ? "Délai d'attente dépassé lors de la connexion au CRM (timeout 8s)."
          : `Impossible de contacter le CRM : ${error.message}`;
        crmResponseData = { error: crmErrorMessage };
        console.error(`[CRM INTEGRATION] Exception webhook :`, crmErrorMessage);
      }
    } else {
      console.warn("[CRM INTEGRATION] Variable CRM_WEBHOOK_URL non configurée.");
      crmSuccess = true; // Mode local sans CRM externe requis
      crmResponseData = { notice: "CRM_WEBHOOK_URL non configuré, mode dégradé local actif" };
    }

    // 6. Mise à jour du statut CRM dans la base Supabase
    if (dbInsertSuccess) {
      try {
        await supabase
          .from("leads")
          .update({
            crm_status: crmSuccess ? "sent" : "failed",
            crm_response: crmResponseData,
          })
          .eq("id", leadId);
      } catch (updateErr) {
        console.error("Erreur lors de la mise à jour du statut CRM dans Supabase :", updateErr);
      }
    }

    // 7. Gestion de l'échec webhook : message d'erreur clair et constructif pour l'utilisateur
    if (!crmSuccess) {
      return NextResponse.json(
        {
          success: false,
          error: "CRM_TRANSMISSION_FAILED",
          leadId,
          referenceNumber,
          message:
            `Votre demande a bien été calculée (Réf: ${referenceNumber}), mais notre système de synchronisation CRM rencontre une perturbation temporaire. ` +
            `Votre estimation de ${serverEstimate.totalWithTaxes.toLocaleString("fr-CA", { style: "currency", currency: "CAD" })} est conservée. ` +
            `Veuillez nous contacter directement au (450) 555-TOIT ou réessayer dans quelques instants.`,
          verifiedEstimate: serverEstimate,
        },
        { status: 502 }
      );
    }

    // 8. Réponse de succès standard
    return NextResponse.json({
      success: true,
      leadId,
      referenceNumber,
      message: "Votre demande de soumission a été transmise avec succès à l'équipe de Toitures Boréal.",
      verifiedEstimate: serverEstimate,
      createdAt,
      crmStatus: "sent",
    });
  } catch (error) {
    console.error("Erreur inattendue dans l'API POST /api/leads :", error);
    return NextResponse.json(
      {
        success: false,
        error: "INTERNAL_SERVER_ERROR",
        message: "Une erreur inattendue est survenue. Veuillez rafraîchir la page ou nous contacter par téléphone au (450) 555-TOIT.",
      },
      { status: 500 }
    );
  }
}

/**
 * Route GET /api/leads : Permet de récupérer les leads avec filtres pour le tableau admin
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectType = searchParams.get("projectType");
    const status = searchParams.get("status");
    const crmStatus = searchParams.get("crmStatus");
    const search = searchParams.get("search");

    const supabase = createAdminClient();

    let query = supabase
      .from("leads")
      .select("*")
      .order("created_at", { ascending: false });

    if (projectType && projectType !== "all") {
      query = query.eq("project_type", projectType);
    }

    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    if (crmStatus && crmStatus !== "all") {
      query = query.eq("crm_status", crmStatus);
    }

    if (search && search.trim() !== "") {
      const s = search.trim();
      query = query.or(
        `full_name.ilike.%${s}%,email.ilike.%${s}%,phone.ilike.%${s}%,city.ilike.%${s}%,reference_number.ilike.%${s}%`
      );
    }

    const { data: leads, error } = await query;

    if (error) {
      console.error("Erreur Supabase lors de la récupération des leads :", error);
      return NextResponse.json(
        { success: false, message: "Impossible de récupérer les leads depuis Supabase.", error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      count: leads?.length || 0,
      leads: leads || [],
    });
  } catch (error) {
    console.error("Erreur GET /api/leads :", error);
    return NextResponse.json(
      { success: false, message: "Erreur serveur lors de la récupération des leads." },
      { status: 500 }
    );
  }
}
