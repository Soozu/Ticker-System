import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const isAdmin = async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }
    next();
  } catch (error) {
    console.error('Error in admin middleware:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export default { isAdmin }; 