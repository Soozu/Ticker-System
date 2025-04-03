import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Button,
  Box,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import LoginIcon from '@mui/icons-material/Login';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const MyTickets = () => {
  const [groupedTickets, setGroupedTickets] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedDepartments, setExpandedDepartments] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    fetchUserTickets();
  }, []);

  const fetchUserTickets = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please log in to view your tickets');
        setLoading(false);
        return;
      }

      const response = await axios.get('http://localhost:5000/api/tickets/my-tickets', {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Ensure we're setting the grouped tickets data
      setGroupedTickets(response.data || {});
      setLoading(false);
    } catch (error) {
      console.error('Error fetching tickets:', error);
      setError(error.response?.data?.message || 'Failed to fetch tickets');
      setLoading(false);
    }
  };

  const handleLogin = () => {
    navigate('/login');
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'warning';
      case 'in progress':
        return 'info';
      case 'resolved':
        return 'success';
      case 'closed':
        return 'error';
      default:
        return 'default';
    }
  };

  const handleAccordionChange = (department) => (event, isExpanded) => {
    setExpandedDepartments(prev => ({
      ...prev,
      [department]: isExpanded
    }));
  };

  // Sort departments alphabetically
  const sortedDepartments = Object.entries(groupedTickets).sort(([deptA], [deptB]) => 
    deptA.localeCompare(deptB)
  );

  // Check if user is not logged in
  const isNotLoggedIn = !localStorage.getItem('token');

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom align="center">
        Department Support Tickets
      </Typography>

      {error && (
        <Box sx={{ mb: 2 }}>
          <Alert 
            severity="error" 
            action={
              isNotLoggedIn && (
                <Button
                  color="inherit"
                  size="small"
                  startIcon={<LoginIcon />}
                  onClick={handleLogin}
                  sx={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.3)',
                    }
                  }}
                >
                  Login
                </Button>
              )
            }
          >
            {error}
          </Alert>
        </Box>
      )}

      {isNotLoggedIn ? (
        <Box 
          sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            gap: 2,
            mt: 4 
          }}
        >
          <Typography variant="h6" color="text.secondary">
            Please log in to view your tickets
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<LoginIcon />}
            onClick={handleLogin}
            sx={{ 
              minWidth: 200,
              py: 1,
              boxShadow: 2,
              '&:hover': {
                boxShadow: 4,
              }
            }}
          >
            Login to View Tickets
          </Button>
        </Box>
      ) : loading ? (
        <Typography align="center">Loading tickets...</Typography>
      ) : sortedDepartments.length === 0 ? (
        <Typography align="center">No tickets found</Typography>
      ) : (
        sortedDepartments.map(([department, departmentTickets]) => (
          <Accordion
            key={department}
            expanded={expandedDepartments[department] || false}
            onChange={handleAccordionChange(department)}
            sx={{ mb: 2 }}
          >
            <AccordionSummary 
              expandIcon={<ExpandMoreIcon />}
              sx={{
                backgroundColor: '#f5f5f5',
                '&:hover': {
                  backgroundColor: '#e0e0e0',
                }
              }}
            >
              <Typography variant="h6">
                {department} ({Array.isArray(departmentTickets) ? departmentTickets.length : 0} tickets)
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <TableContainer component={Paper}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Ticket ID</TableCell>
                      <TableCell>Name</TableCell>
                      <TableCell>Department</TableCell>
                      <TableCell>Equipment Type</TableCell>
                      <TableCell>Model</TableCell>
                      <TableCell>Problem</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Date Requested</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {Array.isArray(departmentTickets) && departmentTickets.length > 0 ? (
                      departmentTickets.map((ticket) => (
                        <TableRow key={ticket.id}>
                          <TableCell>{ticket.id}</TableCell>
                          <TableCell>{ticket.name}</TableCell>
                          <TableCell>{ticket.department}</TableCell>
                          <TableCell>{ticket.typeOfEquipment}</TableCell>
                          <TableCell>{ticket.modelOfEquipment}</TableCell>
                          <TableCell>{ticket.specificProblem}</TableCell>
                          <TableCell>
                            <Chip 
                              label={ticket.status} 
                              color={getStatusColor(ticket.status)}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            {new Date(ticket.dateOfRequest).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={8} align="center">No tickets found for this department</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </AccordionDetails>
          </Accordion>
        ))
      )}
    </Container>
  );
};

export default MyTickets; 