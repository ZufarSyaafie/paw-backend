function logBorrowingActivity(action) {
  return (req, res, next) => {
    console.log(`[BORROW LOG] ${action} by ${req.user?._id} at ${new Date().toISOString()}`);
    req.activityLog = { action, timestamp: new Date(), user: req.user?._id };
    next();
  };
}

module.exports = { logBorrowingActivity };
