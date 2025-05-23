import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';

function Dashboard() {
  const { currentUser, userId, userRole, classId, studentNumber, isTeacher, isStudent } = useAuth();
  const [lessons, setLessons] = useState([]);
  const [studentActivities, setStudentActivities] = useState([]);
  const [classStudents, setClassStudents] = useState([]);
  const [loading, setLoading] = useState(true);
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

  const handleLessonClick = (lessonId) => {
    navigate(`/lesson/${lessonId}`);
  };

  if (loading) {
    return <div className="text-center p-4">데이터 로딩 중...</div>;
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">대시보드</h2>
      
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