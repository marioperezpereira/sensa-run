
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
    // Debug the key format
    console.log('[Utils] Formatting VAPID private key, length:', privateKey.length);
    
    // If the key starts with these markers, it's a PEM file
    if (privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
      console.log('[Utils] Detected PEM format VAPID key');
      // Extract the base64 part from PEM format
      const pemContent = privateKey
        .replace('-----BEGIN PRIVATE KEY-----', '')
        .replace('-----END PRIVATE KEY-----', '')
        .replace(/\s/g, '');
      
      return base64ToUint8Array(pemContent).buffer;
    }
    
    // If the key is likely a raw base64 key
    console.log('[Utils] Treating as raw base64 VAPID key');
    
    // First try standard VAPID key format - 32 bytes
    let keyBytes: Uint8Array;
    
    try {
      keyBytes = base64ToUint8Array(privateKey);
      
      // For EC P-256 curve, the private key should be 32 bytes
      if (keyBytes.length === 32) {
        console.log('[Utils] Got valid 32-byte private key');
        
        // For ECDSA with P-256, we need to convert the raw 32-byte key to PKCS#8
        // This is a simplified PKCS#8 wrapper for P-256 curve private key
        const pkcs8Header = new Uint8Array([
          0x30, 0x81, 0x87, 0x02, 0x01, 0x00, 0x30, 0x13, 
          0x06, 0x07, 0x2A, 0x86, 0x48, 0xCE, 0x3D, 0x02, 
          0x01, 0x06, 0x08, 0x2A, 0x86, 0x48, 0xCE, 0x3D, 
          0x03, 0x01, 0x07, 0x04, 0x6D, 0x30, 0x6B, 0x02, 
          0x01, 0x01, 0x04, 0x20
        ]);
        
        // Combine header and key
        const pkcs8Key = new Uint8Array(pkcs8Header.length + keyBytes.length);
        pkcs8Key.set(pkcs8Header);
        pkcs8Key.set(keyBytes, pkcs8Header.length);
        
        console.log('[Utils] Created PKCS#8 formatted key');
        return pkcs8Key.buffer;
      }
    } catch (e) {
      console.error('[Utils] Error parsing raw key:', e);
    }
    
    // If we reach here, try to use the key as-is
    console.log('[Utils] Using key as-is, this may fail if not in PKCS#8 format');
    return base64ToUint8Array(privateKey).buffer;
  } catch (error) {
    console.error('[Utils] Error formatting VAPID key:', error);
    throw new Error(`Failed to format VAPID key: ${error instanceof Error ? error.message : String(error)}`);
  }
}
