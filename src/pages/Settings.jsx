import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const Settings = () => {
  const { currentUser, userId, userRole, classId, studentNumber, isTeacher, isStudent, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    if (window.confirm('정말 로그아웃하시겠습니까?')) {
      setLoading(true);
      try {
        await logout();
        navigate('/login');
      } catch (error) {
        console.error('로그아웃 실패:', error);
        alert('로그아웃에 실패했습니다.');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-friendly-mint via-white to-friendly-pink">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4 font-korean">
            ⚙️ 설정
          </h1>
          <p className="text-lg text-gray-600 font-korean">
            계정 정보와 앱 설정을 확인하세요
          </p>
        </div>

        {/* 계정 정보 카드 */}
        <div className="bg-white rounded-3xl p-6 shadow-soft mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 font-korean">👤 계정 정보</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-xl">
                <label className="block text-sm font-medium text-gray-700 mb-2 font-korean">이메일</label>
                <div className="text-lg font-medium text-gray-800">{currentUser?.email || 'N/A'}</div>
              </div>
              
              <div className="p-4 bg-gray-50 rounded-xl">
                <label className="block text-sm font-medium text-gray-700 mb-2 font-korean">사용자 ID</label>
                <div className="text-lg font-medium text-gray-800">{userId || 'N/A'}</div>
              </div>
              
              <div className="p-4 bg-gray-50 rounded-xl">
                <label className="block text-sm font-medium text-gray-700 mb-2 font-korean">역할</label>
                <div className="flex items-center">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    isTeacher() 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {isTeacher() ? '👨‍🏫 교사' : '🎓 학생'}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-xl">
                <label className="block text-sm font-medium text-gray-700 mb-2 font-korean">학급</label>
                <div className="text-lg font-medium text-gray-800">{classId || 'N/A'}</div>
              </div>
              
              {isStudent() && (
                <div className="p-4 bg-gray-50 rounded-xl">
                  <label className="block text-sm font-medium text-gray-700 mb-2 font-korean">학생 번호</label>
                  <div className="text-lg font-medium text-gray-800">{studentNumber || 'N/A'}번</div>
                </div>
              )}
              
              <div className="p-4 bg-gray-50 rounded-xl">
                <label className="block text-sm font-medium text-gray-700 mb-2 font-korean">가입일</label>
                <div className="text-lg font-medium text-gray-800">
                  {currentUser?.metadata?.creationTime 
                    ? new Date(currentUser.metadata.creationTime).toLocaleDateString('ko-KR')
                    : 'N/A'
                  }
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 앱 정보 카드 */}
        <div className="bg-white rounded-3xl p-6 shadow-soft mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 font-korean">📱 앱 정보</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-xl">
                <label className="block text-sm font-medium text-gray-700 mb-2 font-korean">앱 이름</label>
                <div className="text-lg font-medium text-gray-800">Life of Seoul</div>
              </div>
              
              <div className="p-4 bg-gray-50 rounded-xl">
                <label className="block text-sm font-medium text-gray-700 mb-2 font-korean">버전</label>
                <div className="text-lg font-medium text-gray-800">v1.0.0</div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-xl">
                <label className="block text-sm font-medium text-gray-700 mb-2 font-korean">개발</label>
                <div className="text-lg font-medium text-gray-800">서울특별시 교육청</div>
              </div>
              
              <div className="p-4 bg-gray-50 rounded-xl">
                <label className="block text-sm font-medium text-gray-700 mb-2 font-korean">마지막 업데이트</label>
                <div className="text-lg font-medium text-gray-800">2024.12.31</div>
              </div>
            </div>
          </div>
        </div>

        {/* 권한 및 기능 카드 */}
        <div className="bg-white rounded-3xl p-6 shadow-soft mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 font-korean">🔐 권한 및 기능</h2>
          
          <div className="space-y-4">
            {isTeacher() ? (
              <>
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl">
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">👥</span>
                    <div>
                      <div className="font-medium text-gray-800 font-korean">학급 관리</div>
                      <div className="text-sm text-gray-600">학생 계정 생성 및 관리</div>
                    </div>
                  </div>
                  <span className="text-green-600 font-medium">✅ 활성화</span>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl">
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">⭐</span>
                    <div>
                      <div className="font-medium text-gray-800 font-korean">별 지급</div>
                      <div className="text-sm text-gray-600">학생들에게 별 지급</div>
                    </div>
                  </div>
                  <span className="text-green-600 font-medium">✅ 활성화</span>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl">
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">📊</span>
                    <div>
                      <div className="font-medium text-gray-800 font-korean">진행 현황 조회</div>
                      <div className="text-sm text-gray-600">학급 전체 학습 현황 확인</div>
                    </div>
                  </div>
                  <span className="text-green-600 font-medium">✅ 활성화</span>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl">
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">🗺️</span>
                    <div>
                      <div className="font-medium text-gray-800 font-korean">마커 관리</div>
                      <div className="text-sm text-gray-600">학생 마커 삭제 및 관리</div>
                    </div>
                  </div>
                  <span className="text-green-600 font-medium">✅ 활성화</span>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl">
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">📚</span>
                    <div>
                      <div className="font-medium text-gray-800 font-korean">수업 참여</div>
                      <div className="text-sm text-gray-600">모든 레슨 접근 및 학습</div>
                    </div>
                  </div>
                  <span className="text-green-600 font-medium">✅ 활성화</span>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl">
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">📍</span>
                    <div>
                      <div className="font-medium text-gray-800 font-korean">마커 생성</div>
                      <div className="text-sm text-gray-600">지도에 마커 및 댓글 작성</div>
                    </div>
                  </div>
                  <span className="text-green-600 font-medium">✅ 활성화</span>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl">
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">🎮</span>
                    <div>
                      <div className="font-medium text-gray-800 font-korean">펫 시스템</div>
                      <div className="text-sm text-gray-600">별 수집 및 펫 키우기</div>
                    </div>
                  </div>
                  <span className="text-green-600 font-medium">✅ 활성화</span>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl">
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">👥</span>
                    <div>
                      <div className="font-medium text-gray-800 font-korean">친구와 공유</div>
                      <div className="text-sm text-gray-600">다른 학급과 활동 공유</div>
                    </div>
                  </div>
                  <span className="text-green-600 font-medium">✅ 활성화</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* 액션 버튼들 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <button
            onClick={() => navigate('/help')}
            className="bg-gradient-to-r from-hangang-500 to-hangang-600 text-white font-bold py-4 px-6 rounded-xl hover:from-hangang-600 hover:to-hangang-700 transition-all duration-300 transform hover:scale-105 font-korean"
          >
            ❓ 도움말 보기
          </button>

          <button
            onClick={handleLogout}
            disabled={loading}
            className="bg-gradient-to-r from-red-500 to-red-600 text-white font-bold py-4 px-6 rounded-xl hover:from-red-600 hover:to-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 font-korean"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                로그아웃 중...
              </span>
            ) : (
              '🚪 로그아웃'
            )}
          </button>
        </div>

        {/* 하단 안내 */}
        <div className="mt-8 text-center">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-soft">
            <p className="text-gray-600 font-korean">
              💡 <strong>문의사항이 있으신가요?</strong><br/>
              관리자에게 연락하시거나 도움말을 확인해주세요.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings; 