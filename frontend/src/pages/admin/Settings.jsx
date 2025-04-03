import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Alert,
  Snackbar,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Card,
  CardContent,
  InputAdornment,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Save as SaveIcon,
  Email as EmailIcon,
} from '@mui/icons-material';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const Settings = () => {
  // Email settings
  const [emailSettings, setEmailSettings] = useState({
    smtpHost: 'smtp.gmail.com',
    smtpPort: 587,
    smtpUser: '',
    smtpPassword: '',
    senderName: 'IT Support',
    senderEmail: '',
    enableNotifications: true,
  });

  // Category settings
  const [categorySettings, setCategorySettings] = useState({
    ticketCategories: [
      { id: 1, name: 'TROUBLESHOOTING', active: true },
      { id: 2, name: 'ACCOUNT_MANAGEMENT', active: true },
      { id: 3, name: 'DOCUMENT_UPLOAD', active: true },
      { id: 4, name: 'TECHNICAL_ASSISTANCE', active: true }
    ]
  });

  // Admin utilities state
  const [adminSettings, setAdminSettings] = useState({
    searchFilters: {
      showResolvedTickets: true,
      showArchivedTickets: false,
      defaultDateRange: 30,
    },
    notifications: {
      desktopNotifications: true,
      soundAlerts: true,
      newTicketAlert: true,
      urgentTicketAlert: true,
    },
    autoArchive: {
      enabled: true,
      daysAfterResolution: 30,
    },
    quickFilters: {
      showPriority: true,
      showCategory: true,
      showStatus: true,
      showDateRange: true,
    }
  });

  // UI state
  const [loading, setLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [testingEmail, setTestingEmail] = useState(false);
  const [emailTestResult, setEmailTestResult] = useState(null);

  // Load settings from backend
  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await axios.get(`${API_BASE_URL}/admin/settings`, {
        headers: {
          Authorization: `Bearer ${token}`,
        }
      });

      if (response.data.success) {
        // Set the settings from the backend response
        setEmailSettings(response.data.data.email);
        setCategorySettings(response.data.data.categories);
        
        setError(null);
      } else {
        throw new Error(response.data.message);
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
      setError(err.message || 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const saveEmailSettings = async () => {
    try {
      // Validate email settings if notifications are enabled
      if (emailSettings.enableNotifications) {
        const requiredFields = ['smtpHost', 'smtpPort', 'smtpUser', 'smtpPassword', 'senderEmail'];
        const missingFields = requiredFields.filter(field => !emailSettings[field]);
        
        if (missingFields.length > 0) {
          setError(`Missing required email fields: ${missingFields.join(', ')}`);
          return;
        }
        
        if (emailSettings.smtpHost.includes('gmail') && !emailSettings.smtpUser.includes('@')) {
          setError('Gmail username must be a complete email address');
          return;
        }
      }

      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await axios.post(`${API_BASE_URL}/admin/settings/email`, { email: emailSettings }, {
        headers: {
          Authorization: `Bearer ${token}`,
        }
      });

      if (response.data.success) {
        setSaveSuccess(true);
        setError(null);
      } else {
        throw new Error(response.data.message);
      }
    } catch (err) {
      console.error('Error saving email settings:', err);
      setError(err.response?.data?.message || err.message || 'Failed to save email settings');
    } finally {
      setLoading(false);
    }
  };

  const saveCategorySettings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await axios.post(`${API_BASE_URL}/admin/settings/categories`, { categories: categorySettings }, {
        headers: {
          Authorization: `Bearer ${token}`,
        }
      });

      if (response.data.success) {
        localStorage.setItem('ticketCategories', JSON.stringify(categorySettings.ticketCategories));
        setSaveSuccess(true);
        setError(null);
      } else {
        throw new Error(response.data.message);
      }
    } catch (err) {
      console.error('Error saving category settings:', err);
      setError(err.response?.data?.message || err.message || 'Failed to save category settings');
    } finally {
      setLoading(false);
    }
  };

  const testEmailSettings = async () => {
    try {
      // Validate required fields before sending
      const requiredFields = ['smtpHost', 'smtpPort', 'smtpUser', 'smtpPassword', 'senderEmail'];
      const missingFields = requiredFields.filter(field => !emailSettings[field]);
      
      if (missingFields.length > 0) {
        setEmailTestResult({
          success: false,
          message: `Missing required fields: ${missingFields.join(', ')}`
        });
        return;
      }
      
      // Gmail validation
      if (emailSettings.smtpHost.includes('gmail') && !emailSettings.smtpUser.includes('@')) {
        setEmailTestResult({
          success: false,
          message: 'Gmail username must be a complete email address'
        });
        return;
      }
      
      setTestingEmail(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await axios.post(`${API_BASE_URL}/admin/settings/test-email`, emailSettings, {
        headers: {
          Authorization: `Bearer ${token}`,
        }
      });

      if (response.data.success) {
        setEmailTestResult({
          success: true,
          message: 'Test email sent successfully!'
        });
      } else {
        throw new Error(response.data.message);
      }
    } catch (err) {
      console.error('Error testing email settings:', err);
      setEmailTestResult({
        success: false,
        message: err.response?.data?.message || err.message || 'Failed to send test email'
      });
    } finally {
      setTestingEmail(false);
    }
  };

  const handleEmailChange = (e) => {
    const { name, value } = e.target;
    setEmailSettings(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEmailSwitchChange = (e) => {
    const { name, checked } = e.target;
    setEmailSettings(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  const handleCategoryToggle = (id) => {
    setCategorySettings(prev => {
      const updatedCategories = prev.ticketCategories.map(category => 
        category.id === id 
          ? { ...category, active: !category.active } 
          : category
      );
      return {
        ...prev,
        ticketCategories: updatedCategories
      };
    });
  };

  const handleSnackbarClose = () => {
    setSaveSuccess(false);
    setEmailTestResult(null);
  };

  const handleAdminSettingChange = (section, setting, value) => {
    setAdminSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [setting]: value
      }
    }));
  };

  const saveAdminSettings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await axios.post(`${API_BASE_URL}/admin/settings/admin`, { admin: adminSettings }, {
        headers: {
          Authorization: `Bearer ${token}`,
        }
      });

      if (response.data.success) {
        setSaveSuccess(true);
        setError(null);
      } else {
        throw new Error(response.data.message);
      }
    } catch (err) {
      console.error('Error saving admin settings:', err);
      setError(err.response?.data?.message || err.message || 'Failed to save admin settings');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !emailSettings) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ fontFamily: '"Lisu Bosa", serif' }}>System Settings</Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      <Grid container spacing={3}>
        {/* Admin Utilities */}
        <Grid item xs={12}>
          <Accordion defaultExpanded>
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              aria-controls="admin-utilities-content"
              id="admin-utilities-header"
            >
              <Typography variant="h6" sx={{ fontFamily: '"Lisu Bosa", serif' }}>Admin Utilities</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={3}>
                {/* Search and Filter Settings */}
                <Grid item xs={12} md={6}>
                  <Card sx={{ height: '100%' }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>Search & Filters</Typography>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={adminSettings.searchFilters.showResolvedTickets}
                            onChange={(e) => handleAdminSettingChange('searchFilters', 'showResolvedTickets', e.target.checked)}
                            color="primary"
                          />
                        }
                        label="Show Resolved Tickets in Search"
                      />
                      <FormControlLabel
                        control={
                          <Switch
                            checked={adminSettings.searchFilters.showArchivedTickets}
                            onChange={(e) => handleAdminSettingChange('searchFilters', 'showArchivedTickets', e.target.checked)}
                            color="primary"
                          />
                        }
                        label="Include Archived Tickets"
                      />
                      <TextField
                        fullWidth
                        label="Default Date Range (days)"
                        type="number"
                        value={adminSettings.searchFilters.defaultDateRange}
                        onChange={(e) => handleAdminSettingChange('searchFilters', 'defaultDateRange', e.target.value)}
                        margin="normal"
                        InputProps={{ inputProps: { min: 1, max: 365 } }}
                      />
                    </CardContent>
                  </Card>
                </Grid>

                {/* Notification Settings */}
                <Grid item xs={12} md={6}>
                  <Card sx={{ height: '100%' }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>Notifications</Typography>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={adminSettings.notifications.desktopNotifications}
                            onChange={(e) => handleAdminSettingChange('notifications', 'desktopNotifications', e.target.checked)}
                            color="primary"
                          />
                        }
                        label="Desktop Notifications"
                      />
                      <FormControlLabel
                        control={
                          <Switch
                            checked={adminSettings.notifications.soundAlerts}
                            onChange={(e) => handleAdminSettingChange('notifications', 'soundAlerts', e.target.checked)}
                            color="primary"
                          />
                        }
                        label="Sound Alerts"
                      />
                      <FormControlLabel
                        control={
                          <Switch
                            checked={adminSettings.notifications.newTicketAlert}
                            onChange={(e) => handleAdminSettingChange('notifications', 'newTicketAlert', e.target.checked)}
                            color="primary"
                          />
                        }
                        label="New Ticket Alerts"
                      />
                      <FormControlLabel
                        control={
                          <Switch
                            checked={adminSettings.notifications.urgentTicketAlert}
                            onChange={(e) => handleAdminSettingChange('notifications', 'urgentTicketAlert', e.target.checked)}
                            color="primary"
                          />
                        }
                        label="Urgent Ticket Alerts"
                      />
                    </CardContent>
                  </Card>
                </Grid>

                {/* Auto-Archive Settings */}
                <Grid item xs={12} md={6}>
                  <Card sx={{ height: '100%' }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>Auto-Archive</Typography>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={adminSettings.autoArchive.enabled}
                            onChange={(e) => handleAdminSettingChange('autoArchive', 'enabled', e.target.checked)}
                            color="primary"
                          />
                        }
                        label="Enable Auto-Archive"
                      />
                      <TextField
                        fullWidth
                        label="Days After Resolution"
                        type="number"
                        value={adminSettings.autoArchive.daysAfterResolution}
                        onChange={(e) => handleAdminSettingChange('autoArchive', 'daysAfterResolution', e.target.value)}
                        margin="normal"
                        disabled={!adminSettings.autoArchive.enabled}
                        InputProps={{ inputProps: { min: 1, max: 365 } }}
                      />
                    </CardContent>
                  </Card>
                </Grid>

                {/* Quick Filters */}
                <Grid item xs={12} md={6}>
                  <Card sx={{ height: '100%' }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>Quick Filters</Typography>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={adminSettings.quickFilters.showPriority}
                            onChange={(e) => handleAdminSettingChange('quickFilters', 'showPriority', e.target.checked)}
                            color="primary"
                          />
                        }
                        label="Priority Filter"
                      />
                      <FormControlLabel
                        control={
                          <Switch
                            checked={adminSettings.quickFilters.showCategory}
                            onChange={(e) => handleAdminSettingChange('quickFilters', 'showCategory', e.target.checked)}
                            color="primary"
                          />
                        }
                        label="Category Filter"
                      />
                      <FormControlLabel
                        control={
                          <Switch
                            checked={adminSettings.quickFilters.showStatus}
                            onChange={(e) => handleAdminSettingChange('quickFilters', 'showStatus', e.target.checked)}
                            color="primary"
                          />
                        }
                        label="Status Filter"
                      />
                      <FormControlLabel
                        control={
                          <Switch
                            checked={adminSettings.quickFilters.showDateRange}
                            onChange={(e) => handleAdminSettingChange('quickFilters', 'showDateRange', e.target.checked)}
                            color="primary"
                          />
                        }
                        label="Date Range Filter"
                      />
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </AccordionDetails>
            <Box sx={{ p: 2, borderTop: '1px solid rgba(0, 0, 0, 0.12)', display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              <Button
                variant="contained"
                color="primary"
                onClick={saveAdminSettings}
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
              >
                {loading ? 'Saving...' : 'Save Admin Settings'}
              </Button>
            </Box>
          </Accordion>
        </Grid>
        
        {/* Email Settings */}
        <Grid item xs={12}>
          <Accordion>
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              aria-controls="email-settings-content"
              id="email-settings-header"
            >
              <Typography variant="h6" sx={{ fontFamily: '"Lisu Bosa", serif' }}>Email Notifications</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={emailSettings.enableNotifications}
                        onChange={handleEmailSwitchChange}
                        name="enableNotifications"
                        color="primary"
                      />
                    }
                    label="Enable Email Notifications"
                  />
                </Grid>
                
                {emailSettings.enableNotifications && (
                  <>
                    <Grid item xs={12}>
                      <Alert severity="info" sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>Email Configuration Requirements:</Typography>
                        <Box component="ul" sx={{ mt: 1, pl: 2 }}>
                          <li>For Gmail accounts with 2-Factor Authentication (2FA):</li>
                          <Box component="ul" sx={{ pl: 2 }}>
                            <li>You MUST use an App Password (16 characters, no spaces)</li>
                            <li>Steps to get an App Password:</li>
                            <Box component="ol" sx={{ pl: 2 }}>
                              <li>Go to <a href="https://myaccount.google.com/security" target="_blank" rel="noreferrer">Google Account Security</a></li>
                              <li>Enable 2-Step Verification if not already enabled</li>
                              <li>Go to <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noreferrer">App Passwords</a></li>
                              <li>Select "Mail" and your device</li>
                              <li>Copy the generated 16-character password</li>
                              <li>Remove any spaces from the password</li>
                            </Box>
                          </Box>
                          <li>For Gmail accounts without 2FA:</li>
                          <Box component="ul" sx={{ pl: 2 }}>
                            <li>Enable "Less secure app access" in your <a href="https://myaccount.google.com/lesssecureapps" target="_blank" rel="noreferrer">Google Account Settings</a></li>
                            <li>Use your regular Gmail password</li>
                            <li>Note: This is not recommended for security reasons</li>
                          </Box>
                          <li>Default Gmail Settings:</li>
                          <Box component="ul" sx={{ pl: 2 }}>
                            <li>SMTP Host: smtp.gmail.com</li>
                            <li>SMTP Port: 587 (TLS) or 465 (SSL)</li>
                            <li>Username: Your full Gmail address</li>
                          </Box>
                        </Box>
                      </Alert>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        required
                        label="SMTP Host"
                        name="smtpHost"
                        value={emailSettings.smtpHost}
                        onChange={handleEmailChange}
                        margin="normal"
                        helperText={emailSettings.smtpHost.includes('gmail') ? "Using Gmail SMTP server" : ""}
                        error={!emailSettings.smtpHost}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        required
                        label="SMTP Port"
                        name="smtpPort"
                        type="number"
                        value={emailSettings.smtpPort}
                        onChange={handleEmailChange}
                        margin="normal"
                        helperText={emailSettings.smtpHost.includes('gmail') ? "For Gmail, use 587 (TLS) or 465 (SSL)" : ""}
                        error={!emailSettings.smtpPort || (emailSettings.smtpHost.includes('gmail') && ![587, 465].includes(Number(emailSettings.smtpPort)))}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        required
                        label="SMTP Username"
                        name="smtpUser"
                        value={emailSettings.smtpUser}
                        onChange={handleEmailChange}
                        margin="normal"
                        helperText={emailSettings.smtpHost.includes('gmail') ? "Must be your full Gmail email address" : ""}
                        error={!emailSettings.smtpUser || (emailSettings.smtpHost.includes('gmail') && !emailSettings.smtpUser.includes('@'))}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        required
                        label="SMTP Password"
                        name="smtpPassword"
                        type="password"
                        value={emailSettings.smtpPassword}
                        onChange={handleEmailChange}
                        margin="normal"
                        helperText={
                          emailSettings.smtpHost.includes('gmail') 
                            ? emailSettings.smtpPassword
                              ? emailSettings.smtpPassword.length === 16 && !/\s/.test(emailSettings.smtpPassword)
                                ? "✓ Valid App Password format"
                                : emailSettings.smtpPassword.includes(' ')
                                ? "❌ Remove all spaces from the App Password"
                                : emailSettings.smtpPassword.length !== 16
                                ? `❌ App Password must be exactly 16 characters (current: ${emailSettings.smtpPassword.length})`
                                : "❌ Invalid App Password format"
                              : "Enter your App Password (16 characters, no spaces)"
                            : ""
                        }
                        error={
                          emailSettings.smtpHost.includes('gmail') && 
                          (
                            !emailSettings.smtpPassword || 
                            emailSettings.smtpPassword.length !== 16 ||
                            /\s/.test(emailSettings.smtpPassword)
                          )
                        }
                      />
                      {emailSettings.smtpHost.includes('gmail') && emailSettings.smtpPassword && (
                        <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="caption" color="textSecondary">
                            Password Format:
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 2 }}>
                            <Typography variant="caption" color={emailSettings.smtpPassword.length === 16 ? "success.main" : "error.main"}>
                              {emailSettings.smtpPassword.length === 16 ? "✓" : "❌"} 16 characters
                            </Typography>
                            <Typography variant="caption" color={!/\s/.test(emailSettings.smtpPassword) ? "success.main" : "error.main"}>
                              {!/\s/.test(emailSettings.smtpPassword) ? "✓" : "❌"} No spaces
                            </Typography>
                          </Box>
                        </Box>
                      )}
                    </Grid>
                    <Grid item xs={12}>
                      <Alert severity="warning" sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>Security Notice:</Typography>
                        <Typography variant="body2">
                          For enhanced security, we strongly recommend:
                          <Box component="ul" sx={{ mt: 1, pl: 2 }}>
                            <li>Enabling 2-Factor Authentication on your Gmail account</li>
                            <li>Using App Passwords instead of your main account password</li>
                            <li>Creating a dedicated Gmail account for system notifications</li>
                          </Box>
                        </Typography>
                      </Alert>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Sender Name"
                        name="senderName"
                        value={emailSettings.senderName}
                        onChange={handleEmailChange}
                        margin="normal"
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        required
                        label="Sender Email"
                        name="senderEmail"
                        type="email"
                        value={emailSettings.senderEmail}
                        onChange={handleEmailChange}
                        margin="normal"
                        error={!emailSettings.senderEmail || !emailSettings.senderEmail.includes('@')}
                        helperText={!emailSettings.senderEmail.includes('@') ? "Must be a valid email address" : ""}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <EmailIcon />
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Button
                        variant="outlined"
                        color="primary"
                        onClick={testEmailSettings}
                        disabled={testingEmail}
                        sx={{
                          position: 'relative',
                          minWidth: '180px',
                          height: '42px',
                        }}
                      >
                        {testingEmail ? (
                          <>
                            <CircularProgress 
                              size={24} 
                              sx={{
                                color: 'primary.main',
                                mr: 1
                              }}
                            />
                            Sending Email...
                          </>
                        ) : (
                          <>
                            <EmailIcon sx={{ mr: 1 }} />
                            Send Test Email
                          </>
                        )}
                      </Button>
                      <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                        All fields marked with * are required before you can send a test email.
                      </Typography>
                    </Grid>
                  </>
                )}
              </Grid>
            </AccordionDetails>
            <Box sx={{ p: 2, borderTop: '1px solid rgba(0, 0, 0, 0.12)', display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              <Button
                variant="contained"
                color="primary"
                onClick={saveEmailSettings}
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
              >
                {loading ? 'Saving...' : 'Save Email Settings'}
              </Button>
            </Box>
          </Accordion>
        </Grid>
        
        {/* Category Settings */}
        <Grid item xs={12}>
          <Accordion>
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              aria-controls="category-settings-content"
              id="category-settings-header"
            >
              <Typography variant="h6" sx={{ fontFamily: '"Lisu Bosa", serif' }}>Ticket Categories</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body2" color="textSecondary" paragraph>
                Enable or disable ticket categories shown to users on the ticket submission page
              </Typography>
              
              <Grid container spacing={2}>
                {categorySettings.ticketCategories.map((category) => (
                  <Grid item xs={12} sm={6} md={4} key={category.id}>
                    <Card sx={{ 
                      height: '100%', 
                      opacity: category.active ? 1 : 0.6,
                      transition: 'opacity 0.3s',
                      border: category.active ? '1px solid #4caf50' : '1px solid #ddd'
                    }}>
                      <CardContent>
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Typography variant="h6">
                            {category.name.replace(/_/g, ' ')}
                          </Typography>
                          <FormControlLabel
                            control={
                              <Switch
                                checked={category.active}
                                onChange={() => handleCategoryToggle(category.id)}
                                name={`category-${category.id}`}
                                color="primary"
                              />
                            }
                            label={category.active ? "Enabled" : "Disabled"}
                          />
                        </Box>
                        <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                          {category.active 
                            ? "This category is enabled and visible to users on the ticket submission page" 
                            : "This category is disabled and hidden from users on the ticket submission page"}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </AccordionDetails>
            <Box sx={{ p: 2, borderTop: '1px solid rgba(0, 0, 0, 0.12)', display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              <Button
                variant="contained"
                color="primary"
                onClick={saveCategorySettings}
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
              >
                {loading ? 'Saving...' : 'Save Category Settings'}
              </Button>
            </Box>
          </Accordion>
        </Grid>
      </Grid>
      
      {/* Success Message */}
      <Snackbar
        open={saveSuccess}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleSnackbarClose} severity="success" variant="filled">
          Settings saved successfully!
        </Alert>
      </Snackbar>
      
      {/* Email Test Results */}
      <Snackbar
        open={emailTestResult !== null}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleSnackbarClose} 
          severity={emailTestResult?.success ? "success" : "error"}
          variant="filled"
        >
          {emailTestResult?.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Settings; 