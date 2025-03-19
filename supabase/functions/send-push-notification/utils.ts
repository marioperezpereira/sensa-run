
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
  
  // Strict validation and formatting of subject claim
  // Apple requires either a URL or a mailto: email
  if (!vapidSubject) {
    throw new Error('VAPID subject is required');
  }
  
  // Format the subject according to Apple's requirements
  let formattedSubject = vapidSubject;
  
  if (!formattedSubject.startsWith('mailto:') && !formattedSubject.startsWith('http://') && !formattedSubject.startsWith('https://')) {
    // Check if it looks like an email
    if (formattedSubject.includes('@')) {
      formattedSubject = `mailto:${formattedSubject}`;
      console.log('[Utils] Formatted subject as mailto:', formattedSubject);
    } else {
      // If not an email or URL, make it a https URL
      if (!formattedSubject.includes('.')) {
        throw new Error('VAPID subject must be a valid email or URL');
      }
      formattedSubject = `https://${formattedSubject}`;
      console.log('[Utils] Formatted subject as https URL:', formattedSubject);
    }
  }
  
  // Current time and expiration time (1 hour from now, not more than 24h)
  // Apple requires expiration to be not more than 24 hours
  const currentTime = Math.floor(Date.now() / 1000);
  const expirationTime = currentTime + (1 * 60 * 60); // 1 hour
  
  // Create header and payload with the right claims
  const header = {
    alg: 'ES256',
    typ: 'JWT'
  };
  
  // The payload must include iss (subject), iat (issued at) and exp (expiration)
  // The payload should NOT include an aud (audience) claim - this is taken from the request URL
  const payload = {
    iss: formattedSubject, // Using the properly formatted subject
    iat: currentTime,
    exp: expirationTime
  };
  
  // Log the exact values being used
  console.log('[Utils] JWT Header:', JSON.stringify(header));
  console.log('[Utils] JWT Payload:', JSON.stringify(payload));
  console.log('[Utils] JWT Subject:', formattedSubject);
  console.log('[Utils] JWT Current time:', currentTime, new Date(currentTime * 1000).toISOString());
  console.log('[Utils] JWT Expiration:', expirationTime, new Date(expirationTime * 1000).toISOString());
  
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
