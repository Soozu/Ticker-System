import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Container,
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  InputAdornment,
  Alert,
  CircularProgress,
  Chip,
  Grid,
} from '@mui/material';
import {
  Search as SearchIcon,
  Email as EmailIcon,
  Tag as TagIcon,
  Category as CategoryIcon,
  PriorityHigh as PriorityIcon,
  Info as InfoIcon,
  Download as DownloadIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import BackButton from '../components/BackButton';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Add formatDate function
const formatDate = (dateString) => {
  if (!dateString) return 'Not available';
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

const TrackTicket = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [ticket, setTicket] = useState(null);
  const [formData, setFormData] = useState({
    trackingId: '',
    email: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    setError('');
    setTicket(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setTicket(null);

    try {
      // Validate inputs
      if (!formData.trackingId || !formData.email) {
        throw new Error('Please fill in all fields');
      }

      // Validate tracking ID format (YYYYMMDD-TICKETID)
      const trackingIdRegex = /^\d{8}-\d+$/;
      if (!trackingIdRegex.test(formData.trackingId)) {
        throw new Error('Invalid tracking ID format. Expected format: YYYYMMDD-TICKETID');
      }

      const response = await axios.post(`${API_BASE_URL}/tickets/track`, {
        trackingId: formData.trackingId,
        email: formData.email
      });

      if (response.data.success) {
        setTicket(response.data.ticket);
      }
    } catch (error) {
      console.error('Error tracking ticket:', error);
      setError(error.response?.data?.message || error.message || 'Failed to track ticket');
    } finally {
      setLoading(false);
    }
  };

  // Handle document download
  const handleDownload = async () => {
    try {
      setLoading(true);
      // Check if file path is available in categorySpecificDetails
      let filePath = null;
      let fileName = null;
      
      if (ticket.categorySpecificDetails?.details?.fileName) {
        filePath = ticket.categorySpecificDetails.details.fileName;
        fileName = ticket.categorySpecificDetails.details.originalFileName || filePath;
      }
      
      if (!filePath) {
        throw new Error('No document attached to this ticket');
      }
      
      const response = await axios.get(`${API_BASE_URL}/documents/public/${filePath}`, {
        responseType: 'blob',
      });

      // Create a download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Download error:', err);
      setError(err.message || 'Failed to download document');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case 'PENDING':
        return '#ed6c02';
      case 'IN_PROGRESS':
        return '#0288d1';
      case 'RESOLVED':
        return '#2e7d32';
      case 'CANCELLED':
        return '#d32f2f';
      default:
        return '#757575';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toUpperCase()) {
      case 'HIGH':
        return '#d32f2f';
      case 'MEDIUM':
        return '#ed6c02';
      case 'LOW':
        return '#2e7d32';
      default:
        return '#757575';
    }
  };

  const renderTicketDetails = () => {
    if (loading) {
      return (
        <Box sx={{ mt: 4 }}>
          <Paper elevation={2} sx={{ p: 5, borderRadius: 2, textAlign: 'center' }}>
            <CircularProgress size={60} sx={{ color: 'primary.main', mb: 3 }} />
            <Typography variant="h6" color="primary" gutterBottom>
              Tracking Your Ticket
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Please wait while we fetch your ticket details...
            </Typography>
          </Paper>
        </Box>
      );
    }

    if (!ticket) return null;

    return (
      <Box sx={{ mt: 4 }}>
        <Paper 
          elevation={3} 
          sx={{ 
            p: 4, 
            borderRadius: 2,
            border: '1px solid rgba(0, 0, 0, 0.1)',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)'
          }}
        >
          {/* Header with enhanced styling */}
          <Box sx={{ 
            mb: 4,
            pb: 3,
            borderBottom: '2px solid',
            borderColor: 'primary.main'
          }}>
            <Typography 
              variant="h5" 
              gutterBottom 
              sx={{ 
                color: 'primary.main',
                fontWeight: 600,
                mb: 2
              }}
            >
              Ticket Details
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <Box sx={{ 
                  p: 2, 
                  bgcolor: 'primary.light',
                  borderRadius: 1,
                  color: 'primary.dark'
                }}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Ticket ID
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    #{ticket.id}
                </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box sx={{ 
                  p: 2, 
                  bgcolor: 'primary.light',
                  borderRadius: 1,
                  color: 'primary.dark'
                }}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Tracking ID
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {ticket.trackingId}
                </Typography>
                </Box>
              </Grid>
            </Grid>
          </Box>

          {/* Status and Priority with enhanced visibility */}
          <Box sx={{ 
            mb: 4,
            display: 'flex',
            gap: 2,
            flexWrap: 'wrap'
          }}>
            <Chip
              icon={<InfoIcon />}
              label={`Status: ${ticket.status}`}
              sx={{
                px: 2,
                py: 2.5,
                fontSize: '1rem',
                bgcolor: `${getStatusColor(ticket.status)}15`,
                color: getStatusColor(ticket.status),
                borderColor: getStatusColor(ticket.status),
                '& .MuiChip-icon': {
                  color: getStatusColor(ticket.status),
                  fontSize: '1.2rem'
                },
              }}
              variant="outlined"
            />
            <Chip
              icon={<PriorityIcon />}
              label={`Priority: ${ticket.priority}`}
              sx={{
                px: 2,
                py: 2.5,
                fontSize: '1rem',
                bgcolor: `${getPriorityColor(ticket.priority)}15`,
                color: getPriorityColor(ticket.priority),
                borderColor: getPriorityColor(ticket.priority),
                '& .MuiChip-icon': {
                  color: getPriorityColor(ticket.priority),
                  fontSize: '1.2rem'
                },
              }}
              variant="outlined"
            />
            <Chip
              icon={<CategoryIcon />}
              label={`Category: ${ticket.category}`}
              sx={{
                px: 2,
                py: 2.5,
                fontSize: '1rem',
                bgcolor: 'primary.light',
                color: 'primary.dark',
                borderColor: 'primary.main',
                '& .MuiChip-icon': {
                  color: 'primary.dark',
                  fontSize: '1.2rem'
                },
              }}
              variant="outlined"
            />
          </Box>

          {/* Basic Information with card-like sections */}
          <Box sx={{ 
            mb: 4,
            p: 3,
            bgcolor: '#f8fafc',
            borderRadius: 2,
            border: '1px solid rgba(0, 0, 0, 0.1)'
          }}>
            <Typography 
              variant="h6" 
              gutterBottom 
              sx={{ 
                color: 'primary.main',
                fontWeight: 600,
                mb: 3,
                pb: 1,
                borderBottom: '2px solid',
                borderColor: 'primary.light'
              }}
            >
              Basic Information
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Name
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {ticket.name}
                </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Email
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {ticket.email}
                </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Department
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {ticket.department || 'Not specified'}
                </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Created
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {formatDate(ticket.createdAt)}
                </Typography>
                </Box>
              </Grid>
            </Grid>
          </Box>

          {/* Category Specific Details with enhanced styling */}
          {ticket.categorySpecificDetails && (
            <Box sx={{ 
              mb: 4,
              p: 3,
              bgcolor: '#f8fafc',
              borderRadius: 2,
              border: '1px solid rgba(0, 0, 0, 0.1)'
            }}>
              <Typography 
                variant="h6" 
                gutterBottom 
                sx={{ 
                  color: 'primary.main',
                  fontWeight: 600,
                  mb: 3,
                  pb: 1,
                  borderBottom: '2px solid',
                  borderColor: 'primary.light'
                }}
              >
                {ticket.categorySpecificDetails.type} Details
              </Typography>
              <Grid container spacing={3}>
                {Object.entries(ticket.categorySpecificDetails.details).map(([key, value]) => {
                  if (!value || key === 'fileName' || key === 'filePath' || key === 'originalFileName' || key === 'fileType' || key === 'fileSize') return null;
                  return (
                    <Grid item xs={12} sm={6} key={key}>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                          {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          {key === 'dateOfRequest' ? formatDate(value) : (Array.isArray(value) ? value.join(', ') : value)}
                      </Typography>
                      </Box>
                    </Grid>
                  );
                })}
              </Grid>
              
              {/* Document Download Button with enhanced styling */}
              {ticket.category === 'DOCUMENT_UPLOAD' && ticket.categorySpecificDetails?.details?.fileName && (
                <Box sx={{ mt: 3 }}>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<DownloadIcon />}
                    onClick={handleDownload}
                    disabled={loading}
                    sx={{
                      py: 1.5,
                      px: 3,
                      borderRadius: 2,
                      textTransform: 'none',
                      fontWeight: 500,
                      boxShadow: 2
                    }}
                  >
                    {loading ? 'Downloading...' : `Download ${ticket.categorySpecificDetails.details.originalFileName || 'Attached Document'}`}
                  </Button>
                </Box>
              )}
            </Box>
          )}

          {/* ICT Support Information with enhanced styling */}
          {(ticket.status === 'IN_PROGRESS' || ticket.status === 'RESOLVED' || ticket.status === 'CLOSED') && (
            <Box sx={{ 
              mt: 4,
              p: 3,
              bgcolor: '#E3F2FD',
              borderRadius: 2,
              border: '1px solid #1976D2'
            }}>
              <Typography 
                variant="h6" 
                sx={{ 
                  color: '#1976D2',
                  fontWeight: 600,
                  mb: 3,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}
              >
                <InfoIcon /> ICT Support Information
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Box sx={{ 
                    p: 2,
                    bgcolor: 'white',
                    borderRadius: 1,
                    mb: 2
                  }}>
                    <Typography variant="subtitle2" color="primary.dark" gutterBottom>
                      Assigned To
                    </Typography>
                    <Typography variant="body1" sx={{ 
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      color: 'text.primary',
                      fontWeight: 500
                    }}>
                      <PersonIcon fontSize="small" />
                      {ticket.ictAssignedTo || 'Not yet assigned'}
                    </Typography>
                  </Box>
                </Grid>
                {ticket.ictDiagnosisDetails && (
                  <Grid item xs={12}>
                    <Box sx={{ 
                      p: 2,
                      bgcolor: 'white',
                      borderRadius: 1,
                      mb: 2
                    }}>
                      <Typography variant="subtitle2" color="primary.dark" gutterBottom>
                        Diagnosis
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {ticket.ictDiagnosisDetails}
                      </Typography>
                    </Box>
                  </Grid>
                )}
                {ticket.ictFixDetails && (
                  <Grid item xs={12}>
                    <Box sx={{ 
                      p: 2,
                      bgcolor: 'white',
                      borderRadius: 1,
                      mb: 2
                    }}>
                      <Typography variant="subtitle2" color="primary.dark" gutterBottom>
                        Fix Details
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {ticket.ictFixDetails}
                      </Typography>
                    </Box>
                  </Grid>
                )}
                {ticket.ictDateFixed && (
                  <Grid item xs={12}>
                    <Box sx={{ 
                      p: 2,
                      bgcolor: 'white',
                      borderRadius: 1,
                      mb: 2
                    }}>
                      <Typography variant="subtitle2" color="primary.dark" gutterBottom>
                        Date Fixed
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {formatDate(ticket.ictDateFixed)}
                      </Typography>
                    </Box>
                  </Grid>
                )}
                {ticket.ictRecommendations && (
                  <Grid item xs={12}>
                    <Box sx={{ 
                      p: 2,
                      bgcolor: 'white',
                      borderRadius: 1
                    }}>
                      <Typography variant="subtitle2" color="primary.dark" gutterBottom>
                        Recommendations
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {ticket.ictRecommendations}
                      </Typography>
                    </Box>
                  </Grid>
                )}
              </Grid>
            </Box>
          )}

          {/* Status-specific messages with enhanced styling */}
          {ticket.status === 'PENDING' && (
            <Box sx={{ 
              mt: 4,
              p: 3,
              bgcolor: '#FFF3E0',
              borderRadius: 2,
              border: '1px solid #ED6C02'
            }}>
              <Typography variant="h6" sx={{ color: '#ED6C02', mb: 2, fontWeight: 600 }}>
                🕒 Ticket Status: Pending Review
              </Typography>
              <Typography variant="body1" sx={{ color: '#ED6C02' }}>
                Your ticket is currently in our queue. We process requests in order of priority and submission time. You will receive an email notification when your ticket status changes.
              </Typography>
            </Box>
          )}

          {ticket.status === 'RESOLVED' && (
            <Box sx={{ 
              mt: 4,
              p: 3,
              bgcolor: '#E8F5E9',
              borderRadius: 2,
              border: '1px solid #2E7D32'
            }}>
              <Typography variant="h6" sx={{ color: '#2E7D32', mb: 2, fontWeight: 600 }}>
                🎉 Ticket Resolved Successfully!
              </Typography>
              <Typography variant="body1" sx={{ color: '#2E7D32', mb: 3 }}>
                We're glad we could help! Your feedback is important to us and helps improve our service.
              </Typography>
              <Button
                variant="contained"
                color="success"
                size="large"
                onClick={() => window.open('https://csm.depedimuscity.com/', '_blank')}
                startIcon={<InfoIcon />}
                sx={{ 
                  py: 1.5,
                  px: 3,
                  bgcolor: '#2E7D32',
                  '&:hover': {
                    bgcolor: '#1B5E20'
                  },
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 500
                }}
                fullWidth
              >
                Share Your Feedback
              </Button>
            </Box>
          )}

          {/* Last Update with enhanced styling */}
          <Box sx={{ 
            mt: 4,
            pt: 3,
            borderTop: '2px solid',
            borderColor: 'divider',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <Typography variant="body2" color="text.secondary">
              Last updated: {formatDate(ticket.updatedAt)}
            </Typography>
            <Chip
              label={`Ticket Age: ${Math.ceil((new Date() - new Date(ticket.createdAt)) / (1000 * 60 * 60 * 24))} days`}
              size="small"
              sx={{ bgcolor: 'grey.100' }}
            />
          </Box>
        </Paper>
      </Box>
    );
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5' }}>
      {/* Header */}
      <Paper 
        elevation={0} 
        sx={{ 
          py: 3,
          px: 3, 
          bgcolor: '#1976d2', 
          color: 'white',
          borderRadius: 0,
          position: 'relative'
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center',
            gap: 2
          }}>
            <BackButton 
              onClick={() => navigate('/')} 
              sx={{ 
                color: 'white',
                bgcolor: 'rgba(255, 255, 255, 0.1)',
                '&:hover': {
                  bgcolor: 'rgba(255, 255, 255, 0.2)',
                }
              }} 
            />
            <Typography variant="h5" sx={{ 
              fontWeight: 600,
              fontFamily: '"Lisu Bosa", serif'
            }}>
              Track Ticket
            </Typography>
          </Box>
        </Container>
      </Paper>

      {/* Main Content */}
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Paper 
          elevation={2} 
          sx={{ 
            p: 4,
            borderRadius: 2,
          }}
        >
          <Typography variant="h5" gutterBottom align="center" sx={{ mb: 3 }}>
            Track Your Ticket
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              fullWidth
              required
              name="trackingId"
              label="Tracking ID"
              value={formData.trackingId}
              onChange={handleChange}
              placeholder="YYYYMMDD-TICKETID"
              sx={{ mb: 3 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <TagIcon color="action" />
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              fullWidth
              required
              name="email"
              label="Email Address"
              type="email"
              value={formData.email}
              onChange={handleChange}
              sx={{ mb: 4 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailIcon color="action" />
                  </InputAdornment>
                ),
              }}
            />

            <Button
              fullWidth
              variant="contained"
              size="large"
              type="submit"
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : <SearchIcon />}
              sx={{
                py: 1.5,
                fontSize: '1.1rem',
                textTransform: 'none',
              }}
            >
              {loading ? 'Searching...' : 'Track Ticket'}
            </Button>
          </Box>
        </Paper>

        {/* Ticket Details Section */}
        {renderTicketDetails()}

        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Need help? Contact our support team
          </Typography>
        </Box>
      </Container>

      {/* Footer */}
      <Box 
        component="footer" 
        sx={{ 
          py: 3,
          textAlign: 'center',
          position: 'fixed',
          bottom: 0,
          width: '100%',
          bgcolor: 'background.paper',
          borderTop: '1px solid',
          borderColor: 'divider'
        }}
      >
        <Typography variant="body2" color="text.secondary">
          © {new Date().getFullYear()} DepEd Imus Division | imus.city@deped.gov.ph
        </Typography>
      </Box>
    </Box>
  );
};

export default TrackTicket; 