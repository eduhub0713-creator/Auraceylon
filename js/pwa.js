// Register Service Worker (required for PWA)
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


// Optional: Handle install prompt (better UX)
let deferredPrompt;

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPrompt = e;

  console.log("Install prompt ready");

  // You can later connect this to a button
  const installBtn = document.getElementById("installBtn");
  if (installBtn) {
    installBtn.style.display = "inline-block";

    installBtn.addEventListener("click", () => {
      installBtn.style.display = "none";
      deferredPrompt.prompt();

      deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === "accepted") {
          console.log("User installed the app");
        } else {
          console.log("User dismissed install");
        }
        deferredPrompt = null;
      });
    });
  }
});