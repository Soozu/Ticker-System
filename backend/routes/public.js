import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// Public endpoint to get active categories
router.get('/settings/categories', async (req, res) => {
  try {
    // Default categories if none have been set by admin
    let categories = [
      { id: 1, name: 'TROUBLESHOOTING', active: true },
      { id: 2, name: 'ACCOUNT_MANAGEMENT', active: true },
      { id: 3, name: 'DOCUMENT_UPLOAD', active: true },
      { id: 4, name: 'TECHNICAL_ASSISTANCE', active: true }
    ];
    
    // Use categories from global app settings if available
    if (global.appSettings && global.appSettings.categories) {
      categories = global.appSettings.categories.ticketCategories;
    }
    
    // In a real app with database persistence, this would be replaced with:
    // const settings = await prisma.systemSettings.findFirst({ where: { key: 'categories' } });
    // const categories = settings ? JSON.parse(settings.value).ticketCategories : defaultCategories;
    
    res.json({
      success: true,
      categories: categories
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve categories'
    });
  }
});

export default router; 