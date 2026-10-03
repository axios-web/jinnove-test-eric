"use client";

import { useEffect } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { AlertCircle, RefreshCw, Home, Phone } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Erreur capturée par l'ErrorBoundary de l'application :", error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full rounded-2xl border border-destructive/20 bg-card p-6 sm:p-8 shadow-xl text-center space-y-5">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
          <AlertCircle className="h-8 w-8" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            Une interruption est survenue
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {error.message ||
              "Nous avons rencontré un problème inattendu lors du traitement. Rassurez-vous, nos équipes sont mobilisées."}
          </p>
        </div>

        <div className="rounded-xl bg-muted/50 p-4 border border-border text-xs text-muted-foreground space-y-1">
          <p className="font-semibold text-foreground">Besoin d&apos;aide immédiate ?</p>
          <p>Contactez directement un maître-couvreur Toitures Boréal :</p>
          <a
            href="tel:4505558648"
            className="inline-flex items-center gap-1.5 font-bold text-primary hover:underline pt-1 text-sm"
          >
            <Phone className="h-3.5 w-3.5" /> (450) 555-TOIT (8648)
          </a>
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
          <Button
            variant="outline"
            onClick={() => reset()}
            className="flex-1 gap-2 border-border hover:bg-muted"
          >
            <RefreshCw className="h-4 w-4" />
            Réessayer
          </Button>
          <Link
            href="/"
            className={cn(
              buttonVariants(),
              "flex-1 gap-2 bg-primary text-primary-foreground justify-center"
            )}
          >
            <Home className="h-4 w-4" />
            <span>Retour à l&apos;accueil</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
