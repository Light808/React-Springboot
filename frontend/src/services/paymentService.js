/* eslint-disable no-unused-vars */
const API_BASE_URL = 'http://localhost:8080/api';

// Create payment order on backend 
export async function createPaymentOrder(payload) {
  try {
    const res = await fetch(`${API_BASE_URL}/payment/create-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error(`Create order failed: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('Payment backend not available, using local sandbox:', err?.message || err);
    return { orderId: `local-${Date.now()}`, signature: 'sandbox-local', payUrl: null };
  }
}

// Verify payment result from backend 
export async function verifyPayment(query) {
  try {
    const url = new URL(`${API_BASE_URL}/payment/verify`);
    Object.entries(query || {}).forEach(([k, v]) => url.searchParams.set(k, v));
    const res = await fetch(url.toString());
    if (!res.ok) throw new Error(`Verify failed: ${res.status}`);
    return await res.json();
  } catch (err) {
    return { status: 'pending' };
  }
}


