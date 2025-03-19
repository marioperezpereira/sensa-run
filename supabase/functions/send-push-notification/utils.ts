
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
    
    // For raw base64 keys (typical VAPID private key format)
    console.log('[Utils] Treating as raw base64 VAPID key, converting to PKCS#8');
    
    try {
      // For ECDSA with P-256, we need to prepare a PKCS#8 structure
      // First, decode the base64 key
      const rawKeyBytes = base64ToUint8Array(privateKey);
      
      // Log the key length to help with debugging
      console.log('[Utils] Raw key length:', rawKeyBytes.length);
      
      // Create a PKCS#8 formatted key for P-256 curve
      // This is a simplified version that wraps the raw key material
      const pkcs8Header = new Uint8Array([
        // ASN.1 Sequence
        0x30, 0x81, 0x87, 
        // Version
        0x02, 0x01, 0x00,
        // Algorithm Identifier
        0x30, 0x13, 
        // Algorithm OID (EC Public Key)
        0x06, 0x07, 0x2A, 0x86, 0x48, 0xCE, 0x3D, 0x02, 0x01,
        // Parameters (named curve OID for P-256)
        0x06, 0x08, 0x2A, 0x86, 0x48, 0xCE, 0x3D, 0x03, 0x01, 0x07,
        // Private Key OCTET STRING header
        0x04, 0x6D, 
        // Private Key OCTET STRING content
        0x30, 0x6B, 
        // Version
        0x02, 0x01, 0x01,
        // Private Key value (32 bytes for P-256)
        0x04, 0x20
      ]);
      
      // Concatenate header and key bytes
      const pkcs8Key = new Uint8Array(pkcs8Header.length + rawKeyBytes.length);
      pkcs8Key.set(pkcs8Header);
      pkcs8Key.set(rawKeyBytes, pkcs8Header.length);
      
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
