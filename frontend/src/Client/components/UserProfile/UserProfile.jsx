import React, { useState, useEffect, useRef } from 'react';
import { getCurrentUserSync, updateUserProfile, getUserProfile } from '../../../services/userService';
import { User, Settings, Crown, Gift, Star, Ticket, Calendar, CreditCard, Award, TrendingUp, Shield, Upload, X, Home, Info, Store, Gift as GiftIcon } from 'lucide-react';
import { getBalance } from '../../../services/virtualWalletService';
import { useTranslation } from 'react-i18next';

const UserProfile = ({ onClose, isPopup = false, onAvatarChange, initialOpenSettings = false }) => {
  const { t } = useTranslation();
  const [user, setUser] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const popupRef = useRef(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedAvatar, setUploadedAvatar] = useState(null);
  const fileInputRef = useRef(null);
  const [userSpending, setUserSpending] = useState({
    totalSpent: 0,
    totalPoints: 0
  });
  const [_walletBalance, setWalletBalance] = useState(0);

  useEffect(() => {
  }, [initialOpenSettings]);
  useEffect(() => {
    const onWalletUpdated = (e) => {
      if (e && e.detail && typeof e.detail.balance === 'number') {
        setWalletBalance(e.detail.balance);
      } else {
        setWalletBalance(getBalance());
      }
    };
    window.addEventListener('sandboxWalletUpdated', onWalletUpdated);
    setWalletBalance(getBalance());
    return () => window.removeEventListener('sandboxWalletUpdated', onWalletUpdated);
  }, []);
  
  const userStats = {
    totalMovies: 47,
    totalTickets: 89,
    memberSince: '2023-01-15',
    points: 1250,
    level: 'Gold',
    nextLevelPoints: 500
  };
  
  const benefits = [
  {
    key: 'home',
    icon: Home,
    title: t('Home'),
    color: '#3b82f6',
    description: t('Discover now-showing movies, cinema schedules, and book tickets easily.'),
    ctaText: t('View showtimes'),
    ctaHref: '/'
  },
  {
    key: 'member',
    icon: User,
    title: t('CGV Member'),
    color: '#3b82f6',
    description: t('Earn points, level up membership to receive exclusive offers and gifts.'),
    ctaText: t('Learn about membership tiers'),
    ctaHref: '/membership'
  },
  {
    key: 'cinemas',
    icon: Info,
    title: t('CGV Cinemas'),
    color: '#3b82f6',
    description: t('Find nearby cinemas, view details and available services.'),
    ctaText: t('Find cinemas'),
    ctaHref: '/#cinemas'
  },
  {
    key: 'special',
    icon: Star,
    title: t('Special Cinemas'),
    color: '#3b82f6',
    description: t('Experience IMAX, 4DX, GOLD CLASS and other premium formats.'),
    ctaText: t('Explore special cinemas'),
    ctaHref: '/#special'
  },
  {
    key: 'news',
    icon: Gift,
    title: t('News & Promotions'),
    color: '#3b82f6',
    description: t('Stay updated with movie news and daily exciting promotions.'),
    ctaText: t('View promotions'),
    ctaHref: '/news'
  },
  {
    key: 'tickets',
    icon: Ticket,
    title: t('My Tickets'),
    color: '#3b82f6',
    description: t('Manage purchased tickets, track transaction history, and access e-tickets.'),
    ctaText: t('View tickets'),
    ctaHref: '/tickets'
  },
  {
    key: 'store',
    icon: Store,
    title: t('CGV Store'),
    color: '#3b82f6',
    description: t('Buy popcorn, combo deals, and official merchandise.'),
    ctaText: t('Buy now'),
    ctaHref: '/#store'
  },
  {
    key: 'egift',
    icon: GiftIcon,
    title: t('CGV eGift'),
    color: '#3b82f6',
    isNew: true,
    description: t('Send movie gifts conveniently to loved ones via eGift.'),
    ctaText: t('Buy eGift'),
    ctaHref: '/egift'
  },
  {
    key: 'redeem',
    icon: Award,
    title: t('Redeem Offers'),
    color: '#3b82f6',
    description: t('Use accumulated points to redeem tickets, combos, and exciting gifts.'),
    ctaText: t('Redeem now'),
    ctaHref: '/#redeem'
  }
];
  

  useEffect(() => {
    loadUserProfile();
    calculateUserSpending();
  }, []);

  useEffect(() => {
    if (user) {
      calculateUserSpending();
    }
  }, [user]);

  // Changes in userTickets in localStorage
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'userTickets') {
        calculateUserSpending();
      }
    };
    
    const handleCustomEvent = (e) => {
      if (e.detail && e.detail.key === 'userTickets') {
        calculateUserSpending();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('userTicketsUpdated', handleCustomEvent);
    
    // Cleanup
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('userTicketsUpdated', handleCustomEvent);
    };
  }, []);

  const calculateUserSpending = () => {
    try {
      // Get current user
      const currentUser = getCurrentUserSync();
      if (!currentUser) {
        setUserSpending({
          totalSpent: 0,
          totalPoints: 0
        });
        return;
      }

      // Get tickets from localStorage
      const tickets = JSON.parse(localStorage.getItem('userTickets') || '[]');
      
      // Filter tickets belonging to current user
      const userTickets = tickets.filter(ticket =>
        ticket.userId === currentUser.id ||
        ticket.userId === currentUser.username ||
        ticket.userId === currentUser.email
      );
      
      // Total spent calculation
      const totalSpent = userTickets.reduce((sum, ticket) => {
        return sum + (ticket.price || 0);
      }, 0);
      
      // Calculate points (1 point per 1000 VND spent)
      const totalPoints = Math.floor(totalSpent / 1000);
      
      setUserSpending({
        totalSpent,
        totalPoints
      });
    } catch (error) {
      console.error('Error calculating user spending:', error);
      setUserSpending({
        totalSpent: 0,
        totalPoints: 0
      });
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  // Refresh spending data
  // eslint-disable-next-line no-unused-vars
  const refreshSpendingData = () => {
    calculateUserSpending();
  };

  // Notify parent (Header) about avatar/user changes with consistent signature
  React.useEffect(() => {
    if (onAvatarChange) {
      onAvatarChange(avatarUrl, user);
    }
  }, [onAvatarChange, avatarUrl, user]);

  // Handle popup animation
  useEffect(() => {
    if (isPopup && popupRef.current) {
      const timer = setTimeout(() => {
        if (popupRef.current) {
          popupRef.current.classList.add('show');
          console.log('Element classes after:', popupRef.current.className);
        }
      }, 10);
      return () => clearTimeout(timer);
    }
  }, [isPopup]);

  // Handle closing animation
  // eslint-disable-next-line no-unused-vars
  const handleClose = () => {
    if (popupRef.current) {
      popupRef.current.classList.add('closing');
      popupRef.current.classList.remove('show');
      setTimeout(() => {
        if (onClose) onClose();
      }, 300);
    } else {
      if (onClose) onClose();
    }
  };

  const loadUserProfile = async () => {
    const currentUser = getCurrentUserSync();
    if (currentUser) {
      setUser(currentUser);
      setEditedUser({ ...currentUser });
      
      console.log('Loading from localStorage - avatarUrl:', currentUser.avatarUrl, 'customAvatar:', currentUser.customAvatar);
      
      // Check customAvatar flag
      if (currentUser.customAvatar && currentUser.avatarUrl) {
        setAvatarUrl(currentUser.avatarUrl);
        setUploadedAvatar(currentUser.avatarUrl);
        console.log('Using custom avatar from localStorage:', currentUser.avatarUrl);
      } else if (currentUser.avatarUrl && (currentUser.avatarUrl.startsWith('data:') || currentUser.avatarUrl.startsWith('http'))) {
        setAvatarUrl(currentUser.avatarUrl);
        setUploadedAvatar(currentUser.avatarUrl);
        console.log('Using custom avatar (fallback) from localStorage:', currentUser.avatarUrl);
      } else {
        // Tạo initials giống Header
        const generateInitials = (name) => {
          if (!name) return 'U';
          const displayName = currentUser.fullName || currentUser.username;
          const words = displayName.trim().split(/\s+/);
          if (words.length >= 2) {
            return (words[0][0] + words[1][0]).toUpperCase();
          } else {
            return displayName.substring(0, 2).toUpperCase();
          }
        };
        const initials = generateInitials(currentUser.fullName || currentUser.username);
        setAvatarUrl(initials);
        setUploadedAvatar(null);
        console.log('Using initials from localStorage:', initials);
      }
      return;
    }

    try {
      const currentUser = await getUserProfile();
      if (currentUser) {
        setUser(currentUser);
        setEditedUser({ ...currentUser });

        if (currentUser.customAvatar && currentUser.avatarUrl) {
          setAvatarUrl(currentUser.avatarUrl);
          setUploadedAvatar(currentUser.avatarUrl);
          console.log('Using custom avatar from database:', currentUser.avatarUrl);
        } else if (currentUser.avatarUrl && (currentUser.avatarUrl.startsWith('data:') || currentUser.avatarUrl.startsWith('http'))) {
          setAvatarUrl(currentUser.avatarUrl);
          setUploadedAvatar(currentUser.avatarUrl);
        } else {
          const generateInitials = (name) => {
            if (!name) return 'U';
            const displayName = currentUser.fullName || currentUser.username;
            const words = displayName.trim().split(/\s+/);
            if (words.length >= 2) {
              return (words[0][0] + words[1][0]).toUpperCase();
            } else {
              return displayName.substring(0, 2).toUpperCase();
            }
          };
          const initials = generateInitials(currentUser.fullName || currentUser.username);
          setAvatarUrl(initials);
          setUploadedAvatar(null);
        }
      }
    } catch (error) {
      console.warn('Failed to load from database:', error);
    }
  };

  // eslint-disable-next-line no-unused-vars
  const generateNewAvatar = async () => {
    if (!user?.username) return;
    
    try {
      const generateInitials = (name) => {
        if (!name) return 'U';
        const displayName = user.fullName || user.username;
        const words = displayName.trim().split(/\s+/);
        if (words.length >= 2) {
          return (words[0][0] + words[1][0]).toUpperCase();
        } else {
          return displayName.substring(0, 2).toUpperCase();
        }
      };
      const initials = generateInitials(user.fullName || user.username);
      setAvatarUrl(initials);
      setUploadedAvatar(null);
      
      // Update localStorage
      const updatedUser = { ...user, avatarUrl: initials, customAvatar: false };
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      setUser(updatedUser);
      
      // Notify parent component
      if (onAvatarChange) {
        onAvatarChange(initials, updatedUser);
      }
    } catch (error) {
      console.error('Error generating avatar:', error);
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
  if (!file.type.startsWith('image/')) {
    alert(t('Please select a valid image file!'));
    return;
  }

  // Validate file size (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    alert(t('File size must not exceed 5MB!'));
    return;
  }

  setIsUploading(true);

  // Create preview URL
  const reader = new FileReader();
  reader.onload = (e) => {
    const imageUrl = e.target.result;
    setUploadedAvatar(imageUrl);
    setAvatarUrl(imageUrl);
    setIsUploading(false);

  // Update user data
  const updatedUser = { ...user, avatarUrl: imageUrl, customAvatar: true };
  localStorage.setItem('currentUser', JSON.stringify(updatedUser));
  setUser(updatedUser);

    // Notify parent component
    if (onAvatarChange) {
      onAvatarChange(imageUrl, updatedUser);
    }
  };

  reader.onerror = () => {
    alert(t('Error reading image file!'));
    setIsUploading(false);
  };

    
    reader.readAsDataURL(file);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const removeCustomAvatar = () => {
    setUploadedAvatar(null);
    
    // Create initials avatar again
    const generateInitials = (name) => {
      if (!name) return 'U';
      const displayName = user.fullName || user.username;
      const words = displayName.trim().split(/\s+/);
      if (words.length >= 2) {
        return (words[0][0] + words[1][0]).toUpperCase();
      } else {
        return displayName.substring(0, 2).toUpperCase();
      }
    };
    const initials = generateInitials(user.fullName || user.username);
    setAvatarUrl(initials);
    
    // Update localStorage
    const updatedUser = { ...user, avatarUrl: initials, customAvatar: false };
    localStorage.setItem('currentUser', JSON.stringify(updatedUser));
    setUser(updatedUser);

    if (onAvatarChange) {
      onAvatarChange(initials, updatedUser);
    }
  };

  const handleCloseClick = () => {
    if (isPopup) {
      if (popupRef.current) {
        popupRef.current.classList.add('closing');
        popupRef.current.classList.remove('show');
        setTimeout(() => {
          if (onClose) onClose();
        }, 300);
      }
    } else {
      if (onClose) onClose();
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedUser({ ...user });
  };

  const handleInputChange = (field, value) => {
    setEditedUser(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    if (!editedUser) return;
    
    // Validation
    if (!editedUser.username || editedUser.username.trim() === '') {
      alert(t('Username cannot be empty!'));
      return;
    }
    
    if (editedUser.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editedUser.email)) {
      alert(t('Invalid email address!'));
      return;
    }
    
    if (editedUser.phone && !/^[0-9]{10,11}$/.test(editedUser.phone.replace(/\s/g, ''))) {
      alert(t('Invalid phone number! (10–11 digits)'));
      return;
    }
    
    setIsSaving(true);
    try {
      const updateData = {
        username: editedUser.username.trim(),
        fullName: editedUser.fullName?.trim() || '',
        email: editedUser.email?.trim() || '',
        phone: editedUser.phone?.trim() || ''
      };
      
      // Update profile via service
      const updatedUser = await updateUserProfile(updateData);
      
      // Update localStorage
      setUser(updatedUser);
      setEditedUser(updatedUser);
      setIsEditing(false);
      alert(t('Profile updated successfully!'));
      
    } catch (error) {
      alert(t('Failed to update profile: ') + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  

  if (!user) {
    return (
      <div className="user-profile">
        <div className="profile-loading">
          <div className="loading-spinner"></div>
          <p>{t('Loading profile information...')}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={popupRef}
      className={`user-profile ${isPopup ? 'popup' : ''}`}
      onClick={isPopup ? (e) => {
        if (e.target === e.currentTarget) {
          handleCloseClick();
        }
      } : undefined}
    >
      <div>
        <div className="profile-header">
          <h2>{t('Personal profile')}</h2>
          <button className="exit-btn" onClick={handleCloseClick} title="Close">
            <X size={20} />
          </button>
        </div>

        <div className="profile-content">
        <div className="avatar-section">
          <div className="avatar-container">
            {avatarUrl ? (
              avatarUrl.startsWith('data:') || avatarUrl.startsWith('http') ? (
                <img
                  src={avatarUrl}
                  alt="Avatar"
                  className="profile-avatar"
                  onError={() => {
                    const generateInitials = (name) => {
                      if (!name) return 'U';
                      const displayName = user.fullName || user.username;
                      const words = displayName.trim().split(/\s+/);
                      if (words.length >= 2) {
                        return (words[0][0] + words[1][0]).toUpperCase();
                      } else {
                        return displayName.substring(0, 2).toUpperCase();
                      }
                    };
                    const initials = generateInitials(user.fullName || user.username);
                    setAvatarUrl(initials);
                  }}
                />
              ) : (
                <div className="profile-avatar-initials">
                  {avatarUrl}
                </div>
              )
            ) : (
              <div className="avatar-placeholder">
                <User size={60} />
              </div>
            )}
            
            {uploadedAvatar && (
              <div className="avatar-controls">
                <button
                  className="remove-avatar-btn"
                  onClick={removeCustomAvatar}
                  title={t("Remove custom avatar")}
                >
                  <X size={16} />
                </button>
              </div>
            )}
          </div>

          <div className="avatar-actions">
            <button
              className="upload-avatar-btn"
              onClick={handleUploadClick}
              disabled={isUploading}
            >
              <Upload size={16} />
              {isUploading ? t('Loading...') : t('Upload image')}
            </button>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
          </div>
        </div>

        {/* User Info */}
        <div className="user-info">
          <div className="user-badge">
            <h3 className="username">{user.fullName || user.username}</h3>
            <div className="member-badge">
              <Crown size={16} />
              <span>{userStats.level} MEMBER</span>
            </div>
          </div>
          
          <div className="user-details">
            <div className="detail-item">
              <label>{t('Username:')}</label>
              {isEditing ? (
                <input
                  type="text"
                  value={editedUser?.username || ''}
                  onChange={(e) => handleInputChange('username', e.target.value)}
                  className="edit-input"
                />
              ) : (
                <span>{user.username}</span>
              )}
            </div>
            
            <div className="detail-item">
              <label>{t('Full name:')}</label>
              {isEditing ? (
                <input
                  type="text"
                  value={editedUser?.fullName || ''}
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                  className="edit-input"
                />
              ) : (
                <span>{user.fullName || t('Not updated')}</span>
              )}
            </div>
            
            <div className="detail-item">
              <label>Email:</label>
              {isEditing ? (
                <input
                  type="email"
                  value={editedUser?.email || ''}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="edit-input"
                />
              ) : (
                <span>{user.email || t('Not updated')}</span>
              )}
            </div>
            
            <div className="detail-item">
              <label>{t('Phone number:')}</label>
              {isEditing ? (
                <input
                  type="tel"
                  value={editedUser?.phone || ''}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="edit-input"
                />
              ) : (
                <span>{user.phone || t('Not updated')}</span>
              )}
            </div>
            
            <div className="detail-item">
              <label>{t('Member since:')}</label>
              <span>{new Date(userStats.memberSince).toLocaleDateString('vi-VN')}</span>
            </div>
          </div>
        </div>

        {/* User Stats */}
        <div className="user-stats">
          <h4>{t('Account statistics')}</h4>
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-info">
                <span className="stat-label">{t('Total Spending 2025')}</span>
                <span className="stat-number">{formatCurrency(userSpending.totalSpent)}</span>
              </div>
            </div>
            
            <div className="stat-item">
              <div className="stat-info">
                <span className="stat-label">{t('Reward Points')}</span>
                <span className="stat-number">{userSpending.totalPoints}</span>
              </div>
            </div>
            
            <div className="stat-item">
              <div className="stat-info">
                <span className="stat-label">{t('Sandbox Wallet Balance')}</span>
                <span className="stat-number">{formatCurrency(_walletBalance)}</span>
              </div>
            </div>
          </div>
          
          <div className="level-progress">
            <div className="progress-info">
              <span>{t('Next level: {{points}} points', { points: userStats.nextLevelPoints })}</span>
              <span>{userStats.points}/{(userStats.points + userStats.nextLevelPoints)}</span>
            </div>
            <div className="progress-bar">
              <div
                className="progress-fill"
                data-width={`${(userStats.points / (userStats.points + userStats.nextLevelPoints)) * 100}%`}
              ></div>
            </div>
          </div>
        </div>

        {/* Benefits Section */}
        <div className="benefits-section">
          <h4>{t('Member benefits')}</h4>
          <div className="benefits-grid">
            {benefits.map((benefit, index) => (
              <a 
                key={benefit.key || index}
                className="benefit-card"
                href={benefit.ctaHref}
                onClick={() => { if (isPopup && onClose) onClose(); }}
              >
                <div className="benefit-icon-container">
                  <div 
                    className="benefit-icon" 
                    style={{ backgroundColor: benefit.color }}
                  >
                    <benefit.icon size={24} />
                  </div>
                  {benefit.isNew && (
                    <div className="new-badge">NEW</div>
                  )}
                </div>
                <div className="benefit-content">
                  <h5>{benefit.title}</h5>
                </div>
              </a>
            ))}
          </div>
          
        </div>

        

        {/* Action Buttons */}
        <div className="profile-actions">
          {!isEditing ? (
            <>
              <button className="action-btn edit-profile" onClick={handleEdit}>
                <Settings size={18} />
                <span>{t('Edit profile')}</span>
              </button>
              
            </>
          ) : (
            <div className="edit-actions">
              <button
                className="save-btn"
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? t('Saving...') : t('Save changes')}
              </button>
              
              <button
                className="cancel-btn"
                onClick={handleCancel}
                disabled={isSaving}
              >
                {t('Cancel')}
              </button>
            </div>
          )}
        </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
