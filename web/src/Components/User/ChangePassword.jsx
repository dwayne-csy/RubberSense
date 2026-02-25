import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import UserHeader from '../layouts/UserHeader.jsx';
import UserFooter from '../layouts/UserFooter.jsx';

const ChangePassword = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4001';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('You must be logged in');

      const response = await axios.put(
        `${API_BASE_URL}/api/v1/users/change-password`,
        { currentPassword, newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setMessage(response.data.message || 'Password changed successfully');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => navigate('/profile'), 2000);
      } else {
        setError(response.data.message || 'Failed to change password');
      }
    } catch (err) {
      console.error('Change password error:', err);
      setError(err.response?.data?.message || err.message || 'Server error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <UserHeader />
      <div style={styles.container}>
        <div style={styles.contentWrapper}>
          {/* Header */}
          <div style={styles.header}>
            <div style={styles.leafDecor1}>🌿</div>
            <div style={styles.leafDecor2}>🌿</div>
            <h1 style={styles.title}>Change Password</h1>
            <p style={styles.subtitle}>Update your account credentials</p>
            <Link to="/profile" style={styles.backLink}>← Back to Profile</Link>
          </div>

          {/* Alert Messages */}
          {error && (
            <div style={styles.errorAlert}>
              <span>⚠️ {error}</span>
            </div>
          )}

          {message && (
            <div style={styles.successAlert}>
              <span>✓ {message}</span>
            </div>
          )}

          {/* Form Card */}
          <div style={styles.formCard}>
            {/* Security Tips */}
            <div style={styles.tipsBox}>
              <h3 style={styles.tipsTitle}>💡 Security Tips</h3>
              <ul style={styles.tipsList}>
                <li>Use at least 6 characters</li>
                <li>Mix uppercase and lowercase letters</li>
                <li>Include numbers and special characters</li>
                <li>Avoid common words or patterns</li>
              </ul>
            </div>

            {/* Password Form */}
            <form onSubmit={handleSubmit}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Current Password *</label>
                <div style={styles.passwordWrapper}>
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    placeholder="Enter your current password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    style={styles.input}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    style={styles.toggleButton}
                  >
                    {showCurrentPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>New Password *</label>
                <div style={styles.passwordWrapper}>
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    placeholder="Enter your new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    style={styles.input}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    style={styles.toggleButton}
                  >
                    {showNewPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
                {newPassword && newPassword.length < 6 && (
                  <span style={styles.validationError}>
                    Password must be at least 6 characters
                  </span>
                )}
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Confirm New Password *</label>
                <div style={styles.passwordWrapper}>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm your new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    style={styles.input}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={styles.toggleButton}
                  >
                    {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
                {confirmPassword && newPassword !== confirmPassword && (
                  <span style={styles.validationError}>
                    Passwords do not match
                  </span>
                )}
                {confirmPassword && newPassword === confirmPassword && (
                  <span style={styles.validationSuccess}>
                    ✓ Passwords match
                  </span>
                )}
              </div>

              {/* Action Buttons */}
              <div style={styles.buttonGroup}>
                <button
                  type="submit"
                  disabled={loading}
                  style={loading ? styles.submitButtonDisabled : styles.submitButton}
                >
                  {loading ? 'Changing Password...' : 'Change Password'}
                </button>
                <Link to="/profile" style={styles.cancelButton}>
                  Cancel
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>

      <UserFooter />
    </>
  );
};

const styles = {
  container: {
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    minHeight: '100vh',
    backgroundColor: '#ffffff',
    padding: '40px 20px',
  },
  contentWrapper: {
    maxWidth: '700px',
    margin: '0 auto',
  },
  header: {
    textAlign: 'center',
    marginBottom: '40px',
    position: 'relative',
    padding: '20px',
  },
  leafDecor1: {
    position: 'absolute',
    top: '0',
    left: '10%',
    fontSize: '40px',
    opacity: '0.2',
  },
  leafDecor2: {
    position: 'absolute',
    top: '0',
    right: '10%',
    fontSize: '40px',
    opacity: '0.2',
  },
  title: {
    fontSize: '2.5rem',
    fontWeight: '700',
    color: '#228B22',
    margin: '0 0 10px 0',
  },
  subtitle: {
    fontSize: '1rem',
    color: '#666',
    margin: '0 0 15px 0',
  },
  backLink: {
    display: 'inline-block',
    color: '#228B22',
    textDecoration: 'none',
    fontSize: '0.95rem',
    fontWeight: '500',
  },
  errorAlert: {
    padding: '15px 20px',
    backgroundColor: '#fee',
    color: '#c00',
    borderRadius: '6px',
    border: '1px solid #fcc',
    marginBottom: '20px',
    textAlign: 'center',
  },
  successAlert: {
    padding: '15px 20px',
    backgroundColor: '#efe',
    color: '#0a0',
    borderRadius: '6px',
    border: '1px solid #cfc',
    marginBottom: '20px',
    textAlign: 'center',
  },
  formCard: {
    backgroundColor: '#ffffff',
    border: '2px solid #228B22',
    borderRadius: '12px',
    padding: '40px',
    boxShadow: '0 2px 8px rgba(34, 139, 34, 0.1)',
  },
  tipsBox: {
    backgroundColor: '#f9fff9',
    padding: '20px',
    borderRadius: '8px',
    border: '1px solid #228B22',
    borderLeft: '4px solid #228B22',
    marginBottom: '30px',
  },
  tipsTitle: {
    fontSize: '1.1rem',
    fontWeight: '600',
    color: '#228B22',
    margin: '0 0 12px 0',
  },
  tipsList: {
    margin: '0',
    paddingLeft: '20px',
    fontSize: '0.9rem',
    color: '#555',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    marginBottom: '20px',
  },
  label: {
    fontSize: '0.95rem',
    fontWeight: '600',
    color: '#333',
    marginBottom: '8px',
  },
  passwordWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    padding: '12px 45px 12px 15px',
    fontSize: '1rem',
    border: '1px solid #ddd',
    borderRadius: '6px',
    outline: 'none',
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
  },
  toggleButton: {
    position: 'absolute',
    right: '12px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '18px',
    padding: '5px',
  },
  validationError: {
    marginTop: '5px',
    fontSize: '0.85rem',
    color: '#c00',
  },
  validationSuccess: {
    marginTop: '5px',
    fontSize: '0.85rem',
    color: '#228B22',
  },
  buttonGroup: {
    display: 'flex',
    gap: '15px',
    marginTop: '30px',
    paddingTop: '30px',
    borderTop: '1px solid #e0e0e0',
    flexWrap: 'wrap',
  },
  submitButton: {
    flex: '1',
    minWidth: '150px',
    padding: '12px 24px',
    backgroundColor: '#228B22',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
  },
  submitButtonDisabled: {
    flex: '1',
    minWidth: '150px',
    padding: '12px 24px',
    backgroundColor: '#999',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'not-allowed',
  },
  cancelButton: {
    flex: '1',
    minWidth: '150px',
    padding: '12px 24px',
    backgroundColor: '#ffffff',
    color: '#228B22',
    border: '2px solid #228B22',
    borderRadius: '6px',
    fontSize: '1rem',
    fontWeight: '600',
    textDecoration: 'none',
    textAlign: 'center',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
};

export default ChangePassword;