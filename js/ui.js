function getCartKey(user) {
  return user ? `auraceylon-cart-${user.uid}` : "auraceylon-cart-guest";
}

// ===== CART LOCAL =====
function getUICart() {
  try {
    const user = firebase.auth().currentUser;
    const cartKey = getCartKey(user);

    const cart = localStorage.getItem(cartKey);
    return cart ? JSON.parse(cart) : [];
  } catch (error) {
    console.error("Failed to read cart:", error);
    return [];
  }
}

function saveUICart(cart) {
  const user = firebase.auth().currentUser;
  const cartKey = getCartKey(user);
  localStorage.setItem(cartKey, JSON.stringify(cart));
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

// ===== USER NAME HELPERS =====
function getUserDisplayName(user) {
  if (!user) return "";

  if (user.displayName) {
    return user.displayName.split(" ")[0];
  }

  if (user.email) {
    return user.email.split("@")[0];
  }

  return "User";
}

function updateUserArea(user) {
  const userArea = document.getElementById("userArea");
  if (!userArea) return;

  if (user) {
    const name = getUserDisplayName(user);

    userArea.innerHTML = `
      <a href="profile.html" class="nav-user-name">Hi, ${name}</a>
      <a href="profile.html" class="btn btn-small">Profile</a>
      <a href="orders.html" class="btn btn-small">Orders</a>
      <button id="logoutBtn" class="btn btn-small logout-btn">Logout</button>
    `;

    const logoutBtn = document.getElementById("logoutBtn");

    if (logoutBtn) {
      logoutBtn.addEventListener("click", async () => {
        await firebase.auth().signOut();
        saveUICart([]);
        updateGlobalCartCount();
        showToast("Logged out");
        window.location.href = "index.html";
      });
    }
  } else {
    userArea.innerHTML = `<a href="login.html" id="loginBtn">Login</a>`;
  }
}

// ===== FIRESTORE CART SYNC =====
async function loadCartFromFirestore(user) {
  if (!user) return;

  try {
    const docRef = db.collection("users").doc(user.uid);
    const doc = await docRef.get();

    const localCart = getUICart(); // guest or previous cart

    let firestoreCart = [];

    if (doc.exists && Array.isArray(doc.data().cart)) {
      firestoreCart = doc.data().cart;
    }

    // 🔥 MERGE LOGIC (IMPORTANT)
    const mergedCart = [...firestoreCart];

    localCart.forEach(localItem => {
      const existing = mergedCart.find(item => Number(item.id) === Number(localItem.id));

      if (existing) {
        existing.quantity += localItem.quantity;
      } else {
        mergedCart.push(localItem);
      }
    });

    // SAVE MERGED CART
    saveUICart(mergedCart);

    await docRef.set(
      {
        cart: mergedCart,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      },
      { merge: true }
    );

    updateGlobalCartCount();

  } catch (err) {
    console.error("Load cart failed:", err);
  }
}

// ===== AUTH STATE =====
function initAuthListener() {
  if (!window.firebase || !firebase.auth) return;

  firebase.auth().onAuthStateChanged(async (user) => {
    updateUserArea(user);

    if (user) {
      console.log("User logged in:", user.email);
      await loadCartFromFirestore(user);
    } else {
      console.log("User logged out");
      saveUICart([]);
      updateGlobalCartCount();
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

function protectPage(options = {}) {
  const { requireAuth = false } = options;

  firebase.auth().onAuthStateChanged((user) => {
    if (requireAuth && !user) {
      localStorage.setItem("redirectAfterLogin", window.location.href);
      showToast("Please login to continue");
      window.location.href = "login.html";
    }
  });
}

document.addEventListener("DOMContentLoaded", initUI);
