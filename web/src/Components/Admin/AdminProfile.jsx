import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const AdminProfile = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
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
          setUser(response.data.user);
        }
      } catch (error) {
        console.error('Profile fetch error:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigate, API_BASE_URL]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (loading) return <p style={{ textAlign: 'center', marginTop: '50px' }}>Loading Admin Profile...</p>;

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
      <div style={{ textAlign: 'center', padding: '20px', border: '1px solid #ddd', borderRadius: '12px', width: '300px' }}>
        {/* Avatar */}
        <div>
          <img 
            src={user?.avatar?.url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'Admin')}`} 
            alt={user?.name} 
            style={{ width: '120px', height: '120px', borderRadius: '50%', objectFit: 'cover', marginBottom: '15px' }}
          />
        </div>

        {/* Basic Info */}
        <p><strong>Full Name:</strong> {user?.name}</p>
        <p><strong>Email:</strong> {user?.email}</p>
        {user?.contact && <p><strong>Contact:</strong> {user.contact}</p>}

        {/* Address */}
        {user?.address && (
          <div>
            <p><strong>City:</strong> {user.address.city || '-'}</p>
            <p><strong>Barangay:</strong> {user.address.barangay || '-'}</p>
            <p><strong>Street:</strong> {user.address.street || '-'}</p>
            <p><strong>Zip Code:</strong> {user.address.zipcode || '-'}</p>
          </div>
        )}

        {/* Actions */}
        <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <Link to="/admin/profile/edit">Edit Profile</Link>
          <Link to="/admin/change-password">Change Password</Link>
          <button onClick={handleLogout}>Logout</button>
        </div>
      </div>
    </div>
  );
};

export default AdminProfile;
