// Konfigurasi Apps Script URL
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxpkV9khWzZ6CErdwpulFytH9UimnJ4NEhv8HPiGYUrSYvws5yhaoUPolqRwr1VD109/exec';

// Data terintegrasi
let dashboardData = {
    production: [],
    sales: [],
    expenses: [],
    inventory: [],
    customers: [],
    hpp: []
};

// Chart instances
let productionChart = null;
let productChart = null;

// Inisialisasi saat halaman dimuat
document.addEventListener('DOMContentLoaded', function() {
    initializeDashboard();
});

// Fungsi inisialisasi dashboard
async function initializeDashboard() {
    // Load user profile
    loadUserProfile();
    
    // Setup event listeners
    setupEventListeners();
    
    // Check koneksi dan load data
    await checkConnection();
    await loadDashboardData();
}

// Setup event listeners
function setupEventListeners() {
    // Refresh data
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', loadDashboardData);
    }
    
    // Logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    
    // Pencarian aktivitas
    const activitySearch = document.getElementById('activitySearch');
    if (activitySearch) {
        activitySearch.addEventListener('input', function(e) {
            searchActivity(e.target.value);
        });
    }
}

// Load profil pengguna
function loadUserProfile() {
    const savedUser = localStorage.getItem('eggTrackUser');
    if (savedUser) {
        try {
            const user = JSON.parse(savedUser);
            const userRoleDisplay = document.getElementById('userRoleDisplay');
            if (userRoleDisplay) {
                userRoleDisplay.textContent = user.name || 'Administrator';
            }
        } catch (e) {
            console.error('Error parsing user data:', e);
        }
    } else {
        // Redirect ke login jika tidak ada user
        window.location.href = 'login.html';
    }
}

// Check koneksi ke server
async function checkConnection() {
    try {
        showToast('Mengecek koneksi server...', 'info');
        const result = await fetchData('getPosts');
        const isConnected = result && result.success;
        
        updateConnectionStatus(isConnected);
        
        if (isConnected) {
            showToast('Terhubung ke server', 'success');
        } else {
            showToast('Server merespons tetapi tidak sukses', 'warning');
        }
    } catch (error) {
        console.error('Connection check failed:', error);
        updateConnectionStatus(false);
        showToast('Tidak dapat terhubung ke server, menggunakan data demo', 'warning');
    }
}

// Update status koneksi
function updateConnectionStatus(isConnected) {
    const statusText = document.getElementById('connectionStatusText');
    const connectionStatus = document.getElementById('dashboardConnectionStatus');
    
    if (!connectionStatus) return;
    
    // Hapus status indicator yang ada
    const existingIndicator = connectionStatus.querySelector('.status-indicator');
    if (existingIndicator) {
        existingIndicator.remove();
    }
    
    // Buat status indicator baru
    const statusIndicator = document.createElement('div');
    statusIndicator.className = isConnected ? 'status-indicator status-connected' : 'status-indicator status-disconnected';
    connectionStatus.prepend(statusIndicator);
    
    if (statusText) {
        if (isConnected) {
            statusText.textContent = 'Terhubung - Sistem terintegrasi aktif';
            statusText.style.color = '#28a745';
        } else {
            statusText.textContent = 'Terputus - Menggunakan data demo';
            statusText.style.color = '#dc3545';
        }
    }
}

