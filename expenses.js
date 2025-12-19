// expenses.js - Sistem Manajemen Pengeluaran EggTrack

// ==================== KONFIGURASI ====================
const EXPENSES_CONFIG = {
    APP_NAME: 'EggTrack Expenses',
    API_URL: 'https://script.google.com/macros/s/AKfycbw33dktX5-SK_8A84pVDpKh8JtUQOhHGg6rB54CWO4hdlpUhgfBwPuKSMqoJ18QsZBp/exec',
    AUTO_REFRESH_INTERVAL: 60000 // 1 menit
};

// ==================== VARIABEL GLOBAL ====================
let expensesData = [];
let autoRefreshInterval = null;

// ==================== DATA DEMO ====================
const initializeDemoData = () => {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    // Generate demo data for expenses
    expensesData = [
        { id: 1, date: today, category: 'Bahan Baku', description: 'Pakan Ayam Premium', amount: 1500000, paymentMethod: 'Transfer Bank', status: 'Selesai', notes: 'Pembelian bulanan' },
        { id: 2, date: today, category: 'Operasional', description: 'Listrik Kandang', amount: 750000, paymentMethod: 'Transfer Bank', status: 'Selesai', notes: 'Tagihan Januari' },
        { id: 3, date: today, category: 'Gaji Karyawan', description: 'Gaji Karyawan Kandang', amount: 4500000, paymentMethod: 'Tunai', status: 'Selesai', notes: 'Gaji bulan Januari' },
        { id: 4, date: yesterdayStr, category: 'Transportasi', description: 'Pengiriman Telur', amount: 350000, paymentMethod: 'E-Wallet', status: 'Selesai', notes: 'Biaya pengiriman ke distributor' },
        { id: 5, date: yesterdayStr, category: 'Peralatan', description: 'Kandang Baru', amount: 8500000, paymentMethod: 'Transfer Bank', status: 'Selesai', notes: 'Investasi peralatan' },
        { id: 6, date: '2024-01-25', category: 'Bahan Baku', description: 'Vitamin Unggas', amount: 1200000, paymentMethod: 'Transfer Bank', status: 'Selesai', notes: 'Stok vitamin 3 bulan' },
        { id: 7, date: '2024-01-20', category: 'Operasional', description: 'Air Bersih', amount: 650000, paymentMethod: 'Transfer Bank', status: 'Selesai', notes: 'Tagihan air' },
        { id: 8, date: '2024-01-15', category: 'Transportasi', description: 'Bensin Kendaraan', amount: 250000, paymentMethod: 'Tunai', status: 'Selesai', notes: 'Pengisian bensin' }
    ];
};

// ==================== INISIALISASI ====================
document.addEventListener('DOMContentLoaded', function() {
    console.log('Expenses page loading...');
    
    // 1. Cek autentikasi
    if (!checkAuth()) {
        return;
    }
    
    // 2. Inisialisasi data
    initializeDemoData();
    
    // 3. Setup event listeners
    setupEventListeners();
    
    // 4. Load data expenses
    loadExpensesData();
    
    // 5. Setup auto refresh
    setupAutoRefresh();
    
    console.log('Expenses page initialized successfully');
});

// ==================== FUNGSI AUTH ====================
function checkAuth() {
    const user = localStorage.getItem('eggUser');
    if (!user) {
        window.location.href = 'login.html';
        return false;
    }
    
    try {
        const userData = JSON.parse(user);
        return true;
    } catch (error) {
        console.error('Auth error:', error);
        localStorage.removeItem('eggUser');
        window.location.href = 'login.html';
        return false;
    }
}

// ==================== FUNGSI UTAMA ====================
function setupEventListeners() {
    // Simpan pengeluaran
    const saveBtn = document.getElementById('saveExpenses');
    if (saveBtn) {
        saveBtn.addEventListener('click', handleSaveExpenses);
    }
    
    // Pencarian
    const searchInput = document.getElementById('expensesSearch');
    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            searchExpenses(e.target.value);
        });
    }
    
    // Export
    const exportBtn = document.getElementById('exportExpenses');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportExpensesData);
    }
    
    // Refresh
    const refreshBtn = document.getElementById('refreshExpenses');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', function() {
            loadExpensesData();
            showToast('Data pengeluaran diperbarui', 'success');
        });
    }
    
    // Modal hidden reset form
    const addModal = document.getElementById('addExpensesModal');
    if (addModal) {
        addModal.addEventListener('hidden.bs.modal', function() {
            resetExpensesForm();
        });
    }
    
    // Set default date
    const dateInput = document.getElementById('expensesDate');
    if (dateInput) {
        dateInput.value = new Date().toISOString().split('T')[0];
    }
}

