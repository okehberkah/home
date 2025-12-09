// Konfigurasi Apps Script URL
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxpkV9khWzZ6CErdwpulFytH9UimnJ4NEhv8HPiGYUrSYvws5yhaoUPolqRwr1VD109/exec';

// Data untuk laporan
let reportData = {
    production: [],
    sales: [],
    expenses: []
};

// Chart instances
let financialChart = null;
let expensesChart = null;

// Inisialisasi saat halaman dimuat
document.addEventListener('DOMContentLoaded', function() {
    initializeReports();
});

// Fungsi inisialisasi laporan
async function initializeReports() {
    // Set tanggal default
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    
    document.getElementById('reportStartDate').value = firstDay.toISOString().split('T')[0];
    document.getElementById('reportEndDate').value = today.toISOString().split('T')[0];
    
    // Load data laporan
    await loadReportData();
    
    // Setup event listeners
    setupEventListeners();
}

// Setup event listeners
function setupEventListeners() {
    // Generate report
    document.getElementById('generateReport').addEventListener('click', function() {
        const startDate = document.getElementById('reportStartDate').value;
        const endDate = document.getElementById('reportEndDate').value;
        generateFinancialReport(startDate, endDate);
    });
    
    // Export report
    document.getElementById('exportReport').addEventListener('click', exportReportToCSV);
}

// Fungsi untuk memuat data laporan
async function loadReportData() {
    try {
        showLoadingState('reportSummary', true);
        
        const [prodResult, salesResult, expResult] = await Promise.allSettled([
            fetchData('getProduction'),
            fetchData('getSales'),
            fetchData('getExpenses')
        ]);
        
        // Process results
        if (prodResult.status === 'fulfilled' && prodResult.value && prodResult.value.success) {
            reportData.production = prodResult.value.productions || [];
        }
        
        if (salesResult.status === 'fulfilled' && salesResult.value && salesResult.value.success) {
            reportData.sales = salesResult.value.sales || [];
        }
        
        if (expResult.status === 'fulfilled' && expResult.value && expResult.value.success) {
            reportData.expenses = expResult.value.expenses || [];
        }
        
        updateReportsDisplay();
        
    } catch (error) {
        console.error('Error loading report data:', error);
        showToast('Terjadi kesalahan saat memuat data laporan', 'danger');
    }
}

// Fungsi untuk memperbarui tampilan laporan
function updateReportsDisplay() {
    updateFinancialChart();
    updateExpensesChart();
    updateReportSummaryTable();
}

// Update grafik keuangan
function updateFinancialChart() {
    const ctx = document.getElementById('financialChart').getContext('2d');
    
    // Destroy existing chart
    if (financialChart) {
        financialChart.destroy();
    }
    
    const revenue = reportData.sales.reduce((sum, s) => sum + parseInt(s.total || 0), 0);
    const expenses = reportData.expenses.reduce((sum, e) => sum + parseInt(e.amount || 0), 0);
    const profit = revenue - expenses;
    
    financialChart = new Chart(ctx, {
        type: 'bar',
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
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Ringkasan Keuangan'
                },
                legend: {
                    display: false
                }
            },
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

// Update grafik pengeluaran
function updateExpensesChart() {
    const ctx = document.getElementById('expensesChart').getContext('2d');
    
    // Destroy existing chart
    if (expensesChart) {
        expensesChart.destroy();
    }
    
    const expenseCategories = {};
    reportData.expenses.forEach(e => {
        if (e && e.category) {
            if (!expenseCategories[e.category]) expenseCategories[e.category] = 0;
            expenseCategories[e.category] += parseInt(e.amount || 0);
        }
    });
    
    expensesChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: Object.keys(expenseCategories),
            datasets: [{
                data: Object.values(expenseCategories),
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
                title: {
                    display: true,
                    text: 'Distribusi Pengeluaran'
                },
                legend: {
                    position: 'right'
                }
            }
        }
    });
}

