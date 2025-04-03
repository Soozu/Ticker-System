import React from 'react';
import { 
  createBrowserRouter, 
  RouterProvider,
  createRoutesFromElements,
  Route,
  Navigate
} from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './theme';
import { AuthProvider } from './context/AuthContext';
import AdminLayout from './layouts/AdminLayout';

// Components
import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import Troubleshooting from './pages/Troubleshooting.jsx';
import TicketCategories from './pages/TicketCategories.jsx';
import TrackTicket from './pages/TrackTicket.jsx';
import AccountManagement from './pages/AccountManagement.jsx';
import DocumentUpload from './pages/DocumentUpload.jsx';
import TechnicalAssistance from './pages/TechnicalAssistance.jsx';
import Dashboard from './pages/admin/Dashboard.jsx';
import ManageTickets from './pages/admin/ManageTickets.jsx';
import TicketDetails from './pages/admin/TicketDetails';
import Reports from './pages/admin/Reports';
import Settings from './pages/admin/Settings';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  if (!token || user.role !== 'ADMIN') {
    return <Navigate to="/login" replace />;
  }

  return children;
};

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route>
      {/* Public Routes */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/tickets" element={<TicketCategories />} />
      <Route path="/track-ticket" element={<TrackTicket />} />
      <Route path="/troubleshooting" element={<Troubleshooting />} />
      <Route path="/account" element={<AccountManagement />} />
      <Route path="/documents" element={<DocumentUpload />} />
      <Route path="/technical-assistance" element={<TechnicalAssistance />} />

      {/* Admin Routes */}
      <Route path="/admin" element={<ProtectedRoute allowedRoles={["ADMIN"]}><AdminLayout /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="tickets" element={<ManageTickets />} />
        <Route path="tickets/:id" element={<TicketDetails />} />
        <Route path="reports" element={<Reports />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Route>
  )
);

const App = () => {
  return (
    <AuthProvider>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <RouterProvider 
          router={router} 
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true
          }}
        />
      </ThemeProvider>
    </AuthProvider>
  );
};

export default App; 