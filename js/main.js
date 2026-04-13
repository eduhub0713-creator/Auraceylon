const categoryData = [
  {
    name: "Clothes",
    description: "Elegant styles for everyday and occasion wear.",
    link: "products.html?category=Clothes"
  },
  {
    name: "Bed Sheets",
    description: "Premium comfort with luxury texture and finish.",
    link: "products.html?category=Bed%20Sheets"
  },
  {
    name: "Towels",
    description: "Soft, refined essentials made for daily comfort.",
    link: "products.html?category=Towels"
  },
  {
    name: "Girls Accessories",
    description: "Beautiful finishing touches with a graceful feel.",
    link: "products.html?category=Girls%20Accessories"
  }
];

const fallbackFeaturedProducts = [
  {
    id: 1,
    name: "Luxury Printed Bed Sheet",
    category: "Bed Sheets",
    price: 6500,
    image: "",
    featured: true
  },
  {
    id: 2,
    name: "Soft Cotton Towel Set",
    category: "Towels",
    price: 3200,
    image: "",
    featured: true
  },
  {
    id: 3,
    name: "Elegant Women Dress",
    category: "Clothes",
    price: 5400,
    image: "",
    featured: true
  }
];

function formatPrice(price) {
  return `LKR ${Number(price).toLocaleString()}`;
}

function getCart() {
  const cart = localStorage.getItem("auraceylon-cart");
  return cart ? JSON.parse(cart) : [];
}

function updateCartCount() {
  const cartCountEl = document.getElementById("cartCount");
  if (!cartCountEl) return;

  const cart = getCart();
  const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
  cartCountEl.textContent = totalItems;
}

function createCategoryCard(category) {
  return `
    <a href="${category.link}" class="category-card">
      <div class="category-icon">✦</div>
      <h3>${category.name}</h3>
      <p>${category.description}</p>
    </a>
  `;
}

function createProductCard(product) {
  const imageMarkup = product.image
    ? `<img src="${product.image}" alt="${product.name}" class="product-image" />`
    : `<div class="product-placeholder">Product Image</div>`;

  return `
    <article class="product-card">
      <div class="product-image-wrap">
        ${imageMarkup}
      </div>
      <div class="product-info">
        <p class="product-category">${product.category}</p>
        <h3>${product.name}</h3>
        <p class="product-price">${formatPrice(product.price)}</p>
        <a href="product-details.html?id=${product.id}" class="btn btn-small">View Product</a>
      </div>
    </article>
  `;
}

function renderCategories() {
  const categoryGrid = document.querySelector(".category-grid");
  if (!categoryGrid) return;

  categoryGrid.innerHTML = categoryData.map(createCategoryCard).join("");
}

function renderFeaturedProducts(products) {
  const featuredProductsEl = document.getElementById("featuredProducts");
  if (!featuredProductsEl) return;

  const featured = products.filter((product) => product.featured);

  featuredProductsEl.innerHTML = featured.map(createProductCard).join("");
}

async function loadProducts() {
  try {
    const response = await fetch("./data/products.json");

    if (!response.ok) {
      throw new Error("Could not load products.json");
    }

    const products = await response.json();
    return Array.isArray(products) && products.length ? products : fallbackFeaturedProducts;
  } catch (error) {
    console.warn("Using fallback featured products:", error);
    return fallbackFeaturedProducts;
  }
}

async function initHomePage() {
  updateCartCount();
  renderCategories();

  const products = await loadProducts();
  renderFeaturedProducts(products);
}

document.addEventListener("DOMContentLoaded", initHomePage);