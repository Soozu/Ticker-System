import React, { useState } from 'react';
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
  useTheme,
} from '@mui/material';
import axios from 'axios';
import BackButton from '../components/BackButton';

const Troubleshooting = () => {
  const theme = useTheme();
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
    priority: 'MEDIUM',
  });
  const [message, setMessage] = useState(null);
  const [ticketInfo, setTicketInfo] = useState(null);

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
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const finalModelOfEquipment = formData.modelOfEquipment === 'Other' ? formData.customModel : formData.modelOfEquipment;
      
      const response = await axios.post('http://localhost:5000/api/tickets/troubleshooting', {
        category: 'TROUBLESHOOTING',
        name: formData.name,
        email: formData.email,
        department: formData.department,
        locationType: formData.locationType,
        school: formData.locationType === 'SCHOOL' ? formData.schoolName : '',
        dateOfRequest: formData.dateOfRequest,
        typeOfEquipment: formData.typeOfEquipment === 'Others' ? formData.customEquipmentType : formData.typeOfEquipment,
        modelOfEquipment: finalModelOfEquipment,
        serialNo: formData.serialNo,
        specificProblem: formData.specificProblem,
        priority: formData.priority
      });

      const { ticketId, trackingId } = response.data;
      setTicketInfo({ ticketId, trackingId });

      setMessage({
        type: 'success',
        text: `Your support request has been submitted successfully. Your Ticket ID is #${ticketId} and Tracking ID is ${trackingId}. Please save these for future reference. An email has been sent to ${formData.email} with your ticket details.`,
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
      });
    } catch (error) {
      console.error('Error submitting ticket:', error);
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to submit ticket. Please try again.',
      });
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4, position: 'relative' }}>
      <BackButton />
      <Box sx={{ 
        textAlign: 'center', 
        mb: 4,
        '& h4': {
          color: theme.palette.primary.main,
          fontWeight: 600,
          position: 'relative',
          display: 'inline-block',
          '&:after': {
            content: '""',
            position: 'absolute',
            bottom: -8,
            left: '50%',
            transform: 'translateX(-50%)',
            width: '60%',
            height: 4,
            backgroundColor: theme.palette.primary.main,
            borderRadius: 2,
          }
        }
      }}>
        <Typography variant="h4" gutterBottom>
          Troubleshooting Form
      </Typography>
      </Box>

      <Paper elevation={3} sx={{ 
        p: { xs: 2, sm: 3, md: 4 },
        borderRadius: 2,
        bgcolor: '#ffffff',
        '& .MuiTextField-root, & .MuiFormControl-root': {
          '& .MuiOutlinedInput-root': {
            '&:hover fieldset': {
              borderColor: theme.palette.primary.main,
            },
            '&.Mui-focused fieldset': {
              borderColor: theme.palette.primary.main,
            }
          },
          '& .MuiInputLabel-root.Mui-focused': {
            color: theme.palette.primary.main,
          }
        }
      }}>
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
            {ticketInfo && (
              <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1, border: '1px solid' }}>
                <Typography variant="body2" gutterBottom>
                  <strong>Ticket ID:</strong> #{ticketInfo.ticketId}
                </Typography>
                <Typography variant="body2">
                  <strong>Tracking ID:</strong> {ticketInfo.trackingId}
                </Typography>
                <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
                  Please save these details for tracking your ticket status.
                </Typography>
              </Box>
            )}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Box sx={{ 
            display: 'grid', 
            gap: 3,
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
            '& .full-width': {
              gridColumn: { xs: '1', sm: '1 / -1' }
            }
          }}>
            {/* Basic Information */}
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
              sx={{ '& .MuiInputBase-input': { fontSize: '0.9rem' } }}
            />

            {/* Location Selection */}
            <FormControl required className="full-width">
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
                        maxHeight: 300,
                        width: '60%'
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

            {/* School Name Selection */}
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
                        maxHeight: 300,
                        width: '60%'
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
              sx={{ '& .MuiInputBase-input': { fontSize: '0.9rem' } }}
            />

            <FormControl required>
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
                sx={{ '& .MuiInputBase-input': { fontSize: '0.9rem' } }}
              />
            )}

            <FormControl required sx={{ gridColumn: formData.typeOfEquipment === 'Others' ? '1 / -1' : 'auto' }}>
              {formData.typeOfEquipment === 'Others' ? (
            <TextField
              required
                  name="modelOfEquipment"
                  label="Specify Equipment Model"
                  value={formData.modelOfEquipment || ''}
                  onChange={handleChange}
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
                sx={{ '& .MuiInputBase-input': { fontSize: '0.9rem' } }}
              />
            )}

            <TextField
              required
              label="Serial No."
              name="serialNo"
              value={formData.serialNo}
              onChange={handleChange}
              sx={{ '& .MuiInputBase-input': { fontSize: '0.9rem' } }}
            />

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

            <TextField
              required
              multiline
              rows={4}
              label="Specific Problem"
              name="specificProblem"
              value={formData.specificProblem}
              onChange={handleChange}
              className="full-width"
              sx={{ 
                '& .MuiInputBase-input': { 
                  fontSize: '0.9rem',
                  lineHeight: '1.5'
                } 
              }}
            />

            <Button
              type="submit"
              variant="contained"
              size="large"
              className="full-width"
              sx={{
                mt: 2,
                py: 1.5,
                fontSize: '1rem',
                fontWeight: 600,
                textTransform: 'none',
                borderRadius: 1.5,
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                '&:hover': {
                  boxShadow: '0 6px 16px rgba(0,0,0,0.2)',
                }
              }}
            >
              Submit Support Request
            </Button>
          </Box>
        </form>
      </Paper>
    </Container>
  );
};

export default Troubleshooting; 