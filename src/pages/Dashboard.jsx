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

function Dashboard() {
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
    <div className="max-w-4xl mx-auto p-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">대시보드</h1>
        <p className="text-gray-600">
          환영합니다, {currentUser?.email}님! ({isTeacher() ? '교사' : '학생'})
        </p>
        {classId && <p className="text-sm text-gray-500">소속: {classId}</p>}
      </header>

      {/* 색상 관리 섹션 */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-xl font-bold mb-4 text-gray-800">
          🎨 색상 관리
        </h2>
        
        {/* 교사용 반 색상 설정 */}
        {isTeacher() && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3 text-gray-700">반 색상 설정</h3>
            <p className="text-sm text-gray-600 mb-3">
              우리 반 학생들의 기본 마커 색상을 선택해주세요. (학생이 개인 색상을 선택하지 않은 경우 사용됩니다)
            </p>
            <div className="flex items-center mb-3">
              <span className="mr-3">현재 반 색상:</span>
              <div 
                className="w-8 h-8 rounded-full border-2 border-gray-400"
                style={{ backgroundColor: currentClassColor }}
              ></div>
            </div>
            <div className="grid grid-cols-8 gap-2">
              {AVAILABLE_COLORS.map(color => (
                <button
                  key={color}
                  onClick={() => handleClassColorChange(color)}
                  disabled={loading}
                  className={`w-10 h-10 rounded-full border-2 hover:scale-110 transition-transform ${
                    currentClassColor === color ? 'border-gray-800 border-4' : 'border-gray-300'
                  }`}
                  style={{ backgroundColor: color }}
                  title={`색상 선택: ${color}`}
                />
              ))}
            </div>
          </div>
        )}

        {/* 학생용 개인 색상 설정 */}
        {isStudent() && (
          <div>
            <h3 className="text-lg font-semibold mb-3 text-gray-700">개인 색상 설정</h3>
            <p className="text-sm text-gray-600 mb-3">
              나만의 마커 색상을 선택할 수 있습니다. 선택하지 않으면 반 색상이 사용됩니다.
            </p>
            <div className="flex items-center mb-3">
              <span className="mr-3">현재 색상:</span>
              <div 
                className="w-8 h-8 rounded-full border-2 border-gray-400"
                style={{ backgroundColor: currentPersonalColor || currentClassColor }}
              ></div>
              <span className="ml-2 text-sm text-gray-600">
                {currentPersonalColor ? '(개인 색상)' : '(반 색상)'}
              </span>
            </div>
            <div className="grid grid-cols-8 gap-2">
              {AVAILABLE_COLORS.map(color => (
                <button
                  key={color}
                  onClick={() => handlePersonalColorChange(color)}
                  disabled={loading}
                  className={`w-10 h-10 rounded-full border-2 hover:scale-110 transition-transform ${
                    currentPersonalColor === color ? 'border-gray-800 border-4' : 'border-gray-300'
                  }`}
                  style={{ backgroundColor: color }}
                  title={`색상 선택: ${color}`}
                />
              ))}
            </div>
            {currentPersonalColor && (
              <button
                onClick={() => handlePersonalColorChange(currentPersonalColor)}
                className="mt-2 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                disabled={loading}
              >
                개인 색상 제거 (반 색상 사용)
              </button>
            )}
          </div>
        )}

        {loading && (
          <div className="text-center mt-4">
            <span className="text-blue-600">색상 변경 중...</span>
          </div>
        )}
      </div>

      {/* 기존 레슨 목록 등 */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold mb-4 text-gray-800">
            📚 학습 활동
          </h2>
          <div className="space-y-3">
            <Link
              to="/classroom"
              className="block p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <h3 className="font-semibold text-blue-800">수업 참여하기</h3>
              <p className="text-sm text-blue-600">서울 지역사회 학습에 참여해보세요</p>
            </Link>
            
            <Link
              to="/share"
              className="block p-4 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
            >
              <h3 className="font-semibold text-green-800">작품 공유하기</h3>
              <p className="text-sm text-green-600">친구들과 학습 결과를 공유해보세요</p>
            </Link>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold mb-4 text-gray-800">
            📊 나의 학습 현황
          </h2>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>완료한 레슨:</span>
              <span className="font-semibold">3/8</span>
            </div>
            <div className="flex justify-between">
              <span>생성한 마커:</span>
              <span className="font-semibold">12개</span>
            </div>
            <div className="flex justify-between">
              <span>학습 시간:</span>
              <span className="font-semibold">2시간 30분</span>
            </div>
          </div>
        </div>
      </div>

      {isStudent() && (
        <div>
          <p className="mb-4">
            <span className="font-semibold">{classId}</span> 학급 
            <span className="font-semibold"> {studentNumber}</span>번 학생으로 로그인하셨습니다.
            <br />
            <span className="text-sm text-gray-600">사용자 ID: {userId}</span>
          </p>
          
          <h3 className="text-xl font-semibold mb-2">나의 학습 활동</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {studentActivities.map((activity) => (
              <div 
                key={activity.lessonId} 
                onClick={() => handleLessonClick(activity.lessonId)}
                className="p-4 border rounded-lg cursor-pointer hover:bg-blue-50 transition"
              >
                <h4 className="font-medium">{activity.title}</h4>
                <div className={`mt-2 text-sm px-2 py-1 rounded inline-block ${
                  activity.status === '진행 중' 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {activity.status}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {isTeacher() && (
        <div>
          <p className="mb-4">
            <span className="font-semibold">{classId}</span> 학급 교사로 로그인하셨습니다.
            <br />
            <span className="text-sm text-gray-600">사용자 ID: {userId}</span>
          </p>
          
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold">학급 현황</h3>
            <Link to="/share" className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
              학급 간 비교 보기
            </Link>
          </div>

          <div className="mb-6">
            <h4 className="font-medium mb-2">우리 반 학생 목록 ({classStudents.length}명)</h4>
            <div className="border rounded overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">번호</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">아이디</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">활동</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {classStudents.sort((a, b) => a.studentNumber - b.studentNumber).map((student) => (
                    <tr key={student.id}>
                      <td className="px-6 py-4 whitespace-nowrap">{student.studentNumber}번</td>
                      <td className="px-6 py-4 whitespace-nowrap">{student.userId}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button className="text-blue-600 hover:text-blue-800">
                          학습 활동 보기
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <h3 className="text-xl font-semibold mb-2">레슨 목록</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {lessons.map((lesson) => (
              <div 
                key={lesson.id} 
                onClick={() => handleLessonClick(lesson.id)}
                className="p-4 border rounded-lg cursor-pointer hover:bg-blue-50 transition"
              >
                <h4 className="font-medium">{lesson.title}</h4>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard; 