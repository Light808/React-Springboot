/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import { registerUser, loginUser, loginWithGoogle, handleGoogleLoginSuccess } from '../../../services/userService';
import { initializeGoogleAuth } from '../../../services/googleAuthService';
import { loginWithFacebook } from '../../../services/facebookAuthService';
import { adminLogin } from '../../../services/adminService';
import { checkFaceRegistered } from '../../../services/faceService';
import FaceIDLogin from '../FaceIDLogin/FaceIDLogin';
import FaceIDRegistration from '../FaceIDRegistration/FaceIDRegistration';
import { Eye, EyeOff, X, AlertCircle, CheckCircle, Shield, Camera } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './LoginModal.css';
import { useTranslation } from "react-i18next";

const LoginModal = ({ isOpen, onClose, onLogin }) => {
  const { t } = useTranslation();

  const [formData, setFormData] = useState({
    username: '',
    password: '',
    email: '',
    fullName: '',
    phone: '',
    confirmPassword: '',
    adminKey: ''
  });
  
  const [errors, setErrors] = useState({});
  const [isRegister, setIsRegister] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showAdminKey, setShowAdminKey] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [googleButtonRendered, setGoogleButtonRendered] = useState(false);
  const [showFaceIDLogin, setShowFaceIDLogin] = useState(false);
  const [showFaceIDRegistration, setShowFaceIDRegistration] = useState(false);
  const [hasFaceID, setHasFaceID] = useState(false);
  const navigate = useNavigate();

  // Initialize Google Auth when modal opens
  useEffect(() => {
    if (isOpen && !isAdmin) {
      const initGoogleButton = async () => {
        try {
          await initializeGoogleAuth();
          setGoogleButtonRendered(true);
        } catch (error) {
          console.error('Failed to initialize Google Auth:', error);
          setGoogleButtonRendered(false);
        }
      };
      initGoogleButton();
    } else {
      setGoogleButtonRendered(false);
    }
  }, [isOpen, isAdmin]);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setFormData({
        username: '',
        password: '',
        email: '',
        fullName: '',
        phone: '',
        confirmPassword: '',
        adminKey: ''
      });
      setErrors({});
      setMessage({ type: '', text: '' });
      setIsRegister(false);
      setIsAdmin(false);
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (isRegister) {
      if (!formData.fullName.trim()) {
        newErrors.fullName = t('Full name is required');
      } else if (formData.fullName.trim().length < 2) {
        newErrors.fullName = t('Full name must at least have 2 characters long');
      }

      if (!formData.email.trim()) {
        newErrors.email = t('Email is required');
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = t('Email is not valid');
      }

      if (!formData.phone.trim()) {
        newErrors.phone = t('Phone number is required');
      } else if (!/^[0-9]{10,11}$/.test(formData.phone.replace(/\s/g, ''))) {
        newErrors.phone = t('Phone number is not valid');
      }
    }

    if (!formData.username.trim()) {
      newErrors.username = t('Username is required');
    } else if (formData.username.trim().length < 3) {
      newErrors.username = t('Username must be at least 3 characters long');
    }

    if (!formData.password) {
      newErrors.password = t('Password is required');
    } else if (formData.password.length < 6) {
      newErrors.password = t('Password must be at least 6 characters long');
    }

    if (isRegister && formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = t('Confirm password does not match');
    }

    if (isAdmin && !formData.adminKey.trim()) {
      newErrors.adminKey = t('Admin key is required');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setMessage({ type: '', text: '' });

    try {
      if (isAdmin) {
        const adminCredentials = {
          username: formData.username,
          password: formData.password,
          adminKey: formData.adminKey
        };
        const result = await adminLogin(adminCredentials);
        
        // Delete user info from localStorage when admin logs in
        localStorage.removeItem('currentUser');
        localStorage.removeItem('authToken');
        
        setMessage({
          type: 'success',
          text: 'Admin login successful!'
        });

        setTimeout(() => {
          onClose();
          navigate('/admin/dashboard');
        }, 1000);
      } else if (isRegister) {
        await registerUser({
          username: formData.username,
          password: formData.password,
          email: formData.email,
          fullName: formData.fullName,
          phone: formData.phone
        });
        
        setMessage({
          type: 'success',
          text: 'Sign up successful! Please login to your account.'
        });
        
        setFormData({
          username: '',
          password: '',
          email: '',
          fullName: '',
          phone: '',
          confirmPassword: ''
        });
        
        setTimeout(() => {
          setIsRegister(false);
          setMessage({ type: '', text: '' });
        }, 2000);
        
      } else {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        
        const user = await loginUser({
          username: formData.username,
          password: formData.password
        });
        
        if (user && user.id) {
          setMessage({
            type: 'success',
            text: 'Login successful!'
          });
          
          if (onLogin) onLogin(user);
          
          // Check if user has Face ID registered (after login success)
          try {
            const hasFace = await checkFaceRegistered(user.id);
            setHasFaceID(hasFace);
            
            if (!hasFace) {
              const registerFace = window.confirm('Would you like to register Face ID for faster login next time?');
              if (registerFace) {
                setShowFaceIDRegistration(true);
                return; 
              }
              // If user declined, close modal and navigate
              setTimeout(() => {
                onClose();
                navigate('/');
              }, 1000);
              return; 
            }
          } catch (error) {
            console.warn('Could not check Face ID status:', error);
          }
          
          setTimeout(() => {
            onClose();
            navigate('/');
          }, 1000);
        } else {
          setMessage({
            type: 'error',
            text: 'Wrong username or password'
          });
        }
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.message || (isRegister ? 'Sign up failed! Please try again.' : 'Login failed! Please try again.')
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setIsRegister(!isRegister);
    setFormData({
      username: '',
      password: '',
      email: '',
      fullName: '',
      phone: '',
      confirmPassword: ''
    });
    setErrors({});
    setMessage({ type: '', text: '' });
  };

  const toggleAdmin = () => {
    setIsAdmin(!isAdmin);
    setFormData({
      username: '',
      password: '',
      email: '',
      fullName: '',
      phone: '',
      confirmPassword: '',
      adminKey: ''
    });
    setErrors({});
    setMessage({ type: '', text: '' });
    setIsRegister(false);
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setMessage({ type: '', text: '' });

    try {
      // Set up callback before rendering button
      const user = await loginWithGoogle();
      
      if (user && user.id) {
        await handleGoogleLoginSuccess(user);
        
        setMessage({
          type: 'success',
          text: t('googleLoginSuccess')
        });
        
        if (onLogin) onLogin(user);
        
        setTimeout(() => {
          onClose();
          navigate('/');
        }, 1000);
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.message || t('googleLoginFailed')
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Render Google button when container is ready
  useEffect(() => {
    if (isOpen && !isAdmin && googleButtonRendered) {
      const setupGoogleCallback = () => {
        return new Promise((resolve, reject) => {
          window.googleAuthCallback = { resolve, reject };
        });
      };

      const containerId = 'google-signin-button';
      const container = document.getElementById(containerId);
      if (container && window.google && window.google.accounts) {
        try {
          container.innerHTML = ''; 
          
          // Setup callback promise
          const loginPromise = setupGoogleCallback();
          
          // Handle the promise
          loginPromise.then(async (user) => {
            if (user && user.id) {
              setIsLoading(true);
              try {
                await handleGoogleLoginSuccess(user);
                setMessage({
                  type: 'success',
                  text: t('googleLoginSuccess')
                });
                if (onLogin) onLogin(user);
                setTimeout(() => {
                  onClose();
                  navigate('/');
                }, 1000);
              } catch (error) {
                setMessage({
                  type: 'error',
                  text: error.message || t('googleLoginFailed')
                });
              } finally {
                setIsLoading(false);
              }
            }
          }).catch((error) => {
            if (error.message !== 'Google Sign-In timeout. Please try again.') {
              setMessage({
                type: 'error',
                text: error.message || t('googleLoginFailed')
              });
            }
          });
          
          // Render button
          window.google.accounts.id.renderButton(
            container,
            {
              theme: 'outline',
              size: 'large',
              text: 'signin_with',
              shape: 'rectangular',
              logo_alignment: 'left',
              width: '100%'
            }
          );
        } catch (error) {
          console.error('Error rendering Google button:', error);
          setMessage({
            type: 'error',
            text: 'Failed to load Google Sign-In button'
          });
        }
      }
    }
  }, [isOpen, isAdmin, googleButtonRendered, onLogin, onClose, navigate, t]);

  const handleFacebookLogin = async () => {
    setIsLoading(true);
    setMessage({ type: '', text: '' });

    try {
      await loginWithFacebook();
      
      setMessage({
        type: 'success',
        text: t('facebookLoginSuccess')
      });
      
      setTimeout(() => {
        onClose();
        navigate('/');
      }, 1000);
    } catch (error) {
      setMessage({
        type: 'error',
        text: t('facebookLoginFailed')
      });
    } finally {
      setIsLoading(false);
    }
  };


  // Handle Face ID login success
  const handleFaceIDLoginSuccess = async (user) => {
    try {
      // Save user data to localStorage first (similar to password login)
      if (user && user.id) {
        localStorage.setItem('authToken', 'user-token-' + user.id);
        localStorage.setItem('currentUser', JSON.stringify(user));
      }
      
      await handleGoogleLoginSuccess(user);
      setMessage({
        type: 'success',
        text: 'Face ID login successful!'
      });
      
      if (onLogin) onLogin(user);
      
      setTimeout(() => {
        setShowFaceIDLogin(false);
        onClose();
        navigate('/');
      }, 1000);
    } catch (error) {
      console.error('Error handling Face ID login:', error);
    }
  };

  // Handle Face ID registration success
  const handleFaceIDRegistrationSuccess = () => {
    setShowFaceIDRegistration(false);
    setHasFaceID(true);
    setMessage({
      type: 'success',
      text: 'Face ID registered successfully! You can use Face ID to login next time.'
    });
    
    setTimeout(() => {
      onClose();
      navigate('/');
    }, 2000);
  };

  // Check if user has Face ID when username changes
  useEffect(() => {
    const checkUserFaceID = async () => {
      if (formData.username && !isRegister && !isAdmin) {
        try {
          // We need to check after login, not before
        } catch (error) {
          // Ignore
        }
      }
    };
    
    // Don't check on every username change, only after successful login
  }, [formData.username, isRegister, isAdmin]);

  if (!isOpen) return null;

  // Show Face ID Login modal
  if (showFaceIDLogin) {
    return (
      <FaceIDLogin
        onSuccess={handleFaceIDLoginSuccess}
        onCancel={() => setShowFaceIDLogin(false)}
        onSwitchToPassword={() => setShowFaceIDLogin(false)}
      />
    );
  }

  // Show Face ID Registration modal
  if (showFaceIDRegistration) {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    console.log('Showing Face ID Registration for user:', currentUser);
    
    if (!currentUser || !currentUser.id) {
      console.error('No user ID found for Face ID registration');
      setMessage({ type: 'error', text: 'User not found. Please login again.' });
      setShowFaceIDRegistration(false);
      return null;
    }
    
    console.log('Rendering FaceIDRegistration with userId:', currentUser.id);
    return (
      <FaceIDRegistration
        userId={currentUser.id}
        onSuccess={handleFaceIDRegistrationSuccess}
        onCancel={() => {
          setShowFaceIDRegistration(false);
          onClose();
          navigate('/');
        }}
      />
    );
  }

  return (
    <div className="login-modal-overlay" onClick={onClose}>
      <div className="login-modal" onClick={(e) => e.stopPropagation()}>
        <div className="login-modal-header">
          <h2>{isAdmin ? 'Admin Panel' : t('User Account')}</h2>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Admin Toggle */}
        <div className="admin-toggle-container">
          <button
            type="button"
            className={`admin-toggle-btn ${isAdmin ? 'active' : ''}`}
            onClick={toggleAdmin}
          >
            <Shield size={16} />
            <span>{isAdmin ? 'Admin Mode' : 'User Mode'}</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label className="form-label">{t('Username')}</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              className={`form-input ${errors.username ? 'error' : ''}`}
              placeholder={t('Enter username')}
            />
            {errors.username && (
              <span className="message-error">{errors.username}</span>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">{t('Password')}</label>
            <div className="password-input">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className={`form-input ${errors.password ? 'error' : ''}`}
                placeholder={t('Enter password')}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && (
              <span className="message-error">{errors.password}</span>
            )}
          </div>

          {isRegister && !isAdmin ? (
            <>
              <div className="form-group">
                <label className="form-label">{t('Full name')}</label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  className={`form-input ${errors.fullName ? 'error' : ''}`}
                  placeholder={t('Enter your full name')}
                />
                {errors.fullName && (
                  <span className="message-error">{errors.fullName}</span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`form-input ${errors.email ? 'error' : ''}`}
                  placeholder="example@email.com"
                />
                {errors.email && (
                  <span className="message-error">{errors.email}</span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">{t('Phone number')}</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className={`form-input ${errors.phone ? 'error' : ''}`}
                  placeholder="0123456789"
                />
                {errors.phone && (
                  <span className="message-error">{errors.phone}</span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">{t('Confirm password')}</label>
                <div className="password-input">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className={`form-input ${errors.confirmPassword ? 'error' : ''}`}
                    placeholder={t('Re-enter your password')}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <span className="message-error">{errors.confirmPassword}</span>
                )}
              </div>
            </>
          ) : null}

          {isAdmin && (
            <div className="form-group">
              <label className="form-label">Admin Key</label>
              <div className="password-input">
                <input
                  type={showAdminKey ? 'text' : 'password'}
                  name="adminKey"
                  value={formData.adminKey}
                  onChange={handleInputChange}
                  className={`form-input ${errors.adminKey ? 'error' : ''}`}
                  placeholder={t('Enter admin key to login')}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowAdminKey(!showAdminKey)}
                >
                  {showAdminKey ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.adminKey && (
                <span className="message-error">{errors.adminKey}</span>
              )}
            </div>
          )}

          {!isRegister && !isAdmin && (
            <>
              <div className="forgot-password">
                <a href="/forgot-password" className="forgot-link" onClick={(e) => { e.preventDefault(); onClose(); navigate('/forgot-password'); }}>{t('Forgot password')}?</a>
              </div>
              <button
                type="button"
                className="face-id-login-btn"
                onClick={() => setShowFaceIDLogin(true)}
                disabled={isLoading}
              >
                Login with Face ID
              </button>
            </>
          )}

          {message.text && (
            <div className={`message ${message.type}`}>
              {message.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
              <span>{message.text}</span>
            </div>
          )}

          <button
            type="submit"
            className="login-btn"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="loading-spinner"></div>
            ) : (
              isRegister ? t('Sign up') : t('Login')
            )}
          </button>
        </form>

        {/* Google Login Button - Only show for user login/register */}
        {!isAdmin && (
          <div className="google-login-container">
            <div className="divider">
              <span className="divider-text">{t('Or')}</span>
            </div>
            {googleButtonRendered && window.google && window.google.accounts ? (
              <div id="google-signin-button" style={{ width: '100%', display: 'flex', justifyContent: 'center' }}></div>
            ) : (
              <button
                type="button"
                className="google-login-btn"
                onClick={handleGoogleLogin}
                disabled={isLoading}
              >
                <svg className="google-icon" viewBox="0 0 24 24" width="20" height="20">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                {t('loginWithGoogle')}
              </button>
            )}
            
            {/* Facebook Login Button */}
            <button
              type="button"
              className="facebook-login-btn"
              onClick={handleFacebookLogin}
              disabled={isLoading}
            >
              <svg className="facebook-icon" viewBox="0 0 24 24" width="20" height="20" fill="#1877F2">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              {t('loginWithFacebook')}
            </button>
          </div>
        )}

        {!isAdmin && (
          <div className="login-footer">
            <button
              type="button"
              className="toggle-mode-btn"
              onClick={toggleMode}
            >
              {isRegister 
                ? t("Already have an account? Login now")
                : t("Don't have an account? Sign up now!")
              }
            </button>
          </div>
        )}

        {isAdmin && (
          <div className="admin-info">
            <p className="admin-credentials">
              <strong>{t('Admin login information')}:</strong><br />
              {t('You need an admin account and admin key to log in')}.<br />
              {t('Admin accounts are issued by the system administrator')}.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginModal;
