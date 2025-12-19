// dashboard.js - Sistem Dashboard Terintegrasi EggTrack

// ==================== KONFIGURASI ====================
const CONFIG = {
    APP_NAME: 'EggTrack Admin',
    API_URL: 'https://script.google.com/macros/s/AKfycbxLWrZZ6CInf510NDjaX4HeZ2MYgbl_OSt0cScLDzb7YzjwfeFPcQdoj8_3J_f36yEz/exec',
    SESSION_TIMEOUT: 24 * 60 * 60 * 1000, // 24 jam
    AUTO_REFRESH_INTERVAL: 60000 // 1 menit
};

// ==================== VARIABEL GLOBAL ====================
let productionChart = null;
let productChart = null;
let salesChart = null;
let autoRefreshInterval = null;
let demoData = {};
let userData = null;

// ==================== DATA DEMO ====================
const initializeDemoData = () => {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    demoData = {
        production: [
            { id: 1, date: today, product: 'Telur Ayam Kampung', quantity: 150, grade: 'A', status: 'Selesai', notes: 'Produksi normal' },
            { id: 2, date: today, product: 'Telur Ayam Ras', quantity: 200, grade: 'A', status: 'Selesai', notes: 'Produksi normal' },
            { id: 3, date: today, product: 'Telur Bebek', quantity: 80, grade: 'B', status: 'Selesai', notes: 'Produksi berkurang' },
            { id: 4, date: yesterdayStr, product: 'Telur Ayam Kampung', quantity: 170, grade: 'A', status: 'Selesai', notes: 'Produksi meningkat' },
            { id: 5, date: yesterdayStr, product: 'Telur Ayam Ras', quantity: 180, grade: 'A', status: 'Selesai', notes: 'Produksi normal' }
        ],
        sales: [
            { id: 1, date: today, product: 'Telur Ayam Kampung', quantity: 100, price: 2500, total: 250000, customer: 'Toko Sejahtera', status: 'Lunas', paymentMethod: 'Transfer' },
            { id: 2, date: today, product: 'Telur Ayam Ras', quantity: 150, price: 2000, total: 300000, customer: 'Warung Sembako', status: 'Lunas', paymentMethod: 'Cash' },
            { id: 3, date: today, product: 'Telur Bebek', quantity: 50, price: 3500, total: 175000, customer: 'Restoran Pondok', status: 'Lunas', paymentMethod: 'Transfer' },
            { id: 4, date: yesterdayStr, product: 'Telur Ayam Kampung', quantity: 120, price: 2500, total: 300000, customer: 'Supermarket Indah', status: 'Lunas', paymentMethod: 'Transfer' },
            { id: 5, date: yesterdayStr, product: 'Telur Ayam Ras', quantity: 130, price: 2000, total: 260000, customer: 'Pasar Tradisional', status: 'Lunas', paymentMethod: 'Cash' }
        ],
        expenses: [
            { id: 1, date: today, amount: 50000, description: 'Pakan Ayam', category: 'Operasional', status: 'Selesai' },
            { id: 2, date: today, amount: 75000, description: 'Vitamin Unggas', category: 'Kesehatan', status: 'Selesai' },
            { id: 3, date: today, amount: 100000, description: 'Perbaikan Kandang', category: 'Pemeliharaan', status: 'Selesai' },
            { id: 4, date: yesterdayStr, amount: 60000, description: 'Obat-obatan', category: 'Kesehatan', status: 'Selesai' },
            { id: 5, date: yesterdayStr, amount: 80000, description: 'Transportasi', category: 'Operasional', status: 'Selesai' }
        ],
        inventory: [
            { id: 1, product: 'Telur Ayam Kampung', quantity: 300, minStock: 50, maxStock: 500, buyPrice: 2000, sellPrice: 2500, location: 'Gudang A' },
            { id: 2, product: 'Telur Ayam Ras', quantity: 250, minStock: 100, maxStock: 400, buyPrice: 1500, sellPrice: 2000, location: 'Gudang B' },
            { id: 3, product: 'Telur Bebek', quantity: 30, minStock: 20, maxStock: 100, buyPrice: 3000, sellPrice: 3500, location: 'Gudang C' },
            { id: 4, product: 'Telur Puyuh', quantity: 50, minStock: 30, maxStock: 150, buyPrice: 400, sellPrice: 500, location: 'Gudang A' }
        ],
        customers: [
            { id: 1, name: 'Toko Sejahtera', type: 'Retail', phone: '081234567890', email: 'sejahtera@email.com', address: 'Jl. Merdeka No. 12', status: 'Aktif', totalOrders: 25 },
            { id: 2, name: 'Warung Sembako', type: 'Retail', phone: '081298765432', email: 'warung@email.com', address: 'Jl. Pahlawan No. 45', status: 'Aktif', totalOrders: 18 },
            { id: 3, name: 'Restoran Pondok', type: 'Restoran', phone: '082112345678', email: 'pondok@email.com', address: 'Jl. Damai No. 23', status: 'Tidak Aktif', totalOrders: 12 },
            { id: 4, name: 'Supermarket Indah', type: 'Supermarket', phone: '081355577799', email: 'indah@email.com', address: 'Jl. Raya No. 89', status: 'Aktif', totalOrders: 30 }
        ],
        notifications: [
            { id: 1, type: 'warning', message: 'Stok Telur Bebek hampir habis', time: '2 jam lalu', icon: 'bi-exclamation-triangle' },
            { id: 2, type: 'info', message: 'Pembayaran dari Toko Sejahtera diterima', time: '4 jam lalu', icon: 'bi-check-circle' },
            { id: 3, type: 'danger', message: '1 pelanggan tidak aktif', time: '1 hari lalu', icon: 'bi-person-x' },
            { id: 4, type: 'success', message: 'Produksi hari ini mencapai target', time: 'Hari ini', icon: 'bi-graph-up' }
        ],
        bestSelling: [
            { product: 'Telur Ayam Kampung', sales: 850, revenue: 2125000, trend: 'up' },
            { product: 'Telur Ayam Ras', sales: 720, revenue: 1440000, trend: 'up' },
            { product: 'Telur Bebek', sales: 180, revenue: 630000, trend: 'stable' },
            { product: 'Telur Puyuh', sales: 120, revenue: 60000, trend: 'down' }
        ]
    };
};