// Fungsi untuk memuat data dashboard
async function loadDashboardData() {
    try {
        showLoadingState('recentActivity', true);
        showLoadingState('bestSellingProducts', true);
        
        showToast('Memuat data dashboard...', 'info');
        
        const [prodResult, salesResult, expResult, invResult, customersResult, hppResult] = await Promise.allSettled([
            fetchData('getProduction'),
            fetchData('getSales'),
            fetchData('getExpenses'),
            fetchData('getInventory'),
            fetchData('getCustomers'),
            fetchData('getHPP')
        ]);
        
        let hasValidData = false;
        
        // Process results dengan error handling yang lebih baik
        if (prodResult.status === 'fulfilled' && prodResult.value && prodResult.value.success) {
            dashboardData.production = prodResult.value.productions || [];
            hasValidData = true;
        } else {
            dashboardData.production = [];
            console.warn('Production data failed to load:', prodResult.reason);
        }
        
        if (salesResult.status === 'fulfilled' && salesResult.value && salesResult.value.success) {
            dashboardData.sales = salesResult.value.sales || [];
            hasValidData = true;
        } else {
            dashboardData.sales = [];
            console.warn('Sales data failed to load:', salesResult.reason);
        }
        
        if (expResult.status === 'fulfilled' && expResult.value && expResult.value.success) {
            dashboardData.expenses = expResult.value.expenses || [];
            hasValidData = true;
        } else {
            dashboardData.expenses = [];
            console.warn('Expenses data failed to load:', expResult.reason);
        }
        
        if (invResult.status === 'fulfilled' && invResult.value && invResult.value.success) {
            dashboardData.inventory = invResult.value.inventory || [];
            hasValidData = true;
        } else {
            dashboardData.inventory = [];
            console.warn('Inventory data failed to load:', invResult.reason);
        }
        
        if (customersResult.status === 'fulfilled' && customersResult.value && customersResult.value.success) {
            dashboardData.customers = customersResult.value.customers || [];
            hasValidData = true;
        } else {
            dashboardData.customers = [];
            console.warn('Customers data failed to load:', customersResult.reason);
        }
        
        if (hppResult.status === 'fulfilled' && hppResult.value && hppResult.value.success) {
            dashboardData.hpp = hppResult.value.hpp || [];
            hasValidData = true;
        } else {
            dashboardData.hpp = [];
            console.warn('HPP data failed to load:', hppResult.reason);
        }
        
        if (hasValidData) {
            updateDashboardDisplay();
            updateIntegratedNotifications();
            updateSidebarNotifications();
            updateConnectionStatus(true);
            showToast('Data berhasil dimuat', 'success');
        } else {
            // Jika semua data gagal, gunakan data dummy untuk demo
            useDemoData();
            updateConnectionStatus(false);
            showToast('Menggunakan data demo - server tidak merespons', 'warning');
        }
        
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        // Gunakan data demo sebagai fallback
        useDemoData();
        updateConnectionStatus(false);
        showToast('Menggunakan data demo - terjadi kesalahan', 'warning');
    }
}

// Fungsi untuk menggunakan data demo
function useDemoData() {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const twoDaysAgo = new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0];
    
    dashboardData = {
        production: [
            { date: today, product: 'Telur Ayam Kampung', quantity: 150, status: 'Selesai' },
            { date: yesterday, product: 'Telur Ayam Ras', quantity: 200, status: 'Selesai' },
            { date: twoDaysAgo, product: 'Telur Bebek', quantity: 80, status: 'Selesai' }
        ],
        sales: [
            { date: today, product: 'Telur Ayam Kampung', quantity: 100, total: 250000, status: 'Lunas' },
            { date: yesterday, product: 'Telur Ayam Ras', quantity: 150, total: 300000, status: 'Lunas' },
            { date: twoDaysAgo, product: 'Telur Bebek', quantity: 50, total: 175000, status: 'Lunas' }
        ],
        expenses: [
            { date: today, amount: 50000, description: 'Pakan Ayam', status: 'Selesai' },
            { date: yesterday, amount: 75000, description: 'Vitamin', status: 'Selesai' },
            { date: twoDaysAgo, amount: 100000, description: 'Perbaikan Kandang', status: 'Selesai' }
        ],
        inventory: [
            { product: 'Telur Ayam Kampung', quantity: 300, buyPrice: 2000 },
            { product: 'Telur Ayam Ras', quantity: 250, buyPrice: 1500 },
            { product: 'Telur Bebek', quantity: 30, buyPrice: 3500 }
        ],
        customers: [
            { name: 'Toko Sejahtera', status: 'Aktif' },
            { name: 'Warung Sembako', status: 'Aktif' },
            { name: 'Restoran Pondok', status: 'Tidak Aktif' }
        ],
        hpp: [
            { ID: 1, Name: 'Pakan Ayam', Type: 'variable', Amount: 500000, Description: 'Biaya pakan bulanan', Date: today, Status: 'active' },
            { ID: 2, Name: 'Gaji Karyawan', Type: 'fixed', Amount: 3000000, Description: 'Gaji bulanan', Date: today, Status: 'active' },
            { ID: 3, Name: 'Listrik Kandang', Type: 'variable', Amount: 450000, Description: 'Biaya listrik', Date: today, Status: 'active' }
        ]
    };
    
    updateDashboardDisplay();
    updateIntegratedNotifications();
    updateSidebarNotifications();
}

