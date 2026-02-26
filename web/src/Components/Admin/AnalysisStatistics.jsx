import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Grid,
  Card,
  CardContent,
  Typography,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  Chip,
  LinearProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
  Avatar,
  Stack,
  Alert,
  Skeleton,
  useTheme,
  IconButton,
  Tooltip,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  TrendingFlat as TrendingFlatIcon,
  Spa as LatexIcon,
  LocalFlorist as LeafIcon,
  Nature as TrunkIcon,
  People as PeopleIcon,
  Assessment as AssessmentIcon,
  Timeline as TimelineIcon,
  PieChart as PieChartIcon,
  ShowChart as ShowChartIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart
} from 'recharts';
import axios from 'axios';
import { format, subDays, subMonths } from 'date-fns';
import LeftNavigationBar from '../layouts/LeftNavigationBar';

const AnalysisStatistics = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4001';
  
  const [timeRange, setTimeRange] = useState('30days');
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);
  const [error, setError] = useState(null);

  // Colors
  const COLORS = {
    latex: theme.palette.primary.main,
    leaf: theme.palette.success.main,
    trunk: theme.palette.warning.main,
    high: theme.palette.success.main,
    medium: theme.palette.warning.main,
    low: theme.palette.error.main
  };

  const PIE_COLORS = [theme.palette.primary.main, theme.palette.success.main, theme.palette.warning.main];

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      try {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        const response = await axios.get(`${API_BASE_URL}/api/v1/users/me`);
        if (!response.data.success) {
          throw new Error('Authentication failed');
        }
      } catch (error) {
        console.error('Auth check error:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
      } finally {
        setAuthLoading(false);
      }
    };

    checkAuth();
  }, [navigate, API_BASE_URL]);

  const fetchStatistics = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/v1/admin/statistics`, {
        params: { timeRange }
      });
      setStats(response.data.data);
    } catch (error) {
      setError(error.response?.data?.message || error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      fetchStatistics();
    }
  }, [timeRange, authLoading]);

  const getTrendIcon = (value) => {
    if (value > 0) return <TrendingUpIcon sx={{ color: theme.palette.success.main }} />;
    if (value < 0) return <TrendingDownIcon sx={{ color: theme.palette.error.main }} />;
    return <TrendingFlatIcon sx={{ color: theme.palette.warning.main }} />;
  };

  const StatCard = ({ title, value, icon, color, trend, trendValue, subtitle }) => (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography color="text.secondary" variant="body2" gutterBottom>
              {title}
            </Typography>
            {loading ? (
              <Skeleton variant="text" width={100} height={40} />
            ) : (
              <>
                <Typography variant="h4" component="div" fontWeight="bold">
                  {value}
                </Typography>
                {subtitle && (
                  <Typography variant="caption" color="text.secondary">
                    {subtitle}
                  </Typography>
                )}
              </>
            )}
          </Box>
          <Avatar sx={{ bgcolor: color }}>
            {icon}
          </Avatar>
        </Box>
        {trend !== undefined && !loading && (
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
            {getTrendIcon(trend)}
            <Typography variant="body2" sx={{ ml: 0.5 }}>
              <span style={{ color: trend > 0 ? theme.palette.success.main : theme.palette.error.main }}>
                {Math.abs(trend)}%
              </span>{' '}
              {trendValue}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );

  const AnalysisTypeCard = ({ type, data, icon, color }) => (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Avatar sx={{ bgcolor: color, mr: 2 }}>
            {icon}
          </Avatar>
          <Typography variant="h6">{type}</Typography>
        </Box>
        
        {loading ? (
          <Skeleton variant="rectangular" height={100} />
        ) : (
          <>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">Total</Typography>
                <Typography variant="h5">{data?.total || 0}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">% of Total</Typography>
                <Typography variant="h5">
                  {stats?.analyses?.total ? ((data?.total / stats.analyses.total) * 100).toFixed(1) : 0}%
                </Typography>
              </Grid>
            </Grid>

            {type === 'Latex' && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="text.secondary">Quality Distribution</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1 }}>
                  <Chip 
                    size="small" 
                    label={`High: ${data?.qualityDistribution?.high || 0}`}
                    sx={{ bgcolor: theme.palette.success.light }}
                  />
                  <Chip 
                    size="small" 
                    label={`Medium: ${data?.qualityDistribution?.medium || 0}`}
                    sx={{ bgcolor: theme.palette.warning.light }}
                  />
                  <Chip 
                    size="small" 
                    label={`Low: ${data?.qualityDistribution?.low || 0}`}
                    sx={{ bgcolor: theme.palette.error.light }}
                  />
                </Box>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Avg Quality: {data?.avgQualityScore || 0}%
                </Typography>
                <Typography variant="body2">
                  Avg DRC: {data?.avgDRC || 0}%
                </Typography>
              </Box>
            )}

            {type === 'Leaf' && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="text.secondary">Disease Stats</Typography>
                <Typography variant="body2">
                  Avg Severity: {data?.avgSeverity || 0}%
                </Typography>
                <Typography variant="body2">
                  Critical Cases: {data?.criticalCases || 0}
                </Typography>
                <Typography variant="body2">
                  Avg Confidence: {data?.avgConfidence || 0}%
                </Typography>
              </Box>
            )}

            {type === 'Trunks' && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="text.secondary">Health Stats</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Box sx={{ flexGrow: 1, mr: 1 }}>
                    <LinearProgress
                      variant="determinate"
                      value={data?.avgHealthScore || 0}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: theme.palette.grey[200],
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: 
                            data?.avgHealthScore >= 70 ? theme.palette.success.main :
                            data?.avgHealthScore >= 40 ? theme.palette.warning.main :
                            theme.palette.error.main
                        }
                      }}
                    />
                  </Box>
                  <Typography variant="body2">
                    {data?.avgHealthScore || 0}%
                  </Typography>
                </Box>
                <Typography variant="body2">
                  Healthy: {data?.healthyTrees || 0} | Critical: {data?.criticalTrees || 0}
                </Typography>
              </Box>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );

  if (authLoading) {
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
          <p>Loading Analytics Dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh' }}>
        <LeftNavigationBar />
        <div style={{ flex: 1, marginLeft: '280px', backgroundColor: '#f5f5f5' }}>
          <Box sx={{ p: 3 }}>
            <Alert severity="error" action={
              <Button color="inherit" size="small" onClick={fetchStatistics}>
                Retry
              </Button>
            }>
              Error loading statistics: {error}
            </Alert>
          </Box>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <LeftNavigationBar />
      <div style={{ 
        flex: 1, 
        marginLeft: '280px',
        backgroundColor: '#f5f5f5'
      }}>
        <Box sx={{ p: 3 }}>
          {/* Header */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h4" component="h1" fontWeight="bold">
              Analytics Dashboard
            </Typography>
            <Box>
              <FormControl size="small" sx={{ minWidth: 150, mr: 2 }}>
                <InputLabel>Time Range</InputLabel>
                <Select
                  value={timeRange}
                  label="Time Range"
                  onChange={(e) => setTimeRange(e.target.value)}
                >
                  <MenuItem value="7days">Last 7 Days</MenuItem>
                  <MenuItem value="30days">Last 30 Days</MenuItem>
                  <MenuItem value="90days">Last 90 Days</MenuItem>
                  <MenuItem value="year">Last Year</MenuItem>
                  <MenuItem value="all">All Time</MenuItem>
                </Select>
              </FormControl>
              <Tooltip title="Refresh">
                <IconButton onClick={fetchStatistics}>
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          {/* Summary Cards */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Total Users"
                value={stats?.users?.total || 0}
                icon={<PeopleIcon />}
                color={theme.palette.primary.main}
                trend={stats?.users?.activityRate}
                trendValue="active rate"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Total Analyses"
                value={stats?.analyses?.total || 0}
                icon={<AssessmentIcon />}
                color={theme.palette.success.main}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Active Users"
                value={stats?.users?.active || 0}
                icon={<TimelineIcon />}
                color={theme.palette.warning.main}
                subtitle={`${stats?.users?.new || 0} new this period`}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Avg Health Score"
                value={`${stats?.trunks?.avgHealthScore || 0}%`}
                icon={<ShowChartIcon />}
                color={theme.palette.info.main}
              />
            </Grid>
          </Grid>

          {/* Analysis Type Breakdown */}
          <Typography variant="h6" gutterBottom sx={{ mt: 4, mb: 2 }}>
            Analysis Breakdown by Type
          </Typography>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={4}>
              <AnalysisTypeCard
                type="Latex"
                data={stats?.latex}
                icon={<LatexIcon />}
                color={theme.palette.primary.main}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <AnalysisTypeCard
                type="Leaf"
                data={stats?.leaf}
                icon={<LeafIcon />}
                color={theme.palette.success.main}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <AnalysisTypeCard
                type="Trunks"
                data={stats?.trunks}
                icon={<TrunkIcon />}
                color={theme.palette.warning.main}
              />
            </Grid>
          </Grid>

          {/* Charts */}
          <Grid container spacing={3}>
            {/* Recent Activity Trend */}
            <Grid item xs={12} lg={8}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Recent Activity Trend (Last 7 Days)
                  </Typography>
                  <Box sx={{ height: 300 }}>
                    {loading ? (
                      <Skeleton variant="rectangular" height={300} />
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={stats?.recentActivity || []}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis yAxisId="left" />
                          <YAxis yAxisId="right" orientation="right" />
                          <RechartsTooltip />
                          <Legend />
                          <Area
                            yAxisId="left"
                            type="monotone"
                            dataKey="total"
                            fill={theme.palette.primary.light}
                            stroke={theme.palette.primary.main}
                            fillOpacity={0.3}
                          />
                          <Bar
                            yAxisId="right"
                            dataKey="latex"
                            fill={COLORS.latex}
                            barSize={20}
                          />
                          <Bar
                            yAxisId="right"
                            dataKey="leaf"
                            fill={COLORS.leaf}
                            barSize={20}
                          />
                          <Bar
                            yAxisId="right"
                            dataKey="trunk"
                            fill={COLORS.trunk}
                            barSize={20}
                          />
                        </ComposedChart>
                      </ResponsiveContainer>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Distribution Pie Chart */}
            <Grid item xs={12} lg={4}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Analysis Distribution
                  </Typography>
                  <Box sx={{ height: 300, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    {loading ? (
                      <Skeleton variant="circular" width={200} height={200} />
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={[
                              { name: 'Latex', value: stats?.analyses?.byType?.latex || 0 },
                              { name: 'Leaf', value: stats?.analyses?.byType?.leaf || 0 },
                              { name: 'Trunks', value: stats?.analyses?.byType?.trunks || 0 }
                            ]}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                            label
                          >
                            {PIE_COLORS.map((color, index) => (
                              <Cell key={`cell-${index}`} fill={color} />
                            ))}
                          </Pie>
                          <RechartsTooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Top Diseases */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Top Leaf Diseases
                  </Typography>
                  {loading ? (
                    <Skeleton variant="rectangular" height={200} />
                  ) : (
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Disease</TableCell>
                            <TableCell align="right">Count</TableCell>
                            <TableCell align="right">Avg Severity</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {stats?.leaf?.topDiseases?.map((disease) => (
                            <TableRow key={disease._id}>
                              <TableCell>{disease._id || 'Unknown'}</TableCell>
                              <TableCell align="right">{disease.count}</TableCell>
                              <TableCell align="right">
                                <Chip
                                  size="small"
                                  label={`${disease.avgSeverity?.toFixed(1)}%`}
                                  color={
                                    disease.avgSeverity >= 70 ? 'error' :
                                    disease.avgSeverity >= 40 ? 'warning' : 'success'
                                  }
                                />
                              </TableCell>
                            </TableRow>
                          ))}
                          {(!stats?.leaf?.topDiseases || stats.leaf.topDiseases.length === 0) && (
                            <TableRow>
                              <TableCell colSpan={3} align="center">
                                No disease data available
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Top Trunk Conditions */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Top Trunk Conditions
                  </Typography>
                  {loading ? (
                    <Skeleton variant="rectangular" height={200} />
                  ) : (
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Condition</TableCell>
                            <TableCell align="right">Count</TableCell>
                            <TableCell align="right">Avg Health</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {stats?.trunks?.topConditions?.map((condition) => (
                            <TableRow key={condition._id}>
                              <TableCell>{condition._id || 'Unknown'}</TableCell>
                              <TableCell align="right">{condition.count}</TableCell>
                              <TableCell align="right">
                                <Chip
                                  size="small"
                                  label={`${condition.avgHealthScore?.toFixed(1)}%`}
                                  color={
                                    condition.avgHealthScore >= 70 ? 'success' :
                                    condition.avgHealthScore >= 40 ? 'warning' : 'error'
                                  }
                                />
                              </TableCell>
                            </TableRow>
                          ))}
                          {(!stats?.trunks?.topConditions || stats.trunks.topConditions.length === 0) && (
                            <TableRow>
                              <TableCell colSpan={3} align="center">
                                No trunk condition data available
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Top Users */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Most Active Users
                  </Typography>
                  {loading ? (
                    <Skeleton variant="rectangular" height={200} />
                  ) : (
                    <List>
                      {stats?.topUsers?.map((user, index) => (
                        <React.Fragment key={user._id}>
                          {index > 0 && <Divider />}
                          <ListItem>
                            <Avatar sx={{ mr: 2, bgcolor: PIE_COLORS[index % PIE_COLORS.length] }}>
                              {user.name?.charAt(0) || 'U'}
                            </Avatar>
                            <ListItemText
                              primary={user.name || 'Unknown User'}
                              secondary={user.email}
                            />
                            <Box sx={{ display: 'flex', gap: 2 }}>
                              <Tooltip title="Latex Analyses">
                                <Chip
                                  size="small"
                                  icon={<LatexIcon />}
                                  label={user.activity.latex}
                                  variant="outlined"
                                />
                              </Tooltip>
                              <Tooltip title="Leaf Analyses">
                                <Chip
                                  size="small"
                                  icon={<LeafIcon />}
                                  label={user.activity.leaf}
                                  variant="outlined"
                                />
                              </Tooltip>
                              <Tooltip title="Trunk Analyses">
                                <Chip
                                  size="small"
                                  icon={<TrunkIcon />}
                                  label={user.activity.trunk}
                                  variant="outlined"
                                />
                              </Tooltip>
                              <Typography variant="h6" sx={{ ml: 2 }}>
                                {user.activity.total}
                              </Typography>
                            </Box>
                          </ListItem>
                        </React.Fragment>
                      ))}
                      {(!stats?.topUsers || stats.topUsers.length === 0) && (
                        <ListItem>
                          <ListItemText
                            primary="No user activity data available"
                            align="center"
                          />
                        </ListItem>
                      )}
                    </List>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      </div>
    </div>
  );
};

export default AnalysisStatistics;