// Household Budget Organizer
// One card factory is used for both the default and the custom categories.

const defaultCategories = [
  { name: "Financial Freedom", icon: "fas fa-chart-line", class: "card-financial" },
  { name: "Fixed Costs",       icon: "fas fa-home",       class: "card-fixed" },
  { name: "Pleasures",         icon: "fas fa-smile",      class: "card-pleasures" },
  { name: "Goals",             icon: "fas fa-bullseye",   class: "card-goals" },
  { name: "Education",         icon: "fas fa-graduation-cap", class: "card-education" },
  { name: "Comfort",           icon: "fas fa-couch",      class: "card-comfort" }
];

const STORAGE_KEY = 'budgetData';
const CUSTOM_KEY = 'customCategories';
const MAX_NAME_LENGTH = 30;

const budgetContainer = document.getElementById("budgetContainer");
const budgetInput = document.getElementById("totalBudget");
const warningMsg = document.getElementById("warningMsg");
const summarySpent = document.getElementById("summarySpent");
const summaryRemaining = document.getElementById("summaryRemaining");
const summaryPercent = document.getElementById("summaryPercent");
const deleteModal = document.getElementById("deleteModal");
const limitModal = document.getElementById("limitModal");
const deleteCategoryModal = document.getElementById("deleteCategoryModal");
const addCategoryModal = document.getElementById("addCategoryModal");
const themeToggle = document.getElementById("themeToggle");

let cards = [];
let customCategories = [];
let chart = null;
let pendingExpenseDelete = null;
let pendingCategoryDelete = null;

/* ---------- Helpers ---------- */

// Text typed by the user is escaped before it goes into innerHTML.
function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, ch => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[ch]));
}

// Only letters, numbers, spaces and dashes are allowed in an icon class.
function safeIconClass(icon) {
  const value = String(icon || '').trim();
  return /^[a-z0-9 -]+$/i.test(value) ? value : 'fas fa-tag';
}

function safeColor(color) {
  return /^#[0-9a-f]{6}$/i.test(String(color)) ? color : '#4caf50';
}

function readJSON(key, fallback) {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return value ?? fallback;
  } catch {
    return fallback;
  }
}

function cleanExpenses(list) {
  if (!Array.isArray(list)) return [];
  return list
    .filter(e => e && typeof e.amount === 'number' && isFinite(e.amount))
    .map(e => ({ desc: String(e.desc ?? ''), amount: e.amount }));
}

/* ---------- Theme ---------- */

function initTheme() {
  const savedTheme = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme);
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
  updateThemeIcon(newTheme);
}

function updateThemeIcon(theme) {
  const icon = themeToggle.querySelector('i');
  icon.className = theme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
}

/* ---------- Save ---------- */

