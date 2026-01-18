import React, { useState, useEffect } from 'react';
import { X, Settings, Camera } from 'lucide-react';
import { changePassword, getCurrentUserSync } from '../../../services/userService';
import { checkFaceRegistered, deleteFaceDescriptor } from '../../../services/faceService';
import FaceIDRegistration from '../FaceIDRegistration/FaceIDRegistration';
import './UserProfile.css';
import { useTranslation } from 'react-i18next';

const UserSettingsModal = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const [pwdForm, setPwdForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [changingPwd, setChangingPwd] = useState(false);
  const [pwdError, setPwdError] = useState('');
  const [pwdSuccess, setPwdSuccess] = useState('');
  const [faceIDEnabled, setFaceIDEnabled] = useState(false);
  const [loadingFaceID, setLoadingFaceID] = useState(false);
  const [showFaceIDRegistration, setShowFaceIDRegistration] = useState(false);
  const [faceIDError, setFaceIDError] = useState('');
  const [faceIDSuccess, setFaceIDSuccess] = useState('');

  // Check Face ID status when modal opens
  useEffect(() => {
    if (isOpen) {
      checkFaceIDStatus();
    }
  }, [isOpen]);

  const checkFaceIDStatus = async () => {
    try {
      const user = getCurrentUserSync();
      if (user && user.id) {
        const hasFace = await checkFaceRegistered(user.id);
        setFaceIDEnabled(hasFace);
      }
    } catch (error) {
      console.error('Error checking Face ID status:', error);
    }
  };

  const handleFaceIDToggle = async (enabled) => {
    const user = getCurrentUserSync();
    if (!user || !user.id) {
      setFaceIDError('User not found');
      return;
    }

    setLoadingFaceID(true);
    setFaceIDError('');
    setFaceIDSuccess('');

    try {
      if (enabled) {
        // Enable Face ID - show registration modal
        setShowFaceIDRegistration(true);
      } else {
        // Disable Face ID - delete face descriptor
        await deleteFaceDescriptor(user.id);
        setFaceIDEnabled(false);
        setFaceIDSuccess('Face ID đã được tắt thành công');
        setTimeout(() => setFaceIDSuccess(''), 3000);
      }
    } catch (error) {
      setFaceIDError(error.message || 'Có lỗi xảy ra');
      setTimeout(() => setFaceIDError(''), 3000);
    } finally {
      setLoadingFaceID(false);
    }
  };

  const handleFaceIDRegistrationSuccess = () => {
    setShowFaceIDRegistration(false);
    setFaceIDEnabled(true);
    setFaceIDSuccess('Face ID đã được bật thành công');
    setTimeout(() => setFaceIDSuccess(''), 3000);
  };

  if (!isOpen) return null;

  // Show Face ID Registration modal
  if (showFaceIDRegistration) {
    const user = getCurrentUserSync();
    return (
      <FaceIDRegistration
        userId={user?.id}
        onSuccess={handleFaceIDRegistrationSuccess}
        onCancel={() => {
          setShowFaceIDRegistration(false);
        }}
      />
    );
  }

  const validate = () => {
    setPwdError('');
    setPwdSuccess('');
    if (!pwdForm.currentPassword || !pwdForm.newPassword || !pwdForm.confirmPassword) {
      setPwdError(t('Vui lòng nhập đầy đủ các trường.'));
      return false;
    }
    if (pwdForm.newPassword.length < 6) {
      setPwdError(t('Mật khẩu mới phải có ít nhất 6 ký tự.'));
      return false;
    }
    if (pwdForm.newPassword === pwdForm.currentPassword) {
      setPwdError(t('Mật khẩu mới không được trùng với mật khẩu hiện tại.'));
      return false;
    }
    if (pwdForm.newPassword !== pwdForm.confirmPassword) {
      setPwdError(t('Xác nhận mật khẩu không khớp.'));
      return false;
    }
    return true;
  };

const handleSubmit = async (e) => {
  e.preventDefault();
  if (!validate()) return;
  try {
    setChangingPwd(true);
    await changePassword({
      currentPassword: pwdForm.currentPassword,
      newPassword: pwdForm.newPassword
    });
    setPwdSuccess(t('Đổi mật khẩu thành công.'));
    setPwdForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
  } catch (err) {
    setPwdError(err.message || t('Đổi mật khẩu thất bại.'));
  } finally {
    setChangingPwd(false);
  }
};

return (
  <div
    className="user-profile popup show"
    onClick={(e) => {
      if (e.target === e.currentTarget && onClose) onClose();
    }}
  >
    <div>
      <div className="profile-header">
        <h2>{t('Cài đặt tài khoản')}</h2>
        <button className="close-btn" onClick={onClose} title={t('Đóng')}>
          <X size={20} />
        </button>
      </div>

      <div className="profile-content">
        {/* Face ID Settings */}
        <div className="settings-section">
          <div className="settings-header" style={{ cursor: 'default' }}>
            <div className="settings-title">
              <Camera size={18} />
              <h4>Face ID</h4>
            </div>
          </div>
          <div className="settings-content">
            <div className="face-id-settings-card">
              <div className="face-id-toggle-row">
                <div className="face-id-info">
                  <label>Bật/Tắt Face ID</label>
                  <p className="face-id-description">
                    {faceIDEnabled 
                      ? 'Face ID đang được bật. Bạn có thể đăng nhập bằng khuôn mặt.'
                      : 'Face ID đang được tắt. Bật để đăng nhập nhanh hơn bằng khuôn mặt.'}
                  </p>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={faceIDEnabled}
                    onChange={(e) => handleFaceIDToggle(e.target.checked)}
                    disabled={loadingFaceID}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
              {faceIDError && <div className="form-error">{faceIDError}</div>}
              {faceIDSuccess && <div className="form-success">{faceIDSuccess}</div>}
            </div>
          </div>
        </div>

        {/* Change Password Settings */}
        <div className="settings-section">
          <div className="settings-header" style={{ cursor: 'default' }}>
            <div className="settings-title">
              <Settings size={18} />
              <h4>{t('Đổi mật khẩu')}</h4>
            </div>
          </div>
          <div className="settings-content">
            <div className="change-password-card">
              <form className="change-password-form" onSubmit={handleSubmit}>
                <div className="form-row">
                  <label>{t('Mật khẩu hiện tại')}</label>
                  <input
                    type="password"
                    value={pwdForm.currentPassword}
                    onChange={(e) =>
                      setPwdForm({ ...pwdForm, currentPassword: e.target.value })
                    }
                    placeholder={t('Nhập mật khẩu hiện tại')}
                  />
                </div>
                <div className="form-row">
                  <label>{t('Mật khẩu mới')}</label>
                  <input
                    type="password"
                    value={pwdForm.newPassword}
                    onChange={(e) =>
                      setPwdForm({ ...pwdForm, newPassword: e.target.value })
                    }
                    placeholder={t('Ít nhất 6 ký tự')}
                  />
                </div>
                <div className="form-row">
                  <label>{t('Xác nhận mật khẩu mới')}</label>
                    <input type="password" value={pwdForm.confirmPassword} onChange={(e) => setPwdForm({ ...pwdForm, confirmPassword: e.target.value })} placeholder="Nhập lại mật khẩu mới" />
                  </div>
                  {pwdError && <div className="form-error">{pwdError}</div>}
                  {pwdSuccess && <div className="form-success">{pwdSuccess}</div>}
                  <div className="form-actions">
                    <button type="submit" className="save-btn" disabled={changingPwd}>{changingPwd ? 'Đang đổi...' : 'Đổi mật khẩu'}</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserSettingsModal;


