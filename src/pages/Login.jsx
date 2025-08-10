import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db, googleProvider } from '../firebase'; // Firebase auth instance 및 Firestore
import { 
    signInWithEmailAndPassword,
    sendPasswordResetEmail,
    createUserWithEmailAndPassword,
    signInWithPopup
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { useAuth } from '../contexts/AuthContext';

function LoginPage() {
  const [userId] = useState('');
  const [password] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resetError, setResetError] = useState(null);
  const [resetLoading, setResetLoading] = useState(false);
  
  // 회원가입 관련 상태
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupPasswordConfirm, setSignupPasswordConfirm] = useState('');
  const [signupCode, setSignupCode] = useState('');
  const [signupRole, setSignupRole] = useState('student'); // 'student' 또는 'teacher'
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [signupError, setSignupError] = useState(null);
  const [signupLoading, setSignupLoading] = useState(false);
  
  const navigate = useNavigate();
  const { fetchUserData } = useAuth();

  // Google SSO 로그인
  const handleGoogleLogin = async () => {
    setError(null);
    setLoading(true);

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const email = user.email;

      // 서울시 교육청 도메인 확인 (*.sen.es.kr 패턴)
      if (!email.includes('.sen.es.kr')) {
        throw new Error('서울시 교육청 계정으로만 로그인할 수 있습니다. (예: @shindap.sen.es.kr)');
      }

      // Firestore에서 사용자 정보 확인
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        // 첫 로그인 - 역할 선택 필요
        await setDoc(userDocRef, {
          email: email,
          role: 'needs_setup', // 역할 선택 필요
          displayName: user.displayName || email.split('@')[0],
          schoolDomain: email.split('@')[1],
          createdAt: new Date(),
          loginMethod: 'google'
        });
      }

      // 사용자 데이터 로드
      await fetchUserData(user);
      navigate('/');
    } catch (err) {
      console.error("Google 로그인 오류:", err);
      if (err.code === 'auth/popup-closed-by-user') {
        setError("로그인이 취소되었습니다.");
      } else if (err.code === 'auth/popup-blocked') {
        setError("팝업이 차단되었습니다. 팝업을 허용해주세요.");
      } else {
        setError(err.message || "Google 로그인 중 오류가 발생했습니다.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // 이메일로 로그인
      const userCredential = await signInWithEmailAndPassword(auth, userId, password);
      console.log('로그인 성공:', userCredential.user);
      
      // 사용자 데이터 로드 (역할, 학급 등)
      await fetchUserData(userCredential.user);
      
      navigate('/'); // 대시보드로 이동
    } catch (err) {
      console.error("인증 오류:", err);
      setError("로그인 실패: 이메일과 비밀번호를 확인해주세요.");
    } finally {
      setLoading(false);
    }
  };

  // 비밀번호 재설정 이메일 전송
  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setResetError(null);
    setResetSuccess(false);
    setResetLoading(true);

    if (!resetEmail.trim()) {
      setResetError("이메일을 입력해주세요.");
      setResetLoading(false);
      return;
    }

    try {
      // 비밀번호 재설정 이메일 발송
      await sendPasswordResetEmail(auth, resetEmail);
      setResetSuccess(true);
      setResetEmail('');
    } catch (err) {
      console.error("비밀번호 재설정 오류:", err);
      if (err.code === 'auth/user-not-found') {
        setResetError("존재하지 않는 이메일입니다.");
      } else {
        setResetError("비밀번호 재설정 이메일 발송에 실패했습니다.");
      }
    } finally {
      setResetLoading(false);
    }
  };

  // 회원가입 처리
  const handleSignup = async (e) => {
    e.preventDefault();
    setSignupError(null);
    setSignupSuccess(false);
    setSignupLoading(true);

    // 유효성 검사
    if (!signupEmail.trim()) {
      setSignupError("이메일을 입력해주세요.");
      setSignupLoading(false);
      return;
    }

    if (!signupPassword.trim()) {
      setSignupError("비밀번호를 입력해주세요.");
      setSignupLoading(false);
      return;
    }

    if (signupPassword !== signupPasswordConfirm) {
      setSignupError("비밀번호가 일치하지 않습니다.");
      setSignupLoading(false);
      return;
    }

    if (signupRole === 'student' && !signupCode.trim()) {
      setSignupError("가입 코드를 입력해주세요.");
      setSignupLoading(false);
      return;
    }

    try {
      // 교사 계정인 경우 코드 검증
      if (signupRole === 'teacher' && signupCode !== '123456') {
        setSignupError("교사 인증 코드가 올바르지 않습니다.");
        setSignupLoading(false);
        return;
      }

      // 학생 계정인 경우 코드 검증 및 교사 계정 연결
      let teacherId = null;
      if (signupRole === 'student') {
        // 가입 코드 검증 (예: DB에서 유효한 코드인지 확인)
        const inviteCodeRef = doc(db, "inviteCodes", signupCode);
        const inviteCodeDoc = await getDoc(inviteCodeRef);
        
        if (!inviteCodeDoc.exists()) {
          setSignupError("유효하지 않은 가입 코드입니다.");
          setSignupLoading(false);
          return;
        }
        
        const inviteData = inviteCodeDoc.data();
        if (inviteData.used) {
          setSignupError("이미 사용된 가입 코드입니다.");
          setSignupLoading(false);
          return;
        }
        
        teacherId = inviteData.teacherId;
      }

      // Firebase Authentication을 통한 계정 생성
      const userCredential = await createUserWithEmailAndPassword(auth, signupEmail, signupPassword);
      const user = userCredential.user;

      // 사용자 정보를 Firestore에 저장
      const userDocRef = doc(db, "users", user.uid);
      await setDoc(userDocRef, {
        email: signupEmail,
        role: signupRole,
        createdAt: new Date(),
        classId: signupRole === 'student' ? 'unassigned' : null,
        teacherId: teacherId,
        studentNumber: null,
        displayName: signupEmail.split('@')[0]
      });

      // 학생인 경우 가입 코드 사용 처리
      if (signupRole === 'student' && teacherId) {
        const inviteCodeRef = doc(db, "inviteCodes", signupCode);
        await setDoc(inviteCodeRef, { used: true, usedBy: user.uid, usedAt: new Date() }, { merge: true });
      }

      setSignupSuccess(true);
      // 입력 필드 초기화
      setSignupEmail('');
      setSignupPassword('');
      setSignupPasswordConfirm('');
      setSignupCode('');
    } catch (err) {
      console.error("회원가입 오류:", err);
      if (err.code === 'auth/email-already-in-use') {
        setSignupError("이미 사용 중인 이메일입니다.");
      } else if (err.code === 'auth/invalid-email') {
        setSignupError("유효하지 않은 이메일 형식입니다.");
      } else if (err.code === 'auth/weak-password') {
        setSignupError("비밀번호가 너무 약합니다. 6자리 이상 입력해주세요.");
      } else {
        setSignupError("회원가입 중 오류가 발생했습니다: " + err.message);
      }
    } finally {
      setSignupLoading(false);
    }
  };

  // 모달 닫기
  const closeResetModal = () => {
    setShowResetModal(false);
    setResetEmail('');
    setResetError(null);
    setResetSuccess(false);
  };

  const closeSignupModal = () => {
    setShowSignupModal(false);
    setSignupEmail('');
    setSignupPassword('');
    setSignupPasswordConfirm('');
    setSignupCode('');
    setSignupError(null);
    setSignupSuccess(false);
    setSignupRole('student');
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
              서울시 교육청 Google 계정으로 로그인하세요
            </p>
          </div>

          {/* Google SSO 로그인 */}
          <div className="mb-6">
            <button 
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full bg-white border-2 border-gray-300 hover:border-gray-400 text-gray-700 font-bold py-4 px-6 rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 font-korean flex items-center justify-center"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-600 mr-2"></div>
                  로그인 중...
                </span>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Google 계정으로 로그인
                </>
              )}
            </button>
          </div>

          {/* 에러 메시지 */}
          {error && (
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 mb-6">
              <p className="text-red-600 text-sm font-korean flex items-center">
                ⚠️ {error}
              </p>
            </div>
          )}

          {/* 로그인 안내 */}
          <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-xl p-6 border-2 border-blue-100">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <span className="text-3xl mb-2 block">👩‍🏫</span>
                <h3 className="text-sm font-bold text-blue-800 font-korean mb-2">교사</h3>
                <p className="text-xs text-blue-700 font-korean">
                  로그인 후<br/>교사 역할 선택
                </p>
              </div>
              <div className="text-center">
                <span className="text-3xl mb-2 block">🧑‍🎓</span>
                <h3 className="text-sm font-bold text-green-800 font-korean mb-2">학생</h3>
                <p className="text-xs text-green-700 font-korean">
                  로그인 후<br/>학생 역할 선택
                </p>
              </div>
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

      {/* 비밀번호 재설정 모달 */}
      {showResetModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4 font-korean">비밀번호 재설정</h3>
            <p className="text-gray-600 mb-4 font-korean">
              비밀번호를 재설정하려면 계정 이메일을 입력해주세요. 비밀번호 재설정 링크가 전송됩니다.
            </p>

            {resetSuccess ? (
              <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 mb-4">
                <p className="text-green-600 text-sm font-korean flex items-center">
                  ✅ 비밀번호 재설정 이메일이 전송되었습니다. 이메일을 확인해주세요.
                </p>
              </div>
            ) : (
              <form onSubmit={handlePasswordReset} className="space-y-4">
                <div>
                  <label htmlFor="resetEmail" className="block text-sm font-medium text-gray-700 mb-2 font-korean">
                    이메일
                  </label>
                  <input
                    type="email"
                    id="resetEmail"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-seoul-500 focus:border-seoul-500 transition-all duration-200 font-korean"
                    placeholder="예: student@example.com"
                    disabled={resetLoading}
                  />
                </div>

                {resetError && (
                  <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
                    <p className="text-red-600 text-sm font-korean flex items-center">
                      ⚠️ {resetError}
                    </p>
                  </div>
                )}

                <div className="flex space-x-3 pt-2">
                  <button 
                    type="button"
                    onClick={closeResetModal}
                    className="flex-1 py-2.5 px-4 border-2 border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 focus:outline-none font-korean"
                  >
                    취소
                  </button>
                  <button 
                    type="submit"
                    disabled={resetLoading}
                    className="flex-1 bg-seoul-500 text-white py-2.5 px-4 rounded-xl hover:bg-seoul-600 focus:outline-none font-korean"
                  >
                    {resetLoading ? (
                      <span className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        처리 중...
                      </span>
                    ) : (
                      '요청 전송'
                    )}
                  </button>
                </div>
              </form>
            )}

            {resetSuccess && (
              <div className="flex justify-end mt-4">
                <button 
                  onClick={closeResetModal}
                  className="bg-seoul-500 text-white py-2.5 px-6 rounded-xl hover:bg-seoul-600 focus:outline-none font-korean"
                >
                  닫기
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 회원가입 모달 */}
      {showSignupModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-90vh overflow-y-auto">
            <h3 className="text-xl font-bold mb-4 font-korean">새 계정 만들기</h3>
            <p className="text-gray-600 mb-4 font-korean">
              교사 또는 학생 계정을 만들어 Life of Seoul을 시작해보세요.
            </p>

            {signupSuccess ? (
              <div className="space-y-4">
                <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 mb-4">
                  <p className="text-green-600 text-sm font-korean flex items-center">
                    ✅ 회원가입이 완료되었습니다! 이제 로그인할 수 있습니다.
                  </p>
                </div>

                <div className="flex justify-end">
                  <button 
                    onClick={closeSignupModal}
                    className="bg-seoul-500 text-white py-2.5 px-6 rounded-xl hover:bg-seoul-600 focus:outline-none font-korean"
                  >
                    로그인 화면으로
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSignup} className="space-y-4">
                {/* 역할 선택 */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2 font-korean">
                    계정 유형
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      type="button"
                      onClick={() => setSignupRole('student')}
                      className={`p-3 rounded-xl border-2 transition-all ${
                        signupRole === 'student' 
                          ? 'border-sunshine-500 bg-sunshine-50 text-sunshine-700' 
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <span className="text-xl mb-1 block">🧑‍🎓</span>
                      <span className="font-medium font-korean">학생</span>
                    </button>
                    <button 
                      type="button"
                      onClick={() => setSignupRole('teacher')}
                      className={`p-3 rounded-xl border-2 transition-all ${
                        signupRole === 'teacher' 
                          ? 'border-blue-500 bg-blue-50 text-blue-700' 
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <span className="text-xl mb-1 block">👩‍🏫</span>
                      <span className="font-medium font-korean">교사</span>
                    </button>
                  </div>
                </div>

                {/* 이메일 입력 */}
                <div>
                  <label htmlFor="signupEmail" className="block text-sm font-medium text-gray-700 mb-2 font-korean">
                    📧 이메일
                  </label>
                  <input
                    type="email"
                    id="signupEmail"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    required
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-seoul-500 focus:border-seoul-500 transition-all duration-200 font-korean"
                    placeholder="이메일을 입력하세요"
                    disabled={signupLoading}
                  />
                  <p className="mt-1 text-xs text-gray-500 font-korean">
                    * 학교 이메일을 사용하시면 좋습니다 (예: sdt19@shindap.sen.es.kr)
                  </p>
                </div>

                {/* 비밀번호 입력 */}
                <div>
                  <label htmlFor="signupPassword" className="block text-sm font-medium text-gray-700 mb-2 font-korean">
                    🔐 비밀번호
                  </label>
                  <input
                    type="password"
                    id="signupPassword"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    required
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-seoul-500 focus:border-seoul-500 transition-all duration-200 font-korean"
                    placeholder="비밀번호를 입력하세요 (6자리 이상)"
                    disabled={signupLoading}
                  />
                </div>

                {/* 비밀번호 확인 */}
                <div>
                  <label htmlFor="signupPasswordConfirm" className="block text-sm font-medium text-gray-700 mb-2 font-korean">
                    🔐 비밀번호 확인
                  </label>
                  <input
                    type="password"
                    id="signupPasswordConfirm"
                    value={signupPasswordConfirm}
                    onChange={(e) => setSignupPasswordConfirm(e.target.value)}
                    required
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-seoul-500 focus:border-seoul-500 transition-all duration-200 font-korean"
                    placeholder="비밀번호를 다시 입력하세요"
                    disabled={signupLoading}
                  />
                </div>

                {/* 가입 코드 (역할에 따라 다르게 표시) */}
                <div>
                  <label htmlFor="signupCode" className="block text-sm font-medium text-gray-700 mb-2 font-korean">
                    {signupRole === 'student' ? '📝 가입 코드' : '🔑 교사 인증 코드'}
                  </label>
                  <input
                    type="text"
                    id="signupCode"
                    value={signupCode}
                    onChange={(e) => setSignupCode(e.target.value)}
                    required
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-seoul-500 focus:border-seoul-500 transition-all duration-200 font-korean"
                    placeholder={signupRole === 'student' 
                      ? "교사에게 받은 가입 코드를 입력하세요" 
                      : "교사 인증 코드를 입력하세요"}
                    disabled={signupLoading}
                  />
                  <p className="mt-1 text-xs text-gray-500 font-korean">
                    {signupRole === 'student'
                      ? "* 담당 교사에게 발급받은 가입 코드를 입력하세요."
                      : "* 교사 계정을 생성하려면 관리자에게 인증 코드를 받으세요."}
                  </p>
                </div>

                {/* 에러 메시지 */}
                {signupError && (
                  <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
                    <p className="text-red-600 text-sm font-korean flex items-center">
                      ⚠️ {signupError}
                    </p>
                  </div>
                )}

                <div className="flex space-x-3 pt-2">
                  <button 
                    type="button"
                    onClick={closeSignupModal}
                    className="flex-1 py-2.5 px-4 border-2 border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 focus:outline-none font-korean"
                  >
                    취소
                  </button>
                  <button 
                    type="submit"
                    disabled={signupLoading}
                    className="flex-1 bg-sunshine-500 text-white py-2.5 px-4 rounded-xl hover:bg-sunshine-600 focus:outline-none font-korean"
                  >
                    {signupLoading ? (
                      <span className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        처리 중...
                      </span>
                    ) : (
                      '계정 만들기'
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default LoginPage; 