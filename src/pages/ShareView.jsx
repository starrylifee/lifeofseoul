import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { collection, getDocs } from "firebase/firestore";
import { db } from '../firebase';

function ShareView() {
  const { userRole } = useAuth();
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
        
        // 학교별로 그룹화하여 정렬
        const sortedClasses = classesList.sort((a, b) => {
          // 학교명으로 먼저 정렬, 그 다음 학급명으로 정렬
          const schoolA = a.name.split(' ')[0];
          const schoolB = b.name.split(' ')[0];
          if (schoolA !== schoolB) {
            return schoolA.localeCompare(schoolB);
          }
          return a.name.localeCompare(b.name);
        });
        
        setClasses(sortedClasses);
        
        // 기본 선택값 설정 (다른 학교끼리 비교하도록)
        if (sortedClasses.length >= 1) {
          setSelectedClass1(sortedClasses[0].id);
        }
        if (sortedClasses.length >= 2) {
          // 가능하면 다른 학교의 학급을 선택
          const firstSchool = sortedClasses[0]?.name.split(' ')[0];
          const differentSchoolClass = sortedClasses.find(cls => 
            cls.name.split(' ')[0] !== firstSchool
          );
          setSelectedClass2(differentSchoolClass?.id || sortedClasses[1]?.id);
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
    { id: '7', title: '7차시: 서울의 궁궈' },
    { id: '8', title: '8차시: 한양도성의 성곽과 대문' },
  ];

  // 학교별로 학급 그룹화
  const getClassesBySchool = () => {
    const schoolGroups = {};
    classes.forEach(cls => {
      const schoolName = cls.name.split(' ')[0];
      if (!schoolGroups[schoolName]) {
        schoolGroups[schoolName] = [];
      }
      schoolGroups[schoolName].push(cls);
    });
    return schoolGroups;
  };

  // 비교 시작
  const handleCompare = () => {
    if (!selectedClass1 || !selectedClass2 || !selectedLesson) {
      alert('학급과 레슨을 모두 선택해주세요.');
      return;
    }
    
    if (selectedClass1 === selectedClass2) {
      alert('서로 다른 학급을 선택해주세요.');
      return;
    }
    
    setIsComparing(true);
    // 여기서는 실제로 데이터를 로드하지 않고, UI만 렌더링합니다.
  };

  // 선택된 학급의 학교명 가져오기
  const getSchoolName = (classId) => {
    const selectedClass = classes.find(c => c.id === classId);
    return selectedClass?.name.split(' ')[0] || '';
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

  const schoolGroups = getClassesBySchool();

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">🏫 학교-학급 간 공유 및 비교</h2>
      <p className="mb-6">다른 학교의 학급들과 학습 활동을 비교하여 교육 효과를 분석할 수 있습니다.</p>
      
      <div className="mt-4">
        {/* 필터 영역 */}
        <div className="bg-white p-6 rounded-lg shadow mb-4">
          <h3 className="font-semibold mb-4 text-lg">🔍 비교 설정</h3>
          
          {/* 학교별 학급 현황 */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium mb-3">📊 참여 학교 현황</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(schoolGroups).map(([schoolName, schoolClasses]) => (
                <div key={schoolName} className="bg-white p-3 rounded border">
                  <h5 className="font-medium text-blue-600 mb-2">{schoolName}</h5>
                  <p className="text-sm text-gray-600">
                    {schoolClasses.length}개 학급 참여
                  </p>
                  <div className="text-xs text-gray-500 mt-1">
                    {schoolClasses.map(cls => cls.name.split(' ').slice(1).join(' ')).join(', ')}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                🏫 첫 번째 학교-학급
              </label>
              <select
                className="border border-gray-300 p-3 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={selectedClass1}
                onChange={(e) => setSelectedClass1(e.target.value)}
              >
                <option value="">학급 선택</option>
                {Object.entries(schoolGroups).map(([schoolName, schoolClasses]) => (
                  <optgroup key={schoolName} label={`${schoolName} (${schoolClasses.length}개 학급)`}>
                    {schoolClasses.map(cls => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
              {selectedClass1 && (
                <p className="text-xs text-blue-600 mt-1">
                  선택됨: {classes.find(c => c.id === selectedClass1)?.name}
                </p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                🏫 두 번째 학교-학급
              </label>
              <select
                className="border border-gray-300 p-3 rounded-lg w-full focus:ring-2 focus:ring-green-500 focus:border-green-500"
                value={selectedClass2}
                onChange={(e) => setSelectedClass2(e.target.value)}
              >
                <option value="">학급 선택</option>
                {Object.entries(schoolGroups).map(([schoolName, schoolClasses]) => (
                  <optgroup key={schoolName} label={`${schoolName} (${schoolClasses.length}개 학급)`}>
                    {schoolClasses.map(cls => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
              {selectedClass2 && (
                <p className="text-xs text-green-600 mt-1">
                  선택됨: {classes.find(c => c.id === selectedClass2)?.name}
                </p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📚 비교할 레슨
              </label>
              <select
                className="border border-gray-300 p-3 rounded-lg w-full focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                value={selectedLesson}
                onChange={(e) => setSelectedLesson(e.target.value)}
              >
                {lessons.map(lesson => (
                  <option key={lesson.id} value={lesson.id}>{lesson.title}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="mt-4 flex justify-center">
            <button
              className="bg-gradient-to-r from-blue-500 to-green-500 text-white px-6 py-3 rounded-lg hover:from-blue-600 hover:to-green-600 transition-all duration-200 font-medium shadow-lg"
              onClick={handleCompare}
              disabled={!selectedClass1 || !selectedClass2 || selectedClass1 === selectedClass2}
            >
              🔍 학교 간 비교 시작하기
            </button>
          </div>
          
          {/* 비교 안내 */}
          {selectedClass1 && selectedClass2 && selectedClass1 !== selectedClass2 && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <span className="text-blue-600">📋</span>
                <span className="font-medium text-blue-800">비교 예정:</span>
              </div>
              <div className="mt-2 text-sm text-blue-700">
                <div className="flex items-center justify-between">
                  <span className="bg-blue-100 px-2 py-1 rounded">
                    {classes.find(c => c.id === selectedClass1)?.name}
                  </span>
                  <span className="mx-2">VS</span>
                  <span className="bg-green-100 px-2 py-1 rounded">
                    {classes.find(c => c.id === selectedClass2)?.name}
                  </span>
                </div>
                <p className="text-center mt-2">
                  {lessons.find(l => l.id === selectedLesson)?.title} 활동 비교
                </p>
              </div>
            </div>
          )}
        </div>
        
        {/* 비교 결과 영역 */}
        {isComparing ? (
          <div className="mt-4 bg-white p-6 rounded-lg shadow">
            <h3 className="font-semibold mb-4 text-lg">📊 학교 간 비교 결과</h3>
            
            {/* 학교 정보 헤더 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg border-2 border-blue-200">
                <h4 className="font-bold text-blue-800">
                  🏫 {getSchoolName(selectedClass1)}
                </h4>
                <p className="text-blue-600">
                  {classes.find(c => c.id === selectedClass1)?.name}
                </p>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg border-2 border-green-200">
                <h4 className="font-bold text-green-800">
                  🏫 {getSchoolName(selectedClass2)}
                </h4>
                <p className="text-green-600">
                  {classes.find(c => c.id === selectedClass2)?.name}
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border-2 border-blue-200 rounded-lg overflow-hidden">
                <div className="bg-blue-100 p-3">
                  <h4 className="text-center font-medium text-blue-800">
                    {classes.find(c => c.id === selectedClass1)?.name}
                  </h4>
                </div>
                <div className="h-96 bg-gray-100 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-gray-500 mb-2">🗺️ 지도 영역</p>
                    <p className="text-sm text-gray-400">(구현 예정)</p>
                  </div>
                </div>
                <div className="p-3 bg-blue-50">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="text-center">
                      <p className="font-medium text-blue-800">참여 학생</p>
                      <p className="text-blue-600">0명</p>
                    </div>
                    <div className="text-center">
                      <p className="font-medium text-blue-800">활동 데이터</p>
                      <p className="text-blue-600">0개</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="border-2 border-green-200 rounded-lg overflow-hidden">
                <div className="bg-green-100 p-3">
                  <h4 className="text-center font-medium text-green-800">
                    {classes.find(c => c.id === selectedClass2)?.name}
                  </h4>
                </div>
                <div className="h-96 bg-gray-100 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-gray-500 mb-2">🗺️ 지도 영역</p>
                    <p className="text-sm text-gray-400">(구현 예정)</p>
                  </div>
                </div>
                <div className="p-3 bg-green-50">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="text-center">
                      <p className="font-medium text-green-800">참여 학생</p>
                      <p className="text-green-600">0명</p>
                    </div>
                    <div className="text-center">
                      <p className="font-medium text-green-800">활동 데이터</p>
                      <p className="text-green-600">0개</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* 비교 분석 */}
            <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border">
              <h4 className="font-medium mb-3 text-gray-800">📈 학교 간 비교 분석</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="bg-white p-3 rounded border">
                  <h5 className="font-medium text-purple-600 mb-2">🎯 활동 참여도</h5>
                  <p className="text-gray-600">학교별 학생 참여율 비교</p>
                  <p className="text-xs text-gray-500 mt-1">(구현 예정)</p>
                </div>
                <div className="bg-white p-3 rounded border">
                  <h5 className="font-medium text-orange-600 mb-2">🗺️ 지도 활용도</h5>
                  <p className="text-gray-600">마커 및 도형 활용 비교</p>
                  <p className="text-xs text-gray-500 mt-1">(구현 예정)</p>
                </div>
                <div className="bg-white p-3 rounded border">
                  <h5 className="font-medium text-teal-600 mb-2">💬 상호작용</h5>
                  <p className="text-gray-600">학교 간 교류 활동 분석</p>
                  <p className="text-xs text-gray-500 mt-1">(구현 예정)</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-96 bg-gradient-to-br from-blue-50 to-green-50 rounded-lg flex flex-col items-center justify-center border-2 border-dashed border-gray-300">
            <div className="text-center">
              <div className="text-6xl mb-4">🏫</div>
              <p className="text-gray-600 mb-2 font-medium">학교-학급을 선택한 후 비교하기 버튼을 클릭하세요</p>
              <p className="text-gray-500 text-sm">다른 학교와의 교육 활동 비교 결과가 이 영역에 표시됩니다</p>
              <div className="mt-4 text-xs text-gray-400">
                💡 팁: 서로 다른 학교의 학급을 선택하면 더 의미있는 비교가 가능합니다
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ShareView; 