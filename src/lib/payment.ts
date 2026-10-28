/**
 * Utility functions for generating dynamic UPI payment deep links and QR codes
 * with exact amount lock as required by UPI standard (upi://pay?pa=...&am=...&tn=...)
 */

export interface UpiPaymentParams {
  upiId: string;
  payeeName: string;
  amount: number;
  eventName: string;
}

/**
 * Generates standard UPI URI for scanning or deep-linking
 */
export function generateUpiPaymentUrl(
  upiId: string = '9975952579@fam',
  payeeName: string = 'Rugved Solanki',
  amount: number,
  eventName: string
): string {
  const cleanUpiId = (upiId || '9975952579@fam').trim();
  const cleanPayee = (payeeName || 'Rugved Solanki').trim();
  const cleanEvent = (eventName || 'PLANET-X 2026').trim();
  const transactionNote = `PLANETX ${cleanEvent} Fee`.substring(0, 40);

  // Standard UPI Intent protocol params
  const params = new URLSearchParams();
  params.set('pa', cleanUpiId);
  params.set('pn', cleanPayee);
  params.set('am', amount.toFixed(2));
  params.set('cu', 'INR');
  params.set('tn', transactionNote);

  return `upi://pay?${params.toString()}`;
}

/**
 * Generates dynamic QR code image URL for the specific UPI link
 */
export function generateUpiQrCodeUrl(upiUrl: string, size: number = 300): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&margin=10&data=${encodeURIComponent(upiUrl)}`;
}
