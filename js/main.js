async function loadCategoriesFromFirestore() {
  try {
    const snapshot = await db.collection("categories").orderBy("name", "asc").get();

    if (snapshot.empty) return [];

    return snapshot.docs.map((doc) => ({
      docId: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Failed to load categories:", error);
    return [];
  }
}

function formatPrice(price) {
  return `LKR ${Number(price).toLocaleString()}`;
}

function createCategoryCard(category) {
  const link = category.link || `products.html?category=${encodeURIComponent(category.name)}`;

  return `
    <a href="${link}" class="category-card">
      <div class="category-icon">✦</div>
      <h3>${category.name}</h3>
      <p>${category.description || ""}</p>
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

async function renderCategories() {
  const categoryGrid = document.querySelector(".category-grid");
  if (!categoryGrid) return;

  const categories = await loadCategoriesFromFirestore();

  if (categories.length === 0) {
    categoryGrid.innerHTML = `
      <div class="empty-state">
        <h3>No categories yet</h3>
        <p>Add categories from the admin panel.</p>
      </div>
    `;
    return;
  }

  categoryGrid.innerHTML = categories.map(createCategoryCard).join("");
}

function renderFeaturedProducts(products) {
  const featuredProductsEl = document.getElementById("featuredProducts");
  if (!featuredProductsEl) return;

  const featured = products.filter((product) => product.featured);

  if (featured.length === 0) {
    featuredProductsEl.innerHTML = `
      <div class="empty-state">
        <h3>No featured products yet</h3>
        <p>Add featured products from the admin panel.</p>
      </div>
    `;
    return;
  }

  featuredProductsEl.innerHTML = featured.map(createProductCard).join("");
}

async function loadProductsFromFirestore() {
  try {
    const snapshot = await db.collection("products").orderBy("id", "asc").get();

    if (snapshot.empty) return [];

    return snapshot.docs.map((doc) => ({
      docId: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Failed to load products:", error);
    return [];
  }
}

async function initHomePage() {
  await renderCategories();

  const products = await loadProductsFromFirestore();
  renderFeaturedProducts(products);
}

document.addEventListener("DOMContentLoaded", initHomePage);
