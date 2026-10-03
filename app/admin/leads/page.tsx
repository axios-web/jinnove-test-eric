"use client";

import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  LeadRecord,
  ProjectType,
  MaterialType,
} from "@/lib/types/estimator";
import { formatCurrencyCAD } from "@/lib/pricing";
import { createClient } from "@/lib/supabase/client";
import {
  Search,
  Filter,
  RefreshCw,
  Eye,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Phone,
  Mail,
  MapPin,
  Layers,
  FileSpreadsheet,
  TrendingUp,
  Send,
  Building2,
  HardHat,
  Home,
  Check,
} from "lucide-react";

const PROJECT_TYPE_LABELS: Record<ProjectType, { label: string; badgeClass: string }> = {
  remplacement_complet: {
    label: "Remplacement complet",
    badgeClass: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800",
  },
  reparation: {
    label: "Réparation",
    badgeClass: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800",
  },
  nouvelle_construction: {
    label: "Nouvelle construction",
    badgeClass: "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800",
  },
};

const MATERIAL_LABELS: Record<MaterialType, string> = {
  bardeaux_asphalte: "Bardeaux d'asphalte",
  tole: "Tôle métallique",
  membrane_elastomere: "Membrane élastomère",
};

/**
 * Récupère les leads DIRECTEMENT depuis la base de données Supabase (table 'leads').
 * Ne dépend en aucun cas du webhook externe (qui n'est qu'un flux sortant vers le CRM).
 */
async function fetchLeads(): Promise<LeadRecord[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.warn("Requête Supabase client direct en erreur, repli sur l'API Supabase serveur :", error);
    // Repli de secours via l'API interne qui interroge Supabase avec service_role
    const res = await fetch("/api/leads");
    if (!res.ok) {
      throw new Error(`Erreur lors de la récupération depuis Supabase : ${error.message}`);
    }
    const apiData = await res.json();
    return apiData.leads || [];
  }

  return (data as LeadRecord[]) || [];
}

async function retryCrmSync(leadId: string): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`/api/leads/${leadId}/retry-crm`, {
    method: "POST",
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || "Échec de la relance CRM.");
  }
  return data;
}

