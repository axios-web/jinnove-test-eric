"use client";

import React, { useState, useMemo } from "react";
import {
  ProjectStepData,
  ContactStepData,
  LeadSubmissionResponse,
} from "@/lib/types/estimator";
import { calculateRoofingEstimate } from "@/lib/pricing";
import { projectStepSchema } from "@/lib/validations/estimator";
import { useSubmitLead } from "@/hooks/use-submit-lead";
import { StepProject } from "./steps/step-project";
import { StepEstimate } from "./steps/step-estimate";
import { StepContact } from "./steps/step-contact";
import { StepConfirmation } from "./steps/step-confirmation";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Check, ClipboardList, Calculator, UserCheck, Sparkles } from "lucide-react";

export function EstimatorContainer() {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  const [projectData, setProjectData] = useState<ProjectStepData>({
    projectType: "remplacement_complet",
    material: "bardeaux_asphalte",
    surfaceSqFt: 1800,
    slope: "moyenne",
    demolition: false,
  });

  const [contactData, setContactData] = useState<ContactStepData>({
    fullName: "",
    email: "",
    phone: "",
    city: "Blainville",
    message: "",
  });

  const [step1Errors, setStep1Errors] = useState<Record<string, string>>({});
  const [submissionResponse, setSubmissionResponse] = useState<LeadSubmissionResponse | null>(null);

  // Pure function calculation: recalculated instantaneously when projectData changes
  const estimate = useMemo(() => {
    return calculateRoofingEstimate(projectData);
  }, [projectData]);

  const submitLeadMutation = useSubmitLead();

  const handleProjectDataChange = (newData: Partial<ProjectStepData>) => {
    setProjectData((prev) => ({ ...prev, ...newData }));
    setStep1Errors({});
  };

  const handleContactDataChange = (newData: Partial<ContactStepData>) => {
    setContactData((prev) => ({ ...prev, ...newData }));
  };

  const handleGoToStep2 = () => {
    const result = projectStepSchema.safeParse(projectData);
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        if (issue.path[0]) {
          errors[issue.path[0] as string] = issue.message;
        }
      });
      setStep1Errors(errors);
      return;
    }
    setStep1Errors({});
    setCurrentStep(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleGoToStep3 = () => {
    setCurrentStep(3);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleFinalSubmit = () => {
    submitLeadMutation.mutate(
      {
        project: projectData,
        estimate,
        contact: contactData,
      },
      {
        onSuccess: (data) => {
          setSubmissionResponse(data);
          setCurrentStep(4);
          window.scrollTo({ top: 0, behavior: "smooth" });
        },
      }
    );
  };

  const handleReset = () => {
    setProjectData({
      projectType: "remplacement_complet",
      material: "bardeaux_asphalte",
      surfaceSqFt: 1800,
      slope: "moyenne",
      demolition: false,
    });
    setContactData({
      fullName: "",
      email: "",
      phone: "",
      city: "Blainville",
      message: "",
    });
    setSubmissionResponse(null);
    setCurrentStep(1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const progressPercentage = currentStep === 1 ? 33 : currentStep === 2 ? 66 : 100;

  const stepsMeta = [
    { number: 1, title: "Le projet", icon: ClipboardList },
    { number: 2, title: "L'estimation", icon: Calculator },
    { number: 3, title: "Coordonnées", icon: UserCheck },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Barre d'étapes (masquée sur l'écran de confirmation) */}
      {currentStep < 4 && (
        <div className="space-y-3 bg-card border border-border rounded-2xl p-4 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-semibold">
            <span>Étape {currentStep} sur 3</span>
            <span className="flex items-center gap-1 text-primary">
              <Sparkles className="h-3.5 w-3.5" /> Estimation en direct Rive-Nord
            </span>
          </div>

          <Progress value={progressPercentage} className="h-2" />

          <div className="grid grid-cols-3 gap-2 pt-2">
            {stepsMeta.map((s) => {
              const Icon = s.icon;
              const isCompleted = currentStep > s.number;
              const isCurrent = currentStep === s.number;

              return (
                <button
                  key={s.number}
                  type="button"
                  disabled={!isCompleted && !isCurrent}
                  onClick={() => {
                    if (isCompleted) {
                      setCurrentStep(s.number as 1 | 2 | 3);
                    }
                  }}
                  className={`flex items-center gap-2 text-left transition-all ${
                    isCompleted ? "cursor-pointer opacity-90 hover:opacity-100" : ""
                  } ${isCurrent ? "font-bold text-primary" : "text-muted-foreground"}`}
                >
                  <div
                    className={`flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all ${
                      isCompleted
                        ? "bg-primary text-primary-foreground"
                        : isCurrent
                        ? "bg-primary/20 text-primary ring-2 ring-primary"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {isCompleted ? <Check className="h-4 w-4" /> : s.number}
                  </div>
                  <div className="hidden sm:block">
                    <span className="text-xs font-semibold block leading-tight">{s.title}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Contenu de l'étape active */}
      <Card className="border border-border bg-card shadow-lg rounded-2xl overflow-hidden">
        <CardContent className="p-5 sm:p-8">
          {currentStep === 1 && (
            <StepProject
              data={projectData}
              onChange={handleProjectDataChange}
              onNext={handleGoToStep2}
              errors={step1Errors}
            />
          )}

          {currentStep === 2 && (
            <StepEstimate
              project={projectData}
              estimate={estimate}
              onNext={handleGoToStep3}
              onPrev={() => setCurrentStep(1)}
            />
          )}

          {currentStep === 3 && (
            <StepContact
              data={contactData}
              project={projectData}
              estimate={estimate}
              onChange={handleContactDataChange}
              onSubmit={handleFinalSubmit}
              onPrev={() => setCurrentStep(2)}
              isSubmitting={submitLeadMutation.isPending}
              serverError={submitLeadMutation.error?.message || null}
            />
          )}

          {currentStep === 4 && submissionResponse && (
            <StepConfirmation
              project={projectData}
              estimate={estimate}
              contact={contactData}
              response={submissionResponse}
              onReset={handleReset}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
