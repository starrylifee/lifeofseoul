import React from 'react';
import { useAuth } from '../contexts/AuthContext';

function StudentPendingScreen() {
  const { currentUser, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('로그아웃 오류:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-friendly-mint via-white to-friendly-pink flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl p-8 shadow-friendly border-2 border-white text-center">
          {/* 아이콘 */}
          <div className="mb-6">
            <span className="text-8xl">⏳</span>
          </div>

          {/* 제목 */}
          <h2 className="text-2xl font-bold text-gray-800 mb-4 font-korean">
            승인 대기 중
          </h2>

          {/* 설명 */}
          <div className="mb-8">
            <p className="text-gray-600 mb-4 font-korean">
              <strong className="text-blue-600">{currentUser?.email}</strong><br/>
              학생 계정이 생성되었습니다.
            </p>
            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4">
              <p className="text-yellow-800 text-sm font-korean">
                💡 <strong>다음 단계</strong><br/>
                교사에게 본인의 이메일을 알려주세요.<br/>
                교사가 승인하면 바로 사용할 수 있습니다.
              </p>
            </div>
          </div>

          {/* 이메일 복사 버튼 */}
          <button
            onClick={() => {
              navigator.clipboard.writeText(currentUser?.email);
              alert('이메일이 복사되었습니다!');
            }}
            className="w-full bg-blue-500 text-white py-3 px-6 rounded-xl hover:bg-blue-600 transition-colors mb-4 font-korean"
          >
            📧 이메일 복사하기
          </button>

          {/* 로그아웃 버튼 */}
          <button
            onClick={handleLogout}
            className="w-full bg-gray-300 text-gray-700 py-3 px-6 rounded-xl hover:bg-gray-400 transition-colors font-korean"
          >
            로그아웃
          </button>

          {/* 상태 표시 */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex items-center justify-center space-x-2">
              <div className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-500 font-korean">승인 대기 중...</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StudentPendingScreen;