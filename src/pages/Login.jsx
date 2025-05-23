import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase'; // Firebase auth instance 및 Firestore
import { 
    signInWithEmailAndPassword 
} from "firebase/auth";
import { useAuth } from '../contexts/AuthContext';

function LoginPage() {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { fetchUserData } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null); // Clear previous errors

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
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 border rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-center">로그인</h2>
      <p className="text-center text-gray-600 mb-6">
        Life of Seoul 학습 도구에 오신 것을 환영합니다.<br />
        교사 또는 학생 계정으로 로그인해주세요.
      </p>
      <form onSubmit={handleLogin}>
        <div className="mb-4">
          <label htmlFor="userId" className="block text-sm font-medium text-gray-700 mb-1">아이디</label>
          <input
            type="text"
            id="userId"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="교사 ID 또는 학급명-학생번호"
          />
          <p className="text-xs text-gray-500 mt-1">
            교사: 교사ID(예: kim), 학생: [학급명]-[번호](예: 4학년5반-1)
          </p>
        </div>
        <div className="mb-6">
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">비밀번호</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="비밀번호 입력"
          />
        </div>
        
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        <button 
          type="submit"
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          로그인
        </button>
      </form>
      
      <div className="mt-6 border-t pt-4">
        <p className="text-sm text-gray-500 text-center">
          계정 생성이 필요하면 관리자에게 문의하세요.
        </p>
      </div>
    </div>
  );
}

export default LoginPage; 