// Fungsi untuk memperbarui tampilan dashboard
function updateDashboardDisplay() {
    updateDashboardStats();
    updateIntegratedCharts();
    updateRecentActivity();
    updateBestSellingProducts();
}

// Update statistik dashboard
function updateDashboardStats() {
    // Total produksi
    const totalProd = dashboardData.production.reduce((sum, p) => sum + parseInt(p.quantity || 0), 0);
    const totalProductionEl = document.getElementById('totalProduction');
    if (totalProductionEl) totalProductionEl.textContent = totalProd.toLocaleString();
    
    // Total penjualan
    const totalSales = dashboardData.sales.reduce((sum, s) => sum + parseInt(s.quantity || 0), 0);
    const totalSalesEl = document.getElementById('totalSales');
    if (totalSalesEl) totalSalesEl.textContent = totalSales.toLocaleString();
    
    // Total pendapatan
    const totalRevenue = dashboardData.sales.reduce((sum, s) => sum + parseInt(s.total || 0), 0);
    const totalRevenueEl = document.getElementById('totalRevenue');
    if (totalRevenueEl) totalRevenueEl.textContent = formatCurrency(totalRevenue);
    
    // Total pengeluaran
    const totalExpenses = dashboardData.expenses.reduce((sum, e) => sum + parseInt(e.amount || 0), 0);
    const totalExpensesEl = document.getElementById('totalExpenses');
    if (totalExpensesEl) totalExpensesEl.textContent = formatCurrency(totalExpenses);
    
    // Total inventaris
    const totalInventory = dashboardData.inventory.reduce((sum, i) => sum + parseInt(i.quantity || 0), 0);
    const totalInventoryEl = document.getElementById('totalInventory');
    if (totalInventoryEl) totalInventoryEl.textContent = totalInventory.toLocaleString();
    
    // Margin keuntungan
    const totalCost = dashboardData.inventory.reduce((sum, i) => sum + (parseInt(i.quantity || 0) * parseInt(i.buyPrice || 0)), 0);
    const totalExp = dashboardData.expenses.reduce((sum, e) => sum + parseInt(e.amount || 0), 0);
    const profitMargin = totalRevenue > 0 ? Math.max(0, ((totalRevenue - totalCost - totalExp) / totalRevenue * 100)).toFixed(1) : 0;
    const profitMarginEl = document.getElementById('profitMargin');
    if (profitMarginEl) profitMarginEl.textContent = `${profitMargin}%`;
}

// Update grafik terintegrasi
function updateIntegratedCharts() {
    updateProductionChart();
    updateProductChart();
}

// Update grafik produksi & penjualan
function updateProductionChart() {
    const ctx = document.getElementById('productionChart');
    if (!ctx) return;
    
    // Destroy existing chart
    if (productionChart) {
        productionChart.destroy();
    }
    
    const labels = [];
    const productionData = [];
    const salesData = [];
    
    // Generate data untuk 7 hari terakhir
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateString = date.toISOString().split('T')[0];
        
        labels.push(formatDate(date));
        
        const dayProduction = dashboardData.production
            .filter(p => p.date === dateString)
            .reduce((sum, p) => sum + parseInt(p.quantity || 0), 0);
        productionData.push(dayProduction);
        
        const daySales = dashboardData.sales
            .filter(s => s.date === dateString)
            .reduce((sum, s) => sum + parseInt(s.quantity || 0), 0);
        salesData.push(daySales);
    }
    
    try {
        productionChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Produksi (Butir)',
                        data: productionData,
                        borderColor: '#4361ee',
                        backgroundColor: 'rgba(67, 97, 238, 0.1)',
                        tension: 0.3,
                        fill: true
                    },
                    {
                        label: 'Penjualan (Butir)',
                        data: salesData,
                        borderColor: '#4cc9f0',
                        backgroundColor: 'rgba(76, 201, 240, 0.1)',
                        tension: 0.3,
                        fill: true
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return value.toLocaleString();
                            }
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error creating production chart:', error);
    }
}

