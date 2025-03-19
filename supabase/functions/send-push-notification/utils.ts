
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
  let base64 = btoa(String.fromCharCode(...Array.from(uint8Array)));
  
  // Make URL-safe
  base64 = base64.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  
  return base64;
}

// Generate a random salt
export function generateSalt(size: number): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(size));
}

// Convert a base64 VAPID private key to a CryptoKey object for ES256 signing
async function importVAPIDPrivateKey(vapidPrivateKey: string): Promise<CryptoKey> {
  console.log('[Utils] Importing VAPID private key for ES256 signing');
  
  try {
    // Convert the base64 private key to a Uint8Array
    const privateKeyBytes = base64ToUint8Array(vapidPrivateKey);
    
    // Import the private key in the correct format for ECDSA with P-256 curve
    return await crypto.subtle.importKey(
      'pkcs8',      // PKCS#8 format for private keys
      privateKeyBytes,
      {
        name: 'ECDSA',
        namedCurve: 'P-256'  // Apple requires P-256 curve
      },
      false,  // Not extractable
      ['sign'] // Only need signing capability
    );
  } catch (error) {
    console.error('[Utils] Error importing private key:', error);
    throw new Error(`Failed to import VAPID private key: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Generate a JWT for Web Push (especially for Apple)
export async function generateAppleJWT(vapidSubject: string, vapidPrivateKey: string, vapidPublicKey: string): Promise<string> {
  console.log('[Utils] Generating Apple JWT with ES256 signing');
  
  // Ensure raw subject is properly formatted
  const formattedSubject = vapidSubject.trim();
  
  // Validate subject is provided and formatted correctly
  if (!formattedSubject) {
    throw new Error('VAPID subject is required');
  }
  
  if (!formattedSubject.startsWith('mailto:')) {
    throw new Error('VAPID subject must start with mailto:');
  }
  
  console.log('[Utils] Using formatted subject:', formattedSubject);
  
  // Create header with ES256 algorithm
  const header = {
    typ: 'JWT',
    alg: 'ES256' // Apple specifically requires ES256 algorithm
  };
  
  // Current time and expiration time (exactly 1 hour - Apple is strict about this)
  const currentTime = Math.floor(Date.now() / 1000);
  const expirationTime = currentTime + 3600; // 1 hour
  
  // Create the payload with the correct claims
  const payload = {
    iss: formattedSubject,
    iat: currentTime,
    exp: expirationTime
  };
  
  console.log('[Utils] JWT Header:', JSON.stringify(header));
  console.log('[Utils] JWT Payload:', JSON.stringify(payload));
  
  // Encode header and payload to base64url
  const encoder = new TextEncoder();
  const headerBase64 = uint8ArrayToBase64Url(encoder.encode(JSON.stringify(header)));
  const payloadBase64 = uint8ArrayToBase64Url(encoder.encode(JSON.stringify(payload)));
  
  // Create the unsigned token
  const unsignedToken = `${headerBase64}.${payloadBase64}`;
  console.log('[Utils] Unsigned token created:', unsignedToken);
  
  try {
    // Import the private key in the correct format for ES256
    const privateKey = await importVAPIDPrivateKey(vapidPrivateKey);
    console.log('[Utils] Private key imported successfully for ES256');
    
    // Sign the token with ES256
    const signatureArrayBuffer = await crypto.subtle.sign(
      {
        name: 'ECDSA',
        hash: { name: 'SHA-256' }
      },
      privateKey,
      encoder.encode(unsignedToken)
    );
    
    // Convert the signature to base64url
    const signatureBase64 = uint8ArrayToBase64Url(new Uint8Array(signatureArrayBuffer));
    
    // Return the complete JWT
    const jwt = `${unsignedToken}.${signatureBase64}`;
    console.log('[Utils] JWT token generated with ES256 signature, length:', jwt.length);
    
    return jwt;
  } catch (error) {
    console.error('[Utils] Error generating JWT signature:', error);
    throw new Error(`Failed to sign JWT token: ${error instanceof Error ? error.message : String(error)}`);
  }
}
