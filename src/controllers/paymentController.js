const Loan = require("../models/Loan");
const Book = require("../models/Book");
const Booking = require("../models/Booking");
const midtransClient = require("midtrans-client");

const core = new midtransClient.CoreApi({
	isProduction: false,
	serverKey: process.env.MIDTRANS_SERVER_KEY,
	clientKey: process.env.MIDTRANS_CLIENT_KEY,
});

exports.notification = async (req, res) => {
	try {
		console.log("Raw notification:", req.body);

		const notification = await core.transaction.notification(req.body);
		console.log("Midtrans notification received:", notification);

		const orderId = notification.order_id;
		const transactionStatus = notification.transaction_status;
		const fraudStatus = notification.fraud_status;

		console.log("Order ID:", orderId, "Status:", transactionStatus);

		let isSuccess = false;
		let isFailed = false;

		if (
			transactionStatus === "settlement" ||
			(transactionStatus === "capture" && fraudStatus === "accept")
		) {
			isSuccess = true;
		} else if (
			transactionStatus === "expire" ||
			transactionStatus === "cancel" ||
			transactionStatus === "deny"
		) {
			isFailed = true;
		}

		if (orderId.startsWith("loan-")) {
			const loan = await Loan.findOne({ midtransOrderId: orderId }).populate(
				"book"
			);
			if (!loan) {
				return res.status(404).json({ message: "Loan not found" });
			}

			if (isSuccess) {
				loan.paymentStatus = "paid";
				await Book.findByIdAndUpdate(loan.book._id, { $inc: { stock: -1}});
			} else if (isFailed) {
				loan.paymentStatus = "failed";
			}

		// Handle status
		// if (
		// 	transactionStatus === "settlement" ||
		// 	(transactionStatus === "capture" && fraudStatus === "accept")
		// ) {
		// 	loan.paymentStatus = "paid";
		// 	await Book.findByIdAndUpdate(loan.book._id, { $inc: { stock: -1 } });
		// } else if (
		// 	transactionStatus === "expire" ||
		// 	transactionStatus === "cancel" ||
		// 	transactionStatus === "deny"
		// ) {
		// 	loan.paymentStatus = "failed";
		// }

			await loan.save();
			console.log("Loan updated:", loan);
		
		} else if (orderId.startsWith("booking-")) {
			const booking = await Booking.findOne({ midtransOrderId: orderId }).populate(
				"room"
			);
			if (!booking) {
				return res.status(404).json({message:"Booking not found"});
			}

			if (isSuccess) {
				booking.paymentStatus = "paid";
				booking.status = "confirmed";
			} else if (isFailed) {
				booking.paymentStatus = "failed";
			}

			await booking.save();
			console.log("Booking updated:", booking);
		} else {
			console.warn("Notificatino for unknown orderId prefix:", orderId);
		}

		// ⚠️ Selalu kasih response 200 OK ke Midtrans
		return res
			.status(200)
			.json({ message: "Notification processed", status: transactionStatus });
	} catch (err) {
		console.error("Midtrans notification error:", err);
		// tetap balikin 200 biar Midtrans ga retry terus
		return res
			.status(200)
			.json({ message: "Notification received but error", error: err.message });
	}
};

exports.listMyPayments = async (req, res) => {
    try {
        const userId = req.user.id;

        // 1. Ambil data pinjaman (Loan)
        const loans = await Loan.find({ user: userId })
            .populate("book", "title")
            .lean(); // .lean() biar lebih cepet

        // 2. Ambil data booking (Booking)
        const bookings = await Booking.find({ user: userId })
            .populate("room", "name")
            .lean();

        // 3. Ubah format data Loan jadi format Payment
        const loanPayments = loans.map(loan => ({
            id: loan._id,
            userId: loan.user,
            amount: loan.depositAmount,
            // Mapping status BE -> FE
            status: loan.paymentStatus === 'paid' ? 'completed' : 'pending',
            paymentMethod: "midtrans", // Asumsi
            description: `Deposit Buku: ${loan.book?.title || 'Buku Dihapus'}`,
            transactionId: loan.midtransOrderId,
            type: "loan_deposit",
            createdAt: loan.borrowedAt, // Pake tanggal pinjam
        }));

        // 4. Ubah format data Booking jadi format Payment
        const bookingPayments = bookings.map(booking => ({
            id: booking._id,
            userId: booking.user,
            amount: booking.totalPrice,
            status: booking.paymentStatus === 'paid' ? 'completed' : (booking.paymentStatus === 'failed' ? 'failed' : 'pending'),
            paymentMethod: "midtrans", // Asumsi
            description: `Booking Ruangan: ${booking.room?.name || 'Ruangan Dihapus'}`,
            transactionId: booking.midtransOrderId,
            type: "room_booking",
            createdAt: booking.createdAt, 
        }));

        const allPayments = [...loanPayments, ...bookingPayments];

        allPayments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        res.json(allPayments);

    } catch (err) {
        console.error("Error fetching my payments:", err);
        res.status(500).json({ message: "Server error" });
    }
};
