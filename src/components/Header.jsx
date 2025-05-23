import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

function Header() {
  const { currentUser, userId, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
      console.log('Logged out successfully');
    } catch (error) {
      console.error("Failed to log out:", error);
    }
  };

  return (
    <header className="bg-blue-600 text-white p-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <h1 className="text-xl font-bold">Life of Seoul - 학습 도구</h1>
        {currentUser && (
          <div className="flex items-center space-x-4">
            <span className="text-sm">{userId || '사용자'}</span>
            <button 
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 text-white text-sm py-1 px-3 rounded"
            >
              로그아웃
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

export default Header; 