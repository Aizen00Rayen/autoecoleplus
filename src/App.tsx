import { Toaster } from "./components/ui/toaster";
import { Toaster as Sonner } from "./components/ui/sonner";
import { TooltipProvider } from "./components/ui/tooltip";
import "./App.css";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
// import SelectTeacher from "./pages/SelectTeacher"; // Temporarily disabled
import AdminDashboard from "./pages/AdminDashboard";
import TeacherDashboard from "./pages/TeacherDashboard";
import TeacherSchedule from "./pages/TeacherSchedule";
import StudentDashboard from "./pages/StudentDashboard";
import ManageTeachers from "./pages/ManageTeachers";
import ManageStudents from "./pages/ManageStudents";
import ManageVehicles from "./pages/ManageVehicles";
import ManagePayments from "./pages/ManagePayments";
import AdminNotifications from "./pages/AdminNotifications";
import AdminReports from "./pages/AdminReports";
import AdminSettings from "./pages/AdminSettings";
import BookingPage from "./pages/BookingPage";
import TeacherBookings from "./pages/TeacherBookings";
import AdminBookings from "./pages/AdminBookings";
import LearningMaterials from "./pages/LearningMaterials";
import Chat from "./pages/Chat";
import Instructors from "./pages/Instructors";
import Vehicles from "./pages/Vehicles";
import About from "./pages/About";
import Contact from "./pages/Contact";
import BookingPublic from "./pages/BookingPublic";
import Services from "./pages/Services";
import NotFound from "./pages/NotFound";
import TestCreateAccounts from "./pages/TestCreateAccounts";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <TooltipProvider>
        <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            {/* <Route path="/select-teacher" element={<SelectTeacher />} /> */} {/* Temporarily disabled */}
            <Route path="/test" element={<TestCreateAccounts />} />
            
            {/* Protected Routes */}
            <Route 
              path="/admin-dashboard" 
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/manage-teachers" 
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <ManageTeachers />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/manage-students" 
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <ManageStudents />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/manage-vehicles" 
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <ManageVehicles />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin-bookings" 
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminBookings />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/manage-payments" 
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <ManagePayments />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin-notifications" 
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminNotifications />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin-reports" 
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminReports />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin-settings" 
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminSettings />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/teacher-dashboard" 
              element={
                <ProtectedRoute allowedRoles={['teacher']}>
                  <TeacherDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/teacher-schedule" 
              element={
                <ProtectedRoute allowedRoles={['teacher']}>
                  <TeacherSchedule />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/student-dashboard" 
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <StudentDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/bookings" 
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <BookingPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/teacher-bookings" 
              element={
                <ProtectedRoute allowedRoles={['teacher']}>
                  <TeacherBookings />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/learning-materials" 
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <LearningMaterials />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/chat" 
              element={
                <ProtectedRoute allowedRoles={['student', 'teacher']}>
                  <Chat />
                </ProtectedRoute>
              } 
            />
            
            {/* Legacy routes - redirect to new dashboard routes */}
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/teacher" 
              element={
                <ProtectedRoute allowedRoles={['teacher']}>
                  <TeacherDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/student" 
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <StudentDashboard />
                </ProtectedRoute>
              } 
            />
            
            <Route path="/about" element={<About />} />
            <Route path="/services" element={<Services />} />
            <Route path="/instructors" element={<Instructors />} />
            <Route path="/vehicles" element={<Vehicles />} />
            <Route path="/booking" element={<BookingPublic />} />
            <Route path="/contact" element={<Contact />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
