import { useMutation } from "@tanstack/react-query";
import { LeadSubmissionPayload, LeadSubmissionResponse } from "@/lib/types/estimator";

async function submitLeadApi(payload: LeadSubmissionPayload): Promise<LeadSubmissionResponse> {
  const response = await fetch("/api/leads", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.message || "Erreur lors de l'envoi de la soumission.");
  }

  return data;
}

export function useSubmitLead() {
  return useMutation({
    mutationFn: submitLeadApi,
  });
}
