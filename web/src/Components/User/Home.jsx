import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const Home = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4001';

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (!token) return navigate('/login');

      try {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        const response = await axios.get(`${API_BASE_URL}/api/v1/users/me`);
        if (response.data.success) {
          setUser(response.data.user);
        } else {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          navigate('/login');
        }
      } catch (error) {
        console.error('Auth check error:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [navigate, API_BASE_URL]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (loading) {
    return <p style={{ textAlign: 'center', marginTop: '50px' }}>Loading...</p>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px', minHeight: '100vh', background: '#667eea' }}>
      {/* Top-right buttons */}
      <div style={{ width: '100%', maxWidth: '600px', display: 'flex', justifyContent: 'flex-end', gap: '10px', marginBottom: '40px' }}>
        <Link 
          to="/profile" 
          style={{ padding: '10px 20px', background: '#3b82f6', color: 'white', borderRadius: '5px', textDecoration: 'none' }}
        >
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
      <h1 style={{ color: 'white', textAlign: 'center' }}>Welcome User</h1>

      {/* Optional Avatar */}
      {user?.avatar?.url && (
        <img
          src={user.avatar.url}
          alt="Admin Avatar"
          style={{ width: '120px', height: '120px', borderRadius: '50%', objectFit: 'cover', marginTop: '20px', border: '4px solid white' }}
        />
      )}
    </div>
  );
};

export default Home;
