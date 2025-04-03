import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Paper,
  Grid,
  IconButton,
} from '@mui/material';
import {
  AddCircleOutline as AddIcon,
  ListAlt as ListIcon,
  AdminPanelSettings as AdminIcon,
} from '@mui/icons-material';

const Home = () => {
  const navigate = useNavigate();

  const ServiceCard = ({ title, description, icon, onClick }) => (
    <Paper
      elevation={3}
      sx={{
        p: 3,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        cursor: 'pointer',
        transition: 'all 0.3s',
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.85))',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        position: 'relative',
        overflow: 'hidden',
        '&:hover': {
          transform: 'translateY(-5px)',
          boxShadow: '0 8px 16px rgba(25, 118, 210, 0.2)',
          borderColor: '#1976d2',
          '&::before': {
            transform: 'scale(1.1)',
          },
          '& .icon-box': {
            transform: 'rotate(0deg) scale(1.1)',
            background: 'linear-gradient(135deg, #1976d2, #42a5f5)',
          }
        },
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: 'linear-gradient(90deg, #1976d2, #42a5f5)',
          transition: 'transform 0.3s',
        }
      }}
      onClick={onClick}
    >
      <Box
        className="icon-box"
        sx={{
          background: 'linear-gradient(135deg, #1976d2, #42a5f5)',
          borderRadius: '12px',
          p: 1.5,
          mb: 2,
          color: 'white',
          boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
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
          background: 'linear-gradient(135deg, #1976d2, #42a5f5)',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          color: 'transparent',
          mb: 1
        }}
      >
        {title}
      </Typography>
      <Typography 
        variant="body2" 
        color="text.secondary" 
        align="center"
        sx={{ 
          fontFamily: '"Lisu Bosa", serif',
          lineHeight: 1.4,
          color: '#666'
        }}
      >
        {description}
      </Typography>
    </Paper>
  );

  return (
    <Box 
      sx={{ 
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        backgroundColor: '#f8fafc',
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
          opacity: 0.15,
          zIndex: 0,
        },
      }}
    >
      {/* Header */}
      <Paper 
        elevation={0} 
        sx={{ 
          py: 1.5, 
          px: 3, 
          bgcolor: 'rgba(25, 118, 210, 0.95)',
          backdropFilter: 'blur(10px)',
          color: '#fff',
          borderRadius: 0,
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          zIndex: 1
        }}
      >
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center',
          maxWidth: 1200,
          mx: 'auto',
          gap: 2,
          position: 'relative',
          width: '100%',
        }}>
          <img 
            src={process.env.PUBLIC_URL + '/deped-logo.png'} 
            alt="DepEd Logo" 
            style={{ height: 50 }}
          />
          <Typography 
            variant="h6" 
            sx={{ 
              fontWeight: 800,
              fontFamily: '"Lisu Bosa", serif',
              color: "white",
              textShadow: '1px 1px 2px rgba(0,0,0,0.1)',
            }}
          >
            Division of Imus City
          </Typography>
          <IconButton 
            sx={{ 
              ml: 'auto',
              color: 'rgba(255, 255, 255, 0.7)',
              padding: '8px',
              '&:hover': {
                color: 'rgba(255, 255, 255, 0.9)',
                backgroundColor: 'transparent',
              }
            }}
            onClick={() => navigate('/login')}
          >
            <AdminIcon sx={{ fontSize: '1.2rem' }} />
          </IconButton>
        </Box>
      </Paper>

      {/* Main Content */}
      <Container 
        maxWidth="lg" 
        sx={{ 
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          py: 4,
          position: 'relative',
          zIndex: 1
        }}
      >
        {/* Welcome Section */}
        <Box 
          sx={{ 
            textAlign: 'center', 
            mb: 4
          }}
        >
          <Typography 
            variant="h3" 
            gutterBottom 
            sx={{ 
              fontWeight: 700,
              fontFamily: '"Lisu Bosa", serif',
              color: 'primary.main',
              textShadow: '2px 2px 4px rgba(0,0,0,0.1)',
              fontSize: { xs: '2rem', md: '2.5rem' },
              mb: 1
            }}
          >
            Welcome to DepEd Imus City
          </Typography>
          <Typography 
            variant="h6" 
            sx={{ 
              mb: 3,
              fontFamily: '"Lisu Bosa", serif',
              color: 'text.secondary',
              fontSize: { xs: '1rem', md: '1.25rem' }
            }}
          >
            How can we assist you today?
          </Typography>
        </Box>

        {/* Service Options */}
        <Grid container 
          spacing={3} 
          maxWidth="md" 
          sx={{ 
            mx: 'auto',
            px: { xs: 2, md: 0 }
          }}
        >
          <Grid item xs={12} sm={6}>
            <ServiceCard
              title="Submit a Ticket"
              description="Create a new support request for technical assistance, document processing, or account management"
              icon={<AddIcon />}
              onClick={() => navigate('/tickets')}
            />
          </Grid> 
          <Grid item xs={12} sm={6}>
            <ServiceCard
              title="Track Your Ticket"
              description="Check the status of your existing tickets and view support responses"
              icon={<ListIcon />}
              onClick={() => navigate('/track-ticket')}
            />
          </Grid>
        </Grid>
      </Container>

      {/* Footer */}
      <Box 
        component="footer" 
        sx={{ 
          py: 2,
          textAlign: 'center',
          bgcolor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          borderTop: '1px solid rgba(0,0,0,0.1)',
          color: 'text.secondary',
          zIndex: 1
        }}
      >
        <Typography 
          variant="body2" 
          color="inherit"
          sx={{ 
            fontFamily: '"Lisu Bosa", serif',
            fontSize: '0.875rem'
          }}
        >
          © {new Date().getFullYear()} DepEd Imus Division | imus.city@deped.gov.ph
        </Typography>
      </Box>
    </Box>
  );
};

export default Home; 