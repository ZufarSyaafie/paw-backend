// // const midtransClient = require("midtrans-client");
// // require("dotenv").config();

// // const snap = new midtransClient.Snap({
// // 	isProduction: false, // sandbox mode
// // 	serverKey: process.env.MIDTRANS_SERVER_KEY,
// // 	clientKey: process.env.MIDTRANS_CLIENT_KEY,
// // });

// // module.exports = snap;

// // src/services/midtrans.js
// // supports mock mode via USE_MOCK_PAYMENT=true
// const crypto = require("crypto");
// const USE_MOCK = process.env.USE_MOCK_PAYMENT === "true";

// let snap = null;
// try {
//   snap = require("./midtransClient"); // if exists
// } catch (e) {
//   snap = null;
// }

// function generateOrderId() {
//   return `ORDER-${Date.now()}-${Math.floor(Math.random()*1000)}`;
// }

// async function createTransaction(orderId, grossAmount, payload = {}) {
//   const id = orderId || generateOrderId();

//   if (USE_MOCK) {
//     return {
//       status: "mock_success",
//       order_id: id,
//       gross_amount: grossAmount,
//       payment_type: "mock",
//       transaction_status: "capture",
//       redirect_url: `https://mock-pay.local/checkout/${id}`,
//       metadata: payload,
//     };
//   }

//   if (!snap) throw new Error("Midtrans snap client not found. Set USE_MOCK_PAYMENT=true to use mock.");

//   const params = {
//     transaction_details: {
//       order_id: id,
//       gross_amount: Number(grossAmount) || 0
//     },
//     item_details: payload.items || [],
//     customer_details: payload.customer || {}
//   };

//   const response = await snap.createTransaction(params);
//   return { status: "midtrans_success", raw: response, order_id: id };
// }

// function parseNotification(body) {
//   if (USE_MOCK) {
//     return {
//       order_id: body.order_id || body.orderId || body.order,
//       transaction_status: body.transaction_status || body.transactionStatus || "capture",
//       payment_type: body.payment_type || body.paymentType || "mock",
//       gross_amount: body.gross_amount || body.grossAmount || 0,
//       raw: body,
//       verified: true
//     };
//   }

//   // real midtrans verification (signature_key)
//   const serverKey = process.env.MIDTRANS_SERVER_KEY || "";
//   const order_id = body.order_id || body.orderId || "";
//   const status_code = body.status_code || body.statusCode || "";
//   const gross_amount = body.gross_amount || body.grossAmount || "";
//   const signature_key = body.signature_key || body.signatureKey || "";

//   const payload = `${order_id}${status_code}${gross_amount}${serverKey}`;
//   const expected = crypto.createHash("sha512").update(payload).digest("hex");
//   const verified = expected === signature_key;

//   return {
//     order_id,
//     transaction_status: body.transaction_status || body.transactionStatus || "",
//     payment_type: body.payment_type || body.paymentType || "",
//     gross_amount,
//     raw: body,
//     verified
//   };
// }

// module.exports = {
//   createTransaction,
//   parseNotification,
//   refundTransaction: async () => { throw new Error("refund not implemented in mock"); }
// };
// src/services/midtrans.js
const crypto = require("crypto");
const USE_MOCK = process.env.USE_MOCK_PAYMENT === "true";

let snap = null;
try {
  snap = require("./midtransClient"); // if exists
} catch (e) {
  snap = null;
}

function generateOrderId() {
  return `ORDER-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

async function createTransaction(orderId, grossAmount = 0, payload = {}) {
  const id = orderId || generateOrderId();

  if (USE_MOCK) {
    return {
      status: "mock_success",
      order_id: id,
      gross_amount: grossAmount,
      payment_type: "mock",
      transaction_status: "capture",
      redirect_url: `https://mock-pay.local/checkout/${id}`,
      metadata: payload,
    };
  }

  if (!snap) throw new Error("Midtrans snap client not found. Set USE_MOCK_PAYMENT=true to use mock.");

  const params = {
    transaction_details: { order_id: id, gross_amount: Number(grossAmount) || 0 },
    item_details: payload.items || [],
    customer_details: payload.customer || {},
  };

  const response = await snap.createTransaction(params);
  return { status: "midtrans_success", raw: response };
}

function parseNotification(body) {
  if (USE_MOCK) {
    return {
      order_id: body.order_id || body.orderId || body.order,
      transaction_status: body.transaction_status || body.transactionStatus || "capture",
      payment_type: body.payment_type || body.paymentType || "mock",
      gross_amount: body.gross_amount || body.grossAmount || 0,
      raw: body,
      verified: true,
    };
  }

  const serverKey = process.env.MIDTRANS_SERVER_KEY || "";
  const order_id = body.order_id || body.orderId || "";
  const status_code = body.status_code || body.statusCode || "";
  const gross_amount = body.gross_amount || body.grossAmount || 0;
  const signature_key = body.signature_key || body.signatureKey || "";

  const payload = `${order_id}${status_code}${gross_amount}${serverKey}`;
  const expected = crypto.createHash("sha512").update(payload).digest("hex");
  const verified = expected === signature_key;

  return {
    order_id,
    transaction_status: body.transaction_status || body.transactionStatus || "",
    payment_type: body.payment_type || body.paymentType || "",
    gross_amount,
    raw: body,
    verified,
  };
}

module.exports = {
  createTransaction,
  parseNotification,
};
