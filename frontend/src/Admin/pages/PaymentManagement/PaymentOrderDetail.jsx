import React from 'react';
import './PaymentOrderDetail.css';

function PaymentOrderDetail({ order }) {
  if (!order) return <div className="pod-empty">Không có thông tin đơn thanh toán.</div>;
  return (
    <div className="pod-card">
      <h2 className="pod-title">Chi tiết Bill thanh toán</h2>
      <div className="pod-row"><b>Mã bill:</b> {order.orderId}</div>
      <div className="pod-row"><b>Phương thức:</b> {order.method}</div>
      <div className="pod-row"><b>Trạng thái:</b> <span className={`pod-status ${order.status}`}>{order.status}</span></div>
      <div className="pod-row"><b>Ngày tạo:</b> {order.createdAt ? new Date(order.createdAt).toLocaleString('vi-VN') : '-'}</div>
      <hr className="pod-hr" />
      <div className="pod-desc-title"><b>Thông tin phim (mô tả):</b></div>
      <div className="pod-desc">{order.orderInfo}</div>
      <div className="pod-row"><b>Số tiền:</b> <span className="pod-amount">{order.amount?.toLocaleString('vi-VN')}₫</span></div>
      <hr className="pod-hr" />
      <div className="pod-row"><b>Thông tin User:</b></div>
      <ul className="pod-user-list">
        <li><b>ID:</b> {order.userId || '-'}</li>
        <li><b>Tên:</b> {order.userName || '-'}</li>
        <li><b>Email:</b> {order.userEmail || '-'}</li>
      </ul>
    </div>
  );
}

export default PaymentOrderDetail;
