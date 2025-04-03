import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient()
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const router = express.Router();

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, department, role } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        department,
        role: role || 'USER', // Default role if not specified
      },
    });

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    res.status(201).json(userWithoutPassword);
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Response helper
const sendResponse = (res, status, success, message, data = null) => {
  const response = {
    success,
    message,
    ...(data && { data })
  };
  return res.status(status).json(response);
};

// Validation schemas
const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required')
});

// Login route
router.post('/login', async (req, res) => {
  try {
    // Validate request body
    const validatedData = loginSchema.parse(req.body);

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: validatedData.email },
      select: {
        id: true,
        email: true,
        password: true,
        name: true,
        role: true,
        department: true
      }
    });

    if (!user) {
      return sendResponse(res, 401, false, 'Invalid email or password');
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(validatedData.password, user.password);
    if (!isValidPassword) {
      return sendResponse(res, 401, false, 'Invalid email or password');
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Remove password from user object
    const { password, ...userWithoutPassword } = user;

    return sendResponse(res, 200, true, 'Login successful', {
      user: userWithoutPassword,
      token
    });
  } catch (error) {
    console.error('Login error:', error);

    if (error instanceof z.ZodError) {
      return sendResponse(res, 400, false, 'Validation error', {
        errors: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      });
    }

    return sendResponse(res, 500, false, 'Internal server error');
  }
});

// Verify token route
router.post('/verify-token', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return sendResponse(res, 401, false, 'No token provided');
    }

    const verified = jwt.verify(token, process.env.JWT_SECRET);
    
    const user = await prisma.user.findUnique({
      where: { id: verified.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        department: true
      }
    });

    if (!user) {
      return sendResponse(res, 401, false, 'User not found');
    }

    return sendResponse(res, 200, true, 'Token is valid', { user });
  } catch (error) {
    console.error('Token verification error:', error);
    return sendResponse(res, 401, false, 'Invalid token');
  }
});

// Logout route (optional, since JWT is stateless)
router.post('/logout', (req, res) => {
  return sendResponse(res, 200, true, 'Logged out successfully');
});

export default router; 