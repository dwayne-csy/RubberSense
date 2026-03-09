
import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import {
  Box, Container, Typography, Grid, Chip,
  CircularProgress, Button, Alert, LinearProgress,
} from '@mui/material';
import { motion } from 'framer-motion';
import {
  ArrowBack as ArrowBackIcon,
  Science as ScienceIcon,
  WarningAmber as WarningIcon,
  CheckCircle as CheckCircleIcon,
  TipsAndUpdates as IdeasIcon,
  MonetizationOn as MoneyIcon,
  Info as InfoIcon,
  LocalFlorist as LeafIcon,
  Park as TreeIcon,
  Assessment as AssessmentIcon,
  Biotech as BiotechIcon,
  AccessTime as AccessTimeIcon,
  Opacity as OpacityIcon,
  TipsAndUpdates,
  FiberManualRecord as DotIcon,
} from '@mui/icons-material';

// Lucide icons
import {
  BarChart3, Activity, Calendar, FileText, ChevronRight
} from 'lucide-react';

import UserHeader from '../layouts/UserHeader';
import UserFooter from '../layouts/UserFooter';

/* ─── Design tokens - Light Green Theme ─── */
const LIGHT_BG     = '#f4f9f4';
const WHITE_BG     = '#ffffff';
const CARD_BG      = '#ffffff';
const CARD_BORDER  = '#e0ede4';
const TEXT_MUTED   = '#6b705c';
const TEXT_SEC     = '#1b4332';
const ACCENT_COLOR = '#52b788';

const TYPE_MAP = {
  latex:  { color: '#00c853', label: 'Latex'  },
  leaf:   { color: '#29b6f6', label: 'Leaf'   },
  trunks: { color: '#ffa726', label: 'Trunks' },
};

/* ─── Helpers ─── */
const safeStr = (v) => (v === null || v === undefined) ? '—' : String(v);

const severityColor = (val) => {
  const v = safeStr(val).toLowerCase();
  if (/high|excellent|healthy|good/.test(v))            return '#00c853';
  if (/medium|warning|fair/.test(v))                    return '#ffa726';
  if (/low|poor|infected|critical/.test(v))             return '#f44336';
  return '#78909c';
};

/* ─── Sub-components ─── */
const LightCard = ({ children, sx = {} }) => (
  <Box sx={{ bgcolor: CARD_BG, borderRadius: '16px', border: `1px solid ${CARD_BORDER}`, boxShadow: '0 4px 24px rgba(27,67,50,0.08)', overflow: 'hidden', ...sx }}>
    {children}
  </Box>
);

const CardHead = ({ icon, title, color }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 3, py: 2.5, borderBottom: `1px solid ${CARD_BORDER}` }}>
    <Box sx={{ display: 'flex', p: 0.8, borderRadius: '10px', bgcolor: `${color}15` }}>
      {React.cloneElement(icon, { sx: { color, fontSize: 20 } })}
    </Box>
    <Typography variant="h6" sx={{ fontWeight: 800, color: TEXT_SEC, fontSize: '1rem' }}>{title}</Typography>
  </Box>
);

const MetricRow = ({ label, value, chip = false, progress = null, color }) => {
  const display    = safeStr(value);
  const chipColor  = color || severityColor(display);
  const safeP      = (progress != null && !isNaN(+progress)) ? Math.min(Math.max(+progress, 0), 100) : null;
  return (
    <Box sx={{ py: 1.5, borderBottom: `1px solid ${CARD_BORDER}` }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: safeP != null ? 0.8 : 0 }}>
        <Typography sx={{ color: TEXT_MUTED, fontSize: '0.85rem', flexShrink: 0, pr: 1 }}>{label}</Typography>
        {chip
          ? <Chip label={display} size="small" sx={{ bgcolor: `${chipColor}15`, color: chipColor, fontWeight: 700, fontSize: '0.72rem', height: 22, border: `1px solid ${chipColor}30` }} />
          : <Typography sx={{ color: TEXT_SEC, fontWeight: 700, fontSize: '0.88rem', textAlign: 'right', maxWidth: '55%', wordBreak: 'break-word' }}>{display}</Typography>
        }
      </Box>
      {safeP != null && (
        <LinearProgress variant="determinate" value={safeP}
          sx={{ height: 5, borderRadius: 3, bgcolor: '#f4f9f4', '& .MuiLinearProgress-bar': { bgcolor: chipColor, borderRadius: 3 } }}
        />
      )}
    </Box>
  );
};

