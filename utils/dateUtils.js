// Cek apakah hari ini adalah hari kerja (Senin-Jumat)
const isWorkingDay = (date = new Date()) => {
  const day = date.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  return day >= 1 && day <= 5; // Monday to Friday
};

// Cek apakah sekarang dalam jam operasional (08:00 - 17:00)
const isWorkingHours = (date = new Date()) => {
  const hours = date.getHours();
  return hours >= 8 && hours < 17; // 8 AM to 5 PM
};

// Hitung due date berdasarkan borrow type dan membership
const calculateDueDate = (borrowType, isMember = false, borrowDate = new Date()) => {
  const dueDate = new Date(borrowDate);
  
  if (borrowType === 'Baca di Tempat') {
    // Minimal 1 jam untuk baca di tempat
    dueDate.setHours(dueDate.getHours() + 1);
  } else if (borrowType === 'Bawa Pulang') {
    // 14 hari untuk non-member, 21 hari untuk member
    const days = isMember ? 21 : 14;
    dueDate.setDate(dueDate.getDate() + days);
    
    // Set due time ke end of day (23:59)
    dueDate.setHours(23, 59, 59, 999);
  }
  
  return dueDate;
};

// Format tanggal untuk display
const formatDateTime = (date, locale = 'id-ID') => {
  return new Date(date).toLocaleDateString(locale, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Validasi waktu peminjaman
const validateBorrowTime = (borrowDate = new Date()) => {
  const errors = [];
  
  if (!isWorkingDay(borrowDate)) {
    errors.push('Peminjaman hanya dapat dilakukan pada hari kerja (Senin-Jumat)');
  }
  
  if (!isWorkingHours(borrowDate)) {
    errors.push('Peminjaman hanya dapat dilakukan pada jam operasional (08:00-17:00)');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

module.exports = {
  isWorkingDay,
  isWorkingHours,
  calculateDueDate,
  formatDateTime,
  validateBorrowTime
};