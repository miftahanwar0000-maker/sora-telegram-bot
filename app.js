const state = {
  products: load("products", [
    { id: id(), name: "Kopi Susu", price: 18000, stock: 50 },
    { id: id(), name: "Roti Bakar", price: 15000, stock: 35 },
  ]),
  cart: [],
  history: load("history", []),
};

const el = {
  productForm: document.getElementById("product-form"),
  productName: document.getElementById("product-name"),
  productPrice: document.getElementById("product-price"),
  productStock: document.getElementById("product-stock"),
  productList: document.getElementById("product-list"),
  productSelect: document.getElementById("product-select"),
  qtyInput: document.getElementById("qty-input"),
  addCartBtn: document.getElementById("add-cart-btn"),
  cartList: document.getElementById("cart-list"),
  discountInput: document.getElementById("discount-input"),
  taxInput: document.getElementById("tax-input"),
  paymentInput: document.getElementById("payment-input"),
  subtotalVal: document.getElementById("subtotal-val"),
  discountVal: document.getElementById("discount-val"),
  taxVal: document.getElementById("tax-val"),
  totalVal: document.getElementById("total-val"),
  changeVal: document.getElementById("change-val"),
  checkoutBtn: document.getElementById("checkout-btn"),
  clearBtn: document.getElementById("clear-btn"),
  printBtn: document.getElementById("print-btn"),
  historyList: document.getElementById("history-list"),
  revenueVal: document.getElementById("revenue-val"),
  txnCountVal: document.getElementById("txn-count-val"),
  resetHistoryBtn: document.getElementById("reset-history-btn"),
  receiptTemplate: document.getElementById("receipt-template"),
};

let latestReceipt = null;

function id() {
  return Math.random().toString(36).slice(2, 10);
}

function load(key, fallback) {
  const raw = localStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function save() {
  localStorage.setItem("products", JSON.stringify(state.products));
  localStorage.setItem("history", JSON.stringify(state.history));
}

function rupiah(v) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(v || 0);
}

function totals() {
  const subtotal = state.cart.reduce((sum, item) => sum + item.qty * item.price, 0);
  const discountPct = Number(el.discountInput.value || 0);
  const taxPct = Number(el.taxInput.value || 0);
  const discount = subtotal * (discountPct / 100);
  const afterDiscount = subtotal - discount;
  const tax = afterDiscount * (taxPct / 100);
  const total = Math.max(0, Math.round(afterDiscount + tax));
  const payment = Number(el.paymentInput.value || 0);
  const change = Math.max(0, payment - total);
  return { subtotal, discount, tax, total, payment, change, discountPct, taxPct };
}

function renderProducts() {
  el.productList.innerHTML = "";
  el.productSelect.innerHTML = "";

  state.products.forEach((p) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${p.name}</td>
      <td>${rupiah(p.price)}</td>
      <td>${p.stock}</td>
      <td>
        <button data-action="stock-plus" data-id="${p.id}" type="button">+1</button>
        <button data-action="stock-minus" data-id="${p.id}" type="button">-1</button>
        <button data-action="delete" data-id="${p.id}" class="danger" type="button">Hapus</button>
      </td>
    `;
    el.productList.append(tr);

    const op = document.createElement("option");
    op.value = p.id;
    op.textContent = `${p.name} (${rupiah(p.price)} | stok ${p.stock})`;
    el.productSelect.append(op);
  });
}

function renderCart() {
  el.cartList.innerHTML = "";
  state.cart.forEach((item) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${item.name}</td>
      <td>${item.qty}</td>
      <td>${rupiah(item.price)}</td>
      <td>${rupiah(item.qty * item.price)}</td>
      <td><button data-action="remove-cart" data-id="${item.id}" class="danger" type="button">Hapus</button></td>
    `;
    el.cartList.append(tr);
  });

  const t = totals();
  el.subtotalVal.textContent = rupiah(t.subtotal);
  el.discountVal.textContent = rupiah(t.discount);
  el.taxVal.textContent = rupiah(t.tax);
  el.totalVal.textContent = rupiah(t.total);
  el.changeVal.textContent = rupiah(t.change);
}

