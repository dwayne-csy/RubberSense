import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import {
  Box, Container, Typography, Card, CardActionArea,
  Grid, CircularProgress, Alert, Chip,
  Button, TextField, InputAdornment, MenuItem, Select,
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Assessment as AssessmentIcon,
  CheckCircle as CheckCircleIcon,
  ScienceOutlined as ScienceIcon,
  GrassOutlined as LeafIcon,
  ParkOutlined as TreeIcon,
  ArrowForwardIos as ArrowForwardIcon,
  Search as SearchIcon,
  Sort as SortIcon,
  CalendarToday as CalendarIcon,
  BarChart as BarChartIcon,
  Timeline as TimelineIcon,
} from '@mui/icons-material';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// Lucide icons matching Notifications page
import {
  Bell, RefreshCw, CheckCheck, Leaf, X, Calendar, Clock,
  Loader2, AlertTriangle, FileText, ChevronRight, BarChart3, Activity
} from 'lucide-react';

import UserHeader from '../layouts/UserHeader';
import UserFooter from '../layouts/UserFooter';

/* ─────────────────────────────────────────────── */
/* API Setup                                        */
/* ─────────────────────────────────────────────── */
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4001';

/* ─────────────────────────────────────────────── */
/* Theme palette                                    */
/* ─────────────────────────────────────────────── */
const COLORS = {
  Latex:  { primary: '#00c853', bg: 'rgba(0,200,83,0.12)',  bgSolid: '#00c853' },
  Leaf:   { primary: '#29b6f6', bg: 'rgba(41,182,246,0.12)', bgSolid: '#29b6f6' },
  Trunks: { primary: '#ffa726', bg: 'rgba(255,167,38,0.12)', bgSolid: '#ffa726' },
};

/* ─────────────────────────────────────────────── */
/* Circular confidence ring                        */
/* ─────────────────────────────────────────────── */
const ConfidenceRing = ({ value, color }) => (
  <Box sx={{ position: 'relative', display: 'inline-flex' }}>
    <CircularProgress variant="determinate" value={100} size={44} thickness={4} sx={{ color: 'rgba(255,255,255,0.12)' }} />
    <CircularProgress variant="determinate" value={value || 0} size={44} thickness={4}
      sx={{ color, position: 'absolute', left: 0, '& .MuiCircularProgress-circle': { strokeLinecap: 'round' } }}
    />
    <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Typography sx={{ fontWeight: 900, fontSize: '0.6rem', color: '#fff' }}>
        {value ? `${Math.round(value)}%` : 'N/A'}
      </Typography>
    </Box>
  </Box>
);

