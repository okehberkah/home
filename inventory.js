// Konfigurasi Apps Script URL
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbw33dktX5-SK_8A84pVDpKh8JtUQOhHGg6rB54CWO4hdlpUhgfBwPuKSMqoJ18QsZBp/exec';

// Data inventaris
let inventoryData = [];

// Inisialisasi saat halaman dimuat
document.addEventListener('DOMContentLoaded', function() {
    initializeInventory();
});

// Fungsi inisialisasi inventaris
async function initializeInventory() {
    // Load data inventaris
    await loadInventoryData();
    
    // Setup event listeners
    setupEventListeners();
}

// Setup event listeners
function setupEventListeners() {
    // Simpan inventaris
    document.getElementById('saveInventory').addEventListener('click', handleSaveInventory);
    
    // Pencarian
    document.getElementById('inventorySearch').addEventListener('input', function(e) {
        searchInventory(e.target.value);
    });
    
    // Export
    document.getElementById('exportInventory').addEventListener('click', exportInventoryData);
    
    // Modal hidden reset form
    document.getElementById('addInventoryModal').addEventListener('hidden.bs.modal', function() {
        document.getElementById('inventoryForm').reset();
    });
}

// Fungsi untuk memuat data inventaris
async function loadInventoryData() {
    try {
        showLoadingState('inventoryTableBody', true);
        
        const result = await fetchData('getInventory');
        
        if (result && result.success) {
            inventoryData = result.inventory || [];
            updateInventoryDisplay();
        } else {
            inventoryData = [];
            updateInventoryDisplay();
            showToast('Gagal memuat data inventaris', 'danger');
        }
    } catch (error) {
        console.error('Error loading inventory data:', error);
        inventoryData = [];
        updateInventoryDisplay();
        showToast('Terjadi kesalahan saat memuat data', 'danger');
    }
}

// Fungsi untuk menyimpan inventaris baru
async function saveInventoryData(formData) {
    try {
        const result = await sendData('addInventory', formData);
        return result;
    } catch (error) {
        console.error('Error saving inventory:', error);
        return { success: false, message: error.message };
    }
}

// Handler untuk menyimpan inventaris
async function handleSaveInventory() {
    const formData = {
        product: document.getElementById('inventoryProduct').value,
        category: document.getElementById('inventoryCategory').value,
        quantity: document.getElementById('inventoryQuantity').value,
        buyPrice: document.getElementById('inventoryBuyPrice').value,
        sellPrice: document.getElementById('inventorySellPrice').value,
        supplier: document.getElementById('inventorySupplier').value
    };

    // Validasi
    if (!formData.product || !formData.category || !formData.quantity) {
        showToast('Harap isi semua field yang wajib diisi', 'danger');
        return;
    }

    // Tampilkan loading
    const saveBtn = document.getElementById('saveInventory');
    const originalText = saveBtn.innerHTML;
    saveBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Menyimpan...';
    saveBtn.disabled = true;

    try {
        const result = await saveInventoryData(formData);
        
        if (result.success) {
            showToast('Data inventaris berhasil disimpan', 'success');
            bootstrap.Modal.getInstance(document.getElementById('addInventoryModal')).hide();
            await loadInventoryData(); // Reload data
        } else {
            showToast(result.message || 'Gagal menyimpan data inventaris', 'danger');
        }
    } catch (error) {
        console.error('Error saving inventory:', error);
        showToast('Terjadi kesalahan saat menyimpan data inventaris', 'danger');
    } finally {
        // Reset button state
        saveBtn.innerHTML = originalText;
        saveBtn.disabled = false;
    }
}

// Fungsi untuk memperbarui tampilan inventaris
function updateInventoryDisplay() {
    updateInventoryStats();
    updateInventoryTable();
}

// Update statistik inventaris
function updateInventoryStats() {
    // Total produk
    document.getElementById('totalProducts').textContent = inventoryData.length;
    
    // Stok tersedia
    const availableStock = inventoryData.reduce((sum, i) => sum + parseInt(i.quantity || 0), 0);
    document.getElementById('availableStock').textContent = availableStock.toLocaleString();
    
    // Stok rendah
    const lowStock = inventoryData.filter(i => parseInt(i.quantity || 0) < 50).length;
    document.getElementById('lowStock').textContent = lowStock;
    
    // Nilai stok
    const stockValue = inventoryData.reduce((sum, i) => sum + (parseInt(i.quantity || 0) * parseInt(i.buyPrice || 0)), 0);
    document.getElementById('stockValue').textContent = formatCurrency(stockValue);
}

