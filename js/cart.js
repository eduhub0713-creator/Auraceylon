const CART_STORAGE_KEY = "auraceylon-cart";
const DELIVERY_FEE = 0;

let currentUser = null;

function getCart() {
  const cart = localStorage.getItem(CART_STORAGE_KEY);
  return cart ? JSON.parse(cart) : [];
}

function saveCart(cart) {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
}

async function saveUserCart(cart) {
  if (!currentUser) return;

  await db.collection("users").doc(currentUser.uid).set(
    {
      cart,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    },
    { merge: true }
  );
}

async function loadUserCart(user) {
  const doc = await db.collection("users").doc(user.uid).get();

  if (doc.exists && Array.isArray(doc.data().cart)) {
    saveCart(doc.data().cart);
  } else {
    saveCart([]);
  }
}

function formatPrice(price) {
  return `LKR ${Number(price).toLocaleString()}`;
}

function updateCartCount() {
  const cartCountEl = document.getElementById("cartCount");
  if (!cartCountEl) return;

  const cart = getCart();
  const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
  cartCountEl.textContent = totalItems;
}

function calculateSubtotal(cart) {
  return cart.reduce((sum, item) => {
    return sum + Number(item.price) * Number(item.quantity || 1);
  }, 0);
}

function updateSummary(cart) {
  const summaryItems = document.getElementById("summaryItems");
  const summarySubtotal = document.getElementById("summarySubtotal");
  const summaryDelivery = document.getElementById("summaryDelivery");
  const summaryTotal = document.getElementById("summaryTotal");
  const checkoutBtn = document.getElementById("checkoutBtn");

  const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
  const subtotal = calculateSubtotal(cart);
  const total = subtotal + DELIVERY_FEE;

  if (summaryItems) summaryItems.textContent = totalItems;
  if (summarySubtotal) summarySubtotal.textContent = formatPrice(subtotal);
  if (summaryDelivery) summaryDelivery.textContent = formatPrice(DELIVERY_FEE);
  if (summaryTotal) summaryTotal.textContent = formatPrice(total);

  if (checkoutBtn) {
    if (!currentUser) {
      checkoutBtn.href = "login.html";
      checkoutBtn.textContent = "Login to Checkout";
    } else {
      checkoutBtn.href = "checkout.html";
      checkoutBtn.textContent = "Proceed to Checkout";
    }
  }
}

function createCartItem(item) {
  const imageMarkup = item.image
    ? `<img src="${item.image}" alt="${item.name}" />`
    : `<div class="product-placeholder">No Image</div>`;

  return `
    <article class="cart-item" data-id="${item.id}">
      <div class="cart-item-image">
        ${imageMarkup}
      </div>

      <div class="cart-item-info">
        <h4>${item.name}</h4>
        <p>${item.category}</p>
        <p>${formatPrice(item.price)}</p>
      </div>

      <div class="cart-item-actions">
        <input
          type="number"
          min="1"
          value="${item.quantity || 1}"
          class="cart-qty-input"
          data-id="${item.id}"
        />
        <strong>${formatPrice(Number(item.price) * Number(item.quantity || 1))}</strong>
        <button class="remove-btn" data-id="${item.id}">Remove</button>
      </div>
    </article>
  `;
}

function renderCart() {
  const cartItemsContainer = document.getElementById("cartItemsContainer");
  const cartEmptyState = document.getElementById("cartEmptyState");

  if (!cartItemsContainer || !cartEmptyState) return;

  const cart = getCart();

  if (cart.length === 0) {
    cartItemsContainer.innerHTML = "";
    cartEmptyState.hidden = false;
    updateSummary(cart);
    updateCartCount();
    return;
  }

  cartEmptyState.hidden = true;
  cartItemsContainer.innerHTML = cart.map(createCartItem).join("");

  attachQuantityEvents();
  attachRemoveEvents();
  updateSummary(cart);
  updateCartCount();
}

async function updateItemQuantity(id, quantity) {
  const cart = getCart();
  const item = cart.find((product) => Number(product.id) === Number(id));

  if (!item) return;

  item.quantity = Math.max(1, Number(quantity) || 1);
  saveCart(cart);
  await saveUserCart(cart);
  renderCart();
}

async function removeItem(id) {
  const cart = getCart().filter((product) => Number(product.id) !== Number(id));
  saveCart(cart);
  await saveUserCart(cart);
  renderCart();
}

async function clearCart() {
  saveCart([]);
  await saveUserCart([]);
  renderCart();
}

function attachQuantityEvents() {
  const qtyInputs = document.querySelectorAll(".cart-qty-input");

  qtyInputs.forEach((input) => {
    input.addEventListener("change", async (event) => {
      const id = event.target.dataset.id;
      const quantity = event.target.value;
      await updateItemQuantity(id, quantity);
    });
  });
}

function attachRemoveEvents() {
  const removeButtons = document.querySelectorAll(".remove-btn");

  removeButtons.forEach((button) => {
    button.addEventListener("click", async () => {
      const id = button.dataset.id;
      await removeItem(id);
    });
  });
}

function attachClearCartEvent() {
  const clearCartBtn = document.getElementById("clearCartBtn");
  if (!clearCartBtn) return;

  clearCartBtn.addEventListener("click", async () => {
    const cart = getCart();

    if (cart.length === 0) {
      showToast("Your cart is already empty.");
      return;
    }

    const confirmed = confirm("Are you sure you want to clear your cart?");
    if (confirmed) {
      await clearCart();
      showToast("Cart cleared.");
    }
  });
}

function initCartPage() {
  auth.onAuthStateChanged(async (user) => {
    currentUser = user;

    if (user) {
      await loadUserCart(user);
    } else {
      saveCart([]);
    }

    renderCart();
    attachClearCartEvent();
  });
}

document.addEventListener("DOMContentLoaded", initCartPage);
