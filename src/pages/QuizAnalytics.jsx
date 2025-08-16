import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getClassQuizData, calculateQuestionStats, calculateStudentPerformance, calculateClassStats } from '../utils/quizAnalytics';
import { getCachedLessonConfigs } from '../data/lessonConfigs';

// 학생 상세 분석 모달
const StudentDetailModal = ({ student, allQuizData, allLessonConfigs, onClose }) => {
  const performance = calculateStudentPerformance(student, allQuizData, allLessonConfigs);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">
              📊 {performance.studentName} 학습 분석
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>
          </div>

          {/* 전체 성과 요약 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-blue-600">{performance.averageScore}%</div>
              <div className="text-sm text-gray-600">전체 평균 점수</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-green-600">{performance.completedLessons}</div>
              <div className="text-sm text-gray-600">완료한 차시</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-purple-600">{performance.correctAnswers}</div>
              <div className="text-sm text-gray-600">맞힌 문제 수</div>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-orange-600">{performance.weakQuestions.length}</div>
              <div className="text-sm text-gray-600">틀린 문제 수</div>
            </div>
          </div>

          {/* 틀린 문제 분석 */}
          {performance.weakQuestions.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-red-600 mb-3">❌ 틀린 문제 분석</h3>
              <div className="space-y-3">
                {performance.weakQuestions.map((item, index) => (
                  <div key={index} className="bg-red-50 p-4 rounded-lg border-l-4 border-red-400">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-medium text-gray-800">{item.lessonId}차시</span>
                      <span className="text-sm text-gray-500">문제 {item.questionId}</span>
                    </div>
                    <div className="text-gray-700 mb-2">{item.question}</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-red-600 font-medium">선택한 답: </span>
                        <span>{item.studentAnswer || '미응답'}</span>
                      </div>
                      <div>
                        <span className="text-green-600 font-medium">정답: </span>
                        <span>{item.correctAnswer}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 맞힌 문제 (최근 5개만 표시) */}
          {performance.strongQuestions.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-green-600 mb-3">
                ✅ 맞힌 문제 ({performance.strongQuestions.length}개 중 최근 5개)
              </h3>
              <div className="space-y-2">
                {performance.strongQuestions.slice(-5).map((item, index) => (
                  <div key={index} className="bg-green-50 p-3 rounded-lg border-l-4 border-green-400">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-800">{item.lessonId}차시</span>
                      <span className="text-sm text-gray-500">문제 {item.questionId}</span>
                    </div>
                    <div className="text-gray-700 text-sm mt-1">{item.question}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// 문항 분석 탭
const QuestionAnalysisTab = ({ allQuizData, allLessonConfigs }) => {
  const [selectedLesson, setSelectedLesson] = useState('1');
  
  const lessonData = allQuizData[selectedLesson];
  const lessonConfig = allLessonConfigs[selectedLesson];
  const questionStats = calculateQuestionStats(lessonData, lessonConfig);

  return (
    <div>
      {/* 차시 선택 */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">차시 선택</label>
        <select
          value={selectedLesson}
          onChange={(e) => setSelectedLesson(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {Object.keys(allQuizData).map(lessonId => (
            <option key={lessonId} value={lessonId}>{lessonId}차시</option>
          ))}
        </select>
      </div>

      {/* 문항별 통계 */}
      <div className="space-y-4">
        {questionStats.map((stat, index) => (
          <div key={stat.questionId} className={`p-4 rounded-lg border-l-4 ${
            stat.isWeakPoint ? 'bg-red-50 border-red-400' : 'bg-green-50 border-green-400'
          }`}>
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-medium text-gray-800">문제 {index + 1}</h4>
              <div className="flex items-center space-x-4">
                <span className={`px-2 py-1 rounded text-sm font-medium ${
                  stat.isWeakPoint ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                }`}>
                  정답률 {stat.correctRate}%
                </span>
                <span className="text-sm text-gray-500">
                  {stat.correctAnswers}/{stat.totalAttempts}명
                </span>
              </div>
            </div>
            
            <div className="text-gray-700 mb-3">{stat.question}</div>
            
            {/* 정답률 바 */}
            <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
              <div
                className={`h-2 rounded-full ${
                  stat.isWeakPoint ? 'bg-red-400' : 'bg-green-400'
                }`}
                style={{ width: `${stat.correctRate}%` }}
              ></div>
            </div>
            
            <div className="text-sm text-gray-600">
              <span className="font-medium">정답: </span>{stat.correctAnswer}
              {stat.isWeakPoint && (
                <span className="ml-4 text-red-600 font-medium">⚠️ 취약 문항</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// 학생별 분석 탭
const StudentAnalysisTab = ({ allQuizData, allLessonConfigs, onStudentClick }) => {
  // 모든 학생의 성과 계산
  const allStudents = new Set();
  Object.values(allQuizData).forEach(lessonData => {
    lessonData.students.forEach(student => {
      allStudents.add(JSON.stringify({
        studentId: student.studentId,
        studentName: student.studentName
      }));
    });
  });

  const studentPerformances = Array.from(allStudents).map(studentStr => {
    const student = JSON.parse(studentStr);
    return calculateStudentPerformance(student, allQuizData, allLessonConfigs);
  }).sort((a, b) => b.averageScore - a.averageScore);

  return (
    <div className="space-y-4">
      {studentPerformances.map((performance, index) => (
        <div
          key={performance.studentId}
          onClick={() => onStudentClick({
            studentId: performance.studentId,
            studentName: performance.studentName
          })}
          className="p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md cursor-pointer transition-shadow"
        >
          <div className="flex justify-between items-center mb-2">
            <h4 className="font-medium text-gray-800 flex items-center">
              <span className="mr-2">#{index + 1}</span>
              {performance.studentName}
            </h4>
            <div className="flex items-center space-x-4">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                performance.averageScore >= 80 ? 'bg-green-100 text-green-800' :
                performance.averageScore >= 60 ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                평균 {performance.averageScore}%
              </span>
              <span className="text-sm text-gray-500">
                {performance.completedLessons}/{performance.totalLessons} 차시 완료
              </span>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4 text-sm text-gray-600">
            <div>
              <span className="font-medium">맞힌 문제: </span>
              <span className="text-green-600">{performance.correctAnswers}</span>
            </div>
            <div>
              <span className="font-medium">틀린 문제: </span>
              <span className="text-red-600">{performance.weakQuestions.length}</span>
            </div>
            <div>
              <span className="font-medium">전체 문제: </span>
              <span>{performance.totalQuestions}</span>
            </div>
          </div>
          
          {/* 진행률 바 */}
          <div className="mt-3">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${
                  performance.averageScore >= 80 ? 'bg-green-400' :
                  performance.averageScore >= 60 ? 'bg-yellow-400' :
                  'bg-red-400'
                }`}
                style={{ width: `${performance.averageScore}%` }}
              ></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// 메인 컴포넌트
const QuizAnalytics = () => {
  const { currentUser, classId, fetchClassStudents } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [allQuizData, setAllQuizData] = useState({});
  const [allLessonConfigs, setAllLessonConfigs] = useState({});
  const [classStats, setClassStats] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);

  useEffect(() => {
    const loadAnalyticsData = async () => {
      if (!currentUser || !classId) return;

      try {
        setLoading(true);
        
        // 레슨 설정들 로드
        const configs = await getCachedLessonConfigs();
        setAllLessonConfigs(configs);
        
        // 퀴즈 데이터 로드 (fetchClassStudents 전달)
        const data = await getClassQuizData(classId, fetchClassStudents);
        setAllQuizData(data.quizData);
        
        // 전체 통계 계산
        const stats = calculateClassStats(data.quizData, configs);
        setClassStats(stats);
        
      } catch (error) {
        console.error('Error loading analytics data:', error);
        setError('데이터를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    loadAnalyticsData();
  }, [currentUser, classId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">퀴즈 데이터를 분석하고 있습니다...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">📊 퀴즈 분석 대시보드</h1>
          <p className="text-gray-600">우리 반 학생들의 퀴즈 성과를 상세히 분석해보세요</p>
        </div>

        {/* 전체 통계 카드 */}
        {classStats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-2xl font-bold text-blue-600">{classStats.totalStudents}명</div>
              <div className="text-gray-600">전체 학생 수</div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-2xl font-bold text-green-600">{classStats.averageClassScore}%</div>
              <div className="text-gray-600">학급 평균 점수</div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-2xl font-bold text-purple-600">{classStats.totalLessons}개</div>
              <div className="text-gray-600">전체 차시</div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-2xl font-bold text-orange-600">{classStats.mostDifficultQuestions.length}</div>
              <div className="text-gray-600">취약 문항</div>
            </div>
          </div>
        )}

        {/* 탭 네비게이션 */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'overview', name: '📈 전체 현황', icon: '📈' },
                { id: 'students', name: '👥 학생별 분석', icon: '👥' },
                { id: 'questions', name: '📝 문항별 분석', icon: '📝' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-2 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'overview' && classStats && (
              <div className="space-y-6">
                {/* 가장 어려운 문제 */}
                <div>
                  <h3 className="text-lg font-semibold text-red-600 mb-4">❌ 가장 어려운 문제 TOP 5</h3>
                  <div className="space-y-3">
                    {classStats.mostDifficultQuestions.map((question, index) => (
                      <div key={`${question.lessonId}-${question.questionId}`} className="bg-red-50 p-4 rounded-lg border-l-4 border-red-400">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium">#{index + 1} - {question.lessonId}차시</span>
                          <span className="text-red-600 font-bold">{question.correctRate}% 정답률</span>
                        </div>
                        <div className="text-gray-700">{question.question}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 차시별 완료율 */}
                <div>
                  <h3 className="text-lg font-semibold text-blue-600 mb-4">📚 차시별 완료율</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Object.entries(classStats.lessonCompletionRates).map(([lessonId, data]) => (
                      <div key={lessonId} className="bg-blue-50 p-4 rounded-lg text-center">
                        <div className="text-xl font-bold text-blue-600">{data.rate}%</div>
                        <div className="text-sm text-gray-600">{lessonId}차시</div>
                        <div className="text-xs text-gray-500">{data.completed}/{data.total}명</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'students' && (
              <StudentAnalysisTab
                allQuizData={allQuizData}
                allLessonConfigs={allLessonConfigs}
                onStudentClick={setSelectedStudent}
              />
            )}

            {activeTab === 'questions' && (
              <QuestionAnalysisTab
                allQuizData={allQuizData}
                allLessonConfigs={allLessonConfigs}
              />
            )}
          </div>
        </div>
      </div>

      {/* 학생 상세 모달 */}
      {selectedStudent && (
        <StudentDetailModal
          student={selectedStudent}
          allQuizData={allQuizData}
          allLessonConfigs={allLessonConfigs}
          onClose={() => setSelectedStudent(null)}
        />
      )}
    </div>
  );
};

export default QuizAnalytics;
