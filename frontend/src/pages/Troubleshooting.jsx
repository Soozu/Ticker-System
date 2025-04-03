import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  TextField,
  Button,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Backdrop,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  Divider,
} from '@mui/material';
import api from '../utils/api';
import BackButton from '../components/BackButton';

const Troubleshooting = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    department: '',
    locationType: '',
    schoolLevel: '',
    schoolName: '',
    dateOfRequest: new Date().toISOString().split('T')[0],
    typeOfEquipment: '',
    modelOfEquipment: '',
    serialNo: '',
    specificProblem: '',
    customEquipmentType: '',
    customModel: '',
    priority: '',
    captchaCode: ''
  });
  const [message, setMessage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [captcha, setCaptcha] = useState({ id: '', code: '' });
  const [captchaError, setCaptchaError] = useState(null);
  const [captchaDisabled, setCaptchaDisabled] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const navigate = useNavigate();

  const equipmentModels = {
    Desktop: [
      'Acer Aspire',
      'HP ProDesk',
      'Lenovo ThinkCentre',
      'Dell OptiPlex',
      'ASUS VivoPC',
      'MSI Pro',
      'Intel NUC',
      'Other'
    ],
    Laptop: [
      'Acer Swift',
      'HP Pavilion',
      'Lenovo ThinkPad',
      'Dell XPS',
      'ASUS ZenBook',
      'MSI Modern',
      'MacBook Pro',
      'MacBook Air',
      'Other'
    ],
    Printer: [
      'HP LaserJet',
      'Canon PIXMA',
      'Epson WorkForce',
      'Brother HL',
      'Xerox VersaLink',
      'Lexmark',
      'Samsung Xpress',
      'Other'
    ],
    Scanner: [
      'Epson V39',
      'Canon DR',
      'HP ScanJet',
      'Brother ADS',
      'Fujitsu ScanSnap',
      'Kodak i2600',
      'Plustek',
      'Other'
    ],
    Others: []
  };

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

  // Function to generate new CAPTCHA with retry logic
  const generateCaptcha = useCallback(async (retryCount = 0) => {
    try {
      setCaptchaError(null);
      const response = await api.get('/tickets/generate-captcha');
      setCaptcha({
        id: response.data.captchaId,
        code: response.data.captchaCode
      });
      setCaptchaDisabled(false);
    } catch (error) {
      console.error('Error generating CAPTCHA:', error);
      const errorMessage = 'Unable to generate verification code. Please try again.';
      setCaptchaError(errorMessage);
    }
  }, []); // No dependencies needed for the callback

  useEffect(() => {
    let mounted = true;
    let timeoutId = null;
    
    const initCaptcha = async () => {
      if (mounted && !captcha.id) {
        try {
          await generateCaptcha();
        } catch (error) {
          console.error('Failed to initialize CAPTCHA:', error);
        }
      }
    };

    timeoutId = setTimeout(initCaptcha, 1000);

    return () => {
      mounted = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [generateCaptcha, captcha.id]);

  // Add a manual refresh function without confirmation
  const handleRefreshCaptcha = async () => {
    if (captchaDisabled) {
      return;
    }
    await generateCaptcha();
  };

  // Add email validation function
  const validateEmail = (email) => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  };

  // Update handleChange to include email validation
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
      // Reset dependent fields
      ...(name === 'typeOfEquipment' && { modelOfEquipment: '' }),
      ...(name === 'locationType' && { schoolLevel: '', schoolName: '' }),
      ...(name === 'schoolLevel' && { schoolName: '' })
    }));

    // Validate email when it changes
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

  // Add function to format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Add function to handle confirmation dialog
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setMessage(null);
    setCaptchaError(null);

    // Validate email before showing confirmation
    if (!validateEmail(formData.email)) {
      setMessage({ type: 'error', text: 'Please enter a valid email address' });
      return;
    }

    // Validate CAPTCHA input
    if (!formData.captchaCode) {
      setMessage({ type: 'error', text: 'Please enter the verification code' });
      return;
    }

    setShowConfirmation(true);
  };

  const handleConfirmSubmit = async () => {
    setShowConfirmation(false);
    setIsSubmitting(true);
    setMessage(null);
    setCaptchaError(null);

    try {
      const finalModelOfEquipment = formData.modelOfEquipment === 'Other' ? formData.customModel : formData.modelOfEquipment;

      const response = await api.post('/tickets/troubleshooting', {
        category: 'TROUBLESHOOTING',
        name: formData.name,
        email: formData.email,
        department: formData.locationType === 'SDO' ? formData.department : null,
        location: formData.locationType === 'SDO' ? 'SDO_IMUS_CITY' : 'SCHOOL_IMUS_CITY',
        schoolLevel: formData.locationType === 'SCHOOL' ? formData.schoolLevel : null,
        schoolName: formData.locationType === 'SCHOOL' ? formData.schoolName : null,
        dateOfRequest: formData.dateOfRequest,
        typeOfEquipment: formData.typeOfEquipment === 'Others' ? formData.customEquipmentType : formData.typeOfEquipment,
        modelOfEquipment: finalModelOfEquipment,
        serialNo: formData.serialNo,
        specificProblem: formData.specificProblem,
        priority: formData.priority,
        captchaId: captcha.id,
        captchaCode: formData.captchaCode
      });

      const { ticketId, trackingId } = response.data;
      setMessage({
        type: 'success',
        text: (
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
        )
      });

      // Reset form
      setFormData({
        name: '',
        email: '',
        department: '',
        locationType: '',
        schoolLevel: '',
        schoolName: '',
        dateOfRequest: new Date().toISOString().split('T')[0],
        typeOfEquipment: '',
        modelOfEquipment: '',
        serialNo: '',
        specificProblem: '',
        customEquipmentType: '',
        customModel: '',
        priority: 'MEDIUM',
        captchaCode: ''
      });
      
      // Generate new CAPTCHA after successful submission
      generateCaptcha();
    } catch (error) {
      console.error('Error submitting ticket:', error);
      const errorMessage = error.response?.data?.message || 'Unable to submit request. Please try again.';
      
      if (error.response?.status === 429) {
        const rateLimitInfo = error.response.data.rateLimitInfo;
        setMessage({
          type: 'error',
          text: (
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
          )
        });
      } else {
        setMessage({
          type: 'error',
          text: errorMessage
        });
      }

      // Generate new CAPTCHA on error
      generateCaptcha();
    } finally {
      setIsSubmitting(false);
    }
  };

  // Add function to get location display
  const getLocationDisplay = () => {
    if (formData.locationType === 'SDO') {
      return 'SDO - Imus City';
    } else if (formData.locationType === 'SCHOOL') {
      return `${formData.schoolName} (${formData.schoolLevel})`;
    }
    return '';
  };

  // Add function to get equipment display
  const getEquipmentDisplay = () => {
    if (formData.typeOfEquipment === 'Others') {
      return `${formData.customEquipmentType} - ${formData.modelOfEquipment}`;
    } else if (formData.modelOfEquipment === 'Other') {
      return `${formData.typeOfEquipment} - ${formData.customModel}`;
    }
    return `${formData.typeOfEquipment} - ${formData.modelOfEquipment}`;
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
          Troubleshooting Form
        </Typography>
        <Typography variant="subtitle1" sx={{ color: '#546e7a', mt: 2, fontFamily: '"Lisu Bosa", serif' }}>
          Please fill out the form below to submit your troubleshooting request
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
        {isSubmitting && (
          <Backdrop
            sx={{
              position: 'absolute',
              color: '#fff',
              zIndex: 1,
              background: 'rgba(255, 255, 255, 0.7)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              borderRadius: 2,
            }}
            open={isSubmitting}
          >
            <CircularProgress color="primary" />
            <Typography variant="body1" sx={{ mt: 2, color: 'text.primary', fontFamily: '"Lisu Bosa", serif' }}>
              Submitting your request...
            </Typography>
          </Backdrop>
        )}

        {message && (
          <Alert 
            severity={message.type} 
            sx={{ 
              mb: 3,
              borderRadius: 1,
              '& .MuiAlert-icon': {
                fontSize: '1.5rem'
              }
            }}
          >
            {message.text}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Box sx={{ 
            display: 'grid', 
            gap: 3,
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
            '& .full-width': {
              gridColumn: { xs: '1', sm: '1 / -1' }
            },
            '& .MuiFormControl-root': {
              minHeight: '80px'
            }
          }}>
            {/* Personal Information Section */}
            <Box sx={{ gridColumn: '1 / -1' }}>
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
            </Box>

            <TextField
              required
              label="Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              variant="outlined"
              disabled={isSubmitting}
              sx={{ '& .MuiInputBase-input': { fontSize: '0.9rem' } }}
            />

            <TextField
              required
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              variant="outlined"
              disabled={isSubmitting}
              error={!!emailError}
              helperText={emailError}
              sx={{ '& .MuiInputBase-input': { fontSize: '0.9rem' } }}
            />

            {/* Request Details Section */}
            <Box sx={{ gridColumn: '1 / -1', mt: 2 }}>
              <Typography variant="h6" sx={{ 
                color: '#1565c0',
                fontWeight: 600,
                mb: 3,
                fontFamily: '"Lisu Bosa", serif',
                fontSize: '1.2rem',
                borderBottom: '2px solid #e3f2fd',
                pb: 1
              }}>
                Request Details
              </Typography>
            </Box>

            {/* Location Selection */}
            <FormControl required className="full-width" disabled={isSubmitting}>
              <InputLabel>Location</InputLabel>
              <Select
                name="locationType"
                value={formData.locationType}
                onChange={handleChange}
                label="Location"
                sx={{ fontSize: '0.9rem' }}
              >
                <MenuItem value="SDO">SDO - Imus City</MenuItem>
                <MenuItem value="SCHOOL">School - Imus City</MenuItem>
              </Select>
            </FormControl>

            {/* Department Selection for SDO */}
            {formData.locationType === 'SDO' && (
              <FormControl required className="full-width" disabled={isSubmitting}>
                <InputLabel>Department</InputLabel>
                <Select
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  label="Department"
                  sx={{ fontSize: '0.9rem' }}
                  MenuProps={{
                    PaperProps: {
                      style: {
                        maxHeight: 200,
                        width: '50%'
                      },
                    },
                  }}
                >
                  <MenuItem value="Information and Communications Technology Unit">Information and Communications Technology Unit</MenuItem>
                  <MenuItem value="Administrative Service - Personnel Unit">Administrative Service - Personnel Unit</MenuItem>
                  <MenuItem value="Administrative Service - Records Unit">Administrative Service - Records Unit</MenuItem>
                  <MenuItem value="Administrative Service - Cash Unit">Administrative Service - Cash Unit</MenuItem>
                  <MenuItem value="Administrative Service - Proper">Administrative Service - Proper</MenuItem>
                  <MenuItem value="Finance Services - Budget Unit">Finance Services - Budget Unit</MenuItem>
                  <MenuItem value="Finance Services - Accounting Unit">Finance Services - Accounting Unit</MenuItem>
                  <MenuItem value="Legal Services Unit">Legal Services Unit</MenuItem>
                  <MenuItem value="Curriculum Implementation Division (CID) - ALS">Curriculum Implementation Division (CID) - ALS</MenuItem>
                  <MenuItem value="Curriculum Implementation Division (CID) - Proper">Curriculum Implementation Division (CID) - Proper</MenuItem>
                  <MenuItem value="Curriculum Implementation Division (CID) - Learning Resources">Curriculum Implementation Division (CID) - Learning Resources</MenuItem>
                  <MenuItem value="School Governance and Operations Division (SGOD) - Planning and Research Section">School Governance and Operations Division (SGOD) - Planning and Research Section</MenuItem>
                  <MenuItem value="School Governance and Operations Division (SGOD) - Human Resource Development">School Governance and Operations Division (SGOD) - Human Resource Development</MenuItem>
                  <MenuItem value="School Governance and Operations Division (SGOD) - Social Mobilization and Networking">School Governance and Operations Division (SGOD) - Social Mobilization and Networking</MenuItem>
                  <MenuItem value="School Governance and Operations Division (SGOD) - School Management Monitoring and Evaluation">School Governance and Operations Division (SGOD) - School Management Monitoring and Evaluation</MenuItem>
                  <MenuItem value="School Governance and Operations Division (SGOD) - Education Facilities">School Governance and Operations Division (SGOD) - Education Facilities</MenuItem>
                  <MenuItem value="School Governance and Operations Division (SGOD) - DRRM">School Governance and Operations Division (SGOD) - DRRM</MenuItem>
                  <MenuItem value="School Governance and Operations Division (SGOD) - YFD">School Governance and Operations Division (SGOD) - YFD</MenuItem>
                  <MenuItem value="School Governance and Operations Division (SGOD) - Main">School Governance and Operations Division (SGOD) - Main</MenuItem>
                  <MenuItem value="Office of the Schools Division Superintendent (OSDS)">Office of the Schools Division Superintendent (OSDS)</MenuItem>
                  <MenuItem value="Office of the Assistant Schools Division Superintendent (OASDS)">Office of the Assistant Schools Division Superintendent (OASDS)</MenuItem>
                </Select>
              </FormControl>
            )}

            {/* School Level Selection */}
            {formData.locationType === 'SCHOOL' && (
              <FormControl required disabled={isSubmitting}>
                <InputLabel>School Level</InputLabel>
                <Select
                  name="schoolLevel"
                  value={formData.schoolLevel}
                  onChange={handleChange}
                  label="School Level"
                  sx={{ fontSize: '0.9rem' }}
                >
                  {Object.keys(schools).map((level) => (
                    <MenuItem key={level} value={level}>
                      {level}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            {/* School Name Selection */}
            {formData.schoolLevel && (
              <FormControl required className="full-width" disabled={isSubmitting}>
                <InputLabel>School Name</InputLabel>
                <Select
                  name="schoolName"
                  value={formData.schoolName}
                  onChange={handleChange}
                  label="School Name"
                  sx={{ fontSize: '0.9rem' }}
                  MenuProps={{
                    PaperProps: {
                      style: {
                        maxHeight: 200,
                        width: '50%'
                      },
                    },
                  }}
                >
                  {schools[formData.schoolLevel]?.map((school) => (
                    <MenuItem key={school} value={school}>
                      {school}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            {/* Equipment Information */}
            <TextField
              required
              label="Date of Request"
              name="dateOfRequest"
              type="date"
              value={formData.dateOfRequest}
              onChange={handleChange}
              InputLabelProps={{ shrink: true }}
              disabled={isSubmitting}
              sx={{ '& .MuiInputBase-input': { fontSize: '0.9rem' } }}
            />

            <FormControl required disabled={isSubmitting}>
              <InputLabel>Type of Equipment</InputLabel>
              <Select
                name="typeOfEquipment"
                value={formData.typeOfEquipment}
                onChange={handleChange}
                label="Type of Equipment"
                sx={{ fontSize: '0.9rem' }}
              >
                <MenuItem value="Desktop">Desktop</MenuItem>
                <MenuItem value="Laptop">Laptop</MenuItem>
                <MenuItem value="Printer">Printer</MenuItem>
                <MenuItem value="Scanner">Scanner</MenuItem>
                <MenuItem value="Others">Others</MenuItem>
              </Select>
            </FormControl>

            {formData.typeOfEquipment === 'Others' && (
              <TextField
                required
                name="customEquipmentType"
                label="Specify Equipment Type"
                value={formData.customEquipmentType || ''}
                onChange={handleChange}
                disabled={isSubmitting}
                sx={{ '& .MuiInputBase-input': { fontSize: '0.9rem' } }}
              />
            )}

            <FormControl required sx={{ gridColumn: formData.typeOfEquipment === 'Others' ? '1 / -1' : 'auto' }} disabled={isSubmitting}>
              {formData.typeOfEquipment === 'Others' ? (
                <TextField
                  required
                  name="modelOfEquipment"
                  label="Specify Equipment Model"
                  value={formData.modelOfEquipment || ''}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  sx={{ '& .MuiInputBase-input': { fontSize: '0.9rem' } }}
                />
              ) : (
                <>
                  <InputLabel>Model of Equipment</InputLabel>
                  <Select
                    name="modelOfEquipment"
                    value={formData.modelOfEquipment}
                    onChange={handleChange}
                    label="Model of Equipment"
                    sx={{ fontSize: '0.9rem' }}
                  >
                    {(equipmentModels[formData.typeOfEquipment] || []).map((model) => (
                      <MenuItem key={model} value={model}>
                        {model}
                      </MenuItem>
                    ))}
                  </Select>
                </>
              )}
            </FormControl>

            {formData.modelOfEquipment === 'Other' && formData.typeOfEquipment !== 'Others' && (
              <TextField
                required
                name="customModel"
                label="Specify Other Model"
                value={formData.customModel}
                onChange={handleChange}
                disabled={isSubmitting}
                sx={{ '& .MuiInputBase-input': { fontSize: '0.9rem' } }}
              />
            )}

            <TextField
              required
              label="Serial No."
              name="serialNo"
              value={formData.serialNo}
              onChange={handleChange}
              disabled={isSubmitting}
              sx={{ '& .MuiInputBase-input': { fontSize: '0.9rem' } }}
            />

            <FormControl required disabled={isSubmitting}>
              <InputLabel>Priority</InputLabel>
              <Select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                label="Priority"
                sx={{ fontSize: '0.9rem' }}
              >
                <MenuItem value="HIGH">High</MenuItem>
                <MenuItem value="MEDIUM">Medium</MenuItem>
                <MenuItem value="LOW">Low</MenuItem>
              </Select>
            </FormControl>

            {/* Message Details Section */}
            <Box sx={{ gridColumn: '1 / -1', mt: 2 }}>
              <Typography variant="h6" sx={{ 
                color: '#1565c0',
                fontWeight: 600,
                mb: 3,
                fontFamily: '"Lisu Bosa", serif',
                fontSize: '1.2rem',
                borderBottom: '2px solid #e3f2fd',
                pb: 1
              }}>
                Message Details
              </Typography>
            </Box>

            <TextField
              required
              multiline
              rows={4}
              label="Specific Problem"
              name="specificProblem"
              value={formData.specificProblem}
              onChange={handleChange}
              className="full-width"
              disabled={isSubmitting}
              sx={{ 
                '& .MuiInputBase-input': { 
                  fontSize: '0.9rem',
                  lineHeight: '1.5'
                } 
              }}
            />

            {/* CAPTCHA Display */}
            <Box sx={{ 
              mt: 4, 
              mb: 4, 
              textAlign: 'center',
              width: '100%',
              gridColumn: '1 / -1',
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
              {captchaError && (
                <Alert severity="error" sx={{ 
                  mb: 3, 
                  maxWidth: '400px', 
                  margin: '0 auto',
                  borderRadius: 2
                }}>
                  {captchaError}
                </Alert>
              )}
              <Box sx={{ 
                maxWidth: '400px', 
                margin: '0 auto',
                p: 3,
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                border: '1px solid rgba(25, 118, 210, 0.1)',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
              }}>
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
                  {captcha.code}
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={handleRefreshCaptcha}
                  disabled={captchaDisabled || isSubmitting}
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
                  value={formData.captchaCode}
                  onChange={(e) => setFormData({ ...formData, captchaCode: e.target.value })}
                  required
                  error={!!captchaError}
                  helperText={captchaError}
                  disabled={isSubmitting}
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

            <Button
              type="submit"
              variant="contained"
              size="large"
              className="full-width"
              disabled={isSubmitting}
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
              {isSubmitting ? (
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <CircularProgress size={24} sx={{ mr: 1, color: 'white' }} />
                  Submitting Request...
                </Box>
              ) : (
                'Review & Submit Request'
              )}
            </Button>
          </Box>
        </form>
      </Paper>

      {/* Update Confirmation Dialog */}
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
            Confirm Ticket Details
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
                primary="Location & Department"
                secondary={
                  <Box component="div">
                    <Typography component="div" variant="body2"><strong>Location:</strong> {getLocationDisplay()}</Typography>
                    {formData.locationType === 'SDO' && (
                      <Typography component="div" variant="body2"><strong>Department:</strong> {formData.department}</Typography>
                    )}
                  </Box>
                }
              />
            </ListItem>
            <Divider />
            <ListItem>
              <ListItemText 
                primary="Equipment Details"
                secondary={
                  <Box component="div">
                    <Typography component="div" variant="body2"><strong>Equipment:</strong> {getEquipmentDisplay()}</Typography>
                    <Typography component="div" variant="body2"><strong>Serial No.:</strong> {formData.serialNo}</Typography>
                    <Typography component="div" variant="body2"><strong>Date of Request:</strong> {formatDate(formData.dateOfRequest)}</Typography>
                    <Typography component="div" variant="body2"><strong>Priority:</strong> {formData.priority}</Typography>
                  </Box>
                }
              />
            </ListItem>
            <Divider />
            <ListItem>
              <ListItemText 
                primary="Problem Description"
                secondary={
                  <Box component="div">
                    <Typography component="div" variant="body2" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                      {formData.specificProblem}
                    </Typography>
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
            disabled={isSubmitting}
            sx={{
              backgroundColor: '#1976d2',
              '&:hover': {
                backgroundColor: '#1565c0'
              }
            }}
          >
            {isSubmitting ? (
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

export default Troubleshooting; 