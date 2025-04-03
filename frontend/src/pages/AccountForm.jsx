import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  MenuItem,
  Button,
  Alert,
  CircularProgress,
  IconButton
} from '@mui/material';
import { ArrowBack as ArrowBackIcon, Error as ErrorIcon } from '@mui/icons-material';

const AccountForm = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isCategoryEnabled, setIsCategoryEnabled] = useState(true);

  // Check if this category is enabled
  useEffect(() => {
    const checkCategoryStatus = () => {
      try {
        const storedCategories = localStorage.getItem('ticketCategories');
        if (storedCategories) {
          const categories = JSON.parse(storedCategories);
          const accountCategory = categories.find(
            cat => cat.name === 'ACCOUNT_MANAGEMENT'
          );
          
          if (accountCategory && !accountCategory.active) {
            setIsCategoryEnabled(false);
          }
        }
      } catch (error) {
        console.error('Error checking category status:', error);
      }
    };
    
    checkCategoryStatus();
  }, []);

  // If category is disabled, show maintenance message
  if (!isCategoryEnabled) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <IconButton
          onClick={() => navigate('/categories')}
          sx={{ position: 'absolute', top: 24, left: 24 }}
        >
          <ArrowBackIcon />
        </IconButton>
        
        <Paper 
          sx={{ 
            p: 4, 
            mt: 4, 
            border: '2px solid #f44336',
            borderRadius: 2,
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
          }}
        >
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <ErrorIcon sx={{ fontSize: 80, color: '#f44336', mb: 2 }} />
            <Typography variant="h4" gutterBottom color="error" sx={{ fontWeight: 'bold' }}>
              Function Temporarily Disabled
            </Typography>
            <Typography variant="h6" paragraph color="text.secondary">
              The Account Management module is currently under maintenance
            </Typography>
            <Typography variant="body1" sx={{ mb: 4, maxWidth: '600px', mx: 'auto' }}>
              Our team is working to improve this feature. The Account Management ticket category has been temporarily disabled by the system administrator.
            </Typography>
            <Button 
              variant="contained" 
              color="primary"
              size="large" 
              onClick={() => navigate('/categories')}
              sx={{ minWidth: '200px' }}
            >
              Return to Categories
            </Button>
          </Box>
        </Paper>
      </Container>
    );
  }

  // Form implementation would go here
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      {/* Form content */}
      <Typography variant="h4">Account Management Form</Typography>
      {/* Actual form implementation */}
    </Container>
  );
};

export default AccountForm; 