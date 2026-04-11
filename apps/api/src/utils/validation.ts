// Input sanitization utilities

const MAX_STRING_LENGTH = 255;
const MAX_NAME_LENGTH = 100;

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
  
  // Remove potentially dangerous characters for XSS prevention
  sanitized = sanitized
    .replace(/[<>]/g, '') // Remove < and > to prevent HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, ''); // Remove event handlers
  
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
  return !isNaN(date.getTime());
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
  if (sanitized !== trimmed) {
    return { valid: false, error: 'Name contains invalid characters' };
  }
  
  return { valid: true, value: trimmed };
}

// Validate shelf count
export function validateShelfCount(count: unknown): { valid: boolean; error?: string; value?: number } {
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
  if (sanitized !== trimmed) {
    return { valid: false, error: 'Item name contains invalid characters' };
  }
  
  return { valid: true, value: trimmed };
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
