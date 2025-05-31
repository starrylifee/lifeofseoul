import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase'; // Firebase auth instance 및 Firestore
import { 
    signInWithEmailAndPassword 
} from "firebase/auth";
import { useAuth } from '../contexts/AuthContext';

function LoginPage() {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { fetchUserData } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // ID를 이메일 형식으로 변환 (Firebase 요구사항)
      const email = `${userId}@example.com`;
      
      // 로그인 시도
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('로그인 성공:', userCredential.user);
      
      // 사용자 데이터 로드 (역할, 학급 등)
      await fetchUserData(userCredential.user);
      
      navigate('/'); // 대시보드로 이동
    } catch (err) {
      console.error("인증 오류:", err);
      setError("로그인 실패: 아이디와 비밀번호를 확인해주세요.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-friendly-mint via-white to-friendly-pink flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* 로고 및 타이틀 섹션 */}
        <div className="text-center mb-8">
          <div className="inline-block bg-white rounded-3xl p-6 shadow-friendly mb-6">
            <span className="text-6xl">🏛️</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2 font-korean">
            Life of Seoul
          </h1>
          <p className="text-lg text-gray-600 font-korean">
            서울을 배우는 교육 플랫폼
          </p>
        </div>

        {/* 로그인 카드 */}
        <div className="bg-white rounded-3xl p-8 shadow-friendly border-2 border-white">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-2 font-korean">로그인</h2>
            <p className="text-gray-600 font-korean">
              교사 또는 학생 계정으로 로그인해주세요
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            {/* 아이디 입력 */}
            <div>
              <label htmlFor="userId" className="block text-sm font-medium text-gray-700 mb-2 font-korean">
                👤 아이디
              </label>
              <input
                type="text"
                id="userId"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                required
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-seoul-500 focus:border-seoul-500 transition-all duration-200 font-korean"
                placeholder="교사 ID 또는 학급명-학생번호"
                disabled={loading}
              />
              <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-600 font-korean">
                  📚 <strong>교사:</strong> 교사ID (예: kim)<br/>
                  🎓 <strong>학생:</strong> [학급명]-[번호] (예: 4학년5반-1)
                </p>
              </div>
            </div>

            {/* 비밀번호 입력 */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2 font-korean">
                🔐 비밀번호
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-seoul-500 focus:border-seoul-500 transition-all duration-200 font-korean"
                placeholder="비밀번호를 입력하세요"
                disabled={loading}
              />
            </div>
            
            {/* 에러 메시지 */}
            {error && (
              <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
                <p className="text-red-600 text-sm font-korean flex items-center">
                  ⚠️ {error}
                </p>
              </div>
            )}

            {/* 로그인 버튼 */}
            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-seoul-500 to-seoul-600 text-white font-bold py-4 px-6 rounded-xl hover:from-seoul-600 hover:to-seoul-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-seoul-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 font-korean"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  로그인 중...
                </span>
              ) : (
                '🚪 로그인'
              )}
            </button>
          </form>

          {/* 계정 안내 */}
          <div className="mt-6 pt-6 border-t-2 border-gray-100">
            <div className="bg-gradient-to-r from-hangang-50 to-sunshine-50 rounded-xl p-4">
              <p className="text-sm text-gray-600 text-center font-korean">
                💡 <strong>계정이 필요하신가요?</strong><br/>
                관리자에게 문의하여 계정을 생성받으세요
              </p>
            </div>
          </div>
        </div>

        {/* 하단 정보 */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-500 font-korean">
            🏫 서울특별시 교육청 인증 교육 도구
          </p>
        </div>
      </div>
    </div>
  );
}

export default LoginPage; 