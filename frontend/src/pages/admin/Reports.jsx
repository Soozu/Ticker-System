import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Card,
  CardContent,
  Divider,
  Button,
  TextField,
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material';
import { 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Cell 
} from 'recharts';
import axios from 'axios';
import { saveAs } from 'file-saver';
import FileDownloadIcon from '@mui/icons-material/FileDownload';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Colors for the charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const Reports = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const [reportType, setReportType] = useState('overall');
  const [startDateStr, setStartDateStr] = useState('');
  const [endDateStr, setEndDateStr] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [timePeriod, setTimePeriod] = useState('custom');

  const fetchReportData = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Build query parameters
      let queryParams = `?report_type=detailed`;
      
      if (timePeriod !== 'custom') {
        queryParams += `&time_period=${timePeriod}`;
      } else if (startDateStr) {
        const startDate = new Date(startDateStr);
        queryParams += `&start_date=${startDate.toISOString()}`;
      }
      
      if (timePeriod === 'custom' && endDateStr) {
        const endDate = new Date(endDateStr);
        queryParams += `&end_date=${endDate.toISOString()}`;
      }

      const response = await axios.get(`${API_BASE_URL}/admin/stats${queryParams}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        }
      });

      if (response.data.success) {
        setStats(response.data.data);
        setError(null);
      } else {
        throw new Error(response.data.message);
      }
    } catch (err) {
      console.error('Error fetching report data:', err);
      setError(err.message || 'Failed to load report data');
    } finally {
      setLoading(false);
    }
  }, [startDateStr, endDateStr, timePeriod]);

  useEffect(() => {
    fetchReportData();
  }, [fetchReportData, reportType, refreshKey]);

  const handleReportTypeChange = (event) => {
    setReportType(event.target.value);
  };

  const handleRefresh = () => {
    setRefreshKey(oldKey => oldKey + 1);
  };

  const handleTimePeriodChange = (event, newTimePeriod) => {
    if (newTimePeriod !== null) {
      setTimePeriod(newTimePeriod);
      
      // Set date range based on selected time period
      const today = new Date();
      let startDate = new Date();
      
      switch (newTimePeriod) {
        case 'weekly':
          startDate.setDate(today.getDate() - 7);
          break;
        case 'monthly':
          startDate.setMonth(today.getMonth() - 1);
          break;
        case 'annual':
          startDate.setFullYear(today.getFullYear() - 1);
          break;
        case 'custom':
          // Don't change dates for custom
          return;
        default:
          break;
      }
      
      setStartDateStr(startDate.toISOString().split('T')[0]);
      setEndDateStr(today.toISOString().split('T')[0]);
    }
  };

  // Function to format category names for better display
  const formatCategoryName = (category) => {
    if (!category) return 'Unknown';
    
    // Replace underscores with spaces and capitalize each word
    return category
      .replace(/_/g, ' ')
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Prepare data for category distribution chart
  const prepareCategoryData = (data) => {
    if (!data || !data.categoryDistribution) return [];
    
    return data.categoryDistribution.map(item => ({
      name: formatCategoryName(item.category),
      value: item.count
    }));
  };

  // Prepare data for status distribution chart
  const prepareStatusData = (data) => {
    if (!data || !data.statusDistribution) return [];
    
    return data.statusDistribution.map(item => ({
      name: item.status ? item.status.replace(/_/g, ' ') : 'Unknown',
      value: item.count
    }));
  };

  // Render pie chart with custom label
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
    const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);
  
    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  const exportToExcel = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Build query parameters based on time period
      let queryParams = '';
      
      if (timePeriod !== 'custom') {
        queryParams = `?time_period=${timePeriod}`;
      } else if (startDateStr && endDateStr) {
        const startDate = new Date(startDateStr);
        const endDate = new Date(endDateStr);
        queryParams = `?start_date=${startDate.toISOString()}&end_date=${endDate.toISOString()}`;
      }

      const response = await axios.get(`${API_BASE_URL}/admin/tickets/export${queryParams}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        responseType: 'blob'
      });

      const blob = new Blob([response.data], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      
      const date = new Date().toISOString().split('T')[0];
      const periodLabel = timePeriod.charAt(0).toUpperCase() + timePeriod.slice(1);
      
      saveAs(blob, `tickets_report_${periodLabel}_${date}.xlsx`);

      setError(null);
    } catch (err) {
      console.error('Error exporting to Excel:', err);
      setError(err.message || 'Failed to export data to Excel');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !stats) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Ticket Reports</Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
          <ToggleButtonGroup
            value={timePeriod}
            exclusive
            onChange={handleTimePeriodChange}
            aria-label="time period"
            size="small"
            sx={{ mb: 2 }}
          >
            <ToggleButton value="weekly" aria-label="weekly">
              Weekly
            </ToggleButton>
            <ToggleButton value="monthly" aria-label="monthly">
              Monthly
            </ToggleButton>
            <ToggleButton value="annual" aria-label="annual">
              Annual
            </ToggleButton>
            <ToggleButton value="custom" aria-label="custom">
              Custom
            </ToggleButton>
          </ToggleButtonGroup>
          
          <Button
            variant="contained"
            startIcon={<FileDownloadIcon />}
            onClick={exportToExcel}
            disabled={loading}
            sx={{
              background: 'linear-gradient(135deg, #2e7d32, #4caf50)',
              '&:hover': {
                background: 'linear-gradient(135deg, #1b5e20, #2e7d32)',
              }
            }}
          >
            Export to Excel
          </Button>
        </Box>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {/* Report Controls */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Report Type</InputLabel>
              <Select
                value={reportType}
                label="Report Type"
                onChange={handleReportTypeChange}
              >
                <MenuItem value="overall">Overall Summary</MenuItem>
                <MenuItem value="category">By Category</MenuItem>
                <MenuItem value="status">By Status</MenuItem>
                <MenuItem value="priority">By Priority</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <TextField
              label="Start Date"
              type="date"
              value={startDateStr}
              onChange={(e) => setStartDateStr(e.target.value)}
              InputLabelProps={{
                shrink: true,
              }}
              fullWidth
              disabled={timePeriod !== 'custom'}
            />
          </Grid>
          
          <Grid item xs={12} md={3}>
            <TextField
              label="End Date"
              type="date"
              value={endDateStr}
              onChange={(e) => setEndDateStr(e.target.value)}
              InputLabelProps={{
                shrink: true,
              }}
              fullWidth
              disabled={timePeriod !== 'custom'}
            />
          </Grid>
          
          <Grid item xs={12} md={3}>
            <Button 
              variant="contained" 
              color="primary"
              onClick={handleRefresh}
              disabled={loading}
              fullWidth
            >
              {loading ? <CircularProgress size={24} /> : 'Refresh Data'}
            </Button>
          </Grid>
        </Grid>
        
        {timePeriod !== 'custom' && (
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Typography variant="subtitle1" color="textSecondary">
              Showing data for the last {timePeriod === 'weekly' ? 'week' : timePeriod === 'monthly' ? 'month' : 'year'}
            </Typography>
          </Box>
        )}
      </Paper>
      
      {/* Summary Cards */}
      {stats && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Total Tickets</Typography>
                <Typography variant="h3">{stats.totalTickets}</Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ bgcolor: '#fff9c4' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>Pending</Typography>
                <Typography variant="h3">{stats.pendingTickets}</Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ bgcolor: '#bbdefb' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>In Progress</Typography>
                <Typography variant="h3">{stats.inProgressTickets}</Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ bgcolor: '#c8e6c9' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>Resolved</Typography>
                <Typography variant="h3">{stats.resolvedTickets}</Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ bgcolor: '#e0e0e0' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>Archived</Typography>
                <Typography variant="h3">{stats.archivedTickets || 0}</Typography>
                <Typography variant="caption" color="textSecondary">
                  Auto-archived after resolution
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
      
      {/* Charts Section */}
      {stats && (
        <Grid container spacing={4}>
          {/* Category Distribution Chart */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, height: '400px' }}>
              <Typography variant="h6" gutterBottom>Tickets by Category</Typography>
              <ResponsiveContainer width="100%" height="90%">
                <PieChart>
                  <Pie
                    data={prepareCategoryData(stats)}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={renderCustomizedLabel}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {prepareCategoryData(stats).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} tickets`, 'Count']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
          
          {/* Status Distribution Chart */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, height: '400px' }}>
              <Typography variant="h6" gutterBottom>Tickets by Status</Typography>
              <ResponsiveContainer width="100%" height="90%">
                <BarChart
                  data={prepareStatusData(stats)}
                  margin={{
                    top: 20,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" name="Tickets" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
          
          {/* Archive Statistics */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>Archive Statistics</Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <Card sx={{ bgcolor: '#f5f5f5' }}>
                    <CardContent>
                      <Typography variant="subtitle1" gutterBottom>Recently Archived</Typography>
                      <Typography variant="h4">{stats.recentlyArchivedTickets || 0}</Typography>
                      <Typography variant="caption" color="textSecondary">
                        Last 7 days
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <Card sx={{ bgcolor: '#f5f5f5' }}>
                    <CardContent>
                      <Typography variant="subtitle1" gutterBottom>Average Archive Time</Typography>
                      <Typography variant="h4">{stats.averageArchiveTime || '2'} days</Typography>
                      <Typography variant="caption" color="textSecondary">
                        From resolution to archive
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <Card sx={{ bgcolor: '#f5f5f5' }}>
                    <CardContent>
                      <Typography variant="subtitle1" gutterBottom>Auto-archived</Typography>
                      <Typography variant="h4">{stats.autoArchivedPercentage || '100'}%</Typography>
                      <Typography variant="caption" color="textSecondary">
                        Of total archived tickets
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
          
          {/* Detailed Table */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3, mt: 2 }}>
              <Typography variant="h6" gutterBottom>Detailed Breakdown</Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Category</strong></TableCell>
                    <TableCell align="right"><strong>Pending</strong></TableCell>
                    <TableCell align="right"><strong>In Progress</strong></TableCell>
                    <TableCell align="right"><strong>Resolved</strong></TableCell>
                    <TableCell align="right"><strong>Archived</strong></TableCell>
                    <TableCell align="right"><strong>Total</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {stats?.categoryStatusBreakdown ? (
                    stats.categoryStatusBreakdown.map((row) => (
                      <TableRow key={row.category || 'unknown'}>
                        <TableCell>{formatCategoryName(row.category)}</TableCell>
                        <TableCell align="right">{row.pending}</TableCell>
                        <TableCell align="right">{row.inProgress}</TableCell>
                        <TableCell align="right">{row.resolved}</TableCell>
                        <TableCell align="right">{row.archived || 0}</TableCell>
                        <TableCell align="right">{row.total}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    stats?.categoryDistribution && stats.categoryDistribution.map((category) => (
                      <TableRow key={category.category || 'unknown'}>
                        <TableCell>{formatCategoryName(category.category)}</TableCell>
                        <TableCell align="right">-</TableCell>
                        <TableCell align="right">-</TableCell>
                        <TableCell align="right">-</TableCell>
                        <TableCell align="right">-</TableCell>
                        <TableCell align="right">{category.count}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Paper>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default Reports; 