// Update grafik distribusi produk
function updateProductChart() {
    const ctx = document.getElementById('productChart');
    if (!ctx) return;
    
    // Destroy existing chart
    if (productChart) {
        productChart.destroy();
    }
    
    const productData = {};
    dashboardData.production.forEach(p => {
        if (p && p.product) {
            if (!productData[p.product]) productData[p.product] = 0;
            productData[p.product] += parseInt(p.quantity || 0);
        }
    });
    
    // Jika tidak ada data, buat data dummy
    if (Object.keys(productData).length === 0) {
        productData['Telur Ayam Kampung'] = 150;
        productData['Telur Ayam Ras'] = 200;
        productData['Telur Bebek'] = 80;
    }
    
    try {
        productChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(productData),
                datasets: [{
                    data: Object.values(productData),
                    backgroundColor: [
                        '#4361ee',
                        '#4cc9f0',
                        '#3a0ca3',
                        '#7209b7',
                        '#f72585'
                    ],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error creating product chart:', error);
    }
}

// Update aktivitas terbaru
function updateRecentActivity() {
    const activityContainer = document.getElementById('recentActivity');
    if (!activityContainer) return;
    
    // Gabungkan semua aktivitas
    let activities = [];

    // Aktivitas dari produksi
    dashboardData.production.forEach(prod => {
        if (prod && prod.date) {
            activities.push({
                date: prod.date,
                product: prod.product || 'Tidak diketahui',
                type: 'Produksi',
                quantity: prod.quantity || 0,
                status: prod.status || 'Selesai',
                impact: `+${prod.quantity || 0}`,
                action: 'production'
            });
        }
    });

    // Aktivitas dari penjualan
    dashboardData.sales.forEach(sale => {
        if (sale && sale.date) {
            activities.push({
                date: sale.date,
                product: sale.product || 'Tidak diketahui',
                type: 'Penjualan',
                quantity: sale.quantity || 0,
                status: sale.status || 'Lunas',
                impact: `-${sale.quantity || 0}`,
                action: 'sales'
            });
        }
    });

    // Aktivitas dari pengeluaran
    dashboardData.expenses.forEach(expense => {
        if (expense && expense.date) {
            activities.push({
                date: expense.date,
                product: expense.description || 'Pengeluaran',
                type: 'Pengeluaran',
                quantity: 1,
                status: expense.status || 'Selesai',
                impact: `-Rp ${(expense.amount || 0).toLocaleString()}`,
                action: 'expenses'
            });
        }
    });

    // Aktivitas dari HPP
    dashboardData.hpp.forEach(hpp => {
        if (hpp && hpp.Date) {
            activities.push({
                date: hpp.Date,
                product: hpp.Name || 'Biaya HPP',
                type: hpp.Type === 'variable' ? 'Biaya Variabel' : 'Biaya Tetap',
                quantity: 1,
                status: hpp.Status || 'Aktif',
                impact: `-Rp ${(hpp.Amount || 0).toLocaleString()}`,
                action: 'hpp'
            });
        }
    });

    // Urutkan berdasarkan tanggal (terbaru dulu)
    activities.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Ambil 10 aktivitas terbaru
    const recentActivities = activities.slice(0, 10);

    activityContainer.innerHTML = '';

    if (recentActivities.length === 0) {
        activityContainer.innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-4">
                    <i class="bi bi-inbox display-4 text-muted d-block mb-3"></i>
                    <p class="text-muted">Belum ada aktivitas</p>
                </td>
            </tr>
        `;
        return;
    }

    recentActivities.forEach(activity => {
        const row = document.createElement('tr');
        const statusClass = activity.status === 'Selesai' || activity.status === 'Lunas' || activity.status === 'Aktif' ? 'success' : 'warning';
        const impactClass = activity.impact.startsWith('+') ? 'success' : 
                           activity.impact.startsWith('-Rp') ? 'danger' : 'warning';
        
        row.innerHTML = `
            <td>${formatDate(activity.date)}</td>
            <td>${activity.product}</td>
            <td>${activity.type}</td>
            <td>${activity.type.includes('Biaya') ? '-' : activity.quantity.toLocaleString() + ' butir'}</td>
            <td><span class="badge bg-${statusClass}">${activity.status}</span></td>
            <td>
                <span class="badge bg-${impactClass}">
                    ${activity.impact}
                </span>
            </td>
            <td>
                <button class="btn btn-sm btn-outline-primary view-activity-btn" data-type="${activity.action}">
                    <i class="bi bi-eye"></i>
                </button>
            </td>
        `;
        activityContainer.appendChild(row);
    });
    
    // Add event listeners untuk tombol view
    document.querySelectorAll('.view-activity-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const activityType = this.dataset.type;
            // Redirect ke halaman yang sesuai
            if (activityType === 'production') {
                window.location.href = 'production.html';
            } else if (activityType === 'sales') {
                window.location.href = 'sales.html';
            } else if (activityType === 'expenses') {
                window.location.href = 'expenses.html';
            } else if (activityType === 'hpp') {
                window.location.href = 'hpp.html';
            }
        });
    });
}

// Update produk terlaris
function updateBestSellingProducts() {
    const container = document.getElementById('bestSellingProducts');
    if (!container) return;
    
    // Hitung total penjualan per produk
    const productSales = {};
    dashboardData.sales.forEach(sale => {
        if (sale && sale.product) {
            if (!productSales[sale.product]) {
                productSales[sale.product] = 0;
            }
            productSales[sale.product] += parseInt(sale.quantity || 0);
        }
    });

    // Jika tidak ada data penjualan, gunakan data dari produksi
    if (Object.keys(productSales).length === 0) {
        dashboardData.production.forEach(prod => {
            if (prod && prod.product) {
                if (!productSales[prod.product]) {
                    productSales[prod.product] = 0;
                }
                productSales[prod.product] += parseInt(prod.quantity || 0);
            }
        });
    }

    // Urutkan produk berdasarkan jumlah penjualan
    const sortedProducts = Object.entries(productSales)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

    container.innerHTML = '';

    if (sortedProducts.length === 0) {
        container.innerHTML = `
            <div class="text-center py-4">
                <i class="bi bi-inbox display-4 text-muted d-block mb-3"></i>
                <p class="text-muted">Belum ada data penjualan</p>
            </div>
        `;
        return;
    }

    sortedProducts.forEach(([product, quantity], index) => {
        const rankClass = index === 0 ? 'bg-warning text-dark' : 
                        index === 1 ? 'bg-secondary' : 
                        index === 2 ? 'bg-danger' : 'bg-light text-dark';
        
        const item = document.createElement('div');
        item.className = 'd-flex justify-content-between align-items-center mb-3 p-2 border rounded';
        item.innerHTML = `
            <div class="d-flex align-items-center">
                <span class="badge ${rankClass} me-2">${index + 1}</span>
                <div>
                    <h6 class="mb-0">${product}</h6>
                    <small class="text-muted">${quantity.toLocaleString()} butir terjual</small>
                </div>
            </div>
            <div class="text-end">
                <small class="text-success">${index === 0 ? 'Terlaris' : ''}</small>
            </div>
        `;
        container.appendChild(item);
    });
}

// Update notifikasi terintegrasi
function updateIntegratedNotifications() {
    const container = document.getElementById('integratedNotifications');
    if (!container) return;
    
    let notifications = [];

    // Cek stok rendah
    dashboardData.inventory.forEach(item => {
        const quantity = parseInt(item.quantity || 0);
        if (quantity > 0 && quantity < 50) {
            notifications.push({
                type: 'warning',
                message: `Stok ${item.product} rendah: ${quantity} butir tersisa`,
                icon: 'bi-exclamation-triangle'
            });
        }
    });

    // Cek penjualan hari ini
    const today = new Date().toISOString().split('T')[0];
    const todaySales = dashboardData.sales.filter(s => s.date === today).length;
    if (todaySales === 0) {
        notifications.push({
            type: 'info',
            message: 'Belum ada penjualan hari ini',
            icon: 'bi-info-circle'
        });
    }

    // Cek produksi hari ini
    const todayProduction = dashboardData.production.filter(p => p.date === today).length;
    if (todayProduction === 0) {
        notifications.push({
            type: 'info',
            message: 'Belum ada produksi hari ini',
            icon: 'bi-info-circle'
        });
    }

    // Cek biaya HPP tinggi
    const totalHPP = dashboardData.hpp.reduce((sum, h) => sum + parseFloat(h.Amount || 0), 0);
    const totalRevenue = dashboardData.sales.reduce((sum, s) => sum + parseFloat(s.total || 0), 0);
    if (totalHPP > 0 && totalRevenue > 0 && (totalHPP / totalRevenue) > 0.7) {
        notifications.push({
            type: 'danger',
            message: 'Biaya HPP melebihi 70% dari pendapatan',
            icon: 'bi-exclamation-triangle'
        });
    }

    // Notifikasi default jika tidak ada notifikasi
    if (notifications.length === 0) {
        notifications.push({
            type: 'success',
            message: 'Semua sistem berjalan normal',
            icon: 'bi-check-circle'
        });
    }

    container.innerHTML = '';

    notifications.forEach(notif => {
        const alert = document.createElement('div');
        alert.className = `alert alert-${notif.type} d-flex align-items-center`;
        alert.innerHTML = `
            <i class="${notif.icon} me-2"></i>
            <div>${notif.message}</div>
        `;
        container.appendChild(alert);
    });
}

// Update notifikasi sidebar
function updateSidebarNotifications() {
    // Hitung notifikasi untuk setiap modul
    const productionNotifications = dashboardData.production.filter(p => p.status === 'Pending').length;
    const salesNotifications = dashboardData.sales.filter(s => s.status === 'Pending').length;
    const expensesNotifications = dashboardData.expenses.filter(e => e.status === 'Pending').length;
    const inventoryNotifications = dashboardData.inventory.filter(i => parseInt(i.quantity || 0) < 50).length;
    const customerNotifications = dashboardData.customers.filter(c => c.status === 'Tidak Aktif').length;
    const hppNotifications = dashboardData.hpp.filter(h => h.Status === 'inactive').length;
    
    // Update badge notifikasi
    const updateBadge = (id, count) => {
        const element = document.getElementById(id);
        if (element) {
            if (count > 0) {
                element.textContent = count;
                element.style.display = 'flex';
            } else {
                element.style.display = 'none';
            }
        }
    };
    
    updateBadge('productionNotifications', productionNotifications);
    updateBadge('salesNotifications', salesNotifications);
    updateBadge('expensesNotifications', expensesNotifications);
    updateBadge('inventoryNotifications', inventoryNotifications);
    updateBadge('customerNotifications', customerNotifications);
    updateBadge('hppNotifications', hppNotifications);
    
    // Update dashboard notifications (total)
    const totalNotifications = productionNotifications + salesNotifications + expensesNotifications + 
                              inventoryNotifications + customerNotifications + hppNotifications;
    updateBadge('dashboardNotifications', totalNotifications);
}

// Fungsi pencarian aktivitas
function searchActivity(query) {
    if (!query || query.trim() === '') {
        updateRecentActivity();
        return;
    }
    
    query = query.toLowerCase().trim();
    const activityContainer = document.getElementById('recentActivity');
    if (!activityContainer) return;
    
    // Gabungkan semua aktivitas untuk pencarian
    let allActivities = [];

    // Aktivitas dari produksi
    dashboardData.production.forEach(prod => {
        if (prod && prod.date) {
            allActivities.push({
                date: prod.date,
                product: prod.product || 'Tidak diketahui',
                type: 'Produksi',
                quantity: prod.quantity || 0,
                status: prod.status || 'Selesai',
                impact: `+${prod.quantity || 0}`,
                action: 'production'
            });
        }
    });

    // Aktivitas dari penjualan
    dashboardData.sales.forEach(sale => {
        if (sale && sale.date) {
            allActivities.push({
                date: sale.date,
                product: sale.product || 'Tidak diketahui',
                type: 'Penjualan',
                quantity: sale.quantity || 0,
                status: sale.status || 'Lunas',
                impact: `-${sale.quantity || 0}`,
                action: 'sales'
            });
        }
    });

    // Aktivitas dari pengeluaran
    dashboardData.expenses.forEach(expense => {
        if (expense && expense.date) {
            allActivities.push({
                date: expense.date,
                product: expense.description || 'Pengeluaran',
                type: 'Pengeluaran',
                quantity: 1,
                status: expense.status || 'Selesai',
                impact: `-Rp ${(expense.amount || 0).toLocaleString()}`,
                action: 'expenses'
            });
        }
    });

    // Aktivitas dari HPP
    dashboardData.hpp.forEach(hpp => {
        if (hpp && hpp.Date) {
            allActivities.push({
                date: hpp.Date,
                product: hpp.Name || 'Biaya HPP',
                type: hpp.Type === 'variable' ? 'Biaya Variabel' : 'Biaya Tetap',
                quantity: 1,
                status: hpp.Status || 'Aktif',
                impact: `-Rp ${(hpp.Amount || 0).toLocaleString()}`,
                action: 'hpp'
            });
        }
    });

    // Filter aktivitas berdasarkan query
    const filteredActivities = allActivities.filter(activity => 
        activity.product.toLowerCase().includes(query) ||
        activity.type.toLowerCase().includes(query) ||
        activity.status.toLowerCase().includes(query) ||
        formatDate(activity.date).toLowerCase().includes(query)
    );

    // Tampilkan hasil pencarian
    if (filteredActivities.length === 0) {
        activityContainer.innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-4">
                    <i class="bi bi-search display-4 text-muted d-block mb-3"></i>
                    <p class="text-muted">Tidak ditemukan aktivitas dengan kata kunci "${query}"</p>
                </td>
            </tr>
        `;
    } else {
        activityContainer.innerHTML = '';
        filteredActivities.forEach(activity => {
            const row = document.createElement('tr');
            const statusClass = activity.status === 'Selesai' || activity.status === 'Lunas' || activity.status === 'Aktif' ? 'success' : 'warning';
            const impactClass = activity.impact.startsWith('+') ? 'success' : 
                               activity.impact.startsWith('-Rp') ? 'danger' : 'warning';
            
            row.innerHTML = `
                <td>${formatDate(activity.date)}</td>
                <td>${activity.product}</td>
                <td>${activity.type}</td>
                <td>${activity.type.includes('Biaya') ? '-' : activity.quantity.toLocaleString() + ' butir'}</td>
                <td><span class="badge bg-${statusClass}">${activity.status}</span></td>
                <td>
                    <span class="badge bg-${impactClass}">
                        ${activity.impact}
                    </span>
                </td>
                <td>
                    <button class="btn btn-sm btn-outline-primary view-activity-btn" data-type="${activity.action}">
                        <i class="bi bi-eye"></i>
                    </button>
                </td>
            `;
            activityContainer.appendChild(row);
        });
        
        // Add event listeners untuk tombol view
        document.querySelectorAll('.view-activity-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const activityType = this.dataset.type;
                if (activityType === 'production') {
                    window.location.href = 'production.html';
                } else if (activityType === 'sales') {
                    window.location.href = 'sales.html';
                } else if (activityType === 'expenses') {
                    window.location.href = 'expenses.html';
                } else if (activityType === 'hpp') {
                    window.location.href = 'hpp.html';
                }
            });
        });
    }
}

