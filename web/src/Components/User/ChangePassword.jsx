import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const ChangePassword = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
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
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', padding: '20px' }}>
      <div style={{ width: '100%', maxWidth: '400px', textAlign: 'center', border: '1px solid #ddd', borderRadius: '12px', padding: '30px' }}>
        <h2>Change Password</h2>
        {message && <p style={{ color: 'green' }}>{message}</p>}
        {error && <p style={{ color: 'red' }}>{error}</p>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
          <input
            type="password"
            placeholder="Current Password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
            style={{ padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }}
          />
          <input
            type="password"
            placeholder="New Password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            style={{ padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }}
          />
          <input
            type="password"
            placeholder="Confirm New Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            style={{ padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }}
          />
          <button
            type="submit"
            disabled={loading}
            style={{ padding: '10px', borderRadius: '8px', border: 'none', backgroundColor: '#007bff', color: 'white', cursor: loading ? 'not-allowed' : 'pointer' }}
          >
            {loading ? 'Changing...' : 'Change Password'}
          </button>
        </form>

        <div style={{ marginTop: '20px' }}>
          <Link to="/profile">← Back to Profile</Link>
        </div>
      </div>
    </div>
  );
};

export default ChangePassword;
