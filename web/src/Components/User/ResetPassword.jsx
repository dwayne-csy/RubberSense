import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const ResetPassword = () => {
  const { token } = useParams(); // Get reset token from URL
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4001';

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await axios.put(
        `${API_BASE_URL}/api/v1/users/reset-password/${token}`,
        { password }
      );

      if (response.data.success) {
        setMessage(response.data.message || 'Password reset successfully!');
        setTimeout(() => {
          navigate('/login'); // Redirect to login after successful reset
        }, 3000);
      } else {
        setError(response.data.message || 'Failed to reset password.');
      }
    } catch (err) {
      console.error('Reset password error:', err);
      setError(err.response?.data?.message || 'Server error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        padding: '20px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '400px',
          textAlign: 'center',
          border: '1px solid #ddd',
          borderRadius: '12px',
          padding: '30px',
        }}
      >
        <h2>Reset Password</h2>
        <p>Enter your new password below.</p>

        {message && <p style={{ color: 'green' }}>{message}</p>}
        {error && <p style={{ color: 'red' }}>{error}</p>}

        <form
          onSubmit={handleSubmit}
          style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}
        >
          <input
            type="password"
            placeholder="New Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
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
            style={{
              padding: '10px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: '#007bff',
              color: 'white',
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>

        <div style={{ marginTop: '20px' }}>
          <Link to="/login">← Back to Login</Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
