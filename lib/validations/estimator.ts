import { z } from "zod";

export const projectStepSchema = z.object({
  projectType: z.enum(["remplacement_complet", "reparation", "nouvelle_construction"], {
    message: "Veuillez sélectionner un type de projet.",
  }),
  material: z.enum(["bardeaux_asphalte", "tole", "membrane_elastomere"], {
    message: "Veuillez sélectionner un matériau.",
  }),
  surfaceSqFt: z
    .number({ message: "Veuillez indiquer une superficie numérique valide." })
    .min(300, { message: "La superficie minimale est de 300 pi²." })
    .max(10000, { message: "La superficie maximale pour l'estimateur en ligne est de 10 000 pi²." }),
  slope: z.enum(["faible", "moyenne", "forte"], {
    message: "Veuillez sélectionner la pente de votre toit.",
  }),
  demolition: z.boolean().default(false),
});

export const phoneRegex = /^(\+?1[-.\s]?)?(\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}$/;

export const contactStepSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, { message: "Veuillez inscrire votre nom complet (au moins 2 caractères)." })
    .max(100, { message: "Le nom ne doit pas dépasser 100 caractères." }),
  email: z
    .string()
    .trim()
    .email({ message: "Veuillez entrer une adresse courriel valide (ex: nom@domaine.ca)." }),
  phone: z
    .string()
    .trim()
    .min(10, { message: "Veuillez indiquer un numéro de téléphone valide (10 chiffres)." })
    .refine((val) => phoneRegex.test(val.replace(/\s+/g, "")), {
      message: "Format de numéro invalide. Exemples : 450 555-0123 ou (450) 555-0123.",
    }),
  city: z
    .string()
    .trim()
    .min(2, { message: "Veuillez préciser votre ville ou municipalité sur la Rive-Nord." })
    .max(80, { message: "Le nom de la ville est trop long." }),
  message: z
    .string()
    .trim()
    .max(1000, { message: "Votre message ne peut pas dépasser 1000 caractères." })
    .optional()
    .or(z.literal("")),
});

export const leadSubmissionSchema = z.object({
  project: projectStepSchema,
  estimate: z.object({
    materialBasePricePerSqFt: z.number(),
    demolitionCostPerSqFt: z.number(),
    surfaceSqFt: z.number(),
    slopeMultiplier: z.number(),
    projectTypeMultiplier: z.number(),
    subtotal: z.number(),
    rangeMin: z.number(),
    rangeMax: z.number(),
    tps: z.number(),
    tvq: z.number(),
    totalWithTaxes: z.number(),
    totalRangeMinWithTaxes: z.number(),
    totalRangeMaxWithTaxes: z.number(),
  }),
  contact: contactStepSchema,
});

export type ProjectStepFormValues = z.infer<typeof projectStepSchema>;
export type ContactStepFormValues = z.infer<typeof contactStepSchema>;
export type LeadSubmissionFormValues = z.infer<typeof leadSubmissionSchema>;
