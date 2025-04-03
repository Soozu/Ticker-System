import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Grid,
  Alert,
  CircularProgress,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  Divider,
} from '@mui/material';
import axios from 'axios';
import BackButton from '../components/BackButton';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const MENU_PROPS = {
  PaperProps: {
    style: {
      maxHeight: 200,
      width: 'auto',
      overflowX: 'hidden'
    }
  }
};

const TechnicalAssistance = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [captchaId, setCaptchaId] = useState('');
  const [captchaCode, setCaptchaCode] = useState('');
  const [userCaptcha, setUserCaptcha] = useState('');
  const [loadingCaptcha, setLoadingCaptcha] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Schools data
  const schools = {
    'Elementary': [
      'Alapan I Elementary School',
      'Alapan II Elementary School',
      'Anabu I Elementary School',
      'Anabu II Elementary School',
      'Bayan Luma I Elementary School',
      'Bayan Luma II Elementary School',
      'Buhay na Tubig Elementary School',
      'Buhay na Tubig Elementary School - Maharlika Annex',
      'Bukandala Elementary School',
      'Carsadang Bago Elementary School',
      'Cayetano Topacio Elementary School',
      'Estanislao Villanueva Elementaty School',
      'Imus Pilot Elementary School',
      'Malagasang I Elementary School',
      'Malagasang II Elementary School',
      'Malagasang III Elementary School',
      'Palico Elementary School',
      'Pasong Buaya I Elementary School',
      'Pasong Buaya II Elementary School',
      'Pasong Buaya III Elementary School',
      'Pasong Santol Elementary School',
      'Pasong Santol Elementary School - Golden City',
      'Tanzang Luma Elementary School',
      'Tinabunan Elementary School',
      'Toclong Elementary School'
    ],
    'Junior High School': [
      'Gen. Emilio Aguinaldo National High School',
      'Gen. Licerio Topacio National High School',
      'Gen. Tomas Mascardo High School',
      'Hipolito Saquilayan National High School',
      'Imus National High School'
    ],
    'Senior High School': [
      'Gen. Flaviano Yengko Senior High School',
      'Gen. Juan Castañeda Senior High School',
      'Gen. Pantaleon Garcia Senior High School',
      'Gov. Juanito Reyes Remulla Senior High School'
    ],
    'Integrated School': [
      'Anastacio Advincula Integrated School',
      'City of Imus Integrated School',
      'Francisca Benitez Integrated School',
      'Gov. D.M. Camerino Integrated School'
    ]
  };

  // SDO Departments
  const departments = [
    'Office of the Schools Division Superintendent',
    'Curriculum Implementation Division',
    'School Governance and Operations Division',
    'School Management Monitoring and Evaluation Division',
    'Administrative Division',
    'Finance Division',
    'Human Resource Development Division',
    'Information and Communications Technology Division',
    'Legal Unit',
    'Records Unit',
    'Supply Unit',
    'Cashier Unit',
    'Property Unit',
    'General Services Unit',
    'Medical and Dental Unit',
    'Guidance and Counseling Unit',
    'Library Hub',
    'Learning Resource Management and Development System',
    'School Health and Nutrition Unit',
    'Special Education Unit',
    'Alternative Learning System Unit',
    'Youth Formation Unit',
    'Sports Unit',
    'School Sports Unit'
  ];

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    priority: '',
    taType: '',
    location: '',
    schoolLevel: '',
    schoolName: '',
    department: '',
    subject: '',
    message: ''
  });

  const generateNewCaptcha = async () => {
    setLoadingCaptcha(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/tickets/generate-captcha`);
      if (response.data.success) {
        setCaptchaId(response.data.captchaId);
        setCaptchaCode(response.data.captchaCode);
      } else {
        setError('Failed to generate CAPTCHA');
      }
    } catch (err) {
      setError('Error generating CAPTCHA');
    } finally {
      setLoadingCaptcha(false);
    }
  };

  useEffect(() => {
    generateNewCaptcha();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value,
      ...(name === 'location' && {
        schoolLevel: '',
        schoolName: '',
        department: ''
      }),
      ...(name === 'schoolLevel' && {
        schoolName: ''
      })
    }));

    if (name === 'email') {
      if (!value) {
        setEmailError('Email is required');
      } else if (!validateEmail(value)) {
        setEmailError('Please enter a valid email address');
      } else {
        setEmailError('');
      }
    }
  };

  const validateEmail = (email) => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  };

  const getLocationDisplay = () => {
    if (formData.location === 'SDO_IMUS_CITY') {
      return `SDO - Imus City - ${formData.department}`;
    } else if (formData.location === 'SCHOOL_IMUS_CITY') {
      return `${formData.schoolLevel} - ${formData.schoolName}`;
    }
    return '';
  };

  const getTATypeDisplay = () => {
    return formData.taType.replace(/_/g, ' ');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateEmail(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }

    if (!userCaptcha) {
      setError('Please enter the CAPTCHA code');
      return;
    }

    setShowConfirmation(true);
  };

  const handleConfirmSubmit = async () => {
    setLoading(true);
    setShowConfirmation(false);

    try {
      const response = await axios.post(`${API_BASE_URL}/tickets/technical-assistance`, {
        ...formData,
        category: 'TECHNICAL_ASSISTANCE',
        captchaId,
        captchaCode: userCaptcha
      });

      if (response.data.success) {
        const { ticketId, trackingId } = response.data;
        setSuccess(
          <div>
            <Typography variant="body1" gutterBottom>
              Ticket created successfully!
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Ticket ID: #{ticketId}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Tracking ID: {trackingId}
            </Typography>
            <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 1 }}>
              Please save these details for future reference.
            </Typography>
          </div>
        );
        
        setFormData({
          name: '',
          email: '',
          priority: '',
          taType: '',
          location: '',
          schoolLevel: '',
          schoolName: '',
          department: '',
          subject: '',
          message: ''
        });
        setUserCaptcha('');
        generateNewCaptcha();
      } else {
        setError(response.data.message || 'Failed to create ticket');
        generateNewCaptcha();
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'An error occurred while creating the ticket';
      if (err.response?.status === 429) {
        const rateLimitInfo = err.response.data.rateLimitInfo;
        setError(
          <div>
            <Typography variant="body1" color="error" gutterBottom>
              {errorMessage}
            </Typography>
            {rateLimitInfo && (
              <Typography variant="body2" color="error">
                Please wait {rateLimitInfo.cooldownMinutes} minutes before trying again.
                Remaining attempts: {rateLimitInfo.remainingAttempts}
              </Typography>
            )}
          </div>
        );
      } else {
        setError(errorMessage);
      }
      generateNewCaptcha();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ 
      mt: 4, 
      mb: 4, 
      position: 'relative',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      '&::before': {
        content: '""',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '#f0f7ff',
        backgroundImage: 'linear-gradient(120deg, #fdfbfb 0%, #ebedee 100%)',
        zIndex: -1
      }
    }}>
      <BackButton onClick={() => navigate('/tickets')} />

      <Box sx={{ 
        textAlign: 'center', 
        mb: 4,
        '& h4': {
          color: '#1565c0',
          fontWeight: 700,
          fontSize: '2rem',
          fontFamily: '"Lisu Bosa", serif',
          position: 'relative',
          display: 'inline-block',
          mb: 3,
          '&:after': {
            content: '""',
            position: 'absolute',
            bottom: -12,
            left: '50%',
            transform: 'translateX(-50%)',
            width: '80px',
            height: 4,
            backgroundColor: '#1976d2',
            borderRadius: 2,
          }
        }
      }}>
        <Typography variant="h4">
          Technical Assistance Request
        </Typography>
        <Typography variant="subtitle1" sx={{ color: '#546e7a', mt: 2, fontFamily: '"Lisu Bosa", serif' }}>
          Please fill out the form below to submit your technical assistance request
        </Typography>
      </Box>

      <Paper elevation={3} sx={{ 
        p: { xs: 2, sm: 3, md: 4 },
        borderRadius: 3,
        backgroundColor: '#ffffff',
        position: 'relative',
        border: '1px solid rgba(25, 118, 210, 0.1)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
        '& .MuiTextField-root, & .MuiFormControl-root': {
          backgroundColor: '#ffffff',
          borderRadius: 1,
          '& .MuiOutlinedInput-root': {
            transition: 'all 0.2s ease-in-out',
            '&:hover fieldset': {
              borderColor: '#1976d2',
              borderWidth: '2px',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#1976d2',
              borderWidth: '2px',
            }
          },
          '& .MuiInputLabel-root': {
            color: '#546e7a',
            '&.Mui-focused': {
              color: '#1976d2',
            }
          },
          '& .MuiInputBase-input': {
            fontSize: '0.95rem',
            padding: '12px 14px',
          }
        }
      }}>
        {error && (
          <Alert 
            severity="error" 
            sx={{ 
              mb: 3,
              borderRadius: 2,
              '& .MuiAlert-icon': {
                fontSize: '1.5rem'
              }
            }}
          >
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert 
            severity="success" 
            sx={{ 
              mb: 3,
              borderRadius: 2,
              '& .MuiAlert-icon': {
                fontSize: '1.5rem'
              }
            }}
          >
            {success}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Grid container spacing={4}>
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ 
                color: '#1565c0',
                fontWeight: 600,
                mb: 3,
                fontFamily: '"Lisu Bosa", serif',
                fontSize: '1.2rem',
                borderBottom: '2px solid #e3f2fd',
                pb: 1
              }}>
                Personal Information
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                disabled={loading}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                error={!!emailError}
                helperText={emailError}
                disabled={loading}
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="h6" sx={{ 
                color: '#1565c0',
                fontWeight: 600,
                mb: 3,
                mt: 2,
                fontFamily: '"Lisu Bosa", serif',
                fontSize: '1.2rem',
                borderBottom: '2px solid #e3f2fd',
                pb: 1
              }}>
                Request Details
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Priority</InputLabel>
                <Select
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  label="Priority"
                  disabled={loading}
                  MenuProps={MENU_PROPS}
                >
                  <MenuItem value="HIGH">High</MenuItem>
                  <MenuItem value="MEDIUM">Medium</MenuItem>
                  <MenuItem value="LOW">Low</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>TA Type</InputLabel>
                <Select
                  name="taType"
                  value={formData.taType}
                  onChange={handleChange}
                  label="TA Type"
                  disabled={loading}
                  MenuProps={MENU_PROPS}
                >
                  <MenuItem value="DCP_MONITORING">DCP Monitoring</MenuItem>
                  <MenuItem value="AV_ASSISTANCE">AV Assistance</MenuItem>
                  <MenuItem value="ICT_TUTORIAL">ICT Tutorial</MenuItem>
                  <MenuItem value="ICT_ASSISTANCE">ICT Assistance</MenuItem>
                  <MenuItem value="ID_PRINTING">ID Printing</MenuItem>
                  <MenuItem value="BIOMETRICS_ENROLLMENT">BIOMETRICS Enrollment</MenuItem>
                  <MenuItem value="ICT_EQUIPMENT_INSPECTION">ICT Equipment Inspection</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel>Location</InputLabel>
                <Select
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  label="Location"
                  disabled={loading}
                  MenuProps={MENU_PROPS}
                >
                  <MenuItem value="SDO_IMUS_CITY">SDO - Imus City</MenuItem>
                  <MenuItem value="SCHOOL_IMUS_CITY">School - Imus City</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {formData.location === 'SCHOOL_IMUS_CITY' && (
              <>
                <Grid item xs={12}>
                  <FormControl fullWidth required>
                    <InputLabel>School Level</InputLabel>
                    <Select
                      name="schoolLevel"
                      value={formData.schoolLevel}
                      onChange={handleChange}
                      label="School Level"
                      disabled={loading}
                      MenuProps={MENU_PROPS}
                    >
                      {Object.keys(schools).map((level) => (
                        <MenuItem key={level} value={level}>
                          {level}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                {formData.schoolLevel && (
                  <Grid item xs={12}>
                    <FormControl fullWidth required>
                      <InputLabel>School Name</InputLabel>
                      <Select
                        name="schoolName"
                        value={formData.schoolName}
                        onChange={handleChange}
                        label="School Name"
                        disabled={loading}
                        MenuProps={MENU_PROPS}
                      >
                        {schools[formData.schoolLevel].map((school) => (
                          <MenuItem key={school} value={school}>
                            {school}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                )}
              </>
            )}

            {formData.location === 'SDO_IMUS_CITY' && (
              <Grid item xs={12}>
                <FormControl fullWidth required>
                  <InputLabel>Department</InputLabel>
                  <Select
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    label="Department"
                    disabled={loading}
                    MenuProps={MENU_PROPS}
                  >
                    {departments.map((dept) => (
                      <MenuItem key={dept} value={dept}>
                        {dept}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}

            <Grid item xs={12}>
              <Typography variant="h6" sx={{ 
                color: '#1565c0',
                fontWeight: 600,
                mb: 3,
                mt: 2,
                fontFamily: '"Lisu Bosa", serif',
                fontSize: '1.2rem',
                borderBottom: '2px solid #e3f2fd',
                pb: 1
              }}>
                Message Details
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                label="Subject"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                disabled={loading}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                label="Message"
                name="message"
                multiline
                rows={4}
                value={formData.message}
                onChange={handleChange}
                disabled={loading}
              />
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ 
                mt: 4, 
                mb: 4, 
                textAlign: 'center',
                width: '100%',
                backgroundColor: '#f8fafc',
                borderRadius: 2,
                p: 4,
                border: '1px solid rgba(25, 118, 210, 0.1)'
              }}>
                <Typography 
                  variant="h5" 
                  gutterBottom 
                  sx={{ 
                    color: '#1565c0',
                    fontWeight: 600,
                    mb: 3,
                    fontFamily: '"Lisu Bosa", serif',
                    fontSize: '1.5rem'
                  }}
                >
                  Spam Prevention
                </Typography>
                <Typography variant="subtitle1" gutterBottom sx={{ 
                  color: '#546e7a', 
                  mb: 3,
                  fontSize: '0.95rem'
                }}>
                  Please enter the verification code below:
                </Typography>
                
                <Box sx={{ 
                  maxWidth: '400px', 
                  margin: '0 auto',
                  p: 3,
                  backgroundColor: '#ffffff',
                  borderRadius: '12px',
                  border: '1px solid rgba(25, 118, 210, 0.1)',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
                }}>
                  {loadingCaptcha ? (
                    <CircularProgress size={24} sx={{ mb: 2 }} />
                  ) : (
                    <Typography 
                      variant="h4" 
                      sx={{ 
                        fontFamily: 'monospace',
                        letterSpacing: '0.5em',
                        padding: '20px',
                        borderRadius: '8px',
                        userSelect: 'none',
                        backgroundColor: '#f8fafc',
                        border: '1px solid rgba(25, 118, 210, 0.1)',
                        mb: 2,
                        fontWeight: 600
                      }}
                    >
                      {captchaCode}
                    </Typography>
                  )}
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={generateNewCaptcha}
                    disabled={loadingCaptcha || loading}
                    sx={{ 
                      mb: 3,
                      borderRadius: '8px',
                      textTransform: 'none',
                      fontWeight: 600,
                      '&.Mui-disabled': {
                        color: 'text.secondary'
                      }
                    }}
                  >
                    Refresh Code
                  </Button>
                  <TextField
                    fullWidth
                    label="Enter Verification Code"
                    variant="outlined"
                    value={userCaptcha}
                    onChange={(e) => setUserCaptcha(e.target.value)}
                    required
                    disabled={loading}
                    sx={{ 
                      '& .MuiInputBase-input': { 
                        textAlign: 'center',
                        fontSize: '1.2rem',
                        letterSpacing: '0.3em',
                        fontFamily: 'monospace',
                        fontWeight: 600
                      }
                    }}
                  />
                </Box>
              </Box>
            </Grid>

            <Grid item xs={12}>
              <Button
                type="submit"
                variant="contained"
                fullWidth
                size="large"
                disabled={loading}
                sx={{
                  mt: 2,
                  py: 1.8,
                  fontSize: '1rem',
                  fontWeight: 600,
                  textTransform: 'none',
                  borderRadius: 2,
                  backgroundColor: '#1976d2',
                  color: '#fff',
                  boxShadow: '0 4px 12px rgba(25, 118, 210, 0.2)',
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    backgroundColor: '#1565c0',
                    boxShadow: '0 6px 16px rgba(25, 118, 210, 0.3)',
                    transform: 'translateY(-1px)'
                  },
                  '&:active': {
                    transform: 'translateY(1px)'
                  }
                }}
              >
                Review & Submit Request
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>

      <Dialog 
        open={showConfirmation} 
        onClose={() => setShowConfirmation(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ 
          backgroundColor: '#f8fafc',
          borderBottom: '2px solid #e3f2fd',
          pb: 2
        }}>
          <Typography variant="h6" sx={{ 
            color: '#1565c0',
            fontWeight: 600,
            fontFamily: '"Lisu Bosa", serif'
          }}>
            Confirm Technical Assistance Request
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <List>
            <ListItem>
              <ListItemText 
                primary="Personal Information"
                secondary={
                  <Box component="div">
                    <Typography component="div" variant="body2"><strong>Name:</strong> {formData.name}</Typography>
                    <Typography component="div" variant="body2"><strong>Email:</strong> {formData.email}</Typography>
                  </Box>
                }
              />
            </ListItem>
            <Divider />
            <ListItem>
              <ListItemText 
                primary="Request Details"
                secondary={
                  <Box component="div">
                    <Typography component="div" variant="body2"><strong>Priority:</strong> {formData.priority}</Typography>
                    <Typography component="div" variant="body2"><strong>TA Type:</strong> {getTATypeDisplay()}</Typography>
                    <Typography component="div" variant="body2"><strong>Location:</strong> {getLocationDisplay()}</Typography>
                  </Box>
                }
              />
            </ListItem>
            <Divider />
            <ListItem>
              <ListItemText 
                primary="Message Details"
                secondary={
                  <Box component="div">
                    <Typography component="div" variant="body2"><strong>Subject:</strong> {formData.subject}</Typography>
                    <Typography component="div" variant="body2"><strong>Message:</strong> {formData.message}</Typography>
                  </Box>
                }
              />
            </ListItem>
          </List>
        </DialogContent>
        <DialogActions sx={{ 
          p: 3,
          backgroundColor: '#f8fafc',
          borderTop: '2px solid #e3f2fd'
        }}>
          <Button 
            onClick={() => setShowConfirmation(false)}
            variant="outlined"
            sx={{ 
              color: '#546e7a',
              borderColor: '#546e7a',
              '&:hover': {
                borderColor: '#546e7a',
                backgroundColor: 'rgba(84, 110, 122, 0.04)'
              }
            }}
          >
            Edit Details
          </Button>
          <Button 
            onClick={handleConfirmSubmit}
            variant="contained"
            disabled={loading}
            sx={{
              backgroundColor: '#1976d2',
              '&:hover': {
                backgroundColor: '#1565c0'
              }
            }}
          >
            {loading ? (
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <CircularProgress size={24} sx={{ mr: 1, color: 'white' }} />
                Submitting...
              </Box>
            ) : (
              'Confirm & Submit'
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default TechnicalAssistance; 