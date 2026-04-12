"use client";

import { useEffect } from "react";

export function PWARegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    const handleControllerChange = () => {
      window.location.reload();
    };

    const registerServiceWorker = async () => {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js");

        if (registration.waiting) {
          registration.waiting.postMessage({ type: "SKIP_WAITING" });
        }

        registration.addEventListener("updatefound", () => {
          const installing = registration.installing;
          if (!installing) return;

          installing.addEventListener("statechange", () => {
            if (installing.state === "installed" && navigator.serviceWorker.controller) {
              registration.waiting?.postMessage({ type: "SKIP_WAITING" });
            }
          });
        });

        void registration.update();
      } catch (error) {
        console.error("Service worker registration failed", error);
      }
    };

    navigator.serviceWorker.addEventListener("controllerchange", handleControllerChange);
    void registerServiceWorker();

    return () => {
      navigator.serviceWorker.removeEventListener("controllerchange", handleControllerChange);
    };
  }, []);

  return null;
}
