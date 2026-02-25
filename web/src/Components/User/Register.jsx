import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const Register = () => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4001';

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const navigate = useNavigate();

  const styles = {
    container: {
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px',
    },
    card: {
      background: 'white',
      borderRadius: '16px',
      boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
      width: '100%',
      maxWidth: '500px',
      padding: '40px',
      animation: 'slideUp 0.5s ease',
    },
    header: {
      textAlign: 'center',
      marginBottom: '30px',
    },
    headerH2: {
      color: '#333',
      fontSize: '28px',
      fontWeight: '700',
      marginBottom: '8px',
    },
    headerP: {
      color: '#666',
      fontSize: '16px',
    },
    alert: {
      padding: '12px 16px',
      borderRadius: '8px',
      marginBottom: '20px',
      display: 'flex',
      alignItems: 'center',
    },
    alertError: {
      backgroundColor: '#fee',
      border: '1px solid #fcc',
      color: '#c33',
    },
    alertSuccess: {
      backgroundColor: '#efffef',
      border: '1px solid #cfc',
      color: '#3c3',
    },
    formGroup: {
      marginBottom: '20px',
    },
    requiredLabel: {
      display: 'block',
      color: '#333',
      fontWeight: '500',
      marginBottom: '8px',
      fontSize: '14px',
    },
    requiredStar: {
      color: '#e53e3e',
    },
    input: {
      width: '100%',
      padding: '14px 16px',
      border: '2px solid #e1e5e9',
      borderRadius: '8px',
      fontSize: '15px',
      transition: 'all 0.3s ease',
      background: 'white',
      boxSizing: 'border-box',
    },
    passwordContainer: {
      position: 'relative',
    },
    passwordToggle: {
      position: 'absolute',
      right: '12px',
      top: '50%',
      transform: 'translateY(-50%)',
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      fontSize: '16px',
      padding: '4px',
      color: '#666',
      zIndex: '2',
    },
    smallText: {
      display: 'block',
      color: '#888',
      fontSize: '12px',
      marginTop: '6px',
    },
    submitButton: {
      width: '100%',
      padding: '16px',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      fontSize: '16px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '10px',
      marginTop: '10px',
    },
    spinner: {
      width: '18px',
      height: '18px',
      border: '2px solid rgba(255, 255, 255, 0.3)',
      borderRadius: '50%',
      borderTopColor: 'white',
      animation: 'spin 1s ease-in-out infinite',
    },
    footer: {
      textAlign: 'center',
      marginTop: '30px',
      paddingTop: '25px',
      borderTop: '1px solid #e1e5e9',
      color: '#666',
      fontSize: '15px',
    },
    link: {
      color: '#667eea',
      textDecoration: 'none',
      fontWeight: '600',
    },
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (!formData.name || !formData.email || !formData.password) {
      setError('Please fill in all required fields');
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      setLoading(false);
      return;
    }

    try {
      const userData = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
      };

      const response = await axios.post(
        `${API_BASE_URL}/api/v1/users/register`,
        userData,
        { headers: { 'Content-Type': 'application/json' } }
      );

      if (response.data.success) {
        setSuccess(response.data.message);
        setFormData({ name: '', email: '', password: '', confirmPassword: '' });

        setTimeout(() => {
          navigate('/login');
        }, 3000);
      }
    } catch (error) {
      console.error('Registration error:', error);
      if (error.response) {
        setError(error.response.data.message || 'Registration failed. Please try again.');
      } else if (error.request) {
        setError('Cannot connect to server. Please check if backend is running.');
      } else {
        setError('Error: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h2 style={styles.headerH2}>Create Account</h2>
          <p style={styles.headerP}>Join our community in seconds</p>
        </div>

        {error && <div style={{ ...styles.alert, ...styles.alertError }}>{error}</div>}
        {success && <div style={{ ...styles.alert, ...styles.alertSuccess }}>{success}</div>}

        <form onSubmit={handleSubmit}>
          <div style={styles.formGroup}>
            <label htmlFor="name" style={styles.requiredLabel}>
              Full Name <span style={styles.requiredStar}>*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter your full name"
              required
              disabled={loading}
              style={styles.input}
              onFocus={(e) => e.target.style.borderColor = '#667eea'}
              onBlur={(e) => e.target.style.borderColor = '#e1e5e9'}
            />
          </div>

          <div style={styles.formGroup}>
            <label htmlFor="email" style={styles.requiredLabel}>
              Email Address <span style={styles.requiredStar}>*</span>
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              required
              disabled={loading}
              style={styles.input}
              onFocus={(e) => e.target.style.borderColor = '#667eea'}
              onBlur={(e) => e.target.style.borderColor = '#e1e5e9'}
            />
          </div>

          <div style={styles.formGroup}>
            <label htmlFor="password" style={styles.requiredLabel}>
              Password <span style={styles.requiredStar}>*</span>
            </label>
            <div style={styles.passwordContainer}>
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                required
                disabled={loading}
                style={styles.input}
                onFocus={(e) => e.target.style.borderColor = '#667eea'}
                onBlur={(e) => e.target.style.borderColor = '#e1e5e9'}
              />
              <button
                type="button"
                style={styles.passwordToggle}
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
            <small style={styles.smallText}>Minimum 6 characters</small>
          </div>

          <div style={styles.formGroup}>
            <label htmlFor="confirmPassword" style={styles.requiredLabel}>
              Confirm Password <span style={styles.requiredStar}>*</span>
            </label>
            <div style={styles.passwordContainer}>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm your password"
                required
                disabled={loading}
                style={styles.input}
                onFocus={(e) => e.target.style.borderColor = '#667eea'}
                onBlur={(e) => e.target.style.borderColor = '#e1e5e9'}
              />
              <button
                type="button"
                style={styles.passwordToggle}
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            style={styles.submitButton}
            disabled={loading}
            onMouseEnter={(e) => !loading && (e.target.style.transform = 'translateY(-2px)')}
            onMouseLeave={(e) => !loading && (e.target.style.transform = 'translateY(0)')}
          >
            {loading ? (
              <>
                <span style={styles.spinner}></span>
                Creating Account...
              </>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        <div style={styles.footer}>
          <p>
            Already have an account?{' '}
            <Link to="/login" style={styles.link}>
              Sign in
            </Link>
          </p>
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        input:focus { outline: none; box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1); }
        button:disabled { opacity: 0.6; cursor: not-allowed; }
        input:disabled { background-color: #f8f9fa; cursor: not-allowed; }
        a:hover { text-decoration: underline; }
        button:hover:not(:disabled) { box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1); }
        button[type="submit"]:hover:not(:disabled) { box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3); }
      `}</style>
    </div>
  );
};

export default Register;
