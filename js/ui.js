const UI_CART_KEY = "auraceylon-cart";

function getUICart() {
  try {
    const cart = localStorage.getItem(UI_CART_KEY);
    return cart ? JSON.parse(cart) : [];
  } catch (error) {
    console.error("Failed to read cart from storage:", error);
    return [];
  }
}

function getUICartCount() {
  const cart = getUICart();
  return cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
}

function updateGlobalCartCount() {
  const cartCountEl = document.getElementById("cartCount");
  if (!cartCountEl) return;

  cartCountEl.textContent = getUICartCount();
}

function initMobileMenu() {
  const menuToggle = document.getElementById("menuToggle");
  const navLinks = document.getElementById("navLinks");

  if (!menuToggle || !navLinks) return;

  menuToggle.addEventListener("click", () => {
    navLinks.classList.toggle("show");
  });
}

function showToast(message = "Done") {
  let toast = document.getElementById("globalToast");

  if (!toast) {
    toast = document.createElement("div");
    toast.id = "globalToast";
    toast.className = "global-toast";
    document.body.appendChild(toast);
  }

  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(window.__auraToastTimer);
  window.__auraToastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 2500);
}

function initUI() {
  initMobileMenu();
  updateGlobalCartCount();
}

document.addEventListener("DOMContentLoaded", initUI);