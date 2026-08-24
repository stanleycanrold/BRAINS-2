import React, { useEffect } from "react";
import { HashRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { BrainProvider, useBrains } from "./lib/store";
import { ToastHost } from "./components/ui";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import IdeaWorkspace from "./pages/IdeaWorkspace";
import Engage from "./pages/Engage";
import Account from "./pages/Account";
import Questionnaire from "./pages/Questionnaire";

function ScrollReset() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [pathname]);
  return null;
}

function Toasts() {
  const { toasts, dismissToast } = useBrains();
  return <ToastHost toasts={toasts} dismiss={dismissToast} />;
}

export default function App() {
  return (
    <BrainProvider>
      <HashRouter>
        <ScrollReset />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/app" element={<Dashboard />} />
          <Route path="/app/ideas/:slug" element={<IdeaWorkspace />} />
          <Route path="/app/engage" element={<Engage />} />
          <Route path="/app/account" element={<Account />} />
          <Route path="/q/:shareId" element={<Questionnaire />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toasts />
      </HashRouter>
    </BrainProvider>
  );
}
