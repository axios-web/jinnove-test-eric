"use client";

import React from "react";
import Link from "next/link";
import { Phone, Compass } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/80 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        {/* Logo & Slogan */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <Compass className="h-6 w-6 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-black tracking-tight text-foreground uppercase">
                Toitures <span className="text-primary font-light">Boréal</span>
              </span>
              <Badge
                variant="outline"
                className="hidden sm:inline-flex text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
              >
                Rive-Nord
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground hidden sm:block">
              Maître-couvreur certifié • Résidentiel & Commercial
            </p>
          </div>
        </div>

        {/* Contact rapide & CTA */}
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="hidden md:flex flex-col text-right text-xs">
            <span className="text-muted-foreground">Urgence ou question ?</span>
            <span className="font-bold text-foreground">Service 7j/7</span>
          </div>
          <Link
            href="/admin/leads"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted transition-colors"
          >
            <span>Admin Leads</span>
          </Link>
          <a
            href="tel:4505558648"
            className="inline-flex items-center gap-2 rounded-lg bg-primary/10 px-3.5 py-2 text-xs sm:text-sm font-bold text-primary hover:bg-primary/20 transition-colors"
          >
            <Phone className="h-4 w-4 text-primary" />
            <span className="hidden sm:inline">(450) 555-TOIT</span>
            <span className="sm:hidden">Appeler</span>
          </a>
        </div>
      </div>
    </header>
  );
}
