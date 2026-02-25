import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const AdminEditProfile = () => {
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
      } catch {
        navigate('/admin/profile');
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
      if (avatar) data.append('avatar', avatar);

      const response = await axios.put(
        `${API_BASE_URL}/api/v1/users/me/update`,
        data,
        { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } }
      );

      if (response.data.success) {
        setSuccess('Profile updated successfully!');
        setTimeout(() => navigate('/admin/profile'), 1500);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p style={{ textAlign: 'center', marginTop: '50px' }}>Loading...</p>;

  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
      <div style={{ width: '100%', maxWidth: '400px', textAlign: 'center' }}>
        <h2>Edit Admin Profile</h2>
        <Link to="/admin/profile">← Cancel</Link>

        {error && <p style={{ color: 'red' }}>{error}</p>}
        {success && <p style={{ color: 'green' }}>{success}</p>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '20px' }}>
          {/* Avatar Upload */}
          {avatarPreview && (
            <img
              src={avatarPreview}
              alt="Avatar Preview"
              style={{ width: '120px', height: '120px', borderRadius: '50%', objectFit: 'cover', margin: '0 auto 10px' }}
            />
          )}
          <input type="file" accept="image/*" onChange={handleAvatarChange} />

          <input name="name" value={formData.name} onChange={handleChange} placeholder="Full Name" required />
          <input value={user?.email || ''} disabled />

          <input name="contact" value={formData.contact} onChange={handleChange} placeholder="Contact" />
          <input name="city" value={formData.city} onChange={handleChange} placeholder="City" />
          <input name="barangay" value={formData.barangay} onChange={handleChange} placeholder="Barangay" />
          <input name="street" value={formData.street} onChange={handleChange} placeholder="Street" />
          <input name="zipcode" value={formData.zipcode} onChange={handleChange} placeholder="Zip Code" />

          <button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
        </form>
      </div>
    </div>
  );
};

export default AdminEditProfile;
