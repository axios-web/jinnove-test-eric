import { NextResponse } from "next/server";

/**
 * Route simulant un CRM externe (ex: HubSpot, Salesforce, Pipedrive).
 * Utilisée pour recevoir les webhooks de leads de Toitures Boréal.
 *
 * Supporte la simulation d'erreurs via :
 * - query param ?fail=true
 * - header 'x-simulate-crm-failure: true'
 */
export async function POST(request: Request) {
  try {
    const url = new URL(request.url);
    const shouldFailQuery = url.searchParams.get("fail") === "true";
    const shouldFailHeader = request.headers.get("x-simulate-crm-failure") === "true";

    if (shouldFailQuery || shouldFailHeader) {
      console.warn("[CRM SIMULATEUR] Échec simulé du webhook CRM.");
      return NextResponse.json(
        {
          success: false,
          error: "CRM_SERVICE_UNAVAILABLE",
          message: "Le serveur CRM distant est temporairement inaccessible.",
        },
        { status: 503 }
      );
    }

    const payload = await request.json();

    console.log("[CRM SIMULATEUR] Webhook reçu avec succès :", {
      leadId: payload.leadId,
      referenceNumber: payload.referenceNumber,
      client: payload.contact?.fullName,
      email: payload.contact?.email,
      phone: payload.contact?.phone,
      totalTTC: payload.estimate?.totalWithTaxes,
    });

    return NextResponse.json({
      success: true,
      crmLeadId: `crm_${Date.now()}`,
      status: "received",
      receivedAt: new Date().toISOString(),
      referenceNumber: payload.referenceNumber,
    });
  } catch (error) {
    console.error("[CRM SIMULATEUR] Erreur de parsing du payload :", error);
    return NextResponse.json(
      {
        success: false,
        error: "INVALID_PAYLOAD",
        message: "Format JSON invalide reçu par le CRM.",
      },
      { status: 400 }
    );
  }
}
