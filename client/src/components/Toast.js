/**
 * Alertas flotantes de notificación utilizando SweetAlert2 (objeto global Swal)
 */
export function showToast(message, type = 'success') {
  Swal.fire({
    toast: true,
    position: 'top-end',
    icon: type, // Acepta: 'success', 'error', 'warning', 'info'
    title: message,
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    background: '#0f172a', // Slate-900 para diseño premium
    color: '#ffffff',
    iconColor: type === 'success' ? '#10b981' : type === 'error' ? '#f43f5e' : '#f59e0b'
  });
}
