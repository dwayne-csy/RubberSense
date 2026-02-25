import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import LeftNavigationBar from '../layouts/LeftNavigationBar';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4001';

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

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

  if (loading) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh' }}>
        <LeftNavigationBar />
        <div style={{ 
          flex: 1, 
          marginLeft: '280px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          backgroundColor: '#f5f5f5'
        }}>
          <p>Loading Admin Profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Left Navigation Bar */}
      <LeftNavigationBar />
      
      {/* Main Content Area */}
      <div style={{ 
        flex: 1, 
        marginLeft: '280px',
        backgroundColor: '#f5f5f5'
      }}>
        {/* Only Welcome Admin text */}
        <div style={{ 
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh'
        }}>
          <h1 style={{ 
            fontSize: '48px',
            fontWeight: 'bold',
            color: '#2c3e50'
          }}>
            Welcome Admin
          </h1>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;