// Middleware untuk validasi booking ruangan

const validateBooking = (req, res, next) => {
  try {
    const {
      roomId,
      date,
      startTime,
      endTime,
      purpose,
      numberOfAttendees
    } = req.body;

    // Validasi field wajib
    const requiredFields = {
      roomId: 'ID Ruangan',
      date: 'Tanggal',
      startTime: 'Waktu Mulai',
      endTime: 'Waktu Selesai',
      purpose: 'Tujuan Penggunaan',
      numberOfAttendees: 'Jumlah Peserta'
    };

    const missingFields = [];
    for (const [field, label] of Object.entries(requiredFields)) {
      if (!req.body[field]) {
        missingFields.push(label);
      }
    }

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Field berikut wajib diisi: ${missingFields.join(', ')}`
      });
    }

    // Validasi format tanggal
    const bookingDate = new Date(date);
    if (isNaN(bookingDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Format tanggal tidak valid'
      });
    }

    // Validasi tanggal tidak di masa lalu
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const requestDate = new Date(date);
    requestDate.setHours(0, 0, 0, 0);

    if (requestDate < today) {
      return res.status(400).json({
        success: false,
        message: 'Tidak dapat melakukan booking untuk tanggal yang sudah lewat'
      });
    }

    // Validasi waktu
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);

    if (isNaN(startHour) || isNaN(startMinute) || isNaN(endHour) || isNaN(endMinute)) {
      return res.status(400).json({
        success: false,
        message: 'Format waktu tidak valid (gunakan format HH:MM)'
      });
    }

    // Validasi waktu mulai < waktu selesai
    const startTimeInMinutes = startHour * 60 + startMinute;
    const endTimeInMinutes = endHour * 60 + endMinute;

    if (startTimeInMinutes >= endTimeInMinutes) {
      return res.status(400).json({
        success: false,
        message: 'Waktu mulai harus lebih awal dari waktu selesai'
      });
    }

    // Validasi durasi minimum (30 menit)
    const durationInMinutes = endTimeInMinutes - startTimeInMinutes;
    if (durationInMinutes < 30) {
      return res.status(400).json({
        success: false,
        message: 'Durasi booking minimal 30 menit'
      });
    }

    // Validasi durasi maksimum (8 jam)
    if (durationInMinutes > 480) {
      return res.status(400).json({
        success: false,
        message: 'Durasi booking maksimal 8 jam'
      });
    }

    // Validasi jam operasional (07:00 - 21:00)
    if (startHour < 7 || endHour > 21 || (endHour === 21 && endMinute > 0)) {
      return res.status(400).json({
        success: false,
        message: 'Booking hanya tersedia pada jam operasional (07:00 - 21:00)'
      });
    }

    // Validasi jumlah peserta
    if (numberOfAttendees < 1) {
      return res.status(400).json({
        success: false,
        message: 'Jumlah peserta minimal 1 orang'
      });
    }

    // Validasi panjang purpose
    if (purpose.length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Tujuan penggunaan minimal 10 karakter'
      });
    }

    if (purpose.length > 500) {
      return res.status(400).json({
        success: false,
        message: 'Tujuan penggunaan maksimal 500 karakter'
      });
    }

    // Validasi booking tidak lebih dari 3 bulan ke depan
    const maxBookingDate = new Date();
    maxBookingDate.setMonth(maxBookingDate.getMonth() + 3);

    if (bookingDate > maxBookingDate) {
      return res.status(400).json({
        success: false,
        message: 'Booking hanya dapat dilakukan maksimal 3 bulan ke depan'
      });
    }

    // Tambahkan data yang sudah divalidasi ke request
    req.validatedBooking = {
      roomId,
      date,
      startTime,
      endTime,
      purpose,
      numberOfAttendees,
      additionalRequests: req.body.additionalRequests || '',
      bookingDate,
      startTimeInMinutes,
      endTimeInMinutes,
      durationInMinutes
    };

    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error validating booking',
      error: error.message
    });
  }
};

// Middleware untuk validasi update booking
const validateBookingUpdate = (req, res, next) => {
  try {
    const updates = req.body;

    // Jika ada update waktu, validasi
    if (updates.startTime || updates.endTime) {
      if (!updates.startTime || !updates.endTime) {
        return res.status(400).json({
          success: false,
          message: 'Jika mengubah waktu, startTime dan endTime harus diisi keduanya'
        });
      }

      const [startHour, startMinute] = updates.startTime.split(':').map(Number);
      const [endHour, endMinute] = updates.endTime.split(':').map(Number);

      const startTimeInMinutes = startHour * 60 + startMinute;
      const endTimeInMinutes = endHour * 60 + endMinute;

      if (startTimeInMinutes >= endTimeInMinutes) {
        return res.status(400).json({
          success: false,
          message: 'Waktu mulai harus lebih awal dari waktu selesai'
        });
      }

      const durationInMinutes = endTimeInMinutes - startTimeInMinutes;
      if (durationInMinutes < 30) {
        return res.status(400).json({
          success: false,
          message: 'Durasi booking minimal 30 menit'
        });
      }

      if (durationInMinutes > 480) {
        return res.status(400).json({
          success: false,
          message: 'Durasi booking maksimal 8 jam'
        });
      }
    }

    // Validasi numberOfAttendees jika ada
    if (updates.numberOfAttendees !== undefined) {
      if (updates.numberOfAttendees < 1) {
        return res.status(400).json({
          success: false,
          message: 'Jumlah peserta minimal 1 orang'
        });
      }
    }

    // Validasi purpose jika ada
    if (updates.purpose) {
      if (updates.purpose.length < 10) {
        return res.status(400).json({
          success: false,
          message: 'Tujuan penggunaan minimal 10 karakter'
        });
      }

      if (updates.purpose.length > 500) {
        return res.status(400).json({
          success: false,
          message: 'Tujuan penggunaan maksimal 500 karakter'
        });
      }
    }

    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error validating booking update',
      error: error.message
    });
  }
};

module.exports = {
  validateBooking,
  validateBookingUpdate
};