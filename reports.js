// ==================== KONFIGURASI ====================
const CONFIG = {
    APP_NAME: 'EggTrack Reports',
    API_URL: 'https://script.google.com/macros/s/AKfycbw33dktX5-SK_8A84pVDpKh8JtUQOhHGg6rB54CWO4hdlpUhgfBwPuKSMqoJ18QsZBp/exec',
    REPORTS_API_URL: 'https://script.google.com/macros/s/AKfycbxpkV9khWzZ6CErdwpulFytH9UimnJ4NEhv8HPiGYUrSYvws5yhaoUPolqRwr1VD109/exec',
    SESSION_TIMEOUT: 24 * 60 * 60 * 1000, // 24 jam
    AUTO_REFRESH_INTERVAL: 300000 // 5 menit
};

// ==================== VARIABEL GLOBAL ====================
let financialChart = null;
let expensesChart = null;
let productionSalesChart = null;
let autoRefreshInterval = null;
let reportData = {
    production: [],
    sales: [],
    expenses: [],
    customers: [],
    inventory: []
};
let userData = null;
let currentPeriod = 'monthly';

// ==================== DATA DEMO ====================
const initializeDemoData = () => {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    // Generate data for last 30 days
    const productionData = [];
    const salesData = [];
    const expensesData = [];
    
    for (let i = 29; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        // Production data
        productionData.push({
            id: i + 1,
            date: dateStr,
            product: i % 4 === 0 ? 'Telur Ayam Kampung' : 
                    i % 4 === 1 ? 'Telur Ayam Ras' : 
                    i % 4 === 2 ? 'Telur Bebek' : 'Telur Puyuh',
            quantity: Math.floor(Math.random() * 200) + 100,
            grade: i % 3 === 0 ? 'A' : i % 3 === 1 ? 'B' : 'C',
            status: 'Selesai',
            notes: 'Produksi normal'
        });
        
        // Sales data
        salesData.push({
            id: i + 1,
            date: dateStr,
            product: i % 4 === 0 ? 'Telur Ayam Kampung' : 
                    i % 4 === 1 ? 'Telur Ayam Ras' : 
                    i % 4 === 2 ? 'Telur Bebek' : 'Telur Puyuh',
            quantity: Math.floor(Math.random() * 150) + 50,
            price: i % 4 === 0 ? 2500 : 
                  i % 4 === 1 ? 2000 : 
                  i % 4 === 2 ? 3500 : 500,
            total: 0, // Will be calculated
            customer: i % 4 === 0 ? 'Toko Sejahtera' : 
                     i % 4 === 1 ? 'Warung Sembako' : 
                     i % 4 === 2 ? 'Restoran Pondok' : 'Supermarket Indah',
            status: 'Lunas',
            paymentMethod: i % 2 === 0 ? 'Transfer' : 'Cash'
        });
        
        // Calculate total for sales
        const sale = salesData[salesData.length - 1];
        sale.total = sale.quantity * sale.price;
        
        // Expenses data
        expensesData.push({
            id: i + 1,
            date: dateStr,
            amount: Math.floor(Math.random() * 100000) + 50000,
            description: i % 5 === 0 ? 'Pakan Ayam' : 
                        i % 5 === 1 ? 'Vitamin Unggas' : 
                        i % 5 === 2 ? 'Perbaikan Kandang' : 
                        i % 5 === 3 ? 'Obat-obatan' : 'Transportasi',
            category: i % 4 === 0 ? 'Operasional' : 
                     i % 4 === 1 ? 'Kesehatan' : 
                     i % 4 === 2 ? 'Pemeliharaan' : 'Lain-lain',
            status: 'Selesai'
        });
    }
    
    reportData = {
        production: productionData,
        sales: salesData,
        expenses: expensesData,
        customers: [
            { id: 1, name: 'Toko Sejahtera', type: 'Retail', totalOrders: 25, totalSpent: 6250000 },
            { id: 2, name: 'Warung Sembako', type: 'Retail', totalOrders: 18, totalSpent: 3600000 },
            { id: 3, name: 'Restoran Pondok', type: 'Restoran', totalOrders: 12, totalSpent: 4200000 },
            { id: 4, name: 'Supermarket Indah', type: 'Supermarket', totalOrders: 30, totalSpent: 7500000 }
        ],
        inventory: [
            { id: 1, product: 'Telur Ayam Kampung', quantity: 300, buyPrice: 2000, sellPrice: 2500 },
            { id: 2, product: 'Telur Ayam Ras', quantity: 250, buyPrice: 1500, sellPrice: 2000 },
            { id: 3, product: 'Telur Bebek', quantity: 30, buyPrice: 3000, sellPrice: 3500 },
            { id: 4, product: 'Telur Puyuh', quantity: 50, buyPrice: 400, sellPrice: 500 }
        ]
    };
    
    console.log('Demo data initialized:', {
        production: reportData.production.length,
        sales: reportData.sales.length,
        expenses: reportData.expenses.length
    });
};