// ==================== INISIALISASI ====================
document.addEventListener('DOMContentLoaded', function() {
    console.log('Dashboard loading...');
    
    // 1. Cek autentikasi
    if (!checkAuth()) {
        return;
    }
    
    // 2. Inisialisasi data
    initializeDemoData();
    loadUserData();
    
    // 3. Setup UI
    setupUI();
    
    // 4. Setup event listeners
    setupEventListeners();
    
    // 5. Load data dashboard
    loadDashboardData();
    
    // 6. Setup auto refresh
    setupAutoRefresh();
    
    console.log('Dashboard initialized successfully');
});

// ==================== FUNGSI AUTH ====================
function checkAuth() {
    const user = localStorage.getItem('eggUser');
    if (!user) {
        window.location.href = 'login.html';
        return false;
    }
    
    try {
        userData = JSON.parse(user);
        
        // Cek session timeout
        const loginTime = new Date(userData.loginTime);
        const now = new Date();
        const hoursDiff = (now - loginTime) / (1000 * 60 * 60);
        
        if (hoursDiff >= 24) {
            localStorage.removeItem('eggUser');
            window.location.href = 'login.html?session=expired';
            return false;
        }
        
        return true;
    } catch (error) {
        console.error('Auth error:', error);
        localStorage.removeItem('eggUser');
        window.location.href = 'login.html';
        return false;
    }
}

// ==================== FUNGSI UTAMA ====================
function loadUserData() {
    if (userData) {
        // Update role display
        const roleMap = {
            'admin': 'Administrator',
            'manager': 'Manager',
            'staff': 'Staff'
        };
        
        const userRoleDisplay = document.getElementById('userRoleDisplay');
        const userNameDisplay = document.getElementById('userNameDisplay');
        
        if (userRoleDisplay) {
            userRoleDisplay.textContent = roleMap[userData.role] || userData.role;
        }
        if (userNameDisplay) {
            userNameDisplay.textContent = userData.name || userData.username;
        }
    }
}

function setupUI() {
    // Update connection status
    updateConnectionStatus(true);
    
    // Update welcome message
    updateWelcomeMessage();
    
    // Setup current date
    updateCurrentDate();
}

function setupEventListeners() {
    // Refresh button
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', function() {
            loadDashboardData();
            showToast('Data diperbarui', 'success');
        });
    }
    
    // Search activity
    const activitySearch = document.getElementById('activitySearch');
    if (activitySearch) {
        activitySearch.addEventListener('input', function(e) {
            searchActivity(e.target.value);
        });
    }
    
    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            handleLogout();
        });
    }
    
    // Clear search button
    const clearSearchBtn = document.getElementById('clearSearchBtn');
    if (clearSearchBtn) {
        clearSearchBtn.addEventListener('click', function() {
            document.getElementById('activitySearch').value = '';
            searchActivity('');
        });
    }
    
    // Navigation links
    setupNavigation();
    
    // Quick action buttons
    setupQuickActions();
}

function setupNavigation() {
    // Highlight current page
    const currentPage = window.location.pathname.split('/').pop();
    const navLinks = document.querySelectorAll('.sidebar .nav-link');
    
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPage) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
        
        // Add click handler for smooth transition
        link.addEventListener('click', function(e) {
            if (this.getAttribute('href') !== currentPage) {
                showLoadingOverlay();
            }
        });
    });
}

function setupQuickActions() {
    // Quick action: Add production
    const quickProductionBtn = document.getElementById('quickProductionBtn');
    if (quickProductionBtn) {
        quickProductionBtn.addEventListener('click', function() {
            window.location.href = 'production.html?action=add';
        });
    }
    
    // Quick action: Add sales
    const quickSalesBtn = document.getElementById('quickSalesBtn');
    if (quickSalesBtn) {
        quickSalesBtn.addEventListener('click', function() {
            window.location.href = 'sales.html?action=add';
        });
    }
}

function setupAutoRefresh() {
    // Clear existing interval
    if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
    }
    
    // Set new interval
    autoRefreshInterval = setInterval(() => {
        refreshDashboardData();
    }, CONFIG.AUTO_REFRESH_INTERVAL);
}

function refreshDashboardData() {
    // Refresh only real-time data
    updateRealTimeStats();
    updateNotificationsList();
    updateConnectionStatus(true);
}

