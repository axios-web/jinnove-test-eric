-- Migration: 20261003000000_create_leads_table.sql
-- Description: Table des soumissions de toiture pour Toitures Boréal (Rive-Nord)

CREATE TABLE IF NOT EXISTS public.leads (
    id TEXT PRIMARY KEY,
    reference_number TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    city TEXT NOT NULL,
    message TEXT,
    project_type TEXT NOT NULL CHECK (project_type IN ('remplacement_complet', 'reparation', 'nouvelle_construction')),
    material TEXT NOT NULL CHECK (material IN ('bardeaux_asphalte', 'tole', 'membrane_elastomere')),
    surface_sqft INTEGER NOT NULL CHECK (surface_sqft >= 300 AND surface_sqft <= 10000),
    slope TEXT NOT NULL CHECK (slope IN ('faible', 'moyenne', 'forte')),
    demolition BOOLEAN NOT NULL DEFAULT false,
    subtotal NUMERIC(12, 2) NOT NULL,
    range_min NUMERIC(12, 2) NOT NULL,
    range_max NUMERIC(12, 2) NOT NULL,
    tps NUMERIC(12, 2) NOT NULL,
    tvq NUMERIC(12, 2) NOT NULL,
    total_with_taxes NUMERIC(12, 2) NOT NULL,
    crm_status TEXT NOT NULL DEFAULT 'pending' CHECK (crm_status IN ('pending', 'sent', 'failed')),
    crm_response JSONB,
    status TEXT NOT NULL DEFAULT 'nouveau' CHECK (status IN ('nouveau', 'en_traitement', 'contacte', 'qualifie', 'perdu')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Index pour accélérer les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON public.leads (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_project_type ON public.leads (project_type);
CREATE INDEX IF NOT EXISTS idx_leads_crm_status ON public.leads (crm_status);
CREATE INDEX IF NOT EXISTS idx_leads_reference_number ON public.leads (reference_number);

-- Activer Row Level Security
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Politiques RLS
-- 1. Permettre l'insertion publique (soumissions anonymes depuis l'estimateur)
CREATE POLICY "Allow public insert to leads"
    ON public.leads
    FOR INSERT
    TO public
    WITH CHECK (true);

-- 2. Permettre la lecture (pour le dashboard admin et consultation)
CREATE POLICY "Allow select from leads"
    ON public.leads
    FOR SELECT
    TO public
    USING (true);

-- 3. Permettre la mise à jour (ex: modification de statut ou re-tentative CRM)
CREATE POLICY "Allow update to leads"
    ON public.leads
    FOR UPDATE
    TO public
    USING (true)
    WITH CHECK (true);

-- Fonction et trigger pour mise à jour automatique de updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_leads_updated_at ON public.leads;
CREATE TRIGGER trigger_set_leads_updated_at
    BEFORE UPDATE ON public.leads
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();
