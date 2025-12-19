// settings.js - Sistem Pengaturan EggTrack Admin

// ==================== KONFIGURASI ====================
const SETTINGS_CONFIG = {
    APP_NAME: 'EggTrack Admin',
    SESSION_TIMEOUT: 24 * 60 * 60 * 1000, // 24 jam
    SETTINGS_STORAGE_KEY: 'eggTrackSystemSettings',
    USER_STORAGE_KEY: 'eggUser'
};

// ==================== INISIALISASI ====================
document.addEventListener('DOMContentLoaded', function() {
    console.log('Settings page loading...');
    
    // 1. Cek autentikasi
    if (!checkAuth()) {
        return;
    }
    
    // 2. Setup UI
    setupUI();
    
    // 3. Load data
    loadUserData();
    loadSystemSettings();
    
    // 4. Setup event listeners
    setupEventListeners();
    
    console.log('Settings page initialized successfully');
});

// ==================== FUNGSI AUTH ====================
function checkAuth() {
    const user = localStorage.getItem(SETTINGS_CONFIG.USER_STORAGE_KEY);
    if (!user) {
        window.location.href = 'login.html';
        return false;
    }
    
    try {
        const userData = JSON.parse(user);
        
        // Cek session timeout
        const loginTime = new Date(userData.loginTime);
        const now = new Date();
        const hoursDiff = (now - loginTime) / (1000 * 60 * 60);
        
        if (hoursDiff >= 24) {
            localStorage.removeItem(SETTINGS_CONFIG.USER_STORAGE_KEY);
            window.location.href = 'login.html?session=expired';
            return false;
        }
        
        return true;
    } catch (error) {
        console.error('Auth error:', error);
        localStorage.removeItem(SETTINGS_CONFIG.USER_STORAGE_KEY);
        window.location.href = 'login.html';
        return false;
    }
}

// ==================== FUNGSI UTAMA ====================
function setupUI() {
    // Update current date and time
    updateCurrentDateTime();
    setInterval(updateCurrentDateTime, 1000);
    
    // Update connection status
    updateConnectionStatus(true);
    
    // Setup loading state
    setupLoadingState();
}

function loadUserData() {
    const user = localStorage.getItem(SETTINGS_CONFIG.USER_STORAGE_KEY);
    if (user) {
        try {
            const userData = JSON.parse(user);
            updateUserDisplay(userData);
            populateProfileForm(userData);
        } catch (error) {
            console.error('Error loading user data:', error);
            showToast('Gagal memuat data pengguna', 'danger');
        }
    }
}

function loadSystemSettings() {
    const savedSettings = localStorage.getItem(SETTINGS_CONFIG.SETTINGS_STORAGE_KEY);
    if (savedSettings) {
        try {
            const settings = JSON.parse(savedSettings);
            populateSystemSettingsForm(settings);
        } catch (error) {
            console.error('Error loading system settings:', error);
            showToast('Gagal memuat pengaturan sistem', 'danger');
        }
    }
}

function setupEventListeners() {
    // Profile form
    const profileForm = document.getElementById('profileForm');
    if (profileForm) {
        profileForm.addEventListener('submit', handleSaveProfile);
    }
    
    // Security form
    const securityForm = document.getElementById('securityForm');
    if (securityForm) {
        securityForm.addEventListener('submit', handleChangePassword);
    }
    
    // System settings save button
    const saveSystemSettingsBtn = document.getElementById('saveSystemSettings');
    if (saveSystemSettingsBtn) {
        saveSystemSettingsBtn.addEventListener('click', handleSaveSystemSettings);
    }
    
    // Logout buttons (sidebar and main content)
    const logoutBtn = document.getElementById('logoutBtn');
    const logoutBtnMain = document.getElementById('logoutBtnMain');
    
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    
    if (logoutBtnMain) {
        logoutBtnMain.addEventListener('click', handleLogout);
    }
    
    // Form validation
    setupFormValidation();
}

function updateUserDisplay(userData) {
    const userRoleDisplay = document.getElementById('userRoleDisplay');
    const userNameDisplay = document.getElementById('userNameDisplay');
    
    if (!userRoleDisplay || !userNameDisplay) return;
    
    const roleMap = {
        'admin': 'Administrator',
        'manager': 'Manager',
        'staff': 'Staff'
    };
    
    userRoleDisplay.textContent = roleMap[userData.role] || userData.role;
    userNameDisplay.textContent = userData.name || userData.username;
}

