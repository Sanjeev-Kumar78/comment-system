/**
 * Input validation and sanitization utilities
 */

// Text validation and sanitization
export const validateComment = (
  text: string
): { isValid: boolean; error?: string } => {
  if (!text || typeof text !== "string") {
    return { isValid: false, error: "Comment text is required" };
  }

  const trimmed = text.trim();

  if (trimmed.length === 0) {
    return { isValid: false, error: "Comment cannot be empty" };
  }

  if (trimmed.length < 3) {
    return {
      isValid: false,
      error: "Comment must be at least 3 characters long",
    };
  }

  if (trimmed.length > 10000) {
    return {
      isValid: false,
      error: "Comment is too long (maximum 10,000 characters)",
    };
  }

  // Check for potentially harmful content patterns
  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /data:text\/html/i,
    /vbscript:/i,
    /onload=/i,
    /onerror=/i,
    /onclick=/i,
  ];

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(trimmed)) {
      return {
        isValid: false,
        error: "Comment contains potentially harmful content",
      };
    }
  }

  return { isValid: true };
};

// Basic text sanitization (remove potentially harmful content)
export const sanitizeText = (text: string): string => {
  if (!text || typeof text !== "string") {
    return "";
  }

  // Remove HTML tags and decode entities
  const tempDiv = document.createElement("div");
  tempDiv.textContent = text;
  let sanitized = tempDiv.innerHTML;

  // Additional cleaning
  sanitized = sanitized
    .replace(/&lt;script.*?&gt;.*?&lt;\/script&gt;/gi, "")
    .replace(/&lt;.*?&gt;/g, "")
    .trim();

  return sanitized;
};

// Email validation
export const validateEmail = (
  email: string
): { isValid: boolean; error?: string } => {
  if (!email || typeof email !== "string") {
    return { isValid: false, error: "Email is required" };
  }

  const trimmed = email.trim();

  if (trimmed.length === 0) {
    return { isValid: false, error: "Email cannot be empty" };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed)) {
    return { isValid: false, error: "Please enter a valid email address" };
  }

  if (trimmed.length > 254) {
    return { isValid: false, error: "Email is too long" };
  }

  return { isValid: true };
};

// Password validation
export const validatePassword = (
  password: string
): { isValid: boolean; error?: string } => {
  if (!password || typeof password !== "string") {
    return { isValid: false, error: "Password is required" };
  }

  if (password.length < 6) {
    return {
      isValid: false,
      error: "Password must be at least 6 characters long",
    };
  }

  if (password.length > 128) {
    return {
      isValid: false,
      error: "Password is too long (maximum 128 characters)",
    };
  }

  // Check for at least one letter and one number
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /\d/.test(password);

  if (!hasLetter || !hasNumber) {
    return {
      isValid: false,
      error: "Password must contain at least one letter and one number",
    };
  }

  return { isValid: true };
};

// Name validation
export const validateName = (
  name: string,
  fieldName: string
): { isValid: boolean; error?: string } => {
  if (!name || typeof name !== "string") {
    return { isValid: false, error: `${fieldName} is required` };
  }

  const trimmed = name.trim();

  if (trimmed.length === 0) {
    return { isValid: false, error: `${fieldName} cannot be empty` };
  }

  if (trimmed.length < 2) {
    return {
      isValid: false,
      error: `${fieldName} must be at least 2 characters long`,
    };
  }

  if (trimmed.length > 50) {
    return {
      isValid: false,
      error: `${fieldName} is too long (maximum 50 characters)`,
    };
  }

  // Only allow letters, spaces, hyphens, and apostrophes
  const nameRegex = /^[a-zA-Z\s\-']+$/;
  if (!nameRegex.test(trimmed)) {
    return {
      isValid: false,
      error: `${fieldName} can only contain letters, spaces, hyphens, and apostrophes`,
    };
  }

  return { isValid: true };
};

// Rate limiting helper (client-side)
class RateLimiter {
  private attempts: Map<string, number[]> = new Map();
  private maxAttempts: number;
  private windowMs: number;

  constructor(maxAttempts: number = 5, windowMs: number = 60000) {
    this.maxAttempts = maxAttempts;
    this.windowMs = windowMs;
  }

  canProceed(key: string): boolean {
    const now = Date.now();
    const attempts = this.attempts.get(key) || [];

    // Remove old attempts outside the window
    const recentAttempts = attempts.filter(
      (time) => now - time < this.windowMs
    );

    if (recentAttempts.length >= this.maxAttempts) {
      return false;
    }

    // Record this attempt
    recentAttempts.push(now);
    this.attempts.set(key, recentAttempts);

    return true;
  }

  getRemainingTime(key: string): number {
    const attempts = this.attempts.get(key) || [];
    if (attempts.length === 0) return 0;

    const oldestAttempt = Math.min(...attempts);
    const remainingTime = this.windowMs - (Date.now() - oldestAttempt);

    return Math.max(0, remainingTime);
  }
}

export const commentRateLimiter = new RateLimiter(10, 60000); // 10 comments per minute
export const authRateLimiter = new RateLimiter(5, 300000); // 5 auth attempts per 5 minutes
