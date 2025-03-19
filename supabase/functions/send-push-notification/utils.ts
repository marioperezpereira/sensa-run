
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

// Convert a PEM private key to a CryptoKey object
async function importPrivateKey(vapidPrivateKey: string): Promise<CryptoKey> {
  console.log('[Utils] Importing VAPID private key');
  
  // Convert the base64 private key to a Uint8Array
  const privateKeyBytes = base64ToUint8Array(vapidPrivateKey);
  
  try {
    // Import the private key as a CryptoKey
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
  } catch (error) {
    console.error('[Utils] Error importing private key:', error);
    throw new Error(`Failed to import private key: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Generate a JWT for Apple Web Push
export async function generateAppleJWT(vapidSubject: string, vapidPrivateKey: string, vapidPublicKey: string): Promise<string> {
  console.log('[Utils] Generating Apple JWT with proper ES256 signing');
  
  // Ensure raw subject is logged before any processing
  console.log('[Utils] Raw VAPID subject before formatting:', vapidSubject);
  
  // Remove whitespace from subject
  let formattedSubject = vapidSubject.trim();
  
  // Validate subject is provided
  if (!formattedSubject) {
    throw new Error('VAPID subject is required');
  }
  
  // Don't modify a subject that already has mailto: or http:// or https://
  if (!formattedSubject.startsWith('mailto:') && 
      !formattedSubject.startsWith('http://') && 
      !formattedSubject.startsWith('https://')) {
    
    // If it has an @ sign, assume it's an email and add mailto:
    if (formattedSubject.includes('@')) {
      formattedSubject = `mailto:${formattedSubject}`;
      console.log('[Utils] Formatted as mailto:', formattedSubject);
    } else if (formattedSubject.includes('.')) {
      // If it has a dot, assume it's a domain and add https://
      formattedSubject = `https://${formattedSubject}`;
      console.log('[Utils] Formatted as https URL:', formattedSubject);
    } else {
      throw new Error('VAPID subject must be a valid email or URL');
    }
  }
  
  // Current time and expiration time (10 minutes from now, not more than 24h)
  // A shorter expiration time helps ensure the token is valid
  const currentTime = Math.floor(Date.now() / 1000);
  const expirationTime = currentTime + (10 * 60); // 10 minutes
  
  // Create header and payload with the right claims
  const header = {
    alg: 'ES256',
    typ: 'JWT'
  };
  
  // The payload must include iss (subject), iat (issued at) and exp (expiration)
  // The payload should NOT include an aud (audience) claim - this is taken from the request URL
  const payload = {
    iss: formattedSubject,
    iat: currentTime,
    exp: expirationTime
  };
  
  // Log the exact values being used
  console.log('[Utils] JWT Header:', JSON.stringify(header));
  console.log('[Utils] JWT Payload:', JSON.stringify(payload, null, 2));
  console.log('[Utils] JWT Subject used in payload:', formattedSubject);
  console.log('[Utils] JWT Current time:', currentTime, new Date(currentTime * 1000).toISOString());
  console.log('[Utils] JWT Expiration:', expirationTime, new Date(expirationTime * 1000).toISOString());
  
  // Encode header and payload to base64url
  const encoder = new TextEncoder();
  const headerBuffer = encoder.encode(JSON.stringify(header));
  const payloadBuffer = encoder.encode(JSON.stringify(payload));
  
  const headerBase64 = uint8ArrayToBase64Url(new Uint8Array(headerBuffer));
  const payloadBase64 = uint8ArrayToBase64Url(new Uint8Array(payloadBuffer));
  
  // Create the unsigned token
  const unsignedToken = `${headerBase64}.${payloadBase64}`;
  console.log('[Utils] Created unsigned token part of JWT:', unsignedToken);
  
  try {
    // Import the private key
    const privateKey = await importPrivateKey(vapidPrivateKey);
    console.log('[Utils] Private key imported successfully');
    
    // Convert the unsigned token to an ArrayBuffer for signing
    const unsignedTokenBuffer = encoder.encode(unsignedToken);
    
    // Sign the token using ES256
    const signatureArrayBuffer = await crypto.subtle.sign(
      { name: 'ECDSA', hash: { name: 'SHA-256' } },
      privateKey,
      unsignedTokenBuffer
    );
    
    // Convert the signature to a base64url string
    const signatureBase64 = uint8ArrayToBase64Url(new Uint8Array(signatureArrayBuffer));
    console.log('[Utils] Generated signature with proper ES256 signing');
    
    // Return the complete JWT
    const jwt = `${unsignedToken}.${signatureBase64}`;
    console.log('[Utils] Final JWT token length:', jwt.length);
    
    return jwt;
  } catch (error) {
    console.error('[Utils] Error generating JWT signature:', error);
    throw new Error(`Failed to sign JWT: ${error instanceof Error ? error.message : String(error)}`);
  }
}
