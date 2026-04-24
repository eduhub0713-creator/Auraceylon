const PRODUCTS_STORAGE_KEY = "auraceylon-cart";

let allProducts = [];
let activeCategory = "All";
let activeSearch = "";
let activeSort = "default";

function formatLKR(price) {
  return `LKR ${Number(price).toLocaleString()}`;
}

function getCartItems() {
  const savedCart = localStorage.getItem(PRODUCTS_STORAGE_KEY);
  return savedCart ? JSON.parse(savedCart) : [];
}

function updateCartBadge() {
  const cartCountEl = document.getElementById("cartCount");
  if (!cartCountEl) return;

  const cart = getCartItems();
  const total = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
  cartCountEl.textContent = total;
}

function getCategoryFromURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get("category");
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
        <p class="product-price">${formatLKR(product.price)}</p>
        <a href="product-details.html?id=${product.id}" class="btn btn-small">View Product</a>
      </div>
    </article>
  `;
}

function sortProducts(products, sortType) {
  const sorted = [...products];

  switch (sortType) {
    case "low-high":
      return sorted.sort((a, b) => Number(a.price) - Number(b.price));
    case "high-low":
      return sorted.sort((a, b) => Number(b.price) - Number(a.price));
    case "name-az":
      return sorted.sort((a, b) => a.name.localeCompare(b.name));
    case "name-za":
      return sorted.sort((a, b) => b.name.localeCompare(a.name));
    default:
      return sorted;
  }
}

function filterProducts() {
  let filtered = [...allProducts];

  if (activeCategory !== "All") {
    filtered = filtered.filter(
      (product) => product.category.toLowerCase() === activeCategory.toLowerCase()
    );
  }

  if (activeSearch.trim()) {
    const query = activeSearch.toLowerCase().trim();

    filtered = filtered.filter((product) => {
      return (
        product.name.toLowerCase().includes(query) ||
        product.category.toLowerCase().includes(query) ||
        (product.description && product.description.toLowerCase().includes(query))
      );
    });
  }

  return sortProducts(filtered, activeSort);
}

function updateResultsCount(count) {
  const resultsCount = document.getElementById("resultsCount");
  if (!resultsCount) return;

  resultsCount.textContent = `${count} product${count === 1 ? "" : "s"} found`;
}

function renderProducts() {
  const productsGrid = document.getElementById("productsGrid");
  const emptyState = document.getElementById("emptyState");
  if (!productsGrid || !emptyState) return;

  const filteredProducts = filterProducts();

  updateResultsCount(filteredProducts.length);

  if (filteredProducts.length === 0) {
    productsGrid.innerHTML = "";
    emptyState.hidden = false;
    return;
  }

  emptyState.hidden = true;
  productsGrid.innerHTML = filteredProducts.map(createProductCard).join("");
}

function setActiveCategoryButton() {
  const filterButtons = document.querySelectorAll(".filter-btn");

  filterButtons.forEach((button) => {
    const buttonCategory = button.dataset.category;
    button.classList.toggle("active", buttonCategory === activeCategory);
  });
}

function attachCategoryEvents() {
  const filterButtons = document.querySelectorAll(".filter-btn");

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      activeCategory = button.dataset.category || "All";
      setActiveCategoryButton();
      renderProducts();
    });
  });
}

function attachSearchEvent() {
  const searchInput = document.getElementById("searchInput");
  if (!searchInput) return;

  searchInput.addEventListener("input", (event) => {
    activeSearch = event.target.value || "";
    renderProducts();
  });
}

function attachSortEvent() {
  const sortSelect = document.getElementById("sortSelect");
  if (!sortSelect) return;

  sortSelect.addEventListener("change", (event) => {
    activeSort = event.target.value || "default";
    renderProducts();
  });
}

async function loadProductsData() {
  try {
    const snapshot = await db.collection("products").orderBy("id", "asc").get();

    if (snapshot.empty) {
      return [];
    }

    return snapshot.docs.map((doc) => ({
      docId: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error loading Firestore products:", error);
    return [];
  }
}

async function initProductsPage() {
  updateCartBadge();

  allProducts = await loadProductsData();

  const urlCategory = getCategoryFromURL();
  if (urlCategory) {
    activeCategory = urlCategory;
  }

  const searchInput = document.getElementById("searchInput");
  const sortSelect = document.getElementById("sortSelect");

  if (searchInput) {
    searchInput.value = activeSearch;
  }

  if (sortSelect) {
    sortSelect.value = activeSort;
  }

  await loadCategoryFilters();
  setActiveCategoryButton();
  attachCategoryEvents();
  attachSearchEvent();
  attachSortEvent();
  renderProducts();
}

async function loadCategoryFilters() {
  const categoryFilters = document.getElementById("categoryFilters");
  if (!categoryFilters) return;

  try {
    const snapshot = await db.collection("categories").orderBy("name", "asc").get();

    let html = `<button class="filter-btn active" data-category="All">All</button>`;

    snapshot.forEach((doc) => {
      const category = doc.data();
      html += `<button class="filter-btn" data-category="${category.name}">${category.name}</button>`;
    });

    categoryFilters.innerHTML = html;
  } catch (error) {
    console.error("Failed to load category filters:", error);
  }
}

document.addEventListener("DOMContentLoaded", initProductsPage);