function populateProfileForm(userData) {
    const fullNameInput = document.getElementById('fullName');
    const userEmailInput = document.getElementById('userEmail');
    const userRoleInput = document.getElementById('userRoleDisplay')?.parentElement?.querySelector('input[disabled]');
    
    if (fullNameInput) {
        fullNameInput.value = userData.name || userData.username || '';
    }
    
    if (userEmailInput) {
        userEmailInput.value = userData.email || '';
    }
    
    if (userRoleInput) {
        userRoleInput.value = userData.role ? roleMap[userData.role] || userData.role : 'Administrator';
    }
}

function populateSystemSettingsForm(settings) {
    const companyNameInput = document.getElementById('companyName');
    const currencySelect = document.getElementById('currency');
    const emailNotificationsCheck = document.getElementById('emailNotifications');
    const autoBackupCheck = document.getElementById('autoBackup');
    
    if (companyNameInput && settings.companyName) {
        companyNameInput.value = settings.companyName;
    }
    
    if (currencySelect && settings.currency) {
        currencySelect.value = settings.currency;
    }
    
    if (emailNotificationsCheck) {
        emailNotificationsCheck.checked = settings.emailNotifications !== false;
    }
    
    if (autoBackupCheck) {
        autoBackupCheck.checked = settings.autoBackup !== false;
    }
}

// ==================== HANDLERS ====================
function handleSaveProfile(e) {
    e.preventDefault();
    
    const fullName = document.getElementById('fullName').value.trim();
    const userEmail = document.getElementById('userEmail').value.trim();
    
    // Validasi
    if (!fullName) {
        showToast('Nama lengkap harus diisi', 'danger');
        return;
    }
    
    if (userEmail && !isValidEmail(userEmail)) {
        showToast('Format email tidak valid', 'danger');
        return;
    }
    
    // Tampilkan loading state
    showLoadingState(true);
    
    // Simulasi API call
    setTimeout(() => {
        try {
            // Update user data di localStorage
            const user = localStorage.getItem(SETTINGS_CONFIG.USER_STORAGE_KEY);
            if (user) {
                const userData = JSON.parse(user);
                userData.name = fullName;
                userData.email = userEmail;
                localStorage.setItem(SETTINGS_CONFIG.USER_STORAGE_KEY, JSON.stringify(userData));
                
                // Update display di sidebar
                updateUserDisplay(userData);
                
                showToast('Profil berhasil diperbarui', 'success');
            } else {
                showToast('Data pengguna tidak ditemukan', 'danger');
            }
        } catch (error) {
            console.error('Error saving profile:', error);
            showToast('Gagal menyimpan profil', 'danger');
        } finally {
            showLoadingState(false);
        }
    }, 1000);
}

function handleChangePassword(e) {
    e.preventDefault();
    
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    // Validasi
    if (!currentPassword || !newPassword || !confirmPassword) {
        showToast('Semua field password harus diisi', 'danger');
        return;
    }
    
    if (newPassword !== confirmPassword) {
        showToast('Password baru tidak cocok', 'danger');
        return;
    }
    
    if (newPassword.length < 6) {
        showToast('Password baru harus minimal 6 karakter', 'danger');
        return;
    }
    
    // Tampilkan loading state
    showLoadingState(true);
    
    // Simulasi API call untuk ganti password
    setTimeout(() => {
        try {
            // Dalam aplikasi real, ini akan dikirim ke server
            // Untuk demo, kita hanya simpan di localStorage
            const user = localStorage.getItem(SETTINGS_CONFIG.USER_STORAGE_KEY);
            if (user) {
                const userData = JSON.parse(user);
                // Simpan timestamp perubahan password
                userData.passwordChangedAt = new Date().toISOString();
                localStorage.setItem(SETTINGS_CONFIG.USER_STORAGE_KEY, JSON.stringify(userData));
            }
            
            showToast('Password berhasil diubah', 'success');
            document.getElementById('securityForm').reset();
        } catch (error) {
            console.error('Error changing password:', error);
            showToast('Gagal mengubah password', 'danger');
        } finally {
            showLoadingState(false);
        }
    }, 1500);
}

