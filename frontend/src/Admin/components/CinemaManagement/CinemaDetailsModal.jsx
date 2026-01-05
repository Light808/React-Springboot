import React from 'react';
import { X, MapPin, Phone, Mail, Clock, Users, Star, Globe, MessageCircle, Calendar, Film } from 'lucide-react';
import styles from './CinemaDetailsModal.module.css';
import { useTranslation } from 'react-i18next';

const CinemaDetailsModal = ({ cinema, onClose }) => {
  const { t } = useTranslation();
  if (!cinema) return null;

  const formatStatus = (status) => {
    const statusMap = {
      'ACTIVE': 'Hoạt động',
      'INACTIVE': 'Tạm dừng',
      'MAINTENANCE': 'Bảo trì'
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status) => {
    const colorMap = {
      'ACTIVE': '#10b981',
      'INACTIVE': '#f59e0b',
      'MAINTENANCE': '#ef4444'
    };
    return colorMap[status] || '#6b7280';
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h2>{t('Cinema Details')}</h2>
          <button onClick={onClose} className={styles.closeButton}>
            <X size={24} />
          </button>
        </div>

        <div className={styles.modalBody}>
          {/* Cinema Image and Basic Info */}
          <div className={styles.cinemaHeader}>
            <div className={styles.cinemaImage}>
              {cinema.imageUrl ? (
                <img 
                  src={cinema.imageUrl} 
                  alt={cinema.name}
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
              ) : null}
              <div 
                className={styles.placeholderImage}
                style={{ display: cinema.imageUrl ? 'none' : 'flex' }}
              >
                <MapPin size={60} />
              </div>
              <div 
                className={styles.statusBadge}
                style={{ backgroundColor: getStatusColor(cinema.status) }}
              >
                {formatStatus(cinema.status)}
              </div>
            </div>
            
            <div className={styles.cinemaInfo}>
              <h1 className={styles.cinemaName}>{cinema.name}</h1>
              <p className={styles.cinemaDescription}>{cinema.description}</p>
            </div>
          </div>

          {/* Basic Information */}
          <div className={styles.infoSection}>
            <h3>{t('Basic Information')}</h3>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <MapPin className={styles.infoIcon} size={20} />
                <div className={styles.infoContent}>
                  <span className={styles.infoLabel}>{t('Address')}</span>
                  <span className={styles.infoValue}>{cinema.address}</span>
                </div>
              </div>
              
              <div className={styles.infoItem}>
                <MapPin className={styles.infoIcon} size={20} />
                <div className={styles.infoContent}>
                  <span className={styles.infoLabel}>{t('City')}</span>
                  <span className={styles.infoValue}>{cinema.city}</span>
                </div>
              </div>
              
              {cinema.phone && (
                <div className={styles.infoItem}>
                  <Phone className={styles.infoIcon} size={20} />
                  <div className={styles.infoContent}>
                    <span className={styles.infoLabel}>{t('Phone')}</span>
                    <span className={styles.infoValue}>{cinema.phone}</span>
                  </div>
                </div>
              )}
              
              {cinema.email && (
                <div className={styles.infoItem}>
                  <Mail className={styles.infoIcon} size={20} />
                  <div className={styles.infoContent}>
                    <span className={styles.infoLabel}>{t('Email')}</span>
                    <span className={styles.infoValue}>{cinema.email}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Technical Information */}
          <div className={styles.infoSection}>
            <h3>{t('Technical Information')}</h3>
            <div className={styles.statsGrid}>
              <div className={styles.statItem}>
                <Users className={styles.statIcon} size={24} />
                <div className={styles.statContent}>
                  <span className={styles.statValue}>{cinema.totalSeats || 0}</span>
                  <span className={styles.statLabel}>{t('Total Seats')}</span>
                </div>
              </div>
              
              <div className={styles.statItem}>
                <Clock className={styles.statIcon} size={24} />
                <div className={styles.statContent}>
                  <span className={styles.statValue}>{cinema.totalRooms || 0}</span>
                  <span className={styles.statLabel}>{t('Total Rooms')}</span>
                </div>
              </div>
              
              <div className={styles.statItem}>
                <Film className={styles.statIcon} size={24} />
                <div className={styles.statContent}>
                  <span className={styles.statValue}>{cinema.movieIds?.length || 0}</span>
                  <span className={styles.statLabel}>{t('Total Movies')}</span>
                </div>
              </div>
            </div>
            
            {cinema.openingHours && (
              <div className={styles.infoItem}>
                <Clock className={styles.infoIcon} size={20} />
                <div className={styles.infoContent}>
                  <span className={styles.infoLabel}>{t('Opening Hours')}</span>
                  <span className={styles.infoValue}>{cinema.openingHours}</span>
                </div>
              </div>
            )}
          </div>

          {/* Facilities */}
          {cinema.facilities && cinema.facilities.length > 0 && (
            <div className={styles.infoSection}>
              <h3>{t('Facilities')}</h3>
              <div className={styles.facilitiesList}>
                {cinema.facilities.map((facility, index) => (
                  <span key={index} className={styles.facilityTag}>
                    {facility}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Links */}
          {(cinema.website || cinema.socialMedia) && (
            <div className={styles.infoSection}>
              <h3>{t('Links')}</h3>
              <div className={styles.linksList}>
                {cinema.website && (
                  <a 
                    href={cinema.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className={styles.linkItem}
                  >
                    <Globe size={20} />
                    <span>{t('Website')}</span>
                  </a>
                )}
                
                {cinema.socialMedia && (
                  <div className={styles.linkItem}>
                    <MessageCircle size={20} />
                    <span>{cinema.socialMedia}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Movies List */}
          {cinema.movieIds && cinema.movieIds.length > 0 && (
            <div className={styles.infoSection}>
              <h3>{t('Movies')}</h3>
              <div className={styles.moviesList}>
                {cinema.movieIds.map((movieId, index) => (
                  <div key={index} className={styles.movieItem}>
                    <Film size={16} />
                    <span>{t('Movie ID')}: {movieId}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className={styles.modalFooter}>
          <button onClick={onClose} className={styles.closeModalButton}>
            {t('Close')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CinemaDetailsModal;
