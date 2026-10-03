import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { CrmWebhookPayload } from "@/lib/types/estimator";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createAdminClient();

    const { data: lead, error: fetchError } = await supabase
      .from("leads")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !lead) {
      return NextResponse.json(
        { success: false, message: "Lead introuvable." },
        { status: 404 }
      );
    }

    const webhookUrl = process.env.CRM_WEBHOOK_URL;
    if (!webhookUrl) {
      return NextResponse.json(
        { success: false, message: "Variable CRM_WEBHOOK_URL non configurée." },
        { status: 500 }
      );
    }

    const crmPayload: CrmWebhookPayload = {
      leadId: lead.id,
      referenceNumber: lead.reference_number,
      timestamp: lead.created_at,
      source: "estimateur_web_toitures_boreal",
      contact: {
        fullName: lead.full_name,
        email: lead.email,
        phone: lead.phone,
        city: lead.city,
        message: lead.message || undefined,
      },
      project: {
        type: lead.project_type,
        material: lead.material,
        surfaceSqFt: lead.surface_sqft,
        slope: lead.slope,
        demolition: lead.demolition,
      },
      estimate: {
        subtotal: Number(lead.subtotal),
        rangeMin: Number(lead.range_min),
        rangeMax: Number(lead.range_max),
        tps: Number(lead.tps),
        tvq: Number(lead.tvq),
        totalWithTaxes: Number(lead.total_with_taxes),
        currency: "CAD",
      },
    };

    console.log(`[CRM RETRY] Relance webhook pour le lead ${lead.reference_number} vers ${webhookUrl}...`);

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
      let responseData: Record<string, unknown> = {};
      try {
        responseData = await crmResponse.json();
      } catch {
        responseData = { status: crmResponse.status };
      }

      await supabase
        .from("leads")
        .update({
          crm_status: "sent",
          crm_response: responseData,
        })
        .eq("id", id);

      return NextResponse.json({
        success: true,
        message: `Lead ${lead.reference_number} synchronisé avec succès avec le CRM.`,
      });
    } else {
      const errorText = await crmResponse.text();
      await supabase
        .from("leads")
        .update({
          crm_status: "failed",
          crm_response: { error: errorText, status: crmResponse.status },
        })
        .eq("id", id);

      return NextResponse.json(
        {
          success: false,
          message: `Échec de la relance : HTTP ${crmResponse.status}`,
        },
        { status: 502 }
      );
    }
  } catch (error) {
    console.error("Erreur retry CRM :", error);
    return NextResponse.json(
      {
        success: false,
        message: (error as Error)?.message || "Erreur interne lors de la relance.",
      },
      { status: 500 }
    );
  }
}