// ==================== DATA LOADING ====================
function loadDashboardData() {
    console.log('Loading dashboard data...');
    
    // Show loading state
    showLoadingState(true);
    
    // Simulate API call
    setTimeout(() => {
        try {
            // Update all components
            updateDashboardStats();
            updateCharts();
            updateRecentActivity();
            updateBestSellingProducts();
            updateNotificationsList();
            updateSidebarNotifications();
            updateRealTimeStats();
            
            // Hide loading state
            showLoadingState(false);
            
            // Show success message
            showToast('Dashboard dimuat dengan sukses', 'success');
            
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            showToast('Gagal memuat data dashboard', 'danger');
            showLoadingState(false);
        }
    }, 800);
}

function updateDashboardStats() {
    // Calculate totals
    const totalProd = demoData.production.reduce((sum, p) => sum + p.quantity, 0);
    const totalSales = demoData.sales.reduce((sum, s) => sum + s.quantity, 0);
    const totalRevenue = demoData.sales.reduce((sum, s) => sum + s.total, 0);
    const totalExpenses = demoData.expenses.reduce((sum, e) => sum + e.amount, 0);
    const totalInventory = demoData.inventory.reduce((sum, i) => sum + i.quantity, 0);
    
    // Calculate profit and margin
    const inventoryValue = demoData.inventory.reduce((sum, i) => sum + (i.quantity * i.buyPrice), 0);
    const profit = totalRevenue - totalExpenses - inventoryValue;
    const profitMargin = totalRevenue > 0 ? (profit / totalRevenue * 100) : 0;
    
    // Update DOM elements
    document.getElementById('totalProduction').textContent = formatNumber(totalProd);
    document.getElementById('totalSales').textContent = formatNumber(totalSales);
    document.getElementById('totalRevenue').textContent = formatCurrency(totalRevenue);
    document.getElementById('totalExpenses').textContent = formatCurrency(totalExpenses);
    document.getElementById('totalInventory').textContent = formatNumber(totalInventory);
    document.getElementById('profitMargin').textContent = `${profitMargin.toFixed(1)}%`;
    
    // Update trends
    updateTrendIndicators();
}

function updateTrendIndicators() {
    const indicators = document.querySelectorAll('.data-flow-indicator');
    
    indicators.forEach(indicator => {
        // Add animation class
        indicator.classList.add('pulse');
        
        // Remove animation after completion
        setTimeout(() => {
            indicator.classList.remove('pulse');
        }, 2000);
    });
}

function updateCharts() {
    updateProductionChart();
    updateProductChart();
    updateSalesChart();
}

function updateProductionChart() {
    const ctx = document.getElementById('productionChart');
    if (!ctx) return;
    
    // Destroy existing chart
    if (productionChart) {
        productionChart.destroy();
    }
    
    // Prepare data for last 7 days
    const labels = [];
    const productionData = [];
    const salesData = [];
    
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        labels.push(formatChartDate(dateStr));
        
        // Calculate production for this day
        const dayProduction = demoData.production
            .filter(p => p.date === dateStr)
            .reduce((sum, p) => sum + p.quantity, 0);
        productionData.push(dayProduction || getRandomInt(50, 200));
        
        // Calculate sales for this day
        const daySales = demoData.sales
            .filter(s => s.date === dateStr)
            .reduce((sum, s) => sum + s.quantity, 0);
        salesData.push(daySales || getRandomInt(30, 150));
    }
    
    // Create chart
    productionChart = new Chart(ctx.getContext('2d'), {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Produksi',
                    data: productionData,
                    borderColor: '#4361ee',
                    backgroundColor: 'rgba(67, 97, 238, 0.1)',
                    borderWidth: 2,
                    tension: 0.4,
                    fill: true,
                    pointBackgroundColor: '#4361ee',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    pointRadius: 4,
                    pointHoverRadius: 6
                },
                {
                    label: 'Penjualan',
                    data: salesData,
                    borderColor: '#4cc9f0',
                    backgroundColor: 'rgba(76, 201, 240, 0.1)',
                    borderWidth: 2,
                    tension: 0.4,
                    fill: true,
                    pointBackgroundColor: '#4cc9f0',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    pointRadius: 4,
                    pointHoverRadius: 6
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        font: {
                            size: 11,
                            family: "'Segoe UI', sans-serif"
                        },
                        padding: 15,
                        usePointStyle: true
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    titleFont: { size: 12 },
                    bodyFont: { size: 12 },
                    cornerRadius: 6
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    },
                    ticks: {
                        font: { size: 10 },
                        callback: function(value) {
                            return value.toLocaleString('id-ID');
                        }
                    },
                    title: {
                        display: true,
                        text: 'Jumlah (butir)',
                        font: { size: 11 }
                    }
                },
                x: {
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    },
                    ticks: {
                        font: { size: 10 },
                        maxRotation: 45
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'nearest'
            }
        }
    });
}

function updateProductChart() {
    const ctx = document.getElementById('productChart');
    if (!ctx) return;
    
    // Destroy existing chart
    if (productChart) {
        productChart.destroy();
    }
    
    // Calculate product distribution from production
    const productDistribution = {};
    demoData.production.forEach(p => {
        if (!productDistribution[p.product]) {
            productDistribution[p.product] = 0;
        }
        productDistribution[p.product] += p.quantity;
    });
    
    // Prepare data
    const labels = Object.keys(productDistribution);
    const data = Object.values(productDistribution);
    const backgroundColors = [
        'rgba(67, 97, 238, 0.8)',
        'rgba(76, 201, 240, 0.8)',
        'rgba(58, 12, 163, 0.8)',
        'rgba(114, 9, 183, 0.8)',
        'rgba(247, 37, 133, 0.8)'
    ];
    
    // Create chart
    productChart = new Chart(ctx.getContext('2d'), {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: backgroundColors.slice(0, labels.length),
                borderWidth: 0,
                hoverOffset: 20
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        font: {
                            size: 11,
                            family: "'Segoe UI', sans-serif"
                        },
                        padding: 20,
                        usePointStyle: true,
                        pointStyle: 'circle'
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = Math.round((value / total) * 100);
                            return `${label}: ${value.toLocaleString('id-ID')} butir (${percentage}%)`;
                        }
                    },
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    cornerRadius: 6
                }
            },
            cutout: '70%'
        }
    });
}

