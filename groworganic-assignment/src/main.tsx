// import { StrictMode } from 'react';
import React from "react";
import ReactDOM from "react-dom/client";
// import { createRoot } from 'react-dom/client'
import { PrimeReactProvider } from "primereact/api";
import "./index.css";
import App from "./App.tsx";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <PrimeReactProvider>
      <App />
    </PrimeReactProvider>
  </React.StrictMode>,
);
