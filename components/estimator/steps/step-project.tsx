"use client";

import React from "react";
import { ProjectStepData, ProjectType, MaterialType, SlopeType } from "@/lib/types/estimator";
import { MATERIAL_PRICING, PROJECT_TYPE_CONFIG, SLOPE_CONFIG } from "@/lib/pricing";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Hammer,
  Wrench,
  Building2,
  Layers,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  HelpCircle,
  TrendingUp,
  Trash2,
} from "lucide-react";

interface StepProjectProps {
  data: ProjectStepData;
  onChange: (data: Partial<ProjectStepData>) => void;
  onNext: () => void;
  errors?: Record<string, string>;
}

export function StepProject({ data, onChange, onNext, errors }: StepProjectProps) {
  const isDemolitionAllowed = PROJECT_TYPE_CONFIG[data.projectType].allowDemolition;

  const handleProjectTypeChange = (type: ProjectType) => {
    const allowsDemolition = PROJECT_TYPE_CONFIG[type].allowDemolition;
    onChange({
      projectType: type,
      // Reset demolition if the new project type does not allow it
      demolition: allowsDemolition ? data.demolition : false,
    });
  };

  const handleSurfaceChange = (value: number) => {
    const clamped = Math.max(300, Math.min(10000, isNaN(value) ? 300 : value));
    onChange({ surfaceSqFt: clamped });
  };

  const quickSurfacePresets = [800, 1200, 1800, 2500, 3500];

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-300">
      {/* Introduction */}
      <div className="border-b border-border pb-4">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
            1
          </span>
          <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            Caractéristiques de votre toiture
          </h2>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Précisez les spécificités de votre bâtiment sur la Rive-Nord pour obtenir un calcul sur-mesure.
        </p>
      </div>

      {/* 1. Type de projet */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-semibold text-foreground">
            1. Type de projet <span className="text-destructive">*</span>
          </Label>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {(
            [
              {
                id: "remplacement_complet",
                icon: Hammer,
                label: "Remplacement complet",
                badge: "Le plus fréquent",
                desc: "Réfection intégrale de la toiture existante",
              },
              {
                id: "reparation",
                icon: Wrench,
                label: "Réparation ciblée",
                badge: null,
                desc: "Remplacement de bardeaux ou zone endommagée",
              },
              {
                id: "nouvelle_construction",
                icon: Building2,
                label: "Nouvelle construction",
                badge: null,
                desc: "Structure neuve prête pour première toiture",
              },
            ] as const
          ).map((item) => {
            const isSelected = data.projectType === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleProjectTypeChange(item.id)}
                className={`relative flex flex-col items-start p-4 text-left rounded-xl border-2 transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? "border-primary bg-primary/5 ring-2 ring-primary/20 shadow-sm"
                    : "border-border bg-card hover:border-primary/40 hover:bg-muted/40"
                }`}
              >
                {item.badge && (
                  <Badge variant="secondary" className="mb-2 text-[10px] font-semibold tracking-wide uppercase">
                    {item.badge}
                  </Badge>
                )}
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                      isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="font-semibold text-foreground text-sm block">{item.label}</span>
                  </div>
                </div>
                <p className="mt-2 text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
              </button>
            );
          })}
        </div>
        {errors?.projectType && <p className="text-xs text-destructive font-medium">{errors.projectType}</p>}
      </div>

      {/* 2. Choix du matériau */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-semibold text-foreground">
            2. Matériau désiré <span className="text-destructive">*</span>
          </Label>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {(
            [
              {
                id: "bardeaux_asphalte",
                icon: Layers,
                label: MATERIAL_PRICING.bardeaux_asphalte.name,
                badge: "Rapport qualité/prix",
                desc: MATERIAL_PRICING.bardeaux_asphalte.description,
              },
              {
                id: "tole",
                icon: ShieldCheck,
                label: MATERIAL_PRICING.tole.name,
                badge: "Durabilité 50 ans+",
                desc: MATERIAL_PRICING.tole.description,
              },
              {
                id: "membrane_elastomere",
                icon: Sparkles,
                label: MATERIAL_PRICING.membrane_elastomere.name,
                badge: "Toits plats & faibles",
                desc: MATERIAL_PRICING.membrane_elastomere.description,
              },
            ] as const
          ).map((mat) => {
            const isSelected = data.material === mat.id;
            const Icon = mat.icon;
            return (
              <button
                key={mat.id}
                type="button"
                onClick={() => onChange({ material: mat.id })}
                className={`relative flex flex-col justify-between p-4 text-left rounded-xl border-2 transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? "border-primary bg-primary/5 ring-2 ring-primary/20 shadow-sm"
                    : "border-border bg-card hover:border-primary/40 hover:bg-muted/40"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <Badge
                      variant={isSelected ? "default" : "outline"}
                      className="text-[10px] font-semibold tracking-wide"
                    >
                      {mat.badge}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                        isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="font-semibold text-foreground text-sm">{mat.label}</span>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground leading-relaxed">{mat.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
        {errors?.material && <p className="text-xs text-destructive font-medium">{errors.material}</p>}
      </div>

      {/* 3. Superficie en pieds carrés (300 à 10 000 pi²) */}
      <div className="space-y-4 rounded-xl border border-border bg-card p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Label htmlFor="surfaceInput" className="text-sm font-semibold text-foreground">
              3. Superficie estimée du toit <span className="text-destructive">*</span>
            </Label>
            <p className="text-xs text-muted-foreground">
              La superficie d&apos;une toiture est généralement 10 % à 20 % plus grande que l&apos;empreinte au sol.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Input
              id="surfaceInput"
              type="number"
              min={300}
              max={10000}
              step={50}
              value={data.surfaceSqFt}
              onChange={(e) => handleSurfaceChange(parseInt(e.target.value, 10))}
              className="h-10 w-28 text-right font-bold text-base"
            />
            <span className="text-sm font-semibold text-muted-foreground">pi²</span>
          </div>
        </div>

        {/* Slider */}
        <div className="pt-2 px-1">
          <Slider
            value={[data.surfaceSqFt]}
            min={300}
            max={10000}
            step={50}
            onValueChange={(vals) => {
              if (Array.isArray(vals) && typeof vals[0] === "number") {
                handleSurfaceChange(vals[0]);
              } else if (typeof vals === "number") {
                handleSurfaceChange(vals);
              }
            }}
            className="w-full"
          />
          <div className="mt-2 flex justify-between text-[11px] text-muted-foreground font-medium">
            <span>300 pi² (Cabanon/Garage)</span>
            <span>2 000 pi² (Maison moyenne)</span>
            <span>10 000 pi² (Grand domaine/Commercial)</span>
          </div>
        </div>

        {/* Presets rapides */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-border/50">
          <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
            <TrendingUp className="h-3 w-3" /> Exemples fréquents :
          </span>
          {quickSurfacePresets.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => handleSurfaceChange(preset)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                data.surfaceSqFt === preset
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
              }`}
            >
              {preset.toLocaleString("fr-CA")} pi²
            </button>
          ))}
        </div>
        {errors?.surfaceSqFt && <p className="text-xs text-destructive font-medium">{errors.surfaceSqFt}</p>}
      </div>

      {/* 4. Pente du toit */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-semibold text-foreground">
            4. Inclinaison / Pente du toit <span className="text-destructive">*</span>
          </Label>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {(["faible", "moyenne", "forte"] as const).map((slopeKey) => {
            const isSelected = data.slope === slopeKey;
            const slope = SLOPE_CONFIG[slopeKey];
            return (
              <button
                key={slopeKey}
                type="button"
                onClick={() => onChange({ slope: slopeKey })}
                className={`p-4 rounded-xl border-2 text-left transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? "border-primary bg-primary/5 ring-2 ring-primary/20 shadow-sm"
                    : "border-border bg-card hover:border-primary/40 hover:bg-muted/40"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-sm text-foreground">{slope.name}</span>
                  <Badge variant={isSelected ? "default" : "outline"} className="text-[11px] font-mono">
                    {slope.ratioLabel}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{slope.description}</p>
              </button>
            );
          })}
        </div>
        {errors?.slope && <p className="text-xs text-destructive font-medium">{errors.slope}</p>}
      </div>

      {/* 5. Option Démolition de l'ancien toit (disponible seulement pour remplacement complet) */}
      <div
        className={`rounded-xl border p-4 transition-all duration-200 ${
          isDemolitionAllowed
            ? "border-border bg-card shadow-sm"
            : "border-dashed border-border/60 bg-muted/30 opacity-70"
        }`}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Trash2 className="h-4 w-4 text-primary" />
              <Label
                htmlFor="demolitionSwitch"
                className={`text-sm font-semibold ${isDemolitionAllowed ? "text-foreground cursor-pointer" : "text-muted-foreground"}`}
              >
                Démolition et disposition de l&apos;ancienne toiture
              </Label>
              {isDemolitionAllowed && (
                <Badge variant="outline" className="text-[10px] text-emerald-600 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800">
                  Écologique & Recyclé
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground max-w-xl">
              Arrachage complet des anciens bardeaux/matériaux, transport en conteneur sécurisé et recyclage certifié des résidus de chantier.
            </p>
            {!isDemolitionAllowed && (
              <p className="text-xs font-medium text-amber-600 dark:text-amber-400 pt-1 flex items-center gap-1">
                <HelpCircle className="h-3.5 w-3.5 inline" /> Cette option s&apos;applique uniquement pour un{" "}
                <strong>remplacement complet</strong>.
              </p>
            )}
          </div>
          <Switch
            id="demolitionSwitch"
            disabled={!isDemolitionAllowed}
            checked={isDemolitionAllowed && data.demolition}
            onCheckedChange={(checked) => onChange({ demolition: checked })}
          />
        </div>
      </div>

      {/* Bouton pour passer à l'étape 2 */}
      <div className="pt-4 flex justify-end">
        <Button
          type="button"
          onClick={onNext}
          size="lg"
          className="w-full sm:w-auto font-semibold gap-2 shadow-md hover:shadow-lg transition-all"
        >
          Calculer l&apos;estimation instantanée
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