function setupAutoRefresh() {
    // Clear existing interval
    if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
    }
    
    // Set new interval
    autoRefreshInterval = setInterval(() => {
        refreshExpensesData();
    }, EXPENSES_CONFIG.AUTO_REFRESH_INTERVAL);
}

function refreshExpensesData() {
    // Refresh only stats
    updateExpensesStats();
}

// ==================== DATA LOADING ====================
async function loadExpensesData() {
    console.log('Loading expenses data...');
    
    // Show loading state
    showLoadingState(true);
    
    // Simulate API call
    setTimeout(() => {
        try {
            // Update all components
            updateExpensesStats();
            updateExpensesTable();
            
            // Hide loading state
            showLoadingState(false);
            
            // Show success message
            showToast('Data pengeluaran dimuat dengan sukses', 'success');
            
        } catch (error) {
            console.error('Error loading expenses data:', error);
            showToast('Gagal memuat data pengeluaran', 'danger');
            showLoadingState(false);
        }
    }, 800);
}

function updateExpensesStats() {
    const today = new Date().toISOString().split('T')[0];
    
    // Calculate stats
    const todayExpenses = expensesData
        .filter(e => e.date === today)
        .reduce((sum, e) => sum + e.amount, 0);
    
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);
    const weekExpenses = expensesData
        .filter(e => new Date(e.date) >= weekStart)
        .reduce((sum, e) => sum + e.amount, 0);
    
    const monthStart = new Date();
    monthStart.setDate(1);
    const monthExpenses = expensesData
        .filter(e => new Date(e.date) >= monthStart)
        .reduce((sum, e) => sum + e.amount, 0);
    
    const totalExpenses = expensesData
        .reduce((sum, e) => sum + e.amount, 0);
    
    // Update DOM elements
    document.getElementById('todayExpenses').textContent = formatCurrency(todayExpenses);
    document.getElementById('weekExpenses').textContent = formatCurrency(weekExpenses);
    document.getElementById('monthExpenses').textContent = formatCurrency(monthExpenses);
    document.getElementById('totalExpensesCard').textContent = formatCurrency(totalExpenses);
}

