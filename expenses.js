// Konfigurasi Apps Script URL
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxpkV9khWzZ6CErdwpulFytH9UimnJ4NEhv8HPiGYUrSYvws5yhaoUPolqRwr1VD109/exec';

// Data pengeluaran
let expensesData = [];

// Inisialisasi saat halaman dimuat
document.addEventListener('DOMContentLoaded', function() {
    initializeExpenses();
});

// Fungsi inisialisasi pengeluaran
async function initializeExpenses() {
    // Set tanggal default
    document.getElementById('expensesDate').value = new Date().toISOString().split('T')[0];
    
    // Load data pengeluaran
    await loadExpensesData();
    
    // Setup event listeners
    setupEventListeners();
}

// Setup event listeners
function setupEventListeners() {
    // Simpan pengeluaran
    document.getElementById('saveExpenses').addEventListener('click', handleSaveExpenses);
    
    // Pencarian
    document.getElementById('expensesSearch').addEventListener('input', function(e) {
        searchExpenses(e.target.value);
    });
    
    // Export
    document.getElementById('exportExpenses').addEventListener('click', exportExpensesData);
    
    // Modal hidden reset form
    document.getElementById('addExpensesModal').addEventListener('hidden.bs.modal', function() {
        document.getElementById('expensesForm').reset();
        document.getElementById('expensesDate').value = new Date().toISOString().split('T')[0];
    });
}

// Fungsi untuk memuat data pengeluaran
async function loadExpensesData() {
    try {
        showLoadingState('expensesTableBody', true);
        
        const result = await fetchData('getExpenses');
        
        if (result && result.success) {
            expensesData = result.expenses || [];
            updateExpensesDisplay();
        } else {
            expensesData = [];
            updateExpensesDisplay();
            showToast('Gagal memuat data pengeluaran', 'danger');
        }
    } catch (error) {
        console.error('Error loading expenses data:', error);
        expensesData = [];
        updateExpensesDisplay();
        showToast('Terjadi kesalahan saat memuat data', 'danger');
    }
}

// Fungsi untuk menyimpan pengeluaran baru
async function saveExpensesData(formData) {
    try {
        const result = await sendData('addExpenses', formData);
        return result;
    } catch (error) {
        console.error('Error saving expenses:', error);
        return { success: false, message: error.message };
    }
}

// Handler untuk menyimpan pengeluaran
async function handleSaveExpenses() {
    const formData = {
        date: document.getElementById('expensesDate').value,
        category: document.getElementById('expensesCategory').value,
        description: document.getElementById('expensesDescription').value,
        amount: document.getElementById('expensesAmount').value,
        paymentMethod: document.getElementById('expensesPayment').value,
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
        const result = await saveExpensesData(formData);
        
        if (result.success) {
            showToast('Data pengeluaran berhasil disimpan', 'success');
            bootstrap.Modal.getInstance(document.getElementById('addExpensesModal')).hide();
            await loadExpensesData(); // Reload data
        } else {
            showToast(result.message || 'Gagal menyimpan data pengeluaran', 'danger');
        }
    } catch (error) {
        console.error('Error saving expenses:', error);
        showToast('Terjadi kesalahan saat menyimpan data pengeluaran', 'danger');
    } finally {
        // Reset button state
        saveBtn.innerHTML = originalText;
        saveBtn.disabled = false;
    }
}

// Fungsi untuk memperbarui tampilan pengeluaran
function updateExpensesDisplay() {
    updateExpensesStats();
    updateExpensesTable();
}

// Update statistik pengeluaran
function updateExpensesStats() {
    const today = new Date().toISOString().split('T')[0];
    
    // Pengeluaran hari ini
    const todayExpenses = expensesData.filter(e => e.date === today)
                                     .reduce((sum, e) => sum + parseInt(e.amount || 0), 0);
    document.getElementById('todayExpenses').textContent = formatCurrency(todayExpenses);
    
    // Pengeluaran minggu ini
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);
    const weekExpenses = expensesData.filter(e => new Date(e.date) >= weekStart)
                                    .reduce((sum, e) => sum + parseInt(e.amount || 0), 0);
    document.getElementById('weekExpenses').textContent = formatCurrency(weekExpenses);
    
    // Pengeluaran bulan ini
    const monthStart = new Date();
    monthStart.setDate(1);
    const monthExpenses = expensesData.filter(e => new Date(e.date) >= monthStart)
                                     .reduce((sum, e) => sum + parseInt(e.amount || 0), 0);
    document.getElementById('monthExpenses').textContent = formatCurrency(monthExpenses);
    
    // Total pengeluaran
    const totalExpenses = expensesData.reduce((sum, e) => sum + parseInt(e.amount || 0), 0);
    document.getElementById('totalExpensesCard').textContent = formatCurrency(totalExpenses);
}

