
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

    // If the key starts with these markers, it's a PEM EC PRIVATE KEY file
    if (privateKey.includes('-----BEGIN EC PRIVATE KEY-----')) {
      console.log('[Utils] Detected EC PEM format VAPID key');
      // Extract the base64 part from PEM format
      const pemContent = privateKey
        .replace('-----BEGIN EC PRIVATE KEY-----', '')
        .replace('-----END EC PRIVATE KEY-----', '')
        .replace(/\s/g, '');
      
      // This is likely in SEC1 format, we need to convert to PKCS#8
      console.log('[Utils] Converting EC Private Key from SEC1 to PKCS#8 format');
      
      // First decode the key
      const rawKey = base64ToUint8Array(pemContent);
      
      // Create a PKCS#8 wrapper for P-256 EC key
      // Fixed header for P-256 EC key in PKCS#8 format
      const pkcs8Header = new Uint8Array([
        0x30, 0x81, 0x87, 0x02, 0x01, 0x00, 0x30, 0x13, 0x06, 0x07, 0x2a, 0x86, 
        0x48, 0xce, 0x3d, 0x02, 0x01, 0x06, 0x08, 0x2a, 0x86, 0x48, 0xce, 0x3d, 
        0x03, 0x01, 0x07, 0x04, 0x6d, 0x30, 0x6b, 0x02, 0x01, 0x01, 0x04, 0x20
      ]);
      
      // Extract just the 32-byte private key value (removing ASN.1 encoding)
      // For simple SEC1 encoding, the private key is right after the header
      // This is a simplification - actual SEC1 parsing would be more complex
      const privateKeyValue = rawKey.slice(-32); // Take last 32 bytes which should be the key
      
      console.log('[Utils] Extracted private key value, length:', privateKeyValue.length);
      
      // Combine the header with the key value
      const pkcs8Key = new Uint8Array(pkcs8Header.length + privateKeyValue.length);
      pkcs8Key.set(pkcs8Header);
      pkcs8Key.set(privateKeyValue, pkcs8Header.length);
      
      console.log('[Utils] Created PKCS#8 formatted key with length:', pkcs8Key.length);
      return pkcs8Key.buffer;
    }
    
    console.log('[Utils] Treating as raw base64 VAPID key');
    
    // For raw base64 keys (typical VAPID private key format)
    try {
      // First, decode the base64 key
      const rawKeyBytes = base64ToUint8Array(privateKey);
      
      // Log the raw key length
      console.log('[Utils] Raw key length:', rawKeyBytes.length);
      
      // Check if this is already in a DER format (starts with 0x30)
      if (rawKeyBytes.length > 0 && rawKeyBytes[0] === 0x30) {
        console.log('[Utils] Detected possible DER encoding, using as is');
        return rawKeyBytes.buffer;
      }
      
      // Create a PKCS#8 formatted key for P-256 curve
      // This header represents the ASN.1 structure required for PKCS#8
      const pkcs8Header = new Uint8Array([
        0x30, 0x81, 0x87, 0x02, 0x01, 0x00, 0x30, 0x13, 0x06, 0x07, 0x2a, 0x86, 
        0x48, 0xce, 0x3d, 0x02, 0x01, 0x06, 0x08, 0x2a, 0x86, 0x48, 0xce, 0x3d, 
        0x03, 0x01, 0x07, 0x04, 0x6d, 0x30, 0x6b, 0x02, 0x01, 0x01, 0x04, 0x20
      ]);
      
      // For WebPush VAPID keys, if we have a raw 32-byte key (common format)
      let keyBytes = rawKeyBytes;
      if (rawKeyBytes.length !== 32) {
        console.log('[Utils] Unexpected key length, trying to extract 32-byte portion');
        // Try to take last 32 bytes if longer
        if (rawKeyBytes.length > 32) {
          keyBytes = rawKeyBytes.slice(rawKeyBytes.length - 32);
        } else {
          // Pad if shorter (though this is likely not going to work)
          const paddedKey = new Uint8Array(32);
          paddedKey.set(rawKeyBytes, 32 - rawKeyBytes.length);
          keyBytes = paddedKey;
        }
      }
      
      // Concatenate header and key bytes
      const pkcs8Key = new Uint8Array(pkcs8Header.length + keyBytes.length);
      pkcs8Key.set(pkcs8Header);
      pkcs8Key.set(keyBytes, pkcs8Header.length);
      
      console.log('[Utils] Created PKCS#8 formatted key with length:', pkcs8Key.length);
      return pkcs8Key.buffer;
    } catch (e) {
      console.error('[Utils] Error formatting raw key to PKCS#8:', e);
      throw new Error(`Failed to format raw key to PKCS#8: ${e instanceof Error ? e.message : String(e)}`);
    }
  } catch (error) {
    console.error('[Utils] Error formatting VAPID key:', error);
    throw new Error(`Failed to format VAPID key: ${error instanceof Error ? error.message : String(error)}`);
  }
}
