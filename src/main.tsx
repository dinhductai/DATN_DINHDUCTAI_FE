import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./dark-mode.css";
import { ThemeProvider } from "./contexts/ThemeContext";
import { LanguageProvider } from "./contexts/LanguageContext";
// import { pushNotificationService } from "./services/pushNotificationService";

// Push notifications disabled
// const VAPID_PUBLIC_KEY = "BFG7k2HpM5dHTwC2Noi-EMKSR1MUpUdQa2SrqufF1CFVoP6NlGw-V3Zgf6A90yCYBsHwSFMukGuO9tVHZWSWWhI";
// pushNotificationService.setVapidPublicKey(VAPID_PUBLIC_KEY);

// Register Service Worker
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

createRoot(document.getElementById("root")!).render(
  <ThemeProvider>
    <LanguageProvider>
      <App />
    </LanguageProvider>
  </ThemeProvider>
);
