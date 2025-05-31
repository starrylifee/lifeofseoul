import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, query, where, getDocs, doc, getDoc, orderBy } from 'firebase/firestore';
import { getStudentStars, getClassStarRanking } from '../utils/starAPI';
import StarLevelDisplay from '../components/StarLevelDisplay';

const Progress = () => {
  const { currentUser, classId, isStudent } = useAuth();
  const [personalStats, setPersonalStats] = useState({
    totalStars: 0,
    completedLessons: 0,
    totalMarkers: 0,
    classRank: 0,
    totalClassmates: 0
  });
  const [lessonProgress, setLessonProgress] = useState([]);
  const [starHistory, setStarHistory] = useState([]);
  const [recentMarkers, setRecentMarkers] = useState([]);
  const [loading, setLoading] = useState(true);

  // 레슨 목록
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

  useEffect(() => {
    if (!isStudent() || !currentUser) {
      setLoading(false);
      return;
    }

    fetchPersonalProgress();
  }, [currentUser, classId]);

  const fetchPersonalProgress = async () => {
    try {
      setLoading(true);
      
      // 개인 레슨 진행률 가져오기
      const progressData = [];
      let completedCount = 0;
      let totalMarkers = 0;
      const allMarkers = [];

      for (const lesson of lessonList) {
        try {
          const activityDoc = await getDoc(doc(db, "lessons", lesson.id, "activities", currentUser.uid));
          
          let status = 'not_started';
          let completionRate = 0;
          let markerCount = 0;
          let questionsCompleted = 0;
          
          if (activityDoc.exists()) {
            const data = activityDoc.data();
            questionsCompleted = data.questionsCompleted || 0;
            const markers = data.markers || [];
            markerCount = markers.length;
            
            // 마커 정보 저장 (최근 생성된 것들)
            markers.forEach(marker => {
              allMarkers.push({
                ...marker,
                lessonId: lesson.id,
                lessonTitle: lesson.title,
                lessonIcon: lesson.icon
              });
            });
            
            const totalQuestions = 8;
            completionRate = Math.round((questionsCompleted / totalQuestions) * 100);
            
            if (questionsCompleted === 0) {
              status = 'in_progress';
            } else if (questionsCompleted === totalQuestions) {
              status = 'completed';
              completedCount++;
            } else {
              status = 'in_progress';
            }
            
            totalMarkers += markerCount;
          }
          
          progressData.push({
            ...lesson,
            status,
            completionRate,
            questionsCompleted,
            markerCount
          });
        } catch (error) {
          console.error(`Error fetching lesson ${lesson.id}:`, error);
        }
      }

      setLessonProgress(progressData);

      // 최근 마커 정렬 (날짜순)
      const sortedMarkers = allMarkers
        .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
        .slice(0, 5);
      setRecentMarkers(sortedMarkers);

      // 개인 별 개수 가져오기
      const totalStars = await getStudentStars(currentUser.uid);

      // 학급 순위 가져오기
      let classRank = 0;
      let totalClassmates = 0;
      if (classId) {
        try {
          const ranking = await getClassStarRanking(classId);
          totalClassmates = ranking.length;
          const myRankIndex = ranking.findIndex(student => student.userId === currentUser.uid);
          classRank = myRankIndex >= 0 ? myRankIndex + 1 : totalClassmates + 1;
        } catch (error) {
          console.error('Error fetching class ranking:', error);
        }
      }

      // 별 히스토리 가져오기 (최근 10개)
      try {
        const starHistoryQuery = query(
          collection(db, "stars"),
          where("studentId", "==", currentUser.uid),
          orderBy("timestamp", "desc")
        );
        
        const starHistorySnapshot = await getDocs(starHistoryQuery);
        const history = starHistorySnapshot.docs.slice(0, 10).map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setStarHistory(history);
      } catch (error) {
        console.error('Error fetching star history:', error);
      }

      setPersonalStats({
        totalStars,
        completedLessons: completedCount,
        totalMarkers,
        classRank,
        totalClassmates
      });

    } catch (error) {
      console.error('Error fetching personal progress:', error);
    } finally {
      setLoading(false);
    }
  };

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

  const formatDate = (timestamp) => {
    if (!timestamp) return '날짜 없음';
    const date = new Date(timestamp);
    return date.toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isStudent()) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-friendly-mint via-white to-friendly-pink flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">접근 권한 없음</h1>
          <p className="text-gray-600">학생만 접근할 수 있는 페이지입니다.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-friendly-mint via-white to-friendly-pink flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-seoul-500 mx-auto mb-4"></div>
          <p className="text-gray-600 font-korean">학습 현황을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-friendly-mint via-white to-friendly-pink">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4 font-korean">
            📊 내 학습 현황
          </h1>
          <p className="text-lg text-gray-600 font-korean">
            {currentUser?.email.split('@')[0]}님의 학습 기록을 확인해보세요
          </p>
        </div>

        {/* 개인 통계 및 레벨 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* 펫과 레벨 시스템 */}
          <StarLevelDisplay userId={currentUser?.uid} />
          
          {/* 개인 통계 */}
          <div className="bg-white rounded-3xl p-6 shadow-soft">
            <h3 className="text-xl font-bold text-gray-800 mb-4 font-korean">📈 나의 성과</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-yellow-50 rounded-xl">
                <div className="text-2xl mb-1">⭐</div>
                <div className="text-sm text-gray-600 font-korean">획득한 별</div>
                <div className="text-xl font-bold text-yellow-600">{personalStats.totalStars}개</div>
              </div>
              
              <div className="text-center p-4 bg-green-50 rounded-xl">
                <div className="text-2xl mb-1">✅</div>
                <div className="text-sm text-gray-600 font-korean">완료한 수업</div>
                <div className="text-xl font-bold text-green-600">{personalStats.completedLessons}/8개</div>
              </div>
              
              <div className="text-center p-4 bg-blue-50 rounded-xl">
                <div className="text-2xl mb-1">📍</div>
                <div className="text-sm text-gray-600 font-korean">생성한 마커</div>
                <div className="text-xl font-bold text-blue-600">{personalStats.totalMarkers}개</div>
              </div>
              
              <div className="text-center p-4 bg-purple-50 rounded-xl">
                <div className="text-2xl mb-1">🏆</div>
                <div className="text-sm text-gray-600 font-korean">학급 순위</div>
                <div className="text-xl font-bold text-purple-600">
                  {personalStats.classRank}/{personalStats.totalClassmates}등
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 레슨별 진행률 */}
        <div className="bg-white rounded-3xl p-6 shadow-soft mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 font-korean">📚 레슨별 진행률</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {lessonProgress.map((lesson) => {
              const statusInfo = getStatusInfo(lesson.status, lesson.completionRate);
              return (
                <div key={lesson.id} className={`border-2 ${statusInfo.borderColor} rounded-xl p-4`}>
                  <div className="text-center">
                    <div className="text-2xl mb-2">{lesson.icon}</div>
                    <h3 className="font-bold text-gray-800 text-sm font-korean mb-2 line-clamp-2">
                      {lesson.title}
                    </h3>
                    <div className={`${statusInfo.bgColor} rounded-lg p-2 mb-3`}>
                      <span className={`${statusInfo.textColor} font-medium text-xs font-korean`}>
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
                    <div className="text-xs text-gray-500 font-korean">
                      문제: {lesson.questionsCompleted}/8개<br/>
                      마커: {lesson.markerCount}개
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 최근 별 획득 히스토리 */}
          <div className="bg-white rounded-3xl p-6 shadow-soft">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 font-korean">⭐ 최근 별 획득</h2>
            <div className="space-y-4">
              {starHistory.length > 0 ? (
                starHistory.map((star) => (
                  <div key={star.id} className="flex items-center space-x-4 p-3 bg-yellow-50 rounded-xl">
                    <div className="text-2xl">⭐</div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-800 font-korean">{star.reason}</div>
                      <div className="text-sm text-gray-600">{formatDate(star.timestamp)}</div>
                    </div>
                    <div className="text-lg font-bold text-yellow-600">+{star.amount}</div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500 font-korean">
                  아직 획득한 별이 없습니다.<br/>
                  수업을 완료하고 별을 모아보세요!
                </div>
              )}
            </div>
          </div>

          {/* 최근 생성한 마커 */}
          <div className="bg-white rounded-3xl p-6 shadow-soft">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 font-korean">📍 최근 생성한 마커</h2>
            <div className="space-y-4">
              {recentMarkers.length > 0 ? (
                recentMarkers.map((marker) => (
                  <div key={marker.id} className="flex items-center space-x-4 p-3 bg-blue-50 rounded-xl">
                    <div className="text-2xl">{marker.lessonIcon}</div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-800 font-korean">{marker.title}</div>
                      <div className="text-sm text-gray-600">{marker.lessonTitle}</div>
                      <div className="text-xs text-gray-500">{formatDate(marker.timestamp)}</div>
                    </div>
                    <div className="text-lg">📍</div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500 font-korean">
                  아직 생성한 마커가 없습니다.<br/>
                  지도에서 마커를 추가해보세요!
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Progress; 