// Update tabel ringkasan laporan
function updateReportSummaryTable() {
    const tbody = document.getElementById('reportSummary');
    tbody.innerHTML = '';

    // Generate monthly summary for the last 3 months
    const months = [];
    for (let i = 2; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthYear = `${date.toLocaleString('id-ID', { month: 'long' })} ${date.getFullYear()}`;
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        const monthProduction = reportData.production
            .filter(p => p && p.date && p.date.startsWith(monthKey))
            .reduce((sum, p) => sum + parseInt(p.quantity || 0), 0);
            
        const monthSales = reportData.sales
            .filter(s => s && s.date && s.date.startsWith(monthKey))
            .reduce((sum, s) => sum + parseInt(s.quantity || 0), 0);
            
        const monthRevenue = reportData.sales
            .filter(s => s && s.date && s.date.startsWith(monthKey))
            .reduce((sum, s) => sum + parseInt(s.total || 0), 0);
            
        const monthExpenses = reportData.expenses
            .filter(e => e && e.date && e.date.startsWith(monthKey))
            .reduce((sum, e) => sum + parseInt(e.amount || 0), 0);
            
        const monthProfit = monthRevenue - monthExpenses;
        const monthMargin = monthRevenue > 0 ? ((monthProfit / monthRevenue) * 100).toFixed(1) : 0;
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${monthYear}</td>
            <td>${monthProduction.toLocaleString()}</td>
            <td>${monthSales.toLocaleString()}</td>
            <td>${formatCurrency(monthRevenue)}</td>
            <td>${formatCurrency(monthExpenses)}</td>
            <td>${formatCurrency(monthProfit)}</td>
            <td><span class="badge bg-${monthProfit >= 0 ? 'success' : 'danger'}">${monthMargin}%</span></td>
        `;
        tbody.appendChild(row);
    }
}

// Generate laporan berdasarkan periode
function generateFinancialReport(startDate, endDate) {
    if (!startDate || !endDate) {
        showToast('Harap pilih periode laporan', 'warning');
        return;
    }

    let filteredProduction = reportData.production;
    let filteredSales = reportData.sales;
    let filteredExpenses = reportData.expenses;

    if (startDate && endDate) {
        filteredProduction = reportData.production.filter(p => 
            p.date >= startDate && p.date <= endDate
        );
        filteredSales = reportData.sales.filter(s => 
            s.date >= startDate && s.date <= endDate
        );
        filteredExpenses = reportData.expenses.filter(e => 
            e.date >= startDate && e.date <= endDate
        );
    }

    updateReportCharts(filteredProduction, filteredSales, filteredExpenses);
    updateReportSummary(filteredProduction, filteredSales, filteredExpenses);
    
    showToast('Laporan berhasil digenerate', 'success');
}

// Update charts dengan data terfilter
function updateReportCharts(production, sales, expenses) {
    // Update financial chart
    const financialCtx = document.getElementById('financialChart').getContext('2d');
    if (financialChart) {
        financialChart.destroy();
    }
    
    const revenue = sales.reduce((sum, s) => sum + parseInt(s.total || 0), 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + parseInt(e.amount || 0), 0);
    const profit = revenue - totalExpenses;
    
    financialChart = new Chart(financialCtx, {
        type: 'bar',
        data: {
            labels: ['Pendapatan', 'Pengeluaran', 'Keuntungan'],
            datasets: [{
                label: 'Jumlah (Rp)',
                data: [revenue, totalExpenses, profit],
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
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Ringkasan Keuangan'
                },
                legend: {
                    display: false
                }
            },
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
    
    // Update expenses chart
    const expensesCtx = document.getElementById('expensesChart').getContext('2d');
    if (expensesChart) {
        expensesChart.destroy();
    }
    
    const expenseCategories = {};
    expenses.forEach(e => {
        if (e && e.category) {
            if (!expenseCategories[e.category]) expenseCategories[e.category] = 0;
            expenseCategories[e.category] += parseInt(e.amount || 0);
        }
    });
    
    expensesChart = new Chart(expensesCtx, {
        type: 'pie',
        data: {
            labels: Object.keys(expenseCategories),
            datasets: [{
                data: Object.values(expenseCategories),
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
                title: {
                    display: true,
                    text: 'Distribusi Pengeluaran'
                },
                legend: {
                    position: 'right'
                }
            }
        }
    });
}

// Update ringkasan dengan data terfilter
function updateReportSummary(production, sales, expenses) {
    const tbody = document.getElementById('reportSummary');
    tbody.innerHTML = '';

    const totalProduction = production.reduce((sum, p) => sum + parseInt(p.quantity || 0), 0);
    const totalSales = sales.reduce((sum, s) => sum + parseInt(s.quantity || 0), 0);
    const totalRevenue = sales.reduce((sum, s) => sum + parseInt(s.total || 0), 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + parseInt(e.amount || 0), 0);
    const profit = totalRevenue - totalExpenses;
    const margin = totalRevenue > 0 ? ((profit / totalRevenue) * 100).toFixed(1) : 0;

    const startDate = document.getElementById('reportStartDate').value;
    const endDate = document.getElementById('reportEndDate').value;
    const period = `${formatDate(startDate)} - ${formatDate(endDate)}`;

    const row = document.createElement('tr');
    row.innerHTML = `
        <td>${period}</td>
        <td>${totalProduction.toLocaleString()}</td>
        <td>${totalSales.toLocaleString()}</td>
        <td>${formatCurrency(totalRevenue)}</td>
        <td>${formatCurrency(totalExpenses)}</td>
        <td>${formatCurrency(profit)}</td>
        <td><span class="badge bg-${profit >= 0 ? 'success' : 'danger'}">${margin}%</span></td>
    `;
    tbody.appendChild(row);
}

// Export laporan ke CSV
function exportReportToCSV() {
    const startDate = document.getElementById('reportStartDate').value;
    const endDate = document.getElementById('reportEndDate').value;
    
    let filteredData = {
        production: reportData.production,
        sales: reportData.sales,
        expenses: reportData.expenses
    };

    if (startDate && endDate) {
        filteredData.production = reportData.production.filter(p => 
            p.date >= startDate && p.date <= endDate
        );
        filteredData.sales = reportData.sales.filter(s => 
            s.date >= startDate && s.date <= endDate
        );
        filteredData.expenses = reportData.expenses.filter(e => 
            e.date >= startDate && e.date <= endDate
        );
    }

    const reportDataCSV = generateReportData(filteredData);
    const filename = `laporan_keuangan_${startDate}_to_${endDate}.csv`;
    
    downloadCSV(reportDataCSV, filename);
    showToast('Laporan berhasil diexport', 'success');
}

// Generate data untuk CSV
function generateReportData(data) {
    const reports = [];
    
    // Header
    reports.push(['Tanggal', 'Tipe', 'Deskripsi', 'Jumlah', 'Harga', 'Total', 'Keterangan']);
    
    // Data produksi
    data.production.forEach(prod => {
        reports.push([
            formatDate(prod.date),
            'Produksi',
            `"${prod.product}"`,
            prod.quantity,
            '-',
            '-',
            `"${prod.notes || ''}"`
        ]);
    });

    // Data penjualan
    data.sales.forEach(sale => {
        reports.push([
            formatDate(sale.date),
            'Penjualan',
            `"${sale.product}"`,
            sale.quantity,
            sale.price,
            sale.total,
            `"${sale.customer || ''}"`
        ]);
    });

    // Data pengeluaran
    data.expenses.forEach(expense => {
        reports.push([
            formatDate(expense.date),
            'Pengeluaran',
            `"${expense.description}"`,
            '-',
            '-',
            expense.amount,
            `"${expense.category}"`
        ]);
    });

    // Convert to CSV string
    const csvContent = reports.map(row => row.join(',')).join('\n');
    return csvContent;
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