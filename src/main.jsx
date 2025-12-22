import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import "./index.css";
import { UserProvider } from "./context/UserContext.jsx";
import { SubscriptionProvider } from "./context/SubscriptionContext.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <UserProvider>
      <SubscriptionProvider>
        <App />
      </SubscriptionProvider>
    </UserProvider>
  </BrowserRouter>
);
