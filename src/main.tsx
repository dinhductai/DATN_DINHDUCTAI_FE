import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { pushNotificationService } from "./services/pushNotificationService";

// Initialize Push Notification Service with VAPID public key
// Get this from backend Task Service configuration (application.yml)
// This MUST match the public key used to generate private key on backend
const VAPID_PUBLIC_KEY = "BFG7k2HpM5dHTwC2Noi-EMKSR1MUpUdQa2SrqufF1CFVoP6NlGw-V3Zgf6A90yCYBsHwSFMukGuO9tVHZWSWWhI";

// Initialize VAPID key before app renders
pushNotificationService.setVapidPublicKey(VAPID_PUBLIC_KEY);

// Register Service Worker for push notifications
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('[App] Service Worker registered:', registration);
      })
      .catch((error) => {
        console.error('[App] Service Worker registration failed:', error);
      });
  });
}

createRoot(document.getElementById("root")!).render(<App />);
