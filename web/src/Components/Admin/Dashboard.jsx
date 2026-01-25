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

  if (loading) {
    return <p style={{ textAlign: 'center', marginTop: '50px' }}>Loading Admin Profile...</p>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px' }}>
      {/* Header with Buttons */}
      <div style={{ width: '100%', maxWidth: '600px', display: 'flex', justifyContent: 'flex-end', marginBottom: '40px', gap: '10px' }}>
        <Link to="/admin/profile" style={{ padding: '10px 20px', background: '#3b82f6', color: 'white', borderRadius: '5px', textDecoration: 'none' }}>
          Profile
        </Link>
        <button
          onClick={handleLogout}
          style={{ padding: '10px 20px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
        >
          Logout
        </button>
      </div>

      {/* Centered Welcome Text */}
      <h1 style={{ textAlign: 'center' }}>Welcome Admin</h1>

      {/* Optional Avatar */}
      {user?.avatar?.url && (
        <img
          src={user.avatar.url}
          alt="Admin Avatar"
          style={{ width: '120px', height: '120px', borderRadius: '50%', objectFit: 'cover', marginTop: '20px' }}
        />
      )}
    </div>
  );
};

export default AdminProfile;