function saveData() {
  const dataToSave = {
    totalBudget: parseFloat(budgetInput.value) || 0,
    cards: cards.map(c => ({
      targetPercentage: parseFloat(c.metaInput.value) || 0,
      expenses: c.expenses,
      total: c.getTotal()
    }))
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
}

function saveCustomCategories() {
  localStorage.setItem(CUSTOM_KEY, JSON.stringify(customCategories));
}

/* ---------- Card factory ---------- */

function createCard(cat, { initialData = null, custom = false } = {}) {
  const card = document.createElement("div");
  card.classList.add("card");
  if (custom) {
    card.classList.add("card-custom");
    card.style.setProperty("--accent", safeColor(cat.color));
  } else {
    card.classList.add(cat.class);
  }

  const defaultTarget = custom ? 10 : Math.round(100 / defaultCategories.length);
  const target = Number.isFinite(initialData?.targetPercentage)
    ? initialData.targetPercentage
    : defaultTarget;

  card.innerHTML = `
    ${custom ? '<button type="button" class="delete-category-btn" aria-label="Delete category" title="Delete category"><i class="fas fa-times"></i></button>' : ''}
    <h2><i class="${safeIconClass(cat.icon)}"></i> ${escapeHTML(cat.name)}</h2>
    <div class="meta">
      <label>Target (%):</label>
      <input type="number" class="metaInput" value="${target}" min="0" max="100">
    </div>
    <p>Limit: $<span class="limit">0</span></p>
    <div class="progress"><div class="progress-bar"></div></div>
    <p>Total spent: $<span class="total">0</span></p>

    <div class="expense-form">
      <input type="text" class="desc" placeholder="Expense description">
      <input type="number" class="amount" placeholder="$ Amount">
      <button class="addBtn"><i class="fas fa-plus-circle"></i> Add Expense</button>
    </div>
    <ul class="list"></ul>
  `;

  const metaInput = card.querySelector(".metaInput");
  const totalSpan = card.querySelector(".total");
  const limitSpan = card.querySelector(".limit");
  const progressBar = card.querySelector(".progress-bar");
  const list = card.querySelector(".list");

  let expenses = cleanExpenses(initialData?.expenses);
  let total = 0;
  let limit = 0;

  function updateProgress() {
    if (limit > 0) {
      const percent = (total / limit) * 100;
      progressBar.style.width = Math.min(percent, 100) + "%";
      if (percent < 70) {
        progressBar.style.background = "#4caf50"; // green
      } else if (percent < 100) {
        progressBar.style.background = "#ff9800"; // orange
      } else {
        progressBar.style.background = "#f44336"; // red
      }
    } else {
      progressBar.style.width = "0%";
    }
  }

  function renderExpenses() {
    list.innerHTML = '';
    expenses.forEach((expense, index) => {
      const li = document.createElement("li");
      li.innerHTML = `
        <span class="expense-desc">${escapeHTML(expense.desc)}</span>
        <span class="expense-amount">$${expense.amount.toFixed(2)}</span>
        <div class="expense-actions">
          <button class="edit-btn" data-index="${index}" aria-label="Edit expense"><i class="fas fa-edit"></i></button>
          <button class="delete-btn" data-index="${index}" aria-label="Delete expense"><i class="fas fa-trash"></i></button>
        </div>
      `;
      list.appendChild(li);
    });
  }

  const cardObj = {
    card,
    cat,
    custom,
    metaInput,
    get expenses() { return expenses; },
    getTotal: () => total,
    getLimit: () => limit,
    recalcLimit() {
      const budget = parseFloat(budgetInput.value) || 0;
      const pct = parseFloat(metaInput.value) || 0;
      limit = (pct / 100) * budget;
      limitSpan.textContent = limit.toFixed(2);
      updateProgress();
    },
    // Rebuilds total, progress bar and expense list from the expenses array
    refresh() {
      total = expenses.reduce((sum, e) => sum + e.amount, 0);
      totalSpan.textContent = total.toFixed(2);
      updateProgress();
      renderExpenses();
    }
  };

  card.querySelector(".addBtn").addEventListener("click", () => {
    const descInput = card.querySelector(".desc");
    const amountInput = card.querySelector(".amount");
    const desc = descInput.value.trim();
    const amount = parseFloat(amountInput.value);

    if (!desc || isNaN(amount) || amount <= 0) {
      alert("Please enter a valid description and amount.");
      return;
    }

    if (total + amount > limit + 0.005) {
      showLimitModal(cardObj);
      return;
    }

    expenses.push({ desc, amount });
    cardObj.refresh();
    afterChange();

    descInput.value = "";
    amountInput.value = "";
  });

  // One listener for all edit/delete buttons of this card
  list.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-index]");
    if (!btn) return;
    const index = parseInt(btn.dataset.index, 10);
    if (btn.classList.contains("delete-btn")) {
      askDeleteExpense(cardObj, index);
    } else if (btn.classList.contains("edit-btn")) {
      editExpense(cardObj, index);
    }
  });

  metaInput.addEventListener("input", recalcAll);

  if (custom) {
    card.querySelector(".delete-category-btn")
      .addEventListener("click", () => askDeleteCategory(cardObj));
  }

  cardObj.refresh();
  budgetContainer.appendChild(card);
  cards.push(cardObj);
  return cardObj;
}

/* ---------- Expenses: edit, delete, limit warning ---------- */

function showLimitModal(cardObj) {
  const message = limitModal.querySelector('#limitModalMessage');
  message.textContent =
    `You have exceeded the budget limit for ${cardObj.cat.name}. The limit is $${cardObj.getLimit().toFixed(2)}.`;
  limitModal.classList.add('active');
}

function askDeleteExpense(cardObj, index) {
  pendingExpenseDelete = { cardObj, index };
  deleteModal.classList.add('active');
}

