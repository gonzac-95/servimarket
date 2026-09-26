import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { registerServiceWorker } from "./lib/webpush";
import { initAnalytics } from "./lib/analytics";

registerServiceWorker();
initAnalytics();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode><App /></React.StrictMode>
);
