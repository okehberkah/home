// Konfigurasi Apps Script URL
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbw33dktX5-SK_8A84pVDpKh8JtUQOhHGg6rB54CWO4hdlpUhgfBwPuKSMqoJ18QsZBp/exec';

// Data penjualan
let salesData = [];

// Inisialisasi saat halaman dimuat
document.addEventListener('DOMContentLoaded', function() {
    initializeSales();
});

// Fungsi inisialisasi penjualan
async function initializeSales() {
    // Set tanggal default
    document.getElementById('salesDate').value = new Date().toISOString().split('T')[0];
    
    // Load data penjualan
    await loadSalesData();
    
    // Setup event listeners
    setupEventListeners();
}

// Setup event listeners
function setupEventListeners() {
    // Simpan penjualan
    document.getElementById('saveSales').addEventListener('click', handleSaveSales);
    
    // Pencarian
    document.getElementById('salesSearch').addEventListener('input', function(e) {
        searchSales(e.target.value);
    });
    
    // Export
    document.getElementById('exportSales').addEventListener('click', exportSalesData);
    
    // Real-time calculation
    document.getElementById('salesQuantity').addEventListener('input', updateSalesTotal);
    document.getElementById('salesPrice').addEventListener('input', updateSalesTotal);
    
    // Print invoice
    document.getElementById('printInvoice').addEventListener('click', printInvoice);
    
    // Modal hidden reset form
    document.getElementById('addSalesModal').addEventListener('hidden.bs.modal', function() {
        document.getElementById('salesForm').reset();
        document.getElementById('salesDate').value = new Date().toISOString().split('T')[0];
        document.getElementById('totalPreview').textContent = 'Rp 0';
    });
}

// Update total penjualan secara real-time
function updateSalesTotal() {
    const quantity = parseInt(document.getElementById('salesQuantity').value) || 0;
    const price = parseInt(document.getElementById('salesPrice').value) || 0;
    const total = quantity * price;
    document.getElementById('totalPreview').textContent = formatCurrency(total);
}

// Fungsi untuk memuat data penjualan
async function loadSalesData() {
    try {
        showLoadingState('salesTableBody', true);
        
        const result = await fetchData('getSales');
        
        if (result && result.success) {
            salesData = result.sales || [];
            updateSalesDisplay();
        } else {
            salesData = [];
            updateSalesDisplay();
            showToast('Gagal memuat data penjualan', 'danger');
        }
    } catch (error) {
        console.error('Error loading sales data:', error);
        salesData = [];
        updateSalesDisplay();
        showToast('Terjadi kesalahan saat memuat data', 'danger');
    }
}

// Fungsi untuk menyimpan penjualan baru
async function saveSalesData(formData) {
    try {
        const result = await sendData('addSales', formData);
        return result;
    } catch (error) {
        console.error('Error saving sales:', error);
        return { success: false, message: error.message };
    }
}

// Handler untuk menyimpan penjualan
async function handleSaveSales() {
    const formData = {
        date: document.getElementById('salesDate').value,
        product: document.getElementById('salesProduct').value,
        quantity: document.getElementById('salesQuantity').value,
        price: document.getElementById('salesPrice').value,
        customer: document.getElementById('salesCustomer').value,
        status: document.getElementById('salesStatus').value
    };

    // Validasi
    if (!formData.date || !formData.product || !formData.quantity || !formData.price) {
        showToast('Harap isi semua field yang wajib diisi', 'danger');
        return;
    }

    // Hitung total
    formData.total = parseInt(formData.quantity) * parseInt(formData.price);

    // Tampilkan loading
    const saveBtn = document.getElementById('saveSales');
    const originalText = saveBtn.innerHTML;
    saveBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Menyimpan...';
    saveBtn.disabled = true;

    try {
        const result = await saveSalesData(formData);
        
        if (result.success) {
            showToast('Data penjualan berhasil disimpan', 'success');
            bootstrap.Modal.getInstance(document.getElementById('addSalesModal')).hide();
            await loadSalesData(); // Reload data
        } else {
            showToast(result.message || 'Gagal menyimpan data penjualan', 'danger');
        }
    } catch (error) {
        console.error('Error saving sales:', error);
        showToast('Terjadi kesalahan saat menyimpan data penjualan', 'danger');
    } finally {
        // Reset button state
        saveBtn.innerHTML = originalText;
        saveBtn.disabled = false;
    }
}

