import React, { useState } from 'react';
import { X, Settings } from 'lucide-react';
import { changePassword } from '../../../services/userService';
import './UserProfile.css';
import { useTranslation } from 'react-i18next';

const UserSettingsModal = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const [pwdForm, setPwdForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [changingPwd, setChangingPwd] = useState(false);
  const [pwdError, setPwdError] = useState('');
  const [pwdSuccess, setPwdSuccess] = useState('');

  if (!isOpen) return null;

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


