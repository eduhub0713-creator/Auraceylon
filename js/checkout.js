const CHECKOUT_CART_KEY = "auraceylon-cart";
const CHECKOUT_DELIVERY_FEE = 0;

function getCheckoutCart() {
  const cart = localStorage.getItem(CHECKOUT_CART_KEY);
  return cart ? JSON.parse(cart) : [];
}

function saveCheckoutCart(cart) {
  localStorage.setItem(CHECKOUT_CART_KEY, JSON.stringify(cart));
}

function formatCheckoutPrice(price) {
  return `LKR ${Number(price).toLocaleString()}`;
}

function updateCheckoutCartCount() {
  const cartCountEl = document.getElementById("cartCount");
  if (!cartCountEl) return;

  const cart = getCheckoutCart();
  const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
  cartCountEl.textContent = totalItems;
}

function calculateCheckoutSubtotal(cart) {
  return cart.reduce((sum, item) => {
    return sum + Number(item.price) * Number(item.quantity || 1);
  }, 0);
}

function createCheckoutItem(item) {
  const imageMarkup = item.image
    ? `<img src="${item.image}" alt="${item.name}" />`
    : `<div class="product-placeholder">No Image</div>`;

  return `
    <article class="cart-item">
      <div class="cart-item-image">
        ${imageMarkup}
      </div>

      <div class="cart-item-info">
        <h4>${item.name}</h4>
        <p>${item.category}</p>
        <p>Qty: ${item.quantity || 1}</p>
      </div>

      <div class="cart-item-actions">
        <strong>${formatCheckoutPrice(Number(item.price) * Number(item.quantity || 1))}</strong>
      </div>
    </article>
  `;
}

function renderCheckoutItems(cart) {
  const checkoutItemsContainer = document.getElementById("checkoutItemsContainer");
  if (!checkoutItemsContainer) return;

  if (cart.length === 0) {
    checkoutItemsContainer.innerHTML = `
      <div class="empty-state">
        <h3>Your cart is empty</h3>
        <p>Please add some products before checkout.</p>
        <a href="products.html" class="btn btn-gold">Go to Shop</a>
      </div>
    `;
    return;
  }

  checkoutItemsContainer.innerHTML = cart.map(createCheckoutItem).join("");
}

function updateCheckoutSummary(cart) {
  const summaryItems = document.getElementById("summaryItems");
  const summarySubtotal = document.getElementById("summarySubtotal");
  const summaryDelivery = document.getElementById("summaryDelivery");
  const summaryTotal = document.getElementById("summaryTotal");

  const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
  const subtotal = calculateCheckoutSubtotal(cart);
  const total = subtotal + CHECKOUT_DELIVERY_FEE;

  if (summaryItems) summaryItems.textContent = totalItems;
  if (summarySubtotal) summarySubtotal.textContent = formatCheckoutPrice(subtotal);
  if (summaryDelivery) summaryDelivery.textContent = formatCheckoutPrice(CHECKOUT_DELIVERY_FEE);
  if (summaryTotal) summaryTotal.textContent = formatCheckoutPrice(total);
}

function validateCartBeforeCheckout(cart) {
  if (cart.length === 0) {
    alert("Your cart is empty. Please add products before checkout.");
    window.location.href = "products.html";
    return false;
  }

  return true;
}

function getFormData(form) {
  const formData = new FormData(form);

  return {
    fullName: formData.get("fullName")?.toString().trim() || "",
    phoneNumber: formData.get("phoneNumber")?.toString().trim() || "",
    emailAddress: formData.get("emailAddress")?.toString().trim() || "",
    addressLine: formData.get("addressLine")?.toString().trim() || "",
    city: formData.get("city")?.toString().trim() || "",
    paymentMethod: formData.get("paymentMethod")?.toString().trim() || "",
    orderNotes: formData.get("orderNotes")?.toString().trim() || ""
  };
}

function validateCheckoutForm(data) {
  if (!data.fullName) {
    alert("Please enter your full name.");
    return false;
  }

  if (!data.phoneNumber) {
    alert("Please enter your phone number.");
    return false;
  }

  if (!data.addressLine) {
    alert("Please enter your delivery address.");
    return false;
  }

  if (!data.city) {
    alert("Please enter your city.");
    return false;
  }

  if (!data.paymentMethod) {
    alert("Please select a payment method.");
    return false;
  }

  return true;
}

function saveOrder(order) {
  const existingOrders = localStorage.getItem("auraceylon-orders");
  const orders = existingOrders ? JSON.parse(existingOrders) : [];
  orders.push(order);
  localStorage.setItem("auraceylon-orders", JSON.stringify(orders));
}

function showCheckoutSuccess() {
  const form = document.getElementById("checkoutForm");
  const successBox = document.getElementById("checkoutSuccess");

  if (form) form.hidden = true;
  if (successBox) successBox.hidden = false;
}

function handleCheckoutSubmit() {
  const form = document.getElementById("checkoutForm");
  if (!form) return;

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const cart = getCheckoutCart();
    if (!validateCartBeforeCheckout(cart)) return;

    const customer = getFormData(form);
    if (!validateCheckoutForm(customer)) return;

    const subtotal = calculateCheckoutSubtotal(cart);
    const total = subtotal + CHECKOUT_DELIVERY_FEE;

    const order = {
      id: `AC-${Date.now()}`,
      createdAt: new Date().toISOString(),
      customer,
      items: cart,
      summary: {
        items: cart.reduce((sum, item) => sum + (item.quantity || 1), 0),
        subtotal,
        delivery: CHECKOUT_DELIVERY_FEE,
        total
      },
      status: "new"
    };

    saveOrder(order);
    localStorage.removeItem(CHECKOUT_CART_KEY);
    updateCheckoutCartCount();
    showCheckoutSuccess();

    console.log("Order saved:", order);
  });
}

function initCheckoutPage() {
  const cart = getCheckoutCart();

  updateCheckoutCartCount();

  if (!validateCartBeforeCheckout(cart)) return;

  renderCheckoutItems(cart);
  updateCheckoutSummary(cart);
  handleCheckoutSubmit();
}

document.addEventListener("DOMContentLoaded", initCheckoutPage);