const ResultSection = ({ title, icon, color, children }) => (
  <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
    <LightCard sx={{ mb: 2, borderLeft: `3px solid ${color}` }}>
      <CardHead icon={icon} title={title} color={color} />
      <Box sx={{ px: 3, pb: 1 }}>{children}</Box>
    </LightCard>
  </motion.div>
);

const ConfGauge = ({ value, color, size = 80 }) => (
  <Box sx={{ position: 'relative', display: 'inline-flex' }}>
    <CircularProgress variant="determinate" value={100} size={size} thickness={4} sx={{ color: '#e0ede4' }} />
    <CircularProgress variant="determinate" value={value || 0} size={size} thickness={4}
      sx={{ color, position: 'absolute', left: 0, '& .MuiCircularProgress-circle': { strokeLinecap: 'round' } }} />
    <Box sx={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <Typography sx={{ fontWeight: 900, color: TEXT_SEC, fontSize: size > 60 ? '1.05rem' : '0.7rem', lineHeight: 1 }}>
        {value ? `${Math.round(value)}%` : '—'}
      </Typography>
      <Typography sx={{ color: TEXT_MUTED, fontSize: '0.5rem', fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase' }}>conf.</Typography>
    </Box>
  </Box>
);

/* ─── Main ─── */
const AnalysisDetails = () => {
  const { type, id } = useParams();
  const location     = useLocation();
  const navigate     = useNavigate();
  const [analysis, setAnalysis] = useState(location.state?.analysis || null);
  const [loading, setLoading]   = useState(!location.state?.analysis);
  const [error, setError]       = useState('');
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4001';

  useEffect(() => { if (!analysis) fetchDetails(); }, [type, id]);

  const fetchDetails = async () => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }
    try {
      setLoading(true);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      const ep = { latex: 'latex', leaf: 'leaf', trunks: 'trunks' }[type];
      if (!ep) throw new Error('Invalid type');
      const res  = await axios.get(`${API_BASE_URL}/api/v1/${ep}/analysis/${id}`);
      const data = res.data.analysis || res.data.data || res.data;
      setAnalysis({ ...data, type: type.charAt(0).toUpperCase() + type.slice(1) });
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load analysis');
    } finally {
      setLoading(false);
    }
  };

  /* ── Loading ── */
  if (loading) return (
    <Box sx={{ minHeight: '100vh', bgcolor: LIGHT_BG, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <UserHeader />
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}>
        <CircularProgress size={52} thickness={3} sx={{ color: '#2d6a4f' }} />
      </motion.div>
      <Typography sx={{ mt: 3, color: TEXT_MUTED, fontWeight: 600, letterSpacing: 1 }}>Loading Analysis…</Typography>
      <UserFooter />
    </Box>
  );

  /* ── Error ── */
  if (error || !analysis) return (
    <>
      <Box sx={{ bgcolor: LIGHT_BG, minHeight: '100vh' }}>
        <UserHeader />
        <Container maxWidth="md" sx={{ pt: 14, pb: 8 }}>
          <Alert severity="error" sx={{ mb: 4, bgcolor: 'rgba(244,67,54,0.1)', color: '#ef9a9a', border: '1px solid rgba(244,67,54,0.2)', borderRadius: 2 }}>
            {error || 'Analysis not found'}
          </Alert>
          <Button component={Link} to="/analysis-history" startIcon={<ArrowBackIcon />}
            sx={{ color: '#2d6a4f', fontWeight: 700, textTransform: 'none', '&:hover': { bgcolor: 'rgba(45,106,79,0.08)' } }}>
            Back to History
          </Button>
        </Container>
        <UserFooter />
      </Box>
    </>
  );

  const t      = TYPE_MAP[analysis.type?.toLowerCase()] || { color: '#9e9e9e', label: 'Analysis' };
  const result = analysis.result || analysis;
  const imgSrc = (() => {
    const raw = analysis.imageUrl || analysis.image;
    if (!raw) return null;
    return raw.startsWith('http') ? raw : `${API_BASE_URL}/${raw}`;
  })();

  /* ── Per-type results ── */
  const renderLatex = () => (
    <>
      <ResultSection title="Quality Metrics" icon={<CheckCircleIcon />} color="#00c853">
        <MetricRow label="Quality Grade"         value={result.quality || result.qualityClass} chip />
        <MetricRow label="DRC (Dry Rubber)"      value={`${result.drc || result.dryRubberContent || 0}%`} progress={result.drc || result.dryRubberContent} color="#00c853" />
        <MetricRow label="Purity Level"          value={`${result.purity || result.drc || 0}%`} progress={result.purity || result.drc} color="#00c853" />
        <MetricRow label="Moisture Content"      value={`${result.moisture || (result.drc ? (100 - result.drc).toFixed(1) : 0)}%`} progress={result.moisture || (result.drc ? 100 - result.drc : 0)} color="#29b6f6" />
        {result.drcCategory && <MetricRow label="DRC Category" value={result.drcCategory} chip />}
      </ResultSection>

      <ResultSection title="Contamination" icon={<WarningIcon />} color={result.contaminationDetected ? '#f44336' : '#00c853'}>
        <MetricRow label="Contamination Detected" value={result.contaminationDetected ? 'Yes' : 'No'} chip color={result.contaminationDetected ? '#f44336' : '#00c853'} />
        {result.contaminationDetected && <>
          <MetricRow label="Level"        value={result.contaminationLevel || 'Medium'} chip />
          {result.contaminationType      && <MetricRow label="Type"        value={result.contaminationType} />}
          {result.contaminationProbability > 0 && <MetricRow label="Probability" value={`${result.contaminationProbability}%`} progress={result.contaminationProbability} color="#f44336" />}
        </>}
        <MetricRow label="Detected Particles" value={result.detectedParticles || result.impuritiesDetected?.length || 0} />
        {result.impuritiesDetected?.length > 0 && <MetricRow label="Impurity Types" value={result.impuritiesDetected.join(', ')} />}
      </ResultSection>

      {(result.estimatedVolume > 0 || result.dryWeight > 0) && (
        <ResultSection title="Quantity & Yield" icon={<AssessmentIcon />} color="#29b6f6">
          {result.estimatedVolume > 0  && <MetricRow label="Estimated Volume" value={`${result.estimatedVolume} mL`} />}
          {result.wetWeight > 0        && <MetricRow label="Wet Weight"       value={`${result.wetWeight} kg`} />}
          {result.dryWeight > 0        && <MetricRow label="Dry Weight"       value={`${result.dryWeight} kg`} />}
          {result.dryYieldPercentage > 0 && <MetricRow label="Yield Efficiency" value={`${result.dryYieldPercentage}%`} progress={result.dryYieldPercentage} color="#29b6f6" />}
        </ResultSection>
      )}

      {result.marketPrice > 0 && (
        <ResultSection title="Market Analysis" icon={<MoneyIcon />} color="#ffa726">
          <MetricRow label="Price per kg"  value={`${result.marketCurrency || 'USD'} ${result.marketPrice}`} />
          {result.estimatedTotalValue > 0 && <MetricRow label="Total Value" value={`${result.marketCurrency || 'USD'} ${result.estimatedTotalValue.toFixed(2)}`} />}
          {result.marketTrend  && <MetricRow label="Market Trend" value={result.marketTrend} />}
          <MetricRow label="Region" value={result.marketRegion || 'Global'} />
        </ResultSection>
      )}
    </>
  );

  const renderLeaf = () => (
    <>
      <ResultSection title="Disease Detection" icon={<BiotechIcon />} color="#f44336">
        <MetricRow label="Disease Status"  value={result.diseaseStatus || (result.diseasePresent ? 'Infected' : 'Healthy')} chip />
        {result.diseaseType && result.diseaseType !== 'None' && <MetricRow label="Disease Type" value={result.diseaseType} />}
        <MetricRow label="Severity Level"  value={result.severityLevel || result.severity || 'None'} chip />
        {result.severityNumber > 0 && <MetricRow label="Severity Score" value={`${result.severityNumber}%`} progress={result.severityNumber} color="#f44336" />}
        {result.spotsCount > 0    && <MetricRow label="Spots Detected"  value={result.spotsCount} />}
      </ResultSection>

      <ResultSection title="Leaf Health" icon={<LeafIcon />} color="#29b6f6">
        <MetricRow label="Affected Area"        value={`${result.affectedArea || 0}%`}    progress={result.affectedArea}    color="#f44336" />
        <MetricRow label="Healthy Leaf Coverage" value={`${result.leafCoverage || 0}%`}   progress={result.leafCoverage}    color="#00c853" />
        <MetricRow label="Dominant Color"        value={result.dominantColor || 'Unknown'} />
        {result.texture && <MetricRow label="Texture" value={result.texture} />}
      </ResultSection>

      <ResultSection title="Recommendations" icon={<IdeasIcon />} color="#ffa726">
        <MetricRow label="Primary Action" value={result.recommendation || 'Monitor'} />
        {result.treatmentRecommendations?.length > 0 && (
          <Box sx={{ mt: 1.5 }}>
            <Typography sx={{ color: TEXT_MUTED, fontSize: '0.75rem', mb: 1, textTransform: 'uppercase', letterSpacing: 0.5 }}>Treatment Plan</Typography>
            {result.treatmentRecommendations.slice(0, 4).map((rec, i) => (
              <Box key={i} sx={{ display: 'flex', gap: 1.5, mb: 1, alignItems: 'flex-start' }}>
                <DotIcon sx={{ fontSize: 7, color: '#ffa726', mt: 0.9, flexShrink: 0 }} />
                <Typography sx={{ color: TEXT_SEC, fontSize: '0.85rem', lineHeight: 1.55 }}>{rec}</Typography>
              </Box>
            ))}
          </Box>
        )}
      </ResultSection>
    </>
  );

  const renderTrunks = () => (
    <>
      <ResultSection title="Trunk Health" icon={<TreeIcon />} color="#795548">
        <MetricRow label="Health Status" value={result.healthStatus || 'Good'} chip />
        <MetricRow label="Health Score"  value={`${result.healthScore || 0}%`}  progress={result.healthScore} color="#00c853" />
        <MetricRow label="Diameter"      value={`${result.diameter || 'N/A'} cm`} />
        <MetricRow label="Bark Condition" value={result.barkCondition || 'Good'} />
      </ResultSection>

      <ResultSection title="Maturity & Age" icon={<AccessTimeIcon />} color="#7c4dff">
        <MetricRow label="Maturity Stage" value={result.maturity || 'Unknown'} chip />
        {result.maturityConfidence > 0 && <MetricRow label="Maturity Confidence" value={`${result.maturityConfidence}%`} progress={result.maturityConfidence} color="#7c4dff" />}
        {result.ageEstimate            && <MetricRow label="Estimated Age"       value={`${result.ageEstimate} years`} />}
      </ResultSection>

      <ResultSection title="Wound & Disease" icon={<WarningIcon />} color="#f44336">
        <MetricRow label="Wounds Detected" value={result.woundsDetected || 0} />
        <MetricRow label="Disease Present" value={result.diseasePresent ? 'Yes' : 'No'} chip color={result.diseasePresent ? '#f44336' : '#00c853'} />
        {result.diseasePresent && <>
          <MetricRow label="Disease Type" value={result.diseaseType || 'Unknown'} />
          <MetricRow label="Severity"     value={result.diseaseSeverity || 'Unknown'} chip />
        </>}
      </ResultSection>

      <ResultSection title="Tapability" icon={<OpacityIcon />} color="#00bcd4">
        <MetricRow label="Tappable"         value={result.isTappable ? 'Yes' : 'No'} chip color={result.isTappable ? '#00c853' : '#f44336'} />
        <MetricRow label="Tapability Score" value={`${result.tapabilityScore || 0}%`} progress={result.tapabilityScore} color="#00bcd4" />
        {result.tapabilityRecommendation && <MetricRow label="Recommendation" value={result.tapabilityRecommendation} />}
      </ResultSection>
    </>
  );

  const renderResults = () => {
    switch (analysis.type?.toLowerCase()) {
      case 'latex':  return renderLatex();
      case 'leaf':   return renderLeaf();
      case 'trunks': return renderTrunks();
      default:       return <Typography sx={{ color: TEXT_MUTED }}>No detailed results available.</Typography>;
    }
  };

  /* ── JSX ── */
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,600;0,700;1,400&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&display=swap');
        @keyframes heroFloat { 0%,100% { transform: translateY(0px) rotate(-2deg) } 50% { transform: translateY(-8px) rotate(2deg) } }
        *, *::before, *::after { box-sizing: border-box; }
      `}</style>

      <Box sx={{ minHeight: '100vh', bgcolor: LIGHT_BG, display: 'flex', flexDirection: 'column' }}>
        <UserHeader />

        {/* Hero Banner - Matching Notifications theme */}
        <div style={{
          background: 'linear-gradient(135deg, #0d2818 0%, #1b4332 55%, #2d6a4f 100%)',
          padding: '48px 24px 60px', position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', right: '-40px', top: '-30px', width: '260px', height: '260px', borderRadius: '50%', background: 'rgba(82,183,136,0.08)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', right: '80px',  bottom: '-60px', width: '180px', height: '180px', borderRadius: '50%', background: 'rgba(52,143,96,0.1)',   pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', left: '-20px',  bottom: '-40px', width: '140px', height: '140px', borderRadius: '50%', background: 'rgba(163,209,141,0.06)', pointerEvents: 'none' }} />

          <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative' }}>
            {/* Breadcrumb */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <Link to="/analysis/history" style={{ 
                color: 'rgba(255,255,255,0.6)', 
                textDecoration: 'none', 
                fontWeight: 600, 
                fontSize: '0.83rem',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <ArrowBackIcon sx={{ fontSize: 15 }} /> Analysis History
              </Link>
              <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem' }}>/</span>
              <span style={{ color: t.color, fontWeight: 700, fontSize: '0.83rem' }}>{t.label} Analysis</span>
            </div>

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
                  {analysis.type} <span style={{ color: '#52b788' }}>Analysis</span>
                </h1>
                <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', fontFamily: 'monospace', marginTop: '4px' }}>
                  {analysis._id || analysis.id || '—'}
                </p>
              </div>
            </div>

            {/* Stats row */}
            <div style={{ display: 'flex', gap: '24px', marginTop: '24px', flexWrap: 'wrap' }}>
              <div>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 4px' }}>Date Analyzed</p>
                <p style={{ color: 'white', fontWeight: 700, fontSize: '0.9rem' }}>{new Date(analysis.createdAt).toLocaleString()}</p>
              </div>
              <div>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 4px' }}>Status</p>
                <Chip label={analysis.status || 'Completed'} size="small"
                  icon={<CheckCircleIcon sx={{ fontSize: '13px !important', color: `${t.color} !important` }} />}
                  sx={{ bgcolor: `${t.color}15`, color: t.color, fontWeight: 700, fontSize: '0.72rem', border: `1px solid ${t.color}30` }} />
              </div>
              {analysis.mlModelUsed !== undefined && (
                <div>
                  <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 4px' }}>ML Model</p>
                  <p style={{ color: 'white', fontWeight: 700, fontSize: '0.9rem' }}>{analysis.mlModelUsed ? 'Active' : 'Fallback'}</p>
                </div>
              )}
            </div>

            {/* Confidence gauge */}
            {analysis.confidence && (
              <div style={{ position: 'absolute', right: '44px', top: '50%', transform: 'translateY(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <ConfGauge value={analysis.confidence} color={t.color} size={88} />
                <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700 }}>Confidence</span>
              </div>
            )}
          </div>
        </div>

        {/* Main content */}
        <Box sx={{ flex: 1, pb: '120px', pt: 4 }}>
          <Container maxWidth="lg">

            {/* Groq AI Insights */}
            {analysis.aiInsights && (
              <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}>
                <LightCard sx={{ mb: 4, borderLeft: '3px solid #ffa726' }}>
                  <Box sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                      <Box sx={{ p: 1.2, borderRadius: '12px', bgcolor: 'rgba(255,167,38,0.12)', border: '1px solid rgba(255,167,38,0.2)', display: 'flex' }}>
                        <IdeasIcon sx={{ color: '#ffa726', fontSize: 28 }} />
                      </Box>
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="h5" sx={{ fontWeight: 900, color: '#ffa726', letterSpacing: -0.5 }}>Groq AI Insights</Typography>
                          <Chip label="BETA" size="small" sx={{ bgcolor: 'rgba(255,167,38,0.15)', color: '#ffb74d', fontWeight: 900, fontSize: '0.6rem', height: 18 }} />
                        </Box>
                        <Typography sx={{ color: TEXT_MUTED, fontSize: '0.82rem' }}>Powered by advanced neural analysis</Typography>
                      </Box>
                    </Box>

                    {analysis.aiInsights.overallReport && (
                      <Box sx={{ pl: 2, borderLeft: '3px solid rgba(255,167,38,0.4)', mb: 3 }}>
                        <Typography sx={{ fontSize: '1rem', lineHeight: 1.75, color: TEXT_SEC, fontStyle: 'italic' }}>
                          "{analysis.aiInsights.overallReport}"
                        </Typography>
                      </Box>
                    )}

                    <Grid container spacing={2.5}>
                      {analysis.aiInsights.diagnosis && (
                        <Grid item xs={12} sm={6}>
                          <Box sx={{ bgcolor: '#f4f9f4', borderRadius: '12px', border: '1px solid #e0ede4', p: 2.5 }}>
                            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 1.5 }}>
                              <BiotechIcon sx={{ color: '#00c853', fontSize: 18 }} />
                              <Typography sx={{ color: '#00c853', fontWeight: 800, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: 1 }}>Diagnosis</Typography>
                            </Box>
                            <Typography sx={{ color: TEXT_SEC, lineHeight: 1.65, fontSize: '0.88rem' }}>{analysis.aiInsights.diagnosis}</Typography>
                          </Box>
                        </Grid>
                      )}
                      {analysis.aiInsights.treatmentPlan?.length > 0 && (
                        <Grid item xs={12} sm={analysis.aiInsights.diagnosis ? 6 : 12}>
                          <Box sx={{ bgcolor: '#f4f9f4', borderRadius: '12px', border: '1px solid #e0ede4', p: 2.5 }}>
                            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 1.5 }}>
                              <ScienceIcon sx={{ color: '#29b6f6', fontSize: 18 }} />
                              <Typography sx={{ color: '#29b6f6', fontWeight: 800, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: 1 }}>Action Plan</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                              {analysis.aiInsights.treatmentPlan.map((item, i) => (
                                <Box key={i} sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                                  <Box sx={{ width: 5, height: 5, borderRadius: '50%', bgcolor: '#29b6f6', mt: 0.9, flexShrink: 0 }} />
                                  <Typography sx={{ color: TEXT_SEC, fontSize: '0.85rem', lineHeight: 1.55 }}>{item}</Typography>
                                </Box>
                              ))}
                            </Box>
                          </Box>
                        </Grid>
                      )}
                    </Grid>
                  </Box>
                </LightCard>
              </motion.div>
            )}

            {/* Main grid */}
            <Grid container spacing={3}>
              {/* Left: image + metadata */}
              <Grid item xs={12} md={4}>
                <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>

                  {/* Image */}
                  <LightCard sx={{ mb: 3, border: `1px solid ${t.color}20` }}>
                    <Box sx={{ position: 'relative', width: '100%', pt: '100%', bgcolor: '#f4f9f4' }}>
                      {imgSrc ? (
                        <img src={imgSrc} alt={`${analysis.type} sample`}
                          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', borderRadius: '16px' }}
                          onError={e => { e.target.src = 'https://via.placeholder.com/400x400?text=Image+Error'; }}
                        />
                      ) : (
                        <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <AssessmentIcon sx={{ fontSize: 64, color: 'rgba(45,106,79,0.15)' }} />
                        </Box>
                      )}
                      {/* type badge on image */}
                      <Box sx={{ position: 'absolute', top: 14, left: 14, display: 'inline-flex', alignItems: 'center', gap: 1, bgcolor: 'rgba(255,255,255,0.95)', border: `1px solid ${t.color}40`, borderRadius: '8px', px: 1.2, py: 0.5 }}>
                        <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: t.color, boxShadow: `0 0 5px ${t.color}` }} />
                        <Typography sx={{ color: TEXT_SEC, fontWeight: 800, fontSize: '0.72rem', letterSpacing: 0.5 }}>{t.label}</Typography>
                      </Box>
                    </Box>
                  </LightCard>

                  {/* Metadata */}
                  <LightCard>
                    <CardHead icon={<InfoIcon />} title="Scan Metadata" color="#78909c" />
                    <Box sx={{ px: 3, pb: 1 }}>
                      <MetricRow label="Date Analyzed" value={new Date(analysis.createdAt).toLocaleString()} />
                      <MetricRow label="Status"        value={analysis.status || 'Completed'} chip color={t.color} />
                      {analysis.confidence && <MetricRow label="Confidence" value={`${analysis.confidence}%`} progress={analysis.confidence} color={t.color} />}
                      {analysis.mlModelUsed !== undefined && <MetricRow label="ML Model" value={analysis.mlModelUsed ? 'Active' : 'Fallback'} />}
                      {analysis.batchID && <MetricRow label="Batch ID" value={analysis.batchID} />}
                      {analysis.treeID  && <MetricRow label="Tree ID"  value={analysis.treeID} />}
                    </Box>
                  </LightCard>

                </motion.div>
              </Grid>

              {/* Right: results */}
              <Grid item xs={12} md={8}>
                <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3, pl: 2, borderLeft: `3px solid ${t.color}` }}>
                    <AssessmentIcon sx={{ color: t.color, fontSize: 24 }} />
                    <Typography variant="h5" sx={{ fontWeight: 900, color: TEXT_SEC, letterSpacing: -0.5 }}>Detailed Results</Typography>
                  </Box>
                  {renderResults()}
                </motion.div>
              </Grid>
            </Grid>

          </Container>
        </Box>

        <UserFooter />
      </Box>
    </>
  );
};

export default AnalysisDetails;
