import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { getClassStarRanking } from '../utils/starAPI';
import StarLevelDisplay from '../components/StarLevelDisplay';

const TeacherProgress = () => {
  const { currentUser, classId, isTeacher } = useAuth();
  const [students, setStudents] = useState([]);
  const [classStats, setClassStats] = useState({
    totalStudents: 0,
    totalStars: 0,
    completedLessons: 0,
    totalMarkers: 0
  });
  const [lessonProgress, setLessonProgress] = useState([]);
  const [starRanking, setStarRanking] = useState([]);
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
    if (!isTeacher() || !classId) {
      setLoading(false);
      return;
    }

    fetchClassProgress();
  }, [currentUser, classId]);

  const fetchClassProgress = async () => {
    try {
      setLoading(true);
      
      // 학급 학생 목록 가져오기
      const studentsQuery = query(
        collection(db, "users"),
        where("classId", "==", classId),
        where("role", "==", "student")
      );
      
      const studentsSnapshot = await getDocs(studentsQuery);
      const studentList = studentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setStudents(studentList);

      // 각 학생의 레슨 진행률 계산
      const progressData = [];
      let totalCompletedLessons = 0;
      let totalMarkers = 0;

      for (const lesson of lessonList) {
        const lessonProgress = {
          ...lesson,
          completedStudents: 0,
          totalMarkers: 0,
          studentProgress: []
        };

        for (const student of studentList) {
          try {
            // 학생의 레슨 활동 데이터 가져오기
            const activityDoc = await getDoc(doc(db, "lessons", lesson.id, "activities", student.id));
            
            let isCompleted = false;
            let markerCount = 0;
            
            if (activityDoc.exists()) {
              const data = activityDoc.data();
              const questionsCompleted = data.questionsCompleted || 0;
              markerCount = (data.markers || []).length;
              isCompleted = questionsCompleted >= 8; // 8문제 모두 완료
              
              if (isCompleted) {
                lessonProgress.completedStudents++;
                totalCompletedLessons++;
              }
              
              totalMarkers += markerCount;
              lessonProgress.totalMarkers += markerCount;
            }

            lessonProgress.studentProgress.push({
              studentId: student.id,
              studentName: student.email?.split('@')[0] || student.name || 'Unknown',
              studentNumber: student.studentNumber || '',
              isCompleted,
              markerCount,
              questionsCompleted: activityDoc.exists() ? (activityDoc.data().questionsCompleted || 0) : 0
            });
          } catch (error) {
            console.error(`Error fetching data for student ${student.id}, lesson ${lesson.id}:`, error);
          }
        }

        progressData.push(lessonProgress);
      }

      setLessonProgress(progressData);

      // 별 랭킹 가져오기
      const ranking = await getClassStarRanking(classId);
      setStarRanking(ranking);

      // 전체 통계 계산
      const totalStars = ranking.reduce((sum, student) => sum + student.stars, 0);
      
      setClassStats({
        totalStudents: studentList.length,
        totalStars,
        completedLessons: totalCompletedLessons,
        totalMarkers
      });

    } catch (error) {
      console.error('Error fetching class progress:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isTeacher()) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-friendly-mint via-white to-friendly-pink flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">접근 권한 없음</h1>
          <p className="text-gray-600">교사만 접근할 수 있는 페이지입니다.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-friendly-mint via-white to-friendly-pink flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-seoul-500 mx-auto mb-4"></div>
          <p className="text-gray-600 font-korean">학급 진행 현황을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-friendly-mint via-white to-friendly-pink">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4 font-korean">
            📊 학급 진행 현황
          </h1>
          <p className="text-lg text-gray-600 font-korean">
            {classId} 학급의 학습 진행 상황을 확인하세요
          </p>
        </div>

        {/* 전체 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-3xl p-6 shadow-soft">
            <div className="text-center">
              <div className="text-3xl mb-2">👥</div>
              <h3 className="text-lg font-bold text-gray-800 font-korean">전체 학생</h3>
              <p className="text-2xl font-bold text-seoul-600">{classStats.totalStudents}명</p>
            </div>
          </div>
          
          <div className="bg-white rounded-3xl p-6 shadow-soft">
            <div className="text-center">
              <div className="text-3xl mb-2">⭐</div>
              <h3 className="text-lg font-bold text-gray-800 font-korean">총 획득 별</h3>
              <p className="text-2xl font-bold text-yellow-600">{classStats.totalStars}개</p>
            </div>
          </div>
          
          <div className="bg-white rounded-3xl p-6 shadow-soft">
            <div className="text-center">
              <div className="text-3xl mb-2">✅</div>
              <h3 className="text-lg font-bold text-gray-800 font-korean">완료된 수업</h3>
              <p className="text-2xl font-bold text-green-600">{classStats.completedLessons}개</p>
            </div>
          </div>
          
          <div className="bg-white rounded-3xl p-6 shadow-soft">
            <div className="text-center">
              <div className="text-3xl mb-2">📍</div>
              <h3 className="text-lg font-bold text-gray-800 font-korean">생성된 마커</h3>
              <p className="text-2xl font-bold text-blue-600">{classStats.totalMarkers}개</p>
            </div>
          </div>
        </div>

        {/* 레슨별 진행률 */}
        <div className="bg-white rounded-3xl p-6 shadow-soft mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 font-korean">📚 레슨별 진행률</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {lessonProgress.map((lesson) => {
              const completionRate = students.length > 0 
                ? Math.round((lesson.completedStudents / students.length) * 100) 
                : 0;
              
              return (
                <div key={lesson.id} className="border-2 border-gray-100 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      <span className="text-2xl mr-3">{lesson.icon}</span>
                      <div>
                        <h3 className="font-bold text-gray-800 text-sm font-korean">{lesson.title}</h3>
                        <p className="text-xs text-gray-600">완료: {lesson.completedStudents}/{students.length}명</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-seoul-600">{completionRate}%</div>
                      <div className="text-xs text-gray-500">📍 {lesson.totalMarkers}개</div>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-seoul-400 to-seoul-600 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${completionRate}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 학급 별 랭킹 */}
        <div className="bg-white rounded-3xl p-6 shadow-soft">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 font-korean">🏆 학급 별 랭킹</h2>
          <div className="space-y-4">
            {starRanking.slice(0, 10).map((student, index) => (
              <div key={student.userId} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full text-white font-bold">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-800 font-korean">
                    {student.studentNumber ? `${student.studentNumber}번 - ` : ''}{student.email.split('@')[0]}
                  </div>
                  <StarLevelDisplay userId={student.userId} compact={true} />
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-yellow-600">
                    ⭐ {student.stars}개
                  </div>
                </div>
              </div>
            ))}
            
            {starRanking.length === 0 && (
              <div className="text-center py-8 text-gray-500 font-korean">
                아직 별을 획득한 학생이 없습니다.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherProgress; 