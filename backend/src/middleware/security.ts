import { Response } from 'express';

/**
 * Security headers middleware
 */
export function securityHeaders(req: any, res: Response, next: any) {
  // Security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Remove X-Powered-By header
  res.removeHeader('X-Powered-By');
  
  next();
}

/**
 * Sanitize error messages in production
 */
export function sanitizeError(error: any): string {
  if (process.env.NODE_ENV === 'development') {
    return error.message || 'Internal server error';
  }
  
  // In production, hide sensitive error details
  if (error instanceof Error) {
    // Don't expose internal error messages
    if (error.message.includes('password') || 
        error.message.includes('secret') ||
        error.message.includes('token') ||
        error.message.includes('key')) {
      return 'An error occurred. Please try again.';
    }
  }
  
  return error.message || 'Internal server error';
}

