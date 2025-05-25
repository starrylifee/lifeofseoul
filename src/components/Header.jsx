import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const Header = () => {
  const { currentUser, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('로그아웃 실패:', error);
    }
  };

  return (
    <header className="bg-gradient-to-r from-seoul-500 via-hangang-400 to-sunshine-400 shadow-friendly">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4 md:py-6">
          {/* 로고 및 제목 */}
          <div className="flex items-center space-x-3">
            <div className="bg-white p-2 md:p-3 rounded-2xl shadow-soft">
              <span className="text-2xl md:text-3xl">🏙️</span>
            </div>
            <div>
              <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-white font-korean">
                서울의 생활
              </h1>
              <p className="text-xs md:text-sm text-white/80 font-korean">
                초등 4학년 사회과 학습
              </p>
            </div>
          </div>

          {/* 사용자 정보 및 로그아웃 */}
          {currentUser && (
            <div className="flex items-center space-x-2 md:space-x-4">
              <div className="hidden sm:block bg-white/20 backdrop-blur-sm rounded-xl px-3 md:px-4 py-2">
                <p className="text-xs md:text-sm text-white font-medium font-korean">
                  안녕하세요! 👋
                </p>
                <p className="text-xs text-white/80 font-korean">
                  {currentUser.email.split('@')[0]}님
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white px-3 md:px-4 py-2 rounded-xl text-sm md:text-base font-medium transition-all duration-200 hover:scale-105 font-korean"
              >
                <span className="hidden sm:inline">로그아웃</span>
                <span className="sm:hidden">🚪</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header; 