function updateSalesChart() {
    const ctx = document.getElementById('salesChart');
    if (!ctx) return;
    
    // Prepare sales data by product
    const salesByProduct = {};
    demoData.sales.forEach(s => {
        if (!salesByProduct[s.product]) {
            salesByProduct[s.product] = 0;
        }
        salesByProduct[s.product] += s.total;
    });
    
    const labels = Object.keys(salesByProduct);
    const data = Object.values(salesByProduct);
    
    // Create chart if element exists
    if (labels.length > 0) {
        salesChart = new Chart(ctx.getContext('2d'), {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Pendapatan',
                    data: data,
                    backgroundColor: 'rgba(67, 97, 238, 0.6)',
                    borderColor: '#4361ee',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return 'Rp ' + value.toLocaleString('id-ID');
                            }
                        }
                    }
                }
            }
        });
    }
}

function updateRecentActivity() {
    const container = document.getElementById('recentActivity');
    if (!container) return;
    
    // Combine all activities
    const allActivities = [];
    
    // Add production activities
    demoData.production.forEach(p => {
        allActivities.push({
            id: p.id,
            date: p.date,
            time: '09:00',
            product: p.product,
            type: 'Produksi',
            quantity: p.quantity,
            status: p.status,
            impact: `+${p.quantity}`,
            action: 'production',
            icon: 'bi-egg-fried'
        });
    });
    
    // Add sales activities
    demoData.sales.forEach(s => {
        allActivities.push({
            id: s.id,
            date: s.date,
            time: '14:00',
            product: s.product,
            type: 'Penjualan',
            quantity: s.quantity,
            status: s.status,
            impact: `-${s.quantity}`,
            action: 'sales',
            icon: 'bi-cart'
        });
    });
    
    // Add expense activities
    demoData.expenses.forEach(e => {
        allActivities.push({
            id: e.id,
            date: e.date,
            time: '11:00',
            product: e.description,
            type: 'Pengeluaran',
            quantity: 1,
            status: e.status,
            impact: `-${formatCurrency(e.amount)}`,
            action: 'expenses',
            icon: 'bi-cash-coin'
        });
    });
    
    // Sort by date (newest first)
    allActivities.sort((a, b) => {
        const dateA = new Date(a.date + 'T' + a.time);
        const dateB = new Date(b.date + 'T' + b.time);
        return dateB - dateA;
    });
    
    // Take only 10 most recent
    const recent = allActivities.slice(0, 10);
    
    // Update DOM
    container.innerHTML = '';
    
    if (recent.length === 0) {
        container.innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-5">
                    <i class="bi bi-inbox display-4 text-muted mb-3"></i>
                    <p class="text-muted">Belum ada aktivitas</p>
                </td>
            </tr>
        `;
        return;
    }
    
    recent.forEach(activity => {
        const row = document.createElement('tr');
        row.className = 'activity-row';
        
        const statusClass = activity.status === 'Selesai' || activity.status === 'Lunas' ? 'success' : 'warning';
        const impactClass = activity.impact.startsWith('+') ? 'success' : 'danger';
        
        row.innerHTML = `
            <td>
                <div class="d-flex align-items-center">
                    <i class="bi ${activity.icon} me-2 text-primary"></i>
                    <div>
                        <div class="fw-bold">${formatDate(activity.date)}</div>
                        <small class="text-muted">${activity.time}</small>
                    </div>
                </div>
            </td>
            <td>
                <div class="fw-bold">${activity.product}</div>
                <small class="text-muted">${activity.type}</small>
            </td>
            <td>
                <span class="badge bg-primary">${activity.type}</span>
            </td>
            <td>
                <span class="fw-bold">${activity.type === 'Pengeluaran' ? '-' : activity.quantity.toLocaleString('id-ID') + ' butir'}</span>
            </td>
            <td>
                <span class="badge bg-${statusClass}">${activity.status}</span>
            </td>
            <td>
                <span class="badge bg-${impactClass}">${activity.impact}</span>
            </td>
            <td>
                <button class="btn btn-sm btn-outline-primary view-activity" data-action="${activity.action}" data-id="${activity.id}">
                    <i class="bi bi-eye"></i>
                </button>
                <button class="btn btn-sm btn-outline-secondary ms-1" onclick="copyActivity('${activity.id}')">
                    <i class="bi bi-files"></i>
                </button>
            </td>
        `;
        
        container.appendChild(row);
    });
    
    // Add event listeners to view buttons
    container.querySelectorAll('.view-activity').forEach(btn => {
        btn.addEventListener('click', function() {
            const action = this.getAttribute('data-action');
            const id = this.getAttribute('data-id');
            viewActivity(action, id);
        });
    });
}

function updateBestSellingProducts() {
    const container = document.getElementById('bestSellingProducts');
    if (!container) return;
    
    const products = demoData.bestSelling;
    
    container.innerHTML = '';
    
    products.forEach((product, index) => {
        const rankClass = index === 0 ? 'bg-warning text-dark' : 
                        index === 1 ? 'bg-secondary' : 
                        index === 2 ? 'bg-danger' : 'bg-info';
        
        const trendIcon = product.trend === 'up' ? 'bi-arrow-up' : 
                         product.trend === 'down' ? 'bi-arrow-down' : 'bi-dash';
        const trendColor = product.trend === 'up' ? 'text-success' : 
                          product.trend === 'down' ? 'text-danger' : 'text-muted';
        
        const item = document.createElement('div');
        item.className = 'best-selling-item d-flex align-items-center mb-3 p-3 border rounded';
        
        item.innerHTML = `
            <div class="rank-badge me-3">
                <span class="badge ${rankClass} rounded-circle d-flex align-items-center justify-content-center" 
                      style="width: 40px; height: 40px; font-size: 1rem;">
                    ${index + 1}
                </span>
            </div>
            <div class="flex-grow-1">
                <div class="d-flex justify-content-between align-items-center mb-1">
                    <h6 class="mb-0 fw-bold">${product.product}</h6>
                    <span class="badge bg-light text-dark">
                        <i class="bi ${trendIcon} ${trendColor} me-1"></i>
                        ${product.trend === 'up' ? 'Naik' : product.trend === 'down' ? 'Turun' : 'Stabil'}
                    </span>
                </div>
                <div class="row">
                    <div class="col-6">
                        <small class="text-muted">Terjual:</small>
                        <div class="fw-bold">${product.sales.toLocaleString('id-ID')} butir</div>
                    </div>
                    <div class="col-6">
                        <small class="text-muted">Pendapatan:</small>
                        <div class="fw-bold">${formatCurrency(product.revenue)}</div>
                    </div>
                </div>
                <div class="progress mt-2" style="height: 6px;">
                    <div class="progress-bar" role="progressbar" 
                         style="width: ${(product.sales / products[0].sales * 100)}%"></div>
                </div>
            </div>
        `;
        
        container.appendChild(item);
    });
}

function updateNotificationsList() {
    const container = document.getElementById('integratedNotifications');
    if (!container) return;
    
    const notifications = demoData.notifications;
    
    container.innerHTML = '';
    
    notifications.forEach(notification => {
        const alert = document.createElement('div');
        alert.className = `alert alert-${notification.type} alert-dismissible fade show`;
        
        alert.innerHTML = `
            <div class="d-flex align-items-center">
                <i class="bi ${notification.icon} fs-5 me-3"></i>
                <div class="flex-grow-1">
                    <div class="fw-bold">${notification.message}</div>
                    <small class="text-muted">${notification.time}</small>
                </div>
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;
        
        container.appendChild(alert);
    });
}

