const categories = [
  { 
    name: "Financial Freedom", 
    icon: "fas fa-chart-line",
    class: "card-financial"
  },
  { 
    name: "Fixed Costs", 
    icon: "fas fa-home",
    class: "card-fixed"
  },
  { 
    name: "Pleasures", 
    icon: "fas fa-smile",
    class: "card-pleasures"
  },
  { 
    name: "Goals", 
    icon: "fas fa-bullseye",
    class: "card-goals"
  },
  { 
    name: "Education", 
    icon: "fas fa-graduation-cap",
    class: "card-education"
  },
  { 
    name: "Comfort", 
    icon: "fas fa-couch",
    class: "card-comfort"
  }
];

const budgetContainer = document.getElementById("budgetContainer");
const warningMsg = document.getElementById("warningMsg");
const summarySpent = document.getElementById("summarySpent");
const summaryRemaining = document.getElementById("summaryRemaining");
const summaryPercent = document.getElementById("summaryPercent");
const deleteModal = document.getElementById("deleteModal");
const limitModal = document.getElementById("limitModal");
const themeToggle = document.getElementById("themeToggle");
let totalBudget = 0;

let cards = [];
let expenseToDelete = null;
let chart = null;


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


function loadSavedData() {
  const savedData = localStorage.getItem('budgetData');
  if (savedData) {
    const data = JSON.parse(savedData);
    document.getElementById("totalBudget").value = data.totalBudget || '';
    totalBudget = data.totalBudget || 0;
    
    if (data.cards) {
      
      setTimeout(() => {
        data.cards.forEach((savedCard, index) => {
          if (cards[index]) {
            cards[index].metaInput.value = savedCard.targetPercentage;
            cards[index].expenses = savedCard.expenses;
            cards[index].updateTotal(savedCard.total);
            cards[index].renderExpenses();
            cards[index].updateLimit();
          }
        });
        updateSummary();
        updateChart();
      }, 100);
    }
  }
}


function saveData() {
  const dataToSave = {
    totalBudget: totalBudget,
    cards: cards.map(card => ({
      targetPercentage: parseFloat(card.metaInput.value) || 0,
      expenses: card.expenses,
      total: card.getTotal()
    }))
  };
  localStorage.setItem('budgetData', JSON.stringify(dataToSave));
}