function updateExpensesTable() {
    const tbody = document.getElementById('expensesTableBody');
    if (!tbody) return;
    
    // Sort by date (newest first)
    const sortedData = [...expensesData].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    tbody.innerHTML = '';
    
    if (sortedData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-5">
                    <i class="bi bi-inbox display-4 text-muted mb-3"></i>
                    <p class="text-muted">Belum ada data pengeluaran</p>
                    <button class="btn btn-primary mt-2" data-bs-toggle="modal" data-bs-target="#addExpensesModal">
                        <i class="bi bi-plus-circle me-2"></i>Tambah Data Pengeluaran Pertama
                    </button>
                </td>
            </tr>
        `;
        return;
    }
    
    sortedData.forEach(expense => {
        const row = document.createElement('tr');
        row.className = 'expense-row';
        
        const statusClass = expense.status === 'Selesai' ? 'success' : 'warning';
        
        row.innerHTML = `
            <td>
                <div class="d-flex align-items-center">
                    <i class="bi bi-calendar-check me-2 text-primary"></i>
                    <div>
                        <div class="fw-bold">${formatDate(expense.date)}</div>
                    </div>
                </div>
            </td>
            <td>
                <span class="badge bg-info">${expense.category}</span>
            </td>
            <td>
                <div class="fw-bold">${expense.description}</div>
                ${expense.notes ? `<small class="text-muted">${expense.notes}</small>` : ''}
            </td>
            <td class="fw-bold text-danger">${formatCurrency(expense.amount)}</td>
            <td>
                <span class="badge bg-secondary">${expense.paymentMethod}</span>
            </td>
            <td>
                <span class="badge bg-${statusClass}">${expense.status}</span>
            </td>
            <td>
                <div class="btn-group btn-group-sm">
                    <button class="btn btn-outline-primary edit-expense-btn" data-id="${expense.id}">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-outline-danger delete-expense-btn" data-id="${expense.id}">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </td>
        `;
        
        tbody.appendChild(row);
    });
    
    // Add event listeners to action buttons
    addExpensesActionListeners();
}

function searchExpenses(query) {
    if (!query.trim()) {
        updateExpensesTable();
        return;
    }
    
    const searchTerm = query.toLowerCase();
    const filtered = expensesData.filter(expense => 
        expense.category.toLowerCase().includes(searchTerm) ||
        expense.description.toLowerCase().includes(searchTerm) ||
        expense.paymentMethod.toLowerCase().includes(searchTerm) ||
        expense.date.includes(query) ||
        expense.notes?.toLowerCase().includes(searchTerm)
    );
    
    displayFilteredExpenses(filtered);
}

function displayFilteredExpenses(data) {
    const tbody = document.getElementById('expensesTableBody');
    if (!tbody) return;
    
    if (data.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-4">
                    <i class="bi bi-search display-4 text-muted mb-3"></i>
                    <p class="text-muted">Tidak ada data yang sesuai dengan pencarian</p>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = '';
    
    data.forEach(expense => {
        const row = document.createElement('tr');
        row.className = 'expense-row';
        
        const statusClass = expense.status === 'Selesai' ? 'success' : 'warning';
        
        row.innerHTML = `
            <td>${formatDate(expense.date)}</td>
            <td><span class="badge bg-info">${expense.category}</span></td>
            <td>${expense.description}</td>
            <td class="fw-bold text-danger">${formatCurrency(expense.amount)}</td>
            <td><span class="badge bg-secondary">${expense.paymentMethod}</span></td>
            <td><span class="badge bg-${statusClass}">${expense.status}</span></td>
            <td>
                <div class="btn-group btn-group-sm">
                    <button class="btn btn-outline-primary edit-expense-btn" data-id="${expense.id}">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-outline-danger delete-expense-btn" data-id="${expense.id}">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </td>
        `;
        
        tbody.appendChild(row);
    });
    
    addExpensesActionListeners();
}

function addExpensesActionListeners() {
    // Edit buttons
    document.querySelectorAll('.edit-expense-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const expenseId = this.getAttribute('data-id');
            editExpense(expenseId);
        });
    });
    
    // Delete buttons
    document.querySelectorAll('.delete-expense-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const expenseId = this.getAttribute('data-id');
            deleteExpense(expenseId);
        });
    });
}

// ==================== CRUD OPERATIONS ====================
async function handleSaveExpenses() {
    const formData = {
        date: document.getElementById('expensesDate').value,
        category: document.getElementById('expensesCategory').value,
        description: document.getElementById('expensesDescription').value,
        amount: parseInt(document.getElementById('expensesAmount').value) || 0,
        paymentMethod: document.getElementById('expensesPayment').value,
        notes: document.getElementById('expensesNotes').value,
        status: 'Selesai'
    };

    // Validasi
    if (!formData.date || !formData.category || !formData.description || !formData.amount) {
        showToast('Harap isi semua field yang wajib diisi', 'danger');
        return;
    }

    // Tampilkan loading
    const saveBtn = document.getElementById('saveExpenses');
    const originalText = saveBtn.innerHTML;
    saveBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Menyimpan...';
    saveBtn.disabled = true;

    try {
        // Generate new ID (simulate API response)
        const newId = expensesData.length > 0 ? Math.max(...expensesData.map(e => e.id)) + 1 : 1;
        const newExpense = { id: newId, ...formData };
        
        // Add to data array
        expensesData.push(newExpense);
        
        // Show success message
        showToast('Data pengeluaran berhasil disimpan', 'success');
        
        // Hide modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('addExpensesModal'));
        modal.hide();
        
        // Reload data
        loadExpensesData();
        
    } catch (error) {
        console.error('Error saving expense:', error);
        showToast('Terjadi kesalahan saat menyimpan data pengeluaran', 'danger');
    } finally {
        // Reset button state
        saveBtn.innerHTML = originalText;
        saveBtn.disabled = false;
    }
}

function editExpense(id) {
    const expense = expensesData.find(e => e.id == id);
    if (!expense) {
        showToast('Data pengeluaran tidak ditemukan', 'warning');
        return;
    }
    
    // Isi form dengan data yang ada
    document.getElementById('expensesDate').value = expense.date;
    document.getElementById('expensesCategory').value = expense.category;
    document.getElementById('expensesDescription').value = expense.description;
    document.getElementById('expensesAmount').value = expense.amount;
    document.getElementById('expensesPayment').value = expense.paymentMethod;
    document.getElementById('expensesNotes').value = expense.notes || '';
    
    // Ubah modal untuk edit
    const modal = document.getElementById('addExpensesModal');
    const modalTitle = modal.querySelector('.modal-title');
    const saveBtn = modal.querySelector('#saveExpenses');
    
    modalTitle.innerHTML = '<i class="bi bi-pencil me-2"></i>Edit Pengeluaran';
    saveBtn.innerHTML = '<i class="bi bi-check-circle me-2"></i>Update Pengeluaran';
    
    // Update event listener untuk edit
    saveBtn.onclick = function() { handleUpdateExpense(id); };
    
    // Tampilkan modal
    new bootstrap.Modal(modal).show();
}

function handleUpdateExpense(id) {
    const formData = {
        date: document.getElementById('expensesDate').value,
        category: document.getElementById('expensesCategory').value,
        description: document.getElementById('expensesDescription').value,
        amount: parseInt(document.getElementById('expensesAmount').value) || 0,
        paymentMethod: document.getElementById('expensesPayment').value,
        notes: document.getElementById('expensesNotes').value,
        status: 'Selesai'
    };

    if (!formData.date || !formData.category || !formData.description || !formData.amount) {
        showToast('Harap isi semua field yang wajib diisi', 'danger');
        return;
    }

    try {
        // Find and update expense
        const expenseIndex = expensesData.findIndex(e => e.id == id);
        if (expenseIndex !== -1) {
            expensesData[expenseIndex] = { id: parseInt(id), ...formData };
        }
        
        showToast('Data pengeluaran berhasil diupdate', 'success');
        
        // Hide modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('addExpensesModal'));
        modal.hide();
        
        // Reload data
        loadExpensesData();
        
    } catch (error) {
        console.error('Error updating expense:', error);
        showToast('Terjadi kesalahan saat mengupdate data pengeluaran', 'danger');
    }
}

function deleteExpense(id) {
    if (!confirm('Apakah Anda yakin ingin menghapus data pengeluaran ini?')) {
        return;
    }

    try {
        // Remove from data array
        const expenseIndex = expensesData.findIndex(e => e.id == id);
        if (expenseIndex !== -1) {
            expensesData.splice(expenseIndex, 1);
        }
        
        showToast('Data pengeluaran berhasil dihapus', 'success');
        
        // Reload data
        loadExpensesData();
        
    } catch (error) {
        console.error('Error deleting expense:', error);
        showToast('Terjadi kesalahan saat menghapus data pengeluaran', 'danger');
    }
}

function resetExpensesForm() {
    const modal = document.getElementById('addExpensesModal');
    const modalTitle = modal.querySelector('.modal-title');
    const saveBtn = modal.querySelector('#saveExpenses');
    
    modalTitle.innerHTML = '<i class="bi bi-plus-circle me-2"></i>Tambah Pengeluaran';
    saveBtn.innerHTML = '<i class="bi bi-check-circle me-2"></i>Simpan Pengeluaran';
    saveBtn.onclick = function() { handleSaveExpenses(); };
    
    document.getElementById('expensesForm').reset();
    document.getElementById('expensesDate').value = new Date().toISOString().split('T')[0];
}

// ==================== EXPORT FUNCTIONS ====================
function exportExpensesData() {
    if (expensesData.length === 0) {
        showToast('Tidak ada data untuk diexport', 'warning');
        return;
    }

    const headers = ['Tanggal', 'Kategori', 'Deskripsi', 'Jumlah', 'Metode Pembayaran', 'Status', 'Catatan'];
    const csvContent = [
        headers.join(','),
        ...expensesData.map(row => [
            formatDate(row.date),
            `"${row.category}"`,
            `"${row.description}"`,
            row.amount,
            `"${row.paymentMethod}"`,
            row.status,
            `"${row.notes || ''}"`
        ].join(','))
    ].join('\n');

    downloadCSV(csvContent, `pengeluaran_${new Date().toISOString().split('T')[0]}.csv`);
    showToast('Data pengeluaran berhasil diexport', 'success');
}

function downloadCSV(content, filename) {
    const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// ==================== HELPER FUNCTIONS ====================
function showLoadingState(show) {
    const tbody = document.getElementById('expensesTableBody');
    if (!tbody) return;
    
    if (show) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-4">
                    <div class="loading-spinner mx-auto"></div>
                    <div class="loading-text mt-2">Memuat data pengeluaran...</div>
                </td>
            </tr>
        `;
    }
    
    // Disable buttons during loading
    const buttons = document.querySelectorAll('#refreshExpenses, #exportExpenses');
    buttons.forEach(btn => {
        if (btn) btn.disabled = show;
    });
}