// Update tabel inventaris
function updateInventoryTable() {
    const tbody = document.getElementById('inventoryTableBody');
    
    if (inventoryData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center py-4">
                    <i class="bi bi-inbox display-4 text-muted d-block mb-3"></i>
                    <p class="text-muted">Belum ada data inventaris</p>
                    <button class="btn btn-primary mt-2" data-bs-toggle="modal" data-bs-target="#addInventoryModal">
                        <i class="bi bi-plus-circle me-2"></i>Tambah Data Inventaris Pertama
                    </button>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = '';
    
    inventoryData.forEach(item => {
        const stockValue = (parseInt(item.quantity || 0) * parseInt(item.buyPrice || 0));
        const isLowStock = parseInt(item.quantity || 0) < 50;
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.product || '-'}</td>
            <td>${item.category || '-'}</td>
            <td>
                <span class="${isLowStock ? 'text-danger fw-bold' : ''}">
                    ${(item.quantity || 0).toLocaleString()} butir
                    ${isLowStock ? '<i class="bi bi-exclamation-triangle ms-1"></i>' : ''}
                </span>
            </td>
            <td>${formatCurrency(item.buyPrice || 0)}</td>
            <td>${formatCurrency(item.sellPrice || 0)}</td>
            <td>${formatCurrency(stockValue)}</td>
            <td>
                <span class="badge bg-${isLowStock ? 'danger' : 'success'}">
                    ${isLowStock ? 'Stok Rendah' : 'Tersedia'}
                </span>
            </td>
            <td>
                <button class="btn btn-sm btn-outline-primary me-1 edit-inventory-btn" data-id="${item.id}">
                    <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger delete-inventory-btn" data-id="${item.id}">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
    
    // Tambahkan event listeners untuk tombol aksi
    addInventoryActionListeners();
}

// Fungsi pencarian inventaris
function searchInventory(query) {
    if (!query) {
        updateInventoryTable();
        return;
    }
    
    const filtered = inventoryData.filter(item => 
        item.product.toLowerCase().includes(query.toLowerCase()) ||
        item.category.toLowerCase().includes(query.toLowerCase()) ||
        item.supplier.toLowerCase().includes(query.toLowerCase())
    );
    
    displayFilteredInventory(filtered);
}

// Tampilkan hasil pencarian
function displayFilteredInventory(data) {
    const tbody = document.getElementById('inventoryTableBody');
    
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
    
    data.forEach(item => {
        const stockValue = (parseInt(item.quantity || 0) * parseInt(item.buyPrice || 0));
        const isLowStock = parseInt(item.quantity || 0) < 50;
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.product || '-'}</td>
            <td>${item.category || '-'}</td>
            <td>
                <span class="${isLowStock ? 'text-danger fw-bold' : ''}">
                    ${(item.quantity || 0).toLocaleString()} butir
                    ${isLowStock ? '<i class="bi bi-exclamation-triangle ms-1"></i>' : ''}
                </span>
            </td>
            <td>${formatCurrency(item.buyPrice || 0)}</td>
            <td>${formatCurrency(item.sellPrice || 0)}</td>
            <td>${formatCurrency(stockValue)}</td>
            <td>
                <span class="badge bg-${isLowStock ? 'danger' : 'success'}">
                    ${isLowStock ? 'Stok Rendah' : 'Tersedia'}
                </span>
            </td>
            <td>
                <button class="btn btn-sm btn-outline-primary me-1 edit-inventory-btn" data-id="${item.id}">
                    <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger delete-inventory-btn" data-id="${item.id}">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
    
    addInventoryActionListeners();
}

// Tambahkan event listeners untuk tombol aksi
function addInventoryActionListeners() {
    // Edit inventory
    document.querySelectorAll('.edit-inventory-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const inventoryId = this.dataset.id;
            editInventory(inventoryId);
        });
    });
    
    // Delete inventory
    document.querySelectorAll('.delete-inventory-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const inventoryId = this.dataset.id;
            deleteInventory(inventoryId);
        });
    });
}

