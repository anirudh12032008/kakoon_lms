import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ModalProvider } from "./shared/context/ModalContext";
import { AuthProvider } from "./shared/auth/AuthContext";
import { ThemeProvider } from "./shared/theme/ThemeProvider";
import "./app/styles/index.css";
import App from "./app/App.tsx";
import { ErrorBoundary } from "./app/ErrorBoundary";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <ModalProvider>
            <App />
          </ModalProvider>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
    </ErrorBoundary>
  </StrictMode>
);
