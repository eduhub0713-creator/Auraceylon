const CHECKOUT_DELIVERY_FEE = 0;

let checkoutUser = null;

function getCheckoutCart() {
  return getUICart();
}

function saveCheckoutCart(cart) {
  saveUICart(cart);
}

async function loadCheckoutCartFromFirestore(user) {
  const doc = await db.collection("users").doc(user.uid).get();

  if (doc.exists && Array.isArray(doc.data().cart)) {
    saveCheckoutCart(doc.data().cart);
  } else {
    saveCheckoutCart([]);
  }
}

async function clearUserCart(user) {
  if (!user) return;

  await db.collection("users").doc(user.uid).set(
    {
      cart: [],
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    },
    { merge: true }
  );

  saveUICart([]);
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
    showToast("Please enter your full name.");
    return false;
  }

  if (!data.phoneNumber) {
    showToast("Please enter your phone number.");
    return false;
  }

  if (!data.addressLine) {
    showToast("Please enter your delivery address.");
    return false;
  }

  if (!data.city) {
    showToast("Please enter your city.");
    return false;
  }

  if (!data.paymentMethod) {
    showToast("Please select a payment method.");
    return false;
  }

  return true;
}

async function saveOrderToFirestore(order) {
  await db.collection("orders").doc(order.id).set(order);

  await db
    .collection("users")
    .doc(checkoutUser.uid)
    .collection("orders")
    .doc(order.id)
    .set(order);
}

async function reduceStockAfterOrder(cart) {
  const batch = db.batch();

  for (const item of cart) {
    const productRef = db.collection("products").doc(String(item.id));
    const doc = await productRef.get();

    if (!doc.exists) continue;

    const product = doc.data();
    const currentStock = Number(product.stock || 0);
    const newStock = Math.max(0, currentStock - Number(item.quantity || 1));

    let newStatus = "in-stock";
    if (newStock === 0) {
      newStatus = "out-of-stock";
    } else if (newStock <= 3) {
      newStatus = "low-stock";
    }

    batch.update(productRef, {
      stock: newStock,
      status: newStatus,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
  }

  await batch.commit();
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

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!checkoutUser) {
      showToast("Please login before checkout.");
      window.location.href = "login.html";
      return;
    }

    const cart = getCheckoutCart();

    if (cart.length === 0) {
      showToast("Your cart is empty.");
      window.location.href = "products.html";
      return;
    }

    const customer = getFormData(form);

    if (!validateCheckoutForm(customer)) return;

    const subtotal = calculateCheckoutSubtotal(cart);
    const total = subtotal + CHECKOUT_DELIVERY_FEE;

    const orderId = `AC-${Date.now()}`;

    const order = {
      id: orderId,
      userId: checkoutUser.uid,
      userEmail: checkoutUser.email,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
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

    try {
      showToast("Placing order...");

      await saveOrderToFirestore(order);
      await reduceStockAfterOrder(cart);
      await clearUserCart(checkoutUser);

      updateCheckoutCartCount();
      renderCheckoutItems([]);
      updateCheckoutSummary([]);
      showCheckoutSuccess();

      showToast("Order placed successfully.");
    } catch (error) {
      console.error(error);
      showToast("Failed to place order.");
    }
  });
}

function initCheckoutPage() {
  auth.onAuthStateChanged(async (user) => {
    if (!user) {
      showToast("Please login to checkout.");
      window.location.href = "login.html";
      return;
    }

    checkoutUser = user;

    await loadCheckoutCartFromFirestore(user);

    const cart = getCheckoutCart();

    if (cart.length === 0) {
      showToast("Your cart is empty.");
      window.location.href = "products.html";
      return;
    }

    updateCheckoutCartCount();
    renderCheckoutItems(cart);
    updateCheckoutSummary(cart);
    handleCheckoutSubmit();
  });
}

document.addEventListener("DOMContentLoaded", initCheckoutPage);
