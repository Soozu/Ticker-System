import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  TextField,
  InputAdornment,
  IconButton,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  AccountCircle as AccountCircleIcon,
  Lock as LockIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      console.log('Login response:', data);

      if (!data.success) {
        throw new Error(data.message || 'Login failed');
      }

      if (data.data.user.role !== 'ADMIN') {
        throw new Error('Access denied. Admin access only.');
      }

      login(data.data.user, data.data.token);
      console.log('Token stored:', data.data.token);
      navigate('/admin');
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Failed to login. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box 
      sx={{ 
        minHeight: '100vh',
        display: 'flex',
        position: 'relative',
        overflow: 'hidden',
        bgcolor: '#f8fafc',
      }}
    >
      {/* Left side - Background Image */}
      <Box
        sx={{
          flex: 1,
          position: 'relative',
          backgroundImage: `url(${process.env.PUBLIC_URL}/background.jpg)`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />

      {/* Right side - Login Form */}
      <Box
        sx={{
          width: '450px',
          display: 'flex',
          flexDirection: 'column',
          bgcolor: 'white',
          p: 4,
          position: 'relative',
          height: '100vh',
          overflow: 'auto',
        }}
      >
        <Box sx={{ 
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
        }}>
          {/* Logo */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              mb: 2,
            }}
          >
            <Box
              component="img"
              src={process.env.PUBLIC_URL + '/deped-logo.png'}
              alt="DepEd Logo"
              sx={{
                width: 80,
                height: 80,
              }}
            />
          </Box>

          <Typography 
            variant="h4" 
            align="center" 
            gutterBottom
            sx={{ 
              fontWeight: 800,
              mb: 1,
              color: '#1565c0',
              letterSpacing: '0.5px',
              textTransform: 'uppercase',
              fontSize: '1.5rem'
            }}
          >
            Staff Portal
          </Typography>
          <Typography 
            variant="subtitle1" 
            align="center" 
            sx={{ 
              mb: 3,
              color: '#455a64',
              fontWeight: 500,
              letterSpacing: '0.5px',
              fontSize: '0.9rem'
            }}
          >
            Authorized Personnel Access
          </Typography>

          {error && (
            <Alert 
              severity="error" 
              sx={{ 
                width: '100%', 
                mb: 2,
                borderRadius: '8px',
                '& .MuiAlert-message': {
                  fontWeight: 500,
                  fontSize: '0.9rem'
                }
              }}
            >
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              fullWidth
              required
              name="email"
              label="Username"
              value={formData.email}
              onChange={handleChange}
              sx={{ 
                mb: 2,
                '& .MuiInputLabel-root': {
                  fontSize: '0.9rem',
                  fontWeight: 500
                },
                '& .MuiOutlinedInput-root': {
                  borderRadius: '8px',
                  '&:hover fieldset': {
                    borderColor: '#1976d2',
                  }
                }
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <AccountCircleIcon sx={{ color: '#1976d2' }} />
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              fullWidth
              required
              name="password"
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={handleChange}
              sx={{ 
                mb: 3,
                '& .MuiInputLabel-root': {
                  fontSize: '0.9rem',
                  fontWeight: 500
                },
                '& .MuiOutlinedInput-root': {
                  borderRadius: '8px',
                  '&:hover fieldset': {
                    borderColor: '#1976d2',
                  }
                }
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon sx={{ color: '#1976d2' }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      sx={{ color: '#1976d2' }}
                    >
                      {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Button
              fullWidth
              variant="contained"
              type="submit"
              disabled={loading}
              sx={{ 
                mb: 2,
                py: 1.25,
                bgcolor: '#1565c0',
                fontSize: '0.95rem',
                fontWeight: 600,
                textTransform: 'none',
                borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(21, 101, 192, 0.25)',
                '&:hover': {
                  bgcolor: '#0d47a1',
                  boxShadow: '0 4px 12px rgba(21, 101, 192, 0.35)',
                }
              }}
            >
              {loading ? <CircularProgress size={24} /> : 'Sign In'}
            </Button>

            <Button
              fullWidth
              variant="outlined"
              onClick={() => navigate('/')}
              disabled={loading}
              sx={{ 
                py: 1.25,
                borderRadius: '8px',
                fontSize: '0.9rem',
                fontWeight: 500,
                textTransform: 'none',
                borderColor: '#1976d2',
                color: '#1976d2',
                '&:hover': {
                  borderColor: '#1565c0',
                  bgcolor: 'rgba(25, 118, 210, 0.04)',
                }
              }}
            >
              Return to Home
            </Button>
          </Box>
        </Box>

        {/* Bottom Logos */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            gap: 4,
            mt: 4,
            pt: 2,
          }}
        >
          <Box
            component="img"
            src={process.env.PUBLIC_URL + '/logo-1.png'}
            alt="Logo 1"
            sx={{
              height: 60,
              width: 'auto',
            }}
          />
          <Box
            component="img"
            src={process.env.PUBLIC_URL + '/logo-2.png'}
            alt="Logo 2"
            sx={{
              height: 60,
              width: 'auto',
            }}
          />
        </Box>
      </Box>
    </Box>
  );
};

export default Login; 