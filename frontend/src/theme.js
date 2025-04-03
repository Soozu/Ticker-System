import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2', // Updated to match the icon color
      contrastText: '#fff',
    },
    secondary: {
      main: '#303f9f', // Indigo for secondary actions
      contrastText: '#fff',
    },
    background: {
      default: '#f2e8d5', // Soft beige background matching the DepEd building
      paper: '#fcf8f0',   // Lighter beige for paper elements
    },
  },
  typography: {
    fontFamily: '"Lisu Bosa", "Roboto", "Arial", sans-serif',
    h4: {
      fontWeight: 700,
      fontSize: '1.75rem',
      fontFamily: '"Lisu Bosa", serif',
    },
    h6: {
      fontWeight: 500,
      fontFamily: '"Lisu Bosa", serif',
    },
    body1: {
      fontFamily: '"Lisu Bosa", serif',
    },
    body2: {
      fontFamily: '"Lisu Bosa", serif',
    },
    button: {
      fontFamily: '"Lisu Bosa", serif',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          textTransform: 'uppercase',
          fontWeight: 600,
          padding: '10px 16px',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 4,
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundImage: 'linear-gradient(to right, #f2e8d5, #f9f3e3)',
          backgroundAttachment: 'fixed',
        },
      },
    },
  },
});

export default theme; 