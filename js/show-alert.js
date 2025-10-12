function showAlert(message, type = 'info', duration = 3000) {
  const container = document.getElementById('globalAlertContainer');
  if (!container) return;

  const alertEl = document.createElement('div');
  alertEl.className = `toast-alert toast-${type}`;
  alertEl.textContent = message;

  container.appendChild(alertEl);

  // Tampilkan animasi
  setTimeout(() => alertEl.classList.add('show'), 10);

  // Hapus setelah durasi
  setTimeout(() => {
    alertEl.classList.remove('show');
    setTimeout(() => container.removeChild(alertEl), 300); // Selesai animasi
  }, duration);
}

// Bisa dipanggil global:
window.showAlert = showAlert;
