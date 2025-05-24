import React, { useState } from 'react';
import ActivityTemplate from './ActivityTemplate';
import MapView from './MapView'; // 가이드 활동 단계에서 사용될 수 있음
import '../assets/styles/map.css';

// Receive lessonId, activityData from LessonPage
function LessonView({ lessonConfig, lessonId, activityData }) {
  // lessonConfig: 레슨의 목표, 단계별 설명 등 (lessons/lessonX/config.js 에서 로드)
  // lessonData: 레슨의 초기 데이터, 사용자 활동 데이터 등 (lessons/lessonX/data.json 또는 Firebase 에서 로드)

  const [answers, setAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);

  const handleAnswerChange = (questionId, answer) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleSubmitAnswers = () => {
    setShowResults(true);
  };

  const getResultColor = (questionId) => {
    const question = lessonConfig?.questions?.find(q => q.id === questionId);
    if (!question || !answers[questionId]) return '';
    return answers[questionId] === question.answer ? 'text-green-600' : 'text-red-600';
  };

  console.log("LessonView 렌더링:", {
    lessonConfigTitle: lessonConfig?.title || "설정 없음",
    lessonId,
    hasMapConfig: !!lessonConfig?.mapConfig,
    mapCenter: lessonConfig?.mapConfig?.center,
    mapZoom: lessonConfig?.mapConfig?.zoom,
    questionsCount: lessonConfig?.questions?.length || 0
  });

  return (
    <div>
      {/* 디버깅 정보 */}
      <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
        📚 레슨 정보: {lessonConfig?.title || "로딩중..."} | 
        지도설정: {lessonConfig?.mapConfig ? "있음" : "없음"} | 
        질문: {lessonConfig?.questions?.length || 0}개
      </div>

      {/* ActivityTemplate을 사용하여 레슨 UI 렌더링 */}
      <ActivityTemplate 
        lessonConfig={lessonConfig} 
        lessonId={lessonId}
        activityData={activityData}
      >
        {/* MapView에 lessonId와 activityData 전달 */}
        <MapView 
          lessonId={lessonId} 
          activityData={activityData} 
          mapConfig={lessonConfig?.mapConfig}
        />
      </ActivityTemplate>

      {/* 필요시 추가 UI 요소 (예: 참고 자료 링크 등) */}
      {lessonConfig?.resources && (
        <div className="mt-4 p-4 border rounded bg-gray-50">
          <h4 className="font-semibold mb-2">참고 자료</h4>
          <a 
            href={lessonConfig.resources.url || '#'} // Provide a fallback href
            target="_blank" 
            rel="noopener noreferrer" 
            className={`text-blue-600 hover:underline ${!lessonConfig.resources.url ? 'opacity-50 cursor-not-allowed' : ''}`}
            aria-disabled={!lessonConfig.resources.url}
          >
            {lessonConfig.resources.description}
          </a>
        </div>
      )}

      {/* 위치 관련 질문 섹션 */}
      {lessonConfig?.questions && lessonConfig.questions.length > 0 && (
        <div className="mt-6 p-6 border rounded-lg bg-blue-50">
          <h4 className="text-lg font-bold mb-4 text-blue-800">🗺️ 위치 관계 확인하기</h4>
          <div className="space-y-4">
            {lessonConfig.questions.map((question) => (
              <div key={question.id} className="bg-white p-4 rounded-lg shadow-sm">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {question.text}
                </label>
                <select 
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={answers[question.id] || ''}
                  onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                  disabled={showResults}
                >
                  <option value="">방향을 선택하세요</option>
                  {question.options.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                {showResults && (
                  <div className={`mt-2 text-sm font-medium ${getResultColor(question.id)}`}>
                    {answers[question.id] === question.answer 
                      ? '✅ 정답입니다!' 
                      : `❌ 틀렸습니다. 정답: ${question.answer}`
                    }
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {!showResults ? (
            <button
              onClick={handleSubmitAnswers}
              disabled={Object.keys(answers).length < lessonConfig.questions.length}
              className="mt-4 w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              정답 확인하기
            </button>
          ) : (
            <button
              onClick={() => {
                setAnswers({});
                setShowResults(false);
              }}
              className="mt-4 w-full bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors"
            >
              다시 풀어보기
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default LessonView; 