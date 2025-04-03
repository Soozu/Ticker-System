import React, { useState, useEffect, useCallback } from 'react';
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
import { useNavigate } from 'react-router-dom';

const DocumentUpload = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    priority: '',
    locationType: '',
    schoolLevel: '',
    schoolName: '',
    department: '',
    subject: '',
    message: '',
    file: null,
    documentType: '',
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

  // Add document types array
  const documentTypes = [
    'MEMORANDUM',
    'LETTER',
    'REPORT',
    'FORM',
    'CERTIFICATE',
    'OFFICIAL_DOCUMENT',
    'OTHER'
  ];

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
      ...(name === 'locationType' && { schoolLevel: '', schoolName: '', department: '' }),
      ...(name === 'schoolLevel' && { schoolName: '' })
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

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (2MB = 2 * 1024 * 1024 bytes)
      if (file.size > 2 * 1024 * 1024) {
        setMessage({
          type: 'error',
          text: 'File size exceeds the 2MB limit. Please choose a smaller file.'
        });
        e.target.value = ''; // Reset file input
        return;
      }

      // Check file type
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];
      if (!allowedTypes.includes(file.type)) {
        setMessage({
          type: 'error',
          text: 'Invalid file type. Only PDF, DOC, and DOCX files are allowed.'
        });
        e.target.value = ''; // Reset file input
        return;
      }

      setFormData(prev => ({
        ...prev,
        file: file
      }));
      setMessage(null); // Clear any error messages
    }
  };

  // Add helper functions for confirmation dialog
  const getLocationDisplay = () => {
    if (formData.locationType === 'SDO') {
      return `SDO - Imus City - ${formData.department}`;
    } else if (formData.locationType === 'SCHOOL') {
      return `${formData.schoolLevel} - ${formData.schoolName}`;
    }
    return '';
  };

  const getDocumentTypeDisplay = () => {
    return formData.documentType.replace(/_/g, ' ');
  };

  // Update handleSubmit to show confirmation first
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    setCaptchaError(null);

    // Validate email before showing confirmation
    if (!validateEmail(formData.email)) {
      setMessage({ type: 'error', text: 'Please enter a valid email address' });
      return;
    }

    // Validate CAPTCHA before showing confirmation
    if (!formData.captchaCode) {
      setMessage({ type: 'error', text: 'Please enter the verification code' });
      return;
    }

    // Show confirmation dialog instead of submitting directly
    setShowConfirmation(true);
  };

  // Add new function to handle actual submission after confirmation
  const handleConfirmSubmit = async () => {
    setIsSubmitting(true);
    setShowConfirmation(false);

    try {
      // Validate required fields including document type
      if (!formData.name || !formData.email || !formData.locationType || !formData.subject || !formData.message || !formData.documentType) {
        throw new Error('Please fill in all required fields');
      }

      // Validate school selection if school location is selected
      if (formData.locationType === 'SCHOOL' && !formData.schoolName) {
        throw new Error('Please select a school');
      }

      // Validate department selection if SDO location is selected
      if (formData.locationType === 'SDO' && !formData.department) {
        throw new Error('Please select a department');
      }

      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('email', formData.email);
      formDataToSend.append('priority', formData.priority || 'MEDIUM');
      formDataToSend.append('category', 'DOCUMENT_UPLOAD');
      formDataToSend.append('status', 'PENDING');
      formDataToSend.append('documentType', formData.documentType);
      formDataToSend.append('documentSubject', formData.subject);
      formDataToSend.append('documentMessage', formData.message);
      formDataToSend.append('locationType', formData.locationType);
      formDataToSend.append('location', formData.locationType === 'SDO' ? 'SDO_IMUS_CITY' : 'SCHOOL_IMUS_CITY');
      formDataToSend.append('department', formData.locationType === 'SDO' ? formData.department : null);
      formDataToSend.append('schoolLevel', formData.locationType === 'SCHOOL' ? formData.schoolLevel : null);
      formDataToSend.append('schoolName', formData.locationType === 'SCHOOL' ? formData.schoolName : null);
      
      // Structure the category specific details
      const categorySpecificDetails = {
        type: 'Document Processing',
        details: {
          documentType: formData.documentType,
          subject: formData.subject,
          message: formData.message,
          locationType: formData.locationType,
          location: formData.locationType === 'SDO' ? 'SDO_IMUS_CITY' : 'SCHOOL_IMUS_CITY',
          department: formData.locationType === 'SDO' ? formData.department : null,
          schoolLevel: formData.locationType === 'SCHOOL' ? formData.schoolLevel : null,
          schoolName: formData.locationType === 'SCHOOL' ? formData.schoolName : null
        }
      };
      formDataToSend.append('categorySpecificDetails', JSON.stringify(categorySpecificDetails));
      
      formDataToSend.append('captchaId', captcha.id);
      formDataToSend.append('captchaCode', formData.captchaCode);
      if (formData.file) {
        formDataToSend.append('file', formData.file);
      }

      const response = await api.post('/tickets/document-upload', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setMessage({
        type: 'success',
        text: (
          <div>
            <Typography variant="body1" gutterBottom>
              Document upload request submitted successfully!
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Ticket ID: #{response.data.ticketId}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Tracking ID: {response.data.trackingId}
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
        priority: 'MEDIUM',
        locationType: '',
        schoolLevel: '',
        schoolName: '',
        department: '',
        subject: '',
        message: '',
        file: null,
        documentType: '',
        captchaCode: ''
      });
      
      // Reset file input
      const fileInput = document.getElementById('file-upload');
      if (fileInput) {
        fileInput.value = '';
      }

      generateCaptcha();
    } catch (error) {
      console.error('Error submitting request:', error);
      const errorMessage = error.response?.data?.message || 'Unable to submit request. Please try again.';
      
      setMessage({
        type: 'error',
        text: errorMessage
      });

      generateCaptcha();
    } finally {
      setIsSubmitting(false);
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
        Uploading of Publication
        </Typography>
        <Typography variant="subtitle1" sx={{ color: '#546e7a', mt: 2, fontFamily: '"Lisu Bosa", serif' }}>
          Please fill out the form below to submit your document upload request
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

            <FormControl required>
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

            <FormControl required>
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

            {formData.locationType === 'SDO' && (
              <FormControl required className="full-width">
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
                  {departments.map((dept) => (
                    <MenuItem key={dept} value={dept}>
                      {dept}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            {formData.locationType === 'SCHOOL' && (
              <FormControl required>
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

            {formData.schoolLevel && (
              <FormControl required className="full-width">
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

            {/* Document Details Section */}
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
                Document Details
              </Typography>
            </Box>

            <FormControl required className="full-width">
              <InputLabel>Document Type</InputLabel>
              <Select
                name="documentType"
                value={formData.documentType}
                onChange={handleChange}
                label="Document Type"
                sx={{ fontSize: '0.9rem' }}
              >
                {documentTypes.map((type) => (
                  <MenuItem key={type} value={type}>
                    {type.replace(/_/g, ' ')}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              required
              label="Subject"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              className="full-width"
              sx={{ '& .MuiInputBase-input': { fontSize: '0.9rem' } }}
            />

            <TextField
              required
              multiline
              rows={4}
              label="Message"
              name="message"
              value={formData.message}
              onChange={handleChange}
              className="full-width"
              sx={{ 
                '& .MuiInputBase-input': { 
                  fontSize: '0.9rem',
                  lineHeight: '1.5'
                } 
              }}
            />

            <FormControl className="full-width">
              <input
                accept="application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                style={{ display: 'none' }}
                id="file-upload"
                type="file"
                onChange={handleFileChange}
              />
              <label htmlFor="file-upload">
                <Button
                  variant="outlined"
                  component="span"
                  fullWidth
                  sx={{
                    py: 1.8,
                    textTransform: 'none',
                    borderRadius: 2,
                    borderColor: '#1976d2',
                    color: '#1976d2',
                    fontWeight: 600,
                    transition: 'all 0.2s ease-in-out',
                    backgroundColor: '#f8fafc',
                    '&:hover': {
                      backgroundColor: '#f0f7ff',
                      borderColor: '#1565c0',
                      transform: 'translateY(-1px)',
                      boxShadow: '0 4px 12px rgba(25, 118, 210, 0.1)',
                    }
                  }}
                >
                  Upload Document (PDF, DOC, DOCX)
                </Button>
              </label>
              {formData.file && (
                <Typography variant="body2" sx={{ 
                  mt: 2, 
                  color: '#1976d2',
                  backgroundColor: '#f0f7ff',
                  p: 2,
                  borderRadius: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px dashed #1976d2'
                }}>
                  Selected file: {formData.file.name}
                </Typography>
              )}
            </FormControl>

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
                  onChange={(e) => setFormData(prev => ({ ...prev, captchaCode: e.target.value }))}
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
              Review & Submit Request
            </Button>
          </Box>
        </form>
      </Paper>

      {/* Add confirmation dialog */}
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
            Confirm Document Upload Details
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <List>
            <ListItem>
              <ListItemText 
                primary="Personal Information"
                secondary={
                  <>
                    <Typography variant="body2"><strong>Name:</strong> {formData.name}</Typography>
                    <Typography variant="body2"><strong>Email:</strong> {formData.email}</Typography>
                  </>
                }
              />
            </ListItem>
            <Divider />
            <ListItem>
              <ListItemText 
                primary="Request Details"
                secondary={
                  <>
                    <Typography variant="body2"><strong>Priority:</strong> {formData.priority}</Typography>
                    <Typography variant="body2"><strong>Location:</strong> {getLocationDisplay()}</Typography>
                    <Typography variant="body2"><strong>Document Type:</strong> {getDocumentTypeDisplay()}</Typography>
                  </>
                }
              />
            </ListItem>
            <Divider />
            <ListItem>
              <ListItemText 
                primary="Document Details"
                secondary={
                  <>
                    <Typography variant="body2"><strong>Subject:</strong> {formData.subject}</Typography>
                    <Typography variant="body2"><strong>Message:</strong> {formData.message}</Typography>
                    {formData.file && (
                      <Typography variant="body2"><strong>File:</strong> {formData.file.name}</Typography>
                    )}
                  </>
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

export default DocumentUpload; 