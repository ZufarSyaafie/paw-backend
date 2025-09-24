const { isWeekend, format, parseISO } = require("date-fns");
const { id } = require("date-fns/locale");

// Fungsi untuk memeriksa apakah tanggal adalah hari kerja
const isWorkingDay = (date) => {
	return !isWeekend(date);
};

// Fungsi untuk mendapatkan hari kerja berikutnya
const getNextWorkingDay = (date) => {
	let nextDay = new Date(date);
	nextDay.setDate(nextDay.getDate() + 1);

	while (isWeekend(nextDay)) {
		nextDay.setDate(nextDay.getDate() + 1);
	}

	return nextDay;
};

// Fungsi untuk mendapatkan daftar hari kerja dalam rentang waktu
const getWorkingDaysInRange = (startDate, endDate) => {
	const workingDays = [];
	let currentDate = new Date(startDate);

	while (currentDate <= endDate) {
		if (isWorkingDay(currentDate)) {
			workingDays.push(new Date(currentDate));
		}
		currentDate.setDate(currentDate.getDate() + 1);
	}

	return workingDays;
};

// Fungsi untuk validasi jam operasional
const isWithinOperatingHours = (
	startTime,
	endTime,
	operatingStart = "08:00",
	operatingEnd = "17:00"
) => {
	const [startHour, startMin] = startTime.split(":").map(Number);
	const [endHour, endMin] = endTime.split(":").map(Number);
	const [opStartHour, opStartMin] = operatingStart.split(":").map(Number);
	const [opEndHour, opEndMin] = operatingEnd.split(":").map(Number);

	const startMinutes = startHour * 60 + startMin;
	const endMinutes = endHour * 60 + endMin;
	const opStartMinutes = opStartHour * 60 + opStartMin;
	const opEndMinutes = opEndHour * 60 + opEndMin;

	return startMinutes >= opStartMinutes && endMinutes <= opEndMinutes;
};

// Fungsi untuk menghitung durasi dalam jam
const calculateDurationHours = (startTime, endTime) => {
	const [startHour, startMin] = startTime.split(":").map(Number);
	const [endHour, endMin] = endTime.split(":").map(Number);

	const startMinutes = startHour * 60 + startMin;
	const endMinutes = endHour * 60 + endMin;

	return (endMinutes - startMinutes) / 60;
};

// Fungsi untuk format tanggal dalam bahasa Indonesia
const formatDateIndonesian = (date) => {
	return format(date, "EEEE, dd MMMM yyyy", { locale: id });
};

// Fungsi untuk validasi format nomor telepon Indonesia
const validatePhoneNumber = (phone) => {
	// Hapus semua karakter non-digit
	const cleanPhone = phone.replace(/\D/g, "");

	// Validasi panjang (10-15 digit)
	if (cleanPhone.length < 10 || cleanPhone.length > 15) {
		return false;
	}

	// Validasi prefix Indonesia (08, +628, 628)
	if (
		cleanPhone.startsWith("08") ||
		cleanPhone.startsWith("628") ||
		(phone.startsWith("+628") && cleanPhone.length >= 12)
	) {
		return true;
	}

	return false;
};

// Fungsi untuk normalize nomor telepon
const normalizePhoneNumber = (phone) => {
	let cleanPhone = phone.replace(/\D/g, "");

	// Convert to standard format (08xxxxxxxxx)
	if (cleanPhone.startsWith("628")) {
		cleanPhone = "0" + cleanPhone.substring(2);
	}

	return cleanPhone;
};

module.exports = {
	isWorkingDay,
	getNextWorkingDay,
	getWorkingDaysInRange,
	isWithinOperatingHours,
	calculateDurationHours,
	formatDateIndonesian,
	validatePhoneNumber,
	normalizePhoneNumber,
};
