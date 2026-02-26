
import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import StudentPage from "./pages/StudentPage";
import Pricing from "./pages/Pricing";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import CookiePolicy from "./pages/CookiePolicy";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";
import PaymentSuccess from "./pages/PaymentSuccess";
import SharedWorksheet from "./pages/SharedWorksheet";
import TestExercises from "./pages/TestExercises";
import AllWorksheetsPage from "./pages/AllWorksheetsPage";
import WorksheetPage from "./pages/WorksheetPage";
import WorksheetExpiredPage from "./pages/WorksheetExpiredPage";
import HomeworkPage from "./pages/HomeworkPage";
import HomeworkReviewPage from "./pages/HomeworkReviewPage";
import FlashcardsLearning from "./pages/FlashcardsLearning";
import StudentPortal from "./pages/StudentPortal";
import StudentTestPage from "./pages/StudentTestPage";
import WelcomeTestPage from "./pages/WelcomeTestPage";
import CookieBanner from "./components/CookieBanner";
import GlobalFooter from "./components/GlobalFooter";
import OnboardingChecklist from "./components/OnboardingChecklist";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import AdminImpersonationBanner from "./components/AdminImpersonationBanner";
import CalendarPage from "./pages/CalendarPage";
import CalendarSettingsPage from "./pages/CalendarSettingsPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <div className="min-h-screen flex flex-col">
          <AdminImpersonationBanner />
          <div className="flex-1">
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Navigate to="/signup" replace />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/cookie-policy" element={<CookiePolicy />} />
              <Route path="/student/:id" element={<StudentPage />} />
              <Route path="/worksheets" element={<AllWorksheetsPage />} />
              <Route path="/worksheet/:id" element={<WorksheetPage />} />
              <Route path="/worksheet-expired" element={<WorksheetExpiredPage />} />
              <Route path="/homework/:token" element={<HomeworkPage />} />
              <Route path="/homework/:id/review" element={<HomeworkReviewPage />} />
              <Route path="/flashcards/:token" element={<FlashcardsLearning />} />
              <Route path="/my-flashcards/:studentEmail" element={<StudentPortal />} />
              <Route path="/test/:token" element={<StudentTestPage />} />
              <Route path="/welcome-test/:token" element={<WelcomeTestPage />} />
              <Route path="/success" element={<PaymentSuccess />} />
              <Route path="/payment-success" element={<PaymentSuccess />} />
              <Route path="/shared/:token" element={<SharedWorksheet />} />
              <Route path="/test-exercises" element={<TestExercises />} />
              <Route path="/calendar" element={<CalendarPage />} />
              <Route path="/calendar/settings" element={<CalendarSettingsPage />} />
              <Route path="/admin" element={<AdminDashboardPage />} />
              <Route path="/waiting-list" element={<Navigate to="/" replace />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
          <GlobalFooter />
          <OnboardingChecklist />
        </div>
        <CookieBanner />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