function initApp() {
  categories.forEach(cat => {
    const card = document.createElement("div");
    card.classList.add("card", cat.class);
    card.innerHTML = `
      <h2><i class="${cat.icon}"></i> ${cat.name}</h2>
      <div class="meta">
        <label for="target">Target (%):</label>
        <input type="number" class="metaInput" value="${(100 / categories.length).toFixed(0)}" min="0" max="100"> 
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
    budgetContainer.appendChild(card);

    const metaInput = card.querySelector(".metaInput");
    const totalSpan = card.querySelector(".total");
    const limitSpan = card.querySelector(".limit");
    const progressBar = card.querySelector(".progress-bar");
    const list = card.querySelector(".list");

    let total = 0;
    let limit = 0;
    let expenses = [];

    function updateLimit() {
      totalBudget = parseFloat(document.getElementById("totalBudget").value) || 0;
      const target = parseFloat(metaInput.value);
      limit = (target / 100) * totalBudget;
      limitSpan.textContent = limit.toFixed(2);
      updateProgress();
      checkPercentages();
      updateSummary();
      updateChart();
      saveData();
    }

    function updateProgress() {
      if (limit > 0) {
        let percent = (total / limit) * 100;
        progressBar.style.width = Math.min(percent, 100) + "%";
        if (percent < 70) {
          progressBar.style.background = "#4caf50"; // verde
        } else if (percent < 100) {
          progressBar.style.background = "#ff9800"; // amarelo
        } else {
          progressBar.style.background = "#f44336"; // vermelho
        }
      }
    }

  
    function renderExpenses() {
      list.innerHTML = '';
      expenses.forEach((expense, index) => {
        const li = document.createElement("li");
        li.innerHTML = `
          <span class="expense-desc">${expense.desc}</span> 
          <span class="expense-amount">$${expense.amount.toFixed(2)}</span>
          <div class="expense-actions">
            <button class="edit-btn" data-index="${index}"><i class="fas fa-edit"></i></button>
            <button class="delete-btn" data-index="${index}"><i class="fas fa-trash"></i></button>
          </div>
        `;
        list.appendChild(li);
      });

     
      attachExpenseListeners(card);
    }

   
    function checkExpenseLimit(amount) {
      return total + amount <= limit;
    }

   
    function showLimitModal() {
      const modalMessage = limitModal.querySelector('#limitModalMessage');
      modalMessage.textContent = `You have exceeded the budget limit for ${cat.name}. The limit is $${limit.toFixed(2)}.`;
      limitModal.classList.add('active');
      
      const confirmBtn = limitModal.querySelector('.modal-btn.confirm');
      
      const handleConfirm = () => {
        limitModal.classList.remove('active');
        confirmBtn.removeEventListener('click', handleConfirm);
      };
      
      confirmBtn.addEventListener('click', handleConfirm);
    }

    
    document.getElementById("totalBudget").addEventListener("input", updateLimit);

  
    metaInput.addEventListener("input", updateLimit);

   
    card.querySelector(".addBtn").addEventListener("click", () => {
      const desc = card.querySelector(".desc").value;
      const amount = parseFloat(card.querySelector(".amount").value);

      if (!desc || isNaN(amount) || amount <= 0) {
        alert("Please enter a valid description and amount.");
        return;
      }

      
      if (!checkExpenseLimit(amount)) {
        showLimitModal();
        return;
      }

      expenses.push({ desc, amount });
      total += amount;
      totalSpan.textContent = total.toFixed(2);

      renderExpenses();
      updateProgress();
      updateSummary();
      updateChart();
      saveData();

      card.querySelector(".desc").value = "";
      card.querySelector(".amount").value = "";
    });

    cards.push({ 
      card, 
      metaInput, 
      totalSpan, 
      limitSpan, 
      progressBar, 
      updateLimit, 
      updateProgress, 
      getTotal: () => total,
      expenses,
      renderExpenses,
      updateTotal: (newTotal) => { total = newTotal; totalSpan.textContent = total.toFixed(2); }
    });
  });
}


function attachExpenseListeners(cardElement) {
  const deleteButtons = cardElement.querySelectorAll('.delete-btn');
  const editButtons = cardElement.querySelectorAll('.edit-btn');
  
  deleteButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const index = parseInt(e.currentTarget.getAttribute('data-index'));
      const cardObj = cards.find(c => c.card === cardElement);
      showDeleteModal(cardObj, index);
    });
  });
  
  editButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const index = parseInt(e.currentTarget.getAttribute('data-index'));
      const cardObj = cards.find(c => c.card === cardElement);
      editExpense(cardObj, index);
    });
  });
}

function showDeleteModal(cardObj, index) {
  expenseToDelete = { cardObj, index };
  deleteModal.classList.add('active');
  

  const confirmBtn = deleteModal.querySelector('.modal-btn.confirm');
  const cancelBtn = deleteModal.querySelector('.modal-btn.cancel');
  
  const handleConfirm = () => {
    deleteExpense(cardObj, index);
    deleteModal.classList.remove('active');
    confirmBtn.removeEventListener('click', handleConfirm);
    cancelBtn.removeEventListener('click', handleCancel);
  };
  
  const handleCancel = () => {
    deleteModal.classList.remove('active');
    confirmBtn.removeEventListener('click', handleConfirm);
    cancelBtn.removeEventListener('click', handleCancel);
  };
  
  confirmBtn.addEventListener('click', handleConfirm);
  cancelBtn.addEventListener('click', handleCancel);
}


function deleteExpense(cardObj, index) {
  const expense = cardObj.expenses[index];
  cardObj.updateTotal(cardObj.getTotal() - expense.amount);
  cardObj.expenses.splice(index, 1);
  cardObj.renderExpenses();
  cardObj.updateProgress();
  updateSummary();
  updateChart();
  saveData();
}


function editExpense(cardObj, index) {
  const expense = cardObj.expenses[index];
  const li = cardObj.card.querySelectorAll('.list li')[index];
  
 
  const editForm = document.createElement('div');
  editForm.classList.add('edit-form');
  editForm.innerHTML = `
    <input type="text" class="edit-desc" value="${expense.desc}" placeholder="Description">
    <input type="number" class="edit-amount" value="${expense.amount}" placeholder="Amount" step="0.01">
    <div class="edit-form-buttons">
      <button class="edit-form-btn cancel">Cancel</button>
      <button class="edit-form-btn save">Save</button>
    </div>
  `;
  
  li.innerHTML = '';
  li.appendChild(editForm);
  
 
  const cancelBtn = li.querySelector('.edit-form-btn.cancel');
  const saveBtn = li.querySelector('.edit-form-btn.save');
  const descInput = li.querySelector('.edit-desc');
  const amountInput = li.querySelector('.edit-amount');
  
  cancelBtn.addEventListener('click', () => {
    cardObj.renderExpenses();
  });
  
  saveBtn.addEventListener('click', () => {
    const newDesc = descInput.value;
    const newAmount = parseFloat(amountInput.value);
    
    if (!newDesc || isNaN(newAmount) || newAmount <= 0) {
      alert('Please enter valid description and amount.');
      return;
    }
    
  
    const newTotal = cardObj.getTotal() - expense.amount + newAmount;
    if (newTotal > (parseFloat(cardObj.limitSpan.textContent) || 0)) {
      showLimitModal();
      return;
    }
    
    
    cardObj.updateTotal(newTotal);
    
   
    expense.desc = newDesc;
    expense.amount = newAmount;
    
    cardObj.renderExpenses();
    cardObj.updateProgress();
    updateSummary();
    updateChart();
    saveData();
  });
}

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
  totalBudget = parseFloat(document.getElementById("totalBudget").value) || 0;
  let spent = 0;
  cards.forEach(c => spent += c.getTotal());

  summarySpent.textContent = spent.toFixed(2);
  summaryRemaining.textContent = (totalBudget - spent).toFixed(2);
  summaryPercent.textContent = totalBudget > 0 ? ((spent / totalBudget) * 100).toFixed(1) : 0;
}


function updateChart() {
  const ctx = document.getElementById('chartCanvas').getContext('2d');
  
 
  if (chart) {
    chart.destroy();
  }
  
  const labels = categories.map(cat => cat.name);
  const spentData = cards.map(card => card.getTotal());
  const limitData = cards.map(card => parseFloat(card.limitSpan.textContent) || 0);
  
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
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Amount ($)'
          }
        },
        x: {
          title: {
            display: true,
            text: 'Categories'
          }
        }
      },
      plugins: {
        title: {
          display: true,
          text: 'Budget vs. Spending by Category'
        }
      }
    }
  });
}


document.getElementById("resetBudget").addEventListener("click", () => {
  if (confirm("Are you sure you want to reset all data? This action cannot be undone.")) {
   
    localStorage.removeItem('budgetData');

    
    budgetContainer.innerHTML = '';
    
 
    cards = [];
    totalBudget = 0;

   
    document.getElementById("totalBudget").value = "";
    warningMsg.textContent = "";
    summarySpent.textContent = "0";
    summaryRemaining.textContent = "0";
    summaryPercent.textContent = "0";

  
    if (chart) {
        chart.destroy();
    }
    
    
    initApp();
    
    
    updateChart();
  }
});


document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initApp();
    loadSavedData();
    themeToggle.addEventListener('click', toggleTheme);
    document.getElementById("totalBudget").addEventListener("input", saveData);
});