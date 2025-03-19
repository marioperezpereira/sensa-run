
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
    
    // For VAPID keys, we need to convert the raw key to PKCS#8 format
    // For Web Push, typically the key is in raw format (just the key bits)
    // But crypto.subtle.importKey expects PKCS#8 for private keys
    
    // Try importing with 'raw' format first and then converting to an ECDSA key
    const rawKey = await crypto.subtle.importKey(
      'raw',
      privateKeyBytes,
      {
        name: 'ECDH',
        namedCurve: 'P-256'
      },
      false,
      ['deriveBits']
    );
    
    // Export the key in PKCS#8 format
    const pkcs8Key = await crypto.subtle.exportKey('pkcs8', rawKey);
    
    // Now import it back for signing
    return await crypto.subtle.importKey(
      'pkcs8',
      pkcs8Key,
      {
        name: 'ECDSA',
        namedCurve: 'P-256'
      },
      false,
      ['sign']
    );
  } catch (rawImportError) {
    console.log('[Utils] Raw key import failed, trying direct PKCS#8 import');
    
    try {
      // If the above method fails, try direct import as PKCS#8
      // This assumes the key might already be in PKCS#8 format
      const privateKeyBytes = base64ToUint8Array(vapidPrivateKey);
      
      return await crypto.subtle.importKey(
        'pkcs8',
        privateKeyBytes,
        {
          name: 'ECDSA',
          namedCurve: 'P-256'
        },
        false,
        ['sign']
      );
    } catch (pkcs8Error) {
      console.error('[Utils] PKCS#8 import also failed:', pkcs8Error);
      
      // As a fallback, try a different approach using JWK format
      try {
        // For Web Push VAPID keys, the private key is usually 32 bytes
        // We can try to convert it to a JWK format
        const privateKeyBytes = base64ToUint8Array(vapidPrivateKey);
        
        if (privateKeyBytes.length !== 32) {
          throw new Error(`Expected 32 byte private key, got ${privateKeyBytes.length} bytes`);
        }
        
        // Create a JWK formatted key
        const jwk = {
          kty: 'EC',
          crv: 'P-256',
          d: uint8ArrayToBase64Url(privateKeyBytes),
          x: '',  // We don't have these values from just the private key
          y: ''   // But we'll try anyway with the private component only
        };
        
        return await crypto.subtle.importKey(
          'jwk',
          jwk,
          {
            name: 'ECDSA',
            namedCurve: 'P-256'
          },
          false,
          ['sign']
        );
      } catch (jwkError) {
        console.error('[Utils] JWK import also failed:', jwkError);
        throw new Error(`All key import methods failed. Please check the VAPID private key format: ${vapidPrivateKey.substring(0, 5)}...`);
      }
    }
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
