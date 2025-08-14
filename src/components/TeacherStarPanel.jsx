import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getClassStudents } from '../utils/api';
import { awardStarsByTeacher, getClassStarRanking } from '../utils/starAPI';
import { STAR_SOURCES } from '../utils/starSystem';
import StarLevelDisplay from './StarLevelDisplay';

const TeacherStarPanel = ({ lessonId }) => {
  const { currentUser, classId } = useAuth();
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedSource, setSelectedSource] = useState('TEACHER_REWARD');
  const [loading, setLoading] = useState(false);
  const [classRanking, setClassRanking] = useState([]);
  const [showRanking, setShowRanking] = useState(false);
  const [studentsLoading, setStudentsLoading] = useState(false);

  // 학급 학생 목록 로드 (최적화: 캐싱 및 중복 호출 방지)
  useEffect(() => {
    const fetchStudents = async () => {
      console.log('fetchStudents 시작');
      console.log('currentUser:', currentUser);
      console.log('classId:', classId);
      
      if (!classId) {
        console.log('classId가 없어서 학생 목록 로드 중단');
        return;
      }
      
      if (!currentUser) {
        console.log('currentUser가 없어서 학생 목록 로드 중단');
        return;
      }
      
      // 이미 로딩 중이면 중복 호출 방지
      if (studentsLoading) {
        console.log('이미 학생 목록 로딩 중...');
        return;
      }
      
      setStudentsLoading(true);
      
      try {
        console.log('학생 목록 로드 시도, classId:', classId);
        const studentList = await getClassStudents(classId);
        console.log('로드된 학생 목록:', studentList);
        console.log('학생 수:', studentList.length);
        setStudents(studentList);
      } catch (error) {
        console.error('학생 목록 로드 실패:', error);
        console.error('에러 상세:', error.message);
      } finally {
        setStudentsLoading(false);
      }
    };

    fetchStudents();
  }, [classId, currentUser?.uid, studentsLoading]); // currentUser 전체 대신 uid만 감시

  // 학급 별 순위 로드
  const fetchClassRanking = async () => {
    if (!classId) return;
    
    try {
      const ranking = await getClassStarRanking(classId);
      setClassRanking(ranking);
      setShowRanking(true);
    } catch (error) {
      console.error('별 순위 로드 실패:', error);
      alert('별 순위를 불러오는데 실패했습니다.');
    }
  };

  // 별 지급하기
  const handleAwardStar = async () => {
    if (!selectedStudent) {
      alert('학생을 선택해주세요.');
      return;
    }

    setLoading(true);
    try {
      const source = STAR_SOURCES[selectedSource];
      const reason = getSourceOptions().find(opt => opt.key === selectedSource)?.label || '교사 보상';
      
      await awardStarsByTeacher(
        currentUser.uid,
        selectedStudent,
        lessonId,
        source,
        reason
      );

      alert(`별 ${source.amount}개를 성공적으로 지급했습니다! 🌟`);
      
      // 폼 초기화
      setSelectedStudent('');
      
      // 순위 새로고침 (열려있는 경우)
      if (showRanking) {
        fetchClassRanking();
      }
      
    } catch (error) {
      console.error('별 지급 실패:', error);
      alert('별 지급에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  const getSourceOptions = () => [
    { key: 'TEACHER_REWARD', label: '교사 보상 (1개)', description: '일반적인 교사 보상' },
    { key: 'CREATIVE_MARKER', label: '창의적 마커 (1개)', description: '창의적인 마커 작성' },
    { key: 'ACTIVE_PARTICIPATION', label: '적극적 참여 (1개)', description: '수업 참여도 우수' },
    { key: 'PERFECT_LESSON', label: '완벽한 레슨 (2개)', description: '레슨 완벽 수행' }
  ];

  return (
    <div className="bg-white rounded-3xl p-6 shadow-soft border-2 border-yellow-100">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-800">⭐ 별 지급 시스템</h3>
        <button
          onClick={fetchClassRanking}
          className="bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition-colors text-sm"
        >
          🏆 학급 순위 보기
        </button>
      </div>

      {/* 별 지급 폼 */}
      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            👨‍🎓 학생 선택
          </label>
          <select
            value={selectedStudent}
            onChange={(e) => setSelectedStudent(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
          >
            <option value="">학생을 선택하세요</option>
            {students.map(student => (
              <option key={student.id} value={student.id}>
                {student.studentNumber ? `${student.studentNumber}번 - ` : ''}{student.email?.split('@')[0] || student.name || student.id}
              </option>
            ))}
          </select>
          {students.length === 0 && (
            <div className="text-xs text-red-500 mt-1">
              {!classId ? (
                <div>
                  ⚠️ 학급 ID가 설정되지 않았습니다. 
                  <br />
                  <a href="/settings" className="text-blue-500 hover:text-blue-700 underline">
                    설정 페이지
                  </a>에서 학급 ID를 설정해주세요.
                </div>
              ) : (
                '학생 목록을 불러오는 중이거나 등록된 학생이 없습니다.'
              )}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            🎯 지급 사유
          </label>
          <select
            value={selectedSource}
            onChange={(e) => setSelectedSource(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
          >
            {getSourceOptions().map(option => (
              <option key={option.key} value={option.key}>
                {option.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">
            {getSourceOptions().find(opt => opt.key === selectedSource)?.description}
          </p>
        </div>

        <button
          onClick={handleAwardStar}
          disabled={loading || !selectedStudent}
          className="w-full bg-gradient-to-r from-yellow-400 to-orange-400 text-white font-bold py-3 px-4 rounded-lg hover:from-yellow-500 hover:to-orange-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-300"
        >
          {loading ? '지급 중...' : `⭐ 별 ${STAR_SOURCES[selectedSource]?.amount || 1}개 지급하기`}
        </button>
      </div>

      {/* 학급 별 순위 모달 */}
      {showRanking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-800">🏆 학급 별 순위</h3>
              <button
                onClick={() => setShowRanking(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              {classRanking.map((student, index) => (
                <div key={student.userId} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl">
                  <div className="text-2xl font-bold text-gray-600 w-8">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-800">
                      {student.studentNumber}번 - {student.email.split('@')[0]}
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
              
              {classRanking.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  아직 별을 획득한 학생이 없습니다.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherStarPanel; 