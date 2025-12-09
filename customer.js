// Konfigurasi Apps Script URL
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxpkV9khWzZ6CErdwpulFytH9UimnJ4NEhv8HPiGYUrSYvws5yhaoUPolqRwr1VD109/exec';

// Data pelanggan
let customerData = [];

// Inisialisasi saat halaman dimuat
document.addEventListener('DOMContentLoaded', function() {
    initializeCustomer();
});

// Fungsi inisialisasi pelanggan
async function initializeCustomer() {
    // Load data pelanggan
    await loadCustomerData();
    
    // Setup event listeners
    setupEventListeners();
}

// Setup event listeners
function setupEventListeners() {
    // Simpan pelanggan
    document.getElementById('saveCustomer').addEventListener('click', handleSaveCustomer);
    
    // Pencarian
    document.getElementById('customerSearch').addEventListener('input', function(e) {
        searchCustomer(e.target.value);
    });
    
    // Export
    document.getElementById('exportCustomers').addEventListener('click', exportCustomerData);
    
    // Modal hidden reset form
    document.getElementById('addCustomerModal').addEventListener('hidden.bs.modal', function() {
        document.getElementById('customerForm').reset();
    });
}

// Fungsi untuk memuat data pelanggan
async function loadCustomerData() {
    try {
        showLoadingState('customerTableBody', true);
        
        const result = await fetchData('getCustomers');
        
        if (result && result.success) {
            customerData = result.customers || [];
            updateCustomerDisplay();
        } else {
            customerData = [];
            updateCustomerDisplay();
            showToast('Gagal memuat data pelanggan', 'danger');
        }
    } catch (error) {
        console.error('Error loading customer data:', error);
        customerData = [];
        updateCustomerDisplay();
        showToast('Terjadi kesalahan saat memuat data', 'danger');
    }
}

// Fungsi untuk menyimpan pelanggan baru
async function saveCustomerData(formData) {
    try {
        const result = await sendData('addCustomer', formData);
        return result;
    } catch (error) {
        console.error('Error saving customer:', error);
        return { success: false, message: error.message };
    }
}

// Handler untuk menyimpan pelanggan
async function handleSaveCustomer() {
    const formData = {
        name: document.getElementById('customerName').value,
        phone: document.getElementById('customerPhone').value,
        email: document.getElementById('customerEmail').value,
        address: document.getElementById('customerAddress').value,
        type: document.getElementById('customerType').value,
        status: document.getElementById('customerStatus').value,
        totalTransactions: 0,
        totalSpent: 0
    };

    // Validasi
    if (!formData.name) {
        showToast('Nama pelanggan harus diisi', 'danger');
        return;
    }

    // Tampilkan loading
    const saveBtn = document.getElementById('saveCustomer');
    const originalText = saveBtn.innerHTML;
    saveBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Menyimpan...';
    saveBtn.disabled = true;

    try {
        const result = await saveCustomerData(formData);
        
        if (result.success) {
            showToast('Data pelanggan berhasil disimpan', 'success');
            bootstrap.Modal.getInstance(document.getElementById('addCustomerModal')).hide();
            await loadCustomerData(); // Reload data
        } else {
            showToast(result.message || 'Gagal menyimpan data pelanggan', 'danger');
        }
    } catch (error) {
        console.error('Error saving customer:', error);
        showToast('Terjadi kesalahan saat menyimpan data pelanggan', 'danger');
    } finally {
        // Reset button state
        saveBtn.innerHTML = originalText;
        saveBtn.disabled = false;
    }
}

// Fungsi untuk memperbarui tampilan pelanggan
function updateCustomerDisplay() {
    updateCustomerStats();
    updateCustomerTable();
}

// Update statistik pelanggan
function updateCustomerStats() {
    // Total pelanggan
    document.getElementById('totalCustomers').textContent = customerData.length;
    
    // Pelanggan aktif
    const activeCustomers = customerData.filter(c => c.status === 'Aktif').length;
    document.getElementById('activeCustomers').textContent = activeCustomers;
    
    // Total transaksi
    const totalTransactions = customerData.reduce((sum, c) => sum + parseInt(c.totalTransactions || 0), 0);
    document.getElementById('totalCustomerTransactions').textContent = totalTransactions;
    
    // Total belanja
    const totalSpent = customerData.reduce((sum, c) => sum + parseInt(c.totalSpent || 0), 0);
    document.getElementById('totalCustomerSpent').textContent = formatCurrency(totalSpent);
}

