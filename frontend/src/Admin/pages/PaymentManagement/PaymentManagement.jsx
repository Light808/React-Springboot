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
      } else {
        await markExpired(id);
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
        <>
          <table className="payment-mgmt-table">
            <thead>
              <tr>
                <th>Mã thanh toán</th>
                <th>User</th>
                <th>Thông tin</th>
                <th>Số tiền</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.orderId} onClick={() => setSelectedOrder(o)} style={{ cursor: 'pointer', background: selectedOrder?.orderId === o.orderId ? '#dbeafe' : undefined }}>
                  <td>{o.orderId}</td>
                  <td>{o.userName || o.userEmail || o.userId || '-'}</td>
                  <td>{o.orderInfo}</td>
                  <td style={{ color: '#2563eb', fontWeight: 600 }}>{o.amount?.toLocaleString('vi-VN')}₫</td>
                  <td>
                    <span className={`status-badge status-${o.status}`}>{o.status}</span>
                  </td>
                  <td>
                    {o.status === 'pending' && (
                      <>
                        <button disabled={actionLoading[o.orderId]} className="action-btn btn-paid" onClick={e => { e.stopPropagation(); handleMark(o.orderId, 'paid'); }}>Mark Paid</button>
                        <button disabled={actionLoading[o.orderId]} className="action-btn btn-expired" onClick={e => { e.stopPropagation(); handleMark(o.orderId, 'expired'); }}>Mark Expired</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ minHeight: 20 }} />
          {selectedOrder && <PaymentOrderDetail order={selectedOrder} />}
        </>
      )}
    </div>
  );
}

export default PaymentManagement;
