import Swal from 'sweetalert2';

// Configure SweetAlert2 to show all alerts in top right position
const swalConfig = {
  position: 'top-end' as const,
  toast: true,
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  didOpen: (toast: any) => {
    toast.addEventListener('mouseenter', Swal.stopTimer);
    toast.addEventListener('mouseleave', Swal.resumeTimer);
  }
};

// Create configured SweetAlert instance
export const swal = {
  // Success notification
  success: (title: string, text?: string) => {
    return Swal.fire({
      ...swalConfig,
      icon: 'success',
      title,
      text
    });
  },

  // Error notification
  error: (title: string, text?: string) => {
    return Swal.fire({
      ...swalConfig,
      icon: 'error',
      title,
      text
    });
  },

  // Warning notification
  warning: (title: string, text?: string) => {
    return Swal.fire({
      ...swalConfig,
      icon: 'warning',
      title,
      text
    });
  },

  // Info notification
  info: (title: string, text?: string) => {
    return Swal.fire({
      ...swalConfig,
      icon: 'info',
      title,
      text
    });
  },

  // Confirmation dialog (centered, not toast)
  confirm: (title: string, text?: string, confirmText = 'Yes, delete!', cancelText = 'Cancel') => {
    return Swal.fire({
      title,
      text,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: confirmText,
      cancelButtonText: cancelText,
      position: 'center' // Keep confirmations centered
    });
  },

  // Custom fire method for any other configurations
  fire: (options: any) => {
    return Swal.fire(options);
  }
};

export default swal;
