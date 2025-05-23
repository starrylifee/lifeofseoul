import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { collection, getDocs } from "firebase/firestore";
import { db } from '../firebase';

function ShareView() {
  const { isTeacher, userRole } = useAuth();
  const [classes, setClasses] = useState([]);
  const [selectedClass1, setSelectedClass1] = useState('');
  const [selectedClass2, setSelectedClass2] = useState('');
  const [selectedLesson, setSelectedLesson] = useState('1');
  const [isComparing, setIsComparing] = useState(false);

  // 학급 목록 불러오기 
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const classesCollection = collection(db, "classes");
        const classesSnapshot = await getDocs(classesCollection);
        const classesList = classesSnapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name
        }));
        setClasses(classesList);
        
        // 기본 선택값 설정
        if (classesList.length >= 1) {
          setSelectedClass1(classesList[0].id);
        }
        if (classesList.length >= 2) {
          setSelectedClass2(classesList[1].id);
        }
      } catch (error) {
        console.error("Error fetching classes:", error);
      }
    };

    fetchClasses();
  }, []);

  // 레슨 목록 (하드코딩)
  const lessons = [
    { id: '1', title: '1차시: 서울의 모습과 특성' },
    { id: '2', title: '2차시: 한강과 서울의 하천' },
    { id: '3', title: '3차시: 서울의 도로와 지하철' },
    { id: '4', title: '4차시: 교통의 중심지' },
    { id: '5', title: '5차시: 행정의 중심지' },
    { id: '6', title: '6차시: 문화의 중심지' },
    { id: '7', title: '7차시: 서울의 궁궐' },
    { id: '8', title: '8차시: 한양도성의 성곽과 대문' },
  ];

  // 비교 시작
  const handleCompare = () => {
    if (!selectedClass1 || !selectedClass2 || !selectedLesson) {
      alert('학급과 레슨을 모두 선택해주세요.');
      return;
    }
    
    setIsComparing(true);
    // 여기서는 실제로 데이터를 로드하지 않고, UI만 렌더링합니다.
  };

  // 교사가 아니면 접근 제한
  if (userRole !== 'teacher') {
    return (
      <div className="text-center p-8">
        <h2 className="text-2xl font-bold mb-4">접근 권한이 없습니다</h2>
        <p>학급 간 비교 기능은 교사 계정만 사용할 수 있습니다.</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">학급 간 공유 및 비교 뷰</h2>
      <p className="mb-6">여러 학급의 데이터를 비교하여 학습 활동을 분석할 수 있습니다.</p>
      
      <div className="mt-4">
        {/* 필터 영역 */}
        <div className="bg-white p-4 rounded-lg shadow mb-4">
          <h3 className="font-semibold mb-3">비교 설정</h3>
          <div className="flex flex-wrap gap-4">
            <div className="w-full md:w-auto">
              <label className="block text-sm font-medium text-gray-700 mb-1">학급 1</label>
              <select
                className="border p-2 rounded w-full md:w-48"
                value={selectedClass1}
                onChange={(e) => setSelectedClass1(e.target.value)}
              >
                <option value="">학급 선택</option>
                {classes.map(cls => (
                  <option key={cls.id} value={cls.id}>{cls.name}</option>
                ))}
              </select>
            </div>
            
            <div className="w-full md:w-auto">
              <label className="block text-sm font-medium text-gray-700 mb-1">학급 2</label>
              <select
                className="border p-2 rounded w-full md:w-48"
                value={selectedClass2}
                onChange={(e) => setSelectedClass2(e.target.value)}
              >
                <option value="">학급 선택</option>
                {classes.map(cls => (
                  <option key={cls.id} value={cls.id}>{cls.name}</option>
                ))}
              </select>
            </div>
            
            <div className="w-full md:w-auto">
              <label className="block text-sm font-medium text-gray-700 mb-1">레슨</label>
              <select
                className="border p-2 rounded w-full md:w-48"
                value={selectedLesson}
                onChange={(e) => setSelectedLesson(e.target.value)}
              >
                {lessons.map(lesson => (
                  <option key={lesson.id} value={lesson.id}>{lesson.title}</option>
                ))}
              </select>
            </div>
            
            <div className="w-full md:w-auto flex items-end">
              <button
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                onClick={handleCompare}
              >
                비교하기
              </button>
            </div>
          </div>
        </div>
        
        {/* 비교 결과 영역 */}
        {isComparing ? (
          <div className="mt-4 bg-white p-4 rounded-lg shadow">
            <h3 className="font-semibold mb-3">비교 결과</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="text-center font-medium p-2 bg-blue-100 rounded">
                  {classes.find(c => c.id === selectedClass1)?.name || '학급 1'}
                </h4>
                <div className="h-96 bg-gray-100 flex items-center justify-center">
                  <p className="text-gray-500">지도 영역 (구현 예정)</p>
                </div>
                <div className="mt-2">
                  <p className="text-center text-sm text-gray-500">
                    참여 학생: 0명 / 활동 데이터: 0개
                  </p>
                </div>
              </div>
              <div>
                <h4 className="text-center font-medium p-2 bg-green-100 rounded">
                  {classes.find(c => c.id === selectedClass2)?.name || '학급 2'}
                </h4>
                <div className="h-96 bg-gray-100 flex items-center justify-center">
                  <p className="text-gray-500">지도 영역 (구현 예정)</p>
                </div>
                <div className="mt-2">
                  <p className="text-center text-sm text-gray-500">
                    참여 학생: 0명 / 활동 데이터: 0개
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-4 p-4 bg-gray-50 rounded">
              <h4 className="font-medium mb-2">비교 분석</h4>
              <p className="text-gray-600">학급 간 비교 분석 기능은 향후 업데이트 예정입니다.</p>
            </div>
          </div>
        ) : (
          <div className="h-96 bg-gray-100 rounded-lg flex flex-col items-center justify-center">
            <p className="text-gray-500 mb-2">학급과 레슨을 선택한 후 비교하기 버튼을 클릭하세요.</p>
            <p className="text-gray-400 text-sm">비교 결과가 이 영역에 표시됩니다.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default ShareView; 