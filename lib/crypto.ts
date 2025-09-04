import bcrypt from 'bcryptjs';
import crypto from 'crypto';

// Password hash for "Open@My@Lock"
export const FINANCE_PASSWORD_HASH = '$2b$10$WX.mX9SbdFTYoO9BHwQBPOgAMbKBXrFr6p6cwGBw6wETkTfLWkyY2';

export async function verifyFinancePassword(password: string): Promise<boolean> {
  try {
    return await bcrypt.compare(password, FINANCE_PASSWORD_HASH);
  } catch (error) {
    console.error('Password verification error:', error);
    return false;
  }
}

// Generate hash for the password (for development/setup)
export async function generatePasswordHash(password: string): Promise<string> {
  return await bcrypt.hash(password, 10);
}

// Simple encryption for card numbers
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'your-32-character-encryption-key!!';
const algorithm = 'aes-256-cbc';

export function encryptCardNumber(cardNumber: string): string {
  try {
    const cipher = crypto.createCipher(algorithm, ENCRYPTION_KEY);
    let encrypted = cipher.update(cardNumber, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  } catch (error) {
    console.error('Encryption error:', error);
    return cardNumber; // Fallback to plain text in case of error
  }
}

export function decryptCardNumber(encryptedData: string): string {
  try {
    const decipher = crypto.createDecipher(algorithm, ENCRYPTION_KEY);
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    return encryptedData; // Fallback to encrypted text
  }
}

export function maskCardNumber(cardNumber: string): string {
  if (cardNumber.length < 4) return cardNumber;
  const last4 = cardNumber.slice(-4);
  return '**** **** **** ' + last4;
}
