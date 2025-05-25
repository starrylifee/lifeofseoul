import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, query, where, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore';

const Dashboard = () => {
  const { currentUser, classId, isTeacher, isStudent } = useAuth();
  const [loading, setLoading] = useState(true);
  const [lessonProgress, setLessonProgress] = useState([]);
  const [overallProgress, setOverallProgress] = useState({ completed: 0, total: 8 });
  const navigate = useNavigate();

  // 레슨 목록 정의
  const lessonList = [
    { id: '1', title: '1차시: 서울의 모습과 특성', icon: '🏙️' },
    { id: '2', title: '2차시: 한강과 서울의 하천', icon: '🌊' },
    { id: '3', title: '3차시: 서울의 도로와 지하철', icon: '🚇' },
    { id: '4', title: '4차시: 교통의 중심지', icon: '🚉' },
    { id: '5', title: '5차시: 행정의 중심지', icon: '🏛️' },
    { id: '6', title: '6차시: 문화의 중심지', icon: '🎭' },
    { id: '7', title: '7차시: 서울의 궁궐', icon: '🏯' },
    { id: '8', title: '8차시: 한양도성의 성곽과 대문', icon: '🏰' },
  ];

  // 레슨 진행 상태 불러오기
  useEffect(() => {
    const fetchLessonProgress = async () => {
      if (!currentUser) return;

      try {
        const progressData = [];
        let completedCount = 0;

        // 각 레슨에 대해 진행 상태 확인
        for (const lesson of lessonList) {
          const activityDocRef = doc(db, "lessons", lesson.id, "activities", currentUser.uid);
          const activityDoc = await getDoc(activityDocRef);
          
          let status = 'not_started'; // 시작하지 않음
          let completionRate = 0;
          
          if (activityDoc.exists()) {
            const data = activityDoc.data();
            
            // 확인문제 완료 여부 체크
            const questionsCompleted = data.questionsCompleted || 0;
            const totalQuestions = 8; // 각 레슨마다 8개 문제
            completionRate = Math.round((questionsCompleted / totalQuestions) * 100);
            
            if (questionsCompleted === 0) {
              status = 'in_progress'; // 진행 중
            } else if (questionsCompleted === totalQuestions) {
              status = 'completed'; // 완료
              completedCount++;
            } else {
              status = 'in_progress'; // 진행 중
            }
          }
          
          progressData.push({
            ...lesson,
            status,
            completionRate,
            questionsCompleted: activityDoc.exists() ? (activityDoc.data().questionsCompleted || 0) : 0
          });
        }

        setLessonProgress(progressData);
        setOverallProgress({ completed: completedCount, total: lessonList.length });
        setLoading(false);
      } catch (error) {
        console.error("Error fetching lesson progress:", error);
        setLoading(false);
      }
    };

    if (currentUser) {
      fetchLessonProgress();
    }
  }, [currentUser]);

  // 상태별 스타일 및 텍스트 반환
  const getStatusInfo = (status, completionRate) => {
    switch (status) {
      case 'completed':
        return {
          text: '완료',
          bgColor: 'bg-green-100',
          textColor: 'text-green-700',
          icon: '✅',
          borderColor: 'border-green-200'
        };
      case 'in_progress':
        return {
          text: `진행 중 (${completionRate}%)`,
          bgColor: 'bg-yellow-100',
          textColor: 'text-yellow-700',
          icon: '⏳',
          borderColor: 'border-yellow-200'
        };
      default:
        return {
          text: '시작하기',
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-700',
          icon: '▶️',
          borderColor: 'border-gray-200'
        };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-friendly-mint via-white to-friendly-pink flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-seoul-500 mx-auto mb-4"></div>
          <p className="text-gray-600 font-korean">학습 진행 상태를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-friendly-mint via-white to-friendly-pink">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {/* 환영 메시지 */}
        <div className="text-center mb-8 md:mb-12">
          <div className="inline-block bg-white rounded-3xl p-6 md:p-8 shadow-friendly mb-6">
            <span className="text-6xl md:text-8xl">🎓</span>
          </div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-800 mb-4 font-korean">
            안녕하세요, {currentUser?.email.split('@')[0]}님! 👋
          </h1>
          <p className="text-lg md:text-xl text-gray-600 font-korean">
            오늘도 서울에 대해 재미있게 배워볼까요?
          </p>
          
          {/* 전체 진행률 표시 */}
          {isStudent() && (
            <div className="mt-6 bg-white rounded-2xl p-6 shadow-soft max-w-md mx-auto">
              <h3 className="text-lg font-bold text-gray-800 mb-3 font-korean">📊 전체 학습 진행률</h3>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600 font-korean">
                  완료한 수업: {overallProgress.completed}/{overallProgress.total}개
                </span>
                <span className="text-sm font-bold text-seoul-600">
                  {Math.round((overallProgress.completed / overallProgress.total) * 100)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-seoul-400 to-seoul-600 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${(overallProgress.completed / overallProgress.total) * 100}%` }}
                ></div>
              </div>
              <div className="mt-3 flex justify-center space-x-4 text-xs">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-400 rounded-full mr-1"></div>
                  <span className="text-gray-600 font-korean">완료</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-yellow-400 rounded-full mr-1"></div>
                  <span className="text-gray-600 font-korean">진행 중</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-gray-400 rounded-full mr-1"></div>
                  <span className="text-gray-600 font-korean">시작 전</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 레슨 진행 상태 카드들 (학생용) */}
        {isStudent() && (
          <div className="mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6 text-center font-korean">
              📚 수업별 진행 상황
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {lessonProgress.map((lesson) => {
                const statusInfo = getStatusInfo(lesson.status, lesson.completionRate);
                return (
                  <Link
                    key={lesson.id}
                    to={`/lesson/${lesson.id}`}
                    className={`group bg-white rounded-2xl p-4 md:p-6 shadow-soft hover:shadow-friendly transition-all duration-300 hover:scale-105 border-2 ${statusInfo.borderColor}`}
                  >
                    <div className="text-center">
                      <div className="text-3xl md:text-4xl mb-3">
                        {lesson.icon}
                      </div>
                      <h3 className="text-sm md:text-base font-bold text-gray-800 mb-2 font-korean line-clamp-2">
                        {lesson.title}
                      </h3>
                      <div className={`${statusInfo.bgColor} rounded-xl p-2 mb-3`}>
                        <span className={`${statusInfo.textColor} font-medium text-xs md:text-sm font-korean`}>
                          {statusInfo.icon} {statusInfo.text}
                        </span>
                      </div>
                      {lesson.status === 'in_progress' && (
                        <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                          <div 
                            className="bg-gradient-to-r from-yellow-400 to-yellow-600 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${lesson.completionRate}%` }}
                          ></div>
                        </div>
                      )}
                      {lesson.status === 'completed' && (
                        <div className="w-full bg-green-200 rounded-full h-2 mb-2">
                          <div className="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full w-full"></div>
                        </div>
                      )}
                      <p className="text-xs text-gray-500 font-korean">
                        문제: {lesson.questionsCompleted}/8개 완료
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* 메뉴 카드들 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {/* 교실 들어가기 */}
          <Link 
            to="/lesson/1" 
            className="group bg-white rounded-3xl p-6 md:p-8 shadow-soft hover:shadow-friendly transition-all duration-300 hover:scale-105 border-2 border-transparent hover:border-seoul-200"
          >
            <div className="text-center">
              <div className="bg-gradient-to-br from-seoul-400 to-seoul-600 rounded-2xl p-4 md:p-6 mb-4 inline-block">
                <span className="text-4xl md:text-5xl">🏫</span>
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-gray-800 mb-2 font-korean">
                교실 들어가기
              </h3>
              <p className="text-gray-600 text-sm md:text-base font-korean">
                첫 번째 수업부터 시작해보세요!
              </p>
              <div className="mt-4 bg-seoul-50 rounded-xl p-3">
                <span className="text-seoul-600 font-medium text-sm font-korean">
                  📚 1차시: 서울의 모습과 특성
                </span>
              </div>
            </div>
          </Link>

          {/* 수업 목록 보기 */}
          <Link 
            to="/classroom" 
            className="group bg-white rounded-3xl p-6 md:p-8 shadow-soft hover:shadow-friendly transition-all duration-300 hover:scale-105 border-2 border-transparent hover:border-hangang-200"
          >
            <div className="text-center">
              <div className="bg-gradient-to-br from-hangang-400 to-hangang-600 rounded-2xl p-4 md:p-6 mb-4 inline-block">
                <span className="text-4xl md:text-5xl">📚</span>
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-gray-800 mb-2 font-korean">
                수업 목록 보기
              </h3>
              <p className="text-gray-600 text-sm md:text-base font-korean">
                8개의 모든 수업을 한눈에 확인하세요!
              </p>
              <div className="mt-4 bg-hangang-50 rounded-xl p-3">
                <span className="text-hangang-600 font-medium text-sm font-korean">
                  🗂️ 전체 커리큘럼 보기
                </span>
              </div>
            </div>
          </Link>

          {/* 내 학습 현황 */}
          <Link 
            to="/progress" 
            className="group bg-white rounded-3xl p-6 md:p-8 shadow-soft hover:shadow-friendly transition-all duration-300 hover:scale-105 border-2 border-hangang-100 hover:border-hangang-200"
          >
            <div className="text-center">
              <div className="bg-gradient-to-br from-hangang-400 to-hangang-600 rounded-2xl p-4 md:p-6 mb-4 inline-block">
                <span className="text-4xl md:text-5xl">📊</span>
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-gray-800 mb-2 font-korean">
                내 학습 현황
              </h3>
              <p className="text-gray-600 text-sm md:text-base font-korean">
                지금까지의 학습 기록을 확인해보세요
              </p>
              <div className="mt-4 space-y-2">
                <div className="bg-hangang-50 rounded-xl p-3">
                  <span className="text-hangang-600 font-medium text-sm font-korean">
                    🎯 완료한 수업: {overallProgress.completed}/{overallProgress.total}개
                  </span>
                </div>
                <div className="bg-sunshine-50 rounded-xl p-3">
                  <span className="text-sunshine-600 font-medium text-sm font-korean">
                    ⭐ 획득한 별: {overallProgress.completed}개
                  </span>
                </div>
              </div>
            </div>
          </Link>

          {/* 서울 탐험하기 */}
          <Link 
            to="/explore" 
            className="group bg-white rounded-3xl p-6 md:p-8 shadow-soft hover:shadow-friendly transition-all duration-300 hover:scale-105 border-2 border-sunshine-100 hover:border-sunshine-200"
          >
            <div className="text-center">
              <div className="bg-gradient-to-br from-sunshine-400 to-sunshine-600 rounded-2xl p-4 md:p-6 mb-4 inline-block">
                <span className="text-4xl md:text-5xl">🗺️</span>
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-gray-800 mb-2 font-korean">
                서울 탐험하기
              </h3>
              <p className="text-gray-600 text-sm md:text-base font-korean">
                지도에서 서울의 다양한 모습을 발견해보세요
              </p>
              <div className="mt-4 bg-sunshine-50 rounded-xl p-3">
                <span className="text-sunshine-600 font-medium text-sm font-korean">
                  🏛️ 궁궐, 🏞️ 공원, 🌉 한강 등
                </span>
              </div>
            </div>
          </Link>

          {/* 친구들과 공유 */}
          <Link 
            to="/share" 
            className="group bg-white rounded-3xl p-6 md:p-8 shadow-soft hover:shadow-friendly transition-all duration-300 hover:scale-105 border-2 border-purple-100 hover:border-purple-200"
          >
            <div className="text-center">
              <div className="bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl p-4 md:p-6 mb-4 inline-block">
                <span className="text-4xl md:text-5xl">👥</span>
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-gray-800 mb-2 font-korean">
                친구들과 공유
              </h3>
              <p className="text-gray-600 text-sm md:text-base font-korean">
                내가 만든 지도를 친구들과 나눠보세요
              </p>
              <div className="mt-4 bg-purple-50 rounded-xl p-3">
                <span className="text-purple-600 font-medium text-sm font-korean">
                  💬 학급 공유 보기
                </span>
              </div>
            </div>
          </Link>

          {/* 도움말 */}
          <Link 
            to="/help" 
            className="group bg-white rounded-3xl p-6 md:p-8 shadow-soft hover:shadow-friendly transition-all duration-300 hover:scale-105 border-2 border-pink-100 hover:border-pink-200"
          >
            <div className="text-center">
              <div className="bg-gradient-to-br from-pink-400 to-pink-600 rounded-2xl p-4 md:p-6 mb-4 inline-block">
                <span className="text-4xl md:text-5xl">❓</span>
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-gray-800 mb-2 font-korean">
                도움말
              </h3>
              <p className="text-gray-600 text-sm md:text-base font-korean">
                사용법이 궁금하다면 여기를 확인하세요
              </p>
              <div className="mt-4 bg-pink-50 rounded-xl p-3">
                <span className="text-pink-600 font-medium text-sm font-korean">
                  📖 사용 가이드 보기
                </span>
              </div>
            </div>
          </Link>

          {/* 설정 */}
          <Link 
            to="/settings" 
            className="group bg-white rounded-3xl p-6 md:p-8 shadow-soft hover:shadow-friendly transition-all duration-300 hover:scale-105 border-2 border-gray-100 hover:border-gray-200"
          >
            <div className="text-center">
              <div className="bg-gradient-to-br from-gray-400 to-gray-600 rounded-2xl p-4 md:p-6 mb-4 inline-block">
                <span className="text-4xl md:text-5xl">⚙️</span>
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-gray-800 mb-2 font-korean">
                설정
              </h3>
              <p className="text-gray-600 text-sm md:text-base font-korean">
                내 정보와 앱 설정을 변경할 수 있어요
              </p>
              <div className="mt-4 bg-gray-50 rounded-xl p-3">
                <span className="text-gray-600 font-medium text-sm font-korean">
                  🔧 개인 설정 관리
                </span>
              </div>
            </div>
          </Link>
        </div>

        {/* 하단 안내 */}
        <div className="mt-12 text-center">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-soft">
            <p className="text-gray-600 font-korean">
              💡 <strong>팁:</strong> 각 수업에서 지도에 마커를 추가하고, 
              서울의 위치 관계를 직접 탐험해보세요!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 