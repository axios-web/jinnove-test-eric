"use client";

import React, { useEffect } from "react";

export function EmbedResizer() {
  useEffect(() => {
    // Only execute if running inside an iframe
    if (typeof window === "undefined" || window.self === window.top) {
      return;
    }

    const notifyHeight = () => {
      try {
        const bodyHeight = document.body.scrollHeight;
        const htmlHeight = document.documentElement.scrollHeight;
        const currentHeight = Math.max(bodyHeight, htmlHeight, document.getElementById("boreal-embed-root")?.scrollHeight || 0);

        window.parent.postMessage(
          {
            type: "BOREAL_RESIZE",
            height: currentHeight,
          },
          "*"
        );
      } catch (err) {
        console.warn("Could not dispatch BOREAL_RESIZE message to parent window:", err);
      }
    };

    // Initial notifications
    notifyHeight();
    const timeout1 = setTimeout(notifyHeight, 100);
    const timeout2 = setTimeout(notifyHeight, 400);
    const timeout3 = setTimeout(notifyHeight, 1000);

    // ResizeObserver on body and root
    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(() => {
        notifyHeight();
      });
      observer.observe(document.body);
      const rootEl = document.getElementById("boreal-embed-root");
      if (rootEl) observer.observe(rootEl);
    }

    // MutationObserver to catch any DOM expansion (error messages, tooltips, accordion)
    const mutationObserver = new MutationObserver(() => {
      notifyHeight();
    });
    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
    });

    window.addEventListener("resize", notifyHeight);

    return () => {
      clearTimeout(timeout1);
      clearTimeout(timeout2);
      clearTimeout(timeout3);
      observer?.disconnect();
      mutationObserver.disconnect();
      window.removeEventListener("resize", notifyHeight);
    };
  }, []);

  return null;
}