// Handler untuk logout
function handleLogout() {
    if (confirm('Apakah Anda yakin ingin logout?')) {
        // Hapus data user dari localStorage
        localStorage.removeItem('eggTrackUser');
        
        // Redirect ke halaman login
        window.location.href = 'login.html';
    }
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
        const response = await fetch(url, { 
            method: 'GET', 
            redirect: 'follow'
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error(`Error fetching ${action}:`, error);
        throw error;
    }
}

function showToast(message, type = 'info') {
    // Buat toast container jika belum ada
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
    
    // Inisialisasi dan tampilkan toast
    const bsToast = new bootstrap.Toast(toast, { 
        delay: 4000,
        autohide: true
    });
    bsToast.show();
    
    // Hapus toast dari DOM setelah disembunyikan
    toast.addEventListener('hidden.bs.toast', () => {
        toast.remove();
    });
}

function formatDate(dateString) {
    if (!dateString) return '-';
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '-';
        
        return date.toLocaleDateString('id-ID', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    } catch (error) {
        console.error('Error formatting date:', error);
        return '-';
    }
}

function formatCurrency(amount) {
    return 'Rp ' + new Intl.NumberFormat('id-ID').format(amount || 0);
}

function showLoadingState(elementId, isLoading) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    if (isLoading) {
        element.innerHTML = `
            <div class="text-center py-4">
                <div class="loading-spinner mx-auto"></div>
                <div class="loading-text mt-2">Memuat data...</div>
            </div>
        `;
    }
}

// Auto-refresh data setiap 30 detik
setInterval(() => {
    const connectionStatus = document.querySelector('#dashboardConnectionStatus .status-indicator');
    if (connectionStatus && connectionStatus.classList.contains('status-connected')) {
        loadDashboardData();
    }
}, 30000);