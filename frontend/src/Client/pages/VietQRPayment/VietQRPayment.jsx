/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { QrCode, ArrowLeft, CheckCircle, Clock, Copy, RefreshCw } from 'lucide-react';
import { bookTicket } from '../../../services/ticketService';
import { createNotification, createBookingSuccessNotification } from '../../../services/notificationService';
import { createPaymentOrder, verifyPayment } from '../../../services/paymentService';
import './VietQRPayment.css';

const VietQRPayment = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const payload = location.state || {};

  const {
    ticketData,
    summary,
    orderId,
    amount
  } = payload;

  const [qrCode, setQrCode] = useState('');
  const [qrUrl, setQrUrl] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('pending'); 
  const [timeLeft, setTimeLeft] = useState(900);
  const [isChecking, setIsChecking] = useState(false);
  const [currentOrderId, setCurrentOrderId] = useState(orderId || null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (!ticketData) {
      navigate('/');
      return;
    }
    
    // Prevent duplicate initialization
    if (!isInitialized) {
      initializeOrder();
      setIsInitialized(true);
    }
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setPaymentStatus('expired');
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    const checkInterval = setInterval(() => {
      checkPaymentStatus();
    }, 5000);

    return () => {
      clearInterval(timer);
      clearInterval(checkInterval);
    };
  }, []);

  const resolveAmountVnd = () => {
    const raw = amount ?? summary?.totalPrice ?? ticketData?.price ?? 0;
    const n = Number(raw);
    return Number.isFinite(n) ? Math.round(n) : 0;
  };

  const getSeatText = () => {
    const seat = ticketData?.seatNumber;
    if (Array.isArray(seat)) return seat.join(',');
    return seat ?? 'Seat';
  };

  const initializeOrder = async () => {
    try {
      const amountVnd = resolveAmountVnd();
      if (!amountVnd || amountVnd <= 0) {
        alert('Số tiền thanh toán không hợp lệ.');
        return;
      }
      const payload = {
        amount: amountVnd,
        orderInfo: `${ticketData?.movieTitle || 'Movie'} ${getSeatText()}`,
        method: 'vietqr',
        userId: ticketData?.userId || 'user123',
        userName: ticketData?.userName || 'Nguyễn Văn A',
        userEmail: ticketData?.userEmail || 'user@example.com'
      };
      const res = await createPaymentOrder(payload);
      if (res?.orderId) setCurrentOrderId(res.orderId);
      if (res?.qrUrl) setQrUrl(res.qrUrl);
      if (res?.qrData) setQrCode(res.qrData);
      setPaymentStatus('pending');
      setTimeLeft(900);
    } catch (e) {
      console.error('Create order failed:', e);
      setQrUrl('');
    }
  };

  const checkPaymentStatus = async () => {
    if (paymentStatus !== 'pending' || isChecking) return;
    if (!currentOrderId) return;
    
    setIsChecking(true);
    try {
      const result = await verifyPayment({ orderId: currentOrderId });
      if (result?.status === 'paid') {
        setPaymentStatus('paid');
        await handlePaymentSuccess();
      } else if (result?.status === 'expired') {
        setPaymentStatus('expired');
      }
    } catch (error) {
      console.error('Error checking payment status:', error);
    } finally {
      setIsChecking(false);
    }
  };

  const handlePaymentSuccess = async () => {
    try {
      const result = await bookTicket({ 
        ...ticketData, 
        paymentStatus: 'paid', 
        status: 'pending', 
        paymentMethod: 'vietqr' 
      });
      
      try {
        const notificationData = createBookingSuccessNotification(
          ticketData.userId,
          ticketData.movieTitle,
          ticketData.seatNumber,
          ticketData.showTime
        );
        await createNotification(notificationData);
      } catch (e) {
        console.warn('Create notification failed:', e);
      }
      
      // Notify user then redirect to My Tickets
      alert('Payment successful! Your ticket has been booked and is awaiting confirmation..');
      navigate('/tickets', {
        replace: true,
        state: {
          payment: 'success',
          ticketId: result?.id || null,
          method: 'vietqr'
        } 
      });
    } catch (error) {
      console.error('Error finalizing booking:', error);
      alert('Could not finalize booking. Please contact support.');
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      alert('Đã sao chép vào clipboard!');
    }).catch(() => {
      alert('Không thể sao chép. Vui lòng thử lại.');
    });
  };

  const handleRefresh = () => {
    initializeOrder();
  };

  if (!ticketData) {
    return (
      <div className="vietqr-container">
        <div className="error-message">
          <h2>Lỗi</h2>
          <p>Không tìm thấy thông tin đặt vé. Vui lòng thử lại.</p>
          <button onClick={() => navigate('/') } className="back-btn">
            Về trang chủ
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="vietqr-container">
      <div className="vietqr-header">
        <button onClick={() => navigate(-1)} className="back-button">
          <ArrowLeft size={20} />
          Quay lại
        </button>
        <h1>Thanh toán VietQR</h1>
      </div>

      <div className="vietqr-content">
        {/* Order Summary */}
        <div className="order-summary">
          <h3>Thông tin đơn hàng</h3>
          <div className="summary-item">
            <span>Phim:</span>
            <strong>{ticketData.movieTitle}</strong>
          </div>
          <div className="summary-item">
            <span>Ghế:</span>
            <strong>{ticketData.seatNumber}</strong>
          </div>
          <div className="summary-item">
            <span>Suất chiếu:</span>
            <strong>{new Date(ticketData.showTime).toLocaleString('vi-VN')}</strong>
          </div>
          <div className="summary-item total">
            <span>Tổng tiền:</span>
            <strong>{new Intl.NumberFormat('vi-VN', { 
              style: 'currency', 
              currency: 'VND' 
            }).format(resolveAmountVnd())}</strong>
          </div>
        </div>

        {/* QR Code Section */}
        <div className="qr-section">
          <div className="qr-header">
            <QrCode size={24} />
            <h3>Quét mã QR để thanh toán</h3>
          </div>
          
          <div className="qr-code-container">
            {paymentStatus === 'pending' ? (
              <div className="qr-code">
                {qrUrl ? (
                  <img src={qrUrl} alt="VietQR" style={{ width: 220, height: 220 }} />
                ) : (
                  <div className="qr-placeholder">
                    <QrCode size={120} />
                    <p>Mã QR thanh toán</p>
                    <small>Quét bằng ứng dụng ngân hàng</small>
                  </div>
                )}
              </div>
            ) : paymentStatus === 'paid' ? (
              <div className="qr-success">
                <CheckCircle size={120} className="success-icon" />
                <p>Thanh toán thành công!</p>
              </div>
            ) : (
              <div className="qr-expired">
                <Clock size={120} className="expired-icon" />
                <p>Mã QR đã hết hạn</p>
                <button onClick={handleRefresh} className="refresh-btn">
                  <RefreshCw size={16} />
                  Tạo mã mới
                </button>
              </div>
            )}
          </div>

          {/* Payment Details */}
          <div className="payment-details">
            <div className="detail-row">
              <span>Ngân hàng:</span>
              <span>Techcombank</span>
            </div>
            <div className="detail-row">
              <span>Số tài khoản:</span>
              <span>1221868856</span>
              <button 
                onClick={() => copyToClipboard('1221868856')}
                className="copy-btn"
                title="Sao chép"
              >
                <Copy size={14} />
              </button>
            </div>
            <div className="detail-row">
              <span>Nội dung:</span>
              <span>{ticketData.movieTitle} {getSeatText()}</span>
              <button 
                onClick={() => copyToClipboard(`${ticketData.movieTitle} ${getSeatText()}`)}
                className="copy-btn"
                title="Sao chép"
              >
                <Copy size={14} />
              </button>
            </div>
            <div className="detail-row">
              <span>Số tiền:</span>
              <span>{new Intl.NumberFormat('vi-VN', { 
                style: 'currency', 
                currency: 'VND' 
              }).format(resolveAmountVnd())}</span>
            </div>
          </div>

          {/* Timer */}
          {paymentStatus === 'pending' && (
            <div className="timer-section">
              <Clock size={20} />
              <span>Thời gian còn lại: {formatTime(timeLeft)}</span>
              {isChecking && (
                <div className="checking-indicator">
                  <RefreshCw size={16} className="spinning" />
                  <span>Đang kiểm tra thanh toán...</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="instructions">
          <h4>Hướng dẫn thanh toán:</h4>
          <ol>
            <li>Mở ứng dụng ngân hàng trên điện thoại</li>
            <li>Chọn chức năng "Quét QR" hoặc "VietQR"</li>
            <li>Quét mã QR ở trên</li>
            <li>Kiểm tra thông tin và xác nhận thanh toán</li>
            <li>Chờ xác nhận từ hệ thống</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default VietQRPayment;