function formatDate(dateString) {
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString;
        
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) {
            return 'Hari ini';
        } else if (diffDays === 1) {
            return 'Kemarin';
        } else if (diffDays < 7) {
            return `${diffDays} hari lalu`;
        } else {
            return date.toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
            });
        }
    } catch (e) {
        return dateString;
    }
}

function formatCurrency(amount) {
    if (amount >= 1000000000) {
        return 'Rp ' + (amount / 1000000000).toFixed(1) + ' M';
    } else if (amount >= 1000000) {
        return 'Rp ' + (amount / 1000000).toFixed(1) + ' jt';
    } else if (amount >= 1000) {
        return 'Rp ' + (amount / 1000).toFixed(0) + ' rb';
    }
    return 'Rp ' + amount.toLocaleString('id-ID');
}

function showToast(message, type = 'info') {
    // Create or get container
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container position-fixed top-0 end-0 p-3';
        document.body.appendChild(container);
    }
    
    // Create toast
    const toastId = 'toast-' + Date.now();
    const toast = document.createElement('div');
    toast.className = `toast align-items-center text-bg-${type} border-0`;
    toast.id = toastId;
    
    const icon = {
        'success': 'bi-check-circle',
        'danger': 'bi-x-circle',
        'warning': 'bi-exclamation-triangle',
        'info': 'bi-info-circle'
    }[type] || 'bi-info-circle';
    
    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body d-flex align-items-center">
                <i class="bi ${icon} me-2 fs-5"></i>
                ${message}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
    `;
    
    container.appendChild(toast);
    
    // Initialize and show toast
    const bsToast = new bootstrap.Toast(toast, { 
        delay: 3000,
        autohide: true 
    });
    bsToast.show();
    
    // Remove after hidden
    toast.addEventListener('hidden.bs.toast', () => {
        toast.remove();
    });
}

// ==================== STYLES ====================
function addExpensesStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .expense-row {
            transition: background-color 0.2s ease;
        }
        
        .expense-row:hover {
            background-color: rgba(67, 97, 238, 0.05) !important;
        }
        
        .loading-text {
            margin-top: 10px;
            font-size: 0.9rem;
            color: var(--gray);
        }
        
        .btn-group-sm .btn {
            padding: 0.25rem 0.5rem;
        }
        
        .badge {
            font-size: 0.75rem;
        }
        
        .text-danger {
            color: #dc3545 !important;
        }
        
        mark {
            background-color: #ffeb3b;
            padding: 0 2px;
            border-radius: 2px;
        }
    `;
    document.head.appendChild(style);
}

// Add styles when page loads
addExpensesStyles();

// ==================== WINDOW EXPORTS ====================
window.searchExpenses = searchExpenses;
window.exportExpensesData = exportExpensesData;
window.loadExpensesData = loadExpensesData;