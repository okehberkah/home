// Konfigurasi Apps Script URL
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbw33dktX5-SK_8A84pVDpKh8JtUQOhHGg6rB54CWO4hdlpUhgfBwPuKSMqoJ18QsZBp/exec';

// Data produksi
let productionData = [];
let currentEditingId = null;

// Inisialisasi saat halaman dimuat
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 DOM Content Loaded');
    initializeProduction();
});

// Fungsi inisialisasi produksi
async function initializeProduction() {
    try {
        console.log('🔧 Initializing production...');
        
        // Set tanggal default
        document.getElementById('prodDate').value = new Date().toISOString().split('T')[0];
        
        // Setup event listeners
        setupEventListeners();
        
        // Test koneksi dan load data
        const connectionOk = await testConnection();
        if (connectionOk) {
            await loadProductionData();
            console.log('✅ Production initialized successfully');
        } else {
            showToast('Tidak dapat terhubung ke server. Periksa koneksi internet dan pastikan Apps Script sudah di-deploy.', 'danger');
        }
    } catch (error) {
        console.error('❌ Error initializing production:', error);
        showToast('Gagal menginisialisasi: ' + error.message, 'danger');
    }
}

// Setup event listeners
function setupEventListeners() {
    // Simpan produksi
    document.getElementById('saveProduction').addEventListener('click', handleSaveProduction);
    
    // Pencarian
    document.getElementById('productionSearch').addEventListener('input', function(e) {
        searchProduction(e.target.value);
    });
    
    // Export
    document.getElementById('exportProduction').addEventListener('click', exportProductionData);
    
    // Modal events
    const addProductionModal = document.getElementById('addProductionModal');
    if (addProductionModal) {
        addProductionModal.addEventListener('hidden.bs.modal', resetProductionForm);
        addProductionModal.addEventListener('show.bs.modal', function() {
            currentEditingId = null;
            // Reset form ke mode tambah
            const modalTitle = this.querySelector('.modal-title');
            const saveBtn = this.querySelector('#saveProduction');
            modalTitle.innerHTML = '<i class="bi bi-plus-circle me-2"></i>Tambah Produksi';
            saveBtn.innerHTML = '<i class="bi bi-check-circle me-2"></i>Simpan Produksi';
        });
    }
    
    // Tombol initialize sheets untuk debugging
    document.addEventListener('click', function(e) {
        if (e.target && e.target.id === 'initializeSheetsBtn') {
            initializeSheets();
        }
    });
}

