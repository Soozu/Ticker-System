import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Rate limiting settings
const RATE_LIMITS = {
  SUBMISSION: {
    MAX_ATTEMPTS: 3,           // Maximum attempts per time window
    WINDOW: 15 * 60 * 1000,   // 15 minutes window
    COOLDOWN: 10 * 60 * 1000  // 10 minutes cooldown after max attempts
  }
};

// Store for tracking submission attempts
const submissionTracker = new Map();

// Helper function to clean up expired entries
const cleanupExpiredEntries = () => {
  const now = Date.now();
  for (const [key, data] of submissionTracker.entries()) {
    if (now - data.lastAttempt > RATE_LIMITS.SUBMISSION.COOLDOWN) {
      submissionTracker.delete(key);
    }
  }
};

// Helper function to get submission key
const getSubmissionKey = (email, ip) => `${email}:${ip}`;

// Helper function to check if user is in cooldown
const isInCooldown = (data) => {
  const now = Date.now();
  return data.blocked && (now - data.blockedAt < RATE_LIMITS.SUBMISSION.COOLDOWN);
};

// Helper function to check if window should be reset
const shouldResetWindow = (data) => {
  const now = Date.now();
  return now - data.windowStart > RATE_LIMITS.SUBMISSION.WINDOW;
};

// Check if a user can submit a ticket
export const canSubmitTicket = (email, ip) => {
  cleanupExpiredEntries();
  
  const key = getSubmissionKey(email, ip);
  const now = Date.now();
  
  let data = submissionTracker.get(key);
  
  // If no existing data, create new entry
  if (!data) {
    data = {
      attempts: 0,
      windowStart: now,
      lastAttempt: now,
      blocked: false,
      blockedAt: null
    };
    submissionTracker.set(key, data);
    return true;
  }
  
  // Check if user is blocked
  if (isInCooldown(data)) {
    const remainingTime = Math.ceil((RATE_LIMITS.SUBMISSION.COOLDOWN - (now - data.blockedAt)) / 60000);
    throw new Error(`Too many attempts. Please try again in ${remainingTime} minutes.`);
  }
  
  // Reset window if enough time has passed
  if (shouldResetWindow(data)) {
    data.attempts = 0;
    data.windowStart = now;
  }
  
  // Check if user has exceeded max attempts
  if (data.attempts >= RATE_LIMITS.SUBMISSION.MAX_ATTEMPTS) {
    data.blocked = true;
    data.blockedAt = now;
    submissionTracker.set(key, data);
    throw new Error('Too many attempts. Please try again in 30 minutes.');
  }
  
  return true;
};

// Record a successful submission
export const recordSubmission = (email, ip) => {
  const key = getSubmissionKey(email, ip);
  const now = Date.now();
  
  let data = submissionTracker.get(key);
  if (!data) {
    data = {
      attempts: 0,
      windowStart: now,
      lastAttempt: now,
      blocked: false,
      blockedAt: null
    };
  }
  
  // Reset window if enough time has passed
  if (shouldResetWindow(data)) {
    data.attempts = 0;
    data.windowStart = now;
  }
  
  data.attempts++;
  data.lastAttempt = now;
  
  submissionTracker.set(key, data);
};

// Get current rate limit status
export const getRateLimitStatus = (email, ip) => {
  const key = getSubmissionKey(email, ip);
  const data = submissionTracker.get(key);
  
  if (!data) {
    return {
      remainingAttempts: RATE_LIMITS.SUBMISSION.MAX_ATTEMPTS,
      isBlocked: false,
      cooldownRemaining: 0
    };
  }
  
  const now = Date.now();
  const cooldownRemaining = data.blocked ? 
    Math.max(0, RATE_LIMITS.SUBMISSION.COOLDOWN - (now - data.blockedAt)) : 0;
  
  return {
    remainingAttempts: Math.max(0, RATE_LIMITS.SUBMISSION.MAX_ATTEMPTS - data.attempts),
    isBlocked: isInCooldown(data),
    cooldownRemaining
  };
}; 