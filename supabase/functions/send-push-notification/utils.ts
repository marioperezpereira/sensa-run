
// Convert base64 string to Uint8Array
export function base64ToUint8Array(base64: string): Uint8Array {
  // First, ensure we're using the proper base64 format
  const base64Normalized = base64.replace(/-/g, '+').replace(/_/g, '/');
  
  // Add padding if needed
  const paddingNeeded = base64Normalized.length % 4;
  const paddedBase64 = paddingNeeded 
    ? base64Normalized + '='.repeat(4 - paddingNeeded) 
    : base64Normalized;
  
  // Get binary string
  const binaryString = atob(paddedBase64);
  
  // Convert to Uint8Array
  const length = binaryString.length;
  const bytes = new Uint8Array(length);
  
  for (let i = 0; i < length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  return bytes;
}

// Convert Uint8Array to base64 URL-safe string
export function uint8ArrayToBase64Url(uint8Array: Uint8Array): string {
  // Convert to regular base64
  let base64 = btoa(String.fromCharCode.apply(null, Array.from(uint8Array)));
  
  // Make URL-safe
  base64 = base64.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  
  return base64;
}

// Generate a random salt
export function generateSalt(size: number): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(size));
}

// Function to format the VAPID private key for JWT signing
export function formatVapidKey(privateKey: string): ArrayBuffer {
  try {
    // Check if the key is already in raw base64 format (no BEGIN/END markers)
    if (!privateKey.includes('-----BEGIN')) {
      // Assume it's a raw base64 key
      return base64ToUint8Array(privateKey).buffer;
    }
    
    // Extract the base64 part from PEM format
    const pemContent = privateKey
      .replace('-----BEGIN PRIVATE KEY-----', '')
      .replace('-----END PRIVATE KEY-----', '')
      .replace(/\s/g, '');
    
    return base64ToUint8Array(pemContent).buffer;
  } catch (error) {
    console.error('Error formatting VAPID key:', error);
    throw new Error(`Failed to format VAPID key: ${error instanceof Error ? error.message : String(error)}`);
  }
}