function handleSaveSystemSettings() {
    const btn = document.getElementById('saveSystemSettings');
    if (!btn) return;
    
    const originalText = btn.innerHTML;
    
    // Tampilkan loading state pada tombol
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span> Menyimpan...';
    btn.disabled = true;
    
    // Kumpulkan data
    const systemSettings = {
        companyName: document.getElementById('companyName').value.trim(),
        currency: document.getElementById('currency').value,
        emailNotifications: document.getElementById('emailNotifications').checked,
        autoBackup: document.getElementById('autoBackup').checked,
        lastUpdated: new Date().toISOString()
    };
    
    // Simulasi API call
    setTimeout(() => {
        try {
            // Simpan ke localStorage
            localStorage.setItem(SETTINGS_CONFIG.SETTINGS_STORAGE_KEY, JSON.stringify(systemSettings));
            
            // Simulasi pengiriman ke server
            console.log('System settings saved:', systemSettings);
            
            showToast('Pengaturan sistem berhasil disimpan', 'success');
            
            // Update display jika perlu
            updateSystemSettingsDisplay(systemSettings);
            
        } catch (error) {
            console.error('Error saving system settings:', error);
            showToast('Gagal menyimpan pengaturan sistem', 'danger');
        } finally {
            // Kembalikan tombol ke keadaan semula
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    }, 1200);
}

function handleLogout(e) {
    if (e) e.preventDefault();
    
    if (confirm('Apakah Anda yakin ingin logout dari sistem?')) {
        showLoadingState(true);
        
        // Clear user session
        localStorage.removeItem(SETTINGS_CONFIG.USER_STORAGE_KEY);
        
        // Show logout message
        showToast('Logout berhasil, mengarahkan ke halaman login...', 'success');
        
        // Redirect after delay
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1500);
    }
}

// ==================== HELPER FUNCTIONS ====================
function updateCurrentDateTime() {
    const now = new Date();
    const dateElement = document.getElementById('currentDate');
    const timeElement = document.getElementById('currentTime');
    
    if (dateElement) {
        const options = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        };
        dateElement.textContent = now.toLocaleDateString('id-ID', options);
    }
    
    if (timeElement) {
        timeElement.textContent = now.toLocaleTimeString('id-ID', { 
            hour: '2-digit', 
            minute: '2-digit',
            second: '2-digit'
        });
    }
}

function updateConnectionStatus(isConnected) {
    const statusElement = document.querySelector('.connection-status');
    if (!statusElement) return;
    
    const indicator = statusElement.querySelector('.status-indicator');
    const statusText = statusElement.querySelector('#connectionStatusText');
    
    if (isConnected) {
        if (indicator) {
            indicator.className = 'status-indicator status-connected';
        }
        if (statusText) {
            statusText.textContent = 'Terhubung ke sistem';
            statusText.className = 'text-success';
        }
    } else {
        if (indicator) {
            indicator.className = 'status-indicator status-disconnected';
        }
        if (statusText) {
            statusText.textContent = 'Mode offline';
            statusText.className = 'text-danger';
        }
    }
}

function setupLoadingState() {
    // Setup loading state untuk halaman settings
    const loadingElement = document.getElementById('loadingState');
    if (loadingElement) {
        loadingElement.style.display = 'none';
    }
}

function showLoadingState(show) {
    const loadingElement = document.getElementById('loadingState');
    if (loadingElement) {
        loadingElement.style.display = show ? 'flex' : 'none';
    }
    
    // Disable/enable form buttons selama loading
    const formButtons = document.querySelectorAll('#profileForm button, #securityForm button, #saveSystemSettings');
    formButtons.forEach(btn => {
        if (btn) btn.disabled = show;
    });
}

function setupFormValidation() {
    // Setup validasi untuk form password
    const newPassword = document.getElementById('newPassword');
    const confirmPassword = document.getElementById('confirmPassword');
    
    if (newPassword && confirmPassword) {
        confirmPassword.addEventListener('input', function() {
            if (newPassword.value !== confirmPassword.value) {
                confirmPassword.setCustomValidity('Password tidak cocok');
            } else {
                confirmPassword.setCustomValidity('');
            }
        });
    }
    
    // Setup validasi untuk email
    const emailInput = document.getElementById('userEmail');
    if (emailInput) {
        emailInput.addEventListener('input', function() {
            if (this.value && !isValidEmail(this.value)) {
                this.setCustomValidity('Format email tidak valid');
            } else {
                this.setCustomValidity('');
            }
        });
    }
}

