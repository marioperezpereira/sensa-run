
export async function registerPushNotifications() {
  try {
    const registration = await navigator.serviceWorker.ready;
    
    // Check if push is supported
    if (!('pushManager' in registration)) {
      console.log('Push notifications not supported');
      return null;
    }

    let subscription = await registration.pushManager.getSubscription();
    
    // If no subscription exists, we don't create one yet
    // We'll do this when the user explicitly grants permission
    console.log('Push notification system ready');
    return subscription;
    
  } catch (err) {
    console.error('Error setting up push notifications:', err);
    return null;
  }
}
