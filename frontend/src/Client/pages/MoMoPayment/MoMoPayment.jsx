/* eslint-disable no-unused-vars */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { createMoMoOrder, queryMoMoOrder } from '../../../services/momoService';
import { bookTicket } from '../../../services/ticketService';
import { createNotification, createBookingSuccessNotification } from '../../../services/notificationService';
import './MoMoPayment.css';

// Polling time intervals and timeout
const POLL_INTERVAL_MS = 2500;
const POLL_TIMEOUT_MS = 5 * 60 * 1000;

const MoMoPayment = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const { ticketData, summary, description, user } = location.state || {};

  const [orderId, setOrderId] = useState('');
  const [payUrl, setPayUrl] = useState('');
  const [qrUrl, setQrUrl] = useState('');
  const [status, setStatus] = useState('INITIAL'); 
  const [error, setError] = useState('');
  const [timeLeft, setTimeLeft] = useState(Math.floor(POLL_TIMEOUT_MS / 1000));
  const pollRef = useRef(null);
  const timeoutRef = useRef(null);

  const amount = useMemo(() => summary?.totalPrice || summary?.amount || ticketData?.price || 0, [summary, ticketData]);
  const orderDescription = useMemo(() => (
    description || `Booking ${ticketData?.movieTitle || 'Movie'} - ${ticketData?.seatNumber || ''}`
  ), [description, ticketData]);

  useEffect(() => {
    if (!ticketData || !amount) {
      setError('Missing order information.');
      return;
    }

    const createOrder = async () => {
      try {
        setStatus('PENDING');
        setError('');
        const userLabel = user?.name || user?.email || user?.id || 'guest';
        const res = await createMoMoOrder(userLabel, amount, orderDescription);
        if (!res || !res.orderId) throw new Error('Invalid create order response');
        setOrderId(res.orderId);
        setPayUrl(res.payUrl || '');
        setQrUrl(res.qrUrl || '');
      } catch (e) {
        setStatus('ERROR');
        setError(e?.message || 'Failed to create MoMo order');
      }
    };

    createOrder();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!orderId || status !== 'PENDING') return;

    const startTime = Date.now();

    pollRef.current = setInterval(async () => {
      try {
        const res = await queryMoMoOrder(orderId);
        const s = res?.status || res?.returnCode || 'PENDING';
        if (s === 'PAID' || s === 1 || s === '1' || s === 'paid') {
          clearInterval(pollRef.current);
          clearTimeout(timeoutRef.current);
          setStatus('PAID');

          // Finalize booking
          try {
            const result = await bookTicket({ 
              ...ticketData, 
              paymentMethod: 'momo', 
              paymentStatus: 'paid', 
              status: 'confirmed' 
            });
            
            // Create notification
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
              state: { payment: 'success', ticketId: result?.id || null } 
            });
          } catch (err) {
            setError('Payment confirmed, but booking failed. Please contact support.');
          }
        } else if (s === 'EXPIRED' || s === -1 || s === '-1' || s === 'expired') {
          clearInterval(pollRef.current);
          clearTimeout(timeoutRef.current);
          setStatus('EXPIRED');
        } else {
          // still pending
          const elapsed = Math.floor((Date.now() - startTime) / 1000);
          setTimeLeft(Math.max(0, Math.floor(POLL_TIMEOUT_MS / 1000) - elapsed));
        }
      } catch (e) {
        // ignore transient errors, keep polling
      }
    }, POLL_INTERVAL_MS);

    timeoutRef.current = setTimeout(() => {
      if (pollRef.current) clearInterval(pollRef.current);
      setStatus('EXPIRED');
    }, POLL_TIMEOUT_MS);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [orderId, status, navigate, ticketData]);

  const handleOpenMoMo = () => {
    alert('Vui lòng mở ứng dụng MoMo và quét mã QR code ở trên để thanh toán.');
  };

  const handleRetry = () => {
    navigate(0);
  };

  if (error && status === 'ERROR') {
    return (
      <div className="momo-payment-page">
        <div className="momo-card">
          <h2>Thanh toán MoMo</h2>
          <p className="momo-error">{error}</p>
          <div className="momo-actions">
            <button className="momo-btn" onClick={() => navigate(-1)}>Quay lại</button>
            <button className="momo-btn momo-primary" onClick={handleRetry}>Thử lại</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="momo-payment-page">
      <div className="momo-card">
        <h2>Thanh toán MoMo</h2>
        <div className="momo-order">
          <div>
            <span>Số tiền</span>
            <strong>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0)}</strong>
          </div>
          <div>
            <span>Mô tả</span>
            <strong>{orderDescription}</strong>
          </div>
          {!!orderId && (
            <div>
              <span>Mã đơn hàng</span>
              <strong>{orderId}</strong>
            </div>
          )}
        </div>

        <div className="momo-qr">
          {qrUrl ? (
            <img src={qrUrl} alt="MoMo QR" className="momo-qr-img" />
          ) : (
            <div className="momo-qr-ph">Đang tạo mã QR...</div>
          )}
        </div>

        <div className="momo-instructions">
          <p className="momo-instruction-text">
            <strong>Hướng dẫn thanh toán:</strong>
          </p>
          <ol className="momo-instruction-steps">
            <li>Mở ứng dụng MoMo trên điện thoại</li>
            <li>Chọn chức năng "Quét QR" hoặc "Scan QR"</li>
            <li>Quét mã QR code ở trên</li>
            <li>Xác nhận thông tin và hoàn tất thanh toán</li>
          </ol>
        </div>

        <div className="momo-actions">
          <button className="momo-btn" onClick={() => navigate(-1)}>Quay lại</button>
        </div>

        {status === 'PENDING' && (
          <div className="momo-status momo-pending">Đang chờ thanh toán... {timeLeft}s</div>
        )}
        {status === 'PAID' && (
          <div className="momo-status momo-success">Thanh toán thành công. Đang hoàn tất đặt vé...</div>
        )}
        {status === 'EXPIRED' && (
          <div className="momo-status momo-expired">
            Đơn hàng đã hết hạn. Vui lòng thử lại.
            <div className="momo-actions-inline">
              <button className="momo-btn" onClick={handleRetry}>Tạo đơn hàng mới</button>
            </div>
          </div>
        )}

        {error && status !== 'ERROR' && <div className="momo-error">{error}</div>}
      </div>
    </div>
  );
};

export default MoMoPayment;