/* ─────────────────────────────────────────────── */
/* Main Component                                  */
/* ─────────────────────────────────────────────── */
const AnalysisHistory = () => {
  const [history, setHistory]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [tabValue, setTabValue]   = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState('newest');
  const [exportingPdf, setExportingPdf] = useState(false);
  const navigate = useNavigate();

  useEffect(() => { fetchAllHistory(); }, []);

  const fetchAllHistory = async () => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }
    try {
      setLoading(true);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      const [latexRes, leafRes, trunksRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/v1/latex/history`).catch(() => ({ data: [] })),
        axios.get(`${API_BASE_URL}/api/v1/leaf/history`).catch(() => ({ data: [] })),
        axios.get(`${API_BASE_URL}/api/v1/trunks/history`).catch(() => ({ data: [] })),
      ]);
      const extract = (res) => {
        if (!res?.data) return [];
        if (Array.isArray(res.data)) return res.data;
        return res.data.data || res.data.analyses || res.data.history || [];
      };
      const combined = [
        ...extract(latexRes).map(i => ({ ...i, type: 'Latex',  analysisId: i._id || i.id })),
        ...extract(leafRes).map(i  => ({ ...i, type: 'Leaf',   analysisId: i._id || i.id })),
        ...extract(trunksRes).map(i=> ({ ...i, type: 'Trunks', analysisId: i._id || i.id })),
      ];
      setHistory(combined);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to fetch analysis history');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (analysis) => {
    navigate(`/analysis/${analysis.type.toLowerCase()}/${analysis.analysisId}`, { state: { analysis } });
  };

  const fmt = (d) => new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  const fmtFull = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const filteredHistory = useMemo(() => {
    let r = history;
    if (tabValue === 1) r = r.filter(h => h.type === 'Latex');
    else if (tabValue === 2) r = r.filter(h => h.type === 'Leaf');
    else if (tabValue === 3) r = r.filter(h => h.type === 'Trunks');
    if (searchTerm) {
      const t = searchTerm.toLowerCase();
      r = r.filter(h =>
        (h.analysisId && h.analysisId.toLowerCase().includes(t)) ||
        (h.quality && h.quality.toLowerCase().includes(t)) ||
        (h.status && h.status.toLowerCase().includes(t))
      );
    }
    return [...r].sort((a, b) => sortOrder === 'newest'
      ? new Date(b.createdAt) - new Date(a.createdAt)
      : new Date(a.createdAt) - new Date(b.createdAt)
    );
  }, [history, tabValue, searchTerm, sortOrder]);

  const getSummaryText = (analysis) =>
    analysis.result?.recommendation ||
    analysis.result?.primaryDiagnose ||
    analysis.result?.qualityClass ||
    'Standard analysis recorded.';

  const handleExportPdf = () => {
    if (!filteredHistory.length || exportingPdf) return;

    setExportingPdf(true);
    try {
      const filterName = tabValue === 1 ? 'Latex' : tabValue === 2 ? 'Leaf' : tabValue === 3 ? 'Trunks' : 'All';
      const generatedAt = new Date();
      const fileDate = generatedAt.toISOString().slice(0, 10);

      const doc = new jsPDF({ orientation: 'landscape' });
      doc.setFontSize(16);
      doc.text('RubberSense Recent Analysis Report', 14, 16);
      doc.setFontSize(10);
      doc.text(`Generated: ${generatedAt.toLocaleString()}`, 14, 23);
      doc.text(
        `Filter: ${filterName}  |  Search: ${searchTerm || 'None'}  |  Sort: ${sortOrder}  |  Records: ${filteredHistory.length}`,
        14,
        29
      );

      const rows = filteredHistory.map((analysis, index) => [
        index + 1,
        analysis.type || 'N/A',
        fmtFull(analysis.createdAt),
        analysis.status || 'Completed',
        analysis.quality || analysis.result?.qualityClass || 'N/A',
        analysis.confidence ? `${Math.round(analysis.confidence)}%` : 'N/A',
        (analysis.analysisId || analysis._id || analysis.id || 'N/A').toString().substring(0, 18),
        getSummaryText(analysis),
      ]);

      autoTable(doc, {
        startY: 36,
        head: [['#', 'Type', 'Date', 'Status', 'Quality', 'Confidence', 'Analysis ID', 'Insight']],
        body: rows,
        styles: { fontSize: 8, cellPadding: 2, valign: 'top' },
        headStyles: { fillColor: [45, 106, 79], textColor: [255, 255, 255] },
        columnStyles: {
          0: { cellWidth: 10 },
          1: { cellWidth: 20 },
          2: { cellWidth: 38 },
          3: { cellWidth: 25 },
          4: { cellWidth: 24 },
          5: { cellWidth: 22 },
          6: { cellWidth: 36 },
          7: { cellWidth: 'auto' },
        },
      });

      doc.save(`analysis-history-${filterName.toLowerCase()}-${fileDate}.pdf`);
    } finally {
      setExportingPdf(false);
    }
  };

  /* stats for hero */
  const totalScans   = history.length;
  const latestDate   = history.length ? fmt(history.reduce((a, b) => new Date(a.createdAt) > new Date(b.createdAt) ? a : b).createdAt) : '—';
  const typeCounts   = { Latex: 0, Leaf: 0, Trunks: 0 };
  history.forEach(h => { if (typeCounts[h.type] !== undefined) typeCounts[h.type]++; });
  const topType      = Object.entries(typeCounts).sort((a,b) => b[1]-a[1])[0]?.[0] || '—';
  const tabCounts    = [history.length, typeCounts.Latex, typeCounts.Leaf, typeCounts.Trunks];

  const TABS = [
    { label: 'All',    val: 0, icon: null,                                       color: '#455a64' },
    { label: 'Latex',  val: 1, icon: <ScienceIcon sx={{ fontSize: 17 }} />,      color: COLORS.Latex.primary },
    { label: 'Leaf',   val: 2, icon: <LeafIcon sx={{ fontSize: 17 }} />,         color: COLORS.Leaf.primary  },
    { label: 'Trunks', val: 3, icon: <TreeIcon sx={{ fontSize: 17 }} />,         color: COLORS.Trunks.primary},
  ];

  /* ───── Page ───── */
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,600;0,700;1,400&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&display=swap');
        @keyframes fadeIn    { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp   { from { opacity: 0; transform: translateY(16px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes spin      { to { transform: rotate(360deg) } }
        @keyframes heroFloat { 0%,100% { transform: translateY(0px) rotate(-2deg) } 50% { transform: translateY(-8px) rotate(2deg) } }
        @keyframes pulse     { 0%,100% { opacity: 1 } 50% { opacity: 0.5 } }
        *, *::before, *::after { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #f4f9f4; }
        ::-webkit-scrollbar-thumb { background: #b7e4c7; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: #74c69d; }
      `}</style>

      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#f4f9f4', fontFamily: "'DM Sans', sans-serif" }}>
        <UserHeader />

        {/* Hero Banner */}
        <div style={{
          background: 'linear-gradient(135deg, #0d2818 0%, #1b4332 55%, #2d6a4f 100%)',
          padding: '48px 24px 60px', position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', right: '-40px', top: '-30px', width: '260px', height: '260px', borderRadius: '50%', background: 'rgba(82,183,136,0.08)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', right: '80px',  bottom: '-60px', width: '180px', height: '180px', borderRadius: '50%', background: 'rgba(52,143,96,0.1)',   pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', left: '-20px',  bottom: '-40px', width: '140px', height: '140px', borderRadius: '50%', background: 'rgba(163,209,141,0.06)', pointerEvents: 'none' }} />

          <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
              <div style={{
                width: '58px', height: '58px', borderRadius: '16px',
                backgroundColor: 'rgba(255,255,255,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '1.5px solid rgba(255,255,255,0.15)',
                animation: 'heroFloat 4s ease-in-out infinite',
              }}>
                <BarChart3 size={28} color="#74c69d" strokeWidth={1.75} />
              </div>
              <div>
                <h1 style={{ fontSize: '28px', fontWeight: '700', color: 'white', margin: 0, fontFamily: "'Lora', serif" }}>
                  Analysis History
                </h1>
                <p style={{ fontSize: '14px', color: '#74c69d', margin: '5px 0 0', letterSpacing: '0.2px' }}>
                  Track quality, health, and maturity of your rubber tree plantations.
                </p>
              </div>
            </div>

            {/* Stats + Actions */}
            <div style={{ display: 'flex', gap: '12px', marginTop: '32px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                {[
                  { icon: BarChartIcon,    value: totalScans,    label: 'Total Scans',   color: '#b7e4c7' },
                  { icon: CalendarIcon,    value: latestDate,    label: 'Latest Scan',   color: '#ffd166' },
                  { icon: Activity,        value: topType,       label: 'Top Category', color: '#74c69d' },
                ].map(({ icon: Icon, value, label, color }) => (
                  <div key={label} style={{
                    backgroundColor: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: '12px', padding: '14px 20px',
                    display: 'flex', alignItems: 'center', gap: '12px', minWidth: '120px',
                  }}>
                    <Icon size={18} color={color} />
                    <div>
                      <div style={{ fontSize: '20px', fontWeight: '700', color: 'white', lineHeight: 1.1, fontFamily: "'Lora', serif" }}>{value}</div>
                      <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginTop: '1px' }}>{label}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button
                  onClick={fetchAllHistory}
                  disabled={loading}
                  style={{
                    padding: '10px 18px',
                    backgroundColor: 'rgba(255,255,255,0.12)',
                    color: 'white', border: '1.5px solid rgba(255,255,255,0.2)',
                    borderRadius: '10px', cursor: 'pointer',
                    fontSize: '13px', fontWeight: '600',
                    display: 'flex', alignItems: 'center', gap: '7px',
                    fontFamily: "'DM Sans', sans-serif",
                    opacity: loading ? 0.6 : 1,
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.12)'}
                >
                  <RefreshCw size={13} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
                  {loading ? 'Loading…' : 'Refresh'}
                </button>

                <button
                  onClick={handleExportPdf}
                  disabled={loading || exportingPdf || filteredHistory.length === 0}
                  style={{
                    padding: '10px 18px',
                    backgroundColor: 'rgba(116,198,157,0.22)',
                    color: 'white', border: '1.5px solid rgba(116,198,157,0.4)',
                    borderRadius: '10px',
                    cursor: loading || exportingPdf || filteredHistory.length === 0 ? 'not-allowed' : 'pointer',
                    fontSize: '13px', fontWeight: '600',
                    display: 'flex', alignItems: 'center', gap: '7px',
                    fontFamily: "'DM Sans', sans-serif",
                    opacity: loading || exportingPdf || filteredHistory.length === 0 ? 0.6 : 1,
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => {
                    if (!loading && !exportingPdf && filteredHistory.length > 0) {
                      e.currentTarget.style.backgroundColor = 'rgba(116,198,157,0.32)';
                    }
                  }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'rgba(116,198,157,0.22)'; }}
                >
                  {exportingPdf
                    ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />
                    : <FileText size={13} />}
                  {exportingPdf ? 'Exporting PDF…' : 'Export PDF'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <Box sx={{ flex: 1, pb: '120px', pt: '24px' }}>
          <Container maxWidth="lg">

            {/* ── Loading skeleton ── */}
            {loading && (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 12, gap: 2 }}>
                <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                  <CircularProgress size={56} thickness={3} sx={{ color: '#b7e4c7' }} />
                  <CircularProgress size={56} thickness={3} sx={{ color: '#2d6a4f', position: 'absolute', left: 0, animation: 'spin 1.5s linear infinite' }} />
                </Box>
                <Typography sx={{ color: '#2d6a4f', fontWeight: 600, letterSpacing: 0.5, fontFamily: "'DM Sans', sans-serif" }}>
                  Loading insights…
                </Typography>
              </Box>
            )}

            {/* ── Content (only shown when not loading) ── */}
            {!loading && (
              <>
                {/* Filter toolbar */}
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                  <Box sx={{
                    display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 2, mb: 4,
                    bgcolor: 'white',
                    border: '1px solid #e0ede4',
                    borderRadius: '16px', p: 2,
                    boxShadow: '0 4px 24px rgba(27,67,50,0.08)',
                  }}>
                    <Box sx={{ display: 'flex', gap: 1, flex: 1, overflowX: 'auto', '&::-webkit-scrollbar': { display: 'none' } }}>
                      {TABS.map(tab => {
                        const active = tabValue === tab.val;
                        return (
                          <Box
                            key={tab.val}
                            onClick={() => setTabValue(tab.val)}
                            sx={{
                              display: 'flex', alignItems: 'center', gap: 0.8,
                              px: 2, py: 1, borderRadius: '10px', cursor: 'pointer', whiteSpace: 'nowrap',
                              bgcolor: active ? '#52b788' : 'transparent',
                              color: active ? '#fff' : '#6b705c',
                              border: active ? 'none' : '1px solid #e9f0eb',
                              fontWeight: 700, fontSize: '0.88rem',
                              transition: 'all 0.2s ease',
                              boxShadow: active ? '0 4px 16px rgba(82,183,136,0.35)' : 'none',
                              '&:hover': { color: '#fff', bgcolor: active ? '#52b788' : '#f0faf3' },
                            }}
                          >
                            {tab.icon}
                            {tab.label}
                            <Box sx={{
                              ml: 0.5, px: 0.9, py: 0.1, borderRadius: '6px', fontSize: '0.7rem', fontWeight: 800,
                              bgcolor: active ? 'rgba(255,255,255,0.25)' : 'rgba(82,183,136,0.15)',
                              color: active ? '#fff' : '#2d6a4f',
                            }}>
                              {tabCounts[tab.val]}
                            </Box>
                          </Box>
                        );
                      })}
                    </Box>

                    <Box sx={{ display: 'flex', gap: 1.5, width: { xs: '100%', md: 'auto' } }}>
                      <TextField
                        size="small"
                        placeholder="Search…"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        InputProps={{
                          startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: '#a3b18a', fontSize: 18 }} /></InputAdornment>,
                          sx: {
                            borderRadius: '10px', bgcolor: '#f4f9f4',
                            color: '#1b4332', fontSize: '0.9rem',
                            '& fieldset': { borderColor: '#e9f0eb' },
                            '&:hover fieldset': { borderColor: '#b7e4c7 !important' },
                          }
                        }}
                        sx={{ minWidth: 180, input: { color: '#1b4332' } }}
                      />
                      <Select
                        size="small"
                        value={sortOrder}
                        onChange={e => setSortOrder(e.target.value)}
                        startAdornment={<InputAdornment position="start"><SortIcon sx={{ color: '#a3b18a', fontSize: 18 }} /></InputAdornment>}
                        sx={{
                          borderRadius: '10px', bgcolor: '#f4f9f4', color: '#1b4332', fontWeight: 600, minWidth: 155,
                          '& fieldset': { borderColor: '#e9f0eb' },
                          '& .MuiSvgIcon-root': { color: '#a3b18a' },
                        }}
                      >
                        <MenuItem value="newest" sx={{ fontWeight: 600 }}>Newest First</MenuItem>
                        <MenuItem value="oldest" sx={{ fontWeight: 600 }}>Oldest First</MenuItem>
                      </Select>
                    </Box>
                  </Box>
                </motion.div>

                {/* Error */}
                <AnimatePresence>
                  {error && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                      <Alert severity="error" sx={{ mb: 3, borderRadius: 2, bgcolor: 'rgba(244,67,54,0.1)', color: '#ef9a9a', border: '1px solid rgba(244,67,54,0.2)' }}>{error}</Alert>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Empty state */}
                {filteredHistory.length === 0 ? (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <Box sx={{ py: 12, textAlign: 'center', bgcolor: 'white', borderRadius: '20px', border: '1px solid #e0ede4', boxShadow: '0 4px 24px rgba(27,67,50,0.08)' }}>
                      <AssessmentIcon sx={{ fontSize: 72, color: 'rgba(45,106,79,0.15)', mb: 2 }} />
                      <Typography variant="h5" sx={{ color: '#1b4332', fontWeight: 800, mb: 1, fontFamily: "'Lora', serif" }}>No Records Found</Typography>
                      <Typography sx={{ color: '#6b705c', mb: 4, maxWidth: 380, overflow: 'hidden' }}>
                        {searchTerm ? 'Try a different search term.' : "No analyses found for this category."}
                      </Typography>
                      {tabValue === 0 && !searchTerm && (
                        <Link to="/home" style={{ textDecoration: 'none' }}>
                          <Button variant="contained" sx={{
                            bgcolor: '#2d6a4f', color: '#fff', fontWeight: 800, px: 4, py: 1.5, borderRadius: '12px',
                            textTransform: 'none', fontSize: '0.95rem',
                            boxShadow: '0 8px 24px rgba(45,106,79,0.35)',
                            '&:hover': { bgcolor: '#1b4332', transform: 'translateY(-2px)', boxShadow: '0 12px 32px rgba(45,106,79,0.45)' },
                            transition: 'all 0.2s'
                          }}>Start New Analysis</Button>
                        </Link>
                      )}
                    </Box>
                  </motion.div>

                ) : (
                  /* Card grid */
                  <Grid container spacing={3}>
                    <AnimatePresence>
                      {filteredHistory.map((analysis, index) => {
                        const c = COLORS[analysis.type] || { primary: '#9e9e9e', bg: 'rgba(158,158,158,0.1)' };
                        const imgSrc = analysis.imageUrl || analysis.image
                          ? (analysis.imageUrl || analysis.image).startsWith('http')
                            ? (analysis.imageUrl || analysis.image)
                            : `${API_BASE_URL}/${analysis.imageUrl || analysis.image}`
                          : null;

                        return (
                          <Grid item xs={12} sm={6} md={4} key={`${analysis.type}-${analysis.analysisId}`} sx={{ display: 'flex' }}>
                            <motion.div
                              layout
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                              transition={{ duration: 0.3, delay: index * 0.05 }}
                              style={{ width: '100%' }}
                            >
                              <Card
                                elevation={0}
                                sx={{
                                  width: '100%',
                                  maxWidth: '100%',
                                  display: 'flex', flexDirection: 'column',
                                  borderRadius: '20px',
                                  bgcolor: 'white',
                                  border: '1px solid #e0ede4',
                                  boxShadow: '0 4px 24px rgba(27,67,50,0.08)',
                                  transition: 'all 0.3s cubic-bezier(0.25,0.8,0.25,1)',
                                  '&:hover': {
                                    transform: 'translateY(-6px)',
                                    border: `1px solid ${c.primary}55`,
                                    boxShadow: `0 20px 56px rgba(27,67,50,0.15), 0 0 0 1px ${c.primary}20`,
                                  }
                                }}
                              >
                                <CardActionArea onClick={() => handleViewDetails(analysis)} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', height: '100%' }}>

                                  {/* Cover image */}
                                  <Box sx={{ position: 'relative', width: '100%', pt: '58%', overflow: 'hidden', flexShrink: 0, bgcolor: '#f4f9f4' }}>
                                    {imgSrc ? (
                                      <img
                                        src={imgSrc}
                                        alt={`${analysis.type} analysis`}
                                        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                                        onError={e => { e.target.style.display = 'none'; }}
                                      />
                                    ) : (
                                      <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#f4f9f4' }}>
                                        <AssessmentIcon sx={{ fontSize: 56, color: 'rgba(45,106,79,0.15)' }} />
                                      </Box>
                                    )}

                                    <Box sx={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.5) 100%)' }} />

                                    {/* type badge top-left */}
                                    <Box sx={{
                                      position: 'absolute', top: 14, left: 14,
                                      display: 'flex', alignItems: 'center', gap: 0.8,
                                      bgcolor: 'rgba(255,255,255,0.95)',
                                      border: `1px solid ${c.primary}40`,
                                      borderRadius: '8px', px: 1.2, py: 0.5,
                                    }}>
                                      <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: c.primary, boxShadow: `0 0 6px ${c.primary}` }} />
                                      <Typography sx={{ color: '#1b4332', fontWeight: 800, fontSize: '0.75rem', letterSpacing: 0.5 }}>
                                        {analysis.type}
                                      </Typography>
                                    </Box>

                                    {/* confidence ring top-right */}
                                    {analysis.confidence && (
                                      <Box sx={{ position: 'absolute', top: 12, right: 14 }}>
                                        <ConfidenceRing value={analysis.confidence} color={c.primary} />
                                      </Box>
                                    )}

                                    {/* date bottom-left on image */}
                                    <Typography sx={{ position: 'absolute', bottom: 10, left: 14, color: 'rgba(255,255,255,0.85)', fontSize: '0.72rem', fontWeight: 600, letterSpacing: 0.5, textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>
                                      {fmtFull(analysis.createdAt)}
                                    </Typography>
                                  </Box>

                                  {/* Card body */}
                                  <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', p: 2.5, gap: 1.5 }}>

                                    {/* Title + status */}
                                    <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1 }}>
                                      <Typography variant="h6" sx={{ fontWeight: 800, color: '#1b4332', lineHeight: 1.2, fontFamily: "'Lora', serif" }}>
                                        {analysis.type} Analysis
                                      </Typography>
                                      <Chip
                                        label={analysis.status || 'Completed'}
                                        size="small"
                                        icon={<CheckCircleIcon sx={{ fontSize: '13px !important', color: `${c.primary} !important` }} />}
                                        sx={{ bgcolor: c.bg, color: c.primary, fontWeight: 700, fontSize: '0.68rem', height: 22, flexShrink: 0, '& .MuiChip-label': { px: 1 } }}
                                      />
                                    </Box>

                                    {/* quality chip */}
                                    {analysis.quality && (
                                      <Box>
                                        <Chip
                                          label={analysis.quality}
                                          size="small"
                                          sx={{ bgcolor: '#f4f9f4', color: '#2d6a4f', border: '1px solid #b7e4c7', fontWeight: 700, fontSize: '0.7rem', height: 22 }}
                                        />
                                      </Box>
                                    )}

                                    {/* insight quote */}
                                    <Box sx={{ flex: 1, pl: 1.5, borderLeft: `2px solid ${c.primary}40` }}>
                                      <Typography sx={{ color: '#6b705c', fontSize: '0.82rem', fontStyle: 'italic', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.5 }}>
                                        {getSummaryText(analysis)}
                                      </Typography>
                                    </Box>

                                    {/* footer */}
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pt: 1.5, borderTop: '1px solid #e9f0eb', mt: 'auto' }}>
                                      <Typography sx={{ color: '#a3b18a', fontFamily: 'monospace', fontSize: '0.72rem', fontWeight: 600 }}>
                                        {(analysis._id || analysis.analysisId || '').substring(0, 10)}
                                      </Typography>
                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: c.primary, fontWeight: 800, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                        View Report <ArrowForwardIcon sx={{ fontSize: 11 }} />
                                      </Box>
                                    </Box>
                                  </Box>
                                </CardActionArea>
                              </Card>
                            </motion.div>
                          </Grid>
                        );
                      })}
                    </AnimatePresence>
                  </Grid>
                )}
              </>
            )}
          </Container>
        </Box>

        <UserFooter />
      </div>
    </>
  );
};

export default AnalysisHistory;