function updateSidebarNotifications() {
    // Calculate notification counts
    const lowStockCount = demoData.inventory.filter(i => i.quantity < i.minStock).length;
    const inactiveCustomerCount = demoData.customers.filter(c => c.status === 'Tidak Aktif').length;
    const pendingPaymentCount = demoData.sales.filter(s => s.status !== 'Lunas').length;
    
    // Update badge counts
    updateBadge('inventoryNotifications', lowStockCount);
    updateBadge('customerNotifications', inactiveCustomerCount);
    updateBadge('salesNotifications', pendingPaymentCount);
    
    // Total notifications
    const totalNotifications = lowStockCount + inactiveCustomerCount + pendingPaymentCount;
    updateBadge('dashboardNotifications', totalNotifications);
}

function updateRealTimeStats() {
    // Update current time
    updateCurrentTime();
    
    // Update active users count (simulated)
    const activeUsers = Math.floor(Math.random() * 5) + 1;
    const activeUsersEl = document.getElementById('activeUsers');
    if (activeUsersEl) {
        activeUsersEl.textContent = activeUsers;
    }
    
    // Update system status
    updateSystemStatus();
}

// ==================== HELPER FUNCTIONS ====================
function updateConnectionStatus(isConnected) {
    const statusElement = document.getElementById('dashboardConnectionStatus');
    if (!statusElement) return;
    
    const indicator = statusElement.querySelector('.status-indicator');
    const statusText = document.getElementById('connectionStatusText');
    
    if (isConnected) {
        indicator.className = 'status-indicator status-connected';
        if (statusText) {
            statusText.textContent = 'Terhubung ke sistem';
            statusText.className = 'text-success';
        }
    } else {
        indicator.className = 'status-indicator status-disconnected';
        if (statusText) {
            statusText.textContent = 'Mode offline';
            statusText.className = 'text-danger';
        }
    }
}

function updateWelcomeMessage() {
    const welcomeElement = document.getElementById('welcomeMessage');
    if (welcomeElement && userData) {
        const hour = new Date().getHours();
        let greeting = '';
        
        if (hour < 12) greeting = 'Selamat pagi';
        else if (hour < 15) greeting = 'Selamat siang';
        else if (hour < 19) greeting = 'Selamat sore';
        else greeting = 'Selamat malam';
        
        welcomeElement.textContent = `${greeting}, ${userData.name || userData.username}!`;
    }
}

function updateCurrentDate() {
    const dateElement = document.getElementById('currentDate');
    if (dateElement) {
        const now = new Date();
        const options = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        };
        dateElement.textContent = now.toLocaleDateString('id-ID', options);
    }
}

function updateCurrentTime() {
    const timeElement = document.getElementById('currentTime');
    if (timeElement) {
        const now = new Date();
        timeElement.textContent = now.toLocaleTimeString('id-ID', { 
            hour: '2-digit', 
            minute: '2-digit',
            second: '2-digit'
        });
    }
}