// ==================== INISIALISASI ====================
document.addEventListener('DOMContentLoaded', function() {
    console.log('Reports page loading...');
    
    // 1. Cek autentikasi
    if (!checkAuth()) {
        return;
    }
    
    // 2. Inisialisasi data
    initializeDemoData();
    loadUserData();
    
    // 3. Setup event listeners
    setupEventListeners();
    
    // 4. Load data laporan
    loadReportData();
    
    // 5. Setup auto refresh
    setupAutoRefresh();
    
    console.log('Reports page initialized successfully');
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

// ==================== EVENT LISTENERS ====================
function setupEventListeners() {
    // Generate report button
    const generateBtn = document.getElementById('generateReport');
    if (generateBtn) {
        generateBtn.addEventListener('click', function() {
            const startDate = document.getElementById('reportStartDate').value;
            const endDate = document.getElementById('reportEndDate').value;
            generateFinancialReport(startDate, endDate);
        });
    }
    
    // Export report button
    const exportBtn = document.getElementById('exportReport');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportReportToCSV);
    }
    
    // Chart type selectors
    const financialChartType = document.getElementById('financialChartType');
    const expensesChartType = document.getElementById('expensesChartType');
    
    if (financialChartType) {
        financialChartType.addEventListener('change', function() {
            updateFinancialChart(this.value);
        });
    }
    
    if (expensesChartType) {
        expensesChartType.addEventListener('change', function() {
            updateExpensesChart(this.value);
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
    
    // Set default dates
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    
    const startDateInput = document.getElementById('reportStartDate');
    const endDateInput = document.getElementById('reportEndDate');
    
    if (startDateInput) {
        startDateInput.value = firstDay.toISOString().split('T')[0];
        startDateInput.max = today.toISOString().split('T')[0];
    }
    
    if (endDateInput) {
        endDateInput.value = today.toISOString().split('T')[0];
        endDateInput.max = today.toISOString().split('T')[0];
        endDateInput.min = firstDay.toISOString().split('T')[0];
    }
    
    // Date input validation
    if (startDateInput && endDateInput) {
        startDateInput.addEventListener('change', function() {
            if (endDateInput.value && this.value > endDateInput.value) {
                endDateInput.value = this.value;
            }
            endDateInput.min = this.value;
        });
        
        endDateInput.addEventListener('change', function() {
            if (startDateInput.value && this.value < startDateInput.value) {
                startDateInput.value = this.value;
            }
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
        refreshReportData();
    }, CONFIG.AUTO_REFRESH_INTERVAL);
}

function refreshReportData() {
    // Refresh only stats and summary
    updateReportStats();
    updateReportSummaryTable();
    showToast('Data laporan diperbarui', 'info');
}

// ==================== DATA LOADING ====================
function loadReportData() {
    console.log('Loading report data...');
    
    // Show loading state
    showLoadingState(true);
    
    // Simulate API call
    setTimeout(() => {
        try {
            // Update all components
            updateReportStats();
            updateFinancialChart();
            updateExpensesChart();
            updateProductionSalesChart();
            updateReportSummaryTable();
            
            // Hide loading state
            showLoadingState(false);
            
            // Show success message
            showToast('Laporan dimuat dengan sukses', 'success');
            
        } catch (error) {
            console.error('Error loading report data:', error);
            showToast('Gagal memuat data laporan', 'danger');
            showLoadingState(false);
        }
    }, 1000);
}

function updateReportStats() {
    // Calculate totals
    const totalProd = reportData.production.reduce((sum, p) => sum + (p.quantity || 0), 0);
    const totalSales = reportData.sales.reduce((sum, s) => sum + (s.quantity || 0), 0);
    const totalRevenue = reportData.sales.reduce((sum, s) => sum + (s.total || 0), 0);
    const totalExpenses = reportData.expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    const netProfit = totalRevenue - totalExpenses;
    
    // Update DOM elements
    document.getElementById('totalProduction').textContent = formatNumber(totalProd);
    document.getElementById('totalSales').textContent = formatNumber(totalSales);
    document.getElementById('totalRevenue').textContent = formatCurrency(totalRevenue);
    document.getElementById('netProfit').textContent = formatCurrency(netProfit);
}

function updateFinancialChart(chartType = 'bar') {
    const ctx = document.getElementById('financialChart');
    if (!ctx) return;
    
    // Destroy existing chart
    if (financialChart) {
        financialChart.destroy();
    }
    
    const revenue = reportData.sales.reduce((sum, s) => sum + (s.total || 0), 0);
    const expenses = reportData.expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    const profit = revenue - expenses;
    
    // Create chart
    financialChart = new Chart(ctx.getContext('2d'), {
        type: chartType,
        data: {
            labels: ['Pendapatan', 'Pengeluaran', 'Keuntungan'],
            datasets: [{
                label: 'Jumlah (Rp)',
                data: [revenue, expenses, profit],
                backgroundColor: [
                    'rgba(67, 97, 238, 0.7)',
                    'rgba(220, 53, 69, 0.7)',
                    'rgba(40, 167, 69, 0.7)'
                ],
                borderColor: [
                    '#4361ee',
                    '#dc3545',
                    '#28a745'
                ],
                borderWidth: 2,
                borderRadius: chartType === 'bar' ? 8 : 0,
                hoverBackgroundColor: [
                    'rgba(67, 97, 238, 0.9)',
                    'rgba(220, 53, 69, 0.9)',
                    'rgba(40, 167, 69, 0.9)'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            label += formatCurrency(context.raw);
                            return label;
                        }
                    },
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
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
                        callback: function(value) {
                            return formatCurrencyShort(value);
                        },
                        font: {
                            size: 11
                        }
                    }
                },
                x: {
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    },
                    ticks: {
                        font: {
                            size: 11
                        }
                    }
                }
            }
        }
    });
}

function updateExpensesChart(chartType = 'pie') {
    const ctx = document.getElementById('expensesChart');
    if (!ctx) return;
    
    // Destroy existing chart
    if (expensesChart) {
        expensesChart.destroy();
    }
    
    // Categorize expenses
    const expenseCategories = {};
    reportData.expenses.forEach(e => {
        if (e && e.category) {
            if (!expenseCategories[e.category]) expenseCategories[e.category] = 0;
            expenseCategories[e.category] += parseInt(e.amount || 0);
        }
    });
    
    const labels = Object.keys(expenseCategories);
    const data = Object.values(expenseCategories);
    
    // Color palette
    const backgroundColors = [
        'rgba(67, 97, 238, 0.8)',
        'rgba(76, 201, 240, 0.8)',
        'rgba(58, 12, 163, 0.8)',
        'rgba(114, 9, 183, 0.8)',
        'rgba(247, 37, 133, 0.8)',
        'rgba(255, 159, 64, 0.8)'
    ];
    
    // Create chart
    expensesChart = new Chart(ctx.getContext('2d'), {
        type: chartType,
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: backgroundColors.slice(0, labels.length),
                borderWidth: 0,
                hoverOffset: 15
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        font: {
                            size: 11,
                            family: "'Segoe UI', sans-serif"
                        },
                        padding: 15,
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
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `${label}: ${formatCurrency(value)} (${percentage}%)`;
                        }
                    },
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    cornerRadius: 6
                }
            },
            cutout: chartType === 'doughnut' ? '50%' : 0
        }
    });
}