function editExpense(cardObj, index) {
  const expense = cardObj.expenses[index];
  const li = cardObj.card.querySelectorAll('.list li')[index];

  const editForm = document.createElement('div');
  editForm.classList.add('edit-form');
  editForm.innerHTML = `
    <input type="text" class="edit-desc" value="${escapeHTML(expense.desc)}" placeholder="Description">
    <input type="number" class="edit-amount" value="${expense.amount}" placeholder="Amount" step="0.01">
    <div class="edit-form-buttons">
      <button class="edit-form-btn cancel">Cancel</button>
      <button class="edit-form-btn save">Save</button>
    </div>
  `;

  li.innerHTML = '';
  li.appendChild(editForm);

  const descInput = li.querySelector('.edit-desc');
  const amountInput = li.querySelector('.edit-amount');

  li.querySelector('.edit-form-btn.cancel').addEventListener('click', () => {
    cardObj.refresh();
  });

  li.querySelector('.edit-form-btn.save').addEventListener('click', () => {
    const newDesc = descInput.value.trim();
    const newAmount = parseFloat(amountInput.value);

    if (!newDesc || isNaN(newAmount) || newAmount <= 0) {
      alert('Please enter valid description and amount.');
      return;
    }

    const newTotal = cardObj.getTotal() - expense.amount + newAmount;
    if (newTotal > cardObj.getLimit() + 0.005) {
      showLimitModal(cardObj);
      return;
    }

    expense.desc = newDesc;
    expense.amount = newAmount;
    cardObj.refresh();
    afterChange();
  });
}

/* ---------- Custom categories ---------- */

function openAddCategoryModal() {
  addCategoryModal.classList.add('active');
  document.getElementById('catName').value = '';
  document.getElementById('catIcon').value = 'fas fa-tag';
  document.getElementById('catColor').value = '#4caf50';
  document.getElementById('catName').focus();
}

function closeAddCategoryModal() {
  addCategoryModal.classList.remove('active');
}

function addCategory() {
  const nameField = document.getElementById('catName');
  const name = nameField.value.trim().slice(0, MAX_NAME_LENGTH);

  if (!name) {
    alert("Please enter a category name.");
    nameField.focus();
    return;
  }

  const newCat = {
    name,
    icon: safeIconClass(document.getElementById('catIcon').value),
    color: safeColor(document.getElementById('catColor').value)
  };

  customCategories.push(newCat);
  saveCustomCategories();
  createCard(newCat, { custom: true });
  closeAddCategoryModal();
  recalcAll();
}

function askDeleteCategory(cardObj) {
  pendingCategoryDelete = cardObj;
  const count = cardObj.expenses.length;
  document.getElementById('deleteCategoryMessage').textContent =
    `Delete "${cardObj.cat.name}"` +
    (count ? ` and its ${count} expense${count > 1 ? 's' : ''}?` : '?') +
    ' This action cannot be undone.';
  deleteCategoryModal.classList.add('active');
}

function deleteCategory(cardObj) {
  cardObj.card.remove();
  cards.splice(cards.indexOf(cardObj), 1);
  customCategories.splice(customCategories.indexOf(cardObj.cat), 1);
  saveCustomCategories();
  recalcAll();
}

/* ---------- Totals, warning and chart ---------- */

function checkPercentages() {
  let sum = 0;
  cards.forEach(c => sum += parseFloat(c.metaInput.value) || 0);

  if (sum < 100) {
    warningMsg.textContent = `⚠️ Percentages are below 100% (Current: ${sum}%). Adjust to reach 100%.`;
  } else if (sum > 100) {
    warningMsg.textContent = `⚠️ Percentages exceed 100% (Current: ${sum}%). Reduce to reach 100%.`;
  } else {
    warningMsg.textContent = "";
  }
}

function updateSummary() {
  const budget = parseFloat(budgetInput.value) || 0;
  let spent = 0;
  cards.forEach(c => spent += c.getTotal());

  summarySpent.textContent = spent.toFixed(2);
  summaryRemaining.textContent = (budget - spent).toFixed(2);
  summaryPercent.textContent = budget > 0 ? ((spent / budget) * 100).toFixed(1) : 0;
}

