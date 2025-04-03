import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Paper,
  Grid,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  ComputerRounded as ComputerIcon,
  ManageAccounts as ManageAccountsIcon,
  UploadFile as UploadFileIcon,
} from '@mui/icons-material';
import axios from 'axios';
import BackButton from '../components/BackButton';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const TicketCategories = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Updated category data with new colors
  const categoryData = {
    'TROUBLESHOOTING': {
      title: 'Troubleshooting',
      description: 'Report technical issues with computers, printers, or other equipment',
      icon: <ComputerIcon sx={{ fontSize: 40 }} />,
      path: '/troubleshooting',
      color: '#3f51b5' // Indigo
    },
    'ACCOUNT_MANAGEMENT': {
      title: 'Account Management',
      description: 'Request new accounts, reset passwords, or modify existing accounts',
      icon: <ManageAccountsIcon sx={{ fontSize: 40 }} />,
      path: '/account',
      color: '#009688' // Teal
    },
    'DOCUMENT_UPLOAD': {
      title: 'Uploading of Publication',
      description: 'Submit documents for processing or approval',
      icon: <UploadFileIcon sx={{ fontSize: 40 }} />,
      path: '/documents',
      color: '#e91e63' // Pink
    },
    'TECHNICAL_ASSISTANCE': {
      title: 'Technical Assistance',
      description: 'Get help with DCP, AV equipment, ICT tutorials, and technical support',
      icon: <ComputerIcon sx={{ fontSize: 40 }} />,
      path: '/technical-assistance',
      color: '#2196f3' // Blue
    }
  };

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_BASE_URL}/settings/categories`);
        
        if (response.data.success) {
          const fetchedCategories = response.data.categories;
          setCategories(fetchedCategories);
          setError(null);
          localStorage.setItem('ticketCategories', JSON.stringify(fetchedCategories));
        } else {
          throw new Error(response.data.message || 'Failed to load categories');
        }
      } catch (err) {
        console.error('Error loading categories:', err);
        setError('Unable to load ticket categories. Please try again later.');
        // Load from localStorage if available
        const savedCategories = localStorage.getItem('ticketCategories');
        if (savedCategories) {
          setCategories(JSON.parse(savedCategories));
        } else {
          // Fallback categories
          const fallbackCategories = [
            { id: 1, name: 'TROUBLESHOOTING', active: true },
            { id: 2, name: 'ACCOUNT_MANAGEMENT', active: true },
            { id: 3, name: 'DOCUMENT_UPLOAD', active: true },
            { id: 4, name: 'TECHNICAL_ASSISTANCE', active: true }
          ];
          setCategories(fallbackCategories);
          localStorage.setItem('ticketCategories', JSON.stringify(fallbackCategories));
        }
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const handleCategoryClick = (path, isActive) => {
    if (isActive) {
      navigate(path);
    }
  };

  const ServiceCard = ({ title, description, icon, path, color, isActive }) => (
    <Paper
      elevation={3}
      sx={{
        p: 3,
        height: '100%',
        minHeight: '200px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: isActive ? 'pointer' : 'not-allowed',
        transition: 'all 0.3s',
        position: 'relative',
        overflow: 'hidden',
        opacity: isActive ? 1 : 0.6,
        background: isActive ? 'rgba(255, 255, 255, 0.95)' : 'rgba(245, 245, 245, 0.95)',
        backdropFilter: 'blur(10px)',
        border: `1px solid ${isActive ? color : '#ddd'}`,
        borderRadius: '16px',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: isActive ? `linear-gradient(90deg, ${color}, ${color}80)` : '#ddd',
          transition: 'transform 0.3s',
        },
        '&:hover': isActive ? {
          transform: 'translateY(-5px)',
          boxShadow: `0 8px 32px ${color}33`,
          backgroundColor: `${color}08`,
          borderColor: color,
          '&::before': {
            transform: 'scaleX(1.1)',
          },
          '& .icon-box': {
            transform: 'rotate(0deg) scale(1.1)',
            background: `linear-gradient(135deg, ${color}, ${color}80)`,
          }
        } : {},
      }}
      onClick={() => handleCategoryClick(path, isActive)}
    >
      <Box
        className="icon-box"
        sx={{
          background: isActive ? `linear-gradient(135deg, ${color}, ${color}80)` : '#ddd',
          borderRadius: '12px',
          p: 1.5,
          mb: 2,
          color: 'white',
          boxShadow: isActive ? `0 4px 12px ${color}33` : 'none',
          transform: 'rotate(-5deg)',
          transition: 'all 0.3s',
          '& svg': {
            fontSize: '2rem',
            filter: 'drop-shadow(2px 2px 2px rgba(0,0,0,0.2))'
          }
        }}
      >
        {icon}
      </Box>
      <Typography 
        variant="h6" 
        gutterBottom 
        align="center" 
        sx={{ 
          fontWeight: 600,
          fontFamily: '"Lisu Bosa", serif',
          background: isActive ? `linear-gradient(135deg, ${color}, ${color}80)` : 'linear-gradient(135deg, #999, #666)',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          color: 'transparent',
          mb: 1,
          fontSize: '1.2rem'
        }}
      >
        {title}
      </Typography>
      <Typography 
        variant="body2" 
        align="center" 
        sx={{ 
          color: isActive ? '#666' : '#999',
          fontFamily: '"Lisu Bosa", serif',
          px: 1,
          fontSize: '0.9rem',
          lineHeight: 1.5
        }}
      >
        {isActive ? description : "This category is currently disabled"}
      </Typography>
    </Paper>
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  // If no categories are available, show a message
  if (categories.length === 0) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <BackButton onClick={() => navigate('/')} />
        
        <Box sx={{ textAlign: 'center', mt: 8 }}>
          <Typography variant="h4" gutterBottom>
            Ticket categories are not available
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            Our ticket submission system cannot load the categories. Please try again later or contact support directly.
          </Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Box 
      sx={{ 
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: '#f8fafc',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `url(${process.env.PUBLIC_URL}/deped-building.jpg)`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          opacity: 0.1,
          zIndex: 0,
        }
      }}
    >
      <Container 
        maxWidth="lg" 
        sx={{ 
          py: 4,
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          zIndex: 1
        }}
      >
        {/* Back Button */}
        <BackButton onClick={() => navigate('/')} />

        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography 
            variant="h4" 
            sx={{ 
              fontWeight: 700,
              fontFamily: '"Lisu Bosa", serif',
              background: 'linear-gradient(135deg, #1976d2, #42a5f5)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              color: 'transparent',
              textShadow: '1px 1px 1px rgba(0,0,0,0.1)',
              fontSize: '2rem',
              mb: 1
            }}
          >
            Submit a Ticket
          </Typography>
          <Typography 
            variant="subtitle1" 
            sx={{ 
              fontFamily: '"Lisu Bosa", serif',
              color: '#666',
              fontSize: '1.1rem',
              mb: 2
            }}
          >
            Choose the category that best matches your request
          </Typography>
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

        {/* Service Categories */}
        <Grid 
          container 
          spacing={3} 
          sx={{ 
            maxWidth: 'lg',
            mx: 'auto',
            px: { xs: 2, md: 0 }
          }}
        >
          {categories.map((category) => {
            const data = categoryData[category.name];
            if (!data) return null;
            
            return (
              <Grid item xs={12} sm={6} key={category.id}>
                <ServiceCard
                  title={data.title}
                  description={data.description}
                  icon={data.icon}
                  path={data.path}
                  color={data.color}
                  isActive={category.active}
                />
              </Grid>
            );
          })}
        </Grid>

        {/* Footer */}
        <Box 
          sx={{ 
            mt: 4,
            pt: 2,
            textAlign: 'center'
          }}
        >
          <Typography 
            variant="body2" 
            sx={{ 
              color: '#666',
              fontFamily: '"Lisu Bosa", serif',
              fontSize: '0.9rem',
              display: 'inline-block',
              padding: '8px 16px',
              borderRadius: '20px',
              backgroundColor: 'rgba(25, 118, 210, 0.1)',
              transition: 'all 0.2s',
              '&:hover': {
                backgroundColor: 'rgba(25, 118, 210, 0.2)',
                color: '#1976d2',
                cursor: 'pointer'
              }
            }}
          >
            Need help choosing? Contact our support team
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default TicketCategories; 