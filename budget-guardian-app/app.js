// Budget Guardian - Expense Tracker App
// Addresses the pain point: 59% of Americans stressed by inflation, 38% by unexpected expenses

class BudgetGuardian {
    constructor() {
        this.budget = parseFloat(localStorage.getItem('budget')) || 0;
        this.expenses = JSON.parse(localStorage.getItem('expenses')) || [];
        this.init();
    }

    init() {
        this.loadBudget();
        this.loadExpenses();
        this.setupEventListeners();
        this.updateDisplay();
    }

    setupEventListeners() {
        document.getElementById('expenseForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addExpense();
        });
    }

    setBudget() {
        const budgetInput = document.getElementById('monthlyBudget');
        const amount = parseFloat(budgetInput.value);

        if (amount && amount > 0) {
            this.budget = amount;
            localStorage.setItem('budget', amount);
            budgetInput.value = '';
            this.updateDisplay();
            this.showAlert('Budget set successfully!', 'success');
        }
    }

    loadBudget() {
        const budgetInput = document.getElementById('monthlyBudget');
        if (this.budget > 0) {
            budgetInput.placeholder = `Current: $${this.budget.toFixed(2)}`;
        }
    }

    addExpense() {
        const name = document.getElementById('expenseName').value;
        const amount = parseFloat(document.getElementById('expenseAmount').value);
        const category = document.getElementById('expenseCategory').value;

        if (name && amount && category) {
            const expense = {
                id: Date.now(),
                name,
                amount,
                category,
                date: new Date().toISOString()
            };

            this.expenses.unshift(expense);
            localStorage.setItem('expenses', JSON.stringify(this.expenses));

            document.getElementById('expenseForm').reset();
            this.updateDisplay();

            // Check if this expense pushes budget over limit
            if (category === 'unexpected') {
                this.showAlert(`⚠️ Unexpected expense added: $${amount.toFixed(2)}`, 'warning');
            }

            this.checkBudgetWarnings();
        }
    }

    deleteExpense(id) {
        this.expenses = this.expenses.filter(exp => exp.id !== id);
        localStorage.setItem('expenses', JSON.stringify(this.expenses));
        this.updateDisplay();
    }

    clearAllExpenses() {
        if (confirm('Are you sure you want to clear all expenses?')) {
            this.expenses = [];
            localStorage.setItem('expenses', JSON.stringify(this.expenses));
            this.updateDisplay();
            this.showAlert('All expenses cleared', 'success');
        }
    }

    loadExpenses() {
        const container = document.getElementById('expensesList');

        if (this.expenses.length === 0) {
            container.innerHTML = '<p class="empty-state">No expenses yet. Start tracking!</p>';
            return;
        }

        container.innerHTML = this.expenses.map(expense => {
            const date = new Date(expense.date);
            const formattedDate = date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });

            return `
                <div class="expense-item ${expense.category === 'unexpected' ? 'unexpected' : ''}">
                    <div class="expense-info">
                        <div class="expense-name">${this.escapeHtml(expense.name)}</div>
                        <div class="expense-meta">
                            ${this.getCategoryLabel(expense.category)} • ${formattedDate}
                        </div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <span class="expense-amount">$${expense.amount.toFixed(2)}</span>
                        <button class="delete-btn" onclick="app.deleteExpense(${expense.id})">Delete</button>
                    </div>
                </div>
            `;
        }).join('');
    }

    updateDisplay() {
        this.loadExpenses();
        this.updateBudgetDisplay();
        this.updateCategoryStats();
    }

    updateBudgetDisplay() {
        const totalSpent = this.calculateTotalSpent();
        const remaining = this.budget - totalSpent;
        const percentage = this.budget > 0 ? (totalSpent / this.budget) * 100 : 0;

        document.getElementById('budgetAmount').textContent = `$${this.budget.toFixed(2)}`;
        document.getElementById('spentAmount').textContent = `$${totalSpent.toFixed(2)}`;
        document.getElementById('remainingAmount').textContent = `$${remaining.toFixed(2)}`;

        const progressFill = document.getElementById('progressFill');
        progressFill.style.width = `${Math.min(percentage, 100)}%`;

        // Update progress bar color based on spending
        progressFill.classList.remove('warning', 'danger');
        if (percentage >= 100) {
            progressFill.classList.add('danger');
        } else if (percentage >= 75) {
            progressFill.classList.add('warning');
        }
    }

    updateCategoryStats() {
        const container = document.getElementById('categoryStats');
        const categoryTotals = {};

        this.expenses.forEach(expense => {
            if (!categoryTotals[expense.category]) {
                categoryTotals[expense.category] = 0;
            }
            categoryTotals[expense.category] += expense.amount;
        });

        const entries = Object.entries(categoryTotals);

        if (entries.length === 0) {
            container.innerHTML = '<p class="empty-state">Add expenses to see statistics</p>';
            return;
        }

        // Sort by amount descending
        entries.sort((a, b) => b[1] - a[1]);

        container.innerHTML = entries.map(([category, amount]) => `
            <div class="category-item">
                <span class="category-name">${this.getCategoryLabel(category)}</span>
                <span class="category-amount">$${amount.toFixed(2)}</span>
            </div>
        `).join('');
    }

    calculateTotalSpent() {
        return this.expenses.reduce((total, expense) => total + expense.amount, 0);
    }

    checkBudgetWarnings() {
        if (this.budget === 0) return;

        const totalSpent = this.calculateTotalSpent();
        const percentage = (totalSpent / this.budget) * 100;

        if (percentage >= 100) {
            this.showAlert('🚨 Budget exceeded! You\'ve spent more than your monthly budget.', 'danger');
        } else if (percentage >= 90) {
            this.showAlert('⚠️ Warning: You\'ve used 90% of your budget!', 'warning');
        } else if (percentage >= 75) {
            this.showAlert('⚠️ Alert: You\'ve used 75% of your budget.', 'warning');
        }
    }

    showAlert(message, type = 'info') {
        const banner = document.getElementById('alertBanner');
        const messageEl = document.getElementById('alertMessage');

        messageEl.textContent = message;
        banner.style.display = 'flex';

        if (type === 'success') {
            banner.style.background = '#51cf66';
        } else if (type === 'warning') {
            banner.style.background = '#ffa94d';
        } else if (type === 'danger') {
            banner.style.background = '#ff6b6b';
        }

        // Auto-hide after 5 seconds
        setTimeout(() => {
            banner.style.display = 'none';
        }, 5000);
    }

    getCategoryLabel(category) {
        const labels = {
            unexpected: '💥 Unexpected',
            groceries: '🛒 Groceries',
            utilities: '⚡ Utilities',
            rent: '🏠 Rent/Mortgage',
            medical: '🏥 Medical',
            transport: '🚗 Transport',
            other: '📦 Other'
        };
        return labels[category] || category;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize app
const app = new BudgetGuardian();

// Global functions for HTML onclick handlers
function setBudget() {
    app.setBudget();
}

function clearAllExpenses() {
    app.clearAllExpenses();
}

function closeAlert() {
    document.getElementById('alertBanner').style.display = 'none';
}
