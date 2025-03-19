
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

// Generate a fresh set of ECDSA keys for signing
async function generateFreshECDSAKeys(): Promise<CryptoKeyPair> {
  try {
    console.log('[Utils] Generating fresh ECDSA P-256 keys');
    
    const keyPair = await crypto.subtle.generateKey(
      {
        name: 'ECDSA',
        namedCurve: 'P-256'
      },
      true,
      ['sign', 'verify']
    );
    
    console.log('[Utils] Successfully generated fresh ECDSA keys');
    return keyPair;
  } catch (error) {
    console.error('[Utils] Error generating ECDSA keys:', error);
    throw new Error(`Failed to generate ECDSA keys: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Generate a JWT for Web Push specifically formatted for browsers
export async function generateWebPushJWT(vapidSubject: string): Promise<{ jwt: string, publicKeyBase64: string }> {
  console.log('[Utils] Generating Web Push JWT with freshly generated keys');
  
  // Validate subject
  if (!vapidSubject || !vapidSubject.startsWith('mailto:')) {
    throw new Error('VAPID subject must be a valid mailto: URL');
  }
  
  try {
    // Generate fresh keys for this session - this is the most reliable approach
    // as it avoids any key format incompatibility issues
    const keyPair = await generateFreshECDSAKeys();
    
    // Extract the public key for the Authorization header
    const publicKey = await crypto.subtle.exportKey('raw', keyPair.publicKey);
    const publicKeyBase64 = uint8ArrayToBase64Url(new Uint8Array(publicKey));
    
    // Create header and payload
    const header = {
      typ: 'JWT',
      alg: 'ES256'
    };
    
    // Current time and expiration (1 hour)
    const currentTime = Math.floor(Date.now() / 1000);
    const expirationTime = currentTime + 3600;
    
    // Create payload
    const payload = {
      aud: 'https://web.push.apple.com',  // Specifically for Apple Web Push
      iss: vapidSubject,
      iat: currentTime,
      exp: expirationTime
    };
    
    console.log('[Utils] JWT Header:', JSON.stringify(header));
    console.log('[Utils] JWT Payload:', JSON.stringify(payload));
    
    // Encode header and payload
    const encoder = new TextEncoder();
    const headerBase64 = uint8ArrayToBase64Url(encoder.encode(JSON.stringify(header)));
    const payloadBase64 = uint8ArrayToBase64Url(encoder.encode(JSON.stringify(payload)));
    
    // Create unsigned token
    const unsignedToken = `${headerBase64}.${payloadBase64}`;
    console.log('[Utils] Unsigned token created:', unsignedToken);
    
    // Sign the token with the fresh private key
    const signatureArrayBuffer = await crypto.subtle.sign(
      {
        name: 'ECDSA',
        hash: { name: 'SHA-256' }
      },
      keyPair.privateKey,
      encoder.encode(unsignedToken)
    );
    
    // Convert signature to base64url
    const signatureBase64 = uint8ArrayToBase64Url(new Uint8Array(signatureArrayBuffer));
    
    // Complete JWT
    const jwt = `${unsignedToken}.${signatureBase64}`;
    console.log('[Utils] JWT generated successfully, length:', jwt.length);
    
    return { jwt, publicKeyBase64 };
  } catch (error) {
    console.error('[Utils] Error generating JWT:', error);
    throw new Error(`Failed to generate JWT: ${error instanceof Error ? error.message : String(error)}`);
  }
}
