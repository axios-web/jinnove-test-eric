import React from "react";
import Link from "next/link";
import { MapPin, Phone, Mail, Award, Check } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="w-full border-t border-border bg-card/60 mt-16 text-muted-foreground text-xs">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 space-y-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-4">
          {/* Col 1 */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-foreground uppercase tracking-wider">
              Toitures Boréal
            </h4>
            <p className="leading-relaxed">
              Votre référence en réfection et installation de toitures résidentielles et commerciales sur l&apos;ensemble de la Rive-Nord de Montréal.
            </p>
            <div className="flex items-center gap-1.5 text-foreground font-semibold">
              <Award className="h-4 w-4 text-emerald-500" />
              <span>Licence RBQ certifiée</span>
            </div>
          </div>

          {/* Col 2 */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-foreground uppercase tracking-wider">
              Territoires desservis
            </h4>
            <ul className="space-y-1.5">
              <li>Laval & Boisbriand</li>
              <li>Blainville & Sainte-Thérèse</li>
              <li>Saint-Jérôme & Mirabel</li>
              <li>Terrebonne & Mascouche</li>
              <li>Saint-Eustache & Deux-Montagnes</li>
            </ul>
          </div>

          {/* Col 3 */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-foreground uppercase tracking-wider">
              Garanties & Engagements
            </h4>
            <ul className="space-y-1.5">
              <li className="flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-emerald-500" /> Garantie main-d&apos;œuvre 15 ans
              </li>
              <li className="flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-emerald-500" /> Estimation gratuite sans engagement
              </li>
              <li className="flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-emerald-500" /> Nettoyage complet du terrain
              </li>
              <li className="flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-emerald-500" /> Assurance responsabilité civile
              </li>
            </ul>
          </div>

          {/* Col 4 */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-foreground uppercase tracking-wider">
              Contactez-nous
            </h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-primary" />
                <span className="font-semibold text-foreground">(450) 555-TOIT (8648)</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary" />
                <span>estimation@toituresboreal.ca</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                <span>Rive-Nord, QC, Canada</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-border/60 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <p>© {new Date().getFullYear()} Toitures Boréal. Tous droits réservés.</p>
          <div className="flex items-center gap-4 text-[11px]">
            <span>Estimateur de soumission en ligne rapide &bull; Rive-Nord</span>
            <span>&bull;</span>
            <Link href="/admin/leads" className="text-primary hover:underline font-semibold">
              Portail Administrateur
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
