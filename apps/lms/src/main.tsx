import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ModalProvider } from "./shared/context/ModalContext";
import "./app/styles/index.css";
import App from "./app/App.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ModalProvider>
      <App />
    </ModalProvider>
  </StrictMode>
);