// Update tabel pengeluaran
function updateExpensesTable() {
    const tbody = document.getElementById('expensesTableBody');
    
    if (expensesData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-4">
                    <i class="bi bi-inbox display-4 text-muted d-block mb-3"></i>
                    <p class="text-muted">Belum ada data pengeluaran</p>
                    <button class="btn btn-primary mt-2" data-bs-toggle="modal" data-bs-target="#addExpensesModal">
                        <i class="bi bi-plus-circle me-2"></i>Tambah Data Pengeluaran Pertama
                    </button>
                </td>
            </tr>
        `;
        return;
    }
    
    // Urutkan dari yang terbaru
    const sortedData = [...expensesData].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    tbody.innerHTML = '';
    
    sortedData.forEach(expense => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${formatDate(expense.date)}</td>
            <td>${expense.category || '-'}</td>
            <td>${expense.description || '-'}</td>
            <td>${formatCurrency(expense.amount || 0)}</td>
            <td>${expense.paymentMethod || '-'}</td>
            <td><span class="badge bg-${expense.status === 'Selesai' ? 'success' : 'warning'}">${expense.status || 'Pending'}</span></td>
            <td>
                <button class="btn btn-sm btn-outline-primary me-1 edit-expenses-btn" data-id="${expense.id}">
                    <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger delete-expenses-btn" data-id="${expense.id}">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
    
    // Tambahkan event listeners untuk tombol aksi
    addExpensesActionListeners();
}

// Fungsi pencarian pengeluaran
function searchExpenses(query) {
    if (!query) {
        updateExpensesTable();
        return;
    }
    
    const filtered = expensesData.filter(expense => 
        expense.category.toLowerCase().includes(query.toLowerCase()) ||
        expense.description.toLowerCase().includes(query.toLowerCase()) ||
        expense.date.includes(query) ||
        expense.paymentMethod.toLowerCase().includes(query.toLowerCase())
    );
    
    displayFilteredExpenses(filtered);
}

// Tampilkan hasil pencarian
function displayFilteredExpenses(data) {
    const tbody = document.getElementById('expensesTableBody');
    
    if (data.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-4">
                    <i class="bi bi-search display-4 text-muted d-block mb-3"></i>
                    <p class="text-muted">Tidak ada data yang sesuai dengan pencarian</p>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = '';
    
    data.forEach(expense => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${formatDate(expense.date)}</td>
            <td>${expense.category || '-'}</td>
            <td>${expense.description || '-'}</td>
            <td>${formatCurrency(expense.amount || 0)}</td>
            <td>${expense.paymentMethod || '-'}</td>
            <td><span class="badge bg-${expense.status === 'Selesai' ? 'success' : 'warning'}">${expense.status || 'Pending'}</span></td>
            <td>
                <button class="btn btn-sm btn-outline-primary me-1 edit-expenses-btn" data-id="${expense.id}">
                    <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger delete-expenses-btn" data-id="${expense.id}">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
    
    addExpensesActionListeners();
}

// Tambahkan event listeners untuk tombol aksi
function addExpensesActionListeners() {
    // Edit expenses
    document.querySelectorAll('.edit-expenses-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const expensesId = this.dataset.id;
            editExpenses(expensesId);
        });
    });
    
    // Delete expenses
    document.querySelectorAll('.delete-expenses-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const expensesId = this.dataset.id;
            deleteExpenses(expensesId);
        });
    });
}

// Edit pengeluaran
function editExpenses(id) {
    const expense = expensesData.find(e => e.id == id);
    if (!expense) return;
    
    // Isi form dengan data yang ada
    document.getElementById('expensesDate').value = expense.date;
    document.getElementById('expensesCategory').value = expense.category;
    document.getElementById('expensesDescription').value = expense.description;
    document.getElementById('expensesAmount').value = expense.amount;
    document.getElementById('expensesPayment').value = expense.paymentMethod;
    
    // Ubah modal untuk edit
    const modal = document.getElementById('addExpensesModal');
    const modalTitle = modal.querySelector('.modal-title');
    const saveBtn = modal.querySelector('#saveExpenses');
    
    modalTitle.innerHTML = '<i class="bi bi-pencil me-2"></i>Edit Pengeluaran';
    saveBtn.innerHTML = '<i class="bi bi-check-circle me-2"></i>Update Pengeluaran';
    saveBtn.onclick = function() { handleUpdateExpenses(id); };
    
    // Tampilkan modal
    new bootstrap.Modal(modal).show();
}

// Handle update pengeluaran
async function handleUpdateExpenses(id) {
    const formData = {
        id: id,
        date: document.getElementById('expensesDate').value,
        category: document.getElementById('expensesCategory').value,
        description: document.getElementById('expensesDescription').value,
        amount: document.getElementById('expensesAmount').value,
        paymentMethod: document.getElementById('expensesPayment').value,
        status: 'Selesai'
    };

    if (!formData.date || !formData.category || !formData.description || !formData.amount) {
        showToast('Harap isi semua field yang wajib diisi', 'danger');
        return;
    }

    try {
        const result = await sendData('updateExpenses', formData);
        
        if (result.success) {
            showToast('Data pengeluaran berhasil diupdate', 'success');
            bootstrap.Modal.getInstance(document.getElementById('addExpensesModal')).hide();
            resetExpensesForm();
            await loadExpensesData();
        } else {
            showToast(result.message || 'Gagal mengupdate data pengeluaran', 'danger');
        }
    } catch (error) {
        console.error('Error updating expenses:', error);
        showToast('Terjadi kesalahan saat mengupdate data pengeluaran', 'danger');
    }
}

// Delete pengeluaran
async function deleteExpenses(id) {
    if (!confirm('Apakah Anda yakin ingin menghapus data pengeluaran ini?')) {
        return;
    }

    try {
        const result = await sendData('deleteExpenses', { id: id });
        
        if (result.success) {
            showToast('Data pengeluaran berhasil dihapus', 'success');
            await loadExpensesData();
        } else {
            showToast(result.message || 'Gagal menghapus data pengeluaran', 'danger');
        }
    } catch (error) {
        console.error('Error deleting expenses:', error);
        showToast('Terjadi kesalahan saat menghapus data pengeluaran', 'danger');
    }
}

// Reset form pengeluaran
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

// Export data pengeluaran
function exportExpensesData() {
    if (expensesData.length === 0) {
        showToast('Tidak ada data untuk diexport', 'warning');
        return;
    }

    const headers = ['Tanggal', 'Kategori', 'Deskripsi', 'Jumlah', 'Metode Pembayaran', 'Status'];
    const csvContent = [
        headers.join(','),
        ...expensesData.map(row => [
            formatDate(row.date),
            `"${row.category}"`,
            `"${row.description}"`,
            row.amount,
            `"${row.paymentMethod}"`,
            row.status
        ].join(','))
    ].join('\n');

    downloadCSV(csvContent, 'data_pengeluaran.csv');
    showToast('Data pengeluaran berhasil diexport', 'success');
}

// Fungsi utility
async function fetchData(action, params = {}) {
    try {
        const urlParams = new URLSearchParams();
        urlParams.append('action', action);
        
        Object.keys(params).forEach(key => {
            if (params[key] !== undefined && params[key] !== null) {
                urlParams.append(key, params[key].toString());
            }
        });

        const url = `${APPS_SCRIPT_URL}?${urlParams.toString()}`;
        const response = await fetch(url, { method: 'GET', redirect: 'follow' });
        
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        return await response.json();
    } catch (error) {
        console.error(`Error fetching ${action}:`, error);
        throw error;
    }
}

async function sendData(action, data) {
    try {
        const formData = new URLSearchParams();
        formData.append('action', action);
        
        Object.keys(data).forEach(key => {
            if (data[key] !== undefined && data[key] !== null) {
                formData.append(key, data[key].toString());
            }
        });

        const response = await fetch(APPS_SCRIPT_URL, {
            method: 'POST',
            body: formData,
            redirect: 'follow',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error(`Error sending ${action}:`, error);
        throw error;
    }
}

function showToast(message, type = 'info') {
    let toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container position-fixed top-0 end-0 p-3';
        document.body.appendChild(toastContainer);
    }
    
    const toastId = 'toast-' + Date.now();
    const toast = document.createElement('div');
    toast.className = `toast align-items-center text-bg-${type} border-0`;
    toast.id = toastId;
    
    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                ${message}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
    `;
    
    toastContainer.appendChild(toast);
    const bsToast = new bootstrap.Toast(toast, { delay: 4000 });
    bsToast.show();
    
    toast.addEventListener('hidden.bs.toast', () => toast.remove());
}

function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

function formatCurrency(amount) {
    return 'Rp ' + new Intl.NumberFormat('id-ID').format(amount || 0);
}

function showLoadingState(elementId, isLoading) {
    const element = document.getElementById(elementId);
    if (isLoading) {
        element.innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-4">
                    <div class="loading-spinner mx-auto"></div>
                    <div class="loading-text mt-2">Memuat data...</div>
                </td>
            </tr>
        `;
    }
}

function downloadCSV(content, filename) {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}