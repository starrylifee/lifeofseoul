import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Header from './components/Header';
import Footer from './components/Footer';
import RoleSelectionModal from './components/RoleSelectionModal';
import StudentPendingScreen from './components/StudentPendingScreen';
import InviteCodeModal from './components/InviteCodeModal';

import Dashboard from './pages/Dashboard';
import Classroom from './pages/Classroom';
import LessonPage from './pages/LessonPage';
import Explore from './pages/Explore';
import ShareView from './pages/ShareView';
import LoginPage from './pages/Login';
import AdminPanel from './pages/AdminPanel';
import TeacherProgress from './pages/TeacherProgress';
import Progress from './pages/Progress';
import Settings from './pages/Settings';
import Help from './pages/Help';
import QuizAnalytics from './pages/QuizAnalytics';

function ProtectedRoute({ children }) {
  const { currentUser } = useAuth();
  return currentUser ? children : <Navigate to="/login" replace />;
}

function App() {
  const { currentUser, userRole, showRoleSetup, handleRoleSet, requireInviteCode } = useAuth();
  const isLoggedIn = !!currentUser;

  // 학생이 승인 대기 중인 경우
  if (isLoggedIn && userRole === 'student' && currentUser.status === 'pending') {
    return <StudentPendingScreen />;
  }

  return (
    <Router>
      <div className="flex flex-col min-h-screen">
        {isLoggedIn && <Header />}
        <main className={`flex-grow container mx-auto px-4 py-8 ${!isLoggedIn ? 'flex items-center justify-center' : ''}`}>
          <Routes>
            <Route path="/login" element={isLoggedIn ? <Navigate to="/" replace /> : <LoginPage />} />
            <Route path="/admin" element={<AdminPanel />} />
            <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/classroom" element={<ProtectedRoute><Classroom /></ProtectedRoute>} />
            <Route path="/lesson/:lessonId" element={<ProtectedRoute><LessonPage /></ProtectedRoute>} />
            <Route path="/share" element={<ProtectedRoute><ShareView /></ProtectedRoute>} />
            <Route path="/teacher-progress" element={<ProtectedRoute><TeacherProgress /></ProtectedRoute>} />
            <Route path="/progress" element={<ProtectedRoute><Progress /></ProtectedRoute>} />
            <Route path="/explore" element={<ProtectedRoute><Explore /></ProtectedRoute>} />
            <Route path="/help" element={<ProtectedRoute><Help /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            <Route path="/quiz-analytics" element={<ProtectedRoute><QuizAnalytics /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to={isLoggedIn ? "/" : "/login"} replace />} />
          </Routes>
        </main>
        {isLoggedIn && <Footer />}
        
        {/* 역할 선택 모달 */}
        {showRoleSetup && currentUser && (
          <RoleSelectionModal 
            email={currentUser.email} 
            onRoleSet={handleRoleSet} 
          />
        )}

        {/* 학생 초대코드 강제 모달 (역할 선택 모달보다 다음 우선순위) */}
        {!showRoleSetup && requireInviteCode && (
          <InviteCodeModal />
        )}
      </div>
    </Router>
  );
}

export default App; 