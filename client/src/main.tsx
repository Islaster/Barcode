import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";

import App from "./App.tsx";
import { NutritionProvider } from "./contexts/NutrititonContext.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <NutritionProvider>
      <App />
    </NutritionProvider>
  </StrictMode>
);
