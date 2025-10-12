/* eslint-disable no-unused-vars */
const API_BASE_URL = 'http://localhost:8080/api/payment';


export async function createPaymentOrder(payload) {
  try {
    const res = await fetch(`${API_BASE_URL}/create-order`, {
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

export async function verifyPayment(query) {
  try {
    const url = new URL(`${API_BASE_URL}/verify`);
    Object.entries(query || {}).forEach(([k, v]) => url.searchParams.set(k, v));
    const res = await fetch(url.toString());
    if (!res.ok) throw new Error(`Verify failed: ${res.status}`);
    return await res.json();
  } catch (err) {
    return { status: 'pending' };
  }
}

export async function getAllOrders() {
  const res = await fetch(`${API_BASE_URL}/orders`);
  if (!res.ok) throw new Error('Cannot fetch orders from server');
  return await res.json();
}

export async function markPaid(orderId) {
  const res = await fetch(`${API_BASE_URL}/mark-paid?orderId=${encodeURIComponent(orderId)}`, { method: 'POST' });
  if (!res.ok) throw new Error('update status Paid failed');
  return await res.json();
}

export async function markExpired(orderId) {
  const res = await fetch(`${API_BASE_URL}/mark-expired?orderId=${encodeURIComponent(orderId)}`, { method: 'POST' });
  if (!res.ok) throw new Error('update status Expired failed');
  return await res.json();
}



