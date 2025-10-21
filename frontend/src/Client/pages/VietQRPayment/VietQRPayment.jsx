/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { QrCode, ArrowLeft, CheckCircle, Clock, Copy, RefreshCw } from 'lucide-react';
import { bookTicket } from '../../../services/ticketService';
import { createNotification, createBookingSuccessNotification } from '../../../services/notificationService';
import { createPaymentOrder, verifyPayment } from '../../../services/paymentService';
import './VietQRPayment.css';
import { useTranslation } from 'react-i18next';

const VietQRPayment = () => { 
  const { t } = useTranslation();
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
  const [isFinalized, setIsFinalized] = useState(false); 

  useEffect(() => {
    if (!ticketData) {
      navigate('/');
      return;
    }
    
    // Prevent duplicate initialization
    if (!isInitialized) {
      if (orderId) {
        setCurrentOrderId(orderId);
        if (payload?.qrUrl) setQrUrl(payload.qrUrl);
        if (payload?.qrData && !payload?.qrUrl) setQrCode(payload.qrData);
      } else {
        initializeOrder();
      }
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
    }, 3000);

    return () => {
      clearInterval(timer);
      clearInterval(checkInterval);
    };
  }, []);

  // Confirm paid from admin
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key !== 'paymentStatusUpdate' || !e.newValue) return;
      try {
        const data = JSON.parse(e.newValue);
        if (data?.orderId && data.orderId === currentOrderId && data?.status === 'paid') {
          setPaymentStatus('paid');
          handlePaymentSuccess();
        }
      } catch (_) {
        // ignore parsing errors
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [currentOrderId]);

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
        alert('Invalid payment amount.');
        return;
      }
      const payload = {
        amount: Number(amountVnd) || 0,
        orderInfo: `${ticketData?.movieTitle || 'Movie'} ${getSeatText()}`.trim(),
        method: 'vietqr',
        userId: String(ticketData?.userId || `guest-${Date.now()}`),
        userName: String(ticketData?.userName || ticketData?.userFullName || 'Guest'),
        userEmail: String(ticketData?.userEmail || 'guest@example.com'),
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
    if (isFinalized) return;
    setIsFinalized(true);
    try {
      // Information ticket
      const seatNumberStr = Array.isArray(ticketData?.seatNumber) ? ticketData.seatNumber.join(', ') : (ticketData?.seatNumber || '');
      const seatIdStr = Array.isArray(ticketData?.seatId) ? ticketData.seatId.join(', ') : (ticketData?.seatId || seatNumberStr);
      const showTimeIso = ticketData?.showTime || new Date().toISOString();
      const showDateIso = ticketData?.showDate || new Date(showTimeIso).toISOString().split('T')[0];
      const moviePoster = ticketData?.moviePoster || ticketData?.movieThumbnail || '/default-movie.jpg';
      const finalTicket = {
        userId: ticketData?.userId,
        showtimeId: ticketData?.showtimeId,
        seatId: seatIdStr,
        seatNumber: seatNumberStr,
        movieId: ticketData?.movieId,
        movieTitle: ticketData?.movieTitle || ticketData?.movieName || 'Movie',
        moviePoster,
        movieThumbnail: ticketData?.movieThumbnail || moviePoster,
        cinemaName: ticketData?.cinemaName || 'Movie Theater',
        cinemaAddress: ticketData?.cinemaAddress || '',
        showDate: showDateIso,
        showTime: showTimeIso,
        price: Number(resolveAmountVnd()),
        status: 'pending',
        paymentMethod: 'vietqr',
        paymentStatus: 'paid',
        isRefundable: true,
        notes: ticketData?.notes || ''
      };
      const result = await bookTicket(finalTicket);
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
      navigate('/tickets', {
        replace: true,
        state: {
          payment: 'success',
          ticketId: result?.id || null,
          method: 'vietqr'
        }
      });
    } catch (error) {
      navigate('/tickets', { replace: true });
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      alert('Copied to clipboard!');
    }).catch(() => {
      alert('Could not copy. Please try again..');
    });
  };

  const handleRefresh = () => {
    initializeOrder();
  };

  if (!ticketData) {
    return (
      <div className="vietqr-container">
        <div className="error-message">
          <h2>{t('Error')}</h2>
          <p>{t('No booking information found. Please try again')}.</p>
          <button onClick={() => navigate('/') } className="back-btn">
            {t('Back')}
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
          {t('Back')}
        </button>
        <h1>{t('VietQR Payment')}</h1>
      </div>

      <div className="vietqr-content">
        {/* Order Summary */}
        <div className="order-summary">
          <h3>{t('Order information')}</h3>
          <div className="summary-item">
            <span>{t('Movie')}:</span>
            <strong>{ticketData.movieTitle}</strong>
          </div>
          <div className="summary-item">
            <span>{t('Seat')}:</span>
            <strong>{ticketData.seatNumber}</strong>
          </div>
          <div className="summary-item">
            <span>{t('Showtime')}:</span>
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