// Update tabel pelanggan
function updateCustomerTable() {
    const tbody = document.getElementById('customerTableBody');
    
    if (customerData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center py-4">
                    <i class="bi bi-inbox display-4 text-muted d-block mb-3"></i>
                    <p class="text-muted">Belum ada data pelanggan</p>
                    <button class="btn btn-primary mt-2" data-bs-toggle="modal" data-bs-target="#addCustomerModal">
                        <i class="bi bi-plus-circle me-2"></i>Tambah Data Pelanggan Pertama
                    </button>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = '';
    
    customerData.forEach(customer => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${customer.name || '-'}</td>
            <td>${customer.phone || '-'}</td>
            <td>${customer.email || '-'}</td>
            <td>${customer.address || '-'}</td>
            <td>${customer.totalTransactions || 0}</td>
            <td>${formatCurrency(customer.totalSpent || 0)}</td>
            <td>
                <span class="badge bg-${customer.status === 'Aktif' ? 'success' : 'secondary'}">
                    ${customer.status || 'Tidak Aktif'}
                </span>
            </td>
            <td>
                <button class="btn btn-sm btn-outline-primary me-1 edit-customer-btn" data-id="${customer.id}">
                    <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger delete-customer-btn" data-id="${customer.id}">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
    
    // Tambahkan event listeners untuk tombol aksi
    addCustomerActionListeners();
}

// Fungsi pencarian pelanggan
function searchCustomer(query) {
    if (!query) {
        updateCustomerTable();
        return;
    }
    
    const filtered = customerData.filter(customer => 
        customer.name.toLowerCase().includes(query.toLowerCase()) ||
        customer.phone.toLowerCase().includes(query.toLowerCase()) ||
        customer.email.toLowerCase().includes(query.toLowerCase()) ||
        customer.address.toLowerCase().includes(query.toLowerCase()) ||
        customer.type.toLowerCase().includes(query.toLowerCase())
    );
    
    displayFilteredCustomer(filtered);
}

// Tampilkan hasil pencarian
function displayFilteredCustomer(data) {
    const tbody = document.getElementById('customerTableBody');
    
    if (data.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center py-4">
                    <i class="bi bi-search display-4 text-muted d-block mb-3"></i>
                    <p class="text-muted">Tidak ada data yang sesuai dengan pencarian</p>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = '';
    
    data.forEach(customer => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${customer.name || '-'}</td>
            <td>${customer.phone || '-'}</td>
            <td>${customer.email || '-'}</td>
            <td>${customer.address || '-'}</td>
            <td>${customer.totalTransactions || 0}</td>
            <td>${formatCurrency(customer.totalSpent || 0)}</td>
            <td>
                <span class="badge bg-${customer.status === 'Aktif' ? 'success' : 'secondary'}">
                    ${customer.status || 'Tidak Aktif'}
                </span>
            </td>
            <td>
                <button class="btn btn-sm btn-outline-primary me-1 edit-customer-btn" data-id="${customer.id}">
                    <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger delete-customer-btn" data-id="${customer.id}">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
    
    addCustomerActionListeners();
}

// Tambahkan event listeners untuk tombol aksi
function addCustomerActionListeners() {
    // Edit customer
    document.querySelectorAll('.edit-customer-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const customerId = this.dataset.id;
            editCustomer(customerId);
        });
    });
    
    // Delete customer
    document.querySelectorAll('.delete-customer-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const customerId = this.dataset.id;
            deleteCustomer(customerId);
        });
    });
}