function updateProductionSalesChart() {
    const ctx = document.getElementById('productionSalesChart');
    if (!ctx) return;
    
    // Destroy existing chart
    if (productionSalesChart) {
        productionSalesChart.destroy();
    }
    
    // Prepare data for last 30 days
    const labels = [];
    const productionData = [];
    const salesData = [];
    
    for (let i = 29; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        // Format label
        if (i === 0) {
            labels.push('Hari ini');
        } else if (i === 29) {
            labels.push(date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }));
        } else if (i % 5 === 0) {
            labels.push(date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }));
        } else {
            labels.push('');
        }
        
        // Calculate production for this day
        const dayProduction = reportData.production
            .filter(p => p.date === dateStr)
            .reduce((sum, p) => sum + (p.quantity || 0), 0);
        productionData.push(dayProduction);
        
        // Calculate sales for this day
        const daySales = reportData.sales
            .filter(s => s.date === dateStr)
            .reduce((sum, s) => sum + (s.quantity || 0), 0);
        salesData.push(daySales);
    }
    
    // Create chart
    productionSalesChart = new Chart(ctx.getContext('2d'), {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Produksi',
                    data: productionData,
                    borderColor: '#4361ee',
                    backgroundColor: 'rgba(67, 97, 238, 0.1)',
                    borderWidth: 3,
                    tension: 0.4,
                    fill: true,
                    pointBackgroundColor: '#4361ee',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    pointRadius: 3,
                    pointHoverRadius: 5
                },
                {
                    label: 'Penjualan',
                    data: salesData,
                    borderColor: '#4cc9f0',
                    backgroundColor: 'rgba(76, 201, 240, 0.1)',
                    borderWidth: 3,
                    tension: 0.4,
                    fill: true,
                    pointBackgroundColor: '#4cc9f0',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    pointRadius: 3,
                    pointHoverRadius: 5
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
                            size: 12,
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
                    cornerRadius: 6,
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            label += formatNumber(context.raw) + ' butir';
                            return label;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    },
                    ticks: {
                        font: { size: 11 },
                        callback: function(value) {
                            return value.toLocaleString('id-ID');
                        }
                    },
                    title: {
                        display: true,
                        text: 'Jumlah (butir)',
                        font: { size: 12 }
                    }
                },
                x: {
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    },
                    ticks: {
                        font: { size: 11 },
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

function updateReportSummaryTable() {
    const tbody = document.getElementById('reportSummary');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    let periods = [];
    
    switch (currentPeriod) {
        case 'daily':
            // Last 7 days
            for (let i = 6; i >= 0; i--) {
                const date = new Date();
                date.setDate(date.getDate() - i);
                periods.push({
                    label: formatDate(date.toISOString().split('T')[0]),
                    key: date.toISOString().split('T')[0],
                    type: 'daily'
                });
            }
            break;
            
        case 'weekly':
            // Last 4 weeks
            for (let i = 3; i >= 0; i--) {
                const date = new Date();
                date.setDate(date.getDate() - (i * 7));
                const weekStart = new Date(date);
                weekStart.setDate(date.getDate() - date.getDay());
                const weekEnd = new Date(weekStart);
                weekEnd.setDate(weekStart.getDate() + 6);
                
                periods.push({
                    label: `Minggu ${i + 1}`,
                    start: weekStart.toISOString().split('T')[0],
                    end: weekEnd.toISOString().split('T')[0],
                    type: 'weekly'
                });
            }
            break;
            
        case 'monthly':
        default:
            // Last 6 months
            for (let i = 5; i >= 0; i--) {
                const date = new Date();
                date.setMonth(date.getMonth() - i);
                const monthYear = `${date.toLocaleString('id-ID', { month: 'long' })} ${date.getFullYear()}`;
                const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                
                periods.push({
                    label: monthYear,
                    key: monthKey,
                    type: 'monthly'
                });
            }
            break;
    }
    
    if (periods.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center py-5">
                    <i class="bi bi-inbox display-4 text-muted mb-3"></i>
                    <p class="text-muted">Tidak ada data laporan</p>
                </td>
            </tr>
        `;
        return;
    }
    
    periods.forEach(period => {
        let monthProduction = 0;
        let monthSales = 0;
        let monthRevenue = 0;
        let monthExpenses = 0;
        
        if (period.type === 'monthly') {
            // Monthly data
            monthProduction = reportData.production
                .filter(p => p.date && p.date.startsWith(period.key))
                .reduce((sum, p) => sum + (p.quantity || 0), 0);
                
            monthSales = reportData.sales
                .filter(s => s.date && s.date.startsWith(period.key))
                .reduce((sum, s) => sum + (s.quantity || 0), 0);
                
            monthRevenue = reportData.sales
                .filter(s => s.date && s.date.startsWith(period.key))
                .reduce((sum, s) => sum + (s.total || 0), 0);
                
            monthExpenses = reportData.expenses
                .filter(e => e.date && e.date.startsWith(period.key))
                .reduce((sum, e) => sum + (e.amount || 0), 0);
                
        } else if (period.type === 'weekly') {
            // Weekly data
            monthProduction = reportData.production
                .filter(p => p.date >= period.start && p.date <= period.end)
                .reduce((sum, p) => sum + (p.quantity || 0), 0);
                
            monthSales = reportData.sales
                .filter(s => s.date >= period.start && s.date <= period.end)
                .reduce((sum, s) => sum + (s.quantity || 0), 0);
                
            monthRevenue = reportData.sales
                .filter(s => s.date >= period.start && s.date <= period.end)
                .reduce((sum, s) => sum + (s.total || 0), 0);
                
            monthExpenses = reportData.expenses
                .filter(e => e.date >= period.start && e.date <= period.end)
                .reduce((sum, e) => sum + (e.amount || 0), 0);
                
        } else {
            // Daily data
            monthProduction = reportData.production
                .filter(p => p.date === period.key)
                .reduce((sum, p) => sum + (p.quantity || 0), 0);
                
            monthSales = reportData.sales
                .filter(s => s.date === period.key)
                .reduce((sum, s) => sum + (s.quantity || 0), 0);
                
            monthRevenue = reportData.sales
                .filter(s => s.date === period.key)
                .reduce((sum, s) => sum + (s.total || 0), 0);
                
            monthExpenses = reportData.expenses
                .filter(e => e.date === period.key)
                .reduce((sum, e) => sum + (e.amount || 0), 0);
        }
        
        const monthProfit = monthRevenue - monthExpenses;
        const monthMargin = monthRevenue > 0 ? ((monthProfit / monthRevenue) * 100).toFixed(1) : 0;
        
        // Determine trend
        let trendIcon = 'bi-dash';
        let trendColor = 'secondary';
        let trendText = 'Stabil';
        
        if (monthProfit > 0) {
            trendIcon = 'bi-arrow-up';
            trendColor = 'success';
            trendText = 'Naik';
        } else if (monthProfit < 0) {
            trendIcon = 'bi-arrow-down';
            trendColor = 'danger';
            trendText = 'Turun';
        }
        
        const row = document.createElement('tr');
        row.className = 'fade-in';
        
        row.innerHTML = `
            <td>
                <div class="fw-bold">${period.label}</div>
                <small class="text-muted">${period.type === 'daily' ? 'Harian' : period.type === 'weekly' ? 'Mingguan' : 'Bulanan'}</small>
            </td>
            <td>
                <span class="fw-bold">${formatNumber(monthProduction)}</span>
                <div class="small text-muted">butir</div>
            </td>
            <td>
                <span class="fw-bold">${formatNumber(monthSales)}</span>
                <div class="small text-muted">butir</div>
            </td>
            <td>
                <span class="fw-bold text-success">${formatCurrency(monthRevenue)}</span>
            </td>
            <td>
                <span class="fw-bold text-danger">${formatCurrency(monthExpenses)}</span>
            </td>
            <td>
                <span class="fw-bold ${monthProfit >= 0 ? 'text-success' : 'text-danger'}">
                    ${formatCurrency(monthProfit)}
                </span>
            </td>
            <td>
                <span class="badge bg-${monthProfit >= 0 ? 'success' : 'danger'}">
                    ${monthMargin}%
                </span>
            </td>
            <td>
                <span class="badge bg-${trendColor}">
                    <i class="bi ${trendIcon} me-1"></i>${trendText}
                </span>
            </td>
        `;
        
        tbody.appendChild(row);
    });
}

// ==================== REPORT FUNCTIONS ====================
function generateFinancialReport(startDate, endDate) {
    if (!startDate || !endDate) {
        showToast('Harap pilih periode laporan', 'warning');
        return;
    }
    
    showLoadingState(true);
    
    // Filter data based on selected period
    const filteredProduction = reportData.production.filter(p => 
        p.date >= startDate && p.date <= endDate
    );
    
    const filteredSales = reportData.sales.filter(s => 
        s.date >= startDate && s.date <= endDate
    );
    
    const filteredExpenses = reportData.expenses.filter(e => 
        e.date >= startDate && e.date <= endDate
    );
    
    // Update charts with filtered data
    updateFilteredCharts(filteredProduction, filteredSales, filteredExpenses);
    
    // Update summary table
    updateFilteredSummaryTable(filteredProduction, filteredSales, filteredExpenses, startDate, endDate);
    
    showLoadingState(false);
    showToast(`Laporan ${formatDate(startDate)} - ${formatDate(endDate)} berhasil digenerate`, 'success');
}

function updateFilteredCharts(production, sales, expenses) {
    // Update financial chart with filtered data
    const revenue = sales.reduce((sum, s) => sum + (s.total || 0), 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    const profit = revenue - totalExpenses;
    
    if (financialChart) {
        financialChart.data.datasets[0].data = [revenue, totalExpenses, profit];
        financialChart.update();
    }
    
    // Update expenses chart with filtered data
    const expenseCategories = {};
    expenses.forEach(e => {
        if (e && e.category) {
            if (!expenseCategories[e.category]) expenseCategories[e.category] = 0;
            expenseCategories[e.category] += parseInt(e.amount || 0);
        }
    });
    
    if (expensesChart) {
        expensesChart.data.labels = Object.keys(expenseCategories);
        expensesChart.data.datasets[0].data = Object.values(expenseCategories);
        expensesChart.update();
    }
}

function updateFilteredSummaryTable(production, sales, expenses, startDate, endDate) {
    const tbody = document.getElementById('reportSummary');
    tbody.innerHTML = '';
    
    const totalProduction = production.reduce((sum, p) => sum + (p.quantity || 0), 0);
    const totalSales = sales.reduce((sum, s) => sum + (s.quantity || 0), 0);
    const totalRevenue = sales.reduce((sum, s) => sum + (s.total || 0), 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    const profit = totalRevenue - totalExpenses;
    const margin = totalRevenue > 0 ? ((profit / totalRevenue) * 100).toFixed(1) : 0;
    
    // Determine trend
    let trendIcon = 'bi-dash';
    let trendColor = 'secondary';
    let trendText = 'Stabil';
    
    if (profit > 0) {
        trendIcon = 'bi-arrow-up';
        trendColor = 'success';
        trendText = 'Naik';
    } else if (profit < 0) {
        trendIcon = 'bi-arrow-down';
        trendColor = 'danger';
        trendText = 'Turun';
    }
    
    const row = document.createElement('tr');
    row.className = 'fade-in';
    
    row.innerHTML = `
        <td>
            <div class="fw-bold">${formatDate(startDate)} - ${formatDate(endDate)}</div>
            <small class="text-muted">Periode Custom</small>
        </td>
        <td>
            <span class="fw-bold">${formatNumber(totalProduction)}</span>
            <div class="small text-muted">butir</div>
        </td>
        <td>
            <span class="fw-bold">${formatNumber(totalSales)}</span>
            <div class="small text-muted">butir</div>
        </td>
        <td>
            <span class="fw-bold text-success">${formatCurrency(totalRevenue)}</span>
        </td>
        <td>
            <span class="fw-bold text-danger">${formatCurrency(totalExpenses)}</span>
        </td>
        <td>
            <span class="fw-bold ${profit >= 0 ? 'text-success' : 'text-danger'}">
                ${formatCurrency(profit)}
            </span>
        </td>
        <td>
            <span class="badge bg-${profit >= 0 ? 'success' : 'danger'}">
                ${margin}%
            </span>
        </td>
        <td>
            <span class="badge bg-${trendColor}">
                <i class="bi ${trendIcon} me-1"></i>${trendText}
            </span>
        </td>
    `;
    
    tbody.appendChild(row);
}

function exportReportToCSV() {
    const startDate = document.getElementById('reportStartDate').value;
    const endDate = document.getElementById('reportEndDate').value;
    
    if (!startDate || !endDate) {
        showToast('Harap pilih periode laporan terlebih dahulu', 'warning');
        return;
    }
    
    // Filter data
    const filteredProduction = reportData.production.filter(p => 
        p.date >= startDate && p.date <= endDate
    );
    
    const filteredSales = reportData.sales.filter(s => 
        s.date >= startDate && s.date <= endDate
    );
    
    const filteredExpenses = reportData.expenses.filter(e => 
        e.date >= startDate && e.date <= endDate
    );
    
    // Generate CSV content
    let csvContent = "Laporan Keuangan EggTrack\n";
    csvContent += `Periode: ${formatDate(startDate)} - ${formatDate(endDate)}\n`;
    csvContent += "Dibuat pada: " + new Date().toLocaleString('id-ID') + "\n\n";
    
    // Summary section
    csvContent += "RINGKASAN\n";
    csvContent += "Kategori,Jumlah,Keterangan\n";
    
    const totalProduction = filteredProduction.reduce((sum, p) => sum + (p.quantity || 0), 0);
    const totalSales = filteredSales.reduce((sum, s) => sum + (s.quantity || 0), 0);
    const totalRevenue = filteredSales.reduce((sum, s) => sum + (s.total || 0), 0);
    const totalExpenses = filteredExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    const profit = totalRevenue - totalExpenses;
    
    csvContent += `Total Produksi,${totalProduction},butir\n`;
    csvContent += `Total Penjualan,${totalSales},butir\n`;
    csvContent += `Total Pendapatan,${totalRevenue},Rupiah\n`;
    csvContent += `Total Pengeluaran,${totalExpenses},Rupiah\n`;
    csvContent += `Keuntungan Bersih,${profit},Rupiah\n\n`;
    
    // Production details
    csvContent += "DETAIL PRODUKSI\n";
    csvContent += "Tanggal,Produk,Jumlah,Grade,Status,Keterangan\n";
    filteredProduction.forEach(p => {
        csvContent += `${formatDate(p.date)},"${p.product}",${p.quantity},${p.grade},${p.status},"${p.notes || ''}"\n`;
    });
    csvContent += "\n";
    
    // Sales details
    csvContent += "DETAIL PENJUALAN\n";
    csvContent += "Tanggal,Produk,Jumlah,Harga,Total,Pelanggan,Status,Metode Pembayaran\n";
    filteredSales.forEach(s => {
        csvContent += `${formatDate(s.date)},"${s.product}",${s.quantity},${s.price},${s.total},"${s.customer}",${s.status},"${s.paymentMethod}"\n`;
    });
    csvContent += "\n";
    
    // Expenses details
    csvContent += "DETAIL PENGELUARAN\n";
    csvContent += "Tanggal,Deskripsi,Jumlah,Kategori,Status\n";
    filteredExpenses.forEach(e => {
        csvContent += `${formatDate(e.date)},"${e.description}",${e.amount},${e.category},${e.status}\n`;
    });
    
    // Create and download CSV file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `laporan_${startDate}_${endDate}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast('Laporan berhasil diexport ke CSV', 'success');
}

// ==================== HELPER FUNCTIONS ====================
function showLoadingState(show) {
    const loadingElement = document.getElementById('loadingState');
    if (loadingElement) {
        loadingElement.style.display = show ? 'flex' : 'none';
    }
    
    // Disable buttons during loading
    const buttons = document.querySelectorAll('#generateReport, #exportReport');
    buttons.forEach(btn => {
        if (btn) btn.disabled = show;
    });
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

function updateReportPeriod(period) {
    currentPeriod = period;
    updateReportSummaryTable();
    showToast(`Laporan ${period === 'daily' ? 'harian' : period === 'weekly' ? 'mingguan' : 'bulanan'} dimuat`, 'info');
}

// ==================== UTILITY FUNCTIONS ====================
function formatDate(dateString) {
    try {
        if (!dateString) return '-';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString;
        
        return date.toLocaleDateString('id-ID', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    } catch (e) {
        return dateString;
    }
}

function formatCurrency(amount) {
    if (amount >= 1000000000) {
        return 'Rp ' + (amount / 1000000000).toFixed(2) + ' M';
    } else if (amount >= 1000000) {
        return 'Rp ' + (amount / 1000000).toFixed(2) + ' jt';
    } else if (amount >= 1000) {
        return 'Rp ' + (amount / 1000).toFixed(0) + ' rb';
    }
    return 'Rp ' + (amount || 0).toLocaleString('id-ID');
}

function formatCurrencyShort(amount) {
    if (amount >= 1000000000) {
        return (amount / 1000000000).toFixed(1) + 'M';
    } else if (amount >= 1000000) {
        return (amount / 1000000).toFixed(1) + 'jt';
    } else if (amount >= 1000) {
        return (amount / 1000).toFixed(0) + 'k';
    }
    return amount;
}

function formatNumber(num) {
    return (num || 0).toLocaleString('id-ID');
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

// ==================== CHART RESIZE FUNCTIONS ====================
function resizeReportCharts() {
    console.log('Resizing report charts...');
    
    // Resize financial chart
    if (financialChart) {
        try {
            financialChart.resize();
            financialChart.update('none');
        } catch (error) {
            console.warn('Error resizing financial chart:', error);
        }
    }
    
    // Resize expenses chart
    if (expensesChart) {
        try {
            expensesChart.resize();
            expensesChart.update('none');
        } catch (error) {
            console.warn('Error resizing expenses chart:', error);
        }
    }
    
    // Resize production sales chart
    if (productionSalesChart) {
        try {
            productionSalesChart.resize();
            productionSalesChart.update('none');
        } catch (error) {
            console.warn('Error resizing production sales chart:', error);
        }
    }
}

// Function to adjust layout for sidebar
function adjustReportLayout(isMinimized) {
    const header = document.querySelector('.dashboard-header');
    const cards = document.querySelectorAll('.card');
    const chartContainers = document.querySelectorAll('.chart-container');
    const inputGroup = document.querySelector('.input-group');
    
    if (isMinimized && window.innerWidth > 768) {
        // When sidebar is minimized on desktop
        if (header) {
            header.querySelector('h3').style.fontSize = '2.2rem';
            header.querySelector('p').style.fontSize = '1.1rem';
        }
        
        // Adjust chart containers
        chartContainers.forEach(container => {
            container.style.padding = '25px 35px';
            container.style.height = '420px';
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
        
        // Adjust input group
        if (inputGroup) {
            inputGroup.style.width = '280px';
        }
        
    } else {
        // Reset to normal
        if (header) {
            header.querySelector('h3').style.fontSize = '';
            header.querySelector('p').style.fontSize = '';
        }
        
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
        
        if (inputGroup) {
            inputGroup.style.width = '';
        }
    }
}

// ==================== WINDOW EXPORTS ====================
window.updateReportPeriod = updateReportPeriod;
window.resizeReportCharts = resizeReportCharts;
window.adjustReportLayout = adjustReportLayout;
window.handleLogout = handleLogout;

// ==================== STYLES ====================
function addReportStyles() {
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
        
        .fade-in {
            animation: fadeIn 0.5s ease forwards;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        .loading-overlay {
            position: fixed;
            top: 0;
            left: var(--sidebar-width);
            right: 0;
            bottom: 0;
            background: rgba(255, 255, 255, 0.9);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
            transition: left var(--transition-speed) ease;
        }
        
        .sidebar.minimized ~ .loading-overlay {
            left: var(--sidebar-minimized);
        }
        
        .cursor-pointer {
            cursor: pointer;
        }
        
        .chart-tooltip {
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 8px 12px;
            border-radius: 6px;
            font-size: 0.85rem;
            pointer-events: none;
            z-index: 1000;
        }
        
        .progress-bar {
            background: linear-gradient(90deg, #4361ee, #4cc9f0);
            border-radius: 3px;
        }
    `;
    document.head.appendChild(style);
}

// Add styles when page loads
addReportStyles();

// Add resize listener for charts
window.addEventListener('resize', function() {
    if (typeof resizeReportCharts === 'function') {
        resizeReportCharts();
    }
});

// Initialize on page load
console.log('Reports JS loaded successfully');