import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, query, where, doc, getDoc, getDocs } from 'firebase/firestore';
import StarLevelDisplay from '../components/StarLevelDisplay';
import TeacherStarPanel from '../components/TeacherStarPanel';
import { getStudentStars } from '../utils/starAPI';
import ClassPetCard from '../components/ClassPetCard';

const Dashboard = () => {
  const { currentUser, isTeacher, isStudent, teacherId } = useAuth();
  const [loading, setLoading] = useState(true);
  const [lessonProgress, setLessonProgress] = useState([]);
  const [overallProgress, setOverallProgress] = useState({ completed: 0, total: 8 });
  const [totalStars, setTotalStars] = useState(0);
  const [classDoc, setClassDoc] = useState(null);

  // 학생 수 기반 레벨 임계값: L2=1.0×N, L3=2.0×N, L4=4.0×N (최소 1)
  const levelThreshold = (level, studentCount) => {
    const multipliers = [0, 1.0, 2.0, 4.0];
    const base = (multipliers[level] || 0) * (studentCount || 0);
    return Math.max(1, Math.round(base));
  };

  // 레슨 목록 정의
  const lessonList = useMemo(() => ([
    { id: '1', title: '1차시: 서울의 모습과 특성', icon: '🏙️' },
    { id: '2', title: '2차시: 한강과 서울의 하천', icon: '🌊' },
    { id: '3', title: '3차시: 서울의 도로와 지하철', icon: '🚇' },
    { id: '4', title: '4차시: 교통의 중심지', icon: '🚉' },
    { id: '5', title: '5차시: 행정의 중심지', icon: '🏛️' },
    { id: '6', title: '6차시: 문화의 중심지', icon: '🎭' },
    { id: '7', title: '7차시: 서울의 궁궐', icon: '🏯' },
    { id: '8', title: '8차시: 한양도성의 성곽과 대문', icon: '🏰' },
  ]), []);

  // 레슨별 총 문항 수 로드 유틸 (config.js의 questions.length 기반)
  const loadLessonTotals = useCallback(async (lessons) => {
    const entries = await Promise.all(
      lessons.map(async (lesson) => {
        try {
          const mod = await import(`../lessons/lesson${lesson.id}/config.js`);
          const count = Array.isArray(mod.default?.questions)
            ? mod.default.questions.length
            : 8;
          return [lesson.id, count];
        } catch (e) {
          return [lesson.id, 8];
        }
      })
    );
    return Object.fromEntries(entries);
  }, []);

  // 학생 개인 레슨 진행 상태/별 수 로드
  useEffect(() => {
    const fetchLessonProgress = async () => {
      if (!currentUser) return;

      try {
        const progressData = [];
        let completedCount = 0;

        const userActivitiesPromises = lessonList.map(lesson => 
          getDoc(doc(db, "lessons", lesson.id, "activities", currentUser.uid))
        );
        const userActivitiesDocs = await Promise.all(userActivitiesPromises);
        const totalMap = await loadLessonTotals(lessonList);

        lessonList.forEach((lesson, index) => {
          const activityDoc = userActivitiesDocs[index];
          let status = 'not_started';
          let completionRate = 0;
          let totalQuestions = totalMap[lesson.id] || 8;
          let questionsCompleted = 0;
          if (activityDoc.exists()) {
            const data = activityDoc.data();
            questionsCompleted = data.questionsCompleted || 0;
            totalQuestions = data.totalQuestions || totalMap[lesson.id] || 8;
            completionRate = Math.round((questionsCompleted / totalQuestions) * 100);
            if (questionsCompleted === 0) status = 'in_progress';
            else if (questionsCompleted === totalQuestions) { status = 'completed'; completedCount++; }
            else status = 'in_progress';
          }
          progressData.push({
            ...lesson,
            status,
            completionRate,
            questionsCompleted,
            totalQuestions
          });
        });

        setLessonProgress(progressData);
        setOverallProgress({ completed: completedCount, total: lessonList.length });

        if (isStudent()) {
          const stars = await getStudentStars(currentUser.uid);
          setTotalStars(stars);
        }

        setLoading(false);
      } catch (error) {
        console.error("Error fetching lesson progress:", error);
        setLoading(false);
      }
    };

    if (currentUser) {
      fetchLessonProgress();
    }
  }, [currentUser, isStudent, lessonList, loadLessonTotals]);

  // 학생용: 반 해치 데이터(teacherId 기반) 로드
  useEffect(() => {
    const fetchClassData = async () => {
      if (!isStudent() || !teacherId) return;
      try {
        // 반 학생 목록 (teacherId)
        const studentsQuery = query(
          collection(db, 'users'),
          where('role', '==', 'student'),
          where('teacherId', '==', teacherId)
        );
        const studentsSnap = await getDocs(studentsQuery);
        const studentList = studentsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

        // 별 합산 및 차시 완료율 계산
        const starList = await Promise.all(studentList.map(async s => ({ id: s.id, stars: await getStudentStars(s.id) })));
        const totalClassStars = starList.reduce((sum, s) => sum + s.stars, 0);

        // 레벨 계산 (학생 수 기반), 저장된 값이 있으면 하락 금지
        const studentCount = studentList.length;
        let lvl = 1; let xpNeed = levelThreshold(1, studentCount); let xpLeft = totalClassStars;
        while (xpLeft >= xpNeed && lvl < 4) { xpLeft -= xpNeed; lvl += 1; xpNeed = levelThreshold(lvl, studentCount); }
        const nextXp = levelThreshold(lvl, studentCount);

        // 차시 해금(60% 이상 완료)
        const totalMap = await loadLessonTotals(lessonList);
        const completionCounts = await Promise.all(lessonList.map(async (lesson) => {
          let completed = 0;
          const denom = totalMap[lesson.id] || 8;
          for (const s of studentList) {
            const activity = await getDoc(doc(db, 'lessons', lesson.id, 'activities', s.id));
            const qc = activity.exists() ? (activity.data().questionsCompleted || 0) : 0;
            const tq = activity.exists() ? (activity.data().totalQuestions || denom) : denom;
            if (qc >= tq) completed++;
          }
          return completed;
        }));
        const unlockedLessons = completionCounts.map(cnt => (studentList.length ? (cnt / studentList.length) >= 0.6 : false));

        setClassDoc({ xp: totalClassStars, level: lvl, nextLevelXp: nextXp, unlockedLessons });
      } catch (e) {
        console.error('Error loading class pet for student:', e);
      }
    };
    fetchClassData();
  }, [isStudent, teacherId, lessonList, loadLessonTotals]);

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

          {/* 학생용 반 해치 카드 */}
          {isStudent() && classDoc && (
            <div className="mt-8">
              <ClassPetCard xp={classDoc.xp} level={classDoc.level} nextLevelXp={classDoc.nextLevelXp} unlockedLessons={classDoc.unlockedLessons} />
            </div>
          )}

          {/* 학생용 펫 시스템과 진행률 */}
          {isStudent() && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8 md:mb-12">
              {/* 펫과 레벨 시스템 */}
              <StarLevelDisplay userId={currentUser?.uid} />
              {/* 전체 진행률 표시 */}
              <div className="bg-white rounded-3xl p-6 shadow-soft">
                <h3 className="text-xl font-bold text-gray-800 mb-4 font-korean">📊 학습 진행률</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600 font-korean">완료한 수업</span>
                    <span className="text-lg font-bold text-seoul-600">{overallProgress.completed}/{overallProgress.total}개</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-4">
                    <div className="bg-gradient-to-r from-seoul-400 to-seoul-600 h-4 rounded-full transition-all duration-500" style={{ width: `${(overallProgress.completed / overallProgress.total) * 100}%` }}></div>
                  </div>
                  <div className="text-center text-sm font-bold text-seoul-600">{Math.round((overallProgress.completed / overallProgress.total) * 100)}% 완료</div>
                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-600 font-korean">획득한 별</span>
                      <span className="text-lg font-bold text-yellow-600">⭐ {totalStars}개</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 교사용 별 지급 시스템 */}
          {isTeacher() && (
            <div className="mb-8 md:mb-12">
              <TeacherStarPanel />
            </div>
          )}
        </div>

        {/* 레슨 진행 상태 카드들 (학생용) */}
        {isStudent() && (
          <div className="mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6 text-center font-korean">📚 수업별 진행 상황</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {lessonProgress.map((lesson) => {
                const statusInfo = getStatusInfo(lesson.status, lesson.completionRate);
                return (
                  <Link key={lesson.id} to={`/lesson/${lesson.id}`} className={`group bg-white rounded-2xl p-4 md:p-6 shadow-soft hover:shadow-friendly transition-all duration-300 hover:scale-105 border-2 ${statusInfo.borderColor}`}>
                    <div className="text-center">
                      <div className="text-3xl md:text-4xl mb-3">{lesson.icon}</div>
                      <h3 className="text-sm md:text-base font-bold text-gray-800 mb-2 font-korean line-clamp-2">{lesson.title}</h3>
                      <div className={`${statusInfo.bgColor} rounded-xl p-2 mb-3`}>
                        <span className={`${statusInfo.textColor} font-medium text-xs md:text-sm font-korean`}>{statusInfo.icon} {statusInfo.text}</span>
                      </div>
                      {lesson.status === 'in_progress' && (
                        <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                          <div className="bg-gradient-to-r from-yellow-400 to-yellow-600 h-2 rounded-full transition-all duration-500" style={{ width: `${lesson.completionRate}%` }}></div>
                        </div>
                      )}
                      {lesson.status === 'completed' && (
                        <div className="w-full bg-green-200 rounded-full h-2 mb-2">
                          <div className="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full w-full"></div>
                        </div>
                      )}
                      <p className="text-xs text-gray-500 font-korean">문제: {lesson.questionsCompleted}/{lesson.totalQuestions || 8}개 완료</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* 메뉴 카드들 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {/* 교사용 메뉴 */}
          {isTeacher() && (
            <>
              <Link to="/teacher-progress" className="group bg-white rounded-3xl p-6 md:p-8 shadow-soft hover:shadow-friendly transition-all duration-300 hover:scale-105 border-2 border-transparent hover:border-hangang-200">
                <div className="text-center">
                  <div className="bg-gradient-to-br from-hangang-400 to-hangang-600 rounded-2xl p-4 md:p-6 mb-4 inline-block">
                    <span className="text-4xl md:text-5xl">📊</span>
                  </div>
                  <h3 className="text-xl md:text-2xl font-bold text-gray-800 mb-2 font-korean">학급 진행 현황</h3>
                  <p className="text-gray-600 text-sm md:text-base font-korean">학생들의 학습 진행 상황을 확인하세요</p>
                  <div className="mt-4 bg-hangang-50 rounded-xl p-3"><span className="text-hangang-600 font-medium text-sm font-korean">📈 전체 학급 분석</span></div>
                </div>
              </Link>
              <Link to="/explore" className="group bg-white rounded-3xl p-6 md:p-8 shadow-soft hover:shadow-friendly transition-all duration-300 hover:scale-105 border-2 border-sunshine-100 hover:border-sunshine-200">
                <div className="text-center">
                  <div className="bg-gradient-to-br from-sunshine-400 to-sunshine-600 rounded-2xl p-4 md:p-6 mb-4 inline-block">
                    <span className="text-4xl md:text-5xl">🗺️</span>
                  </div>
                  <h3 className="text-xl md:text-2xl font-bold text-gray-800 mb-2 font-korean">서울 탐험하기</h3>
                  <p className="text-gray-600 text-sm md:text-base font-korean">서울 지도에서 자유롭게 탐험해보세요</p>
                  <div className="mt-4 bg-sunshine-50 rounded-xl p-3"><span className="text-sunshine-600 font-medium text-sm font-korean">🧭 서울+경기도 범위 지도</span></div>
                </div>
              </Link>
            </>
          )}

          {/* 공통/학생 메뉴들 이하 기존 유지 */}
          {isStudent() && (
            <Link to="/lesson/1" className="group bg-white rounded-3xl p-6 md:p-8 shadow-soft hover:shadow-friendly transition-all duration-300 hover:scale-105 border-2 border-transparent hover:border-seoul-200">
              <div className="text-center">
                <div className="bg-gradient-to-br from-seoul-400 to-seoul-600 rounded-2xl p-4 md:p-6 mb-4 inline-block"><span className="text-4xl md:text-5xl">🏫</span></div>
                <h3 className="text-xl md:text-2xl font-bold text-gray-800 mb-2 font-korean">교실 들어가기</h3>
                <p className="text-gray-600 text-sm md:text-base font-korean">첫 번째 수업부터 시작해보세요!</p>
                <div className="mt-4 bg-seoul-50 rounded-xl p-3"><span className="text-seoul-600 font-medium text-sm font-korean">📚 1차시: 서울의 모습과 특성</span></div>
              </div>
            </Link>
          )}

          <Link to="/classroom" className="group bg-white rounded-3xl p-6 md:p-8 shadow-soft hover:shadow-friendly transition-all duration-300 hover:scale-105 border-2 border-transparent hover:border-hangang-200">
            <div className="text-center">
              <div className="bg-gradient-to-br from-hangang-400 to-hangang-600 rounded-2xl p-4 md:p-6 mb-4 inline-block"><span className="text-4xl md:text-5xl">📚</span></div>
              <h3 className="text-xl md:text-2xl font-bold text-gray-800 mb-2 font-korean">수업 목록 보기</h3>
              <p className="text-gray-600 text-sm md:text-base font-korean">8개의 모든 수업을 한눈에 확인하세요!</p>
              <div className="mt-4 bg-hangang-50 rounded-xl p-3"><span className="text-hangang-600 font-medium text-sm font-korean">🗂️ 전체 커리큘럼 보기</span></div>
            </div>
          </Link>

          {isStudent() && (
            <Link to="/progress" className="group bg-white rounded-3xl p-6 md:p-8 shadow-soft hover:shadow-friendly transition-all duration-300 hover:scale-105 border-2 border-hangang-100 hover:border-hangang-200">
              <div className="text-center">
                <div className="bg-gradient-to-br from-hangang-400 to-hangang-600 rounded-2xl p-4 md:p-6 mb-4 inline-block"><span className="text-4xl md:text-5xl">📊</span></div>
                <h3 className="text-xl md:text-2xl font-bold text-gray-800 mb-2 font-korean">내 학습 현황</h3>
                <p className="text-gray-600 text-sm md:text-base font-korean">지금까지의 학습 기록을 확인해보세요</p>
                <div className="mt-4 space-y-2">
                  <div className="bg-hangang-50 rounded-xl p-3"><span className="text-hangang-600 font-medium text-sm font-korean">🎯 완료한 수업: {overallProgress.completed}/{overallProgress.total}개</span></div>
                  <div className="bg-sunshine-50 rounded-xl p-3"><span className="text-sunshine-600 font-medium text-sm font-korean">⭐ 획득한 별: {totalStars}개</span></div>
                </div>
              </div>
            </Link>
          )}

          {/* 설정 카드 - 모든 사용자에게 표시 */}
          <Link to="/settings" className="group bg-white rounded-3xl p-6 md:p-8 shadow-soft hover:shadow-friendly transition-all duration-300 hover:scale-105 border-2 border-gray-100 hover:border-gray-200">
            <div className="text-center">
              <div className="bg-gradient-to-br from-gray-400 to-gray-600 rounded-2xl p-4 md:p-6 mb-4 inline-block"><span className="text-4xl md:text-5xl">⚙️</span></div>
              <h3 className="text-xl md:text-2xl font-bold text-gray-800 mb-2 font-korean">설정</h3>
              <p className="text-gray-600 text-sm md:text-base font-korean">계정 정보와 앱 설정을 변경할 수 있어요</p>
              <div className="mt-4 bg-gray-50 rounded-xl p-3"><span className="text-gray-600 font-medium text-sm font-korean">🔧 개인 설정 관리</span></div>
            </div>
          </Link>

          {isStudent() && (
            <>
              <Link to="/explore" className="group bg-white rounded-3xl p-6 md:p-8 shadow-soft hover:shadow-friendly transition-all duration-300 hover:scale-105 border-2 border-sunshine-100 hover:border-sunshine-200">
                <div className="text-center">
                  <div className="bg-gradient-to-br from-sunshine-400 to-sunshine-600 rounded-2xl p-4 md:p-6 mb-4 inline-block"><span className="text-4xl md:text-5xl">🗺️</span></div>
                  <h3 className="text-xl md:text-2xl font-bold text-gray-800 mb-2 font-korean">서울 탐험하기</h3>
                  <p className="text-gray-600 text-sm md:text-base font-korean">서울+경기도 범위의 기본 지도를 확인해보세요</p>
                  <div className="mt-4 bg-sunshine-50 rounded-xl p-3"><span className="text-sunshine-600 font-medium text-sm font-korean">서울 경계선(레슨1과 동일) 표시</span></div>
                </div>
              </Link>
              {/* 친구들과 공유 항목 제거 */}
            </>
          )}

          <Link to="/help" className="group bg-white rounded-3xl p-6 md:p-8 shadow-soft hover:shadow-friendly transition-all duration-300 hover:scale-105 border-2 border-pink-100 hover:border-pink-200">
            <div className="text-center">
              <div className="bg-gradient-to-br from-pink-400 to-pink-600 rounded-2xl p-4 md:p-6 mb-4 inline-block"><span className="text-4xl md:text-5xl">❓</span></div>
              <h3 className="text-xl md:text-2xl font-bold text-gray-800 mb-2 font-korean">도움말</h3>
              <p className="text-gray-600 text-sm md:text-base font-korean">사용법이 궁금하다면 여기를 확인하세요</p>
              <div className="mt-4 bg-pink-50 rounded-xl p-3"><span className="text-pink-600 font-medium text-sm font-korean">📖 사용 가이드 보기</span></div>
            </div>
          </Link>
        </div>

        <div className="mt-12 text-center">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-soft">
            <p className="text-gray-600 font-korean">💡 <strong>팁:</strong> 각 수업에서 지도에 마커를 추가하고, 서울의 위치 관계를 직접 탐험해보세요!</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 