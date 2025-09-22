const cron = require('node-cron');
const Borrowing = require('../models/Borrowing');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { sendEmail } = require('../utils/notificationsMailer');
const moment = require('moment');

// function to run daily checks
async function dailyDueSoonAndOverdueCheck() {
  try {
    // due tomorrow (WIB)
    const tomorrowStart = moment().utcOffset('+07:00').add(1, 'day').startOf('day').toDate();
    const tomorrowEnd = moment().utcOffset('+07:00').add(1, 'day').endOf('day').toDate();

    // find borrowings due tomorrow and still active
    const dueTomorrow = await Borrowing.find({ dueAt: { $gte: tomorrowStart, $lte: tomorrowEnd }, status: 'active' }).populate('user book');

    for (const b of dueTomorrow) {
      // create notification
      const title = `Pengingat: Buku "${b.book.title}" akan jatuh tempo besok`;
      const body = `Halo ${b.user.username || b.user.email}, buku "${b.book.title}" akan jatuh tempo pada ${moment(b.dueAt).format('YYYY-MM-DD')}. Jangan lupa kembalikan atau perpanjang untuk menghindari denda.`;
      await Notification.create({ user: b.user._id, title, body });

      // send email if user has email and SMTP configured
      if (b.user.email && process.env.MAIL_USER) {
        try {
          await sendEmail(b.user.email, title, body);
        } catch (e) {
          console.error('Failed to send due-tomorrow email', e);
        }
      }
    }

    // check overdue (dueAt < now and still active) -> mark overdue and notify
    const now = new Date();
    const overdueList = await Borrowing.find({ dueAt: { $lt: now }, status: 'active' }).populate('user book');

    for (const b of overdueList) {
      b.status = 'overdue';
      await b.save();

      const title = `Peringatan: Buku "${b.book.title}" sudah melewati tanggal pengembalian`;
      const body = `Halo ${b.user.username || b.user.email}, buku "${b.book.title}" terlambat dikembalikan sejak ${moment(b.dueAt).format('YYYY-MM-DD')}. Denda akan dikenakan sesuai aturan.`;
      await Notification.create({ user: b.user._id, title, body });

      if (b.user.email && process.env.MAIL_USER) {
        try {
          await sendEmail(b.user.email, title, body);
        } catch (e) {
          console.error('Failed to send overdue email', e);
        }
      }
    }

    console.log(`[cron] dailyDueSoonAndOverdueCheck ran at ${new Date().toISOString()}, dueTomorrow:${dueTomorrow.length}, overdue:${overdueList.length}`);
  } catch (err) {
    console.error('cron job error', err);
  }
}

module.exports = function startCronJobs() {
  // run once at startup (optional)
  dailyDueSoonAndOverdueCheck().catch(e => console.error(e));
  // schedule daily at 08:00 WIB (server timezone can differ; using cron '0 1 * * *' UTC ~ 08:00 WIB if server is UTC)
  // Simpler: run every day at 01:00 UTC (which is 08:00 WIB)
  cron.schedule('0 1 * * *', () => {
    dailyDueSoonAndOverdueCheck().catch(e => console.error(e));
  });
  console.log('Cron jobs scheduled: daily due-soon & overdue check');
};
