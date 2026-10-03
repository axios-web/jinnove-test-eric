"use client";

import React from "react";
import {
  ProjectStepData,
  EstimateBreakdown,
  ContactStepData,
  LeadSubmissionResponse,
} from "@/lib/types/estimator";
import {
  formatCurrencyCAD,
  MATERIAL_PRICING,
  PROJECT_TYPE_CONFIG,
  SLOPE_CONFIG,
} from "@/lib/pricing";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  CheckCircle2,
  Calendar,
  Phone,
  Printer,
  RotateCcw,
  ShieldCheck,
  MapPin,
  Clock,
  Mail,
  User,
} from "lucide-react";

interface StepConfirmationProps {
  project: ProjectStepData;
  estimate: EstimateBreakdown;
  contact: ContactStepData;
  response: LeadSubmissionResponse;
  onReset: () => void;
}

export function StepConfirmation({
  project,
  estimate,
  contact,
  response,
  onReset,
}: StepConfirmationProps) {
  const material = MATERIAL_PRICING[project.material];
  const projectType = PROJECT_TYPE_CONFIG[project.projectType];
  const slope = SLOPE_CONFIG[project.slope];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-8 animate-in zoom-in-95 duration-400">
      {/* Bannière de confirmation */}
      <div className="text-center space-y-3 py-4">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 mb-2">
          <CheckCircle2 className="h-10 w-10" />
        </div>
        <Badge
          variant="outline"
          className="border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-semibold px-3 py-1"
        >
          Soumission transmise au CRM
        </Badge>
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
          Merci {contact.fullName} ! Votre demande a été reçue.
        </h2>
        <p className="text-sm sm:text-base text-muted-foreground max-w-xl mx-auto">
          Votre estimation a été transmise directement à notre équipe technique de la Rive-Nord. Un maître-couvreur étudiera votre dossier sous 24h ouvrables.
        </p>
      </div>

      {/* Numéro de référence */}
      <div className="rounded-xl border border-primary/20 bg-card p-5 text-center shadow-sm">
        <span className="text-xs uppercase tracking-wider font-bold text-muted-foreground block mb-1">
          Numéro de référence de votre dossier
        </span>
        <span className="text-2xl sm:text-3xl font-mono font-black text-primary tracking-wider">
          {response.referenceNumber}
        </span>
        <p className="text-xs text-muted-foreground mt-1">
          Un courriel de confirmation récapitulatif a été expédié à <strong>{contact.email}</strong>.
        </p>
      </div>

      {/* Détails du devis & des coordonnées */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Synthèse Estimation */}
        <Card className="border border-border bg-card shadow-sm">
          <CardHeader className="pb-3 border-b border-border/60">
            <CardTitle className="text-sm font-bold text-foreground flex items-center justify-between">
              <span>Synthèse de l&apos;estimation</span>
              <Badge variant="secondary" className="font-mono text-xs">
                Taxes incluses
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-3 text-xs">
            <div className="flex justify-between py-1 border-b border-border/40">
              <span className="text-muted-foreground">Type de projet :</span>
              <span className="font-semibold text-foreground">{projectType.name}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-border/40">
              <span className="text-muted-foreground">Matériau :</span>
              <span className="font-semibold text-foreground">{material.name}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-border/40">
              <span className="text-muted-foreground">Superficie :</span>
              <span className="font-semibold text-foreground font-mono">
                {project.surfaceSqFt.toLocaleString("fr-CA")} pi²
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-border/40">
              <span className="text-muted-foreground">Pente :</span>
              <span className="font-semibold text-foreground">
                {slope.name} ({slope.ratioLabel})
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-border/40">
              <span className="text-muted-foreground">Démolition ancien toit :</span>
              <span className="font-semibold text-foreground">
                {project.demolition ? "Oui (incluse)" : "Non requise"}
              </span>
            </div>

            <div className="pt-2">
              <div className="flex justify-between text-muted-foreground py-0.5">
                <span>Sous-total estimé :</span>
                <span className="font-medium text-foreground">{formatCurrencyCAD(estimate.subtotal)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground py-0.5">
                <span>TPS (5%) + TVQ (9.975%) :</span>
                <span className="font-medium text-foreground">{formatCurrencyCAD(estimate.tps + estimate.tvq)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-foreground pt-2 border-t border-border mt-1">
                <span>Total estimé TTC :</span>
                <span className="text-primary text-base font-extrabold">
                  {formatCurrencyCAD(estimate.totalWithTaxes)}
                </span>
              </div>
              <div className="text-[11px] text-muted-foreground text-right mt-0.5">
                Fourchette : {formatCurrencyCAD(estimate.totalRangeMinWithTaxes)} – {formatCurrencyCAD(estimate.totalRangeMaxWithTaxes)}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Coordonnées & Prochaines étapes */}
        <div className="space-y-6">
          <Card className="border border-border bg-card shadow-sm">
            <CardHeader className="pb-3 border-b border-border/60">
              <CardTitle className="text-sm font-bold text-foreground">
                Coordonnées transmises
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-2 text-xs">
              <div className="flex items-center gap-2 text-foreground font-medium">
                <User className="h-4 w-4 text-primary" /> {contact.fullName}
              </div>
              <div className="flex items-center gap-2 text-foreground font-medium">
                <Mail className="h-4 w-4 text-primary" /> {contact.email}
              </div>
              <div className="flex items-center gap-2 text-foreground font-medium">
                <Phone className="h-4 w-4 text-primary" /> {contact.phone}
              </div>
              <div className="flex items-center gap-2 text-foreground font-medium">
                <MapPin className="h-4 w-4 text-primary" /> {contact.city} (Rive-Nord)
              </div>
              {contact.message && (
                <div className="mt-2 pt-2 border-t border-border/40 text-muted-foreground italic">
                  &laquo; {contact.message} &raquo;
                </div>
              )}
            </CardContent>
          </Card>

          {/* Étapes suivantes */}
          <div className="rounded-xl border border-border bg-muted/40 p-4 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" /> Prochaines étapes
            </h4>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary font-bold text-[10px]">
                  1
                </span>
                <span>Vérification technique des paramètres par un estimateur certifié.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary font-bold text-[10px]">
                  2
                </span>
                <span>Contact téléphonique pour valider vos besoins et planifier une visite sans frais si souhaité.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary font-bold text-[10px]">
                  3
                </span>
                <span>Émission du contrat officiel avec garantie complète Toitures Boréal.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Boutons d'actions */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-border">
        <Button
          type="button"
          variant="outline"
          onClick={onReset}
          className="w-full sm:w-auto gap-2"
        >
          <RotateCcw className="h-4 w-4" />
          Faire une nouvelle estimation
        </Button>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Button
            type="button"
            variant="secondary"
            onClick={handlePrint}
            className="w-full sm:w-auto gap-2"
          >
            <Printer className="h-4 w-4" />
            Imprimer / PDF
          </Button>
          <a
            href="tel:4505558648"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow hover:bg-primary/90 w-full sm:w-auto"
          >
            <Phone className="h-4 w-4" />
            Appeler Toitures Boréal
          </a>
        </div>
      </div>
    </div>
  );
}