export default function AdminLeadsPage() {
  const queryClient = useQueryClient();
  const [selectedProjectType, setSelectedProjectType] = useState<string>("all");
  const [selectedCrmStatus, setSelectedCrmStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedLead, setSelectedLead] = useState<LeadRecord | null>(null);

  const {
    data: leads = [],
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery<LeadRecord[]>({
    queryKey: ["admin-leads"],
    queryFn: fetchLeads,
    refetchInterval: 30000, // Rafraîchissement automatique toutes les 30s
  });

  const retryMutation = useMutation({
    mutationFn: retryCrmSync,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-leads"] });
    },
  });

  // Filtrage combiné : type de projet, recherche textuelle et statut CRM
  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      // 1. Filtre par type de projet
      if (selectedProjectType !== "all" && lead.project_type !== selectedProjectType) {
        return false;
      }
      // 2. Filtre par statut CRM
      if (selectedCrmStatus !== "all" && lead.crm_status !== selectedCrmStatus) {
        return false;
      }
      // 3. Recherche textuelle
      if (searchQuery.trim() !== "") {
        const query = searchQuery.toLowerCase();
        const matches =
          lead.reference_number.toLowerCase().includes(query) ||
          lead.full_name.toLowerCase().includes(query) ||
          lead.email.toLowerCase().includes(query) ||
          lead.phone.toLowerCase().includes(query) ||
          lead.city.toLowerCase().includes(query);
        if (!matches) return false;
      }
      return true;
    });
  }, [leads, selectedProjectType, selectedCrmStatus, searchQuery]);

  // Statistiques calculées
  const stats = useMemo(() => {
    const totalCount = leads.length;
    const totalVolume = leads.reduce((acc, lead) => acc + Number(lead.total_with_taxes || 0), 0);
    const crmSentCount = leads.filter((l) => l.crm_status === "sent").length;
    const crmFailedCount = leads.filter((l) => l.crm_status === "failed").length;
    const avgSurface =
      totalCount > 0
        ? Math.round(leads.reduce((acc, l) => acc + Number(l.surface_sqft || 0), 0) / totalCount)
        : 0;

    return {
      totalCount,
      totalVolume,
      crmSentCount,
      crmFailedCount,
      crmSuccessRate: totalCount > 0 ? Math.round((crmSentCount / totalCount) * 100) : 100,
      avgSurface,
    };
  }, [leads]);

  const handleRetryCrm = (leadId: string) => {
    retryMutation.mutate(leadId);
  };

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col">
      {/* Header Admin */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              title="Retour au site public"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-black tracking-tight text-foreground uppercase">
                  Toitures <span className="text-primary font-light">Boréal</span>
                </span>
                <Badge variant="secondary" className="text-[10px] uppercase font-bold tracking-wider">
                  Admin
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground hidden sm:block">
                Tableau de bord des soumissions • Rive-Nord
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
              className="gap-1.5 text-xs font-medium"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin text-primary" : ""}`} />
              <span className="hidden sm:inline">Actualiser</span>
            </Button>
            <Link
              href="/"
              className={cn(
                buttonVariants({ size: "sm" }),
                "gap-1.5 text-xs font-semibold bg-primary text-primary-foreground"
              )}
            >
              <Home className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Nouvelle soumission</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Contenu Principal */}
      <main className="flex-1 mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Titre & Description */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
              Gestion des Leads & Soumissions
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Données récupérées en direct depuis votre base de données Supabase (table <code className="bg-muted px-1.5 py-0.5 rounded text-xs text-foreground font-mono">public.leads</code>).
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-background px-3 py-1.5 rounded-lg border border-border shadow-xs self-start sm:self-auto">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-medium text-foreground">Supabase PostgreSQL (table leads)</span>
          </div>
        </div>

        {/* 4 Cartes KPI / Statistiques */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-border bg-card shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Total des Leads
              </CardTitle>
              <FileSpreadsheet className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black text-foreground">{stats.totalCount}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Soumissions enregistrées
              </p>
            </CardContent>
          </Card>

          <Card className="border-border bg-card shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Volume Estimé (TTC)
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black text-primary">
                {formatCurrencyCAD(stats.totalVolume)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Taxes québécoises incluses
              </p>
            </CardContent>
          </Card>

          <Card className="border-border bg-card shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Synchronisation CRM
              </CardTitle>
              <Send className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-foreground">{stats.crmSuccessRate}%</span>
                <span className="text-xs text-muted-foreground">({stats.crmSentCount}/{stats.totalCount})</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.crmFailedCount > 0 ? (
                  <span className="text-amber-600 dark:text-amber-400 font-semibold">
                    {stats.crmFailedCount} à relancer
                  </span>
                ) : (
                  "Tous synchronisés avec succès"
                )}
              </p>
            </CardContent>
          </Card>

          <Card className="border-border bg-card shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Superficie Moyenne
              </CardTitle>
              <Layers className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black text-foreground">
                {stats.avgSurface.toLocaleString("fr-CA")}{" "}
                <span className="text-sm font-normal text-muted-foreground">pi²</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Toiture résidentielle type Rive-Nord
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Barre de Filtres et Recherche */}
        <Card className="border-border bg-card shadow-xs">
          <CardContent className="p-4 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              {/* Filtre par type de projet (Demandé explicitement) */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Filter className="h-3.5 w-3.5 text-primary" />
                  Filtrer par type de projet :
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { id: "all", label: "Tous les projets" },
                    { id: "remplacement_complet", label: "Remplacement" },
                    { id: "reparation", label: "Réparation" },
                    { id: "nouvelle_construction", label: "Neuf" },
                  ].map((btn) => (
                    <button
                      key={btn.id}
                      type="button"
                      onClick={() => setSelectedProjectType(btn.id)}
                      className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors border ${
                        selectedProjectType === btn.id
                          ? "bg-primary text-primary-foreground border-primary shadow-xs"
                          : "bg-muted/40 text-muted-foreground border-border hover:bg-muted hover:text-foreground"
                      }`}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Filtre par statut CRM & Recherche */}
              <div className="flex flex-wrap items-center gap-3">
                {/* Sélecteur CRM */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                    Statut CRM :
                  </label>
                  <select
                    value={selectedCrmStatus}
                    aria-label="Statut CRM"
                    onChange={(e) => setSelectedCrmStatus(e.target.value)}
                    className="h-8 text-xs rounded-lg border border-border bg-background px-2.5 py-1 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="all">Tous les statuts CRM</option>
                    <option value="sent">Synchronisé (Succès)</option>
                    <option value="failed">Échec de transmission</option>
                    <option value="pending">En attente</option>
                  </select>
                </div>

                {/* Champ de recherche */}
                <div className="space-y-1.5 flex-1 min-w-[220px]">
                  <label htmlFor="search-leads-input" className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                    Rechercher un lead :
                  </label>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="search-leads-input"
                      placeholder="Nom, téléphone, ville, réf..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="h-8 pl-8 text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* État des filtres actifs */}
            {(selectedProjectType !== "all" || selectedCrmStatus !== "all" || searchQuery.trim() !== "") && (
              <div className="flex items-center justify-between pt-2 border-t border-border/60 text-xs text-muted-foreground">
                <span>
                  Affichage de <strong className="text-foreground">{filteredLeads.length}</strong> lead(s) sur{" "}
                  <strong>{leads.length}</strong> au total
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedProjectType("all");
                    setSelectedCrmStatus("all");
                    setSearchQuery("");
                  }}
                  className="text-primary hover:underline font-semibold"
                >
                  Réinitialiser les filtres
                </button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tableau des Leads */}
        <Card className="border-border bg-card shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center space-y-3">
              <RefreshCw className="h-8 w-8 animate-spin text-primary mx-auto" />
              <p className="text-sm font-semibold text-muted-foreground">
                Chargement des soumissions depuis Supabase...
              </p>
            </div>
          ) : isError ? (
            <div className="p-12 text-center space-y-3">
              <AlertTriangle className="h-8 w-8 text-destructive mx-auto" />
              <h3 className="font-bold text-foreground">Erreur de chargement</h3>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                {(error as Error)?.message || "Impossible de contacter l'API Supabase."}
              </p>
              <Button size="sm" variant="outline" onClick={() => refetch()}>
                Réessayer
              </Button>
            </div>
          ) : filteredLeads.length === 0 ? (
            <div className="p-12 text-center space-y-4">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
                <FileSpreadsheet className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-base text-foreground">Aucun lead trouvé</h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  {leads.length === 0
                    ? "Aucune demande de soumission n'a encore été enregistrée dans la base."
                    : "Aucun lead ne correspond aux filtres actuels."}
                </p>
              </div>
              {leads.length === 0 ? (
                <Link
                  href="/"
                  className={cn(
                    buttonVariants({ size: "sm" }),
                    "bg-primary text-primary-foreground font-semibold"
                  )}
                >
                  Simuler une première soumission
                </Link>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSelectedProjectType("all");
                    setSelectedCrmStatus("all");
                    setSearchQuery("");
                  }}
                >
                  Effacer les filtres
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30 hover:bg-muted/30">
                    <TableHead className="w-[140px] text-xs font-bold uppercase">Référence</TableHead>
                    <TableHead className="text-xs font-bold uppercase">Client</TableHead>
                    <TableHead className="text-xs font-bold uppercase">Projet & Matériau</TableHead>
                    <TableHead className="text-xs font-bold uppercase text-right">Superficie</TableHead>
                    <TableHead className="text-xs font-bold uppercase text-right">Estimation TTC</TableHead>
                    <TableHead className="text-xs font-bold uppercase text-center">Statut CRM</TableHead>
                    <TableHead className="w-[80px] text-xs font-bold uppercase text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLeads.map((lead) => {
                    const projectMeta = PROJECT_TYPE_LABELS[lead.project_type] || {
                      label: lead.project_type,
                      badgeClass: "bg-muted text-muted-foreground",
                    };
                    const dateObj = new Date(lead.created_at);
                    const formattedDate = dateObj.toLocaleDateString("fr-CA", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    });
                    const formattedTime = dateObj.toLocaleTimeString("fr-CA", {
                      hour: "2-digit",
                      minute: "2-digit",
                    });

                    return (
                      <TableRow key={lead.id} className="hover:bg-muted/40 transition-colors">
                        {/* Réf & Date */}
                        <TableCell className="font-mono text-xs">
                          <span className="font-bold text-foreground block">{lead.reference_number}</span>
                          <span className="text-[11px] text-muted-foreground flex items-center gap-1 pt-0.5">
                            <Clock className="h-3 w-3" /> {formattedDate} {formattedTime}
                          </span>
                        </TableCell>

                        {/* Coordonnées Client */}
                        <TableCell>
                          <div className="space-y-0.5">
                            <span className="font-bold text-foreground text-xs block">
                              {lead.full_name}
                            </span>
                            <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3 text-primary" /> {lead.city}
                              </span>
                              <span>•</span>
                              <a
                                href={`tel:${lead.phone}`}
                                className="hover:text-primary hover:underline flex items-center gap-1"
                              >
                                <Phone className="h-3 w-3" /> {lead.phone}
                              </a>
                            </div>
                          </div>
                        </TableCell>

                        {/* Type & Matériau */}
                        <TableCell>
                          <div className="space-y-1">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${projectMeta.badgeClass}`}
                            >
                              {projectMeta.label}
                            </span>
                            <span className="text-[11px] text-muted-foreground block">
                              {MATERIAL_LABELS[lead.material] || lead.material}
                            </span>
                          </div>
                        </TableCell>

                        {/* Superficie */}
                        <TableCell className="text-right">
                          <span className="font-bold text-xs text-foreground block">
                            {lead.surface_sqft.toLocaleString("fr-CA")} pi²
                          </span>
                          <span className="text-[10px] text-muted-foreground capitalize">
                            Pente {lead.slope}
                            {lead.demolition ? " • Dépose" : ""}
                          </span>
                        </TableCell>

                        {/* Estimation TTC */}
                        <TableCell className="text-right">
                          <span className="font-black text-sm text-primary block">
                            {formatCurrencyCAD(lead.total_with_taxes)}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            Sous-total : {formatCurrencyCAD(lead.subtotal)}
                          </span>
                        </TableCell>

                        {/* Statut CRM */}
                        <TableCell className="text-center">
                          {lead.crm_status === "sent" ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                              <CheckCircle2 className="h-3 w-3" /> Synchronisé
                            </span>
                          ) : lead.crm_status === "failed" ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-destructive/10 text-destructive border border-destructive/20">
                              <AlertTriangle className="h-3 w-3" /> Échec webhook
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                              <Clock className="h-3 w-3" /> En attente
                            </span>
                          )}
                        </TableCell>

                        {/* Actions */}
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedLead(lead)}
                            className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary"
                            title="Voir les détails complets du devis"
                          >
                            <Eye className="h-4 w-4" />
                            <span className="sr-only">Voir</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>
      </main>

      {/* Modal / Dialog de détails complets d'un lead */}
      {selectedLead && (
        <Dialog open={Boolean(selectedLead)} onOpenChange={(open) => !open && setSelectedLead(null)}>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader className="border-b border-border pb-3">
              <div className="flex items-center justify-between pr-6">
                <div>
                  <div className="flex items-center gap-2">
                    <DialogTitle className="text-lg font-bold">
                      Fiche Devis #{selectedLead.reference_number}
                    </DialogTitle>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        PROJECT_TYPE_LABELS[selectedLead.project_type]?.badgeClass || "bg-muted"
                      }`}
                    >
                      {PROJECT_TYPE_LABELS[selectedLead.project_type]?.label}
                    </span>
                  </div>
                  <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                    Reçu le {new Date(selectedLead.created_at).toLocaleString("fr-CA")}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-5 py-2">
              {/* 1. Coordonnées Contact */}
              <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5 text-primary" /> Coordonnées du prospect
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-muted-foreground block">Nom complet :</span>
                    <strong className="text-sm text-foreground">{selectedLead.full_name}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Ville (Rive-Nord) :</span>
                    <strong className="text-sm text-foreground">{selectedLead.city}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Téléphone :</span>
                    <a
                      href={`tel:${selectedLead.phone}`}
                      className="text-primary hover:underline font-bold inline-flex items-center gap-1"
                    >
                      <Phone className="h-3 w-3" /> {selectedLead.phone}
                    </a>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Courriel :</span>
                    <a
                      href={`mailto:${selectedLead.email}`}
                      className="text-primary hover:underline font-bold inline-flex items-center gap-1"
                    >
                      <Mail className="h-3 w-3" /> {selectedLead.email}
                    </a>
                  </div>
                </div>

                {selectedLead.message && (
                  <div className="pt-2 border-t border-border/60 text-xs">
                    <span className="text-muted-foreground block mb-1">Message ou note spécifique :</span>
                    <p className="bg-background p-2.5 rounded-lg border border-border text-foreground italic">
                      &quot;{selectedLead.message}&quot;
                    </p>
                  </div>
                )}
              </div>

              {/* 2. Spécifications du chantier */}
              <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <HardHat className="h-3.5 w-3.5 text-primary" /> Caractéristiques techniques de la toiture
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="bg-background p-2.5 rounded-lg border border-border">
                    <span className="text-muted-foreground text-[11px] block">Matériau</span>
                    <strong className="text-foreground block truncate">
                      {MATERIAL_LABELS[selectedLead.material]}
                    </strong>
                  </div>
                  <div className="bg-background p-2.5 rounded-lg border border-border">
                    <span className="text-muted-foreground text-[11px] block">Superficie</span>
                    <strong className="text-foreground block">
                      {selectedLead.surface_sqft.toLocaleString("fr-CA")} pi²
                    </strong>
                  </div>
                  <div className="bg-background p-2.5 rounded-lg border border-border">
                    <span className="text-muted-foreground text-[11px] block">Pente</span>
                    <strong className="text-foreground block capitalize">
                      {selectedLead.slope}
                    </strong>
                  </div>
                  <div className="bg-background p-2.5 rounded-lg border border-border">
                    <span className="text-muted-foreground text-[11px] block">Démolition</span>
                    <strong className="text-foreground block">
                      {selectedLead.demolition ? "Oui (1,75 $/pi²)" : "Non (0 $)"}
                    </strong>
                  </div>
                </div>
              </div>

              {/* 3. Décomposition Financière (Calculateur Autoritaire) */}
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center justify-between">
                  <span>Décomposition financière vérifiée</span>
                  <span>Taux Québec en vigueur</span>
                </h4>

                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Sous-total HT :</span>
                    <span className="font-semibold text-foreground">
                      {formatCurrencyCAD(selectedLead.subtotal)}
                    </span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Fourchette estimative (± 10 %) :</span>
                    <span className="font-mono text-foreground">
                      {formatCurrencyCAD(selectedLead.range_min)} — {formatCurrencyCAD(selectedLead.range_max)}
                    </span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>TPS (5,00 %) :</span>
                    <span className="font-mono text-foreground">{formatCurrencyCAD(selectedLead.tps)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>TVQ (9,975 %) :</span>
                    <span className="font-mono text-foreground">{formatCurrencyCAD(selectedLead.tvq)}</span>
                  </div>
                  <div className="pt-2 border-t border-primary/20 flex justify-between items-center text-sm">
                    <span className="font-bold text-foreground">Total officiel estimé (TTC) :</span>
                    <span className="text-lg font-black text-primary">
                      {formatCurrencyCAD(selectedLead.total_with_taxes)}
                    </span>
                  </div>
                </div>
              </div>

              {/* 4. Statut Webhook CRM */}
              <div className="rounded-xl border border-border p-4 bg-background text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-muted-foreground uppercase tracking-wider text-[11px]">
                    État de synchronisation CRM
                  </span>
                  {selectedLead.crm_status === "sent" ? (
                    <Badge variant="outline" className="border-emerald-500 text-emerald-600 font-semibold gap-1">
                      <Check className="h-3 w-3" /> Transmis avec succès
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="font-semibold gap-1">
                      <AlertTriangle className="h-3 w-3" /> Échec de synchronisation
                    </Badge>
                  )}
                </div>

                {selectedLead.crm_status === "failed" && (
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-muted-foreground">
                      Le webhook CRM n&apos;a pas répondu lors de la soumission.
                    </span>
                    <Button
                      size="sm"
                      onClick={() => handleRetryCrm(selectedLead.id)}
                      disabled={retryMutation.isPending}
                      className="gap-1.5 text-xs bg-primary text-primary-foreground font-semibold"
                    >
                      <RefreshCw className={`h-3 w-3 ${retryMutation.isPending ? "animate-spin" : ""}`} />
                      Relancer le webhook
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-border">
              <Button variant="outline" onClick={() => setSelectedLead(null)}>
                Fermer
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
