import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { TopBar } from "./components/TopBar";
import MailIcon from "./assets/Mail.png";
import CalendarIcon from "./assets/Calendar.png";
import { MailWidget } from "./components/widgets/MailWidget";
import { TasksWidget } from "./components/widgets/TasksWidget";
import { CalendarWidget } from "./components/widgets/CalendarWidget";
import { SuggestionsWidget } from "./components/widgets/SuggestionsWidget";
import { WidgetModal } from "./components/WidgetModal";
import { ExpandedMailWidget } from "./components/widgets/ExpandedMailWidget";
import { ExpandedTasksWidget } from "./components/widgets/ExpandedTasksWidget";
import { ExpandedCalendarWidget } from "./components/widgets/ExpandedCalendarWidget";
import { ExpandedSuggestionsWidget } from "./components/widgets/ExpandedSuggestionsWidget";
import Login from "./pages/Login";
import Onboarding from "./pages/Onboarding";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import { hasCompletedOnboarding, clearOnboardingStatus } from "./utils/auth";

type ExpandedWidget = "mail" | "tasks" | "calendar" | "suggestions" | null;

// Component to handle onboarding redirection
const OnboardingRedirect = () => {
  const location = useLocation();
  const hasOnboarded = hasCompletedOnboarding();
  
  if (!hasOnboarded && !location.pathname.startsWith('/onboarding')) {
    return <Navigate to="/onboarding" replace />;
  }
  
  return <Navigate to="/dashboard" replace />;
};

const Dashboard = () => {
  const [expandedWidget, setExpandedWidget] = useState<ExpandedWidget>(null);
  const { logout } = useAuth();

  const handleExpand = (widget: ExpandedWidget) => {
    setExpandedWidget(widget);
  };

  const handleCloseModal = () => {
    setExpandedWidget(null);
  };

  const handleLogout = () => {
    clearOnboardingStatus();
    logout();
  };

  const renderModalContent = () => {
    switch (expandedWidget) {
      case "mail":
        return <ExpandedMailWidget />;
      case "tasks":
        return <ExpandedTasksWidget />;
      case "calendar":
        return <ExpandedCalendarWidget />;
      case "suggestions":
        return <ExpandedSuggestionsWidget />;
      default:
        return null;
    }
  };

  const getModalTitle = () => {
    switch (expandedWidget) {
      case "mail":
        return "Mail - Full View";
      case "tasks":
        return "Tasks & Analytics";
      case "calendar":
        return "Calendar - Today";
      case "suggestions":
        return "AI Suggestions";
      default:
        return "";
    }
  };

  const getModalIcon = () => {
    switch (expandedWidget) {
      case "mail":
        return <img src={MailIcon} alt="Mail" className="h-5 w-5" />;
      case "tasks":
        return <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>;
      case "calendar":
        return <img src={CalendarIcon} alt="Calendar" className="h-5 w-5" />;
      case "suggestions":
        return <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <TopBar onLogout={handleLogout} />
      <main className="container mx-auto p-4 max-w-4xl">
        {/* Top row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <MailWidget onExpand={() => handleExpand("mail")} />
          <TasksWidget onExpand={() => handleExpand("tasks")} />
        </div>
        
        {/* Bottom row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <CalendarWidget onExpand={() => handleExpand("calendar")} />
          <SuggestionsWidget onExpand={() => handleExpand("suggestions")} />
        </div>
      </main>

      <WidgetModal
        isOpen={expandedWidget !== null}
        onClose={handleCloseModal}
        icon={
          expandedWidget === "mail" ? (
            <img src={MailIcon} alt="Mail" className="w-6 h-6" />
          ) : (
            <img src={CalendarIcon} alt="Calendar" className="w-6 h-6" />
          )
        }
        title={getModalTitle()}
      >
        {renderModalContent()}
      </WidgetModal>
    </div>
  );
};

// Wrapper component to handle protected routes and onboarding
export default function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/onboarding" element={
            <ProtectedRoute>
              <Onboarding />
            </ProtectedRoute>
          } />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <OnboardingRedirect />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}