function updateSystemStatus() {
    // Simulate system health check
    const systems = [
        { name: 'Database', status: Math.random() > 0.1 ? 'healthy' : 'warning' },
        { name: 'API', status: 'healthy' },
        { name: 'Storage', status: 'healthy' },
        { name: 'Network', status: Math.random() > 0.2 ? 'healthy' : 'warning' }
    ];
    
    const healthyCount = systems.filter(s => s.status === 'healthy').length;
    const systemStatusEl = document.getElementById('systemStatus');
    
    if (systemStatusEl) {
        systemStatusEl.textContent = `${healthyCount}/${systems.length} sistem berjalan normal`;
        systemStatusEl.className = healthyCount === systems.length ? 'text-success' : 'text-warning';
    }
}

function showLoadingState(show) {
    const loadingElement = document.getElementById('loadingState');
    if (loadingElement) {
        loadingElement.style.display = show ? 'flex' : 'none';
    }
    
    // Disable buttons during loading
    const buttons = document.querySelectorAll('#refreshBtn, .view-activity');
    buttons.forEach(btn => {
        btn.disabled = show;
    });
}

function showLoadingOverlay() {
    const overlay = document.createElement('div');
    overlay.id = 'loadingOverlay';
    overlay.className = 'loading-overlay';
    overlay.innerHTML = `
        <div class="loading-content">
            <div class="spinner-border text-primary"></div>
            <div class="mt-3">Memuat...</div>
        </div>
    `;
    document.body.appendChild(overlay);
    
    // Remove overlay after navigation
    setTimeout(() => {
        if (overlay.parentNode) {
            overlay.remove();
        }
    }, 2000);
}

function searchActivity(query) {
    const activityRows = document.querySelectorAll('.activity-row');
    const noResultsRow = document.getElementById('noResultsRow');
    
    if (!query.trim()) {
        // Show all rows
        activityRows.forEach(row => row.style.display = '');
        if (noResultsRow) noResultsRow.style.display = 'none';
        return;
    }
    
    const searchTerm = query.toLowerCase();
    let foundResults = false;
    
    activityRows.forEach(row => {
        const rowText = row.textContent.toLowerCase();
        if (rowText.includes(searchTerm)) {
            row.style.display = '';
            foundResults = true;
            
            // Highlight matching text
            const cells = row.querySelectorAll('td');
            cells.forEach(cell => {
                const original = cell.innerHTML;
                const highlighted = original.replace(
                    new RegExp(searchTerm, 'gi'),
                    match => `<mark class="bg-warning">${match}</mark>`
                );
                cell.innerHTML = highlighted;
            });
        } else {
            row.style.display = 'none';
        }
    });
    
    // Show no results message
    if (!foundResults) {
        if (!noResultsRow) {
            const container = document.getElementById('recentActivity');
            const row = document.createElement('tr');
            row.id = 'noResultsRow';
            row.innerHTML = `
                <td colspan="7" class="text-center py-4">
                    <i class="bi bi-search display-4 text-muted mb-3"></i>
                    <p class="text-muted">Tidak ditemukan aktivitas dengan kata kunci "${query}"</p>
                </td>
            `;
            container.appendChild(row);
        } else {
            noResultsRow.style.display = '';
        }
    } else if (noResultsRow) {
        noResultsRow.style.display = 'none';
    }
}

function viewActivity(type, id) {
    switch(type) {
        case 'production':
            window.location.href = `production.html?view=${id}`;
            break;
        case 'sales':
            window.location.href = `sales.html?view=${id}`;
            break;
        case 'expenses':
            window.location.href = `expenses.html?view=${id}`;
            break;
        case 'inventory':
            window.location.href = `inventory.html?view=${id}`;
            break;
        default:
            showToast('Aksi tidak tersedia', 'warning');
    }
}

function copyActivity(id) {
    // Find activity by id
    let activity = null;
    
    // Search in all data arrays
    for (const key in demoData) {
        if (Array.isArray(demoData[key])) {
            const found = demoData[key].find(item => item.id == id);
            if (found) {
                activity = found;
                break;
            }
        }
    }
    
    if (activity) {
        const text = JSON.stringify(activity, null, 2);
        navigator.clipboard.writeText(text).then(() => {
            showToast('Data berhasil disalin ke clipboard', 'success');
        }).catch(err => {
            console.error('Failed to copy:', err);
            showToast('Gagal menyalin data', 'danger');
        });
    } else {
        showToast('Data tidak ditemukan', 'warning');
    }
}

function handleLogout() {
    if (confirm('Apakah Anda yakin ingin logout?')) {
        showLoadingState(true);
        
        // Clear auto refresh
        if (autoRefreshInterval) {
            clearInterval(autoRefreshInterval);
        }
        
        // Clear user data
        localStorage.removeItem('eggUser');
        
        // Show logout message
        showToast('Logout berhasil, mengarahkan ke login...', 'success');
        
        // Redirect after delay
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1500);
    }
}

function updateBadge(elementId, count) {
    const element = document.getElementById(elementId);
    if (element) {
        if (count > 0) {
            element.textContent = count > 99 ? '99+' : count;
            element.style.display = 'flex';
            
            // Add animation
            element.classList.add('badge-pulse');
            setTimeout(() => {
                element.classList.remove('badge-pulse');
            }, 1000);
        } else {
            element.style.display = 'none';
        }
    }
}

