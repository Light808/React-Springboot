/* eslint-disable no-empty */
/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from 'react';
import './PaymentManagement.css';
import { getAllOrders, markPaid, markExpired } from '../../../services/paymentService';
import PaymentOrderDetail from './PaymentOrderDetail';

function PaymentManagement() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState({});
  const [selectedOrder, setSelectedOrder] = useState(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const data = await getAllOrders();
      setOrders(Array.isArray(data) ? data : []);
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const timer = setInterval(fetchOrders, 8000);
    return () => clearInterval(timer);
  }, []);

  const handleMark = async (id, status) => {
    setActionLoading(l => ({ ...l, [id]: true }));
    try {
      if (status === 'paid') {
        await markPaid(id);
        // Notify client tabs to finalize booking immediately
        try {
          localStorage.setItem('paymentStatusUpdate', JSON.stringify({ orderId: id, status: 'paid', ts: Date.now() }));
          setTimeout(() => localStorage.removeItem('paymentStatusUpdate'), 50);
        } catch (_) {}
      } else {
        await markExpired(id);
        try {
          localStorage.setItem('paymentStatusUpdate', JSON.stringify({ orderId: id, status: 'expired', ts: Date.now() }));
          setTimeout(() => localStorage.removeItem('paymentStatusUpdate'), 50);
        } catch (_) {}
      }
      await fetchOrders();
    } catch (e) {
      alert(e.message);
    } finally {
      setActionLoading(l => ({ ...l, [id]: false }));
    }
  };

  return (
    <div className="payment-mgmt-container">
      <h1>Quản lý Thanh toán (VietQR)</h1>
      {loading ? <p>Đang tải…</p> : error ? <p style={{ color: 'red' }}>{error}</p> : (
        <div className="payment-mgmt-layout">
          <div className="payment-mgmt-list">
          <table className="payment-mgmt-table">
            <thead>
              <tr>
                <th>Mã thanh toán</th>
                <th>UserEmail</th>
                <th>Thông tin</th>
                <th>Số tiền</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.orderId} onClick={() => setSelectedOrder(o)} style={{ cursor: 'pointer', background: selectedOrder?.orderId === o.orderId ? '#dbeafe' : undefined }}>
                  <td>{o.orderId}</td>
                  <td>{o.userEmail || '-'}</td>
                  <td>{o.orderInfo}</td>
                  <td style={{ color: '#2563eb', fontWeight: 600 }}>{o.amount?.toLocaleString('vi-VN')}₫</td>
                  <td>
                    <span className={`status-badge status-${o.status}`}>{o.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
          <div className="payment-mgmt-detail">
            {selectedOrder && (
              <div className="payment-mgmt-detail-card">
                <PaymentOrderDetail order={selectedOrder} />
                {selectedOrder.status === 'pending' && (
                  <div className="detail-actions">
                    <button
                      disabled={actionLoading[selectedOrder.orderId]}
                      className="action-btn btn-paid btn-pill"
                      onClick={() => handleMark(selectedOrder.orderId, 'paid')}
                    >
                      ✓ Mark Paid
                    </button>
                    <button
                      disabled={actionLoading[selectedOrder.orderId]}
                      className="action-btn btn-expired btn-pill"
                      onClick={() => handleMark(selectedOrder.orderId, 'expired')}
                    >
                      ✕ Mark Expired
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default PaymentManagement;
