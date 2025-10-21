import React, { useState, useEffect } from 'react';
import { Bell, Check, Trash2, X, Clock, CheckCircle, AlertCircle, Info } from 'lucide-react';
import {
  getNotificationsByUser,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  getUnreadNotificationCount
} from '../../../services/notificationService';
import styles from './Notification.module.css';
import { useTranslation } from 'react-i18next';

const Notification = ({ userId, onClose }) => {
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    if (userId) {
      fetchNotifications();
      fetchUnreadCount();
      
      // Listen for notification updates
      const handleNotificationUpdate = () => {
        fetchNotifications();
        fetchUnreadCount();
      };
      
      window.addEventListener('notificationUpdated', handleNotificationUpdate);
      
      return () => {
        window.removeEventListener('notificationUpdated', handleNotificationUpdate);
      };
    }
  }, [userId]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const data = await getNotificationsByUser(userId);
      setNotifications(data || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const count = await getUnreadNotificationCount(userId);
      setUnreadCount(count || 0);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await markNotificationAsRead(notificationId);
      setNotifications(prev =>
        prev.map(notif =>
          notif.id === notificationId
            ? { ...notif, isRead: true, readAt: new Date().toISOString() }
            : notif
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead(userId);
      setNotifications(prev =>
        prev.map(notif => ({
          ...notif,
          isRead: true,
          readAt: new Date().toISOString()
        }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const handleDeleteNotification = async (notificationId) => {
    try {
      await deleteNotification(notificationId);
      setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
      // Update unread count if needed
      const deletedNotif = notifications.find(notif => notif.id === notificationId);
      if (deletedNotif && !deletedNotif.isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'booking_success':
        return <CheckCircle size={16} className={styles['notification-icon-success']} />;
      case 'ticket_approved':
        return <CheckCircle size={16} className={styles['notification-icon-success']} />;
      case 'ticket_cancelled':
        return <AlertCircle size={16} className={styles['notification-icon-error']} />;
      default:
        return <Info size={16} className={styles['notification-icon-info']} />;
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return t('Now');
    if (diffInMinutes < 60) return `${diffInMinutes} ${t('minutes ago')}`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} ${t('hours ago')}`;
    if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)} ${t('days ago')}`;
    
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredNotifications = activeTab === 'unread'
    ? notifications.filter(notif => !notif.isRead)
    : notifications;

  if (loading) {
    return (
      <div className={styles['notification-overlay']}>
        <div className={styles['notification-modal']}>
          <div className={styles['notification-loading']}>
            <div className={styles['loading-spinner']}></div>
            <p>{t('Loadingnotifications')}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles['notification-overlay']}>
      <div className={styles['notification-modal']}>
        <div className={styles['notification-header']}>
          <div className={styles['notification-title']}>
            <Bell size={20} />
            <h3>{t('Notifications')}</h3>
            {unreadCount > 0 && (
              <span className={styles['unread-badge']}>{unreadCount}</span>
            )}
          </div>
          <button
            className={styles['close-btn']}
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>

        <div className={styles['notification-tabs']}>
          <button
            className={`${styles['tab-btn']} ${activeTab === 'all' ? styles['tab-active'] : ''}`}
            onClick={() => setActiveTab('all')}
          >
            {t('All')} ({notifications.length})
          </button>
          <button
            className={`${styles['tab-btn']} ${activeTab === 'unread' ? styles['tab-active'] : ''}`}
            onClick={() => setActiveTab('unread')}
          >
            {t('Unread')} ({unreadCount})
          </button>
        </div>

        <div className={styles['notification-actions']}>
          {unreadCount > 0 && (
            <button
              className={styles['mark-all-read-btn']}
              onClick={handleMarkAllAsRead}
            >
              <Check size={16} />
              {t('Mark all as read')}
            </button>
          )}
        </div>

        <div className={styles['notification-list']}>
          {filteredNotifications.length === 0 ? (
            <div className={styles['no-notifications']}>
              <Bell size={48} />
              <p>{t('No notifications')}</p>
            </div>
          ) : (
            filteredNotifications.map(notification => (
              <div
                key={notification.id}
                className={`${styles['notification-item']} ${!notification.isRead ? styles['unread'] : ''}`}
              >
                <div className={styles['notification-content']}>
                  <div className={styles['notification-icon']}>
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className={styles['notification-details']}>
                    <h4 className={styles['notification-title-text']}>
                      {notification.title}
                    </h4>
                    <p className={styles['notification-message']}>
                      {notification.message}
                    </p>
                    <div className={styles['notification-meta']}>
                      <span className={styles['notification-time']}>
                        <Clock size={12} />
                        {formatDate(notification.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className={styles['notification-actions-item']}>
                  {!notification.isRead && (
                    <button
                      className={styles['mark-read-btn']}
                      onClick={() => handleMarkAsRead(notification.id)}
                      title={t('Mark as read')}
                    >
                      <Check size={14} />
                    </button>
                  )}
                  <button
                    className={styles['delete-btn']}
                    onClick={() => handleDeleteNotification(notification.id)}
                    title={t('Delete notification')}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Notification;