// Edit pelanggan
function editCustomer(id) {
    const customer = customerData.find(c => c.id == id);
    if (!customer) return;
    
    // Isi form dengan data yang ada
    document.getElementById('customerName').value = customer.name;
    document.getElementById('customerPhone').value = customer.phone || '';
    document.getElementById('customerEmail').value = customer.email || '';
    document.getElementById('customerAddress').value = customer.address || '';
    document.getElementById('customerType').value = customer.type;
    document.getElementById('customerStatus').value = customer.status;
    
    // Ubah modal untuk edit
    const modal = document.getElementById('addCustomerModal');
    const modalTitle = modal.querySelector('.modal-title');
    const saveBtn = modal.querySelector('#saveCustomer');
    
    modalTitle.innerHTML = '<i class="bi bi-pencil me-2"></i>Edit Pelanggan';
    saveBtn.innerHTML = '<i class="bi bi-check-circle me-2"></i>Update Pelanggan';
    saveBtn.onclick = function() { handleUpdateCustomer(id); };
    
    // Tampilkan modal
    new bootstrap.Modal(modal).show();
}

// Handle update pelanggan
async function handleUpdateCustomer(id) {
    const formData = {
        id: id,
        name: document.getElementById('customerName').value,
        phone: document.getElementById('customerPhone').value,
        email: document.getElementById('customerEmail').value,
        address: document.getElementById('customerAddress').value,
        type: document.getElementById('customerType').value,
        status: document.getElementById('customerStatus').value
    };

    if (!formData.name) {
        showToast('Nama pelanggan harus diisi', 'danger');
        return;
    }

    try {
        const result = await sendData('updateCustomer', formData);
        
        if (result.success) {
            showToast('Data pelanggan berhasil diupdate', 'success');
            bootstrap.Modal.getInstance(document.getElementById('addCustomerModal')).hide();
            resetCustomerForm();
            await loadCustomerData();
        } else {
            showToast(result.message || 'Gagal mengupdate data pelanggan', 'danger');
        }
    } catch (error) {
        console.error('Error updating customer:', error);
        showToast('Terjadi kesalahan saat mengupdate data pelanggan', 'danger');
    }
}

// Delete pelanggan
async function deleteCustomer(id) {
    if (!confirm('Apakah Anda yakin ingin menghapus data pelanggan ini?')) {
        return;
    }

    try {
        const result = await sendData('deleteCustomer', { id: id });
        
        if (result.success) {
            showToast('Data pelanggan berhasil dihapus', 'success');
            await loadCustomerData();
        } else {
            showToast(result.message || 'Gagal menghapus data pelanggan', 'danger');
        }
    } catch (error) {
        console.error('Error deleting customer:', error);
        showToast('Terjadi kesalahan saat menghapus data pelanggan', 'danger');
    }
}

// Reset form pelanggan
function resetCustomerForm() {
    const modal = document.getElementById('addCustomerModal');
    const modalTitle = modal.querySelector('.modal-title');
    const saveBtn = modal.querySelector('#saveCustomer');
    
    modalTitle.innerHTML = '<i class="bi bi-plus-circle me-2"></i>Tambah Pelanggan';
    saveBtn.innerHTML = '<i class="bi bi-check-circle me-2"></i>Simpan Pelanggan';
    saveBtn.onclick = function() { handleSaveCustomer(); };
    
    document.getElementById('customerForm').reset();
}

// Export data pelanggan
function exportCustomerData() {
    if (customerData.length === 0) {
        showToast('Tidak ada data untuk diexport', 'warning');
        return;
    }

    const headers = ['Nama', 'Telepon', 'Email', 'Alamat', 'Jenis', 'Status', 'Total Transaksi', 'Total Belanja'];
    const csvContent = [
        headers.join(','),
        ...customerData.map(row => [
            `"${row.name}"`,
            `"${row.phone || ''}"`,
            `"${row.email || ''}"`,
            `"${row.address || ''}"`,
            `"${row.type}"`,
            `"${row.status}"`,
            row.totalTransactions || 0,
            row.totalSpent || 0
        ].join(','))
    ].join('\n');

    downloadCSV(csvContent, 'data_pelanggan.csv');
    showToast('Data pelanggan berhasil diexport', 'success');
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

function formatCurrency(amount) {
    return 'Rp ' + new Intl.NumberFormat('id-ID').format(amount || 0);
}

function showLoadingState(elementId, isLoading) {
    const element = document.getElementById(elementId);
    if (isLoading) {
        element.innerHTML = `
            <tr>
                <td colspan="8" class="text-center py-4">
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