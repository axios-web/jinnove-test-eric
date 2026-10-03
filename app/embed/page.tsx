import React from "react";
import { EstimatorContainer } from "@/components/estimator/estimator-container";
import { EmbedResizer } from "@/components/embed/embed-resizer";

export const metadata = {
  title: "Estimateur en Ligne (Intégré) | Toitures Boréal",
  robots: {
    index: false,
    follow: false,
  },
};

export default function EmbedPage() {
  return (
    <div id="boreal-embed-root" className="w-full min-h-screen bg-background py-4 px-2 sm:px-4">
      <EmbedResizer />
      <div className="max-w-4xl mx-auto">
        <EstimatorContainer />
      </div>
    </div>
  );
}
