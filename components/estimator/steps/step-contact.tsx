"use client";

import React, { useState } from "react";
import { ContactStepData, ProjectStepData, EstimateBreakdown } from "@/lib/types/estimator";
import { contactStepSchema } from "@/lib/validations/estimator";
import { formatCurrencyCAD } from "@/lib/pricing";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  User,
  Mail,
  Phone,
  MapPin,
  MessageSquare,
  ArrowLeft,
  Send,
  Loader2,
  Lock,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";

interface StepContactProps {
  data: ContactStepData;
  project: ProjectStepData;
  estimate: EstimateBreakdown;
  onChange: (data: Partial<ContactStepData>) => void;
  onSubmit: () => void;
  onPrev: () => void;
  isSubmitting: boolean;
  serverError?: string | null;
}

const RIVE_NORD_CITIES = [
  "Laval",
  "Blainville",
  "Saint-Jérôme",
  "Terrebonne",
  "Mirabel",
  "Sainte-Thérèse",
  "Boisbriand",
  "Saint-Eustache",
  "Rosemère",
  "Repentigny",
  "Mascouche",
  "Deux-Montagnes",
];

export function StepContact({
  data,
  project,
  estimate,
  onChange,
  onSubmit,
  onPrev,
  isSubmitting,
  serverError,
}: StepContactProps) {
  const [clientErrors, setClientErrors] = useState<Record<string, string>>({});

  const handleFieldChange = (field: keyof ContactStepData, value: string) => {
    onChange({ [field]: value });
    if (clientErrors[field]) {
      setClientErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleSubmitAttempt = (e: React.FormEvent) => {
    e.preventDefault();
    const result = contactStepSchema.safeParse(data);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        if (issue.path[0]) {
          fieldErrors[issue.path[0] as string] = issue.message;
        }
      });
      setClientErrors(fieldErrors);
      return;
    }
    setClientErrors({});
    onSubmit();
  };

  return (
    <form onSubmit={handleSubmitAttempt} className="space-y-8 animate-in fade-in-50 duration-300">
      {/* Entête */}
      <div className="border-b border-border pb-4">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
            3
          </span>
          <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            Vos coordonnées pour la soumission officielle
          </h2>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Laissez vos coordonnées pour recevoir votre estimation détaillée par courriel et bloquer votre tarif.
        </p>
      </div>

      {serverError && (
        <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 p-4 sm:p-5 text-sm text-foreground space-y-3 animate-in fade-in-50 duration-200">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="h-4 w-4" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-amber-900 dark:text-amber-200">
                Notice concernant votre demande
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                {serverError}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 pt-1 border-t border-amber-500/20 text-xs">
            <span className="text-muted-foreground">Assistance directe :</span>
            <a
              href="tel:4505558648"
              className="font-bold text-primary hover:underline inline-flex items-center gap-1"
            >
              <Phone className="h-3 w-3" /> (450) 555-TOIT (8648)
            </a>
          </div>
        </div>
      )}

      {/* Rappel compact de l'estimation */}
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <CheckCircle className="h-5 w-5" />
          </div>
          <div>
            <span className="text-xs font-semibold text-muted-foreground uppercase block">Estimation réservée</span>
            <span className="text-sm font-bold text-foreground">
              {project.surfaceSqFt.toLocaleString("fr-CA")} pi² • {project.material === "bardeaux_asphalte" ? "Bardeaux d'asphalte" : project.material === "tole" ? "Tôle métallique" : "Membrane élastomère"}
            </span>
          </div>
        </div>
        <div className="sm:text-right">
          <span className="text-xs text-muted-foreground block">Total estimé (TTC)</span>
          <span className="text-lg sm:text-xl font-black text-primary">
            {formatCurrencyCAD(estimate.totalWithTaxes)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {/* Nom complet */}
        <div className="space-y-2">
          <Label htmlFor="fullName" className="text-sm font-semibold flex items-center gap-1.5">
            <User className="h-4 w-4 text-muted-foreground" />
            Nom complet <span className="text-destructive">*</span>
          </Label>
          <Input
            id="fullName"
            placeholder="Ex : Jean Tremblay"
            value={data.fullName}
            onChange={(e) => handleFieldChange("fullName", e.target.value)}
            className={clientErrors.fullName ? "border-destructive focus-visible:ring-destructive" : ""}
          />
          {clientErrors.fullName && (
            <p className="text-xs text-destructive font-medium">{clientErrors.fullName}</p>
          )}
        </div>

        {/* Courriel */}
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-semibold flex items-center gap-1.5">
            <Mail className="h-4 w-4 text-muted-foreground" />
            Adresse courriel <span className="text-destructive">*</span>
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="jean.tremblay@exemple.ca"
            value={data.email}
            onChange={(e) => handleFieldChange("email", e.target.value)}
            className={clientErrors.email ? "border-destructive focus-visible:ring-destructive" : ""}
          />
          {clientErrors.email && (
            <p className="text-xs text-destructive font-medium">{clientErrors.email}</p>
          )}
        </div>

        {/* Téléphone */}
        <div className="space-y-2">
          <Label htmlFor="phone" className="text-sm font-semibold flex items-center gap-1.5">
            <Phone className="h-4 w-4 text-muted-foreground" />
            Numéro de téléphone <span className="text-destructive">*</span>
          </Label>
          <Input
            id="phone"
            type="tel"
            placeholder="450 555-0123"
            value={data.phone}
            onChange={(e) => handleFieldChange("phone", e.target.value)}
            className={clientErrors.phone ? "border-destructive focus-visible:ring-destructive" : ""}
          />
          {clientErrors.phone && (
            <p className="text-xs text-destructive font-medium">{clientErrors.phone}</p>
          )}
        </div>

        {/* Ville */}
        <div className="space-y-2">
          <Label htmlFor="city" className="text-sm font-semibold flex items-center gap-1.5">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            Ville (Rive-Nord) <span className="text-destructive">*</span>
          </Label>
          <Input
            id="city"
            placeholder="Ex : Blainville, Laval, Saint-Jérôme..."
            value={data.city}
            onChange={(e) => handleFieldChange("city", e.target.value)}
            className={clientErrors.city ? "border-destructive focus-visible:ring-destructive" : ""}
          />
          {clientErrors.city && (
            <p className="text-xs text-destructive font-medium">{clientErrors.city}</p>
          )}

          {/* Suggestions rapides de municipalités Rive-Nord */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {RIVE_NORD_CITIES.slice(0, 6).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => handleFieldChange("city", c)}
                className={`text-[11px] px-2 py-0.5 rounded-full border transition-colors ${
                  data.city.toLowerCase() === c.toLowerCase()
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-muted/60 text-muted-foreground border-border hover:bg-muted hover:text-foreground"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Message facultatif */}
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="message" className="text-sm font-semibold flex items-center gap-1.5">
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
            Détails ou questions spécifiques <span className="text-xs text-muted-foreground font-normal">(facultatif)</span>
          </Label>
          <Textarea
            id="message"
            placeholder="Ex : Problème d'infiltration près de la cheminée, lucarne existante, disponibilité souhaitée pour le début des travaux..."
            rows={3}
            value={data.message || ""}
            onChange={(e) => handleFieldChange("message", e.target.value)}
            className={clientErrors.message ? "border-destructive focus-visible:ring-destructive" : ""}
          />
          {clientErrors.message && (
            <p className="text-xs text-destructive font-medium">{clientErrors.message}</p>
          )}
        </div>
      </div>

      {/* Engagement de confidentialité */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/40 p-3 rounded-lg border border-border/50">
        <Lock className="h-4 w-4 text-primary shrink-0" />
        <span>
          Vos renseignements demeurent strictement confidentiels et sont uniquement utilisés pour la production de votre devis Toitures Boréal. Aucun pourriel.
        </span>
      </div>

      {/* Boutons d'action - Mobile First Responsive */}
      <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4 border-t border-border">
        <Button
          type="button"
          variant="outline"
          onClick={onPrev}
          size="lg"
          disabled={isSubmitting}
          className="w-full sm:w-auto gap-2 justify-center"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Retour à l&apos;estimation</span>
        </Button>
        <Button
          type="submit"
          size="lg"
          disabled={isSubmitting}
          className="w-full sm:w-auto gap-2 font-bold shadow-md hover:shadow-lg bg-primary text-primary-foreground justify-center"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Transmission en cours...</span>
            </>
          ) : (
            <>
              <span>Transmettre ma demande</span>
              <Send className="h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
