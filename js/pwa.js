let deferredPrompt = null;

function showInstallButton() {
  const installBtn = document.getElementById("installBtn");

  if (installBtn && deferredPrompt) {
    installBtn.style.display = "inline-flex";
  }
}

function hideInstallButton() {
  const installBtn = document.getElementById("installBtn");

  if (installBtn) {
    installBtn.style.display = "none";
  }
}

function isAppInstalled() {
  return window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true;
}

window.addEventListener("DOMContentLoaded", () => {
  hideInstallButton();

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", async () => {
      try {
        const registration = await navigator.serviceWorker.register("/service-worker.js");
        console.log("Service Worker registered:", registration.scope);
      } catch (error) {
        console.log("Service Worker registration failed:", error);
      }
    });
  }

  if (isAppInstalled()) {
    hideInstallButton();
  }

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredPrompt = event;
    showInstallButton();
  });

  const installBtn = document.getElementById("installBtn");

  if (installBtn) {
    installBtn.addEventListener("click", async () => {
      if (!deferredPrompt) {
        showToast("Install option will appear when your browser allows it.");
        return;
      }

      deferredPrompt.prompt();

      const choiceResult = await deferredPrompt.userChoice;

      if (choiceResult.outcome === "accepted") {
        showToast("Aura Ceylon app installed.");
      } else {
        showToast("Install cancelled.");
      }

      deferredPrompt = null;
      hideInstallButton();
    });
  }

  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    hideInstallButton();
    showToast("Aura Ceylon installed successfully.");
  });
});
