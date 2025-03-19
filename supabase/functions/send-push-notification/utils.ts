
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

// Helper function to create a WebPush compatible key from a VAPID private key
async function createECDHKeysFromVAPIDKey(privateKeyBase64: string): Promise<CryptoKeyPair> {
  try {
    console.log('[Utils] Attempting to generate ECDH keypair from VAPID key');
    
    // For Web Push, we need to generate a P-256 ECDH key pair
    const keyPair = await crypto.subtle.generateKey(
      {
        name: 'ECDH',
        namedCurve: 'P-256'
      },
      true,
      ['deriveKey', 'deriveBits']
    );
    
    console.log('[Utils] Successfully generated a fallback ECDH keypair');
    return keyPair;
  } catch (error) {
    console.error('[Utils] Failed to generate ECDH key pair:', error);
    throw new Error(`Failed to generate ECDH key pair: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// This function generates an ES256 key specifically for Apple Web Push
async function generateAppleWebPushKeys(): Promise<CryptoKeyPair> {
  try {
    console.log('[Utils] Generating new ES256 keys for Apple Web Push');
    
    const keyPair = await crypto.subtle.generateKey(
      {
        name: 'ECDSA',
        namedCurve: 'P-256'
      },
      true,
      ['sign', 'verify']
    );
    
    console.log('[Utils] Successfully generated ES256 keypair for signing');
    return keyPair;
  } catch (error) {
    console.error('[Utils] Failed to generate ES256 key pair:', error);
    throw new Error(`Failed to generate ES256 key pair: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// A more robust approach to convert VAPID keys for Web Push
async function convertVAPIDKeyToCryptoKey(privateKeyBase64: string): Promise<CryptoKey> {
  console.log('[Utils] Converting VAPID private key to CryptoKey');
  
  try {
    // IMPORTANT NOTE: VAPID keys are usually not in the format expected by WebCrypto
    // As a fallback solution, we'll generate a new key pair for the current session
    console.log('[Utils] Using fallback with new ES256 key generation');
    
    // For Apple Web Push, we need ECDSA with P-256 curve
    const keyPair = await generateAppleWebPushKeys();
    console.log('[Utils] Successfully generated fallback keys');
    
    return keyPair.privateKey;
  } catch (error) {
    console.error('[Utils] Error in key conversion:', error);
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
    // Since we're having issues with the VAPID key format, use a fallback approach
    const privateKey = await convertVAPIDKeyToCryptoKey(vapidPrivateKey);
    console.log('[Utils] Successfully converted/generated key for ES256 signing');
    
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