// Test koneksi ke server
async function testConnection() {
    try {
        console.log('🔌 Testing connection to server...');
        const url = `${APPS_SCRIPT_URL}?action=test&timestamp=${Date.now()}`;
        
        const response = await fetch(url, {
            method: 'GET',
            redirect: 'follow'
        });
        
        console.log('📡 Test response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        console.log('📊 Test result:', result);
        
        return result.success === true;
        
    } catch (error) {
        console.error('❌ Server connection failed:', error);
        return false;
    }
}

// Initialize sheets
async function initializeSheets() {
    try {
        showToast('Menginisialisasi sheets...', 'info');
        const url = `${APPS_SCRIPT_URL}?action=initializeSheets&timestamp=${Date.now()}`;
        
        const response = await fetch(url, {
            method: 'GET',
            redirect: 'follow'
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
            showToast('Sheets berhasil diinisialisasi!', 'success');
            await loadProductionData();
        } else {
            throw new Error(result.message || 'Gagal menginisialisasi sheets');
        }
    } catch (error) {
        console.error('❌ Error initializing sheets:', error);
        showToast('Gagal menginisialisasi sheets: ' + error.message, 'danger');
    }
}

// Fungsi untuk memuat data produksi
async function loadProductionData() {
    try {
        console.log('🔄 Loading production data...');
        showLoadingState('productionTableBody', true);
        
        const url = `${APPS_SCRIPT_URL}?action=getProduction&timestamp=${Date.now()}`;
        console.log('🌐 Fetch URL:', url);
        
        const response = await fetch(url, {
            method: 'GET',
            redirect: 'follow'
        });
        
        console.log('📡 Response status:', response.status, response.statusText);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('📦 Server response:', result);
        
        if (result && result.success) {
            productionData = result.productions || [];
            console.log('✅ Data loaded successfully, count:', productionData.length);
            updateProductionDisplay();
            
            if (productionData.length === 0) {
                showToast('Tidak ada data produksi. Silakan tambah data baru.', 'info');
            }
        } else {
            throw new Error(result.message || 'Failed to load data from server');
        }
    } catch (error) {
        console.error('❌ Error loading production data:', error);
        productionData = [];
        updateProductionDisplay();
        showToast('Gagal memuat data: ' + error.message, 'danger');
    }
}

// Handler untuk menyimpan produksi
async function handleSaveProduction() {
    const formData = {
        date: document.getElementById('prodDate').value,
        product: document.getElementById('prodProduct').value,
        quantity: document.getElementById('prodQuantity').value,
        notes: document.getElementById('prodNotes').value,
        status: document.getElementById('prodStatus').value
    };

    // Validasi
    if (!formData.date || !formData.product || !formData.quantity) {
        showToast('Harap isi semua field yang wajib diisi (Tanggal, Produk, Jumlah)', 'danger');
        return;
    }

    if (formData.quantity <= 0) {
        showToast('Jumlah harus lebih dari 0', 'danger');
        return;
    }

    const saveBtn = document.getElementById('saveProduction');
    const originalText = saveBtn.innerHTML;
    saveBtn.disabled = true;

    try {
        let action, successMessage;
        
        if (currentEditingId) {
            // Mode EDIT
            action = 'updateProduction';
            successMessage = 'Data produksi berhasil diupdate';
            formData.id = currentEditingId;
            saveBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Mengupdate...';
        } else {
            // Mode TAMBAH
            action = 'addProduction';
            successMessage = 'Data produksi berhasil disimpan';
            saveBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Menyimpan...';
        }

        // Build form data
        const postData = new URLSearchParams();
        postData.append('action', action);
        Object.keys(formData).forEach(key => {
            if (formData[key] !== undefined && formData[key] !== null) {
                postData.append(key, formData[key].toString());
            }
        });

        console.log('📤 Sending data to server:', Object.fromEntries(postData));
        
        const response = await fetch(APPS_SCRIPT_URL, {
            method: 'POST',
            body: postData,
            redirect: 'follow',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        console.log('📡 Save response status:', response.status);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log('📊 Save result:', result);

        if (result.success) {
            showToast(successMessage, 'success');
            
            // Tutup modal dan reset form
            const modal = bootstrap.Modal.getInstance(document.getElementById('addProductionModal'));
            if (modal) modal.hide();
            resetProductionForm();
            
            // Reload data dari server untuk memastikan konsistensi
            await loadProductionData();
        } else {
            throw new Error(result.message || 'Gagal menyimpan data');
        }
    } catch (error) {
        console.error('❌ Error saving production:', error);
        showToast('Gagal menyimpan: ' + error.message, 'danger');
    } finally {
        saveBtn.innerHTML = originalText;
        saveBtn.disabled = false;
    }
}

// Fungsi untuk memperbarui tampilan produksi
function updateProductionDisplay() {
    updateProductionStats();
    updateProductionTable();
}

// Update statistik produksi
function updateProductionStats() {
    try {
        const today = new Date().toISOString().split('T')[0];
        const now = new Date();
        
        // Produksi hari ini
        const todayProd = productionData
            .filter(p => p.date === today)
            .reduce((sum, p) => sum + (parseInt(p.quantity) || 0), 0);
        
        // Produksi minggu ini (7 hari terakhir)
        const weekAgo = new Date(now);
        weekAgo.setDate(now.getDate() - 7);
        const weekProd = productionData
            .filter(p => {
                try {
                    const prodDate = new Date(p.date);
                    return prodDate >= weekAgo && prodDate <= now;
                } catch (e) {
                    return false;
                }
            })
            .reduce((sum, p) => sum + (parseInt(p.quantity) || 0), 0);
        
        // Produksi bulan ini
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthProd = productionData
            .filter(p => {
                try {
                    const prodDate = new Date(p.date);
                    return prodDate >= monthStart && prodDate <= now;
                } catch (e) {
                    return false;
                }
            })
            .reduce((sum, p) => sum + (parseInt(p.quantity) || 0), 0);
        
        // Total produksi
        const totalProd = productionData
            .reduce((sum, p) => sum + (parseInt(p.quantity) || 0), 0);
        
        // Update DOM elements
        const todayElement = document.getElementById('todayProduction');
        const weekElement = document.getElementById('weekProduction');
        const monthElement = document.getElementById('monthProduction');
        const totalElement = document.getElementById('totalProductionCard');
        
        if (todayElement) todayElement.textContent = todayProd.toLocaleString();
        if (weekElement) weekElement.textContent = weekProd.toLocaleString();
        if (monthElement) monthElement.textContent = monthProd.toLocaleString();
        if (totalElement) totalElement.textContent = totalProd.toLocaleString();
        
    } catch (error) {
        console.error('Error updating stats:', error);
    }
}

// Update tabel produksi
function updateProductionTable() {
    const tbody = document.getElementById('productionTableBody');
    
    if (!tbody) {
        console.error('❌ Table body not found');
        return;
    }
    
    if (productionData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-4">
                    <i class="bi bi-inbox display-4 text-muted d-block mb-3"></i>
                    <p class="text-muted">Belum ada data produksi</p>
                    <button class="btn btn-primary mt-2" data-bs-toggle="modal" data-bs-target="#addProductionModal">
                        <i class="bi bi-plus-circle me-2"></i>Tambah Data Produksi Pertama
                    </button>
                    <br>
                    <button class="btn btn-outline-secondary mt-2" id="initializeSheetsBtn">
                        <i class="bi bi-gear me-2"></i>Initialize Sheets
                    </button>
                </td>
            </tr>
        `;
        return;
    }
    
    // Urutkan dari yang terbaru
    const sortedData = [...productionData].sort((a, b) => {
        try {
            return new Date(b.date) - new Date(a.date);
        } catch (e) {
            return 0;
        }
    });
    
    tbody.innerHTML = '';
    
    sortedData.forEach(production => {
        const row = document.createElement('tr');
        const statusBadge = production.status === 'Selesai' ? 
            'success' : (production.status === 'Pending' ? 'warning' : 'secondary');
        
        row.innerHTML = `
            <td>${formatDate(production.date)}</td>
            <td>${escapeHtml(production.product || '-')}</td>
            <td>${(production.quantity || 0).toLocaleString()} butir</td>
            <td>${escapeHtml(production.notes || '-')}</td>
            <td><span class="badge bg-${statusBadge}">${production.status || 'Pending'}</span></td>
            <td><span class="badge bg-success">+${(production.quantity || 0).toLocaleString()}</span></td>
            <td>
                <button class="btn btn-sm btn-outline-primary me-1 edit-production-btn" data-id="${production.id}">
                    <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger delete-production-btn" data-id="${production.id}">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
    
    // Tambahkan event listeners untuk tombol aksi
    addProductionActionListeners();
}

// Fungsi pencarian produksi
function searchProduction(query) {
    if (!query) {
        updateProductionTable();
        return;
    }
    
    const filtered = productionData.filter(prod => 
        (prod.product && prod.product.toLowerCase().includes(query.toLowerCase())) ||
        (prod.notes && prod.notes.toLowerCase().includes(query.toLowerCase())) ||
        (prod.date && prod.date.includes(query)) ||
        (prod.status && prod.status.toLowerCase().includes(query.toLowerCase()))
    );
    
    displayFilteredProduction(filtered);
}

// Tampilkan hasil pencarian
function displayFilteredProduction(data) {
    const tbody = document.getElementById('productionTableBody');
    
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
    
    data.forEach(production => {
        const row = document.createElement('tr');
        const statusBadge = production.status === 'Selesai' ? 
            'success' : (production.status === 'Pending' ? 'warning' : 'secondary');
        
        row.innerHTML = `
            <td>${formatDate(production.date)}</td>
            <td>${escapeHtml(production.product || '-')}</td>
            <td>${(production.quantity || 0).toLocaleString()} butir</td>
            <td>${escapeHtml(production.notes || '-')}</td>
            <td><span class="badge bg-${statusBadge}">${production.status || 'Pending'}</span></td>
            <td><span class="badge bg-success">+${(production.quantity || 0).toLocaleString()}</span></td>
            <td>
                <button class="btn btn-sm btn-outline-primary me-1 edit-production-btn" data-id="${production.id}">
                    <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger delete-production-btn" data-id="${production.id}">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
    
    addProductionActionListeners();
}

// Tambahkan event listeners untuk tombol aksi
function addProductionActionListeners() {
    // Edit production
    document.querySelectorAll('.edit-production-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const productionId = this.getAttribute('data-id');
            editProduction(productionId);
        });
    });
    
    // Delete production
    document.querySelectorAll('.delete-production-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const productionId = this.getAttribute('data-id');
            deleteProduction(productionId);
        });
    });
}

// Edit produksi
function editProduction(id) {
    const production = productionData.find(p => p.id === id);
    if (!production) {
        showToast('Data produksi tidak ditemukan', 'danger');
        return;
    }
    
    currentEditingId = id;
    
    // Isi form dengan data yang ada
    document.getElementById('prodDate').value = production.date;
    document.getElementById('prodProduct').value = production.product;
    document.getElementById('prodQuantity').value = production.quantity;
    document.getElementById('prodNotes').value = production.notes || '';
    document.getElementById('prodStatus').value = production.status;
    
    // Ubah modal untuk edit
    const modal = document.getElementById('addProductionModal');
    const modalTitle = modal.querySelector('.modal-title');
    const saveBtn = modal.querySelector('#saveProduction');
    
    modalTitle.innerHTML = '<i class="bi bi-pencil me-2"></i>Edit Produksi';
    saveBtn.innerHTML = '<i class="bi bi-check-circle me-2"></i>Update Produksi';
    
    // Tampilkan modal
    const bsModal = new bootstrap.Modal(modal);
    bsModal.show();
}

// Delete produksi
async function deleteProduction(id) {
    if (!confirm('Apakah Anda yakin ingin menghapus data produksi ini? Tindakan ini tidak dapat dibatalkan.')) {
        return;
    }

    try {
        const url = `${APPS_SCRIPT_URL}?action=deleteProduction&id=${id}&timestamp=${Date.now()}`;
        console.log('🗑️ Delete URL:', url);
        
        const response = await fetch(url, {
            method: 'GET',
            redirect: 'follow'
        });
        
        console.log('📡 Delete response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('📊 Delete result:', result);
        
        if (result.success) {
            showToast('Data produksi berhasil dihapus', 'success');
            // Hapus dari array lokal dan update tampilan
            productionData = productionData.filter(p => p.id !== id);
            updateProductionDisplay();
        } else {
            throw new Error(result.message || 'Gagal menghapus data');
        }
    } catch (error) {
        console.error('❌ Error deleting production:', error);
        showToast('Gagal menghapus: ' + error.message, 'danger');
    }
}

// Reset form produksi
function resetProductionForm() {
    currentEditingId = null;
    
    const form = document.getElementById('productionForm');
    if (form) {
        form.reset();
        document.getElementById('prodDate').value = new Date().toISOString().split('T')[0];
    }
    
    // Reset modal title dan button text
    const modal = document.getElementById('addProductionModal');
    if (modal) {
        const modalTitle = modal.querySelector('.modal-title');
        const saveBtn = modal.querySelector('#saveProduction');
        if (modalTitle) modalTitle.innerHTML = '<i class="bi bi-plus-circle me-2"></i>Tambah Produksi';
        if (saveBtn) saveBtn.innerHTML = '<i class="bi bi-check-circle me-2"></i>Simpan Produksi';
    }
}

// Export data produksi
function exportProductionData() {
    if (productionData.length === 0) {
        showToast('Tidak ada data untuk diexport', 'warning');
        return;
    }

    const headers = ['Tanggal', 'Produk', 'Jumlah', 'Keterangan', 'Status'];
    const csvContent = [
        headers.join(','),
        ...productionData.map(row => [
            formatDate(row.date),
            `"${(row.product || '').replace(/"/g, '""')}"`,
            row.quantity,
            `"${(row.notes || '').replace(/"/g, '""')}"`,
            row.status
        ].join(','))
    ].join('\n');

    downloadCSV(csvContent, `data_produksi_${new Date().toISOString().split('T')[0]}.csv`);
    showToast('Data produksi berhasil diexport', 'success');
}

// ==================== UTILITY FUNCTIONS ====================

function showToast(message, type = 'info') {
    // Create toast container if not exists
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
    
    toast.addEventListener('hidden.bs.toast', () => {
        if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
        }
    });
}

function formatDate(dateString) {
    if (!dateString) return '-';
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
            return dateString;
        }
        return date.toLocaleDateString('id-ID', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    } catch (error) {
        return dateString;
    }
}

function showLoadingState(elementId, isLoading) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    if (isLoading) {
        element.innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-4">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                    <div class="mt-2">Memuat data...</div>
                </td>
            </tr>
        `;
    }
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

function escapeHtml(unsafe) {
    if (unsafe === null || unsafe === undefined) return '';
    return unsafe
        .toString()
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Global function untuk refresh data
window.refreshProductionData = function() {
    loadProductionData();
};

// Global function untuk test connection
window.testProductionConnection = function() {
    testConnection();
};