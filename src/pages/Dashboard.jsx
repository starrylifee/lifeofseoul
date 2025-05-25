import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, query, where, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore';

// 사용 가능한 색상 팔레트
const AVAILABLE_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', 
  '#FFB347', '#98D8C8', '#F7DC6F', '#FF69B4', '#32CD32', '#FF4500',
  '#9370DB', '#20B2AA', '#F0E68C', '#87CEEB'
];

const Dashboard = () => {
  const { currentUser, userId, classId, studentNumber, isTeacher, isStudent } = useAuth();
  const [lessons, setLessons] = useState([]);
  const [studentActivities, setStudentActivities] = useState([]);
  const [classStudents, setClassStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentClassColor, setCurrentClassColor] = useState('#808080');
  const [currentPersonalColor, setCurrentPersonalColor] = useState('');
  const navigate = useNavigate();

  // 레슨 목록 불러오기
  useEffect(() => {
    const fetchLessons = async () => {
      try {
        // 여기서는 src/lessons 폴더의 차시 정보를 하드코딩합니다.
        // 실제로는 Firestore에서 불러올 수 있습니다.
        const lessonList = [
          { id: '1', title: '1차시: 서울의 모습과 특성' },
          { id: '2', title: '2차시: 한강과 서울의 하천' },
          { id: '3', title: '3차시: 서울의 도로와 지하철' },
          { id: '4', title: '4차시: 교통의 중심지' },
          { id: '5', title: '5차시: 행정의 중심지' },
          { id: '6', title: '6차시: 문화의 중심지' },
          { id: '7', title: '7차시: 서울의 궁궐' },
          { id: '8', title: '8차시: 한양도성의 성곽과 대문' },
        ];
        setLessons(lessonList);

        // 학생일 경우 자신의 활동 상태 불러오기
        if (isStudent()) {
          const studentActivities = [];
          
          // 각 레슨에 대해 학생의 활동 상태 체크
          for (const lesson of lessonList) {
            const activityDocRef = doc(db, "lessons", lesson.id, "activities", currentUser.uid);
            const activityDoc = await getDoc(activityDocRef);
            
            studentActivities.push({
              lessonId: lesson.id,
              title: lesson.title,
              // 활동 데이터가 있으면 '진행 중', 없으면 '시작하기'
              status: activityDoc.exists() ? '진행 중' : '시작하기'
            });
          }
          
          setStudentActivities(studentActivities);
        }

        // 교사일 경우 해당 학급 학생들 정보 불러오기 
        if (isTeacher()) {
          const studentsQuery = query(
            collection(db, "users"), 
            where("role", "==", "student"), 
            where("classId", "==", classId)
          );
          
          const studentDocs = await getDocs(studentsQuery);
          const studentsData = studentDocs.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          
          setClassStudents(studentsData);
        }

        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setLoading(false);
      }
    };

    if (currentUser) {
      fetchLessons();
    }
  }, [currentUser, isStudent, isTeacher, classId]);

  // 사용자 색상 정보 로드
  useEffect(() => {
    const loadUserColors = async () => {
      if (!currentUser) return;
      
      try {
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setCurrentClassColor(userData.classColor || '#808080');
          setCurrentPersonalColor(userData.personalColor || '');
        }
      } catch (error) {
        console.error("색상 정보 로드 오류:", error);
      }
    };
    
    loadUserColors();
  }, [currentUser]);

  const handleLessonClick = (lessonId) => {
    navigate(`/lesson/${lessonId}`);
  };

  // 반 색상 변경 (교사용)
  const handleClassColorChange = async (color) => {
    if (!isTeacher() || !currentUser) return;
    
    setLoading(true);
    try {
      await updateDoc(doc(db, "users", currentUser.uid), {
        classColor: color
      });
      setCurrentClassColor(color);
      alert('반 색상이 변경되었습니다!');
    } catch (error) {
      console.error("반 색상 변경 오류:", error);
      alert('색상 변경에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 개인 색상 변경 (학생용)
  const handlePersonalColorChange = async (color) => {
    if (!currentUser) return;
    
    setLoading(true);
    try {
      const updateData = color === currentPersonalColor 
        ? { personalColor: null } // 같은 색상 클릭시 개인 색상 제거
        : { personalColor: color };
        
      await updateDoc(doc(db, "users", currentUser.uid), updateData);
      setCurrentPersonalColor(color === currentPersonalColor ? '' : color);
      alert(color === currentPersonalColor ? '개인 색상이 제거되었습니다!' : '개인 색상이 변경되었습니다!');
    } catch (error) {
      console.error("개인 색상 변경 오류:", error);
      alert('색상 변경에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center p-4">데이터 로딩 중...</div>;
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
        </div>

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
                    🎯 완료한 수업: 0/8개
                  </span>
                </div>
                <div className="bg-sunshine-50 rounded-xl p-3">
                  <span className="text-sunshine-600 font-medium text-sm font-korean">
                    ⭐ 획득한 별: 0개
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