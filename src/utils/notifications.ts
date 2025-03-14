
export async function registerPushNotifications() {
  try {
    const registration = await navigator.serviceWorker.ready;
    
    // Check if push is supported
    if (!('pushManager' in registration)) {
      console.log('Push notifications not supported');
      return null;
    }

    let subscription = await registration.pushManager.getSubscription();
    
    // If a subscription already exists, return it
    if (subscription) {
      console.log('Push notification subscription exists');
      return subscription;
    }

    // Get VAPID public key from backend
    const { data: { publicKey } } = await supabase.functions.invoke('get-vapid-key');
    
    if (!publicKey) {
      console.error('Could not get VAPID public key');
      return null;
    }

    // Convert base64 string to Uint8Array
    const applicationServerKey = urlB64ToUint8Array(publicKey);

    // Create new subscription
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey
    });

    console.log('Push notification subscription created:', subscription);
    return subscription;
    
  } catch (err) {
    console.error('Error setting up push notifications:', err);
    return null;
  }
}

// Helper function to convert VAPID key from base64 to Uint8Array
function urlB64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

