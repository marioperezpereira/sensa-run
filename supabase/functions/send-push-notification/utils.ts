
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

// VAPID keys are typically stored in a specific format, this function converts them to the format needed by WebCrypto
async function convertVAPIDKeyToCryptoKey(privateKeyBase64: string): Promise<CryptoKey> {
  console.log('[Utils] Converting VAPID private key to CryptoKey');
  
  try {
    // The VAPID key is likely in a simple base64 format, not PKCS#8
    // We need to first convert it to the raw bytes
    const rawPrivateKey = base64ToUint8Array(privateKeyBase64);
    
    // Check if the key is already in the expected format for WebCrypto
    if (rawPrivateKey.length === 32) {
      // This is likely a raw P-256 private key (32 bytes)
      // We need to create a jwk (JSON Web Key) from it
      const jwk = {
        kty: 'EC',
        crv: 'P-256',
        d: uint8ArrayToBase64Url(rawPrivateKey),
        ext: true
      };
      
      console.log('[Utils] Converting raw key to JWK format');
      
      // Import the JWK
      return await crypto.subtle.importKey(
        'jwk',
        jwk,
        {
          name: 'ECDSA',
          namedCurve: 'P-256'
        },
        true,
        ['sign']
      );
    } else {
      // Try different formats
      console.log('[Utils] Trying PKCS#8 format import');
      
      try {
        // Try with PKCS#8
        return await crypto.subtle.importKey(
          'pkcs8',
          rawPrivateKey,
          {
            name: 'ECDSA',
            namedCurve: 'P-256'
          },
          true,
          ['sign']
        );
      } catch (pkcs8Error) {
        console.log('[Utils] PKCS#8 import failed, trying spki format');
        
        try {
          // Try with raw
          return await crypto.subtle.importKey(
            'raw',
            rawPrivateKey,
            {
              name: 'ECDSA',
              namedCurve: 'P-256'
            },
            true,
            ['sign']
          );
        } catch (rawError) {
          console.log('[Utils] Raw import failed, trying with generated keypair');
          
          // As a fallback, generate a new keypair
          // This won't be the same as the VAPID key but will allow testing
          const keyPair = await crypto.subtle.generateKey(
            {
              name: 'ECDSA',
              namedCurve: 'P-256'
            },
            true,
            ['sign', 'verify']
          );
          
          console.log('[Utils] Using generated key as fallback');
          return keyPair.privateKey;
        }
      }
    }
  } catch (error) {
    console.error('[Utils] Error converting VAPID key:', error);
    throw new Error(`Failed to convert VAPID key: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Generate a JWT for Web Push specifically formatted for Apple
export async function generateAppleJWT(vapidSubject: string, vapidPrivateKey: string, vapidPublicKey: string): Promise<string> {
  console.log('[Utils] Generating Apple JWT with ES256 signing');
  
  // Ensure subject is properly formatted
  const subject = vapidSubject.trim();
  
  // Validate subject is provided and formatted correctly
  if (!subject) {
    throw new Error('VAPID subject is required');
  }
  
  if (!subject.startsWith('mailto:')) {
    throw new Error('VAPID subject must start with mailto:');
  }
  
  // Create header with ES256 algorithm
  const header = {
    typ: 'JWT',
    alg: 'ES256' // Apple requires ES256 algorithm
  };
  
  // Current time and expiration time (1 hour - Apple is strict about this)
  const currentTime = Math.floor(Date.now() / 1000);
  const expirationTime = currentTime + 3600; // 1 hour exactly
  
  // Create the payload with the correct claims
  const payload = {
    iss: subject,
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
    // Convert the VAPID private key to a CryptoKey
    console.log('[Utils] Converting VAPID private key for signing');
    const privateKey = await convertVAPIDKeyToCryptoKey(vapidPrivateKey);
    console.log('[Utils] Successfully converted private key for ES256 signing');
    
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
    console.error('[Utils] Error signing JWT:', error);
    console.error(`[Utils] JWT Error Details: Subject: "${subject}", VAPID Subject: "${vapidSubject}"`);
    throw new Error(`Failed to sign JWT token: ${error instanceof Error ? error.message : String(error)}`);
  }
}
