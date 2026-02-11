/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, MapPin, Ticket, Eye, Trash2, Filter, Search, BarChart3, CheckCircle, XCircle } from 'lucide-react';
import { getTicketsByUser, downloadTicket, exportUserTickets, getUserTicketStats, cancelTicketWithReason, downloadFile, getTicketDetails, refundTicket, getUserRefundStats } from '../../../services/ticketService';
import { addFunds } from '../../../services/virtualWalletService';
import { getMovieById } from '../../../services/movieService';
import styles from './TicketListPage.module.css';
import { useTranslation } from 'react-i18next';
import i18n from '../../../i18n';

const TicketListPage = ({ userId }) => {
  const {t} = useTranslation();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [filteredTickets, setFilteredTickets] = useState([]);
  const [movieTitles, setMovieTitles] = useState({});
  const [movieTitlesLoading, setMovieTitlesLoading] = useState(false);
  const [ticketStats, setTicketStats] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [actionLoading, setActionLoading] = useState({});
  const [showStats] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [refundStats, setRefundStats] = useState(null);

  useEffect(() => {
    const fetchTickets = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const ticketData = await getTicketsByUser(userId);
        setTickets(ticketData);
        setFilteredTickets(ticketData);
        const movieTitlesMap = {};

        ticketData.forEach(ticket => {
          if (ticket.movieTitle) {
            movieTitlesMap[ticket.id] = ticket.movieTitle;
          }
        });

        const ticketsNeedingFetch = ticketData.filter(ticket => !ticket.movieTitle && ticket.movieId);
        
        if (ticketsNeedingFetch.length > 0) {
          setMovieTitlesLoading(true);
          
          const moviePromises = ticketsNeedingFetch.map(async (ticket) => {
            try {
              const movie = await getMovieById(ticket.movieId);
              const movieTitle = movie.title || movie.name || movie.vietnameseTitle || 'Tên phim';
              movieTitlesMap[ticket.id] = movieTitle;
              console.log(`Set movie title for ticket ${ticket.id}:`, movieTitle);
            } catch (error) {
              console.error(`Error fetching movie for ticket ${ticket.id}:`, error);
              movieTitlesMap[ticket.id] = 'Tên phim';
            }
          });
          
          await Promise.all(moviePromises);
          setMovieTitlesLoading(false);
        }
        
        ticketData.forEach(ticket => {
          if (!movieTitlesMap[ticket.id]) {
            movieTitlesMap[ticket.id] = 'Tên phim';
          }
        });
        setMovieTitles(movieTitlesMap);

        try {
          const stats = await getUserTicketStats(userId);
          setTicketStats(stats);
        } catch (statsError) {
          console.error('Error fetching ticket stats:', statsError);
        }

        try {
          const refundStatsData = await getUserRefundStats(userId);
          setRefundStats(refundStatsData);
        } catch (refundStatsError) {
          console.error('Error fetching refund stats:', refundStatsError);
        }
      } catch (err) {
        setError('Reload Ticket list failed, please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchTickets();
  }, [userId]);

  useEffect(() => {
    let filtered = tickets;
    const removeVietnameseDiacritics = (str) => {
      if (!str) return '';

      return str
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd').replace(/Đ/g, 'D')
        .toLowerCase();
    };

    // Function to check if text contains search query
    const containsSearchQuery = (text, query) => {
      if (!text || !query) return false;
      
      const normalizedText = removeVietnameseDiacritics(text);
      const normalizedQuery = removeVietnameseDiacritics(query);
      
      return normalizedText.includes(normalizedQuery);
    };

    if (searchQuery.trim()) {
      filtered = filtered.filter(ticket => {
        const movieTitle = movieTitles[ticket.id] || ticket.movieTitle || 'movie name';
        return containsSearchQuery(movieTitle, searchQuery) ||
              containsSearchQuery(ticket.cinemaName, searchQuery) ||
              containsSearchQuery(ticket.showtimeId, searchQuery);
      });
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(ticket => ticket.status === statusFilter);
    }

    setFilteredTickets(filtered);
  }, [tickets, searchQuery, statusFilter, movieTitles, movieTitlesLoading]);

  useEffect(() => {
    if (Object.keys(movieTitles).length > 0) {
      console.log('Movie titles updated, forcing re-render');
    }
  }, [movieTitles]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return 'N/A';
    return new Date(timeString).toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPrice = (price) => {
    if (!price) return 'N/A';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'confirmed': { text: t('Confirmed'), class: `${styles['status-confirmed']}` },
      'pending': { text: t('Pending'), class: `${styles['status-pending']}` },
      'cancelled': { text: t('Cancelled'), class: `${styles['status-cancelled']}` },
      'used': { text: t('Used'), class: `${styles['status-used']}` },
      'expired': { text: t('Expired'), class: `${styles['status-expired']}` }
    };

    const config = statusConfig[status] || { text: status, class: `${styles['status-default']}` };
    return <span className={`${styles['status-badge']} ${config.class}`}>{config.text}</span>;
  };

  const handleDownloadTicket = async (ticketId) => {
    try {
      setActionLoading(prev => ({ ...prev, [ticketId]: true }));
      const blob = await downloadTicket(ticketId);
      const ticket = tickets.find(t => t.id === ticketId);
      const filename = `ticket_${ticket?.ticketNumber || ticketId}.pdf`;
      downloadFile(blob, filename);
    } catch (error) {
      alert('Không thể tải vé. Vui lòng thử lại sau.');
    } finally {
      setActionLoading(prev => ({ ...prev, [ticketId]: false }));
    }
  };

  const handleViewTicket = async (ticketId) => {
    try {
      const ticket = await getTicketDetails(ticketId);
      if (ticket) {
        const modal = document.createElement('div');
        modal.className = styles['ticket-detail-modal'];
        modal.innerHTML = `
          <div class="${styles['modal-content']}">
            <div class="${styles['modal-header']}">
              <h2>${i18n.t('Ticket details')}</h2>
              <button class="${styles['close-btn']}">&times;</button>
            </div>
            <div class="${styles['modal-body']}">
              <div class="${styles['ticket-detail-info']}">
                <h3>${i18n.t('Basic information')}</h3>
                <p><strong>${i18n.t('Ticket number')}:</strong> ${ticket.ticketNumber || ticket.id}</p>
                <p><strong>${i18n.t('Movie')}:</strong> ${ticket.movieTitle || 'N/A'}</p>
                <p><strong>${i18n.t('Cinema')}:</strong> ${ticket.cinemaName || 'N/A'}</p>
                ${ticket.cinemaAddress ? `<p><strong>${i18n.t('Cinema address')}:</strong> ${ticket.cinemaAddress}</p>` : ''}
                <p><strong>${i18n.t('Show date')}:</strong> ${formatDate(ticket.showDate)}</p>
                <p><strong>${i18n.t('Show time')}:</strong> ${formatTime(ticket.showTime)}</p>
                <p><strong>${i18n.t('Seat')}:</strong> ${ticket.seatNumber || 'N/A'}</p>
                <p><strong>${i18n.t('Price')}:</strong> ${formatPrice(ticket.price)}</p>
                <p><strong>${i18n.t('Status')}:</strong> ${getStatusBadge(ticket.status).props.children}</p>
                <p><strong>${i18n.t('QR Code')}:</strong> ${ticket.qrCode || 'N/A'}</p>
                
                <h3>${i18n.t('Payment information')}</h3>
                <p><strong>${i18n.t('Payment method')}:</strong> ${ticket.paymentMethod || 'N/A'}</p>
                <p><strong>${i18n.t('Payment status')}:</strong> ${ticket.paymentStatus || 'N/A'}</p>
                <p><strong>${i18n.t('Booking time')}:</strong> ${ticket.bookingTime ? formatDate(ticket.bookingTime) : 'N/A'}</p>
                
                ${ticket.usedAt ? `
                  <h3>${i18n.t('Used information')}</h3>
                  <p><strong>${i18n.t('Used time')}:</strong> ${formatDate(ticket.usedAt)}</p>
                ` : ''}
                
                ${ticket.refundedAt ? `
                  <h3>${i18n.t('Refund information')}</h3>
                  <p><strong>${i18n.t('Refund time')}:</strong> ${formatDate(ticket.refundedAt)}</p>
                  <p><strong>${i18n.t('Refund amount')}:</strong> ${formatPrice(ticket.refundAmount || 0)}</p>
                  <p><strong>${i18n.t('Refund reason')}:</strong> ${ticket.refundReason || 'N/A'}</p>
                ` : ''}
              </div>
            </div>
          </div>
        `;
        document.body.appendChild(modal);
        
        // Close modal handlers
        modal.querySelector(`.${styles['close-btn']}`).onclick = () => {
          document.body.removeChild(modal);
        };
        modal.onclick = (e) => {
          if (e.target === modal) {
            document.body.removeChild(modal);
          }
        };
      }
    } catch (error) {
      console.error('Error fetching ticket details:', error);
      alert(t('Cannot load ticket details. Please try again.'));
    }
  };

  const handleCancelTicket = (ticketId) => {
    const ticket = tickets.find(t => t.id === ticketId);
    setSelectedTicket(ticket);
    setCancelReason('');
    setShowCancelModal(true);
  };

  const handleRefundTicket = (ticketId) => {
    const ticket = tickets.find(t => t.id === ticketId);
    setSelectedTicket(ticket);
    setRefundAmount(ticket.price.toString());
    setRefundReason('');
    setShowRefundModal(true);
  };

  const confirmRefundTicket = async () => {
    if (!selectedTicket || !refundAmount || !refundReason) {
      alert(t('Please fill in all required fields'));
      return;
    }

    try {
      setActionLoading(prev => ({ ...prev, [selectedTicket.id]: true }));
      await refundTicket(selectedTicket.id, parseFloat(refundAmount), refundReason);
      // credit sandbox wallet
      try {
        const credited = Math.max(0, Math.floor(parseFloat(refundAmount)));
        if (credited > 0) {
          addFunds(credited, `Refund for ticket ${selectedTicket.id}`);
        }
      } catch (e) {
        console.warn('Could not credit sandbox wallet after refund:', e);
      }
      alert(t('Refund successful! The wallet balance has been added.'));
      setShowRefundModal(false);
      setRefundAmount('');
      setRefundReason('');
      window.location.reload();
    } catch (error) {
      console.error('Error refunding ticket:', error);
      alert(t('Refund failed. Please try again.'));
    } finally {
      setActionLoading(prev => ({ ...prev, [selectedTicket.id]: false }));
    }
  };


  const confirmCancelTicket = async () => {
    if (!selectedTicket) return;
    
    try {
      setActionLoading(prev => ({ ...prev, [selectedTicket.id]: true }));
      await cancelTicketWithReason(selectedTicket.id, cancelReason);
      
      // Update local state
      setTickets(prev => prev.map(ticket =>
        ticket.id === selectedTicket.id
          ? { ...ticket, status: 'cancelled', cancellationReason: cancelReason }
          : ticket
      ));
      
      setShowCancelModal(false);
      setSelectedTicket(null);
      setCancelReason('');
      alert(t('Ticket cancelled successfully!'));
    } catch (error) {
      console.error('Error cancelling ticket:', error);
      alert(t('Cannot cancel ticket. Please try again.'));
    } finally {
      setActionLoading(prev => ({ ...prev, [selectedTicket.id]: false }));
    }
  };

  const handleExportTickets = async (format = 'pdf') => {
    try {
      setActionLoading(prev => ({ ...prev, export: true }));
      const blob = await exportUserTickets(userId, format);
      const filename = `tickets_${userId}.${format}`;
      downloadFile(blob, filename);
    } catch (error) {
      console.error('Error exporting tickets:', error);
      alert(t('Cannot export ticket list. Please try again.'));
    } finally {
      setActionLoading(prev => ({ ...prev, export: false }));
    }
  };

  if (!userId) {
    return (
      <div className={`${styles['ticket-list-page']}`}>
        <div className={`${styles['container']}`}>
          <div className={`${styles['login-required']}`}>
            <h2>{t('My tickets')}</h2>
            <p>{t('Please login to view your tickets')}</p>
            <Link to="/login" className={`${styles['login-btn']}`}>{t('Login')}</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles['ticket-list-page']}`}>
      <div className={`${styles['container']}`}>
        <div className={`${styles['page-header']}`}>
          <div className={`${styles['header-content']}`}>
            <div className={`${styles['header-text']}`}>
              <h1>{t('My tickets')}</h1>
              <p>{t('Manage and track your movie tickets')}</p>
            </div>
          </div>
        </div>


        {/* Search and Filter */}
        <div className={`${styles['ticket-controls']}`}>
          <div className={`${styles['search-section']}`}>
            <div className={`${styles['search-input-wrapper']}`}>
              <Search size={20} className={`${styles['search-icon']}`} />
              <input
                type="text"
                placeholder={t('Search by movie name, cinema name...')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`${styles['search-input']}`}
              />
            </div>
          </div>

          <div className={`${styles['filter-section']}`}>
            <Filter size={20} />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={`${styles['status-filter']}`}
            >
              <option value="all">{t('All status')}</option>
              <option value="confirmed">{t('Confirmed')}</option>
              <option value="pending">{t('Pending')}</option>
              <option value="used">{t('Used')}</option>
              <option value="cancelled">{t('Cancelled')}</option>
              <option value="expired">{t('Expired')}</option>
            </select>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className={`${styles['loading-state']}`}>
            <div className={`${styles['loading-spinner']}`}></div>
            <p>{t('Loading ticket list...')}</p>
          </div>
        )}

        {/* Movie Titles Loading State */}
        {!loading && !error && movieTitlesLoading && (
          <div className={`${styles['loading-state']}`}>
            <div className={`${styles['loading-spinner']}`}></div>
            <p>{t('Loading movie information...')}</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className={`${styles['error-state']}`}>
            <p>{error}</p>
            <button onClick={() => window.location.reload()} className={`${styles['retry-btn']}`}>
              {t('Try again')}
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && !movieTitlesLoading && filteredTickets.length === 0 && (
          <div className={`${styles['empty-state']}`}>
            <Ticket size={64} className={`${styles['empty-icon']}`} />
            <h3>{t('No tickets found')}</h3>
            <p>
              {searchQuery || statusFilter !== 'all'
                ? t('No tickets found matching your filter')
                : t('You have not booked any movie tickets. Explore and book tickets now!')
              }
            </p>
            {!searchQuery && statusFilter === 'all' && (
              <Link to="/" className={`${styles['explore-btn']}`}>{t('Explore movies')}</Link>
            )}
          </div>
        )}

        {/* Tickets List */}
        {!loading && !error && !movieTitlesLoading && filteredTickets.length > 0 && (
          <div className={`${styles['tickets-grid']}`}>
            {filteredTickets.map((ticket) => (
              <div key={ticket.id} className={`${styles['ticket-card']}`}>
                <div className={`${styles['ticket-header']}`}>
                  <div className={`${styles['ticket-poster']}`}>
                    <img
                      src={ticket.moviePoster || '/default-movie.jpg'}
                      alt={ticket.movieTitle || 'Movie Poster'}
                      className={`${styles['movie-poster-img']}`}
                      onError={(e) => {
                        e.target.src = '/default-movie.jpg';
                      }}
                    />
                  </div>
                  <div className={`${styles['ticket-info']}`}>
                    <h3 className={`${styles['movie-title']}`}>
                      {(() => {
                        if (movieTitles[ticket.id]) {
                          return movieTitles[ticket.id];
                        }
                        if (ticket.movieTitle) {
                          return ticket.movieTitle;
                        }
                        if (movieTitlesLoading) {
                          return t('Loading...');
                        }
                        return t('Movie name');
                      })()}
                    </h3>
                    <p className={`${styles['cinema-name']}`}>
                      <MapPin size={16} />
                      {ticket.cinemaName || t('Cinema name')}
                    </p>
                  </div>
                  {getStatusBadge(ticket.status)}
                </div>

                <div className={`${styles['ticket-details']}`}>
                  <div className={`${styles['detail-row']}`}>
                    <Calendar size={16} />
                    <span>{formatDate(ticket.showDate)}</span>
                  </div>
                  <div className={`${styles['detail-row']}`}>
                    <Clock size={16} />
                    <span>{formatTime(ticket.showTime)}</span>
                  </div>
                  <div className={`${styles['detail-row']}`}>
                    <Ticket size={16} />
                    <span>{t('Seat')}: {ticket.seatNumber || ticket.seatId || 'N/A'}</span>
                  </div>
                  <div className={`${styles['detail-row']}`}>
                    <span className={`${styles['price']}`}>{formatPrice(ticket.price)}</span>
                  </div>
                </div>

                <div className={`${styles['ticket-actions']}`}>
                  <button
                    onClick={() => handleViewTicket(ticket.id)}
                    className={`${styles['action-btn']} ${styles['view-btn']}`}
                    title={t('Xem chi tiết')}
                    disabled={actionLoading[ticket.id]}
                  >
                    {actionLoading[ticket.id] ? '...' : t('View')}
                  </button>
                  {(ticket.status === 'confirmed' || ticket.status === 'pending') && (
                    <button
                      onClick={() => handleCancelTicket(ticket.id)}
                      className={`${styles['action-btn']} ${styles['cancel-btn']}`}
                      title={t('Hủy vé')}
                      disabled={actionLoading[ticket.id]}
                    >
                      {actionLoading[ticket.id] ? '...' : t('Cancel')}
                    </button>
                  )}
                  {ticket.status === 'cancelled' && ticket.isRefundable && !ticket.refundedAt && (
                    <button
                      onClick={() => handleRefundTicket(ticket.id)}
                      className={`${styles['action-btn']} ${styles['refund-btn']}`}
                      title={t('Hoàn tiền')}
                      disabled={actionLoading[ticket.id]}
                    >
                      <BarChart3 size={16} />
                      {actionLoading[ticket.id] ? '...' : t('Refund')}
                    </button>
                  )}
                </div>

                <div className={`${styles['ticket-footer']}`}>
                  <p className={`${styles['booking-time']}`}>
                    {t('Booked at')}: {ticket.bookingTime ? formatDate(ticket.bookingTime) + ' ' + formatTime(ticket.bookingTime) : 'N/A'}
                  </p>
                  <p className={`${styles['ticket-id']}`}>{t('Ticket ID')}: {ticket.id}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Summary */}
        {!loading && !error && !movieTitlesLoading && filteredTickets.length > 0 && (
          <div className={`${styles['ticket-summary']}`}>
            <p>
              {t('Displaying')} {filteredTickets.length} {t('tickets')} 
              {searchQuery && ` cho "${searchQuery}"`}
              {statusFilter !== 'all' && ` - Trạng thái: ${getStatusBadge(statusFilter).text}`}
            </p>
          </div>
        )}

        {/* Cancel Ticket Modal */}
        {showCancelModal && selectedTicket && (
          <div className={`${styles['modal-overlay']}`}>
            <div className={`${styles['modal-content']}`}>
              <div className={`${styles['modal-header']}`}>
                <h3>{t('Cancel ticket')}</h3>
                <button
                  className={`${styles['close-btn']}`}
                  onClick={() => {
                    setShowCancelModal(false);
                    setSelectedTicket(null);
                    setCancelReason('');
                  }}
                >
                  &times;
                </button>
              </div>
              <div className={`${styles['modal-body']}`}>
                <div className={`${styles['ticket-info']}`}>
                  <p><strong>{t('Movie')}:</strong> {selectedTicket.movieTitle || 'N/A'}</p>
                  <p><strong>{t('Cinema')}:</strong> {selectedTicket.cinemaName || 'N/A'}</p>
                  <p><strong>{t('Date')}:</strong> {formatDate(selectedTicket.showDate)}</p>
                  <p><strong>{t('Time')}:</strong> {formatTime(selectedTicket.showTime)}</p>
                  <p><strong>{t('Seat')}:</strong> {selectedTicket.seatNumber || 'N/A'}</p>
                </div>
                <div className={`${styles['form-group']}`}>
                  <label htmlFor="cancelReason">{t('Reason for canceling the ticket (optional)')}:</label>
                  <textarea
                    id="cancelReason"
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    placeholder={t('Nhập lý do hủy vé...')}
                    rows={3}
                  />
                </div>
                <div className={`${styles['modal-actions']}`}>
                  <button
                    onClick={() => {
                      setShowCancelModal(false);
                      setSelectedTicket(null);
                      setCancelReason('');
                    }}
                    className={`${styles['btn-secondary']}`}
                  >
                    {t('Cancel')}
                  </button>
                  <button
                    onClick={confirmCancelTicket}
                    className={`${styles['btn-danger']}`}
                    disabled={actionLoading[selectedTicket.id]}
                  >
                    {actionLoading[selectedTicket.id] ? t('Processing...') : t('Confirm cancel')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Refund Ticket Modal */}
        {showRefundModal && selectedTicket && (
          <div className={`${styles['modal-overlay']}`}>
            <div className={`${styles['modal-content']}`}>
              <div className={`${styles['modal-header']}`}>
                <h3>{t('Refund ticket')}</h3>
                <button
                  className={`${styles['close-btn']}`}
                  onClick={() => {
                    setShowRefundModal(false);
                    setSelectedTicket(null);
                    setRefundAmount('');
                    setRefundReason('');
                  }}
                >
                  &times;
                </button>
              </div>
              <div className={`${styles['modal-body']}`}>
                <div className={`${styles['ticket-info']}`}>
                  <p><strong>{t('Movie')}:</strong> {selectedTicket.movieTitle || 'N/A'}</p>
                  <p><strong>{t('Cinema')}:</strong> {selectedTicket.cinemaName || 'N/A'}</p>
                  <p><strong>{t('Date')}:</strong> {formatDate(selectedTicket.showDate)}</p>
                  <p><strong>{t('Time')}:</strong> {formatTime(selectedTicket.showTime)}</p>
                  <p><strong>{t('Seat')}:</strong> {selectedTicket.seatNumber || 'N/A'}</p>
                  <p><strong>{t('Price')}:</strong> {formatPrice(selectedTicket.price)}</p>
                </div>
                <div className={`${styles['form-group']}`}>
                  <label htmlFor="refundAmount">{t('Refund amount (VND)')}:</label>
                  <input
                    type="number"
                    id="refundAmount"
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(e.target.value)}
                    placeholder={t('Nhập số tiền hoàn...')}
                    min="0"
                    max={selectedTicket.price}
                  />
                </div>
                <div className={`${styles['form-group']}`}>
                  <label htmlFor="refundReason">{t('Refund reason')}:</label>
                  <textarea
                    id="refundReason"
                    value={refundReason}
                    onChange={(e) => setRefundReason(e.target.value)}
                    placeholder={t('Nhập lý do hoàn tiền...')}
                    rows={3}
                    required
                  />
                </div>
                <div className={`${styles['modal-actions']}`}>
                  <button
                    onClick={() => {
                      setShowRefundModal(false);
                      setSelectedTicket(null);
                      setRefundAmount('');
                      setRefundReason('');
                    }}
                    className={`${styles['btn-secondary']}`} 
                  >
                    {t('Cancel')}
                  </button>
                  <button
                    onClick={confirmRefundTicket}
                    className={`${styles['btn-primary']}`}
                    disabled={actionLoading[selectedTicket.id]}
                  >
                    {actionLoading[selectedTicket.id] ? t('Processing...') : t('Confirm refund')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default TicketListPage;
