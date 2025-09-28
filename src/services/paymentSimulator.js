// src/services/paymentSimulator.js
function createTransaction(orderId, grossAmount, payload = {}) {
  const id = orderId || `ORDER-${Date.now()}-${Math.floor(Math.random()*1000)}`;
  return Promise.resolve({
    status: "mock_success",
    order_id: id,
    gross_amount: grossAmount,
    payment_type: "mock",
    transaction_status: "pending",
    redirect_url: `http://localhost:4000/mock-pay/checkout/${id}`,
    metadata: payload,
  });
}

module.exports = { createTransaction };
