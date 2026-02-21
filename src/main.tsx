import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "swiper/swiper-bundle.css";
import "flatpickr/dist/flatpickr.css";
import App from "./App.tsx";
import { AppWrapper } from "./components/common/PageMeta.tsx";
import { ThemeProvider } from "./context/ThemeContext.tsx";

// Register service worker for PWA (only in production)
// vite-plugin-pwa will automatically inject the service worker registration
// This is handled by the plugin during build time

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <AppWrapper>
        <App />
      </AppWrapper>
    </ThemeProvider>
  </StrictMode>,
);
