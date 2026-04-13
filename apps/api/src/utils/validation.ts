// Input sanitization utilities

const MAX_STRING_LENGTH = 255;
const MAX_NAME_LENGTH = 100;

// Dangerous content patterns for XSS prevention
const DANGEROUS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/i,
  /\bon\w+\s*=/i,
  /javascript:/i,
  /<iframe/i,
  /<object/i,
  /<embed/i,
];

export function containsDangerousContent(input: string): boolean {
  return DANGEROUS_PATTERNS.some((pattern) => pattern.test(input));
}

// Sanitize string input
export function sanitizeString(input: unknown, maxLength: number = MAX_STRING_LENGTH): string | null {
  if (typeof input !== 'string') {
    return null;
  }
  
  // Trim whitespace
  let sanitized = input.trim();
  
  // Limit length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }
  
  // Reject dangerous content that could indicate XSS attempts
  if (containsDangerousContent(sanitized)) {
    return null;
  }
  
  return sanitized;
}

// Validate UUID format
export function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

// Validate date string (YYYY-MM-DD format)
export function isValidDateString(str: string): boolean {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(str)) {
    return false;
  }
  
  const date = new Date(str);
  return !isNaN(date.getTime()) && date.toISOString().startsWith(str);
}

// Validate fridge name
export function validateFridgeName(name: unknown): { valid: boolean; error?: string; value?: string } {
  if (!name || typeof name !== 'string') {
    return { valid: false, error: 'Name is required and must be a string' };
  }
  
  const trimmed = name.trim();
  
  if (trimmed.length === 0) {
    return { valid: false, error: 'Name cannot be empty' };
  }
  
  if (trimmed.length > MAX_NAME_LENGTH) {
    return { valid: false, error: `Name cannot exceed ${MAX_NAME_LENGTH} characters` };
  }
  
  // Check for potentially malicious content
  const sanitized = sanitizeString(trimmed, MAX_NAME_LENGTH);
  if (sanitized === null) {
    return { valid: false, error: 'Name contains invalid characters' };
  }
  
  return { valid: true, value: sanitized };
}

// Validate shelf count
export function validateShelfCount(count: unknown): { valid: boolean; error?: string; value?: number } {
  if (typeof count === 'string' && !/^\d+$/.test(count)) {
    return { valid: false, error: 'Shelf count must be a valid integer' };
  }

  const numCount = typeof count === 'string' ? parseInt(count, 10) : count;

  if (typeof numCount !== 'number' || isNaN(numCount)) {
    return { valid: false, error: 'Shelf count must be a number' };
  }
  
  if (numCount < 1 || numCount > 10) {
    return { valid: false, error: 'Shelf count must be between 1 and 10' };
  }
  
  return { valid: true, value: numCount };
}

// Validate item name
export function validateItemName(name: unknown): { valid: boolean; error?: string; value?: string } {
  if (!name || typeof name !== 'string') {
    return { valid: false, error: 'Item name is required and must be a string' };
  }
  
  const trimmed = name.trim();
  
  if (trimmed.length === 0) {
    return { valid: false, error: 'Item name cannot be empty' };
  }
  
  if (trimmed.length > MAX_NAME_LENGTH) {
    return { valid: false, error: `Item name cannot exceed ${MAX_NAME_LENGTH} characters` };
  }
  
  const sanitized = sanitizeString(trimmed, MAX_NAME_LENGTH);
  if (sanitized === null) {
    return { valid: false, error: 'Item name contains invalid characters' };
  }
  
  return { valid: true, value: sanitized };
}

// Validate deposit date
export function validateDepositDate(date: unknown): { valid: boolean; error?: string; value?: string } {
  if (!date) {
    // Default to today
    return { valid: true, value: new Date().toISOString().split('T')[0] };
  }
  
  if (typeof date !== 'string') {
    return { valid: false, error: 'Deposit date must be a string' };
  }
  
  if (!isValidDateString(date)) {
    return { valid: false, error: 'Invalid date format. Use YYYY-MM-DD' };
  }
  
  return { valid: true, value: date };
}
