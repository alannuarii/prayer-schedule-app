// Helper to convert VAPID public key
function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function subscribeUserToPush(cityId) {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    throw new Error("Push notifications are not supported by this browser.");
  }

  // Request permission
  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    throw new Error("Notification permission denied.");
  }

  // Register service worker
  const registration = await navigator.serviceWorker.register("/sw.js");

  // Fetch VAPID public key
  const response = await fetch("/api/vapidPublicKey");
  const { publicKey } = await response.json();
  
  if (!publicKey) {
    throw new Error("VAPID Public Key belum terkonfigurasi di server.");
  }

  const applicationServerKey = urlBase64ToUint8Array(publicKey);

  // Subscribe
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey
  });

  // Send subscription to server
  const subResponse = await fetch("/api/subscribe", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ subscription, cityId })
  });

  if (!subResponse.ok) {
    throw new Error("Failed to save subscription on server.");
  }

  return true;
}
