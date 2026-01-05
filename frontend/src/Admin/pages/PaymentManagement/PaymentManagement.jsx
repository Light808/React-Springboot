/* eslint-disable no-empty */
/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from 'react';
import { CreditCard, DollarSign, Clock, CheckCircle, XCircle, AlertCircle, RefreshCw, Eye, Filter, Search, Calendar, User, Mail, Phone } from 'lucide-react';
import './PaymentManagement.css';
import { getAllOrders, markPaid, markExpired } from '../../../services/paymentService';
import PaymentOrderDetail from './PaymentOrderDetail';
import useToast from '../../hooks/useToast';
import ToastContainer from '../../components/Toast/ToastContainer';
import { useTranslation } from 'react-i18next';

function PaymentManagement() {
  const { t } = useTranslation();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState({});
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const { toasts, showSuccess, showError, removeToast } = useToast();

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const data = await getAllOrders();
      setOrders(Array.isArray(data) ? data : []);
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchOrders();
    const timer = setInterval(fetchOrders, 8000);
    return () => clearInterval(timer);
  }, []);

  const handleMark = async (id, status) => {
    setActionLoading(l => ({ ...l, [id]: true }));
    try {
      if (status === 'paid') {
        await markPaid(id);
        try {
          localStorage.setItem('paymentStatusUpdate', JSON.stringify({ orderId: id, status: 'paid', ts: Date.now() }));
          setTimeout(() => localStorage.removeItem('paymentStatusUpdate'), 50);
        } catch (_) {}
      } else {
        await markExpired(id);
        try {
          localStorage.setItem('paymentStatusUpdate', JSON.stringify({ orderId: id, status: 'expired', ts: Date.now() }));
          setTimeout(() => localStorage.removeItem('paymentStatusUpdate'), 50);
        } catch (_) {}
      }
      
      // Show success toast
      const successMessage = status === 'paid' 
        ? t('Payment confirmed successfully!') 
        : t('Payment expired successfully!');
      
      showSuccess(successMessage, 3000);
      
      await fetchOrders();
    } catch (e) {
      showError(`Lỗi: ${e.message}`, 5000);
    } finally {
      setActionLoading(l => ({ ...l, [id]: false }));
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'paid': return <CheckCircle size={16} />;
      case 'pending': return <Clock size={16} />;
      case 'expired': return <XCircle size={16} />;
      case 'failed': return <AlertCircle size={16} />;
      default: return <Clock size={16} />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid': return '#10b981';
      case 'pending': return '#f59e0b';
      case 'expired': return '#ef4444';
      case 'failed': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.orderId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.userEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.orderInfo?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    paid: orders.filter(o => o.status === 'paid').length,
    expired: orders.filter(o => o.status === 'expired').length,
    totalAmount: orders.reduce((sum, o) => sum + (o.amount || 0), 0)
  };

  return (
    <div className="payment-management">
      {/* Header Section */}
      <div className="payment-header">
        <div className="header-content">
          <div className="header-title">
          </div>
          <div className="header-actions">
            <button 
              className={`refresh-btn ${refreshing ? 'spinning' : ''}`}
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw size={18} />
              {refreshing ? t('Loading...') : t('Refresh')}
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon total">
            <DollarSign size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">{t('Total orders')}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon pending">
            <Clock size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.pending}</div>
            <div className="stat-label">{t('Pending payment')}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon paid">
            <CheckCircle size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.paid}</div>
            <div className="stat-label">{t('Paid')}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon expired">
            <XCircle size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.expired}</div>
            <div className="stat-label">{t('Expired')}</div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="filters-section">
        <div className="search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder={t('Search by order ID, email, information...')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <Filter size={18} />
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="status-filter"
          >
            <option value="all">{t('All status')}</option>
            <option value="pending">{t('Pending payment')}</option>
            <option value="paid">{t('Paid')}</option>
            <option value="expired">{t('Expired')}</option>
            <option value="failed">{t('Failed')}</option>
          </select>
        </div>
      </div>

      {/* Main Content */}
      <div className="payment-content">
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>{t('Loading data...')}</p>
          </div>
        ) : error ? (
          <div className="error-container">
            <AlertCircle size={48} />
            <p>{error}</p>
            <button onClick={fetchOrders} className="retry-btn">{t('Try again')}</button>
          </div>
        ) : (
          <div className="payment-layout">
            {/* Orders Table */}
            <div className="orders-section">
              <div className="section-header">
                <h2>{t('Order list')} ({filteredOrders.length})</h2>
              </div>
              <div className="table-container">
                <table className="orders-table">
                  <thead>
                    <tr>
                      <th>{t('Order ID')}</th>
                      <th>{t('Customer')}</th>
                      <th>{t('Information')}</th>
                      <th>{t('Amount')}</th>
                      <th>{t('Status')}</th>
                      <th>{t('Actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="no-data">
                          <div className="no-data-content">
                            <CreditCard size={48} />
                            <p>{t('No orders found')}</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredOrders.map((order) => (
                        <tr 
                          key={order.orderId} 
                          className={`order-row ${selectedOrder?.orderId === order.orderId ? 'selected' : ''}`}
                          onClick={() => setSelectedOrder(order)}
                        >
                          <td className="order-id">
                            <div className="id-content">
                              <span className="id-text">{order.orderId}</span>
                              <button 
                                className="view-btn"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedOrder(order);
                                }}
                              >
                                <Eye size={14} />
                              </button>
                            </div>
                          </td>
                          <td className="customer-info">
                            <div className="customer-details">
                              <div className="customer-email">
                                <Mail size={14} />
                                {order.userEmail || 'N/A'}
                              </div>
                              <div className="customer-name">
                                <User size={14} />
                                {order.userName || 'N/A'}
                              </div>
                            </div>
                          </td>
                          <td className="order-info">
                            <div className="info-text" title={order.orderInfo}>
                              {order.orderInfo?.length > 50 
                                ? `${order.orderInfo.substring(0, 50)}...` 
                                : order.orderInfo || 'N/A'
                              }
                            </div>
                          </td>
                          <td className="amount">
                            <span className="amount-value">
                              {order.amount?.toLocaleString('vi-VN')}₫
                            </span>
                          </td>
                          <td className="status">
                            <div 
                              className="status-badge"
                              style={{ backgroundColor: getStatusColor(order.status) }}
                            >
                              {getStatusIcon(order.status)}
                              <span>{order.status}</span>
                            </div>
                          </td>
                          <td className="actions">
                            <div className="action-buttons">
                              {order.status === 'pending' && (
                                <>
                                  <button
                                    className="action-btn success"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleMark(order.orderId, 'paid');
                                    }}
                                    disabled={actionLoading[order.orderId]}
                                  >
                                    <CheckCircle size={14} />
                                    {t('Confirm')}
                                  </button>
                                  <button
                                    className="action-btn danger"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleMark(order.orderId, 'expired');
                                    }}
                                    disabled={actionLoading[order.orderId]}
                                  >
                                    <XCircle size={14} />
                                    {t('Cancel')}
                                  </button>
                                </>
                              )}
                              {actionLoading[order.orderId] && (
                                <div className="loading-indicator">
                                  <RefreshCw size={14} className="spinning" />
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Order Detail Sidebar */}
            <div className="detail-section">
              {selectedOrder ? (
                <div className="detail-card">
                  <PaymentOrderDetail 
                    order={selectedOrder} 
                    onApprove={(orderId) => handleMark(orderId, 'paid')}
                    onReject={(orderId) => handleMark(orderId, 'expired')}
                    actionLoading={actionLoading[selectedOrder.orderId]}
                  />
                </div>
              ) : (
                <div className="no-selection">
                  <CreditCard size={48} />
                  <p>{t('Select an order to view details')}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Toast Container */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}

export default PaymentManagement;
