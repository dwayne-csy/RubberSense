import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';
import LeftNavigationBar from '../layouts/LeftNavigationBar';

const UsersIcon = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const MegaphoneIcon = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m3 11 18-5v12L3 14v-3z" />
    <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" />
  </svg>
);

const AnalysisIcon = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 16v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2" />
    <path d="M7 10l3-3 3 3 4-4" />
    <path d="M17 10V4h-6" />
    <path d="M21 12h-4" />
  </svg>
);

const InboxIcon = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
    <path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z" />
  </svg>
);

const FlagIcon = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
    <line x1="4" y1="22" x2="4" y2="15" />
  </svg>
);

const ArrowRightIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

const RefreshIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10" />
    <polyline points="1 20 1 14 7 14" />
    <path d="M3.51 9a9 9 0 0 1 14.13-3.36L23 10" />
    <path d="M20.49 15a9 9 0 0 1-14.13 3.36L1 14" />
  </svg>
);

const INITIAL_STATS = {
  users: { total: 0, active: 0, verified: 0 },
  announcements: { total: 0, published: 0, important: 0 },
  analyses: { total: 0, latex: 0, leaf: 0, trunk: 0 },
  messages: { total: 0, unread: 0, read: 0 },
  reports: { total: 0, pending: 0, reviewed: 0, resolved: 0, dismissed: 0 },
};

const INITIAL_ANALYTICS = {
  recentActivity: [],
  leafTopDiseases: [],
  trunkTopConditions: [],
  topUsers: [],
  users: { new: 0, activityRate: 0 },
  latex: { avgQualityScore: 0, avgDRC: 0 },
  leaf: { avgConfidence: 0, criticalCases: 0 },
  trunks: { avgHealthScore: 0, criticalTrees: 0 },
};

const cloneInitialStats = () => ({
  users: { ...INITIAL_STATS.users },
  announcements: { ...INITIAL_STATS.announcements },
  analyses: { ...INITIAL_STATS.analyses },
  messages: { ...INITIAL_STATS.messages },
  reports: { ...INITIAL_STATS.reports },
});

const cloneInitialAnalytics = () => ({
  recentActivity: [],
  leafTopDiseases: [],
  trunkTopConditions: [],
  topUsers: [],
  users: { ...INITIAL_ANALYTICS.users },
  latex: { ...INITIAL_ANALYTICS.latex },
  leaf: { ...INITIAL_ANALYTICS.leaf },
  trunks: { ...INITIAL_ANALYTICS.trunks },
});

const DashboardTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="dash-tooltip">
      <div className="dash-tooltip-title">{label}</div>
      {payload.map((entry, idx) => (
        <div key={`tt-${idx}`} className="dash-tooltip-row">
          <span className="dash-tooltip-dot" style={{ background: entry.color }} />
          <span>{entry.name}</span>
          <strong>{entry.value}</strong>
        </div>
      ))}
    </div>
  );
};

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState(cloneInitialStats());
  const [analytics, setAnalytics] = useState(cloneInitialAnalytics());
  const [timeRange, setTimeRange] = useState('30days');
  const [currentSlide, setCurrentSlide] = useState(0);
  const navigate = useNavigate();

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4001';

  const slides = [
    { id: 1, video: '/src/Components/slidingpics/slide1.mp4', title: 'Efficient Tree Tapping Operations', description: 'Professional latex extraction with modern technology.' },
    { id: 2, video: '/src/Components/slidingpics/slide2.mp4', title: 'Premium Latex Collection', description: 'High-quality latex sourced from healthy rubber trees.' },
    { id: 3, video: '/src/Components/slidingpics/slide3.mp4', title: 'Smart Plantation Management', description: 'Advanced monitoring to keep plantation performance stable.' },
    { id: 4, video: '/src/Components/slidingpics/slide4.mp4', title: 'Sustainable Rubber Farming', description: 'Eco-friendly practices for consistent long-term output.' },
  ];

  const activityChartData = useMemo(() => {
    const rows = Array.isArray(analytics.recentActivity) ? [...analytics.recentActivity] : [];
    return rows
      .sort((a, b) => String(a.date || '').localeCompare(String(b.date || '')))
      .map((row) => ({
        label: row.date ? String(row.date).slice(5) : '-',
        total: Number(row.total || 0),
        latex: Number(row.latex || 0),
        leaf: Number(row.leaf || 0),
        trunk: Number(row.trunk || 0),
      }));
  }, [analytics.recentActivity]);

  const analysisMixData = useMemo(
    () => [
      { name: 'Latex', value: Number(stats.analyses.latex || 0), color: '#2e7d32' },
      { name: 'Leaf', value: Number(stats.analyses.leaf || 0), color: '#43a047' },
      { name: 'Trunk', value: Number(stats.analyses.trunk || 0), color: '#ef6c00' },
    ].filter((item) => item.value > 0),
    [stats.analyses]
  );

  const reportStatusData = useMemo(
    () => [
      { name: 'Pending', value: Number(stats.reports.pending || 0), color: '#ff9800' },
      { name: 'Reviewed', value: Number(stats.reports.reviewed || 0), color: '#29b6f6' },
      { name: 'Resolved', value: Number(stats.reports.resolved || 0), color: '#2e7d32' },
      { name: 'Dismissed', value: Number(stats.reports.dismissed || 0), color: '#9e9e9e' },
    ].filter((item) => item.value > 0),
    [stats.reports]
  );

  const topDiseaseData = useMemo(
    () =>
      (analytics.leafTopDiseases || []).slice(0, 6).map((item) => ({
        name: String(item?._id || 'Unknown').slice(0, 22),
        count: Number(item?.count || 0),
      })),
    [analytics.leafTopDiseases]
  );

  const statCards = [
    {
      id: 'users',
      title: 'Total Users',
      count: stats.users.total,
      subCounts: [
        { label: 'Active', value: stats.users.active, color: '#4caf50' },
        { label: 'Verified', value: stats.users.verified, color: '#ff9800' },
      ],
      icon: UsersIcon,
      color: '#2e7d32',
      bgColor: '#e8f5e9',
      path: '/admin/users',
    },
    {
      id: 'announcements',
      title: 'Announcements',
      count: stats.announcements.total,
      subCounts: [
        { label: 'Published', value: stats.announcements.published, color: '#00acc1' },
        { label: 'Important', value: stats.announcements.important, color: '#ffb300' },
      ],
      icon: MegaphoneIcon,
      color: '#00acc1',
      bgColor: '#e0f7fa',
      path: '/admin/announcements',
    },
    {
      id: 'analyses',
      title: 'Analyses',
      count: stats.analyses.total,
      subCounts: [
        { label: 'Latex', value: stats.analyses.latex, color: '#2e7d32' },
        { label: 'Leaf', value: stats.analyses.leaf, color: '#43a047' },
        { label: 'Trunk', value: stats.analyses.trunk, color: '#ef6c00' },
      ],
      icon: AnalysisIcon,
      color: '#7b1fa2',
      bgColor: '#f3e5f5',
      path: '/admin/analysis-logs',
    },
    {
      id: 'messages',
      title: 'Contact Messages',
      count: stats.messages.total,
      subCounts: [
        { label: 'Unread', value: stats.messages.unread, color: '#e53935' },
        { label: 'Read', value: stats.messages.read, color: '#00acc1' },
      ],
      icon: InboxIcon,
      color: '#e53935',
      bgColor: '#ffebee',
      path: '/admin/contact-messages',
    },
    {
      id: 'reports',
      title: 'User Reports',
      count: stats.reports.total,
      subCounts: [
        { label: 'Pending', value: stats.reports.pending, color: '#ff9800' },
        { label: 'Resolved', value: stats.reports.resolved, color: '#4caf50' },
      ],
      icon: FlagIcon,
      color: '#ff9800',
      bgColor: '#fff8e1',
      path: '/admin/user-reports',
    },
  ];

  const fetchAllStats = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    setRefreshing(true);
    try {
      axios.defaults.headers.common.Authorization = `Bearer ${token}`;

      const [usersRes, announcementsRes, messagesAllRes, messagesUnreadRes, reportsStatsRes, analyticsRes] = await Promise.allSettled([
        axios.get(`${API_BASE_URL}/api/v1/users`),
        axios.get(`${API_BASE_URL}/api/v1/mail/admin/announcements/stats`),
        axios.get(`${API_BASE_URL}/api/v1/contact/admin`, { params: { status: 'all', page: 1, limit: 1 } }),
        axios.get(`${API_BASE_URL}/api/v1/contact/admin`, { params: { status: 'unread', page: 1, limit: 1 } }),
        axios.get(`${API_BASE_URL}/api/v1/admin/reports/stats`),
        axios.get(`${API_BASE_URL}/api/v1/admin/statistics`, { params: { timeRange } }),
      ]);

      const nextStats = cloneInitialStats();
      const nextAnalytics = cloneInitialAnalytics();

      if (usersRes.status === 'fulfilled' && usersRes.value?.data?.success) {
        const users = Array.isArray(usersRes.value.data.users) ? usersRes.value.data.users : [];
        const nonAdminUsers = users.filter((u) => u?.role !== 'admin');
        nextStats.users.total = nonAdminUsers.length;
        nextStats.users.active = nonAdminUsers.filter((u) => u?.isActive).length;
        nextStats.users.verified = nonAdminUsers.filter((u) => u?.isVerified).length;
      }

      if (announcementsRes.status === 'fulfilled' && announcementsRes.value?.data?.success) {
        const data = announcementsRes.value.data.data || {};
        nextStats.announcements.total = Number(data.total || 0);
        nextStats.announcements.published = Number(data.published || 0);
        nextStats.announcements.important = Number(data.important || 0);
      }

      const allMessagesTotal =
        messagesAllRes.status === 'fulfilled' && messagesAllRes.value?.data?.success
          ? Number(messagesAllRes.value.data.total || 0)
          : 0;
      const unreadMessagesTotal =
        messagesUnreadRes.status === 'fulfilled' && messagesUnreadRes.value?.data?.success
          ? Number(messagesUnreadRes.value.data.total || 0)
          : 0;
      nextStats.messages.total = allMessagesTotal;
      nextStats.messages.unread = unreadMessagesTotal;
      nextStats.messages.read = Math.max(allMessagesTotal - unreadMessagesTotal, 0);

      if (reportsStatsRes.status === 'fulfilled' && reportsStatsRes.value?.data?.success) {
        const reportData = reportsStatsRes.value.data.data || {};
        nextStats.reports.total = Number(reportData.total || 0);
        nextStats.reports.pending = Number(reportData.pending || 0);
        nextStats.reports.reviewed = Number(reportData.reviewed || 0);
        nextStats.reports.resolved = Number(reportData.resolved || 0);
        nextStats.reports.dismissed = Number(reportData.dismissed || 0);
      }

      if (analyticsRes.status === 'fulfilled' && analyticsRes.value?.data?.success) {
        const data = analyticsRes.value.data.data || {};
        nextStats.analyses.total = Number(data?.analyses?.total || 0);
        nextStats.analyses.latex = Number(data?.analyses?.byType?.latex || 0);
        nextStats.analyses.leaf = Number(data?.analyses?.byType?.leaf || 0);
        nextStats.analyses.trunk = Number(data?.analyses?.byType?.trunks || 0);

        nextAnalytics.recentActivity = Array.isArray(data.recentActivity) ? data.recentActivity : [];
        nextAnalytics.leafTopDiseases = Array.isArray(data?.leaf?.topDiseases) ? data.leaf.topDiseases : [];
        nextAnalytics.trunkTopConditions = Array.isArray(data?.trunks?.topConditions) ? data.trunks.topConditions : [];
        nextAnalytics.topUsers = Array.isArray(data.topUsers) ? data.topUsers : [];
        nextAnalytics.users.new = Number(data?.users?.new || 0);
        nextAnalytics.users.activityRate = Number(data?.users?.activityRate || 0);
        nextAnalytics.latex.avgQualityScore = Number(data?.latex?.avgQualityScore || 0);
        nextAnalytics.latex.avgDRC = Number(data?.latex?.avgDRC || 0);
        nextAnalytics.leaf.avgConfidence = Number(data?.leaf?.avgConfidence || 0);
        nextAnalytics.leaf.criticalCases = Number(data?.leaf?.criticalCases || 0);
        nextAnalytics.trunks.avgHealthScore = Number(data?.trunks?.avgHealthScore || 0);
        nextAnalytics.trunks.criticalTrees = Number(data?.trunks?.criticalTrees || 0);
      }

      setStats(nextStats);
      setAnalytics(nextAnalytics);
    } catch (error) {
      console.error('Error fetching dashboard statistics:', error);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      try {
        axios.defaults.headers.common.Authorization = `Bearer ${token}`;
        const response = await axios.get(`${API_BASE_URL}/api/v1/users/me`);
        if (response.data.success) {
          await fetchAllStats();
        } else {
          navigate('/login');
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

  useEffect(() => {
    if (!loading) fetchAllStats();
  }, [timeRange]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [slides.length]);

  if (loading) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh' }}>
        <LeftNavigationBar />
        <div className="dash-loading-wrap">
          <div className="dash-spinner" />
          <p>Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;700;900&family=DM+Sans:wght@300;400;500;600;700&display=swap"
        rel="stylesheet"
      />
      <div className="dash-root">
        <LeftNavigationBar />

        <div className="dash-main">
          <div className="dash-hero">
            {slides.map((slide, idx) => (
              <div key={slide.id} className={`dash-slide ${idx === currentSlide ? 'active' : ''}`}>
                <video autoPlay muted loop playsInline className="dash-slide-video">
                  <source src={slide.video} type="video/mp4" />
                </video>
                <div className="dash-overlay" />
                <div className="dash-overlay-soft" />
                <div className="dash-slide-copy">
                  <h1>{slide.title}</h1>
                  <p>{slide.description}</p>
                </div>
              </div>
            ))}

            <div className="dash-dot-wrap">
              {slides.map((slide, idx) => (
                <button
                  key={`dot-${slide.id}`}
                  className={`dash-dot ${idx === currentSlide ? 'active' : ''}`}
                  onClick={() => setCurrentSlide(idx)}
                />
              ))}
            </div>
          </div>

          <div className="dash-content">
            <div className="dash-header">
              <div>
                <h2>Admin Statistics Dashboard</h2>
                <p>Live metrics and trends for users, analyses, reports, and operations.</p>
              </div>
              <div className="dash-actions">
                <select value={timeRange} onChange={(e) => setTimeRange(e.target.value)} className="dash-range-select">
                  <option value="7days">Last 7 days</option>
                  <option value="30days">Last 30 days</option>
                  <option value="90days">Last 90 days</option>
                  <option value="year">Last 1 year</option>
                  <option value="all">All time</option>
                </select>
                <button onClick={fetchAllStats} className="dash-refresh-btn" disabled={refreshing}>
                  <RefreshIcon size={14} />
                  {refreshing ? 'Refreshing...' : 'Refresh'}
                </button>
              </div>
            </div>

            <div className="dash-stat-grid">
              {statCards.map((card) => {
                const IconComp = card.icon;
                return (
                  <div key={card.id} className="dash-stat-card" onClick={() => navigate(card.path)}>
                    <div className="dash-stat-line" style={{ background: card.color }} />
                    <div className="dash-stat-top">
                      <div>
                        <div className="dash-stat-title">{card.title}</div>
                        <div className="dash-stat-count">{Number(card.count || 0).toLocaleString()}</div>
                      </div>
                      <div className="dash-stat-icon" style={{ background: card.bgColor, color: card.color }}>
                        <IconComp size={24} />
                      </div>
                    </div>
                    <div className="dash-sub-counts">
                      {card.subCounts.map((sub) => (
                        <div key={`${card.id}-${sub.label}`} className="dash-sub-item">
                          <span className="dash-sub-dot" style={{ background: sub.color }} />
                          <span>{sub.label}</span>
                          <strong>{sub.value}</strong>
                        </div>
                      ))}
                    </div>
                    <div className="dash-details-link">
                      View details <ArrowRightIcon size={14} />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="dash-chart-grid">
              <div className="dash-chart-card">
                <div className="dash-chart-title">Recent Analysis Activity</div>
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={activityChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#546e7a' }} />
                    <YAxis tick={{ fontSize: 12, fill: '#546e7a' }} />
                    <Tooltip content={<DashboardTooltip />} />
                    <Legend />
                    <Area type="monotone" dataKey="latex" name="Latex" stackId="1" stroke="#2e7d32" fill="#81c784" />
                    <Area type="monotone" dataKey="leaf" name="Leaf" stackId="1" stroke="#43a047" fill="#a5d6a7" />
                    <Area type="monotone" dataKey="trunk" name="Trunk" stackId="1" stroke="#ef6c00" fill="#ffb74d" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="dash-chart-card">
                <div className="dash-chart-title">Analysis Mix</div>
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={analysisMixData.length ? analysisMixData : [{ name: 'No Data', value: 1, color: '#cfd8dc' }]}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={90}
                      paddingAngle={3}
                    >
                      {(analysisMixData.length ? analysisMixData : [{ color: '#cfd8dc' }]).map((entry, idx) => (
                        <Cell key={`mix-cell-${idx}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<DashboardTooltip />} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="dash-chart-card">
                <div className="dash-chart-title">Top Leaf Diseases</div>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={topDiseaseData.length ? topDiseaseData : [{ name: 'No Data', count: 0 }]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#546e7a' }} interval={0} angle={-12} textAnchor="end" height={55} />
                    <YAxis tick={{ fontSize: 12, fill: '#546e7a' }} />
                    <Tooltip content={<DashboardTooltip />} />
                    <Bar dataKey="count" fill="#ef5350" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="dash-chart-card">
                <div className="dash-chart-title">Report Status Distribution</div>
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={reportStatusData.length ? reportStatusData : [{ name: 'No Data', value: 1, color: '#cfd8dc' }]}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={95}
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {(reportStatusData.length ? reportStatusData : [{ color: '#cfd8dc' }]).map((entry, idx) => (
                        <Cell key={`report-cell-${idx}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<DashboardTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="dash-bottom-grid">
              <div className="dash-summary-card">
                <h3>Performance Snapshot</h3>
                <div className="dash-kpi-grid">
                  <div className="dash-kpi-item">
                    <span>New Users</span>
                    <strong>{analytics.users.new}</strong>
                  </div>
                  <div className="dash-kpi-item">
                    <span>User Activity Rate</span>
                    <strong>{analytics.users.activityRate}%</strong>
                  </div>
                  <div className="dash-kpi-item">
                    <span>Avg Latex Quality</span>
                    <strong>{analytics.latex.avgQualityScore}</strong>
                  </div>
                  <div className="dash-kpi-item">
                    <span>Avg Trunk Health</span>
                    <strong>{analytics.trunks.avgHealthScore}</strong>
                  </div>
                </div>
              </div>

              <div className="dash-summary-card">
                <h3>Top Active Users</h3>
                <div className="dash-user-list">
                  {(analytics.topUsers || []).slice(0, 5).map((entry) => (
                    <div key={entry._id} className="dash-user-row">
                      <div>
                        <div className="dash-user-name">{entry.name || 'Unknown User'}</div>
                        <div className="dash-user-email">{entry.email || 'No email'}</div>
                      </div>
                      <div className="dash-user-total">{entry.activity?.total || 0}</div>
                    </div>
                  ))}
                  {(!analytics.topUsers || analytics.topUsers.length === 0) && (
                    <div className="dash-empty">No user activity for this range.</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .dash-root {
          display: flex;
          min-height: 100vh;
          background: #f5f7fb;
          color: #263238;
          font-family: 'DM Sans', sans-serif;
        }

        .dash-main {
          flex: 1;
          min-width: 0;
          margin-left: 280px;
          background:
            radial-gradient(circle at 12% -8%, rgba(126, 211, 122, 0.26), transparent 26%),
            radial-gradient(circle at 100% 0%, rgba(255, 209, 128, 0.2), transparent 26%),
            #f5f7fb;
        }

        .dash-loading-wrap {
          flex: 1;
          margin-left: 280px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f5f7fb;
          font-family: 'DM Sans', sans-serif;
          color: #546e7a;
        }

        .dash-loading-wrap p {
          margin: 0;
          font-size: 0.95rem;
        }

        .dash-spinner {
          width: 52px;
          height: 52px;
          border-radius: 50%;
          border: 3px solid #dce6dc;
          border-top-color: #2e7d32;
          margin: 0 auto 14px;
          animation: dashSpin 0.9s linear infinite;
        }

        .dash-hero {
          position: relative;
          height: 410px;
          overflow: hidden;
          background: #0f2d1c;
        }

        .dash-slide {
          position: absolute;
          inset: 0;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.8s ease;
        }

        .dash-slide.active {
          opacity: 1;
          pointer-events: auto;
        }

        .dash-slide-video {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .dash-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(120deg, rgba(17, 51, 33, 0.82) 0%, rgba(17, 51, 33, 0.28) 48%, rgba(17, 51, 33, 0.6) 100%);
        }

        .dash-overlay-soft {
          position: absolute;
          inset: 0;
          background: linear-gradient(0deg, rgba(17, 51, 33, 0.82) 2%, rgba(17, 51, 33, 0) 56%);
        }

        .dash-slide-copy {
          position: absolute;
          left: clamp(24px, 6vw, 88px);
          right: clamp(24px, 6vw, 88px);
          bottom: 60px;
          z-index: 2;
          color: #ffffff;
          animation: dashHeroRise 0.75s ease;
        }

        .dash-slide-copy h1 {
          margin: 0 0 10px;
          font-family: 'Playfair Display', Georgia, serif;
          font-size: clamp(1.95rem, 3.8vw, 3.05rem);
          line-height: 1.14;
          letter-spacing: 0.2px;
          text-shadow: 0 6px 24px rgba(0, 0, 0, 0.35);
        }

        .dash-slide-copy p {
          margin: 0;
          max-width: 560px;
          font-size: clamp(0.9rem, 1.7vw, 1.08rem);
          color: rgba(255, 255, 255, 0.86);
          line-height: 1.6;
        }

        .dash-dot-wrap {
          position: absolute;
          left: clamp(24px, 6vw, 88px);
          bottom: 24px;
          display: flex;
          gap: 8px;
          z-index: 3;
        }

        .dash-dot {
          width: 8px;
          height: 8px;
          border: none;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.48);
          padding: 0;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .dash-dot.active {
          width: 32px;
          background: #79d266;
        }

        .dash-content {
          padding: 28px clamp(14px, 2.5vw, 34px) 40px;
        }

        .dash-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 12px 18px;
          flex-wrap: wrap;
          margin-bottom: 20px;
        }

        .dash-header h2 {
          margin: 0;
          color: #1b4332;
          font-family: 'Playfair Display', Georgia, serif;
          font-size: clamp(1.4rem, 2.2vw, 2rem);
        }

        .dash-header p {
          margin: 6px 0 0;
          color: #607d8b;
          font-size: 0.95rem;
        }

        .dash-actions {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .dash-range-select {
          border: 1px solid #d2dbe4;
          background: #ffffff;
          border-radius: 10px;
          padding: 9px 12px;
          color: #37474f;
          font-size: 0.86rem;
          outline: none;
          min-width: 145px;
        }

        .dash-range-select:focus {
          border-color: #66bb6a;
          box-shadow: 0 0 0 3px rgba(102, 187, 106, 0.18);
        }

        .dash-refresh-btn {
          border: none;
          border-radius: 10px;
          background: linear-gradient(135deg, #2e7d32, #1b5e20);
          color: #ffffff;
          font-size: 0.85rem;
          font-weight: 600;
          padding: 9px 13px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          cursor: pointer;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          box-shadow: 0 6px 16px rgba(27, 94, 32, 0.24);
        }

        .dash-refresh-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 9px 18px rgba(27, 94, 32, 0.3);
        }

        .dash-refresh-btn:disabled {
          opacity: 0.72;
          cursor: not-allowed;
          box-shadow: none;
        }

        .dash-stat-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 14px;
        }

        .dash-stat-card {
          position: relative;
          overflow: hidden;
          border-radius: 16px;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          padding: 15px 16px;
          box-shadow: 0 10px 22px rgba(15, 23, 42, 0.07);
          cursor: pointer;
          transition: transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease;
        }

        .dash-stat-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 16px 26px rgba(15, 23, 42, 0.12);
          border-color: #c8d5df;
        }

        .dash-stat-line {
          position: absolute;
          left: 0;
          top: 0;
          width: 4px;
          height: 100%;
          opacity: 0.6;
        }

        .dash-stat-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 10px;
        }

        .dash-stat-title {
          font-size: 0.8rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #64748b;
          margin-bottom: 6px;
        }

        .dash-stat-count {
          color: #263238;
          font-size: 1.95rem;
          font-weight: 700;
          line-height: 1.05;
        }

        .dash-stat-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .dash-sub-counts {
          margin-top: 13px;
          padding-top: 12px;
          border-top: 1px solid #e8edf3;
          display: flex;
          flex-wrap: wrap;
          gap: 10px 14px;
        }

        .dash-sub-item {
          display: flex;
          align-items: center;
          gap: 6px;
          color: #64748b;
          font-size: 0.8rem;
        }

        .dash-sub-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .dash-sub-item strong {
          color: #263238;
          font-size: 0.85rem;
        }

        .dash-details-link {
          margin-top: 12px;
          font-size: 0.74rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.35px;
          color: #78909c;
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }

        .dash-chart-grid {
          margin-top: 22px;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 16px;
        }

        .dash-chart-card {
          background: #ffffff;
          border-radius: 16px;
          border: 1px solid #e2e8f0;
          padding: 14px 14px 8px;
          box-shadow: 0 10px 20px rgba(15, 23, 42, 0.06);
          min-height: 320px;
        }

        .dash-chart-title {
          margin: 2px 2px 10px;
          color: #1e293b;
          font-size: 0.92rem;
          font-weight: 700;
          letter-spacing: 0.15px;
        }

        .dash-bottom-grid {
          margin-top: 16px;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 16px;
        }

        .dash-summary-card {
          background: #ffffff;
          border-radius: 16px;
          border: 1px solid #e2e8f0;
          padding: 18px;
          box-shadow: 0 10px 20px rgba(15, 23, 42, 0.06);
        }

        .dash-summary-card h3 {
          margin: 0 0 13px;
          color: #1e293b;
          font-size: 1rem;
          font-weight: 700;
        }

        .dash-kpi-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
        }

        .dash-kpi-item {
          border-radius: 12px;
          background: linear-gradient(145deg, #f8fafc, #eef3f8);
          border: 1px solid #e2e8f0;
          padding: 10px;
          min-height: 72px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 4px;
        }

        .dash-kpi-item span {
          color: #607d8b;
          font-size: 0.77rem;
          font-weight: 500;
        }

        .dash-kpi-item strong {
          color: #1f2937;
          font-size: 1.22rem;
          line-height: 1;
        }

        .dash-user-list {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .dash-user-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          border-bottom: 1px solid #eef2f6;
          padding: 8px 0;
        }

        .dash-user-row:last-child {
          border-bottom: none;
        }

        .dash-user-name {
          color: #1f2937;
          font-size: 0.9rem;
          font-weight: 600;
        }

        .dash-user-email {
          color: #78909c;
          font-size: 0.75rem;
          margin-top: 2px;
          max-width: 220px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .dash-user-total {
          min-width: 44px;
          text-align: center;
          color: #1b5e20;
          font-size: 0.88rem;
          font-weight: 700;
          border-radius: 999px;
          border: 1px solid #cde7cf;
          background: #e8f5e9;
          padding: 5px 9px;
        }

        .dash-empty {
          color: #78909c;
          font-size: 0.86rem;
          padding: 10px 0 4px;
        }

        .dash-tooltip {
          background: rgba(17, 24, 39, 0.95);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 10px;
          padding: 8px 10px;
          min-width: 150px;
          color: #ffffff;
          font-size: 0.78rem;
          box-shadow: 0 8px 20px rgba(2, 6, 23, 0.38);
        }

        .dash-tooltip-title {
          font-size: 0.74rem;
          color: rgba(255, 255, 255, 0.66);
          margin-bottom: 6px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.12);
          padding-bottom: 6px;
        }

        .dash-tooltip-row {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-top: 4px;
        }

        .dash-tooltip-row strong {
          margin-left: auto;
          font-size: 0.8rem;
        }

        .dash-tooltip-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        @keyframes dashSpin {
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes dashHeroRise {
          from {
            opacity: 0;
            transform: translateY(14px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (max-width: 1100px) {
          .dash-main,
          .dash-loading-wrap {
            margin-left: 268px;
          }

          .dash-hero {
            height: 360px;
          }
        }

        @media (max-width: 900px) {
          .dash-main,
          .dash-loading-wrap {
            margin-left: 0;
          }

          .dash-hero {
            height: 320px;
          }

          .dash-content {
            padding-top: 18px;
          }
        }

        @media (max-width: 680px) {
          .dash-chart-grid {
            grid-template-columns: 1fr;
          }

          .dash-stat-grid {
            grid-template-columns: 1fr;
          }

          .dash-kpi-grid {
            grid-template-columns: 1fr;
          }

          .dash-slide-copy {
            bottom: 56px;
          }
        }
      `}</style>
    </>
  );
};

export default Dashboard;
