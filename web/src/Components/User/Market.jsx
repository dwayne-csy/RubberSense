import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import UserHeader from '../layouts/UserHeader';
import UserFooter from '../layouts/UserFooter';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Divider,
  Paper,
  ToggleButton,
  ToggleButtonGroup,
  Typography
} from '@mui/material';
import {
  AutoGraph as AutoGraphIcon,
  Bolt as BoltIcon,
  Psychology as PsychologyIcon,
  Refresh as RefreshIcon,
  TrendingDown as TrendingDownIcon,
  TrendingFlat as TrendingFlatIcon,
  TrendingUp as TrendingUpIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';

const MAX_ANALYSIS_LENGTH = 260;
const MAX_RECOMMENDATION_LENGTH = 140;

const normalizeText = (value = '') => String(value || '').replace(/\s+/g, ' ').trim();

const truncateText = (value = '', max = 180) => {
  const cleaned = normalizeText(value);
  if (cleaned.length <= max) return cleaned;
  return `${cleaned.slice(0, max - 3).trim()}...`;
};

const compressLabels = (labels = [], maxVisible = 6) => {
  if (!Array.isArray(labels) || labels.length <= maxVisible) return labels;
  const step = Math.ceil(labels.length / maxVisible);
  return labels.map((label, idx) => (idx % step === 0 || idx === labels.length - 1 ? label : ''));
};

const formatSourceLabel = (source, sourceSymbol) => {
  const provider = String(source || '').trim().toLowerCase();
  const providerLabel = provider === 'stooq'
    ? 'Source: Stooq'
    : provider
      ? `Source: ${provider.toUpperCase()}`
      : 'Source: -';

  const symbol = String(sourceSymbol || '').trim().toUpperCase();
  return symbol ? `${providerLabel} (${symbol})` : providerLabel;
};

const formatUpdatedLabel = (timestamp) => {
  const parsed = new Date(timestamp || '');
  if (Number.isNaN(parsed.getTime())) return 'Updated: -';

  const formatted = parsed.toLocaleString('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });

  return `Updated: ${formatted}`;
};

const normalizeSeries = (values, labels, fallbackLabels) => {
  const safeValues = Array.isArray(values) && values.length > 0
    ? values.map((value) => {
        const n = Number(value);
        return Number.isFinite(n) ? n : 0;
      })
    : [0];

  let safeLabels = Array.isArray(labels) && labels.length > 0 ? labels : fallbackLabels;

  if (safeLabels.length !== safeValues.length) {
    if (safeLabels.length > safeValues.length) {
      safeLabels = safeLabels.slice(safeLabels.length - safeValues.length);
    } else {
      const base = safeLabels.length > 0 ? safeLabels[0] : (fallbackLabels[0] || '');
      safeLabels = [...Array(safeValues.length - safeLabels.length).fill(base), ...safeLabels];
    }
  }

  return {
    labels: safeLabels,
    values: safeValues
  };
};

const toNumber = (value, fallback = 0) => {
  const parsed = Number(String(value ?? '').replace(/,/g, '').trim());
  return Number.isFinite(parsed) ? parsed : fallback;
};

const initialMarketData = {
  currentPrice: 0,
  priceChange: 0,
  lastUpdated: '',
  dayHistory: [],
  dayLabels: [],
  monthHistory: [],
  monthLabels: [],
  yearHistory: [],
  yearLabels: [],
  trend: 'NEUTRAL',
  confidence: 0,
  nextWeekPrice: 0,
  source: '',
  sourceSymbol: '',
  stale: false,
  features: [],
  analysis: '',
  recommendations: []
};

const Market = () => {
  const navigate = useNavigate();
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4001';

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [chartPeriod, setChartPeriod] = useState('1D');
  const [marketData, setMarketData] = useState(initialMarketData);
  const [error, setError] = useState('');

  const fetchMarketData = useCallback(async (force = false) => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      setError('');
      const endpoints = ['/api/v1/market/latest', '/api/market/latest'];
      let payload = null;
      let lastError = null;

      for (const endpoint of endpoints) {
        try {
          const response = await axios.get(`${API_BASE_URL}${endpoint}`, {
            params: { force },
            headers: { Authorization: `Bearer ${token}` }
          });

          if (response?.data?.success) {
            payload = response.data;
            break;
          }

          lastError = new Error(response?.data?.error || 'Failed to fetch market data');
        } catch (requestError) {
          if (requestError?.response?.status === 404) {
            lastError = requestError;
            continue;
          }
          throw requestError;
        }
      }

      if (!payload?.success) {
        if (lastError?.response?.status === 404) {
          throw new Error('Market API route not found. Restart backend so the new market routes are loaded.');
        }
        throw lastError || new Error('Failed to fetch market data');
      }

      const data = payload.data || {};

      const dayHistory = Array.isArray(data.dayHistory) && data.dayHistory.length > 0
        ? data.dayHistory
        : (Array.isArray(data.dailyHistory) ? data.dailyHistory : []);
      const dayLabels = Array.isArray(data.dayLabels) && data.dayLabels.length > 0
        ? data.dayLabels
        : (Array.isArray(data.dailyLabels) ? data.dailyLabels : []);

      const monthHistory = Array.isArray(data.monthHistory) && data.monthHistory.length > 0
        ? data.monthHistory
        : (Array.isArray(data.monthlyHistory) ? data.monthlyHistory : []);
      const monthLabels = Array.isArray(data.monthLabels) && data.monthLabels.length > 0
        ? data.monthLabels
        : (Array.isArray(data.monthlyLabels) ? data.monthlyLabels : []);

      const yearHistory = Array.isArray(data.yearHistory) && data.yearHistory.length > 0
        ? data.yearHistory
        : (Array.isArray(data.monthlyHistory) ? data.monthlyHistory : []);
      const yearLabels = Array.isArray(data.yearLabels) && data.yearLabels.length > 0
        ? data.yearLabels
        : (Array.isArray(data.monthlyLabels) ? data.monthlyLabels : []);

      setMarketData({
        currentPrice: toNumber(data.price, 0),
        priceChange: toNumber(data.priceChange, 0),
        lastUpdated: data.sourceTimestamp || data.timestamp || new Date().toISOString(),
        dayHistory,
        dayLabels,
        monthHistory,
        monthLabels,
        yearHistory,
        yearLabels,
        trend: data.trend || 'NEUTRAL',
        confidence: toNumber(data.confidence, 0),
        nextWeekPrice: toNumber(data.nextWeekProjection, 0),
        source: data.source || '',
        sourceSymbol: data.sourceSymbol || '',
        stale: Boolean(data.stale),
        features: Array.isArray(data.features) ? data.features : [],
        analysis: truncateText(data.analysis || '', MAX_ANALYSIS_LENGTH),
        recommendations: (Array.isArray(data.recommendations) ? data.recommendations : [])
          .slice(0, 6)
          .map((rec) => truncateText(rec || '', MAX_RECOMMENDATION_LENGTH))
      });
    } catch (err) {
      const is404 = err?.response?.status === 404;
      setError(
        is404
          ? 'Market API endpoint not found (404). Restart backend and ensure market routes are loaded.'
          : (err.response?.data?.error || err.message || 'Failed to fetch market data')
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [API_BASE_URL, navigate]);

  useEffect(() => {
    const bootstrap = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      try {
        const me = await axios.get(`${API_BASE_URL}/api/v1/users/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!me.data?.success) {
          throw new Error('Invalid session');
        }
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
        return;
      }

      fetchMarketData(false);
    };

    bootstrap();

    const interval = setInterval(() => {
      fetchMarketData(false);
    }, 60000);

    return () => clearInterval(interval);
  }, [API_BASE_URL, fetchMarketData, navigate]);

  const handleRefresh = (force = false) => {
    setRefreshing(true);
    fetchMarketData(force);
  };

  const trendText = marketData.trend === 'RISE'
    ? 'BULLISH'
    : marketData.trend === 'FALL'
      ? 'BEARISH'
      : 'SIDEWAYS';

  const trendColor = marketData.trend === 'RISE'
    ? '#00c853'
    : marketData.trend === 'FALL'
      ? '#d32f2f'
      : '#f57c00';

  const trendIcon = marketData.trend === 'RISE'
    ? TrendingUpIcon
    : marketData.trend === 'FALL'
      ? TrendingDownIcon
      : TrendingFlatIcon;

  const chartRows = useMemo(() => {
    const defaultDayLabels = Array.from({ length: 24 }).map((_, idx) => `${idx}:00`);
    const defaultMonthLabels = Array.from({ length: 30 }).map((_, idx) => `${idx + 1}`);
    const defaultYearLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const series = chartPeriod === '1D'
      ? normalizeSeries(marketData.dayHistory, marketData.dayLabels, defaultDayLabels)
      : chartPeriod === '1M'
        ? normalizeSeries(marketData.monthHistory, marketData.monthLabels, defaultMonthLabels)
        : normalizeSeries(marketData.yearHistory, marketData.yearLabels, defaultYearLabels);

    const compressed = compressLabels(series.labels, chartPeriod === '1D' ? 8 : 6);

    return series.values.map((value, idx) => ({
      value,
      label: series.labels[idx],
      displayLabel: compressed[idx]
    }));
  }, [chartPeriod, marketData.dayHistory, marketData.dayLabels, marketData.monthHistory, marketData.monthLabels, marketData.yearHistory, marketData.yearLabels]);

  const sourceLabel = formatSourceLabel(marketData.source, marketData.sourceSymbol);
  const updatedLabel = formatUpdatedLabel(marketData.lastUpdated);
  const TrendIcon = trendIcon;

  if (loading && marketData.currentPrice <= 0) {
    return (
      <>
        <UserHeader />
        <Box sx={{ minHeight: 'calc(100vh - 140px)', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#0f172a' }}>
          <Box sx={{ textAlign: 'center' }}>
            <CircularProgress sx={{ color: '#22c55e' }} />
            <Typography sx={{ mt: 2, color: '#e2e8f0' }}>Analyzing market trends...</Typography>
          </Box>
        </Box>
        <UserFooter />
      </>
    );
  }

  return (
    <>
      <UserHeader />
      <Box sx={{ minHeight: '100vh', bgcolor: '#0f172a', pt: '84px', pb: '100px' }}>
        <Container maxWidth="lg">
          <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}>
            <Paper sx={{
              p: { xs: 3, md: 4 },
              mb: 3,
              borderRadius: 4,
              color: '#fff',
              background: 'linear-gradient(135deg, #111827 0%, #0f766e 55%, #14532d 100%)',
              border: '1px solid rgba(255,255,255,0.08)'
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 800 }}>Market Intelligence</Typography>
                  <Typography sx={{ opacity: 0.85, mt: 0.5 }}>Live RSS3 reference with AI trend insights</Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1.2, flexWrap: 'wrap' }}>
                  <Button
                    variant="outlined"
                    startIcon={<RefreshIcon />}
                    onClick={() => handleRefresh(false)}
                    disabled={refreshing}
                    sx={{ color: '#fff', borderColor: 'rgba(255,255,255,0.35)' }}
                  >
                    Refresh
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<BoltIcon />}
                    onClick={() => handleRefresh(true)}
                    disabled={refreshing}
                    sx={{ bgcolor: '#22c55e', color: '#052e16', fontWeight: 700, '&:hover': { bgcolor: '#16a34a' } }}
                  >
                    Force Update
                  </Button>
                </Box>
              </Box>
            </Paper>
          </motion.div>

          {error && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>
          )}

          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
            <Paper sx={{ p: 3, mb: 3, borderRadius: 3, bgcolor: '#111827', border: '1px solid #1f2937', color: '#f8fafc' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                <Box>
                  <Typography variant="overline" sx={{ letterSpacing: 1.2, color: '#94a3b8' }}>RSS3 Rubber Price</Typography>
                  <Typography variant="h3" sx={{ fontWeight: 900 }}>
                    PHP {toNumber(marketData.currentPrice, 0).toFixed(2)}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', mt: 0.5 }}>{sourceLabel}</Typography>
                  <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block' }}>{updatedLabel}</Typography>
                  {marketData.stale && (
                    <Typography variant="caption" sx={{ color: '#f59e0b', display: 'block', mt: 0.5 }}>
                      Live feed unavailable, showing latest stored value.
                    </Typography>
                  )}
                </Box>

                <Chip
                  icon={<TrendIcon sx={{ color: trendColor }} />}
                  label={`${marketData.priceChange >= 0 ? '+' : ''}${toNumber(marketData.priceChange, 0).toFixed(2)}%`}
                  sx={{
                    px: 1,
                    fontWeight: 700,
                    fontSize: '1rem',
                    color: trendColor,
                    bgcolor: 'rgba(148,163,184,0.08)',
                    border: `1px solid ${trendColor}`
                  }}
                />
              </Box>
            </Paper>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
            <Paper sx={{ p: 3, mb: 3, borderRadius: 3, bgcolor: '#111827', border: '1px solid #1f2937' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, gap: 2, flexWrap: 'wrap' }}>
                <Typography variant="h6" sx={{ color: '#f8fafc', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AutoGraphIcon /> Price Trend
                </Typography>
                <ToggleButtonGroup
                  exclusive
                  value={chartPeriod}
                  size="small"
                  onChange={(_, value) => value && setChartPeriod(value)}
                  sx={{
                    '& .MuiToggleButton-root': { color: '#94a3b8', borderColor: '#334155' },
                    '& .Mui-selected': { color: '#0b1220 !important', bgcolor: '#22c55e !important' }
                  }}
                >
                  <ToggleButton value="1D">1D</ToggleButton>
                  <ToggleButton value="1M">1M</ToggleButton>
                  <ToggleButton value="1Y">1Y</ToggleButton>
                </ToggleButtonGroup>
              </Box>

              <Box sx={{ width: '100%', height: 280 }}>
                <ResponsiveContainer>
                  <LineChart data={chartRows} margin={{ top: 8, right: 10, left: 8, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="displayLabel" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={{ stroke: '#334155' }} tickLine={{ stroke: '#334155' }} />
                    <YAxis
                      tick={{ fill: '#94a3b8', fontSize: 11 }}
                      axisLine={{ stroke: '#334155' }}
                      tickLine={{ stroke: '#334155' }}
                      tickFormatter={(val) => `PHP ${Number(val).toFixed(0)}`}
                    />
                    <Tooltip
                      formatter={(value) => [`PHP ${toNumber(value, 0).toFixed(2)}`, 'Price']}
                      labelFormatter={(_, payload) => payload?.[0]?.payload?.label || '-'}
                      contentStyle={{ backgroundColor: '#0b1220', border: '1px solid #334155', borderRadius: 8, color: '#f8fafc' }}
                      labelStyle={{ color: '#cbd5e1' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="#22c55e"
                      strokeWidth={2.5}
                      dot={{ r: 2 }}
                      activeDot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </Paper>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
            <Paper sx={{ p: 3, mb: 3, borderRadius: 3, color: '#f8fafc', background: 'linear-gradient(135deg, #111827 0%, #172554 100%)', border: '1px solid #1d4ed8' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <PsychologyIcon sx={{ color: '#60a5fa' }} />
                <Typography variant="h6" sx={{ fontWeight: 700 }}>AI Forecast Engine</Typography>
                <Chip label={`${toNumber(marketData.confidence, 0)}% Confidence`} size="small" sx={{ ml: 'auto', bgcolor: '#dbeafe', color: '#1e3a8a', fontWeight: 700 }} />
              </Box>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                <Paper sx={{ p: 2, bgcolor: 'rgba(15,23,42,0.65)', border: '1px solid #334155', color: '#f8fafc' }}>
                  <Typography variant="caption" sx={{ color: '#93c5fd' }}>Next Week Projection</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 800 }}>PHP {toNumber(marketData.nextWeekPrice, 0).toFixed(2)}</Typography>
                </Paper>
                <Paper sx={{ p: 2, bgcolor: 'rgba(15,23,42,0.65)', border: '1px solid #334155', color: '#f8fafc' }}>
                  <Typography variant="caption" sx={{ color: '#93c5fd' }}>Market Sentiment</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 800, color: trendColor }}>{trendText}</Typography>
                </Paper>
              </Box>
            </Paper>
          </motion.div>

          {marketData.analysis && (
            <Paper sx={{ p: 3, mb: 3, borderRadius: 3, bgcolor: '#111827', border: '1px solid #1f2937' }}>
              <Typography variant="h6" sx={{ color: '#f8fafc', mb: 1.2, fontWeight: 700 }}>AI Market Analysis</Typography>
              <Typography sx={{ color: '#cbd5e1', lineHeight: 1.8 }}>{marketData.analysis}</Typography>
            </Paper>
          )}

          {marketData.recommendations?.length > 0 && (
            <Paper sx={{ p: 3, mb: 3, borderRadius: 3, bgcolor: '#111827', border: '1px solid #1f2937' }}>
              <Typography variant="h6" sx={{ color: '#f8fafc', mb: 1.2, fontWeight: 700 }}>Strategic Recommendations</Typography>
              {marketData.recommendations.map((rec, idx) => (
                <Typography key={`rec-${idx}`} sx={{ color: '#cbd5e1', mb: 1.1, display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                  <Box component="span" sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#22c55e', mt: '10px', flexShrink: 0 }} />
                  <Box component="span">{rec}</Box>
                </Typography>
              ))}
            </Paper>
          )}

          {marketData.features?.length > 0 && (
            <Paper sx={{ p: 3, mb: 3, borderRadius: 3, bgcolor: '#111827', border: '1px solid #1f2937' }}>
              <Typography variant="h6" sx={{ color: '#f8fafc', mb: 1.6, fontWeight: 700 }}>Market Drivers</Typography>
              {marketData.features.map((feature, idx) => {
                const sentiment = String(feature.sentiment || 'Neutral');
                const sentimentColor = sentiment === 'Positive' ? '#22c55e' : sentiment === 'Negative' ? '#ef4444' : '#f59e0b';

                return (
                  <Box key={`feature-${idx}`} sx={{ p: 1.5, mb: 1.2, borderRadius: 2, bgcolor: '#0b1220', border: '1px solid #1e293b' }}>
                    <Typography sx={{ color: '#e2e8f0', fontWeight: 700 }}>{feature.name || 'Market driver'}</Typography>
                    <Divider sx={{ my: 0.8, borderColor: '#1e293b' }} />
                    <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                      Impact: <Box component="span" sx={{ color: '#f8fafc', fontWeight: 600 }}>{feature.impact || 'Medium'}</Box>
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                      Sentiment: <Box component="span" sx={{ color: sentimentColor, fontWeight: 700 }}>{sentiment}</Box>
                    </Typography>
                  </Box>
                );
              })}
            </Paper>
          )}
        </Container>
      </Box>
      <UserFooter />
    </>
  );
};

export default Market;
