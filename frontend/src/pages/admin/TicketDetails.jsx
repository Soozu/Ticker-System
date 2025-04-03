import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Chip,
  Button,
  CircularProgress,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  Category as CategoryIcon,
  Flag as PriorityIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const TicketDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [comment, setComment] = useState('');
  const [ictDetailsDialogOpen, setIctDetailsDialogOpen] = useState(false);
  const [ictDetails, setIctDetails] = useState({
    assignedTo: '',
    diagnosisDetails: '',
    fixDetails: '',
    dateFixed: '',
    recommendations: ''
  });

  // Fetch ticket details
  const fetchTicketDetails = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await axios.get(`${API_BASE_URL}/admin/tickets/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        setTicket(response.data.data);
        setNewStatus(response.data.data.status);
      } else {
        throw new Error(response.data.message);
      }
    } catch (err) {
      console.error('Error fetching ticket details:', err);
      setError(err.message || 'Failed to load ticket details');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchTicketDetails();
  }, [fetchTicketDetails]);

  // Handle status update
  const handleStatusUpdate = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `${API_BASE_URL}/admin/tickets/${id}/status`,
        { 
          status: newStatus,
          comment: comment 
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        setStatusDialogOpen(false);
        fetchTicketDetails();
      } else {
        throw new Error(response.data.message);
      }
    } catch (err) {
      setError(err.message || 'Failed to update ticket status');
    }
  };

  // Handle document download
  const handleDownload = async () => {
    try {
      // Check if file path is available either in documentPath or in categorySpecificDetails
      let filePath = null;
      
      if (ticket.documentPath) {
        filePath = ticket.documentPath;
      } else if (ticket.categorySpecificDetails?.details?.filePath) {
        // Extract just the filename from the full path
        const fullPath = ticket.categorySpecificDetails.details.filePath;
        filePath = fullPath.split('/').pop();
      }
      
      if (!filePath) {
        throw new Error('No document attached to this ticket');
      }
      
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/documents/${filePath}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        responseType: 'blob',
      });

      // Create a download link using Blob URL
      const fileName = ticket.categorySpecificDetails?.details?.originalFileName || filePath;
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
    }
  };

  // Handle ICT details update
  const handleIctDetailsUpdate = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `${API_BASE_URL}/admin/tickets/${id}/ict-details`,
        ictDetails,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        setIctDetailsDialogOpen(false);
        fetchTicketDetails();
      } else {
        throw new Error(response.data.message);
      }
    } catch (err) {
      setError(err.message || 'Failed to update ICT details');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      PENDING: 'warning',
      IN_PROGRESS: 'info',
      RESOLVED: 'success',
      CLOSED: 'default',
    };
    return colors[status] || 'default';
  };

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

  // Add this helper function to format date for datetime-local input
  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().slice(0, 16); // Format: YYYY-MM-DDThh:mm
  };

  // Update the onClick handler for the Take Action button
  const handleTakeActionClick = () => {
    setIctDetails({
      assignedTo: ticket.ictAssignedTo || '',
      diagnosisDetails: ticket.ictDiagnosisDetails || '',
      fixDetails: ticket.ictFixDetails || '',
      dateFixed: ticket.ictDateFixed ? formatDateForInput(ticket.ictDateFixed) : '',
      recommendations: ticket.ictRecommendations || ''
    });
    setNewStatus('IN_PROGRESS');
    setIctDetailsDialogOpen(true);
  };

  // Update the onClick handler for the Resolve Ticket button
  const handleResolveClick = () => {
    setIctDetails({
      assignedTo: ticket.ictAssignedTo || '',
      diagnosisDetails: ticket.ictDiagnosisDetails || '',
      fixDetails: ticket.ictFixDetails || '',
      dateFixed: ticket.ictDateFixed ? formatDateForInput(ticket.ictDateFixed) : '',
      recommendations: ticket.ictRecommendations || ''
    });
    setNewStatus('RESOLVED');
    setIctDetailsDialogOpen(true);
  };

  const handleIctActionClick = async () => {
    try {
      // Validate required fields based on the action type
      if (newStatus === 'RESOLVED') {
        if (!ictDetails.diagnosisDetails || !ictDetails.fixDetails || !ictDetails.dateFixed) {
          setError('Please fill in all required fields');
          return;
        }
      } else if (!ictDetails.assignedTo) {
        setError('Please provide the name of the ICT staff assigned');
        return;
      }

      // First update ICT details
      await handleIctDetailsUpdate();
      
      // Then update the status
      await handleStatusUpdate();

      // Send resolution email if status is RESOLVED
      if (newStatus === 'RESOLVED') {
        try {
          const token = localStorage.getItem('token');
          await axios.post(
            `${API_BASE_URL}/admin/tickets/${id}/send-resolution`,
            {
              email: ticket.email,
              name: ticket.name,
              trackingId: ticket.trackingId,
              category: ticket.category,
              subject: ticket.subject || ticket.documentSubject,
              ictFixDetails: ictDetails.fixDetails,
              ictRecommendations: ictDetails.recommendations
            },
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
        } catch (emailError) {
          console.error('Error sending resolution email:', emailError);
          // Don't throw the error as the ticket update was successful
        }
      }
      
      setIctDetailsDialogOpen(false);
    } catch (err) {
      setError(err.message || 'Failed to update ticket');
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (!ticket) {
    return <Alert severity="error">Ticket not found</Alert>;
  }

  return (
    <Box 
      sx={{ 
        p: 4,
        backgroundColor: '#f8fafc',
        minHeight: '100vh'
      }}
    >
      {error && (
        <Alert 
          severity="error" 
          sx={{ 
            mb: 3,
            borderRadius: '8px',
            '& .MuiAlert-icon': {
              color: '#d32f2f'
            }
          }}
        >
          {error}
        </Alert>
      )}

      <Paper 
        sx={{ 
          p: 4,
          borderRadius: '16px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
        }}
      >
        {/* Header */}
        <Box 
          sx={{ 
            mb: 4, 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center' 
          }}
        >
          <Typography 
            variant="h4" 
            sx={{
              fontWeight: 700,
              fontFamily: '"Lisu Bosa", serif',
              background: 'linear-gradient(135deg, #1976d2, #42a5f5)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              color: 'transparent',
              fontSize: '2rem'
            }}
          >
            Ticket #{ticket.id}
          </Typography>
          <Box>
            <Button
              variant="outlined"
              sx={{ 
                mr: 2,
                borderColor: '#1976d2',
                color: '#1976d2',
                '&:hover': {
                  borderColor: '#1565c0',
                  backgroundColor: 'rgba(25, 118, 210, 0.04)'
                }
              }}
              onClick={() => navigate('/admin/tickets')}
            >
              Back to List
            </Button>
            <Button
              variant="contained"
              sx={{
                background: 'linear-gradient(135deg, #1976d2, #42a5f5)',
                boxShadow: '0 4px 12px rgba(25, 118, 210, 0.2)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #1565c0, #1976d2)',
                }
              }}
              onClick={() => setStatusDialogOpen(true)}
            >
              Update Status
            </Button>
          </Box>
        </Box>

        <Divider sx={{ mb: 4 }} />

        {/* Ticket Information */}
        <Grid container spacing={4}>
          {/* Basic Information */}
          <Grid item xs={12} md={6}>
            <Paper
              sx={{
                p: 3,
                height: '100%',
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                backgroundColor: 'white'
              }}
            >
              <Typography 
                variant="h6" 
                gutterBottom
                sx={{
                  fontWeight: 600,
                  color: '#1976d2',
                  mb: 2,
                  fontFamily: '"Lisu Bosa", serif',
                }}
              >
                Basic Information
              </Typography>
              <List>
                <ListItem>  
                  <ListItemText
                    primary={
                      <Box component="span" sx={{ color: '#666', fontSize: '0.9rem', fontWeight: 500 }}>
                        Tracking ID
                      </Box>
                    }
                    secondary={
                      <Box component="span" sx={{ color: '#333', mt: 0.5 }}>
                        {ticket.trackingId}
                      </Box>
                    }
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary={
                      <Box component="span" sx={{ color: '#666', fontSize: '0.9rem', fontWeight: 500 }}>
                        Status
                      </Box>
                    }
                    secondary={
                      <Typography component="span" sx={{ mt: 0.5 }}>
                        <Chip
                          label={ticket.status.replace(/_/g, ' ')}
                          color={getStatusColor(ticket.status)}
                          size="small"
                          sx={{ fontWeight: 500, fontSize: '0.85rem' }}
                        />
                      </Typography>
                    }
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary={
                      <Box component="span" sx={{ color: '#666', fontSize: '0.9rem', fontWeight: 500 }}>
                        Category
                      </Box>
                    }
                    secondary={
                      <Typography component="span" sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                        <CategoryIcon sx={{ color: '#1976d2', fontSize: '1.2rem' }} />
                        <Box component="span" sx={{ color: '#333', fontSize: '0.95rem' }}>
                          {ticket.category.replace(/_/g, ' ')}
                        </Box>
                      </Typography>
                    }
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary={
                      <Box component="span" sx={{ color: '#666', fontSize: '0.9rem', fontWeight: 500 }}>
                        Priority
                      </Box>
                    }
                    secondary={
                      <Typography component="span" sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                        <PriorityIcon sx={{ color: ticket.priority === 'HIGH' ? '#d32f2f' : '#1976d2', fontSize: '1.2rem' }} />
                        <Box component="span" sx={{ 
                          color: ticket.priority === 'HIGH' ? '#d32f2f' : '#333',
                          fontWeight: ticket.priority === 'HIGH' ? 600 : 400,
                          fontSize: '0.95rem'
                        }}>
                          {ticket.priority}
                        </Box>
                      </Typography>
                    }
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary={
                      <Box component="span" sx={{ color: '#666', fontSize: '0.9rem', fontWeight: 500 }}>
                        Created At
                      </Box>
                    }
                    secondary={
                      <Typography component="span" sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                        <ScheduleIcon sx={{ color: '#1976d2', fontSize: '1.2rem' }} />
                        <Box component="span" sx={{ color: '#333', fontSize: '0.95rem' }}>
                          {formatDate(ticket.createdAt)}
                        </Box>
                      </Typography>
                    }
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary={
                      <Box component="span" sx={{ color: '#666', fontSize: '0.9rem', fontWeight: 500 }}>
                        Location & Department
                      </Box>
                    }
                    secondary={
                      <Box component="span" sx={{ mt: 0.5 }}>
                        {ticket.location === 'SDO_IMUS_CITY' ? (
                          <>
                            <Typography component="span" variant="body2">
                              Location: SDO - Imus City
                            </Typography>
                            <Typography component="span" variant="body2" sx={{ display: 'block' }}>
                              Department: {ticket.department || 'Not specified'}
                            </Typography>
                          </>
                        ) : (
                          <>
                            <Typography component="span" variant="body2">
                              Location: School - Imus City
                            </Typography>
                            <Typography component="span" variant="body2" sx={{ display: 'block' }}>
                              School Level: {ticket.schoolLevel || 'Not specified'}
                            </Typography>
                            <Typography component="span" variant="body2" sx={{ display: 'block' }}>
                              School Name: {ticket.schoolName || 'Not specified'}
                            </Typography>
                          </>
                        )}
                      </Box>
                    }
                  />
                </ListItem>
                {ticket.location === 'SDO_IMUS_CITY' && (
                  <ListItem>
                    <ListItemText
                      primary={
                        <Box component="span" sx={{ color: '#666', fontSize: '0.9rem', fontWeight: 500 }}>
                          Department
                        </Box>
                      }
                      secondary={
                        <Typography component="span" sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                          <Box component="span" sx={{ color: '#333', fontSize: '0.95rem' }}>
                            {ticket.department || ticket.categorySpecificDetails?.details?.department || 'Not specified'}
                          </Box>
                        </Typography>
                      }
                    />
                  </ListItem>
                )}
                {ticket.location === 'SCHOOL_IMUS_CITY' && (
                  <>
                    <ListItem>
                      <ListItemText
                        primary={
                          <Box component="span" sx={{ color: '#666', fontSize: '0.9rem', fontWeight: 500 }}>
                            School Level
                          </Box>
                        }
                        secondary={
                          <Typography component="span" sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                            <Box component="span" sx={{ color: '#333', fontSize: '0.95rem' }}>
                              {ticket.categorySpecificDetails?.details?.schoolLevel || 'Not specified'}
                            </Box>
                          </Typography>
                        }
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary={
                          <Box component="span" sx={{ color: '#666', fontSize: '0.9rem', fontWeight: 500 }}>
                            School Name
                          </Box>
                        }
                        secondary={
                          <Typography component="span" sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                            <Box component="span" sx={{ color: '#333', fontSize: '0.95rem' }}>
                              {ticket.categorySpecificDetails?.details?.schoolName || 'Not specified'}
                            </Box>
                          </Typography>
                        }
                      />
                    </ListItem>
                  </>
                )}
              </List>
            </Paper>
          </Grid>

          {/* ICT Support Information */}
          <Grid item xs={12} md={6}>
            <Paper
              sx={{
                p: 3,
                height: '100%',
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                backgroundColor: 'white'
              }}
            >
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                mb: 2 
              }}>
                <Typography 
                  variant="h6"
                  sx={{
                    fontWeight: 600,
                    color: '#1976d2',
                    fontFamily: '"Lisu Bosa", serif',
                  }}
                >
                  ICT Support Information
                </Typography>
                <Box>
                  {!ticket.ictAssignedTo && (
                    <Button
                      variant="contained"
                      size="small"
                      sx={{
                        background: 'linear-gradient(135deg, #1976d2, #42a5f5)',
                        boxShadow: '0 2px 8px rgba(25, 118, 210, 0.2)',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #1565c0, #1976d2)',
                        }
                      }}
                      onClick={handleTakeActionClick}
                    >
                      Take Action
                    </Button>
                  )}
                  {ticket.ictAssignedTo && ticket.status !== 'RESOLVED' && (
                    <Button
                      variant="contained"
                      size="small"
                      sx={{
                        background: 'linear-gradient(135deg, #2e7d32, #4caf50)',
                        boxShadow: '0 2px 8px rgba(46, 125, 50, 0.2)',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #1b5e20, #2e7d32)',
                        }
                      }}
                      onClick={handleResolveClick}
                    >
                      Resolve Ticket
                    </Button>
                  )}
                </Box>
              </Box>
              <List>
                <ListItem>
                  <ListItemText
                    primary={
                      <Box component="span" sx={{ color: '#666', fontSize: '0.9rem', fontWeight: 500 }}>
                        Assigned To
                      </Box>
                    }
                    secondary={
                      <Typography component="span" sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                        <PersonIcon sx={{ color: '#1976d2', fontSize: '1.2rem' }} />
                        <Box component="span" sx={{ 
                          color: ticket.ictAssignedTo ? '#333' : '#666',
                          fontStyle: ticket.ictAssignedTo ? 'normal' : 'italic',
                          fontSize: '0.95rem',
                          display: 'block'
                        }}>
                          {ticket.ictAssignedTo || 'Not yet assigned'}
                        </Box>
                      </Typography>
                    }
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary={
                      <Box component="span" sx={{ color: '#666', fontSize: '0.9rem', fontWeight: 500 }}>
                        Diagnosis Details
                      </Box>
                    }
                    secondary={
                      <Typography component="span" sx={{ 
                        color: ticket.ictDiagnosisDetails ? '#333' : '#666',
                        fontStyle: ticket.ictDiagnosisDetails ? 'normal' : 'italic',
                        fontSize: '0.95rem',
                        mt: 0.5
                      }}>
                        {ticket.ictDiagnosisDetails || 'No diagnosis provided'}
                      </Typography>
                    }
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary={
                      <Box component="span" sx={{ color: '#666', fontSize: '0.9rem', fontWeight: 500 }}>
                        Fix Details
                      </Box>
                    }
                    secondary={
                      <Typography component="span" sx={{ 
                        color: ticket.ictFixDetails ? '#333' : '#666',
                        fontStyle: ticket.ictFixDetails ? 'normal' : 'italic',
                        fontSize: '0.95rem',
                        mt: 0.5
                      }}>
                        {ticket.ictFixDetails || 'No fix details provided'}
                      </Typography>
                    }
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary={
                      <Box component="span" sx={{ color: '#666', fontSize: '0.9rem', fontWeight: 500 }}>
                        Date Fixed
                      </Box>
                    }
                    secondary={
                      <Typography component="span" sx={{ 
                        color: ticket.ictDateFixed ? '#333' : '#666',
                        fontStyle: ticket.ictDateFixed ? 'normal' : 'italic',
                        fontSize: '0.95rem',
                        mt: 0.5
                      }}>
                        {ticket.ictDateFixed ? formatDate(ticket.ictDateFixed) : 'Not yet fixed'}
                      </Typography>
                    }
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary={
                      <Box component="span" sx={{ color: '#666', fontSize: '0.9rem', fontWeight: 500 }}>
                        Recommendations
                      </Box>
                    }
                    secondary={
                      <Typography component="span" sx={{ 
                        color: ticket.ictRecommendations ? '#333' : '#666',
                        fontStyle: ticket.ictRecommendations ? 'normal' : 'italic',
                        fontSize: '0.95rem',
                        mt: 0.5
                      }}>
                        {ticket.ictRecommendations || 'No recommendations provided'}
                      </Typography>
                    }
                  />
                </ListItem>
              </List>
            </Paper>
          </Grid>

          {/* Ticket Details */}
          <Grid item xs={12}>
            <Paper
              sx={{
                p: 3,
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                backgroundColor: 'white'
              }}
            >
              <Typography 
                variant="h6" 
                gutterBottom
                sx={{
                  fontWeight: 600,
                  color: '#1976d2',
                  mb: 3,
                  fontFamily: '"Lisu Bosa", serif',
                }}
              >
                Ticket Details
              </Typography>
              <Box sx={{ bgcolor: 'rgba(25, 118, 210, 0.04)', p: 2, borderRadius: '8px' }}>
                {ticket.category === 'TROUBLESHOOTING' && (
                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <Typography 
                        variant="subtitle1" 
                        sx={{
                          fontWeight: 600,
                          color: '#1976d2',
                          mb: 2
                        }}
                      >
                        Technical Issue Details
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <List>
                        <ListItem>
                          <ListItemText
                            primary={
                              <Box component="span" sx={{ color: '#666', fontSize: '0.9rem', fontWeight: 500 }}>
                                Name
                              </Box>
                            }
                            secondary={
                              <Box component="span" sx={{ color: '#333', mt: 0.5 }}>
                                {ticket.name || 'N/A'}
                              </Box>
                            }
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemText
                            primary={
                              <Box component="span" sx={{ color: '#666', fontSize: '0.9rem', fontWeight: 500 }}>
                                Email
                              </Box>
                            }
                            secondary={
                              <Box component="span" sx={{ color: '#333', mt: 0.5 }}>
                                {ticket.email || 'N/A'}
                              </Box>
                            }
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemText
                            primary={
                              <Box component="span" sx={{ color: '#666', fontSize: '0.9rem', fontWeight: 500 }}>
                                Location
                              </Box>
                            }
                            secondary={
                              <Box component="span" sx={{ color: '#333', mt: 0.5 }}>
                                {ticket.location === 'SDO_IMUS_CITY' ? 'SDO - Imus City' : 'School - Imus City'}
                              </Box>
                            }
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemText
                            primary={
                              <Box component="span" sx={{ color: '#666', fontSize: '0.9rem', fontWeight: 500 }}>
                                Date of Request
                              </Box>
                            }
                            secondary={
                              <Box component="span" sx={{ color: '#333', mt: 0.5 }}>
                                {ticket.dateOfRequest ? formatDate(ticket.dateOfRequest) : 'N/A'}
                              </Box>
                            }
                          />
                        </ListItem>
                      </List>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <List>
                        <ListItem>
                          <ListItemText
                            primary={
                              <Box component="span" sx={{ color: '#666', fontSize: '0.9rem', fontWeight: 500 }}>
                                Type of Equipment
                              </Box>
                            }
                            secondary={
                              <Box component="span" sx={{ color: '#333', mt: 0.5 }}>
                                {ticket.typeOfEquipment || 'N/A'}
                              </Box>
                            }
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemText
                            primary={
                              <Box component="span" sx={{ color: '#666', fontSize: '0.9rem', fontWeight: 500 }}>
                                Model of Equipment
                              </Box>
                            }
                            secondary={
                              <Box component="span" sx={{ color: '#333', mt: 0.5 }}>
                                {ticket.modelOfEquipment || 'N/A'}
                              </Box>
                            }
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemText
                            primary={
                              <Box component="span" sx={{ color: '#666', fontSize: '0.9rem', fontWeight: 500 }}>
                                Serial No.
                              </Box>
                            }
                            secondary={
                              <Box component="span" sx={{ color: '#333', mt: 0.5 }}>
                                {ticket.serialNo || 'N/A'}
                              </Box>
                            }
                          />
                        </ListItem>
                      </List>
                    </Grid>
                    <Grid item xs={12}>
                      <List>
                        <ListItem>
                          <ListItemText
                            primary={
                              <Box component="span" sx={{ color: '#666', fontSize: '0.9rem', fontWeight: 500 }}>
                                Specific Problem
                              </Box>
                            }
                            secondary={
                              <Box component="span" sx={{ 
                                color: '#333', 
                                mt: 0.5,
                                bgcolor: 'white',
                                p: 2,
                                borderRadius: '4px',
                                border: '1px solid rgba(0, 0, 0, 0.1)',
                                display: 'block',
                                whiteSpace: 'pre-wrap',
                                width: '100%'
                              }}>
                                {ticket.specificProblem || 'Not provided'}
                              </Box>
                            }
                          />
                        </ListItem>
                      </List>
                    </Grid>
                  </Grid>
                )}

                {ticket.category === 'ACCOUNT_MANAGEMENT' && (
                  <>
                    <Typography variant="subtitle1" gutterBottom>
                      Account Request Details
                    </Typography>
                    <List>
                      <ListItem>
                        <ListItemText
                          primary={
                            <Box component="span" sx={{ color: '#666', fontSize: '0.9rem', fontWeight: 500 }}>
                              Name
                            </Box>
                          }
                          secondary={
                            <Box component="span" sx={{ color: '#333', mt: 0.5 }}>
                              {ticket.name || 'N/A'}
                            </Box>
                          }
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText
                          primary={
                            <Box component="span" sx={{ color: '#666', fontSize: '0.9rem', fontWeight: 500 }}>
                              Email
                            </Box>
                          }
                          secondary={
                            <Box component="span" sx={{ color: '#333', mt: 0.5 }}>
                              {ticket.email || 'N/A'}
                            </Box>
                          }
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText
                          primary={
                            <Box component="span" sx={{ color: '#666', fontSize: '0.9rem', fontWeight: 500 }}>
                              Account Type
                            </Box>
                          }
                          secondary={
                            <Box component="span" sx={{ color: '#333', mt: 0.5 }}>
                              {ticket.accountType || 'Not specified'}
                            </Box>
                          }
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText
                          primary={
                            <Box component="span" sx={{ color: '#666', fontSize: '0.9rem', fontWeight: 500 }}>
                              Action Type
                            </Box>
                          }
                          secondary={
                            <Box component="span" sx={{ color: '#333', mt: 0.5 }}>
                              {ticket.actionType || 'Not specified'}
                            </Box>
                          }
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText
                          primary={
                            <Box component="span" sx={{ color: '#666', fontSize: '0.9rem', fontWeight: 500 }}>
                              Subject
                            </Box>
                          }
                          secondary={
                            <Box component="span" sx={{ color: '#333', mt: 0.5 }}>
                              {ticket.subject || 'Not specified'}
                            </Box>
                          }
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText
                          primary={
                            <Box component="span" sx={{ color: '#666', fontSize: '0.9rem', fontWeight: 500 }}>
                              Message
                            </Box>
                          }
                          secondary={
                            <Box component="span" sx={{ 
                              color: '#333', 
                              mt: 0.5,
                              display: 'block',
                              whiteSpace: 'pre-wrap'
                            }}>
                              {ticket.message || 'Not provided'}
                            </Box>
                          }
                        />
                      </ListItem>
                    </List>
                  </>
                )}

                {ticket.category === 'DOCUMENT_UPLOAD' && (
                  <>
                    <Typography variant="subtitle1" gutterBottom>
                      Document Information
                    </Typography>
                    <List>
                      <ListItem>
                        <ListItemText
                          primary={
                            <Box component="span" sx={{ color: '#666', fontSize: '0.9rem', fontWeight: 500 }}>
                              Name
                            </Box>
                          }
                          secondary={
                            <Box component="span" sx={{ color: '#333', mt: 0.5 }}>
                              {ticket.name || 'N/A'}
                            </Box>
                          }
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText
                          primary={
                            <Box component="span" sx={{ color: '#666', fontSize: '0.9rem', fontWeight: 500 }}>
                              Email
                            </Box>
                          }
                          secondary={
                            <Box component="span" sx={{ color: '#333', mt: 0.5 }}>
                              {ticket.email || 'N/A'}
                            </Box>
                          }
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText
                          primary={
                            <Box component="span" sx={{ color: '#666', fontSize: '0.9rem', fontWeight: 500 }}>
                              Location
                            </Box>
                          }
                          secondary={
                            <Box component="span" sx={{ color: '#333', mt: 0.5 }}>
                              {ticket.location || 'N/A'}
                            </Box>
                          }
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText
                          primary={
                            <Box component="span" sx={{ color: '#666', fontSize: '0.9rem', fontWeight: 500 }}>
                              Document Subject
                            </Box>
                          }
                          secondary={
                            <Box component="span" sx={{ color: '#333', mt: 0.5 }}>
                              {ticket.documentSubject || ticket.subject || 'Not specified'}
                            </Box>
                          }
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText
                          primary={
                            <Box component="span" sx={{ color: '#666', fontSize: '0.9rem', fontWeight: 500 }}>
                              Document Type
                            </Box>
                          }
                          secondary={
                            <Box component="span" sx={{ color: '#333', mt: 0.5 }}>
                              {ticket.categorySpecificDetails?.details?.documentType || 'Not specified'}
                            </Box>
                          }
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText
                          primary={
                            <Box component="span" sx={{ color: '#666', fontSize: '0.9rem', fontWeight: 500 }}>
                              Message
                            </Box>
                          }
                          secondary={
                            <Box component="span" sx={{ 
                              color: '#333', 
                              mt: 0.5,
                              display: 'block',
                              whiteSpace: 'pre-wrap'
                            }}>
                              {ticket.documentMessage || ticket.message || 'Not provided'}
                            </Box>
                          }
                        />
                      </ListItem>
                      {ticket.documentPath && (
                        <ListItem>
                          <ListItemText
                            primary={
                              <Box component="span" sx={{ color: '#666', fontSize: '0.9rem', fontWeight: 500 }}>
                                Attached Document
                              </Box>
                            }
                            secondary={
                              <Box component="span" variant="body2">
                                <Button
                                  startIcon={<DownloadIcon />}
                                  onClick={handleDownload}
                                  size="small"
                                >
                                  Download Document
                                </Button>
                              </Box>
                            }
                          />
                        </ListItem>
                      )}
                      {!ticket.documentPath && ticket.categorySpecificDetails?.details?.fileName && (
                        <ListItem>
                          <ListItemText
                            primary={
                              <Box component="span" sx={{ color: '#666', fontSize: '0.9rem', fontWeight: 500 }}>
                                Attached Document
                              </Box>
                            }
                            secondary={
                              <Box component="span" variant="body2">
                                <Button
                                  startIcon={<DownloadIcon />}
                                  onClick={handleDownload}
                                  size="small"
                                >
                                  Download {ticket.categorySpecificDetails.details.originalFileName || 'Document'}
                                </Button>
                              </Box>
                            }
                          />
                        </ListItem>
                      )}
                    </List>
                  </>
                )}
                {ticket.category === 'TECHNICAL_ASSISTANCE' && (
                  <Box>
                    <Box component="div" sx={{ mb: 1 }}><strong>Name:</strong> {ticket.name || 'N/A'}</Box>
                    <Box component="div" sx={{ mb: 1 }}><strong>Email:</strong> {ticket.email || 'N/A'}</Box>
                    <Box component="div" sx={{ mb: 1 }}><strong>Priority:</strong> {ticket.priority}</Box>
                    <Box component="div" sx={{ mb: 1 }}><strong>Location:</strong> {ticket.categorySpecificDetails?.details?.location}</Box>
                    {ticket.location === 'SCHOOL_IMUS_CITY' && (
                      <>
                        <Box component="div" sx={{ mb: 1 }}><strong>School Level:</strong> {ticket.categorySpecificDetails?.details?.schoolLevel}</Box>
                        <Box component="div" sx={{ mb: 1 }}><strong>School Name:</strong> {ticket.categorySpecificDetails?.details?.schoolName}</Box>
                      </>
                    )}
                    {ticket.location === 'SDO_IMUS_CITY' && (
                      <Box component="div" sx={{ mb: 1 }}><strong>Department:</strong> {ticket.categorySpecificDetails?.details?.department}</Box>
                    )}
                  </Box>
                )}
              </Box>
            </Paper>
          </Grid>

          {/* Category-specific additional details from JSON */}
          {ticket.categorySpecificDetails && ticket.category === 'TECHNICAL_ASSISTANCE' && (
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Additional Details
              </Typography>
              <Paper sx={{ p: 2, bgcolor: 'grey.100' }}>
                <Typography variant="subtitle1" gutterBottom>
                  {ticket.categorySpecificDetails.type}
                </Typography>
                <List>
                  {Object.entries(ticket.categorySpecificDetails.details || {}).map(([key, value]) => {
                    if (!value) return null;
                    return (
                      <ListItem key={key}>
                        <ListItemText
                          primary={key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
                          secondary={
                            key.toLowerCase().includes('date') 
                              ? formatDate(value)
                              : typeof value === 'object' 
                                ? JSON.stringify(value) 
                                : String(value)
                          }
                        />
                      </ListItem>
                    );
                  })}
                  <ListItem>
                    <ListItemText
                      primary="Subject"
                      secondary={ticket.subject || 'Not specified'}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Message"
                      secondary={ticket.message || 'Not provided'}
                    />
                  </ListItem>
                </List>
              </Paper>
            </Grid>
          )}

          {/* Updates History */}
          <Grid item xs={12}>
            <Paper
              sx={{
                p: 3,
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                backgroundColor: 'white'
              }}
            >
              <Typography 
                variant="h6" 
                gutterBottom
                sx={{
                  fontWeight: 600,
                  color: '#1976d2',
                  mb: 3,
                  fontFamily: '"Lisu Bosa", serif',
                }}
              >
                Updates History
              </Typography>
              <List>
                {ticket.updates?.map((update, index) => (
                  <ListItem 
                    key={index} 
                    sx={{
                      mb: 2,
                      bgcolor: 'rgba(25, 118, 210, 0.04)',
                      borderRadius: '8px',
                      p: 2
                    }}
                  >
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <Chip
                            label={update.newStatus.replace(/_/g, ' ')}
                            color={getStatusColor(update.newStatus)}
                            size="small"
                            sx={{ fontWeight: 500 }}
                          />
                          <Typography 
                            component="span" 
                            variant="caption" 
                            sx={{ 
                              color: '#666',
                              fontStyle: 'italic'
                            }}
                          >
                            {formatDate(update.createdAt)}
                          </Typography>
                        </Box>
                      }
                      secondary={
                        <Box 
                          sx={{ 
                            color: '#333',
                            bgcolor: 'white',
                            p: 1.5,
                            borderRadius: '4px',
                            border: '1px solid rgba(0, 0, 0, 0.1)'
                          }}
                        >
                          {update.comment}
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Grid>
        </Grid>
      </Paper>

      {/* Status Update Dialog */}
      <Dialog 
        open={statusDialogOpen} 
        onClose={() => setStatusDialogOpen(false)}
        PaperProps={{
          sx: {
            borderRadius: '12px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
          }
        }}
      >
        <DialogTitle 
          sx={{ 
            fontFamily: '"Lisu Bosa", serif',
            fontWeight: 600,
            color: '#1976d2',
            borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
            pb: 2
          }}
        >
          Update Ticket Status
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel>New Status</InputLabel>
            <Select
              value={newStatus}
              label="New Status"
              onChange={(e) => setNewStatus(e.target.value)}
              sx={{
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgba(0, 0, 0, 0.1)'
                }
              }}
            >
              <MenuItem value="PENDING">Pending</MenuItem>
              <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
              <MenuItem value="RESOLVED">Resolved</MenuItem>
              <MenuItem value="CLOSED">Closed</MenuItem>
            </Select>
          </FormControl>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Add a comment about this status update..."
            sx={{
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: 'rgba(0, 0, 0, 0.1)'
              }
            }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid rgba(0, 0, 0, 0.1)' }}>
          <Button 
            onClick={() => setStatusDialogOpen(false)}
            sx={{
              color: '#666',
              '&:hover': {
                backgroundColor: '#f5f5f5'
              }
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleStatusUpdate} 
            variant="contained"
            sx={{
              background: 'linear-gradient(135deg, #1976d2, #42a5f5)',
              boxShadow: '0 4px 12px rgba(25, 118, 210, 0.2)',
              '&:hover': {
                background: 'linear-gradient(135deg, #1565c0, #1976d2)',
              }
            }}
          >
            Update Status
          </Button>
        </DialogActions>
      </Dialog>

      {/* ICT Details Dialog */}
      <Dialog 
        open={ictDetailsDialogOpen} 
        onClose={() => setIctDetailsDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '12px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
          }
        }}
      >
        <DialogTitle 
          sx={{ 
            fontFamily: '"Lisu Bosa", serif',
            fontWeight: 600,
            color: '#1976d2',
            borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
            pb: 2
          }}
        >
          {newStatus === 'RESOLVED' ? 'Resolve Ticket' : 'Take Action on Ticket'}
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Alert severity="info" sx={{ mb: 1 }}>
              {newStatus === 'RESOLVED'
                ? 'Please provide resolution details to complete this ticket'
                : 'Taking action on this ticket will automatically set its status to "In Progress"'
              }
            </Alert>
            <TextField
              fullWidth
              label="Assigned To"
              value={ictDetails.assignedTo}
              onChange={(e) => setIctDetails({ ...ictDetails, assignedTo: e.target.value })}
              placeholder="Name of ICT staff assigned"
              required
              disabled={Boolean(ticket.ictAssignedTo)}
            />
            {newStatus === 'RESOLVED' && (
              <>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Diagnosis Details"
                  value={ictDetails.diagnosisDetails}
                  onChange={(e) => setIctDetails({ ...ictDetails, diagnosisDetails: e.target.value })}
                  placeholder="Detailed diagnosis of the issue"
                  required
                  error={!ictDetails.diagnosisDetails}
                />
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Fix Details"
                  value={ictDetails.fixDetails}
                  onChange={(e) => setIctDetails({ ...ictDetails, fixDetails: e.target.value })}
                  placeholder="Details of how the issue was fixed"
                  required
                  error={!ictDetails.fixDetails}
                />
                <TextField
                  fullWidth
                  type="datetime-local"
                  label="Date Fixed"
                  value={formatDateForInput(ictDetails.dateFixed)}
                  onChange={(e) => setIctDetails({ ...ictDetails, dateFixed: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  required
                  error={!ictDetails.dateFixed}
                />
              </>
            )}
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Status Update Comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Add a comment about the actions taken..."
              required
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid rgba(0, 0, 0, 0.1)' }}>
          <Button 
            onClick={() => setIctDetailsDialogOpen(false)}
            sx={{ color: '#666' }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleIctActionClick}
            variant="contained"
            sx={{
              background: newStatus === 'RESOLVED' 
                ? 'linear-gradient(135deg, #2e7d32, #4caf50)'
                : 'linear-gradient(135deg, #1976d2, #42a5f5)',
              boxShadow: '0 4px 12px rgba(25, 118, 210, 0.2)',
              '&:hover': {
                background: newStatus === 'RESOLVED'
                  ? 'linear-gradient(135deg, #1b5e20, #2e7d32)'
                  : 'linear-gradient(135deg, #1565c0, #1976d2)',
              }
            }}
          >
            {newStatus === 'RESOLVED' ? 'Complete Resolution' : 'Assign Ticket'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TicketDetails; 