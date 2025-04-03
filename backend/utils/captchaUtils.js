import crypto from 'crypto';

// Store CAPTCHA codes with timestamps for validation
const captchaStore = new Map();

// Store IP-based rate limiting data
const ipLimitStore = new Map();

// Constants for rate limiting
const MAX_ATTEMPTS_PER_IP = 3; // Maximum failed attempts before timeout
const BLOCK_DURATION = 10 * 60 * 1000; // 10 minutes block
const ATTEMPT_RESET_TIME = 30 * 60 * 1000; // Reset attempts after 30 minutes

// Clean up expired CAPTCHAs and IP records
const cleanup = () => {
  const now = Date.now();
  
  // Clean up expired CAPTCHAs (older than 15 minutes)
  for (const [key, value] of captchaStore.entries()) {
    if (now - value.timestamp > 15 * 60 * 1000) {
      captchaStore.delete(key);
    }
  }
  
  // Clean up expired IP blocks
  for (const [ip, data] of ipLimitStore.entries()) {
    if (now - data.blockedAt > BLOCK_DURATION) {
      ipLimitStore.delete(ip);
    }
  }
};

// Check if an IP is allowed to generate a new CAPTCHA
const canGenerateNewCaptcha = (ip) => {
  return true; // Always allow CAPTCHA generation
};

// Generate a random CAPTCHA code
export const generateCaptcha = (ip) => {
  cleanup();
  
  // Generate a random 6-digit number
  const captchaCode = Math.floor(100000 + Math.random() * 900000).toString();
  const captchaId = crypto.randomBytes(32).toString('hex');
  
  // Store the CAPTCHA with timestamp and IP
  captchaStore.set(captchaId, {
    code: captchaCode,
    timestamp: Date.now(),
    ip: ip
  });
  
  return {
    captchaId,
    captchaCode
  };
};

// Validate a CAPTCHA code
export const validateCaptcha = async (captchaId, userSubmittedCode, ip = null) => {
  cleanup();
  
  const now = Date.now();
  
  // Check if IP is blocked
  if (ip) {
    const ipData = ipLimitStore.get(ip);
    if (ipData && ipData.isBlocked) {
      const timeLeft = Math.ceil((BLOCK_DURATION - (now - ipData.blockedAt)) / 60000);
      throw new Error(`Too many failed attempts. Please try again in ${timeLeft} minutes.`);
    }
  }
  
  const captchaData = captchaStore.get(captchaId);
  if (!captchaData) {
    // Handle failed attempt
    if (ip) {
      const ipData = ipLimitStore.get(ip) || {
        attempts: 0,
        lastAttempt: now,
        isBlocked: false
      };
      
      // Reset attempts if enough time has passed
      if (now - ipData.lastAttempt > ATTEMPT_RESET_TIME) {
        ipData.attempts = 0;
      }
      
      ipData.attempts++;
      ipData.lastAttempt = now;
      
      // Block IP if too many attempts
      if (ipData.attempts >= MAX_ATTEMPTS_PER_IP) {
        ipData.isBlocked = true;
        ipData.blockedAt = now;
      }
      
      ipLimitStore.set(ip, ipData);
      
      if (ipData.isBlocked) {
        throw new Error('Too many failed attempts. Please try again in 10 minutes.');
      }
    }
    return false;
  }
  
  const isValid = captchaData.code === userSubmittedCode;
  captchaStore.delete(captchaId);
  
  if (!isValid && ip) {
    const ipData = ipLimitStore.get(ip) || {
      attempts: 0,
      lastAttempt: now,
      isBlocked: false
    };
    
    // Reset attempts if enough time has passed
    if (now - ipData.lastAttempt > ATTEMPT_RESET_TIME) {
      ipData.attempts = 0;
    }
    
    ipData.attempts++;
    ipData.lastAttempt = now;
    
    // Block IP if too many attempts
    if (ipData.attempts >= MAX_ATTEMPTS_PER_IP) {
      ipData.isBlocked = true;
      ipData.blockedAt = now;
      ipLimitStore.set(ip, ipData);
      throw new Error('Too many failed attempts. Please try again in 10 minutes.');
    }
    
    ipLimitStore.set(ip, ipData);
  } else if (isValid && ip) {
    // Reset attempts on successful validation
    ipLimitStore.delete(ip);
  }
  
  return isValid;
}; 