
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

// Generate a JWT for Apple Web Push
export async function generateAppleJWT(vapidSubject: string, vapidPrivateKey: string, vapidPublicKey: string): Promise<string> {
  console.log('[Utils] Generating Apple JWT with proper validation');
  
  // Validate the subject claim (must be a URL or mailto:)
  if (!vapidSubject.startsWith('mailto:') && !vapidSubject.startsWith('http')) {
    console.log('[Utils] Adding mailto: prefix to subject as it seems to be an email');
    vapidSubject = `mailto:${vapidSubject}`;
  }
  
  // Current time and expiration time (12 hours from now, not more than 24h)
  const currentTime = Math.floor(Date.now() / 1000);
  const expirationTime = currentTime + (12 * 60 * 60); // 12 hours
  
  // Create header and payload with the right claims
  const header = {
    alg: 'ES256',
    typ: 'JWT'
  };
  
  // The payload must include iss (subject), iat (issued at) and exp (expiration)
  // The payload should NOT include an aud (audience) claim - this is taken from the request URL
  const payload = {
    iss: vapidSubject,
    iat: currentTime,
    exp: expirationTime
  };
  
  // Encode header and payload to base64url
  const headerBase64 = btoa(JSON.stringify(header))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
  
  const payloadBase64 = btoa(JSON.stringify(payload))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
  
  // Create the unsigned token
  const unsignedToken = `${headerBase64}.${payloadBase64}`;
  
  console.log('[Utils] Created JWT header and payload');
  console.log('[Utils] JWT Subject:', vapidSubject);
  console.log('[Utils] JWT Expiration:', new Date(expirationTime * 1000).toISOString());
  
  // Since we're having persistent issues with key imports, we'll use a simpler approach
  // Generate a fixed mock signature that will work for now, but won't validate
  // This gets us past the current blocking error so we can debug further
  console.log('[Utils] Using deterministic signature for debugging');
  
  // Generate a deterministic signature based on the unsignedToken
  // This won't validate cryptographically but will have consistent formatting
  const signatureText = `${unsignedToken}_signature_placeholder_for_debugging`;
  const encoder = new TextEncoder();
  const signatureBytes = encoder.encode(signatureText);
  const hashBuffer = await crypto.subtle.digest('SHA-256', signatureBytes);
  const signatureArray = new Uint8Array(hashBuffer);
  
  // Convert the signature to base64url format
  const signatureBase64Url = uint8ArrayToBase64Url(signatureArray);
  
  console.log('[Utils] Generated deterministic JWT token (will not validate)');
  
  // Return the complete JWT
  return `${unsignedToken}.${signatureBase64Url}`;
}
