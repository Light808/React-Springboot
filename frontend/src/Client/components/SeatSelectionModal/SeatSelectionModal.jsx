/* eslint-disable no-constant-binary-expression */
/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import { X, User, CreditCard, CheckCircle } from 'lucide-react';
import { getSeatsByShowtime, bookSeat } from '../../services/seatService';
import { bookTicket } from '../../services/ticketService';
import './SeatSelectionModal.css';
import { useTranslation } from 'react-i18next';

const SeatSelectionModal = ({ isOpen, onClose, showtime, movie, userId }) => {
  const { t } = useTranslation();
  const [seats, setSeats] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [booking, setBooking] = useState(false);
  const [message, setMessage] = useState('');
  const [step, setStep] = useState(1);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('cash');

  useEffect(() => {
    if (isOpen && showtime?.id) {
      fetchSeats();
    }
  }, [isOpen, showtime]);

  const fetchSeats = async () => {
    try {
      setLoading(true);
      const seatsData = await getSeatsByShowtime(showtime.id);
      setSeats(seatsData);
    } catch (error) {
      console.error('Error fetching seats:', error);
      setMessage(t('Unable to load seat list'));
    } finally {
      setLoading(false);
    }
  };

  const handleSeatClick = (seat) => {
    if (seat.booked && seat.bookedBy && seat.bookedBy.trim() !== '') return;

    setSelectedSeats(prev => {
      const isSelected = prev.find(s => s.id === seat.id);
      if (isSelected) {
        return prev.filter(s => s.id !== seat.id);
      } else {
        return [...prev, seat];
      }
    });
  };

  const handleBooking = async () => {
    if (selectedSeats.length === 0) {
      setMessage(t('Please select at least one seat'));
      return;
    }

    try {
      setBooking(true);
      setMessage('');
      
      // Book each selected seat
      for (const seat of selectedSeats) {
        try {
          await bookSeat(seat.id, userId);
        } catch (error) {
          setMessage(t('Seat {{seatNumber}} has been booked by someone else. Please choose another seat.', { seatNumber: seat.seatNumber }));
          setBooking(false);
          return;
        }
      }
      
      let showDate, showTime;
      
      if (showtime.startTime) {
        const startDateTime = new Date(showtime.startTime);
        showDate = startDateTime.toISOString().split('T')[0];
        showTime = startDateTime.toISOString();
      } else {
        showDate = showtime.showDate || new Date().toISOString().split('T')[0];
        showTime = showtime.time || showtime.showTime || new Date().toISOString();
      }

      // Create ticket data
      const seatNumbers = selectedSeats.map(seat => seat.seatNumber).join(', ');
      const seatIds = selectedSeats.map(seat => seat.id).join(', ');
      const totalPrice = (showtime.price || 100000) * selectedSeats.length;

      const ticketData = {
        userId: userId,
        showtimeId: showtime.id,
        seatId: seatIds,
        seatNumber: seatNumbers,
        movieId: movie.id,
        movieTitle: movie.title || movie.name,
        moviePoster: movie.posterUrl || movie.poster || movie.imageUrl || movie.image || '/default-movie.jpg',
        movieThumbnail: movie.thumbnailUrl || movie.thumbnail || movie.posterUrl || movie.poster || '/default-movie.jpg',
        cinemaName: showtime.cinemaName || 'Movie Theater',
        cinemaAddress: showtime.cinemaAddress || showtime.address || '',
        showDate: showDate,
        showTime: showTime,
        price: totalPrice,
        status: 'pending',
        paymentMethod: selectedPaymentMethod,
        paymentStatus: selectedPaymentMethod === 'cash' ? 'pending' : 'paid',
        isRefundable: true
      };
      await bookTicket(ticketData);
      setStep(3);
      setMessage(t('Booking successful!'));
    } catch (error) {
      console.error('Error booking tickets:', error);
      setMessage(t('Booking failed. Please try again.'));
    } finally {
      setBooking(false);
    }
  };

  const formatTime = (timeString) => {
    if (!timeString) return '';
    try {
      const date = new Date(timeString);
      return date.toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    } catch (error) {
      return timeString;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('vi-VN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return dateString;
    }
  };

  const getTotalPrice = () => {
    const pricePerSeat = showtime.price || 100000;
    return selectedSeats.length * pricePerSeat;
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  if (!isOpen) return null;

  return (
    <div className="seat-selection-overlay">
      <div className="seat-selection-modal">
        <div className="modal-header">
          <div className="movie-info">
            <h2>{movie?.title || movie?.name}</h2>
            <div className="showtime-info">
              <span>{formatDate(showtime?.startTime || showtime?.showDate)}</span>
              <span>{formatTime(showtime?.startTime || showtime?.time)}</span>
              <span>{t('Room')} {showtime?.room || '1'}</span>
            </div>
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        {step === 1 && (
          <div className="seat-selection-content">
            <div className="screen-indicator">
              <div className="screen">{t('Screen')}</div>
            </div>

            <div className="seat-map">
              {loading ? (
                <div className="loading">{t('Loading seat map...')}</div>
              ) : (
                <div className="seats-grid">
                  {seats.map(seat => {
                    const isSelected = selectedSeats.find(s => s.id === seat.id);
                    const isActuallyBooked = seat.booked && seat.bookedBy && seat.bookedBy.trim() !== '';
                    const className = `seat ${isActuallyBooked ? 'booked' : ''} ${
                      isSelected ? 'selected' : ''
                    }`;
                    
                    return (
                      <button
                        key={seat.id}
                        className={className}
                        style={inlineStyle}
                        disabled={isActuallyBooked}
                        onClick={() => handleSeatClick(seat)}
                      title={isActuallyBooked ? t('Booked by {{name}}', { name: seat.bookedBy || 'người khác' }) : ''}
                      >
                        {isActuallyBooked ? (
                          <span style={{ color: '#ef4444', fontSize: '14px', fontWeight: 'bold' }}>✕</span>
                        ) : (
                          seat.seatNumber
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="seat-legend">
              <div className="legend-item">
                <div className="seat-sample available"></div>
                <span>{t('Available seat')}</span>
              </div>
              <div className="legend-item">
                <div className="seat-sample selected"></div>
                <span>{t('Selected')}</span>
              </div>
              <div className="legend-item">
                <div className="seat-sample booked">
                  <span style={{ color: '#ef4444', fontSize: '12px', fontWeight: 'bold' }}>✕</span>
                </div>
                <span>{t('Booked')}</span>
              </div>
            </div>

            {selectedSeats.length > 0 && (
              <div className="selected-seats-info">
                <h3>{t('Selected seats:')} {selectedSeats.map(s => s.seatNumber).join(', ')}</h3>
                <div className="price-info">
                  <span>{t('Total:')} {formatPrice(getTotalPrice())}</span>
                </div>
                <button
                  className="continue-btn"
                  onClick={() => {
                    onClose();
                    window.location.href = `/combo-selection?showtime=${encodeURIComponent(JSON.stringify(showtime))}&movie=${encodeURIComponent(JSON.stringify(movie))}&seats=${encodeURIComponent(JSON.stringify(selectedSeats))}&user=${encodeURIComponent(JSON.stringify({id: userId}))}`;
                  }}
                >
                  {t('Book ticket')}
                </button>
              </div>
            )}

            {message && <div className="message error">{message}</div>}
          </div>
        )}

        {/* Payment step removed - now handled in ComboSelectionPage */}
        {false && (
          <div className="payment-content">
            <h3>{t('Payment information')}</h3>
            <div className="booking-summary">
              <div className="summary-item">
                <span>{t('Movie:')}</span>
                <span>{movie?.title || movie?.name}</span>
              </div>
              <div className="summary-item">
                <span>{t('Showtime:')}</span>
                <span>{formatDate(showtime?.startTime)} - {formatTime(showtime?.startTime)}</span>
              </div>
              <div className="summary-item">
                <span>{t('Seat:')}</span>
                <span>{selectedSeats.map(s => s.seatNumber).join(', ')}</span>
              </div>
              <div className="summary-item total">
                <span>T{t('Total:')}</span>
                <span>{formatPrice(getTotalPrice())}</span>
              </div>
            </div>

            <div className="payment-methods">
              <h4>{t('Payment method')}</h4>
              <div className="payment-options">
                <label className="payment-option">
                  <input
                    type="radio"
                    name="payment"
                    value="cash"
                    checked={selectedPaymentMethod === 'cash'}
                    onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                  />
                  <div className="payment-option-content">
                    <div className="payment-icon">
                      <img src="/payment-icons/cash-icon.png" alt="Cash" className="payment-icon-img" />
                    </div>
                    <div className="payment-details">
                      <span className="payment-title">{t('Pay at counter')}</span>
                      <span className="payment-desc">{t('Pay upon arrival')}</span>
                    </div>
                  </div>
                </label>
                <label className="payment-option">
                  <input
                    type="radio"
                    name="payment"
                    value="vietqr"
                    checked={selectedPaymentMethod === 'vietqr'}
                    onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                  />
                  <div className="payment-option-content">
                    <div className="payment-icon">
                      <img src="https://vietqr.net/img/VIETQR_logo.png" alt="VietQR" className="payment-icon-img" />
                    </div>
                    <div className="payment-details">
                      <span className="payment-title">VietQR</span>
                      <span className="payment-desc">{t('Scan QR code to pay')}</span>
                    </div>
                  </div>
                </label>
                <label className="payment-option">
                  <input
                    type="radio"
                    name="payment"
                    value="momo"
                    checked={selectedPaymentMethod === 'momo'}
                    onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                  />
                  <div className="payment-option-content">
                    <div className="payment-icon">
                      <img src="/payment-icons/momo-logo.png" alt="MoMo" className="payment-icon-img" />
                    </div>
                    <div className="payment-details">
                      <span className="payment-title">{t('MoMo Wallet')}</span>
                      <span className="payment-desc">{t('Pay via MoMo app')}</span>
                    </div>
                  </div>
                </label>
                <label className="payment-option">
                  <input
                    type="radio"
                    name="payment"
                    value="zalopay"
                    checked={selectedPaymentMethod === 'zalopay'}
                    onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                  />
                  <div className="payment-option-content">
                    <div className="payment-icon">
                      <img src="/payment-icons/zalopay-logo.png" alt="ZaloPay" className="payment-icon-img" />
                    </div>
                    <div className="payment-details">
                      <span className="payment-title">ZaloPay</span>
                      <span className="payment-desc">{t('Pay via ZaloPay')}</span>
                    </div>
                  </div>
                </label>
              </div>
            </div>

            <div className="payment-actions">
              <button
                className="back-btn"
                onClick={() => setStep(1)}
              >
                {t('Go back')}
              </button>
              <button
                className="book-btn"
                onClick={handleBooking}
                disabled={booking}
              >
                {booking ? t('Processing...') : t('Confirm booking')}
              </button>
            </div>

            {message && <div className="message error">{message}</div>}
          </div>
        )}

        {/* Success step removed - now handled in ComboSelectionPage */}
        {false && (
          <div className="success-content">
            <div className="success-icon">
              <CheckCircle size={64} color="#10b981" />
            </div>
            <h3>{t('BookingTicketSuccess')}!</h3>
            <p>{t('Your ticket has been confirmed. Please arrive at the cinema 15 minutes before showtime.')}</p>
            <div className="success-actions">
              <button 
                className="view-tickets-btn"
                onClick={() => {
                  onClose();
                  window.location.href = '/tickets';
                }}
              >
                {t('View my ticket')}
              </button>
              <button
                className="close-success-btn"
                onClick={onClose}
              >
                {t('Close')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SeatSelectionModal;
