// Inisialisasi saat halaman dimuat
document.addEventListener('DOMContentLoaded', function() {
    initializeSettings();
});

// Fungsi inisialisasi pengaturan
function initializeSettings() {
    // Load user profile dari localStorage
    loadUserProfile();
    
    // Setup event listeners
    setupEventListeners();
}

// Setup event listeners
function setupEventListeners() {
    // Simpan profil
    document.getElementById('profileForm').addEventListener('submit', handleSaveProfile);
    
    // Ubah password
    document.getElementById('securityForm').addEventListener('submit', handleChangePassword);
    
    // Simpan pengaturan sistem
    document.getElementById('saveSystemSettings').addEventListener('click', handleSaveSystemSettings);
    
    // Logout
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);
}

// Load profil pengguna
function loadUserProfile() {
    const savedUser = localStorage.getItem('eggTrackUser');
    if (savedUser) {
        const user = JSON.parse(savedUser);
        document.getElementById('fullName').value = user.name || 'Administrator';
        document.getElementById('userEmail').value = user.email || 'admin@eggtrack.com';
    }
}

// Handler untuk menyimpan profil
function handleSaveProfile(e) {
    e.preventDefault();
    
    const fullName = document.getElementById('fullName').value;
    const userEmail = document.getElementById('userEmail').value;

    if (!fullName) {
        showToast('Nama lengkap harus diisi', 'danger');
        return;
    }

    // Update user data di localStorage
    const savedUser = localStorage.getItem('eggTrackUser');
    if (savedUser) {
        const user = JSON.parse(savedUser);
        user.name = fullName;
        user.email = userEmail;
        localStorage.setItem('eggTrackUser', JSON.stringify(user));
    }

    showToast('Profil berhasil diperbarui', 'success');
}

// Handler untuk mengubah password
function handleChangePassword(e) {
    e.preventDefault();
    
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

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

    // Untuk demo, kita simpan di localStorage
    // Dalam aplikasi real, ini akan dikirim ke server
    showToast('Password berhasil diubah', 'success');
    document.getElementById('securityForm').reset();
}

// Handler untuk menyimpan pengaturan sistem
function handleSaveSystemSettings() {
    // Simpan pengaturan sistem
    // Untuk demo, kita hanya tampilkan toast
    showToast('Pengaturan sistem berhasil disimpan', 'success');
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