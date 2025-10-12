import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Wallet } from 'lucide-react';
import { bookTicket } from '../../../services/ticketService';
import { createNotification, createBookingSuccessNotification } from '../../../services/notificationService';
import { getBalance, addFunds, canPay, pay } from '../../../services/virtualWalletService';
import './PaymentSandbox.css';

const PaymentSandbox = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const payload = location.state || {};

  const {
    ticketData,
    summary,
    method
  } = payload;

  const total = useMemo(() => summary?.totalPrice || ticketData?.price || 0, [summary, ticketData]);
  const [balance, setBalance] = useState(getBalance());

  useEffect(() => {
    const handler = (e) => {
      if (e && e.detail && typeof e.detail.balance === 'number') {
        setBalance(e.detail.balance);
      } else {
        setBalance(getBalance());
      }
    };
    window.addEventListener('sandboxWalletUpdated', handler);
    return () => window.removeEventListener('sandboxWalletUpdated', handler);
  }, []);

  if (!ticketData) {
    return (
      <div style={{ padding: 24 }}>
        <h2>Payment</h2>
        <p>Missing order data. Please try again.</p>
        <button onClick={() => navigate('/')}>Back to Home</button>
      </div>
    );
  }

  const confirmSuccess = async () => {
    if (!canPay(total)) {
      alert('Insufficient wallet balance. Please top up in sandbox.');
      return;
    }
    const ok = pay(total, `Pay for ${ticketData.movieTitle}`);
    if (!ok) {
      alert('Payment failed.');
      return;
    }
    try {
      const result = await bookTicket({ ...ticketData, paymentStatus: 'paid', status: 'pending', paymentMethod: method || 'sandbox' });
      // fire header notification
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
      navigate('/tickets', { replace: true, state: { payment: 'success', ticketId: result?.id || null } });
    } catch (e) {
      console.error('Book ticket after payment failed:', e);
      alert('Could not finalize booking. Please try again.');
    }
  };

  const confirmFail = () => {
    navigate(-1);
  };

  return (
    <div className="sandbox-container">
      <h2>Payment Sandbox</h2>
      <div className="sandbox-balance">
        <Wallet size={18} />
        <span>Wallet balance: <strong>{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'VND' }).format(balance)}</strong></span>
        <button onClick={() => { addFunds(200000); }} className="sandbox-topup">Top up +200,000</button>
      </div>
      <div className="sandbox-bill">
        <div className="sandbox-bill-row">
          <span>Movie</span>
          <strong>{ticketData.movieTitle}</strong>
        </div>
        <div className="sandbox-bill-row">
          <span>Seats</span>
          <strong>{ticketData.seatNumber}</strong>
        </div>
        <div className="sandbox-bill-row">
          <span>Showtime</span>
          <strong>{new Date(ticketData.showTime).toLocaleString()}</strong>
        </div>
        <div className="sandbox-bill-row sandbox-bill-total">
          <span>Total</span>
          <strong>{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'VND' }).format(total)}</strong>
        </div>
      </div>
      <div className="sandbox-btns">
        <button onClick={confirmSuccess} className="sandbox-btn sandbox-btn-success">
          <CheckCircle size={18} /> Pay Success
        </button>
        <button onClick={confirmFail} className="sandbox-btn sandbox-btn-cancel">
          <XCircle size={18} /> Cancel
        </button>
      </div>
    </div>
  );
};

export default PaymentSandbox;


