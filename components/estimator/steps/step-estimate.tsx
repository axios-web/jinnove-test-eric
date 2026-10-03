"use client";

import React from "react";
import { ProjectStepData, EstimateBreakdown } from "@/lib/types/estimator";
import { formatCurrencyCAD } from "@/lib/pricing";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Sparkles,
  MapPin,
} from "lucide-react";

interface StepEstimateProps {
  project: ProjectStepData;
  estimate: EstimateBreakdown;
  onNext: () => void;
  onPrev: () => void;
}

export function StepEstimate({ estimate, onNext, onPrev }: StepEstimateProps) {
  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in-50 duration-300">
      {/* Entête Étape 2 */}
      <div className="border-b border-border pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground shrink-0">
              2
            </span>
            <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              Votre estimation personnalisée
            </h2>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Estimation calculée en temps réel selon les barèmes de l&apos;APCHQ et les normes de la Rive-Nord.
          </p>
        </div>
        <Badge
          variant="secondary"
          className="self-start sm:self-auto bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20 px-3 py-1 font-medium gap-1"
        >
          <Sparkles className="h-3.5 w-3.5" /> Calcul instantané garanti
        </Badge>
      </div>

      {/* Bloc principal de prix & Taxes */}
      <div className="max-w-2xl mx-auto space-y-6">
        <Card className="border-2 border-primary/20 bg-gradient-to-br from-card via-card to-primary/5 shadow-md overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
          <CardHeader className="pb-3 border-b border-border/60">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Estimation Toitures Boréal
              </span>
              <Badge variant="outline" className="font-mono text-xs">
                Prix 2026
              </Badge>
            </div>
            <CardTitle className="text-sm font-medium text-muted-foreground mt-1">
              Total estimé taxes incluses
            </CardTitle>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
                {formatCurrencyCAD(estimate.totalWithTaxes)}
              </span>
              <span className="text-xs font-semibold text-muted-foreground">CAD</span>
            </div>
          </CardHeader>

          <CardContent className="pt-5 space-y-5">
            {/* Fourchette de prix ±10% */}
            <div className="rounded-lg bg-muted/60 p-4 border border-border/50">
              <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground mb-1.5">
                <span>Fourchette de prix prévisionnelle (±10 %)</span>
                <span className="text-foreground font-bold">Marge réaliste</span>
              </div>
              <div className="flex flex-wrap items-center justify-between font-bold text-sm sm:text-base text-foreground gap-1">
                <span className="text-primary">{formatCurrencyCAD(estimate.totalRangeMinWithTaxes)}</span>
                <span className="text-xs font-normal text-muted-foreground px-1">à</span>
                <span className="text-primary">{formatCurrencyCAD(estimate.totalRangeMaxWithTaxes)}</span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-2 leading-relaxed">
                Permet de prévoir les variations selon l&apos;accessibilité du terrain et l&apos;état précis du pontage.
              </p>
            </div>

            {/* Décomposition détaillée des montants et taxes */}
            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between items-center py-1">
                <span className="text-muted-foreground">Sous-total (avant taxes)</span>
                <span className="font-semibold text-foreground">{formatCurrencyCAD(estimate.subtotal)}</span>
              </div>
              <div className="flex justify-between items-center py-1 text-xs">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  TPS (5.000 %)
                </span>
                <span className="font-mono text-foreground">{formatCurrencyCAD(estimate.tps)}</span>
              </div>
              <div className="flex justify-between items-center py-1 text-xs">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  TVQ (9.975 %)
                </span>
                <span className="font-mono text-foreground">{formatCurrencyCAD(estimate.tvq)}</span>
              </div>
              <Separator />
              <div className="flex justify-between items-center pt-1 font-bold text-base">
                <span className="text-foreground">Total tout inclus</span>
                <span className="text-foreground font-extrabold">{formatCurrencyCAD(estimate.totalWithTaxes)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Gages de confiance */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex items-start gap-3 rounded-lg border border-border bg-card p-3.5">
            <ShieldCheck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div className="text-xs">
              <strong className="font-semibold text-foreground block">Garantie 15 ans</strong>
              <span className="text-muted-foreground">Sur la main-d&apos;œuvre et étanchéité certifiée RBQ.</span>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-lg border border-border bg-card p-3.5">
            <MapPin className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div className="text-xs">
              <strong className="font-semibold text-foreground block">Service Rive-Nord</strong>
              <span className="text-muted-foreground">Équipes locales sans frais de déplacement additionnels.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Boutons - Mobile First Responsive */}
      <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4 border-t border-border">
        <Button
          type="button"
          variant="outline"
          onClick={onPrev}
          size="lg"
          className="w-full sm:w-auto gap-2 justify-center"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Modifier le projet</span>
        </Button>
        <Button
          type="button"
          onClick={onNext}
          size="lg"
          className="w-full sm:w-auto gap-2 font-semibold justify-center shadow-sm"
        >
          <span>Continuer vers mes coordonnées</span>
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
