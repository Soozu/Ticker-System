import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Tooltip,
  Typography,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Chip,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Edit as EditIcon,
  Refresh as RefreshIcon,
  Archive as ArchiveIcon,
  Unarchive as UnarchiveIcon,
} from '@mui/icons-material';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const ManageTickets = () => {
  const navigate = useNavigate();
  // State management
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalTickets, setTotalTickets] = useState(0);
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Status update dialog states
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [newStatus, setNewStatus] = useState('');

  // Archive states
  const [showArchived, setShowArchived] = useState(false);
  const [archivedCount, setArchivedCount] = useState(0);

  // Fetch tickets with filters
  const fetchTickets = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      const params = new URLSearchParams({
        page: page + 1,
        limit: rowsPerPage,
        ...(statusFilter && { status: statusFilter }),
        ...(categoryFilter && { category: categoryFilter }),
        ...(searchQuery && { search: searchQuery }),
        showArchived: showArchived
      });

      const response = await axios.get(`${API_BASE_URL}/admin/tickets?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        setTickets(response.data.data.tickets);
        setTotalTickets(response.data.data.pagination.total);
        setError(null);
      } else {
        throw new Error(response.data.message);
      }
    } catch (err) {
      console.error('Error fetching tickets:', err);
      setError(err.message || 'Failed to load tickets');
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, statusFilter, categoryFilter, searchQuery, showArchived]);

  // Fetch archived count
  const fetchArchivedCount = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/admin/tickets/archived/count`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.success) {
        setArchivedCount(response.data.data.count);
      }
    } catch (error) {
      console.error('Error fetching archived count:', error);
    }
  };

  // Handle status update dialog
  const handleStatusDialogOpen = (ticket) => {
    setSelectedTicket(ticket);
    setNewStatus(ticket.status);
    setStatusDialogOpen(true);
  };

  const handleStatusDialogClose = () => {
    setStatusDialogOpen(false);
    setSelectedTicket(null);
    setNewStatus('');
  };

  // Handle status update
  const handleStatusUpdate = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `${API_BASE_URL}/admin/tickets/${selectedTicket.id}/status`,
        { status: newStatus },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        // If status is changed to RESOLVED, automatically archive the ticket
        if (newStatus === 'RESOLVED') {
          await handleArchiveAction(selectedTicket.id, 'archive');
        }
        handleStatusDialogClose();
        fetchTickets(); // Refresh the list
      } else {
        throw new Error(response.data.message);
      }
    } catch (err) {
      console.error('Error updating ticket status:', err);
      setError(err.response?.data?.message || 'Failed to update ticket status');
    }
  };

  // Handle pagination
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Handle filters
  const handleStatusFilterChange = (event) => {
    setStatusFilter(event.target.value);
    setPage(0);
  };

  const handleCategoryFilterChange = (event) => {
    setCategoryFilter(event.target.value);
    setPage(0);
  };

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
    setPage(0);
  };

  // Handle ticket click
  const handleTicketClick = (ticketId) => {
    navigate(`/admin/tickets/${ticketId}`);
  };

  // Handle archive toggle
  const handleArchiveToggle = (event) => {
    setShowArchived(event.target.checked);
    setPage(0);
  };

  // Handle archive/restore ticket
  const handleArchiveAction = async (ticketId, action) => {
    try {
      const token = localStorage.getItem('token');
      const endpoint = action === 'archive' ? 'archive' : 'restore';
      
      const response = await axios.post(
        `${API_BASE_URL}/admin/tickets/${ticketId}/${endpoint}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        fetchTickets();
        fetchArchivedCount();
      }
    } catch (error) {
      console.error(`Error ${action}ing ticket:`, error);
      setError(`Failed to ${action} ticket`);
    }
  };

  // Effect to fetch tickets when filters or pagination changes
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      fetchTickets();
      fetchArchivedCount();
    }, 500); // Debounce search input

    return () => clearTimeout(debounceTimer);
  }, [fetchTickets]);

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  // Get status style
  const getStatusStyle = (status) => {
    const styles = {
      PENDING: {
        color: '#ed6c02',
        backgroundColor: '#fff4e5',
        borderColor: '#ed6c02'
      },
      IN_PROGRESS: {
        color: '#0288d1',
        backgroundColor: '#e3f2fd',
        borderColor: '#0288d1'
      },
      RESOLVED: {
        color: '#2e7d32',
        backgroundColor: '#edf7ed',
        borderColor: '#2e7d32'
      },
      CLOSED: {
        color: '#616161',
        backgroundColor: '#f5f5f5',
        borderColor: '#616161'
      }
    };
    return styles[status] || {};
  };

  // Get priority style
  const getPriorityStyle = (priority) => {
    const styles = {
      HIGH: {
        color: '#d32f2f',
        backgroundColor: '#ffeaea',
        borderColor: '#d32f2f',
        fontWeight: 600
      },
      MEDIUM: {
        color: '#ed6c02',
        backgroundColor: '#fff4e5',
        borderColor: '#ed6c02'
      },
      LOW: {
        color: '#2e7d32',
        backgroundColor: '#edf7ed',
        borderColor: '#2e7d32'
      }
    };
    return styles[priority] || {};
  };

  // Sort tickets by priority (HIGH first)
  const sortedTickets = [...tickets].sort((a, b) => {
    const priorityOrder = { HIGH: 1, MEDIUM: 2, LOW: 3 };
    return (priorityOrder[a.priority] || 4) - (priorityOrder[b.priority] || 4);
  });

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box 
      sx={{ 
        p: 4,
        backgroundColor: '#f8fafc',
        minHeight: '100vh'
      }}
    >
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          mb: 4 
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
          {showArchived ? 'Archived Tickets' : 'Manage Tickets'}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <FormControlLabel
            control={
              <Switch
                checked={showArchived}
                onChange={handleArchiveToggle}
                color="primary"
              />
            }
            label={`Show Archived (${archivedCount})`}
          />
          <Tooltip title="Refresh List">
            <IconButton 
              onClick={fetchTickets} 
              disabled={loading}
              sx={{
                bgcolor: 'white',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                '&:hover': {
                  bgcolor: '#f5f5f5'
                }
              }}
            >
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

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

      {/* Filters */}
      <Box 
        sx={{ 
          mb: 3, 
          display: 'flex', 
          gap: 2, 
          flexWrap: 'wrap',
          backgroundColor: 'white',
          p: 3,
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}
      >
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={statusFilter}
            label="Status"
            onChange={handleStatusFilterChange}
            sx={{
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: 'rgba(0, 0, 0, 0.1)'
              }
            }}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="PENDING">Pending</MenuItem>
            <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
            <MenuItem value="RESOLVED">Resolved</MenuItem>
            <MenuItem value="CLOSED">Closed</MenuItem>
          </Select>
        </FormControl>

        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Category</InputLabel>
          <Select
            value={categoryFilter}
            label="Category"
            onChange={handleCategoryFilterChange}
            sx={{
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: 'rgba(0, 0, 0, 0.1)'
              }
            }}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="TROUBLESHOOTING">Troubleshooting</MenuItem>
            <MenuItem value="ACCOUNT_MANAGEMENT">Account Management</MenuItem>
            <MenuItem value="DOCUMENT_UPLOAD">Document Upload</MenuItem>
            <MenuItem value="TECHNICAL_ASSISTANCE">Technical Assistance</MenuItem>
          </Select>
        </FormControl>

        <TextField
          label="Search"
          variant="outlined"
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder="Search by subject, message, or user..."
          sx={{ 
            minWidth: 300,
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: 'rgba(0, 0, 0, 0.1)'
            }
          }}
        />
      </Box>

      {/* Tickets Table */}
      <TableContainer 
        component={Paper}
        sx={{ 
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          mb: 2
        }}
      >
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: '#f8fafc' }}>
              <TableCell sx={{ fontWeight: 600, color: '#1976d2' }}>ID</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#1976d2' }}>Tracking ID</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#1976d2' }}>Category</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#1976d2' }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#1976d2' }}>Priority</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#1976d2' }}>Created At</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#1976d2' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedTickets.map((ticket) => (
              <TableRow 
                key={ticket.id}
                onClick={() => handleTicketClick(ticket.id)}
                sx={{
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  '&:hover': {
                    backgroundColor: '#f8fafc',
                    transform: 'scale(1.001)',
                  }
                }}
              >
                <TableCell sx={{ fontWeight: 500 }}>{ticket.id}</TableCell>
                <TableCell sx={{ fontFamily: 'monospace', color: '#1976d2' }}>{ticket.trackingId}</TableCell>
                <TableCell>
                  <Box sx={{ fontWeight: 500 }}>
                    {ticket.category.replace(/_/g, ' ')}
                  </Box>
                </TableCell>
                <TableCell>
                  <Box>
                    <Chip
                      label={ticket.status.replace(/_/g, ' ')}
                      size="small"
                      sx={{
                        ...getStatusStyle(ticket.status),
                        fontWeight: 500,
                        borderWidth: '1px',
                        borderStyle: 'solid'
                      }}
                    />
                  </Box>
                </TableCell>
                <TableCell>
                  <Box>
                    <Chip
                      label={ticket.priority}
                      size="small"
                      sx={{
                        ...getPriorityStyle(ticket.priority),
                        borderWidth: '1px',
                        borderStyle: 'solid'
                      }}
                    />
                  </Box>
                </TableCell>
                <TableCell sx={{ color: '#666' }}>{formatDate(ticket.createdAt)}</TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title="Update Status">
                      <IconButton 
                        onClick={() => handleStatusDialogOpen(ticket)}
                        sx={{
                          color: '#1976d2',
                          '&:hover': {
                            backgroundColor: 'rgba(25, 118, 210, 0.04)'
                          }
                        }}
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    {showArchived ? (
                      <Tooltip title="Restore Ticket">
                        <IconButton 
                          onClick={() => handleArchiveAction(ticket.id, 'restore')}
                          sx={{
                            color: '#2e7d32',
                            '&:hover': {
                              backgroundColor: 'rgba(46, 125, 50, 0.04)'
                            }
                          }}
                        >
                          <UnarchiveIcon />
                        </IconButton>
                      </Tooltip>
                    ) : (
                      <Tooltip title="Archive Ticket">
                        <IconButton 
                          onClick={() => handleArchiveAction(ticket.id, 'archive')}
                          sx={{
                            color: '#ed6c02',
                            '&:hover': {
                              backgroundColor: 'rgba(237, 108, 2, 0.04)'
                            }
                          }}
                        >
                          <ArchiveIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      <TablePagination
        component={Paper}
        count={totalTickets}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        rowsPerPageOptions={[5, 10, 25, 50]}
        sx={{
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          '& .MuiTablePagination-select': {
            fontWeight: 500
          }
        }}
      />

      {/* Status Update Dialog */}
      <Dialog 
        open={statusDialogOpen} 
        onClose={handleStatusDialogClose}
        PaperProps={{
          sx: {
            borderRadius: '12px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
          }
        }}
      >
        <DialogTitle sx={{ 
          fontFamily: '"Lisu Bosa", serif',
          fontWeight: 600,
          color: '#1976d2'
        }}>
          Update Ticket Status
        </DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
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
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button 
            onClick={handleStatusDialogClose}
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
    </Box>
  );
};

export default ManageTickets; 