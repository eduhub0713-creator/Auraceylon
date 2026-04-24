const UI_CART_KEY = "auraceylon-cart";

// ===== CART (LOCAL) =====
function getUICart() {
  try {
    const cart = localStorage.getItem(UI_CART_KEY);
    return cart ? JSON.parse(cart) : [];
  } catch (error) {
    console.error("Failed to read cart:", error);
    return [];
  }
}

function saveUICart(cart) {
  localStorage.setItem(UI_CART_KEY, JSON.stringify(cart));
}

// ===== CART COUNT =====
function getUICartCount() {
  const cart = getUICart();
  return cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
}

function updateGlobalCartCount() {
  const cartCountEl = document.getElementById("cartCount");
  if (!cartCountEl) return;

  cartCountEl.textContent = getUICartCount();
}

// ===== FIRESTORE SYNC =====
async function syncCartToFirestore(user) {
  if (!user) return;

  const cart = getUICart();

  try {
    await db.collection("users")
      .doc(user.uid)
      .set({ cart }, { merge: true });
  } catch (err) {
    console.error("Firestore sync failed:", err);
  }
}

async function loadCartFromFirestore(user) {
  if (!user) return;

  try {
    const doc = await db.collection("users").doc(user.uid).get();

    if (doc.exists && doc.data().cart) {
      saveUICart(doc.data().cart);
      updateGlobalCartCount();
    }
  } catch (err) {
    console.error("Load cart failed:", err);
  }
}

// ===== AUTH STATE =====
function initAuthListener() {
  if (!window.firebase) return;

  firebase.auth().onAuthStateChanged(async (user) => {
    if (user) {
      console.log("User logged in:", user.email);
      await loadCartFromFirestore(user);
    } else {
      console.log("User logged out");
    }
  });
}

// ===== MOBILE MENU =====
function initMobileMenu() {
  const menuToggle = document.getElementById("menuToggle");
  const navLinks = document.getElementById("navLinks");

  if (!menuToggle || !navLinks) return;

  menuToggle.addEventListener("click", () => {
    navLinks.classList.toggle("show");
  });
}

// ===== TOAST =====
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

// ===== INIT =====
function initUI() {
  initMobileMenu();
  updateGlobalCartCount();
  initAuthListener();
}

document.addEventListener("DOMContentLoaded", initUI);
