/* eslint-disable no-unused-vars */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { createZaloPayOrder, queryZaloPayOrder } from '../../../services/zaloPayService';
import { bookTicket } from '../../../services/ticketService';
import './ZaloPayPayment.css';

const POLL_INTERVAL_MS = 2500;
const POLL_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

const ZaloPayPayment = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const { ticketData, summary, description, user } = location.state || {};

  const [appTransId, setAppTransId] = useState('');
  const [payUrl, setPayUrl] = useState('');
  const [qrUrl, setQrUrl] = useState('');
  const [status, setStatus] = useState('INITIAL'); // INITIAL | PENDING | PAID | EXPIRED | ERROR
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
        const res = await createZaloPayOrder(userLabel, amount, orderDescription);
        if (!res || !res.appTransId) throw new Error('Invalid create order response');
        setAppTransId(res.appTransId);
        setPayUrl(res.payUrl || '');
        setQrUrl(res.qrUrl || '');
      } catch (e) {
        setStatus('ERROR');
        setError(e?.message || 'Failed to create ZaloPay order');
      }
    };

    createOrder();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!appTransId || status !== 'PENDING') return;

    const startTime = Date.now();

    pollRef.current = setInterval(async () => {
      try {
        const res = await queryZaloPayOrder(appTransId);
        const s = res?.status || res?.returnCode || 'PENDING';
        if (s === 'PAID' || s === 1 || s === '1') {
          clearInterval(pollRef.current);
          clearTimeout(timeoutRef.current);
          setStatus('PAID');
          // Create ticket only after paid
          try {
            await bookTicket({ ...ticketData, paymentMethod: 'zalopay', paymentStatus: 'paid', status: 'confirmed' });
            navigate('/tickets');
          } catch (err) {
            setError('Payment confirmed, but booking failed. Please contact support.');
          }
        } else if (s === 'EXPIRED' || s === -1 || s === '-1') {
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
  }, [appTransId, status, navigate, ticketData]);

  const handleOpenZaloPay = () => {
    if (payUrl) window.open(payUrl, '_blank', 'noopener,noreferrer');
  };

  const handleRetry = () => {
    navigate(0);
  };

  if (error && status === 'ERROR') {
    return (
      <div className="zalopay-payment-page">
        <div className="zpay-card">
          <h2>ZaloPay Payment</h2>
          <p className="zpay-error">{error}</p>
          <div className="zpay-actions">
            <button className="zpay-btn" onClick={() => navigate(-1)}>Back</button>
            <button className="zpay-btn zpay-primary" onClick={handleRetry}>Retry</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="zalopay-payment-page">
      <div className="zpay-card">
        <h2>ZaloPay Payment</h2>
        <div className="zpay-order">
          <div>
            <span>Amount</span>
            <strong>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0)}</strong>
          </div>
          <div>
            <span>Description</span>
            <strong>{orderDescription}</strong>
          </div>
          {!!appTransId && (
            <div>
              <span>AppTransId</span>
              <strong>{appTransId}</strong>
            </div>
          )}
        </div>

        <div className="zpay-qr">
          {qrUrl ? (
            <img src={qrUrl} alt="ZaloPay QR" className="zpay-qr-img" />
          ) : (
            <div className="zpay-qr-ph">Generating QR...</div>
          )}
        </div>

        <div className="zpay-actions">
          <button className="zpay-btn" onClick={() => navigate(-1)}>Back</button>
          <button className="zpay-btn zpay-primary" onClick={handleOpenZaloPay} disabled={!payUrl}>Pay with ZaloPay</button>
        </div>

        {status === 'PENDING' && (
          <div className="zpay-status zpay-pending">Waiting for payment... {timeLeft}s</div>
        )}
        {status === 'PAID' && (
          <div className="zpay-status zpay-success">Payment confirmed. Finalizing booking...</div>
        )}
        {status === 'EXPIRED' && (
          <div className="zpay-status zpay-expired">
            Payment expired. Please try again.
            <div className="zpay-actions-inline">
              <button className="zpay-btn" onClick={handleRetry}>Create new order</button>
            </div>
          </div>
        )}

        {error && status !== 'ERROR' && <div className="zpay-error">{error}</div>}
      </div>
    </div>
  );
};

export default ZaloPayPayment;


