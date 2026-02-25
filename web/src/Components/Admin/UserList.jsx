import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { 
  Table, 
  Tag, 
  Button, 
  Space, 
  Card, 
  Row, 
  Col, 
  Select, 
  Input, 
  message, 
  Modal, 
  Spin,
  Tooltip,
  Badge
} from 'antd';
import { 
  CheckCircleOutlined, 
  CloseCircleOutlined, 
  UserOutlined, 
  SearchOutlined,
  EyeOutlined,
  PoweroffOutlined,
  MailOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  FieldTimeOutlined,
  CheckOutlined,
  CloseOutlined,
  GlobalOutlined,
  DisconnectOutlined
} from '@ant-design/icons';
import LeftNavigationBar from '../layouts/LeftNavigationBar';

const { Option } = Select;
const { Search } = Input;

const UserList = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [verificationFilter, setVerificationFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchText, setSearchText] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userOnlineStatus, setUserOnlineStatus] = useState({});
  
  const activityIntervalRef = useRef(null);
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4001';

  // Helper function to calculate time ago
  const getTimeAgo = (dateString) => {
    if (!dateString) return 'Never';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)} months ago`;
    return `${Math.floor(diffInSeconds / 31536000)} years ago`;
  };

  // Helper function to check if user is online (logged in within last 5 minutes)
  const isUserOnline = (lastLogin) => {
    if (!lastLogin) return false;
    
    const lastLoginTime = new Date(lastLogin).getTime();
    const currentTime = Date.now();
    const fiveMinutesInMs = 5 * 60 * 1000;
    
    return (currentTime - lastLoginTime) < fiveMinutesInMs;
  };

  // Format date to readable string
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // Function to update online status
  const updateOnlineStatus = () => {
    const statuses = {};
    users.forEach(user => {
      statuses[user._id] = isUserOnline(user.lastLogin);
    });
    setUserOnlineStatus(statuses);
  };

  // Fetch all users (excluding Admin)
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/api/v1/users`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success) {
        // Filter out admin users
        const nonAdminUsers = response.data.users.filter(user => user.role !== 'admin');
        
        const usersWithKey = nonAdminUsers.map(user => ({
          ...user,
          key: user._id
        }));
        
        setUsers(usersWithKey);
        setFilteredUsers(usersWithKey);
        
        // Update online status immediately
        updateOnlineStatus();
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      if (error.response?.status === 401) {
        message.error('Session expired. Please login again.');
        localStorage.removeItem('token');
        window.location.href = '/login';
      } else if (error.response?.status === 403) {
        message.error('Admin access required.');
      } else {
        message.error('Failed to fetch users');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Add CSS for pulsing animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes pulse {
        0% { opacity: 1; }
        50% { opacity: 0.5; }
        100% { opacity: 1; }
      }
    `;
    document.head.appendChild(style);
    
    // Initial fetch
    fetchUsers();
    
    // Set up interval to check online status every 30 seconds
    activityIntervalRef.current = setInterval(() => {
      updateOnlineStatus();
    }, 30000); // Check every 30 seconds
    
    // Cleanup function
    return () => {
      if (activityIntervalRef.current) {
        clearInterval(activityIntervalRef.current);
      }
      document.head.removeChild(style);
    };
  }, []); // Empty dependency array - runs once on mount

  // Apply filters whenever filters or search text change
  useEffect(() => {
    let result = [...users];

    // Apply verification filter
    if (verificationFilter === 'verified') {
      result = result.filter(user => user.isVerified === true);
    } else if (verificationFilter === 'unverified') {
      result = result.filter(user => user.isVerified === false);
    }

    // Apply status filter
    if (statusFilter === 'active') {
      result = result.filter(user => user.isActive === true);
    } else if (statusFilter === 'inactive') {
      result = result.filter(user => user.isActive === false);
    }

    // Apply search filter
    if (searchText) {
      const lowercasedSearch = searchText.toLowerCase();
      result = result.filter(user => 
        user.name?.toLowerCase().includes(lowercasedSearch) ||
        user.email?.toLowerCase().includes(lowercasedSearch)
      );
    }

    setFilteredUsers(result);
  }, [users, verificationFilter, statusFilter, searchText]);

  // Update online status when users data changes
  useEffect(() => {
    if (users.length > 0) {
      updateOnlineStatus();
    }
  }, [users]); // Only run when users data changes

  // Toggle user active/inactive status
  const toggleUserStatus = async (userId, currentStatus) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `${API_BASE_URL}/api/v1/users/${userId}/toggle-status`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        message.success(response.data.message);
        
        // Update the local state
        setUsers(prevUsers => 
          prevUsers.map(user => 
            user._id === userId 
              ? { ...user, isActive: !currentStatus } 
              : user
          )
        );
      }
    } catch (error) {
      console.error('Error toggling user status:', error);
      message.error('Failed to update user status');
    }
  };

  // Show user details modal
  const showUserDetails = (user) => {
    setSelectedUser(user);
    setModalVisible(true);
  };

  // Verify a user (only for unverified users)
  const verifyUser = async (userId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `${API_BASE_URL}/api/v1/users/${userId}/verify`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        message.success('User verified successfully');
        fetchUsers(); // Refresh the list
      }
    } catch (error) {
      console.error('Error verifying user:', error);
      if (error.response?.status === 404) {
        message.error('Verification endpoint not found. Please check backend implementation.');
      } else {
        message.error('Failed to verify user');
      }
    }
  };

  // Table columns
  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
      render: (text, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ position: 'relative' }}>
            <UserOutlined style={{ color: '#1890ff', fontSize: '16px' }} />
            <Badge 
              dot 
              color={userOnlineStatus[record._id] ? 'green' : 'gray'}
              style={{ 
                position: 'absolute',
                top: '-2px',
                right: '-2px',
                fontSize: '6px'
              }}
            />
          </div>
          <div>
            <div style={{ fontWeight: '500' }}>{text || 'No Name'}</div>
          </div>
        </div>
      ),
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      sorter: (a, b) => a.email.localeCompare(b.email),
      render: (text) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <MailOutlined style={{ color: '#52c41a' }} />
          <span>{text}</span>
        </div>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      filters: [
        { text: 'Active', value: true },
        { text: 'Inactive', value: false },
      ],
      onFilter: (value, record) => record.isActive === value,
      render: (isActive, record) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          <Tag color={isActive ? 'blue' : 'gray'}>
            {isActive ? 'Active' : 'Inactive'}
          </Tag>
          {userOnlineStatus[record._id] ? (
            <Tag color="green" icon={<CheckOutlined />}>
              Online
            </Tag>
          ) : (
            <Tag color="default" icon={<CloseOutlined />}>
              Offline
            </Tag>
          )}
        </div>
      ),
    },
    {
      title: 'Verified',
      dataIndex: 'isVerified',
      key: 'isVerified',
      filters: [
        { text: 'Verified', value: true },
        { text: 'Unverified', value: false },
      ],
      onFilter: (value, record) => record.isVerified === value,
      render: (isVerified) => (
        <Tag 
          color={isVerified ? 'green' : 'orange'} 
          icon={isVerified ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
        >
          {isVerified ? 'Verified' : 'Unverified'}
        </Tag>
      ),
    },
    {
      title: 'Last Activity',
      key: 'lastActivity',
      render: (_, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {userOnlineStatus[record._id] ? (
            <>
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: '#52c41a',
                animation: 'pulse 1.5s infinite'
              }} />
              <span style={{ color: '#52c41a', fontWeight: '500' }}>Online Now</span>
            </>
          ) : (
            <>
              <ClockCircleOutlined style={{ color: record.lastLogin ? '#1890ff' : '#999' }} />
              <span style={{ color: record.lastLogin ? 'inherit' : '#999' }}>
                {record.lastLogin ? getTimeAgo(record.lastLogin) : 'Never'}
              </span>
            </>
          )}
        </div>
      ),
    },
    {
      title: 'Created At',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CalendarOutlined />
          <span>{new Date(date).toLocaleDateString()}</span>
        </div>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 200,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="View Details">
            <Button 
              type="text" 
              icon={<EyeOutlined />} 
              onClick={() => showUserDetails(record)}
            />
          </Tooltip>
          
          <Tooltip title={record.isActive ? "Deactivate" : "Activate"}>
            <Button 
              type="text" 
              icon={<PoweroffOutlined />}
              danger={record.isActive}
              onClick={() => toggleUserStatus(record._id, record.isActive)}
            />
          </Tooltip>
          
          {/* Show verify button only for unverified users */}
          {!record.isVerified && (
            <Tooltip title="Verify User">
              <Button 
                type="primary" 
                size="small"
                onClick={() => verifyUser(record._id)}
              >
                Verify
              </Button>
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  // Reset all filters
  const resetFilters = () => {
    setVerificationFilter('all');
    setStatusFilter('all');
    setSearchText('');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <LeftNavigationBar />
      
      <div style={{ 
        marginLeft: '250px', 
        padding: '30px', 
        width: 'calc(100% - 250px)',
        background: '#f0f2f5',
        minHeight: '100vh'
      }}>
        <Card 
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <UserOutlined style={{ fontSize: '20px', color: '#1890ff' }} />
              <span>User Management (Regular Users Only)</span>
              <Tag color="blue">{filteredUsers.length} users</Tag>
              <Tag color="green" style={{ marginLeft: '10px' }}>
                <CheckOutlined /> Online: {Object.values(userOnlineStatus).filter(status => status).length}
              </Tag>
            </div>
          }
          extra={
            <Button 
              type="primary" 
              onClick={fetchUsers}
              loading={loading}
              icon={<SearchOutlined />}
            >
              Refresh
            </Button>
          }
        >
          {/* Filters Section */}
          <Row gutter={[16, 16]} style={{ marginBottom: '20px' }}>
            <Col xs={24} sm={8}>
              <div>
                <div style={{ marginBottom: '8px', fontWeight: '500' }}>Verification Status</div>
                <Select
                  style={{ width: '100%' }}
                  value={verificationFilter}
                  onChange={setVerificationFilter}
                >
                  <Option value="all">All Users</Option>
                  <Option value="verified">Verified Only</Option>
                  <Option value="unverified">Unverified Only</Option>
                </Select>
              </div>
            </Col>
            
            <Col xs={24} sm={8}>
              <div>
                <div style={{ marginBottom: '8px', fontWeight: '500' }}>Account Status</div>
                <Select
                  style={{ width: '100%' }}
                  value={statusFilter}
                  onChange={setStatusFilter}
                >
                  <Option value="all">All Status</Option>
                  <Option value="active">Active Only</Option>
                  <Option value="inactive">Inactive Only</Option>
                </Select>
              </div>
            </Col>
            
            <Col xs={24} sm={8}>
              <div>
                <div style={{ marginBottom: '8px', fontWeight: '500' }}>Search Users</div>
                <Search
                  placeholder="Search by name or email"
                  prefix={<SearchOutlined />}
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  allowClear
                  onSearch={(value) => setSearchText(value)}
                />
              </div>
            </Col>
          </Row>
          
          <Row style={{ marginBottom: '20px' }}>
            <Col span={24}>
              <Space>
                <Button onClick={resetFilters}>
                  Reset Filters
                </Button>
                <div style={{ marginLeft: '10px' }}>
                  <Tag color="green">
                    <CheckCircleOutlined /> Verified: {users.filter(u => u.isVerified).length}
                  </Tag>
                  <Tag color="orange" style={{ marginLeft: '5px' }}>
                    <CloseCircleOutlined /> Unverified: {users.filter(u => !u.isVerified).length}
                  </Tag>
                  <Tag color="blue" style={{ marginLeft: '5px' }}>
                    Active: {users.filter(u => u.isActive).length}
                  </Tag>
                  <Tag color="gray" style={{ marginLeft: '5px' }}>
                    Inactive: {users.filter(u => !u.isActive).length}
                  </Tag>
                  <Tag color="green" style={{ marginLeft: '5px' }}>
                    <CheckOutlined /> Online: {Object.values(userOnlineStatus).filter(status => status).length}
                  </Tag>
                </div>
              </Space>
            </Col>
          </Row>
          
          {/* Users Table */}
          <Spin spinning={loading}>
            <Table 
              columns={columns} 
              dataSource={filteredUsers}
              pagination={{ 
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) => 
                  `${range[0]}-${range[1]} of ${total} regular users`
              }}
              scroll={{ x: 1100 }}
              rowKey="_id"
            />
          </Spin>
        </Card>

        {/* User Details Modal */}
        <Modal
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <UserOutlined />
              <span>User Details</span>
              {selectedUser && userOnlineStatus[selectedUser._id] && (
                <Badge dot color="green" text="Online" />
              )}
            </div>
          }
          open={modalVisible}
          onCancel={() => setModalVisible(false)}
          footer={[
            <Button key="close" onClick={() => setModalVisible(false)}>
              Close
            </Button>
          ]}
          width={700}
        >
          {selectedUser && (
            <div style={{ padding: '10px' }}>
              <Row gutter={[16, 16]}>
                <Col span={24}>
                  <h3 style={{ marginBottom: '5px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <UserOutlined /> {selectedUser.name || 'No Name'}
                    {userOnlineStatus[selectedUser._id] ? (
                      <Tag color="green" icon={<CheckOutlined />}>
                        Online Now
                      </Tag>
                    ) : (
                      <Tag color="default" icon={<CloseOutlined />}>
                        Offline
                      </Tag>
                    )}
                  </h3>
                  <p style={{ color: '#666', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <MailOutlined /> {selectedUser.email}
                  </p>
                </Col>
                
                {/* Last Activity Information */}
                <Col span={24}>
                  <Card 
                    size="small" 
                    title={
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <ClockCircleOutlined />
                        <span>Activity Information</span>
                      </div>
                    }
                  >
                    <Row gutter={[16, 16]}>
                      <Col span={24}>
                        <div style={{ marginBottom: '8px' }}>
                          <strong>Current Status:</strong>
                        </div>
                        <div style={{ 
                          padding: '15px', 
                          background: userOnlineStatus[selectedUser._id] ? '#f6ffed' : '#f5f5f5', 
                          borderRadius: '4px',
                          border: `1px solid ${userOnlineStatus[selectedUser._id] ? '#b7eb8f' : '#d9d9d9'}`
                        }}>
                          {userOnlineStatus[selectedUser._id] ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <div style={{
                                width: '12px',
                                height: '12px',
                                borderRadius: '50%',
                                backgroundColor: '#52c41a',
                                animation: 'pulse 1.5s infinite'
                              }} />
                              <div>
                                <div style={{ color: '#52c41a', fontWeight: '500', fontSize: '16px' }}>
                                  Currently Online
                                </div>
                                <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                                  User is active on the website right now
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                                <CloseOutlined style={{ color: '#999' }} />
                                <span style={{ color: '#999', fontWeight: '500', fontSize: '16px' }}>Currently Offline</span>
                              </div>
                              
                              {selectedUser.lastLogin ? (
                                <div style={{ 
                                  padding: '10px', 
                                  background: '#e6f7ff', 
                                  borderRadius: '4px',
                                  marginTop: '10px'
                                }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
                                    <ClockCircleOutlined style={{ color: '#1890ff' }} />
                                    <strong>Last Login:</strong>
                                  </div>
                                  <div style={{ fontSize: '14px', color: '#666' }}>
                                    {getTimeAgo(selectedUser.lastLogin)}
                                  </div>
                                  <div style={{ fontSize: '12px', color: '#999', marginTop: '5px' }}>
                                    {formatDate(selectedUser.lastLogin)}
                                  </div>
                                </div>
                              ) : (
                                <div style={{ 
                                  padding: '10px', 
                                  background: '#fff2e8', 
                                  borderRadius: '4px',
                                  marginTop: '10px'
                                }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <CloseCircleOutlined style={{ color: '#fa8c16' }} />
                                    <span style={{ color: '#fa8c16' }}>Never logged in</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </Col>
                    </Row>
                  </Card>
                </Col>
                
                <Col span={12}>
                  <strong>Verified Status:</strong>
                  <div style={{ marginTop: '4px' }}>
                    <Tag 
                      color={selectedUser.isVerified ? 'green' : 'orange'} 
                      icon={selectedUser.isVerified ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
                    >
                      {selectedUser.isVerified ? 'Verified' : 'Unverified'}
                    </Tag>
                  </div>
                </Col>
                
                <Col span={12}>
                  <strong>Account Status:</strong>
                  <div style={{ marginTop: '4px' }}>
                    <Tag color={selectedUser.isActive ? 'blue' : 'gray'}>
                      {selectedUser.isActive ? 'Active' : 'Inactive'}
                    </Tag>
                  </div>
                </Col>
                
                <Col span={12}>
                  <strong>Created At:</strong>
                  <div style={{ marginTop: '4px' }}>
                    <div style={{ 
                      padding: '6px 10px', 
                      background: '#f5f5f5', 
                      borderRadius: '4px',
                      fontSize: '14px'
                    }}>
                      {new Date(selectedUser.createdAt).toLocaleString()}
                    </div>
                  </div>
                </Col>
                
                {/* Additional User Info */}
                <Col span={24}>
                  <strong>Authentication:</strong>
                  <div style={{ marginTop: '4px' }}>
                    <div style={{ 
                      padding: '6px 10px', 
                      background: '#f0f5ff', 
                      borderRadius: '4px',
                      fontSize: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <span>Provider: </span>
                      <Tag color="purple">
                        {selectedUser.authProvider || 'local'}
                      </Tag>
                      {selectedUser.firebaseUID && (
                        <span style={{ fontSize: '12px', color: '#666' }}>
                          (Firebase ID: {selectedUser.firebaseUID.substring(0, 8)}...)
                        </span>
                      )}
                    </div>
                  </div>
                </Col>
                
                <Col span={24}>
                  <strong>Actions:</strong>
                  <div style={{ marginTop: '10px' }}>
                    <Space>
                      <Button 
                        type={selectedUser.isActive ? 'dashed' : 'primary'}
                        icon={<PoweroffOutlined />}
                        onClick={() => {
                          toggleUserStatus(selectedUser._id, selectedUser.isActive);
                          setModalVisible(false);
                        }}
                      >
                        {selectedUser.isActive ? 'Deactivate' : 'Activate'}
                      </Button>
                      
                      {!selectedUser.isVerified && (
                        <Button 
                          type="primary"
                          onClick={() => {
                            verifyUser(selectedUser._id);
                            setModalVisible(false);
                          }}
                        >
                          Verify User
                        </Button>
                      )}
                      
                      <Button 
                        type="default"
                        icon={<SearchOutlined />}
                        onClick={fetchUsers}
                      >
                        Refresh Data
                      </Button>
                    </Space>
                  </div>
                </Col>
              </Row>
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
};

export default UserList;