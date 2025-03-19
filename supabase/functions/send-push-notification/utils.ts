
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

// Format a VAPID private key for proper use with crypto.subtle.importKey
export function formatVapidKey(privateKey: string): Uint8Array {
  try {
    console.log('[Utils] Starting to format VAPID key');
    
    // Check if the key is in PEM format
    if (privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
      console.log('[Utils] Detected PEM format key, extracting base64 content');
      // Extract the base64 part from PEM format
      const pemContent = privateKey
        .replace('-----BEGIN PRIVATE KEY-----', '')
        .replace('-----END PRIVATE KEY-----', '')
        .replace(/\s/g, '');
      
      // This should already be in PKCS#8 format, just decode it
      return base64ToUint8Array(pemContent);
    }
    
    // For raw base64 keys, we'll try multiple approaches
    console.log('[Utils] Processing raw base64 key');
    
    // First attempt: Try if it's already in PKCS#8 format
    try {
      const keyBytes = base64ToUint8Array(privateKey);
      
      // A properly formatted PKCS#8 key should start with this sequence for EC keys
      if (keyBytes.length > 5 && 
          keyBytes[0] === 0x30 &&  // SEQUENCE tag
          (keyBytes[1] & 0x80) &&  // Long form length
          keyBytes[4] === 0x02) {  // INTEGER tag (version)
        console.log('[Utils] Key appears to be already in PKCS#8 format');
        return keyBytes;
      }
      
      // If key is 32 bytes, it's likely a raw EC key for P-256 curve
      if (keyBytes.length === 32) {
        console.log('[Utils] Converting 32-byte raw key to PKCS#8 format');
        
        // This is a fixed PKCS#8 ASN.1 header for EC P-256 private keys
        const pkcs8Header = new Uint8Array([
          0x30, 0x81, 0x87, 0x02, 0x01, 0x00, 0x30, 0x13, 
          0x06, 0x07, 0x2A, 0x86, 0x48, 0xCE, 0x3D, 0x02, 
          0x01, 0x06, 0x08, 0x2A, 0x86, 0x48, 0xCE, 0x3D, 
          0x03, 0x01, 0x07, 0x04, 0x6D, 0x30, 0x6B, 0x02, 
          0x01, 0x01, 0x04, 0x20
        ]);
        
        // Create a new array with the header and the key
        const pkcs8Key = new Uint8Array(pkcs8Header.length + keyBytes.length);
        pkcs8Key.set(pkcs8Header);
        pkcs8Key.set(keyBytes, pkcs8Header.length);
        
        console.log('[Utils] Successfully created PKCS#8 formatted key');
        return pkcs8Key;
      }
      
      // For other key sizes, we'll try to handle them as is
      console.log(`[Utils] Using key as-is (length: ${keyBytes.length} bytes)`);
      return keyBytes;
      
    } catch (error) {
      console.error('[Utils] Error processing the key:', error);
      throw new Error(`Failed to format VAPID key: ${error instanceof Error ? error.message : String(error)}`);
    }
  } catch (error) {
    console.error('[Utils] Error formatting VAPID key:', error);
    throw new Error(`Failed to format VAPID key: ${error instanceof Error ? error.message : String(error)}`);
  }
}