// Edit inventaris
function editInventory(id) {
    const item = inventoryData.find(i => i.id == id);
    if (!item) return;
    
    // Isi form dengan data yang ada
    document.getElementById('inventoryProduct').value = item.product;
    document.getElementById('inventoryCategory').value = item.category;
    document.getElementById('inventoryQuantity').value = item.quantity;
    document.getElementById('inventoryBuyPrice').value = item.buyPrice;
    document.getElementById('inventorySellPrice').value = item.sellPrice;
    document.getElementById('inventorySupplier').value = item.supplier || '';
    
    // Ubah modal untuk edit
    const modal = document.getElementById('addInventoryModal');
    const modalTitle = modal.querySelector('.modal-title');
    const saveBtn = modal.querySelector('#saveInventory');
    
    modalTitle.innerHTML = '<i class="bi bi-pencil me-2"></i>Edit Inventaris';
    saveBtn.innerHTML = '<i class="bi bi-check-circle me-2"></i>Update Inventaris';
    saveBtn.onclick = function() { handleUpdateInventory(id); };
    
    // Tampilkan modal
    new bootstrap.Modal(modal).show();
}

// Handle update inventaris
async function handleUpdateInventory(id) {
    const formData = {
        id: id,
        product: document.getElementById('inventoryProduct').value,
        category: document.getElementById('inventoryCategory').value,
        quantity: document.getElementById('inventoryQuantity').value,
        buyPrice: document.getElementById('inventoryBuyPrice').value,
        sellPrice: document.getElementById('inventorySellPrice').value,
        supplier: document.getElementById('inventorySupplier').value
    };

    if (!formData.product || !formData.category || !formData.quantity) {
        showToast('Harap isi semua field yang wajib diisi', 'danger');
        return;
    }

    try {
        const result = await sendData('updateInventory', formData);
        
        if (result.success) {
            showToast('Data inventaris berhasil diupdate', 'success');
            bootstrap.Modal.getInstance(document.getElementById('addInventoryModal')).hide();
            resetInventoryForm();
            await loadInventoryData();
        } else {
            showToast(result.message || 'Gagal mengupdate data inventaris', 'danger');
        }
    } catch (error) {
        console.error('Error updating inventory:', error);
        showToast('Terjadi kesalahan saat mengupdate data inventaris', 'danger');
    }
}

// Delete inventaris
async function deleteInventory(id) {
    if (!confirm('Apakah Anda yakin ingin menghapus data inventaris ini?')) {
        return;
    }

    try {
        const result = await sendData('deleteInventory', { id: id });
        
        if (result.success) {
            showToast('Data inventaris berhasil dihapus', 'success');
            await loadInventoryData();
        } else {
            showToast(result.message || 'Gagal menghapus data inventaris', 'danger');
        }
    } catch (error) {
        console.error('Error deleting inventory:', error);
        showToast('Terjadi kesalahan saat menghapus data inventaris', 'danger');
    }
}

// Reset form inventaris
function resetInventoryForm() {
    const modal = document.getElementById('addInventoryModal');
    const modalTitle = modal.querySelector('.modal-title');
    const saveBtn = modal.querySelector('#saveInventory');
    
    modalTitle.innerHTML = '<i class="bi bi-plus-circle me-2"></i>Tambah Stok';
    saveBtn.innerHTML = '<i class="bi bi-check-circle me-2"></i>Simpan Stok';
    saveBtn.onclick = function() { handleSaveInventory(); };
    
    document.getElementById('inventoryForm').reset();
}

// Export data inventaris
function exportInventoryData() {
    if (inventoryData.length === 0) {
        showToast('Tidak ada data untuk diexport', 'warning');
        return;
    }

    const headers = ['Produk', 'Kategori', 'Stok', 'Harga Beli', 'Harga Jual', 'Nilai Stok', 'Supplier'];
    const csvContent = [
        headers.join(','),
        ...inventoryData.map(row => [
            `"${row.product}"`,
            `"${row.category}"`,
            row.quantity,
            row.buyPrice,
            row.sellPrice,
            (parseInt(row.quantity || 0) * parseInt(row.buyPrice || 0)),
            `"${row.supplier || ''}"`
        ].join(','))
    ].join('\n');

    downloadCSV(csvContent, 'data_inventaris.csv');
    showToast('Data inventaris berhasil diexport', 'success');
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