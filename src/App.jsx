import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext'; // Import useAuth
import Header from './components/Header';
import Footer from './components/Footer';
import Dashboard from './pages/Dashboard';
import Classroom from './pages/Classroom';
import LessonPage from './pages/LessonPage';
import ShareView from './pages/ShareView';
import LoginPage from './pages/Login';
import AdminPanel from './pages/AdminPanel';
// TODO: Add other necessary imports like Firebase config

// Helper component for protected routes
function ProtectedRoute({ children }) {
  const { currentUser } = useAuth();
  return currentUser ? children : <Navigate to="/login" replace />;
}

function App() {
  const { currentUser } = useAuth(); // Get user from context
  const isLoggedIn = !!currentUser; // Check if user exists

  return (
    <Router>
      <div className="flex flex-col min-h-screen">
        {isLoggedIn && <Header />} {/* Show header only if logged in */}
        <main className={`flex-grow container mx-auto px-4 py-8 ${!isLoggedIn ? 'flex items-center justify-center' : ''}`}> {/* Center content if not logged in */}
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={isLoggedIn ? <Navigate to="/" replace /> : <LoginPage />} />
            <Route path="/admin" element={<AdminPanel />} />

            {/* Protected Routes */} 
            <Route 
              path="/"
              element={<ProtectedRoute><Dashboard /></ProtectedRoute>}
            />
            <Route 
              path="/classroom/:classId"
              element={<ProtectedRoute><Classroom /></ProtectedRoute>}
            />
            <Route 
              path="/lesson/:lessonId"
              element={<ProtectedRoute><LessonPage /></ProtectedRoute>}
            />
            <Route 
              path="/share"
              element={<ProtectedRoute><ShareView /></ProtectedRoute>}
            />
            
            {/* Fallback or Not Found Route */}
            <Route path="*" element={<Navigate to={isLoggedIn ? "/" : "/login"} replace />} /> 
          </Routes>
        </main>
        {isLoggedIn && <Footer />} {/* Show footer only if logged in */}
      </div>
    </Router>
  );
}

export default App; 