function updateChart() {
  if (typeof Chart === 'undefined') return; // Chart.js did not load

  const labels = cards.map(c => c.cat.name);
  const spentData = cards.map(c => c.getTotal());
  const limitData = cards.map(c => c.getLimit());

  if (chart) {
    chart.data.labels = labels;
    chart.data.datasets[0].data = spentData;
    chart.data.datasets[1].data = limitData;
    chart.update();
    return;
  }

  const ctx = document.getElementById('chartCanvas').getContext('2d');
  chart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Spent',
          data: spentData,
          backgroundColor: 'rgba(255, 99, 132, 0.7)',
          borderColor: 'rgba(255, 99, 132, 1)',
          borderWidth: 1
        },
        {
          label: 'Limit',
          data: limitData,
          backgroundColor: 'rgba(54, 162, 235, 0.7)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: { beginAtZero: true, title: { display: true, text: 'Amount ($)' } },
        x: { title: { display: true, text: 'Categories' } }
      },
      plugins: {
        title: { display: true, text: 'Budget vs. Spending by Category' }
      }
    }
  });
}

// After a budget or percentage change: recalculate every limit
function recalcAll() {
  cards.forEach(c => c.recalcLimit());
  checkPercentages();
  updateSummary();
  updateChart();
  saveData();
}

// After an expense change: limits stay the same
function afterChange() {
  updateSummary();
  updateChart();
  saveData();
}

/* ---------- Start ---------- */

function buildDefaultCards(savedCards = []) {
  defaultCategories.forEach((cat, i) => {
    createCard(cat, { initialData: savedCards[i] });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initTheme();

  const saved = readJSON(STORAGE_KEY, {});
  const savedCards = Array.isArray(saved.cards) ? saved.cards : [];

  customCategories = readJSON(CUSTOM_KEY, [])
    .filter(c => c && c.name)
    .map(c => ({
      name: String(c.name).slice(0, MAX_NAME_LENGTH),
      icon: safeIconClass(c.icon),
      color: safeColor(c.color)
    }));

  budgetInput.value = saved.totalBudget || '';

  buildDefaultCards(savedCards);
  customCategories.forEach((cat, i) => {
    createCard(cat, { custom: true, initialData: savedCards[defaultCategories.length + i] });
  });

  recalcAll();

  themeToggle.addEventListener('click', toggleTheme);
  budgetInput.addEventListener('input', recalcAll);

  // Delete expense modal
  deleteModal.querySelector('.modal-btn.confirm').addEventListener('click', () => {
    if (pendingExpenseDelete) {
      const { cardObj, index } = pendingExpenseDelete;
      cardObj.expenses.splice(index, 1);
      cardObj.refresh();
      afterChange();
    }
    pendingExpenseDelete = null;
    deleteModal.classList.remove('active');
  });
  deleteModal.querySelector('.modal-btn.cancel').addEventListener('click', () => {
    pendingExpenseDelete = null;
    deleteModal.classList.remove('active');
  });

  // Limit exceeded modal
  limitModal.querySelector('.modal-btn.confirm').addEventListener('click', () => {
    limitModal.classList.remove('active');
  });

  // Delete category modal
  document.getElementById('confirmDeleteCategory').addEventListener('click', () => {
    if (pendingCategoryDelete) deleteCategory(pendingCategoryDelete);
    pendingCategoryDelete = null;
    deleteCategoryModal.classList.remove('active');
  });
  document.getElementById('cancelDeleteCategory').addEventListener('click', () => {
    pendingCategoryDelete = null;
    deleteCategoryModal.classList.remove('active');
  });

  // Add category modal
  document.getElementById('addCategoryBtn').addEventListener('click', openAddCategoryModal);
  document.getElementById('cancelAddCategory').addEventListener('click', closeAddCategoryModal);
  document.getElementById('confirmAddCategory').addEventListener('click', addCategory);
  addCategoryModal.addEventListener('click', (e) => {
    if (e.target === addCategoryModal) closeAddCategoryModal();
  });

  // Reset everything
  document.getElementById("resetBudget").addEventListener("click", () => {
    if (!confirm("Are you sure you want to reset all data? This action cannot be undone.")) return;

    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(CUSTOM_KEY);

    cards = [];
    customCategories = [];
    budgetContainer.innerHTML = '';
    budgetInput.value = '';

    buildDefaultCards();
    recalcAll();
  });
});
