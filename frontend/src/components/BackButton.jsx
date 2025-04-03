import React from 'react';
import { useNavigate } from 'react-router-dom';
import { IconButton } from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';

const BackButton = ({ onClick, sx }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      navigate(-1);
    }
  };

  return (
    <IconButton
      onClick={handleClick}
      sx={{
        position: 'absolute',
        top: 24,
        left: 24,
        bgcolor: 'white',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        '&:hover': {
          bgcolor: '#f5f5f5',
          transform: 'translateX(-2px)',
          transition: 'all 0.2s'
        },
        ...sx
      }}
    >
      <ArrowBackIcon />
    </IconButton>
  );
};

export default BackButton; 