// ==================== UTILITY FUNCTIONS ====================
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

function formatChartDate(dateString) {
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString;
        
        const now = new Date();
        if (date.toDateString() === now.toDateString()) {
            return 'Hari ini';
        }
        
        return date.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short'
        });
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

function formatNumber(num) {
    return num.toLocaleString('id-ID');
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
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
function addDashboardStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .status-indicator {
            width: 12px;
            height: 12px;
            border-radius: 50%;
            display: inline-block;
            margin-right: 8px;
        }
        
        .status-connected {
            background-color: #28a745;
            box-shadow: 0 0 10px rgba(40, 167, 69, 0.5);
        }
        
        .status-disconnected {
            background-color: #dc3545;
            box-shadow: 0 0 10px rgba(220, 53, 69, 0.5);
        }
        
        .data-flow-indicator {
            width: 10px;
            height: 10px;
            border-radius: 50%;
            display: inline-block;
            margin-right: 6px;
        }
        
        .flow-positive {
            background-color: #28a745;
        }
        
        .flow-negative {
            background-color: #dc3545;
        }
        
        .flow-neutral {
            background-color: #ffc107;
        }
        
        .pulse {
            animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
            0% { transform: scale(0.95); opacity: 0.7; }
            50% { transform: scale(1.1); opacity: 1; }
            100% { transform: scale(0.95); opacity: 0.7; }
        }
        
        .badge-pulse {
            animation: badgePulse 0.6s ease-in-out;
        }
        
        @keyframes badgePulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.2); }
            100% { transform: scale(1); }
        }
        
        .loading-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(255, 255, 255, 0.9);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
        }
        
        .loading-content {
            text-align: center;
            padding: 30px;
            background: white;
            border-radius: 15px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.1);
        }
        
        .best-selling-item {
            transition: all 0.3s ease;
        }
        
        .best-selling-item:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 20px rgba(0,0,0,0.1);
        }
        
        .activity-row:hover {
            background-color: rgba(67, 97, 238, 0.05);
        }
        
        .rank-badge {
            min-width: 40px;
        }
        
        mark {
            background-color: #ffeb3b;
            padding: 0 2px;
            border-radius: 2px;
        }
        
        .progress-bar {
            background: linear-gradient(90deg, #4361ee, #4cc9f0);
            border-radius: 3px;
        }
    `;
    document.head.appendChild(style);
}

// Add styles when page loads
addDashboardStyles();

// ==================== WINDOW EXPORTS ====================
window.viewActivity = viewActivity;
window.searchActivity = searchActivity;
window.copyActivity = copyActivity;
window.handleLogout = handleLogout;
// ==================== CHART RESIZE FUNCTIONS ====================

function resizeDashboardCharts() {
    console.log('Resizing dashboard charts...');
    
    // Resize production chart
    if (productionChart) {
        productionChart.resize();
        productionChart.update();
    }
    
    // Resize product chart
    if (productChart) {
        productChart.resize();
        productChart.update();
    }
    
    // Resize sales chart
    if (salesChart) {
        salesChart.resize();
        salesChart.update();
    }
}

// Adjust layout when sidebar is toggled
function adjustDashboardLayout(isMinimized) {
    const header = document.querySelector('.header');
    const cards = document.querySelectorAll('.card');
    const statCards = document.querySelectorAll('.integrated-stat-card');
    const chartContainers = document.querySelectorAll('.chart-container');
    
    if (isMinimized) {
        // Adjust header
        if (header) {
            header.style.padding = '20px';
            header.querySelector('h2').style.fontSize = '1.5rem';
            header.querySelector('p').style.fontSize = '0.9rem';
        }
        
        // Adjust stat cards
        statCards.forEach(card => {
            card.style.padding = '15px';
            card.style.minWidth = '160px';
        });
        
        // Adjust chart containers
        chartContainers.forEach(container => {
            container.style.padding = '20px';
            container.querySelector('h5').style.fontSize = '1rem';
        });
        
        // Adjust cards
        cards.forEach(card => {
            card.style.marginBottom = '20px';
            const cardHeader = card.querySelector('.card-header');
            if (cardHeader) {
                cardHeader.style.padding = '15px 20px';
                const h5 = cardHeader.querySelector('h5');
                if (h5) h5.style.fontSize = '1.1rem';
            }
        });
        
        // Adjust table font size
        const tables = document.querySelectorAll('.table');
        tables.forEach(table => {
            table.style.fontSize = '0.9rem';
        });
        
    } else {
        // Reset to normal
        if (header) {
            header.style.padding = '';
            header.querySelector('h2').style.fontSize = '';
            header.querySelector('p').style.fontSize = '';
        }
        
        statCards.forEach(card => {
            card.style.padding = '';
            card.style.minWidth = '';
        });
        
        chartContainers.forEach(container => {
            container.style.padding = '';
            container.querySelector('h5').style.fontSize = '';
        });
        
        cards.forEach(card => {
            card.style.marginBottom = '';
            const cardHeader = card.querySelector('.card-header');
            if (cardHeader) {
                cardHeader.style.padding = '';
                const h5 = cardHeader.querySelector('h5');
                if (h5) h5.style.fontSize = '';
            }
        });
        
        const tables = document.querySelectorAll('.table');
        tables.forEach(table => {
            table.style.fontSize = '';
        });
    }
}

// Update window exports
window.resizeDashboardCharts = resizeDashboardCharts;
window.adjustDashboardLayout = adjustDashboardLayout;

// ==================== CHART RESIZE FUNCTIONS ====================

function resizeDashboardCharts() {
    console.log('Resizing dashboard charts...');
    
    // Resize production chart
    if (productionChart) {
        try {
            productionChart.resize();
            productionChart.update('none'); // Update tanpa animasi untuk performa
        } catch (error) {
            console.warn('Error resizing production chart:', error);
        }
    }
    
    // Resize product chart
    if (productChart) {
        try {
            productChart.resize();
            productChart.update('none');
        } catch (error) {
            console.warn('Error resizing product chart:', error);
        }
    }
    
    // Resize sales chart
    if (salesChart) {
        try {
            salesChart.resize();
            salesChart.update('none');
        } catch (error) {
            console.warn('Error resizing sales chart:', error);
        }
    }
}

// Adjust layout when sidebar is toggled
function adjustDashboardLayout(isMinimized) {
    const header = document.querySelector('.header');
    const cards = document.querySelectorAll('.card');
    const statCards = document.querySelectorAll('.integrated-stat-card');
    const chartContainers = document.querySelectorAll('.chart-container');
    const searchBox = document.querySelector('.search-box');
    const mainContent = document.querySelector('.main-content');
    
    if (isMinimized && window.innerWidth > 768) {
        // When sidebar is minimized on desktop
        if (mainContent) {
            mainContent.style.width = `calc(100% - ${CONFIG.SIDEBAR_MINIMIZED || 70}px)`;
            mainContent.style.maxWidth = `calc(100% - ${CONFIG.SIDEBAR_MINIMIZED || 70}px)`;
        }
        
        // Adjust header
        if (header) {
            header.style.padding = '25px 40px';
            const h2 = header.querySelector('h2');
            if (h2) h2.style.fontSize = '2.2rem';
            const p = header.querySelector('p');
            if (p) p.style.fontSize = '1.1rem';
        }
        
        // Adjust stat cards
        statCards.forEach(card => {
            card.style.padding = '25px 20px';
            card.style.minWidth = '200px';
            const h4 = card.querySelector('h4');
            if (h4) h4.style.fontSize = '2.2rem';
            const p = card.querySelector('p');
            if (p) p.style.fontSize = '1.05rem';
        });
        
        // Adjust chart containers
        chartContainers.forEach(container => {
            container.style.padding = '25px 35px';
            container.style.height = '380px';
            const h5 = container.querySelector('h5');
            if (h5) h5.style.fontSize = '1.3rem';
        });
        
        // Adjust cards
        cards.forEach(card => {
            card.style.marginBottom = '30px';
            const cardHeader = card.querySelector('.card-header');
            if (cardHeader) {
                cardHeader.style.padding = '20px 30px';
                const h5 = cardHeader.querySelector('h5');
                if (h5) h5.style.fontSize = '1.4rem';
            }
            const cardBody = card.querySelector('.card-body');
            if (cardBody) {
                cardBody.style.padding = '20px 30px';
            }
        });
        
        // Adjust table font size and padding
        const tables = document.querySelectorAll('.table');
        tables.forEach(table => {
            table.style.fontSize = '0.95rem';
            const thCells = table.querySelectorAll('th');
            const tdCells = table.querySelectorAll('td');
            thCells.forEach(cell => cell.style.padding = '12px 15px');
            tdCells.forEach(cell => cell.style.padding = '12px 15px');
        });
        
        // Adjust search box
        if (searchBox) {
            searchBox.style.minWidth = '350px';
        }
        
    } else {
        // Reset to normal
        if (mainContent) {
            mainContent.style.width = '';
            mainContent.style.maxWidth = '';
        }
        
        if (header) {
            header.style.padding = '';
            const h2 = header.querySelector('h2');
            if (h2) h2.style.fontSize = '';
            const p = header.querySelector('p');
            if (p) p.style.fontSize = '';
        }
        
        statCards.forEach(card => {
            card.style.padding = '';
            card.style.minWidth = '';
            const h4 = card.querySelector('h4');
            if (h4) h4.style.fontSize = '';
            const p = card.querySelector('p');
            if (p) p.style.fontSize = '';
        });
        
        chartContainers.forEach(container => {
            container.style.padding = '';
            container.style.height = '';
            const h5 = container.querySelector('h5');
            if (h5) h5.style.fontSize = '';
        });
        
        cards.forEach(card => {
            card.style.marginBottom = '';
            const cardHeader = card.querySelector('.card-header');
            if (cardHeader) {
                cardHeader.style.padding = '';
                const h5 = cardHeader.querySelector('h5');
                if (h5) h5.style.fontSize = '';
            }
            const cardBody = card.querySelector('.card-body');
            if (cardBody) {
                cardBody.style.padding = '';
            }
        });
        
        const tables = document.querySelectorAll('.table');
        tables.forEach(table => {
            table.style.fontSize = '';
            const thCells = table.querySelectorAll('th');
            const tdCells = table.querySelectorAll('td');
            thCells.forEach(cell => cell.style.padding = '');
            tdCells.forEach(cell => cell.style.padding = '');
        });
        
        if (searchBox) {
            searchBox.style.minWidth = '';
        }
    }
}

// Add configuration for sidebar
CONFIG.SIDEBAR_MINIMIZED = 70;
CONFIG.SIDEBAR_MAXIMIZED = 250;

// Update window exports
window.resizeDashboardCharts = resizeDashboardCharts;
window.adjustDashboardLayout = adjustDashboardLayout;