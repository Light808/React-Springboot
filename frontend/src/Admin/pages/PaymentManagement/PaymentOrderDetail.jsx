import React from 'react';

function PaymentOrderDetail({ order }) {
  if (!order) return <div>Không có thông tin đơn thanh toán.</div>;
  return (
    <div style={{ maxWidth: 480, margin: '32px auto', background: '#fff', borderRadius: 12, boxShadow: '0 2px 12px #0001', padding: 32 }}>
      <h2 style={{marginBottom: 18}}>Chi tiết Bill thanh toán</h2>
      <div><b>Mã bill:</b> {order.orderId}</div>
      <div><b>Phương thức:</b> {order.method}</div>
      <div><b>Trạng thái:</b> <span style={{color: order.status==='paid'?'#22c55e':order.status==='pending'?'#eab308':'#ef4444'}}>{order.status}</span></div>
      <div><b>Ngày tạo:</b> {order.createdAt ? new Date(order.createdAt).toLocaleString('vi-VN') : '-'}</div>
      <hr style={{margin: '16px 0'}} />
      <div style={{marginBottom: 8}}><b>Thông tin phim (mô tả):</b></div>
      <div style={{marginBottom: 16, color: '#2563eb', fontWeight: 500}}>{order.orderInfo}</div>
      <div><b>Số tiền:</b> <span style={{color: '#e11d48', fontWeight: 700}}>{order.amount?.toLocaleString('vi-VN')}₫</span></div>
      <hr style={{margin: '16px 0'}} />
      <div><b>Thông tin User:</b></div>
      <ul style={{margin: 0, paddingLeft: 20, color: '#374151'}}>
        <li><b>ID:</b> {order.userId || '-'}</li>
        <li><b>Tên:</b> {order.userName || '-'}</li>
        <li><b>Email:</b> {order.userEmail || '-'}</li>
      </ul>
    </div>
  );
}

export default PaymentOrderDetail;