function renderHistory() {
  el.historyList.innerHTML = "";
  let revenue = 0;
  state.history.forEach((txn) => {
    revenue += txn.total;
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${new Date(txn.time).toLocaleString("id-ID")}</td>
      <td>${txn.items.length} item</td>
      <td>${rupiah(txn.total)}</td>
      <td>${rupiah(txn.payment)}</td>
      <td>${rupiah(txn.change)}</td>
    `;
    el.historyList.append(tr);
  });
  el.revenueVal.textContent = rupiah(revenue);
  el.txnCountVal.textContent = state.history.length;
}

function sync() {
  renderProducts();
  renderCart();
  renderHistory();
  save();
}

el.productForm.addEventListener("submit", (e) => {
  e.preventDefault();
  state.products.push({
    id: id(),
    name: el.productName.value.trim(),
    price: Number(el.productPrice.value),
    stock: Number(el.productStock.value),
  });
  el.productForm.reset();
  sync();
});

el.productList.addEventListener("click", (e) => {
  const btn = e.target.closest("button");
  if (!btn) return;
  const p = state.products.find((x) => x.id === btn.dataset.id);
  if (!p) return;
  if (btn.dataset.action === "delete") {
    state.products = state.products.filter((x) => x.id !== p.id);
    state.cart = state.cart.filter((x) => x.id !== p.id);
  }
  if (btn.dataset.action === "stock-plus") p.stock += 1;
  if (btn.dataset.action === "stock-minus") p.stock = Math.max(0, p.stock - 1);
  sync();
});

el.addCartBtn.addEventListener("click", () => {
  const product = state.products.find((p) => p.id === el.productSelect.value);
  const qty = Number(el.qtyInput.value || 1);
  if (!product || qty < 1) return;
  if (product.stock < qty) {
    alert("Stok tidak mencukupi.");
    return;
  }

  const existing = state.cart.find((i) => i.id === product.id);
  if (existing) existing.qty += qty;
  else state.cart.push({ id: product.id, name: product.name, price: product.price, qty });
  product.stock -= qty;
  sync();
});

el.cartList.addEventListener("click", (e) => {
  const btn = e.target.closest("button");
  if (!btn || btn.dataset.action !== "remove-cart") return;
  const idx = state.cart.findIndex((x) => x.id === btn.dataset.id);
  if (idx === -1) return;

  const item = state.cart[idx];
  const product = state.products.find((x) => x.id === item.id);
  if (product) product.stock += item.qty;
  state.cart.splice(idx, 1);
  sync();
});

[el.discountInput, el.taxInput, el.paymentInput].forEach((input) => {
  input.addEventListener("input", renderCart);
});

el.clearBtn.addEventListener("click", () => {
  state.cart.forEach((item) => {
    const product = state.products.find((x) => x.id === item.id);
    if (product) product.stock += item.qty;
  });
  state.cart = [];
  renderCart();
  renderProducts();
  save();
});

el.checkoutBtn.addEventListener("click", () => {
  if (!state.cart.length) {
    alert("Keranjang masih kosong.");
    return;
  }

  const t = totals();
  if (t.payment < t.total) {
    alert("Nominal bayar kurang.");
    return;
  }

  const txn = {
    id: id(),
    time: new Date().toISOString(),
    items: structuredClone(state.cart),
    ...t,
  };
  state.history.unshift(txn);
  latestReceipt = txn;
  state.cart = [];
  el.paymentInput.value = "0";
  sync();
  alert("Pembayaran sukses.");
});

el.resetHistoryBtn.addEventListener("click", () => {
  state.history = [];
  save();
  renderHistory();
});

el.printBtn.addEventListener("click", () => {
  if (!latestReceipt) {
    alert("Belum ada transaksi untuk dicetak.");
    return;
  }
  const clone = el.receiptTemplate.content.cloneNode(true);
  clone.getElementById("receipt-time").textContent = new Date(latestReceipt.time).toLocaleString("id-ID");
  const itemsEl = clone.getElementById("receipt-items");
  latestReceipt.items.forEach((item) => {
    const row = document.createElement("p");
    row.textContent = `${item.name} x${item.qty} = ${rupiah(item.qty * item.price)}`;
    itemsEl.append(row);
  });
  clone.getElementById("receipt-summary").textContent = `Total ${rupiah(latestReceipt.total)} | Bayar ${rupiah(latestReceipt.payment)} | Kembalian ${rupiah(latestReceipt.change)}`;

  const receipt = document.createElement("div");
  receipt.className = "receipt";
  receipt.append(clone);
  document.body.append(receipt);
  window.print();
  receipt.remove();
});

sync();
