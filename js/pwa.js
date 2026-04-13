let deferredPrompt = null;

window.addEventListener("DOMContentLoaded", () => {
  const installBtn = document.getElementById("installBtn");

  if (installBtn) {
    installBtn.style.display = "none";
  }

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("service-worker.js")
        .then((registration) => {
          console.log("Service Worker registered:", registration.scope);
        })
        .catch((error) => {
          console.log("Service Worker registration failed:", error);
        });
    });
  }

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredPrompt = event;

    if (installBtn) {
      installBtn.style.display = "inline-flex";
    }
  });

  if (installBtn) {
    installBtn.addEventListener("click", async () => {
      if (!deferredPrompt) return;

      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;

      if (choiceResult.outcome === "accepted") {
        console.log("User installed the app");
      } else {
        console.log("User dismissed the install prompt");
      }

      deferredPrompt = null;
      installBtn.style.display = "none";
    });
  }

  window.addEventListener("appinstalled", () => {
    console.log("App installed");
    if (installBtn) {
      installBtn.style.display = "none";
    }
  });
});
