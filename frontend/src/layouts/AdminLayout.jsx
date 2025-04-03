import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Menu,
  MenuItem,
  Tooltip,
  Badge,
  Popover,
  Card,
  CardContent,
  Divider,
  Stack,
  Chip,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  ConfirmationNumber as TicketIcon,
  Assessment as ReportIcon,
  Settings as SettingsIcon,
  ChevronLeft as ChevronLeftIcon,
  Logout as LogoutIcon,
  Notifications as NotificationsIcon,
  ClearAll as ClearAllIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const drawerWidth = 240;

const menuItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/admin/dashboard' },
  { text: 'Tickets', icon: <TicketIcon />, path: '/admin/tickets' },
  { text: 'Reports', icon: <ReportIcon />, path: '/admin/reports' },
  { text: 'Settings', icon: <SettingsIcon />, path: '/admin/settings' },
];

const AdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(true);
  const [anchorEl, setAnchorEl] = useState(null);
  const [notificationAnchorEl, setNotificationAnchorEl] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/admin/notifications`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (response.data.success) {
        const newNotifications = response.data.data;
        // Only update if there are actual changes to avoid unnecessary re-renders
        const newUnreadCount = newNotifications.filter(notif => !notif.read).length;
        if (newUnreadCount !== unreadCount || JSON.stringify(newNotifications) !== JSON.stringify(notifications)) {
          setNotifications(newNotifications);
          setUnreadCount(newUnreadCount);
        }
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  }, [notifications, unreadCount]);

  // Poll for notifications every 5 seconds
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 5000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Update document title when unread count changes
  useEffect(() => {
    if (unreadCount > 0) {
      document.title = `(${unreadCount}) ICT Help Desk Admin`;
    } else {
      document.title = 'ICT Help Desk Admin';
    }
  }, [unreadCount]);

  const handleDrawerToggle = () => {
    setOpen(!open);
  };

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationClick = (event) => {
    setNotificationAnchorEl(event.currentTarget);
  };

  const handleNotificationClose = () => {
    setNotificationAnchorEl(null);
  };

  const handleNotificationItemClick = async (notification) => {
    try {
      // Mark notification as read
      const token = localStorage.getItem('token');
      await axios.put(`${API_BASE_URL}/admin/notifications/${notification.id}/read`, {}, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Update local state
      setNotifications(prevNotifications =>
        prevNotifications.map(notif =>
          notif.id === notification.id ? { ...notif, read: true } : notif
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));

      // Navigate to ticket details
      handleNotificationClose();
      navigate(`/admin/tickets/${notification.ticketId}`);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleClearAllNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_BASE_URL}/admin/notifications/clear-all`, {}, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (response.data.success) {
        // Clear all notifications from state
        setNotifications([]);
        setUnreadCount(0);
        handleNotificationClose();
      }
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'HIGH':
        return 'error';
      case 'MEDIUM':
        return 'warning';
      case 'LOW':
        return 'info';
      default:
        return 'default';
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'TROUBLESHOOTING':
        return '🔧';
      case 'ACCOUNT_MANAGEMENT':
        return '👤';
      case 'DOCUMENT_UPLOAD':
        return '📄';
      case 'TECHNICAL_ASSISTANCE':
        return '💻';
      default:
        return '📝';
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'TROUBLESHOOTING':
        return '#FF9800'; // Orange
      case 'ACCOUNT_MANAGEMENT':
        return '#2196F3'; // Blue
      case 'DOCUMENT_UPLOAD':
        return '#4CAF50'; // Green
      case 'TECHNICAL_ASSISTANCE':
        return '#9C27B0'; // Purple
      default:
        return '#607D8B'; // Grey
    }
  };

  const handleLogout = () => {
    handleProfileMenuClose();
    logout();
    navigate('/login');
  };

  return (
    <Box sx={{ display: 'flex' }}>
      {/* App Bar */}
      <AppBar
        position="fixed"
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          backgroundColor: 'white',
          color: 'primary.main',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="toggle drawer"
            onClick={handleDrawerToggle}
            edge="start"
            sx={{ mr: 2 }}
          >
            {open ? <ChevronLeftIcon /> : <MenuIcon />}
          </IconButton>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6" noWrap component="div" color="primary">
              ICT Help Desk Admin
            </Typography>
          </Box>

          {/* Notification Icon */}
          <Tooltip title="Notifications">
            <IconButton
              color="inherit"
              onClick={handleNotificationClick}
              sx={{ mr: 2 }}
            >
              <Badge badgeContent={unreadCount} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>
          </Tooltip>

          <Tooltip title="Account settings">
            <IconButton
              onClick={handleProfileMenuOpen}
              size="small"
              sx={{ ml: 2 }}
            >
              <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                {user?.name?.charAt(0) || 'A'}
              </Avatar>
            </IconButton>
          </Tooltip>

          {/* Notifications Popover */}
          <Popover
            open={Boolean(notificationAnchorEl)}
            anchorEl={notificationAnchorEl}
            onClose={handleNotificationClose}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            PaperProps={{
              sx: {
                width: '400px',
                maxHeight: '500px',
                overflowY: 'auto',
              }
            }}
          >
            <Card sx={{ boxShadow: 'none' }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">
                    Notifications
                  </Typography>
                  {notifications.length > 0 && (
                    <IconButton 
                      size="small" 
                      onClick={handleClearAllNotifications}
                      sx={{ color: 'text.secondary' }}
                    >
                      <ClearAllIcon />
                    </IconButton>
                  )}
                </Box>
                <Divider sx={{ mb: 2 }} />
                {notifications.length > 0 ? (
                  <Stack spacing={2}>
                    {notifications.map((notification) => (
                      <Box
                        key={notification.id}
                        sx={{
                          p: 1.5,
                          bgcolor: notification.read ? 'transparent' : 'action.hover',
                          borderRadius: 1,
                          cursor: 'pointer',
                          '&:hover': {
                            bgcolor: 'action.selected',
                          },
                        }}
                        onClick={() => handleNotificationItemClick(notification)}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <Typography 
                            variant="subtitle2" 
                            sx={{ 
                              flexGrow: 1,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1
                            }}
                          >
                            <span style={{ color: getCategoryColor(notification.ticket?.category) }}>
                              {getCategoryIcon(notification.ticket?.category)}
                            </span>
                            {notification.title}
                          </Typography>
                          <Chip
                            size="small"
                            label={notification.priority}
                            color={getPriorityColor(notification.priority)}
                          />
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          {notification.message}
                        </Typography>
                        {notification.ticket?.schoolName && (
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                            School: {notification.ticket.schoolName}
                          </Typography>
                        )}
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                          {new Date(notification.createdAt).toLocaleString()}
                        </Typography>
                      </Box>
                    ))}
                  </Stack>
                ) : (
                  <Typography variant="body2" color="text.secondary" align="center">
                    No new notifications
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Popover>

          {/* Profile Menu */}
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleProfileMenuClose}
            onClick={handleProfileMenuClose}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <LogoutIcon fontSize="small" />
              </ListItemIcon>
              Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* Drawer */}
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            backgroundColor: '#f8fafc',
            borderRight: '1px solid rgba(0, 0, 0, 0.08)',
            transition: 'width 0.3s ease',
            ...(open ? {
              width: drawerWidth,
              overflowX: 'hidden',
            } : {
              width: theme => theme.spacing(7),
              overflowX: 'hidden',
            }),
          },
        }}
        open={open}
      >
        <Toolbar />
        <Box sx={{ overflow: 'hidden', pt: 2 }}>
          <List>
            {menuItems.map((item) => (
              <ListItem key={item.text} disablePadding sx={{ display: 'block' }}>
                <ListItemButton
                  sx={{
                    minHeight: 48,
                    justifyContent: open ? 'initial' : 'center',
                    px: 2.5,
                    borderRadius: '0 24px 24px 0',
                    mr: 2,
                    ...(location.pathname === item.path && {
                      backgroundColor: 'primary.light',
                      '&:hover': {
                        backgroundColor: 'primary.light',
                      },
                    }),
                  }}
                  onClick={() => navigate(item.path)}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 0,
                      mr: open ? 3 : 'auto',
                      justifyContent: 'center',
                      color: location.pathname === item.path ? 'primary.main' : 'inherit',
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.text}
                    sx={{
                      opacity: open ? 1 : 0,
                      color: location.pathname === item.path ? 'primary.main' : 'inherit',
                    }}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          backgroundColor: '#f8fafc',
          minHeight: '100vh',
        }}
      >
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
};

export default AdminLayout; 