// Fungsi untuk memperbarui tampilan penjualan
function updateSalesDisplay() {
    updateSalesStats();
    updateSalesTable();
}

// Update statistik penjualan
function updateSalesStats() {
    const today = new Date().toISOString().split('T')[0];
    
    // Penjualan hari ini
    const todaySales = salesData.filter(s => s.date === today)
                               .reduce((sum, s) => sum + (Number(s.quantity) || 0), 0);
    document.getElementById('todaySales').textContent = todaySales.toLocaleString();
    
    // Pendapatan hari ini
    const todayRevenue = salesData.filter(s => s.date === today)
                                 .reduce((sum, s) => sum + (Number(s.total) || 0), 0);
    document.getElementById('todayRevenue').textContent = formatCurrency(todayRevenue);
    
    // Total penjualan
    const totalSales = salesData.reduce((sum, s) => sum + (Number(s.quantity) || 0), 0);
    document.getElementById('totalSalesCard').textContent = totalSales.toLocaleString();
    
    // Total pendapatan
    const totalRevenue = salesData.reduce((sum, s) => sum + (Number(s.total) || 0), 0);
    document.getElementById('totalRevenueCard').textContent = formatCurrency(totalRevenue);
}

// Update tabel penjualan
function updateSalesTable() {
    const tbody = document.getElementById('salesTableBody');
    
    if (salesData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center py-4">
                    <i class="bi bi-inbox display-4 text-muted d-block mb-3"></i>
                    <p class="text-muted">Belum ada data penjualan</p>
                    <button class="btn btn-primary mt-2" data-bs-toggle="modal" data-bs-target="#addSalesModal">
                        <i class="bi bi-plus-circle me-2"></i>Tambah Data Penjualan Pertama
                    </button>
                </td>
            </tr>
        `;
        return;
    }
    
    // Urutkan dari yang terbaru
    const sortedData = [...salesData].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    tbody.innerHTML = '';
    
    sortedData.forEach(sale => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${formatDate(sale.date)}</td>
            <td>${sale.product || '-'}</td>
            <td>${(Number(sale.quantity) || 0).toLocaleString()} butir</td>
            <td>${formatCurrency(Number(sale.price) || 0)}</td>
            <td>${formatCurrency(Number(sale.total) || 0)}</td>
            <td>${sale.customer || '-'}</td>
            <td><span class="badge bg-${sale.status === 'Lunas' ? 'success' : 'warning'}">${sale.status || 'Pending'}</span></td>
            <td>
                <button class="btn btn-sm btn-outline-primary me-1 edit-sales-btn" data-id="${sale.id}">
                    <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-sm btn-outline-info me-1 invoice-btn" data-id="${sale.id}">
                    <i class="bi bi-receipt"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger delete-sales-btn" data-id="${sale.id}">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
    
    // Tambahkan event listeners untuk tombol aksi
    addSalesActionListeners();
}

// Fungsi pencarian penjualan
function searchSales(query) {
    if (!query) {
        updateSalesTable();
        return;
    }
    
    const filtered = salesData.filter(sale => 
        sale.product.toLowerCase().includes(query.toLowerCase()) ||
        sale.customer.toLowerCase().includes(query.toLowerCase()) ||
        sale.date.includes(query) ||
        sale.status.toLowerCase().includes(query.toLowerCase())
    );
    
    displayFilteredSales(filtered);
}

// Tampilkan hasil pencarian
function displayFilteredSales(data) {
    const tbody = document.getElementById('salesTableBody');
    
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
    
    data.forEach(sale => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${formatDate(sale.date)}</td>
            <td>${sale.product || '-'}</td>
            <td>${(Number(sale.quantity) || 0).toLocaleString()} butir</td>
            <td>${formatCurrency(Number(sale.price) || 0)}</td>
            <td>${formatCurrency(Number(sale.total) || 0)}</td>
            <td>${sale.customer || '-'}</td>
            <td><span class="badge bg-${sale.status === 'Lunas' ? 'success' : 'warning'}">${sale.status || 'Pending'}</span></td>
            <td>
                <button class="btn btn-sm btn-outline-primary me-1 edit-sales-btn" data-id="${sale.id}">
                    <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-sm btn-outline-info me-1 invoice-btn" data-id="${sale.id}">
                    <i class="bi bi-receipt"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger delete-sales-btn" data-id="${sale.id}">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
    
    addSalesActionListeners();
}

// Tambahkan event listeners untuk tombol aksi
function addSalesActionListeners() {
    // Edit sales
    document.querySelectorAll('.edit-sales-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const salesId = this.dataset.id;
            editSales(salesId);
        });
    });
    
    // Invoice
    document.querySelectorAll('.invoice-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const salesId = this.dataset.id;
            generateInvoice(salesId);
        });
    });
    
    // Delete sales
    document.querySelectorAll('.delete-sales-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const salesId = this.dataset.id;
            deleteSales(salesId);
        });
    });
}

// Edit penjualan
function editSales(id) {
    const sale = salesData.find(s => s.id == id);
    if (!sale) return;
    
    // Isi form dengan data yang ada
    document.getElementById('salesDate').value = sale.date;
    document.getElementById('salesProduct').value = sale.product;
    document.getElementById('salesQuantity').value = sale.quantity;
    document.getElementById('salesPrice').value = sale.price;
    document.getElementById('salesCustomer').value = sale.customer || '';
    document.getElementById('salesStatus').value = sale.status;
    
    // Update total preview
    updateSalesTotal();
    
    // Ubah modal untuk edit
    const modal = document.getElementById('addSalesModal');
    const modalTitle = modal.querySelector('.modal-title');
    const saveBtn = modal.querySelector('#saveSales');
    
    modalTitle.innerHTML = '<i class="bi bi-pencil me-2"></i>Edit Penjualan';
    saveBtn.innerHTML = '<i class="bi bi-check-circle me-2"></i>Update Penjualan';
    saveBtn.onclick = function() { handleUpdateSales(id); };
    
    // Tampilkan modal
    new bootstrap.Modal(modal).show();
}

// Handle update penjualan
async function handleUpdateSales(id) {
    const formData = {
        id: id,
        date: document.getElementById('salesDate').value,
        product: document.getElementById('salesProduct').value,
        quantity: document.getElementById('salesQuantity').value,
        price: document.getElementById('salesPrice').value,
        customer: document.getElementById('salesCustomer').value,
        status: document.getElementById('salesStatus').value
    };

    if (!formData.date || !formData.product || !formData.quantity || !formData.price) {
        showToast('Harap isi semua field yang wajib diisi', 'danger');
        return;
    }

    formData.total = parseInt(formData.quantity) * parseInt(formData.price);

    try {
        const result = await sendData('updateSales', formData);
        
        if (result.success) {
            showToast('Data penjualan berhasil diupdate', 'success');
            bootstrap.Modal.getInstance(document.getElementById('addSalesModal')).hide();
            resetSalesForm();
            await loadSalesData();
        } else {
            showToast(result.message || 'Gagal mengupdate data penjualan', 'danger');
        }
    } catch (error) {
        console.error('Error updating sales:', error);
        showToast('Terjadi kesalahan saat mengupdate data penjualan', 'danger');
    }
}

// Delete penjualan
async function deleteSales(id) {
    if (!confirm('Apakah Anda yakin ingin menghapus data penjualan ini?')) {
        return;
    }

    try {
        const result = await sendData('deleteSales', { id: id });
        
        if (result.success) {
            showToast('Data penjualan berhasil dihapus', 'success');
            await loadSalesData();
        } else {
            showToast(result.message || 'Gagal menghapus data penjualan', 'danger');
        }
    } catch (error) {
        console.error('Error deleting sales:', error);
        showToast('Terjadi kesalahan saat menghapus data penjualan', 'danger');
    }
}

// Generate invoice
function generateInvoice(salesId) {
    const sale = salesData.find(s => s.id == salesId);
    if (!sale) return;

    const invoiceContainer = document.getElementById('invoice');
    invoiceContainer.innerHTML = `
        <div class="invoice-header">
            <div class="row">
                <div class="col-6">
                    <h2>EggTrack Farm</h2>
                    <p class="mb-1">Jl. Telur Bebek No. 123</p>
                    <p class="mb-1">Jakarta, Indonesia</p>
                    <p class="mb-0">Telp: (021) 1234-5678</p>
                </div>
                <div class="col-6 text-end">
                    <h3 class="text-primary">NOTA PENJUALAN</h3>
                    <p class="mb-1"><strong>No. Invoice:</strong> INV-${String(salesId).padStart(3, '0')}</p>
                    <p class="mb-1"><strong>Tanggal:</strong> ${formatDate(sale.date)}</p>
                    <p class="mb-0"><strong>Kasir:</strong> Admin</p>
                </div>
            </div>
        </div>
        <div class="row mt-4">
            <div class="col-6">
                <h5>Kepada:</h5>
                <p class="mb-1"><strong>${sale.customer || 'Pelanggan Umum'}</strong></p>
            </div>
        </div>
        <div class="table-responsive mt-4">
            <table class="table table-bordered">
                <thead>
                    <tr>
                        <th>Produk</th>
                        <th>Harga</th>
                        <th>Jumlah</th>
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>${sale.product}</td>
                        <td>${formatCurrency(sale.price)}</td>
                        <td>${sale.quantity} butir</td>
                        <td>${formatCurrency(sale.total)}</td>
                    </tr>
                </tbody>
                <tfoot>
                    <tr>
                        <td colspan="3" class="text-end"><strong>Total</strong></td>
                        <td><strong>${formatCurrency(sale.total)}</strong></td>
                    </tr>
                </tfoot>
            </table>
        </div>
        <div class="row mt-4">
            <div class="col-12">
                <p class="text-center mb-0">Terima kasih atas pembelian Anda</p>
                <p class="text-center mb-0">Barang yang sudah dibeli tidak dapat ditukar atau dikembalikan</p>
            </div>
        </div>
    `;

    // Tampilkan modal invoice
    new bootstrap.Modal(document.getElementById('invoiceModal')).show();
}

// Print invoice
function printInvoice() {
    const invoiceElement = document.getElementById('invoice');
    const originalContents = document.body.innerHTML;
    
    document.body.innerHTML = invoiceElement.innerHTML;
    window.print();
    document.body.innerHTML = originalContents;
}

// Reset form penjualan
function resetSalesForm() {
    const modal = document.getElementById('addSalesModal');
    const modalTitle = modal.querySelector('.modal-title');
    const saveBtn = modal.querySelector('#saveSales');
    
    modalTitle.innerHTML = '<i class="bi bi-plus-circle me-2"></i>Tambah Penjualan';
    saveBtn.innerHTML = '<i class="bi bi-check-circle me-2"></i>Simpan Penjualan';
    saveBtn.onclick = function() { handleSaveSales(); };
    
    document.getElementById('salesForm').reset();
    document.getElementById('salesDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('totalPreview').textContent = 'Rp 0';
}

// Export data penjualan
function exportSalesData() {
    if (salesData.length === 0) {
        showToast('Tidak ada data untuk diexport', 'warning');
        return;
    }

    const headers = ['Tanggal', 'Produk', 'Jumlah', 'Harga', 'Total', 'Pelanggan', 'Status'];
    const csvContent = [
        headers.join(','),
        ...salesData.map(row => [
            formatDate(row.date),
            `"${row.product}"`,
            row.quantity,
            row.price,
            row.total,
            `"${row.customer || ''}"`,
            row.status
        ].join(','))
    ].join('\n');

    downloadCSV(csvContent, 'data_penjualan.csv');
    showToast('Data penjualan berhasil diexport', 'success');
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