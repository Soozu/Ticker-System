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
    return new Date(dateString).toLocaleString();
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
    <Box sx={{ p: 3 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h4" gutterBottom>
            Ticket #{ticket.id}
          </Typography>
          <Box>
            <Button
              variant="outlined"
              sx={{ mr: 1 }}
              onClick={() => navigate('/admin/tickets')}
            >
              Back to List
            </Button>
            <Button
              variant="contained"
              onClick={() => setStatusDialogOpen(true)}
            >
              Update Status
            </Button>
          </Box>
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* Ticket Information */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              Basic Information
            </Typography>
            <List>
              <ListItem>
                <ListItemText
                  primary="Status"
                  secondary={
                    <Typography component="span" variant="body2">
                      <Chip
                        label={ticket.status}
                        color={getStatusColor(ticket.status)}
                        size="small"
                      />
                    </Typography>
                  }
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Category"
                  secondary={
                    <Typography component="span" variant="body2">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CategoryIcon fontSize="small" />
                        {ticket.category}
                      </Box>
                    </Typography>
                  }
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Priority"
                  secondary={
                    <Typography component="span" variant="body2">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PriorityIcon fontSize="small" />
                        {ticket.priority}
                      </Box>
                    </Typography>
                  }
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Created At"
                  secondary={
                    <Typography component="span" variant="body2">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <ScheduleIcon fontSize="small" />
                        {formatDate(ticket.createdAt)}
                      </Box>
                    </Typography>
                  }
                />
              </ListItem>
            </List>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              User Information
            </Typography>
            <List>
              <ListItem>
                <ListItemText
                  primary="Submitted By"
                  secondary={
                    <Typography component="span" variant="body2">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PersonIcon fontSize="small" />
                        {ticket.user?.name || 'N/A'}
                      </Box>
                    </Typography>
                  }
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Email"
                  secondary={ticket.user?.email || 'N/A'}
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Department"
                  secondary={ticket.user?.department || 'N/A'}
                />
              </ListItem>
            </List>
          </Grid>

          {/* Category Specific Information */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Ticket Details
            </Typography>
            <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
              {ticket.category === 'TROUBLESHOOTING' && (
                <>
                  <Typography variant="subtitle1" gutterBottom>
                    Technical Issue Details
                  </Typography>
                  <List>
                    <ListItem>
                      <ListItemText
                        primary="Name"
                        secondary={ticket.name || 'N/A'}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Email"
                        secondary={ticket.email || 'N/A'}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Location"
                        secondary={ticket.location || 'N/A'}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Date of Request"
                        secondary={ticket.dateOfRequest ? formatDate(ticket.dateOfRequest) : 'N/A'}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Type of Equipment"
                        secondary={ticket.typeOfEquipment || 'N/A'}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Model of Equipment"
                        secondary={ticket.modelOfEquipment || 'N/A'}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Serial No."
                        secondary={ticket.serialNo || 'N/A'}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Specific Problem"
                        secondary={ticket.specificProblem || 'Not provided'}
                      />
                    </ListItem>
                  </List>
                </>
              )}

              {ticket.category === 'ACCOUNT_MANAGEMENT' && (
                <>
                  <Typography variant="subtitle1" gutterBottom>
                    Account Request Details
                  </Typography>
                  <List>
                    <ListItem>
                      <ListItemText
                        primary="Name"
                        secondary={ticket.name || 'N/A'}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Email"
                        secondary={ticket.email || 'N/A'}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Account Type"
                        secondary={ticket.accountType || 'Not specified'}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Action Type"
                        secondary={ticket.actionType || 'Not specified'}
                      />
                    </ListItem>
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
                        primary="Name"
                        secondary={ticket.name || 'N/A'}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Email"
                        secondary={ticket.email || 'N/A'}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Location"
                        secondary={ticket.location || 'N/A'}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Document Subject"
                        secondary={ticket.documentSubject || ticket.subject || 'Not specified'}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Message"
                        secondary={ticket.documentMessage || ticket.message || 'Not provided'}
                      />
                    </ListItem>
                    {ticket.documentPath && (
                      <ListItem>
                        <ListItemText
                          primary="Attached Document"
                          secondary={
                            <Typography component="span" variant="body2">
                              <Button
                                startIcon={<DownloadIcon />}
                                onClick={handleDownload}
                                size="small"
                              >
                                Download Document
                              </Button>
                            </Typography>
                          }
                        />
                      </ListItem>
                    )}
                    {!ticket.documentPath && ticket.categorySpecificDetails?.details?.fileName && (
                      <ListItem>
                        <ListItemText
                          primary="Attached Document"
                          secondary={
                            <Typography component="span" variant="body2">
                              <Button
                                startIcon={<DownloadIcon />}
                                onClick={handleDownload}
                                size="small"
                              >
                                Download {ticket.categorySpecificDetails.details.originalFileName || 'Document'}
                              </Button>
                            </Typography>
                          }
                        />
                      </ListItem>
                    )}
                  </List>
                </>
              )}
            </Paper>
          </Grid>

          {/* Category-specific additional details from JSON */}
          {ticket.categorySpecificDetails && (
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
                            typeof value === 'object' 
                              ? JSON.stringify(value) 
                              : String(value)
                          }
                        />
                      </ListItem>
                    );
                  })}
                </List>
              </Paper>
            </Grid>
          )}

          {/* Comments/Updates Section */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Updates History
            </Typography>
            <List>
              {ticket.updates?.map((update, index) => (
                <ListItem key={index} divider>
                  <ListItemText
                    primary={
                      <Typography variant="subtitle2">
                        Status changed to: {update.newStatus}
                      </Typography>
                    }
                    secondary={
                      <>
                        <Typography variant="body2" color="text.secondary">
                          {update.comment}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatDate(update.createdAt)}
                        </Typography>
                      </>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Grid>
        </Grid>
      </Paper>

      {/* Status Update Dialog */}
      <Dialog open={statusDialogOpen} onClose={() => setStatusDialogOpen(false)}>
        <DialogTitle>Update Ticket Status</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2, mb: 2 }}>
            <InputLabel>New Status</InputLabel>
            <Select
              value={newStatus}
              label="New Status"
              onChange={(e) => setNewStatus(e.target.value)}
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
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleStatusUpdate} variant="contained" color="primary">
            Update Status
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TicketDetails; 