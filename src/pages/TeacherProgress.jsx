import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, query, where, getDocs, doc, getDoc, setDoc } from 'firebase/firestore';
import { getStudentStars } from '../utils/starAPI';
import StarLevelDisplay from '../components/StarLevelDisplay';
import ClassPetCard from '../components/ClassPetCard';

const levelThreshold = (level) => 20 + (level - 1) * 10; // 간단 규칙: 20,30,40...

const TeacherProgress = () => {
  const { currentUser, isTeacher } = useAuth();
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
  const [classDoc, setClassDoc] = useState(null);

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

  const fetchClassProgress = useCallback(async () => {
    try {
      setLoading(true);
      const studentsQuery = query(
        collection(db, 'users'),
        where('role', '==', 'student'),
        where('teacherId', '==', currentUser.uid)
      );
      const studentsSnapshot = await getDocs(studentsQuery);
      const studentList = studentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      studentList.sort((a,b) => {
        const na = a.studentNumber || 0;
        const nb = b.studentNumber || 0;
        if (na !== nb) return na - nb;
        const ea = (a.email || '').toLowerCase();
        const eb = (b.email || '').toLowerCase();
        return ea.localeCompare(eb);
      });
      setStudents(studentList);

      // 레슨 진행률
      const progressData = [];
      let totalCompletedLessons = 0;
      let totalMarkers = 0;

      for (const lesson of lessonList) {
        const lessonProg = { ...lesson, completedStudents: 0, totalMarkers: 0, studentProgress: [] };
        for (const student of studentList) {
          try {
            const activityDoc = await getDoc(doc(db, 'lessons', lesson.id, 'activities', student.id));
            let isCompleted = false;
            let markerCount = 0;
            if (activityDoc.exists()) {
              const data = activityDoc.data();
              const questionsCompleted = data.questionsCompleted || 0;
              markerCount = (data.markers || []).length;
              isCompleted = questionsCompleted >= 8;
              if (isCompleted) {
                lessonProg.completedStudents++;
                totalCompletedLessons++;
              }
              totalMarkers += markerCount;
              lessonProg.totalMarkers += markerCount;
            }
            lessonProg.studentProgress.push({
              studentId: student.id,
              studentName: student.email?.split('@')[0] || student.name || 'Unknown',
              studentNumber: student.studentNumber || '',
              isCompleted,
              markerCount,
              questionsCompleted: activityDoc.exists() ? (activityDoc.data().questionsCompleted || 0) : 0
            });
          } catch {}
        }
        progressData.push(lessonProg);
      }
      setLessonProgress(progressData);

      // 별 합/랭킹
      const rankings = await Promise.all(
        studentList.map(async (s) => ({ userId: s.id, email: s.email, studentNumber: s.studentNumber, stars: await getStudentStars(s.id) }))
      );
      rankings.sort((a, b) => b.stars - a.stars);
      setStarRanking(rankings);
      const totalStars = rankings.reduce((sum, s) => sum + s.stars, 0);

      setClassStats({ totalStudents: studentList.length, totalStars, completedLessons: totalCompletedLessons, totalMarkers });

      // classes/{teacherId} 문서 로드 (없으면 가상)
      const classRef = doc(db, 'classes', currentUser.uid);
      const classSnap = await getDoc(classRef);
      let cdoc = classSnap.exists() ? classSnap.data() : null;

      // 파생 계산: xp=totalStars, level/nextLevelXp, unlockedLessons
      const derivedLevel = (() => {
        let lvl = 1, xpNeed = levelThreshold(1), xpLeft = totalStars;
        while (xpLeft >= xpNeed && lvl < 4) { xpLeft -= xpNeed; lvl += 1; xpNeed = levelThreshold(lvl); }
        return lvl;
      })();
      const nextXp = levelThreshold(derivedLevel);

      const unlockedLessons = lessonList.map((lsn) => {
        const lp = progressData.find(p => p.id === lsn.id);
        const rate = (lp && studentList.length) ? (lp.completedStudents / studentList.length) : 0;
        return rate >= 0.6; // 60% 이상 해금
      });

      setClassDoc({
        xp: totalStars,
        level: derivedLevel,
        nextLevelXp: nextXp,
        unlockedLessons
      });

      // classes 문서를 실제 저장하려면 주석 해제 (선택)
      // await setDoc(classRef, { xp: totalStars, level: derivedLevel, nextLevelXp: nextXp, unlockedLessons, updatedAt: new Date() }, { merge: true });

    } catch (error) {
      console.error('Error fetching class progress:', error);
    } finally {
      setLoading(false);
    }
  }, [currentUser?.uid, lessonList]);

  useEffect(() => {
    if (!isTeacher() || !currentUser?.uid) { setLoading(false); return; }
    fetchClassProgress();
  }, [isTeacher, currentUser?.uid, fetchClassProgress]);

  const starMap = useMemo(() => {
    const m = new Map();
    for (const s of starRanking) m.set(s.userId, s.stars);
    return m;
  }, [starRanking]);

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
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4 font-korean">📊 학급 진행 현황</h1>
          <p className="text-lg text-gray-600 font-korean">내 학급의 학습 진행 상황을 확인하세요</p>
        </div>

        {classDoc && (
          <ClassPetCard xp={classDoc.xp} level={classDoc.level} nextLevelXp={classDoc.nextLevelXp} unlockedLessons={classDoc.unlockedLessons} />
        )}

        {/* 기존 카드들 유지 */}
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

        <div className="bg-white rounded-3xl p-6 shadow-soft mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 font-korean">👨‍👩‍👧‍👦 학급 학생 목록</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">번호</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">이메일</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">별</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {students.length ? students.map(s => (
                  <tr key={s.id}>
                    <td className="px-6 py-4 whitespace-nowrap">{s.studentNumber || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{s.email || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{s.status || 'approved'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{(starRanking.find(r => r.userId === s.id)?.stars) || 0}</td>
                  </tr>
                )) : (
                  <tr>
                    <td className="px-6 py-4" colSpan={4}>학생 데이터가 없습니다.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-soft mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 font-korean">📚 레슨별 진행률</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {lessonProgress.map((lesson) => {
              const completionRate = students.length > 0 ? Math.round((lesson.completedStudents / students.length) * 100) : 0;
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
                    <div className="bg-gradient-to-r from-seoul-400 to-seoul-600 h-3 rounded-full transition-all duration-500" style={{ width: `${completionRate}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-soft">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 font-korean">🏆 학급 별 랭킹</h2>
          <div className="space-y-4">
            {starRanking.slice(0, 10).map((student, index) => (
              <div key={student.userId} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full text-white font-bold">{index + 1}</div>
                <div className="flex-1">
                  <div className="font-medium text-gray-800 font-korean">{student.studentNumber ? `${student.studentNumber}번 - ` : ''}{student.email.split('@')[0]}</div>
                  <StarLevelDisplay userId={student.userId} compact={true} />
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-yellow-600">⭐ {student.stars}개</div>
                </div>
              </div>
            ))}
            {starRanking.length === 0 && (
              <div className="text-center py-8 text-gray-500 font-korean">아직 별을 획득한 학생이 없습니다.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherProgress; 