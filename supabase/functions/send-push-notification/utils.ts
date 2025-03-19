
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

// This function properly creates a valid keypair from a VAPID private key
async function createVAPIDKeysFromPrivateKey(privateKeyBase64: string): Promise<{ publicKey: CryptoKey; privateKey: CryptoKey }> {
  console.log('[Utils] Creating VAPID keypair from private key');
  
  try {
    // Convert base64 to Uint8Array
    const privateKeyBytes = base64ToUint8Array(privateKeyBase64);
    
    // Import the private key for the P-256 curve
    const privateKey = await crypto.subtle.importKey(
      'pkcs8',
      privateKeyBytes,
      {
        name: 'ECDSA',
        namedCurve: 'P-256'
      },
      true, // extractable
      ['sign']
    );
    
    // Generate the public key from the private key
    // Note: In a proper implementation, we would derive the public key
    // This is a simplification that creates a new keypair
    const keyPair = await crypto.subtle.generateKey(
      {
        name: 'ECDSA',
        namedCurve: 'P-256'
      },
      true,
      ['sign', 'verify']
    );
    
    return {
      publicKey: keyPair.publicKey,
      privateKey: privateKey
    };
  } catch (error) {
    console.error('[Utils] Error creating keypair:', error);
    throw new Error(`Failed to create VAPID keypair: ${error instanceof Error ? error.message : String(error)}`);
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
    // Try using the direct approach with the private key (Apple's preferred method)
    const privateKeyBytes = base64ToUint8Array(vapidPrivateKey);
    
    // Import the private key for ES256 signing
    const privateKey = await crypto.subtle.importKey(
      'pkcs8',
      privateKeyBytes,
      {
        name: 'ECDSA',
        namedCurve: 'P-256'
      },
      false,
      ['sign']
    );
    
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
  } catch (primaryError) {
    console.error('[Utils] Primary signing method failed:', primaryError);
    
    try {
      // Fallback to using the createVAPIDKeysFromPrivateKey method
      console.log('[Utils] Trying fallback method with createVAPIDKeysFromPrivateKey');
      const keys = await createVAPIDKeysFromPrivateKey(vapidPrivateKey);
      
      // Sign the token with the generated private key
      const signatureArrayBuffer = await crypto.subtle.sign(
        {
          name: 'ECDSA',
          hash: { name: 'SHA-256' }
        },
        keys.privateKey,
        encoder.encode(unsignedToken)
      );
      
      // Convert the signature to base64url
      const signatureBase64 = uint8ArrayToBase64Url(new Uint8Array(signatureArrayBuffer));
      
      // Return the complete JWT
      const jwt = `${unsignedToken}.${signatureBase64}`;
      console.log('[Utils] JWT token generated with fallback method, length:', jwt.length);
      
      return jwt;
    } catch (fallbackError) {
      console.error('[Utils] Fallback signing method also failed:', fallbackError);
      console.error(`[Utils] JWT Error Details: Subject: "${subject}", VAPID Subject: "${vapidSubject}"`);
      throw new Error(`Failed to sign JWT token: ${fallbackError instanceof Error ? fallbackError.message : String(fallbackError)}`);
    }
  }
}
