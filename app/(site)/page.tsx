import React from "react";
import { EstimatorContainer } from "@/components/estimator/estimator-container";
import { ShieldCheck, Clock, Award, CheckCircle2, Sparkles, MapPin } from "lucide-react";

export default function Home() {
  return (
    <main className="flex-1">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-muted/50 via-background to-background py-8 sm:py-12 border-b border-border/40">
        <div className="absolute inset-0 bg-grid-black/[0.02] dark:bg-grid-white/[0.02] pointer-events-none" />
        <div className="mx-auto max-w-5xl px-4 sm:px-6 text-center space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary">
            <Sparkles className="h-3.5 w-3.5 text-emerald-500" />
            <span>Outil d&apos;estimation en direct • Rive-Nord de Montréal</span>
          </div>

          <h1 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl lg:text-5xl max-w-3xl mx-auto leading-tight">
            Estimez le coût de votre toiture en{" "}
            <span className="text-primary underline decoration-primary/30 decoration-wavy underline-offset-4">
              moins de 2 minutes
            </span>
          </h1>

          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Configurez votre toiture, obtenez une fourchette de prix instantanée avec taxes québécoises (TPS/TVQ) et recevez votre soumission officielle sans aucun engagement.
          </p>

          {/* Micro badges d'autorité */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2 text-xs font-medium text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-500" /> Garantie 15 ans main-d&apos;œuvre
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-emerald-500" /> Réponse sous 24h
            </span>
            <span className="flex items-center gap-1.5">
              <Award className="h-4 w-4 text-emerald-500" /> Licence RBQ certifiée
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-emerald-500" /> 100% Rive-Nord
            </span>
          </div>
        </div>
      </section>

      {/* Estimator Multi-Step Form Section */}
      <section className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
        <EstimatorContainer />
      </section>

      {/* Pourquoi faire confiance à Toitures Boréal */}
      <section className="border-t border-border/80 bg-muted/20 py-12">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="text-center space-y-2 mb-8">
            <h3 className="text-lg sm:text-xl font-bold text-foreground">
              Pourquoi choisir Toitures Boréal sur la Rive-Nord ?
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-xl mx-auto">
              Nous combinons expertise artisanale, matériaux nordiques certifiés et transparence tarifaire complète.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 text-xs sm:text-sm">
            <div className="rounded-xl border border-border bg-card p-5 space-y-2.5 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <h4 className="font-bold text-foreground">Estimation claire sans surprise</h4>
              <p className="text-muted-foreground leading-relaxed">
                Nos calculs intègrent la démolition, la main-d&apos;œuvre, la disposition écologique et les taxes en vigueur au Québec.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-card p-5 space-y-2.5 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h4 className="font-bold text-foreground">Matériaux haute résistance</h4>
              <p className="text-muted-foreground leading-relaxed">
                Bardeaux d&apos;asphalte de qualité supérieure, tôle résistante au gel/dégel et membranes élastomères certifiées.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-card p-5 space-y-2.5 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Award className="h-5 w-5" />
              </div>
              <h4 className="font-bold text-foreground">Maîtres-couvreurs qualifiés</h4>
              <p className="text-muted-foreground leading-relaxed">
                Des équipes formées aux normes les plus rigoureuses de sécurité, avec inspection minutieuse de l&apos;étanchéité.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
