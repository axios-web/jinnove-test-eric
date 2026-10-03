import {
  ProjectStepData,
  EstimateBreakdown,
  ProjectType,
  MaterialType,
  SlopeType,
} from './types/estimator';

/**
 * Taux de taxes en vigueur au Québec
 */
export const TPS_RATE = 0.05; // 5.00 %
export const TVQ_RATE = 0.09975; // 9.975 %
export const RANGE_MIN_FACTOR = 0.90; // -10%
export const RANGE_MAX_FACTOR = 1.10; // +10%
export const MINIMUM_SUBTOTAL = 750; // Sous-total minimum = 750 $
export const DEMOLITION_COST_PER_SQFT = 1.75; // 1,75 $/pi²

/**
 * Taux par matériau ($/pi²)
 */
export const MATERIAL_PRICING: Record<
  MaterialType,
  { name: string; basePricePerSqFt: number; description: string }
> = {
  bardeaux_asphalte: {
    name: "Bardeaux d'asphalte",
    basePricePerSqFt: 6.50, // 6,50 $/pi²
    description: "Solution classique, durable et économique. Garantie jusqu'à 30 ans.",
  },
  tole: {
    name: "Tôle",
    basePricePerSqFt: 11.00, // 11,00 $/pi²
    description: "Durabilité exceptionnelle (50+ ans), résistance extrême aux intempéries boréales.",
  },
  membrane_elastomere: {
    name: "Membrane élastomère",
    basePricePerSqFt: 9.00, // 9,00 $/pi²
    description: "Idéal pour toits plats ou à faible pente. Étanchéité bicouche supérieure.",
  },
};

/**
 * Facteurs par type de projet
 */
export const PROJECT_TYPE_CONFIG: Record<
  ProjectType,
  { name: string; multiplier: number; allowDemolition: boolean; description: string }
> = {
  remplacement_complet: {
    name: "Remplacement complet",
    multiplier: 1.00, // × 1,00
    allowDemolition: true,
    description: "Réfection intégrale de la toiture avec dépose et nouvelle pose.",
  },
  reparation: {
    name: "Réparation",
    multiplier: 0.35, // × 0,35
    allowDemolition: false,
    description: "Intervention sur une zone spécifique ou réfection partielle.",
  },
  nouvelle_construction: {
    name: "Nouvelle construction",
    multiplier: 0.90, // × 0,90
    allowDemolition: false,
    description: "Installation neuve sur structure sans ancienne toiture à retirer.",
  },
};

/**
 * Multiplicateurs de pente
 */
export const SLOPE_CONFIG: Record<
  SlopeType,
  { name: string; multiplier: number; ratioLabel: string; description: string }
> = {
  faible: {
    name: "Faible",
    multiplier: 1.00, // × 1,00
    ratioLabel: "≤ 4/12",
    description: "Toits plats ou pente très douce.",
  },
  moyenne: {
    name: "Moyenne",
    multiplier: 1.15, // × 1,15
    ratioLabel: "5/12 à 8/12",
    description: "Pente résidentielle standard au Québec.",
  },
  forte: {
    name: "Forte",
    multiplier: 1.35, // × 1,35
    ratioLabel: "≥ 9/12",
    description: "Forte inclinaison nécessitant des équipements de sécurité accrus.",
  },
};

/**
 * Arrondi au cent supérieur ou standard le plus proche (2 décimales)
 */
export function roundToCent(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * Fonction pure de calcul d'estimation de toiture.
 *
 * Formule :
 * 1. base = superficie × taux du matériau × multiplicateur de pente
 * 2. démolition = superficie × 1,75 $ (si cochée et projet = remplacement complet, sinon 0)
 * 3. sous-total = (base + démolition) × facteur du type de projet
 * 4. sous-total minimum = 750 $
 * 5. fourchette = sous-total × 0,90 à sous-total × 1,10
 * 6. TPS = 5 % du sous-total
 * 7. TVQ = 9,975 % du sous-total
 * 8. total = sous-total + TPS + TVQ
 *
 * Utilisable à la fois par le front-end et par l'API serveur.
 */
export function calculateRoofingEstimate(data: ProjectStepData): EstimateBreakdown {
  const surface = Math.max(300, Math.min(10000, Number(data.surfaceSqFt) || 1500));

  const materialMeta = MATERIAL_PRICING[data.material] || MATERIAL_PRICING.bardeaux_asphalte;
  const projectMeta = PROJECT_TYPE_CONFIG[data.projectType] || PROJECT_TYPE_CONFIG.remplacement_complet;
  const slopeMeta = SLOPE_CONFIG[data.slope] || SLOPE_CONFIG.moyenne;

  // 1. base = superficie × taux du matériau × multiplicateur de pente
  const base = surface * materialMeta.basePricePerSqFt * slopeMeta.multiplier;

  // 2. démolition = superficie × 1,75 $ (si cochée et projet = remplacement complet, sinon 0)
  const isDemolitionActive = Boolean(data.demolition && projectMeta.allowDemolition);
  const demolition = isDemolitionActive ? surface * DEMOLITION_COST_PER_SQFT : 0;

  // 3. sous-total = (base + démolition) × facteur du type de projet
  const calculatedSubtotal = (base + demolition) * projectMeta.multiplier;

  // 4. sous-total minimum = 750 $
  const subtotal = roundToCent(Math.max(MINIMUM_SUBTOTAL, calculatedSubtotal));

  // 5. fourchette = sous-total × 0,90 à sous-total × 1,10
  const rangeMin = roundToCent(subtotal * RANGE_MIN_FACTOR);
  const rangeMax = roundToCent(subtotal * RANGE_MAX_FACTOR);

  // 6. TPS = 5 % du sous-total
  const tps = roundToCent(subtotal * TPS_RATE);

  // 7. TVQ = 9,975 % du sous-total
  const tvq = roundToCent(subtotal * TVQ_RATE);

  // 8. total = sous-total + TPS + TVQ
  const totalWithTaxes = roundToCent(subtotal + tps + tvq);

  // Totaux des fourchettes taxes incluses
  const totalRangeMinWithTaxes = roundToCent(
    rangeMin + roundToCent(rangeMin * TPS_RATE) + roundToCent(rangeMin * TVQ_RATE)
  );
  const totalRangeMaxWithTaxes = roundToCent(
    rangeMax + roundToCent(rangeMax * TPS_RATE) + roundToCent(rangeMax * TVQ_RATE)
  );

  return {
    materialBasePricePerSqFt: materialMeta.basePricePerSqFt,
    demolitionCostPerSqFt: isDemolitionActive ? DEMOLITION_COST_PER_SQFT : 0,
    surfaceSqFt: surface,
    slopeMultiplier: slopeMeta.multiplier,
    projectTypeMultiplier: projectMeta.multiplier,
    subtotal,
    rangeMin,
    rangeMax,
    tps,
    tvq,
    totalWithTaxes,
    totalRangeMinWithTaxes,
    totalRangeMaxWithTaxes,
  };
}

/**
 * Formateur de devises au format québécois (ex. : 13 837,50 $)
 */
export function formatCurrencyCAD(amount: number): string {
  return new Intl.NumberFormat('fr-CA', {
    style: 'currency',
    currency: 'CAD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