function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function updateSystemSettingsDisplay(settings) {
    // Fungsi untuk update tampilan berdasarkan pengaturan
    // Misalnya: update judul halaman, dll
    if (settings.companyName) {
        document.title = `Pengaturan - ${settings.companyName}`;
    }
}

// ==================== UTILITY FUNCTIONS ====================
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

// ==================== EVENT LISTENERS GLOBAL ====================
// Setup event listeners untuk elemen yang mungkin belum ada saat DOMContentLoaded
document.addEventListener('click', function(e) {
    // Handle konfirmasi perubahan yang belum disimpan
    if (e.target.matches('a:not([href^="#"]):not([href^="javascript"]):not([download])')) {
        const hasUnsavedChanges = checkUnsavedChanges();
        if (hasUnsavedChanges) {
            e.preventDefault();
            const confirmLeave = confirm('Anda memiliki perubahan yang belum disimpan. Yakin ingin meninggalkan halaman?');
            if (confirmLeave) {
                window.location.href = e.target.href;
            }
        }
    }
});

function checkUnsavedChanges() {
    // Cek apakah ada perubahan yang belum disimpan di form
    const profileForm = document.getElementById('profileForm');
    const securityForm = document.getElementById('securityForm');
    
    let hasChanges = false;
    
    if (profileForm) {
        const originalData = getOriginalFormData(profileForm);
        const currentData = new FormData(profileForm);
        hasChanges = !areFormDataEqual(originalData, currentData);
    }
    
    if (!hasChanges && securityForm) {
        const currentPassword = securityForm.querySelector('#currentPassword').value;
        const newPassword = securityForm.querySelector('#newPassword').value;
        const confirmPassword = securityForm.querySelector('#confirmPassword').value;
        hasChanges = !!(currentPassword || newPassword || confirmPassword);
    }
    
    return hasChanges;
}

function getOriginalFormData(form) {
    // Simulasi data original (dalam aplikasi real, ini akan diambil dari server)
    const data = new FormData();
    const inputs = form.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
        if (input.name) {
            data.append(input.name, input.defaultValue || '');
        }
    });
    return data;
}

function areFormDataEqual(data1, data2) {
    const entries1 = Array.from(data1.entries());
    const entries2 = Array.from(data2.entries());
    
    if (entries1.length !== entries2.length) return false;
    
    for (let i = 0; i < entries1.length; i++) {
        const [key1, value1] = entries1[i];
        const [key2, value2] = entries2[i];
        
        if (key1 !== key2 || value1 !== value2) {
            return false;
        }
    }
    
    return true;
}

// ==================== EXPORT FUNCTIONS ====================
// Export fungsi yang diperlukan ke global scope
window.handleLogout = handleLogout;
window.handleSaveProfile = handleSaveProfile;
window.handleChangePassword = handleChangePassword;
window.handleSaveSystemSettings = handleSaveSystemSettings;

// ==================== STYLES ====================
function addSettingsStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .settings-section {
            margin-bottom: 30px;
        }
        
        .settings-card {
            transition: all 0.3s ease;
        }
        
        .settings-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
        }
        
        .form-check-label {
            font-weight: 500;
            color: var(--dark);
        }
        
        .form-check-input:checked {
            background-color: var(--primary);
            border-color: var(--primary);
        }
        
        .logout-card {
            border: 2px solid #dc3545;
        }
        
        .logout-card .card-header {
            background-color: #dc3545;
        }
        
        .logout-card .card-body {
            background-color: rgba(220, 53, 69, 0.05);
        }
        
        .password-strength {
            margin-top: 5px;
            font-size: 0.85rem;
        }
        
        .password-strength.weak {
            color: #dc3545;
        }
        
        .password-strength.medium {
            color: #ffc107;
        }
        
        .password-strength.strong {
            color: #28a745;
        }
        
        .settings-divider {
            border-top: 2px solid rgba(0,0,0,0.1);
            margin: 30px 0;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        .settings-card {
            animation: fadeIn 0.5s ease-out;
        }
        
        .settings-card:nth-child(1) { animation-delay: 0.1s; }
        .settings-card:nth-child(2) { animation-delay: 0.2s; }
        .settings-card:nth-child(3) { animation-delay: 0.3s; }
    `;
    document.head.appendChild(style);
}

// Add styles when page loads
addSettingsStyles();