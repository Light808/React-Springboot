import React from 'react';
import { CreditCard, Calendar, User, Mail, DollarSign, Clock, CheckCircle, XCircle, AlertCircle, FileText } from 'lucide-react';
import './PaymentOrderDetail.css';

function PaymentOrderDetail({ order }) {
  if (!order) return (
    <div className="order-detail-empty">
      <CreditCard size={48} />
      <p>Không có thông tin đơn thanh toán</p>
    </div>
  );
  
  return (
    <div className="order-detail">
      <div className="detail-header">
        <div className="detail-title">
          <CreditCard size={20} />
          <h3>Chi tiết đơn hàng</h3>
        </div>

      </div>

      <div className="detail-content">
        {/* Order Information */}
        <div className="detail-section">
          <h4 className="section-title">
            <FileText size={16} />
            Thông tin đơn hàng
          </h4>
          <div className="info-grid">
            <div className="info-item">
              <span className="info-label">Mã đơn hàng</span>
              <span className="info-value order-id">{order.orderId}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Phương thức</span>
              <span className="info-value">{order.method || 'VietQR'}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Ngày tạo</span>
              <span className="info-value">
                <Calendar size={14} />
                {order.createdAt ? new Date(order.createdAt).toLocaleString('vi-VN') : '-'}
              </span>
            </div>
            <div className="info-item">
              <span className="info-label">Số tiền</span>
              <span className="info-value amount">
                <DollarSign size={14} />
                {order.amount?.toLocaleString('vi-VN')}₫
              </span>
            </div>
          </div>
        </div>

        {/* Order Description */}
        <div className="detail-section">
          <h4 className="section-title">
            <FileText size={16} />
            Mô tả đơn hàng
          </h4>
          <div className="description-box">
            <p>{order.orderInfo || 'Không có mô tả'}</p>
          </div>
        </div>

        {/* Customer Information */}
        <div className="detail-section">
          <h4 className="section-title">
            <User size={16} />
            Thông tin khách hàng
          </h4>
          <div className="customer-info">
            <div className="customer-item">
              <div className="customer-label">
                <User size={14} />
                ID khách hàng
              </div>
              <div className="customer-value">{order.userId || 'N/A'}</div>
            </div>
            <div className="customer-item">
              <div className="customer-label">
                <User size={14} />
                Tên khách hàng
              </div>
              <div className="customer-value">{order.userName || 'N/A'}</div>
            </div>
            <div className="customer-item">
              <div className="customer-label">
                <Mail size={14} />
                Email
              </div>
              <div className="customer-value">{order.userEmail || 'N/A'}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PaymentOrderDetail;
