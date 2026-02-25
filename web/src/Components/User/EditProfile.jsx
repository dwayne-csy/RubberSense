import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import UserHeader from '../layouts/UserHeader.jsx';
import UserFooter from '../layouts/UserFooter.jsx';

const EditProfile = () => {
  const [formData, setFormData] = useState({
    name: '',
    contact: '',
    city: '',
    barangay: '',
    street: '',
    zipcode: '',
  });

  const [avatar, setAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4001';

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem('token');
      if (!token) return navigate('/login');

      try {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        const response = await axios.get(`${API_BASE_URL}/api/v1/users/me`);

        if (response.data.success) {
          const user = response.data.user;
          setUser(user);
          setAvatarPreview(user.avatar?.url || '');

          setFormData({
            name: user.name || '',
            contact: user.contact || '',
            city: user.address?.city || '',
            barangay: user.address?.barangay || '',
            street: user.address?.street || '',
            zipcode: user.address?.zipcode || '',
          });
        }
      } catch (error) {
        console.error('Profile fetch error:', error);
        navigate('/profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigate, API_BASE_URL]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
    setSuccess('');
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setAvatar(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    if (!formData.name.trim()) {
      setError('Name is required');
      setSaving(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');

      const data = new FormData();
      data.append('name', formData.name.trim());
      data.append('contact', formData.contact || '');
      data.append('city', formData.city || '');
      data.append('barangay', formData.barangay || '');
      data.append('street', formData.street || '');
      data.append('zipcode', formData.zipcode || '');

      if (avatar) {
        data.append('avatar', avatar);
      }

      const response = await axios.put(
        `${API_BASE_URL}/api/v1/users/me/update`,
        data,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      if (response.data.success) {
        setSuccess('Profile updated successfully!');
        setTimeout(() => navigate('/profile'), 1500);
      }

    } catch (error) {
      console.error('Update error:', error);
      setError(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <>
        <UserHeader />
        <div style={styles.loadingContainer}>
          <div style={styles.loader}></div>
          <p style={styles.loadingText}>Loading Profile...</p>
        </div>
        <UserFooter />
      </>
    );
  }

  return (
    <>
      <UserHeader />
      <div style={styles.container}>
        <div style={styles.contentWrapper}>
          {/* Header */}
          <div style={styles.header}>
            <div style={styles.leafDecor1}>🌿</div>
            <div style={styles.leafDecor2}>🌿</div>
            <h1 style={styles.title}>Edit Profile</h1>
            <p style={styles.subtitle}>Update your account information</p>
            <Link to="/profile" style={styles.backLink}>← Back to Profile</Link>
          </div>

          {/* Alert Messages */}
          {error && (
            <div style={styles.errorAlert}>
              <span>⚠️ {error}</span>
            </div>
          )}

          {success && (
            <div style={styles.successAlert}>
              <span>✓ {success}</span>
            </div>
          )}

          {/* Form Card */}
          <div style={styles.formCard}>
            <form onSubmit={handleSubmit}>
              {/* Avatar Section */}
              <div style={styles.avatarSection}>
                <img
                  src={
                    avatarPreview || 
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.name || 'User')}&size=200&background=228B22&color=fff&bold=true`
                  }
                  alt="Avatar Preview"
                  style={styles.avatar}
                />
                <label htmlFor="avatar-upload" style={styles.uploadButton}>
                  Choose Photo
                </label>
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  style={styles.fileInput}
                />
              </div>

              {/* Form Fields */}
              <div style={styles.formGrid}>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Full Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    required
                    style={styles.input}
                  />
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>Email Address</label>
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    style={styles.inputDisabled}
                  />
                  <span style={styles.inputHint}>Email cannot be changed</span>
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>Contact Number</label>
                  <input
                    type="tel"
                    name="contact"
                    value={formData.contact}
                    onChange={handleChange}
                    placeholder="Enter contact number"
                    style={styles.input}
                  />
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>Street</label>
                  <input
                    type="text"
                    name="street"
                    value={formData.street}
                    onChange={handleChange}
                    placeholder="Enter street address"
                    style={styles.input}
                  />
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>Barangay</label>
                  <input
                    type="text"
                    name="barangay"
                    value={formData.barangay}
                    onChange={handleChange}
                    placeholder="Enter barangay"
                    style={styles.input}
                  />
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>City</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="Enter city"
                    style={styles.input}
                  />
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>Zip Code</label>
                  <input
                    type="text"
                    name="zipcode"
                    value={formData.zipcode}
                    onChange={handleChange}
                    placeholder="Enter zip code"
                    style={styles.input}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div style={styles.buttonGroup}>
                <button
                  type="submit"
                  disabled={saving}
                  style={saving ? styles.submitButtonDisabled : styles.submitButton}
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <Link to="/profile" style={styles.cancelButton}>
                  Cancel
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>

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
    maxWidth: '800px',
    margin: '0 auto',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '70vh',
    backgroundColor: '#ffffff',
  },
  loader: {
    width: '50px',
    height: '50px',
    border: '4px solid #f0f0f0',
    borderTop: '4px solid #228B22',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  loadingText: {
    marginTop: '20px',
    fontSize: '1rem',
    color: '#666',
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
  avatarSection: {
    textAlign: 'center',
    marginBottom: '30px',
    paddingBottom: '30px',
    borderBottom: '1px solid #e0e0e0',
  },
  avatar: {
    width: '120px',
    height: '120px',
    borderRadius: '50%',
    objectFit: 'cover',
    border: '3px solid #228B22',
    marginBottom: '15px',
    display: 'block',
    margin: '0 auto 15px',
  },
  uploadButton: {
    display: 'inline-block',
    padding: '10px 24px',
    backgroundColor: '#228B22',
    color: 'white',
    borderRadius: '6px',
    fontSize: '0.95rem',
    fontWeight: '600',
    cursor: 'pointer',
  },
  fileInput: {
    display: 'none',
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px',
    marginBottom: '30px',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
  },
  label: {
    fontSize: '0.95rem',
    fontWeight: '600',
    color: '#333',
    marginBottom: '8px',
  },
  input: {
    padding: '12px 15px',
    fontSize: '1rem',
    border: '1px solid #ddd',
    borderRadius: '6px',
    outline: 'none',
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
  },
  inputDisabled: {
    padding: '12px 15px',
    fontSize: '1rem',
    border: '1px solid #ddd',
    borderRadius: '6px',
    backgroundColor: '#f5f5f5',
    color: '#999',
    cursor: 'not-allowed',
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
  },
  inputHint: {
    marginTop: '5px',
    fontSize: '0.85rem',
    color: '#999',
    fontStyle: 'italic',
  },
  buttonGroup: {
    display: 'flex',
    gap: '15px',
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

export default EditProfile;