import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import ActivityTemplate from './ActivityTemplate';
import MapView from './MapView'; // 가이드 활동 단계에서 사용될 수 있음
import '../assets/styles/map.css';

// Receive lessonId, activityData from LessonPage
function LessonView({ lessonConfig, lessonId, activityData }) {
  // lessonConfig: 레슨의 목표, 단계별 설명 등 (lessons/lessonX/config.js 에서 로드)
  // lessonData: 레슨의 초기 데이터, 사용자 활동 데이터 등 (lessons/lessonX/data.json 또는 Firebase 에서 로드)

  const { currentUser } = useAuth();
  const [answers, setAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [savedAnswers, setSavedAnswers] = useState({});
  const [questionsCompleted, setQuestionsCompleted] = useState(0);
  const [loading, setLoading] = useState(false);

  // 기존 답안 불러오기
  useEffect(() => {
    const loadSavedAnswers = async () => {
      if (!currentUser || !lessonId) return;

      try {
        const activityDocRef = doc(db, "lessons", lessonId, "activities", currentUser.uid);
        const activityDoc = await getDoc(activityDocRef);
        
        if (activityDoc.exists()) {
          const data = activityDoc.data();
          setSavedAnswers(data.answers || {});
          setQuestionsCompleted(data.questionsCompleted || 0);
          
          // 이미 완료된 답안이 있으면 표시
          if (data.answers && Object.keys(data.answers).length > 0) {
            setAnswers(data.answers);
            setShowResults(true);
          }
        }
      } catch (error) {
        console.error("Error loading saved answers:", error);
      }
    };

    loadSavedAnswers();
  }, [currentUser, lessonId]);

  const handleAnswerChange = (questionId, answer) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleSubmitAnswers = async () => {
    if (!currentUser || !lessonId) return;

    setLoading(true);
    setShowResults(true);

    try {
      // 정답 개수 계산
      let correctCount = 0;
      lessonConfig.questions.forEach(question => {
        if (answers[question.id] === question.answer) {
          correctCount++;
        }
      });

      // Firebase에 결과 저장
      const activityDocRef = doc(db, "lessons", lessonId, "activities", currentUser.uid);
      const saveData = {
        answers,
        questionsCompleted: correctCount,
        totalQuestions: lessonConfig.questions.length,
        completedAt: new Date(),
        lessonId,
        userId: currentUser.uid
      };

      await setDoc(activityDocRef, saveData, { merge: true });
      
      setQuestionsCompleted(correctCount);
      setSavedAnswers(answers);
      
      // 성공 메시지
      if (correctCount === lessonConfig.questions.length) {
        alert(`🎉 축하합니다! 모든 문제를 맞혔습니다! (${correctCount}/${lessonConfig.questions.length})`);
      } else {
        alert(`📝 결과가 저장되었습니다! 정답: ${correctCount}/${lessonConfig.questions.length}개`);
      }
      
    } catch (error) {
      console.error("Error saving answers:", error);
      alert('답안 저장에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  const getResultColor = (questionId) => {
    const question = lessonConfig?.questions?.find(q => q.id === questionId);
    if (!question || !answers[questionId]) return '';
    return answers[questionId] === question.answer ? 'text-green-600' : 'text-red-600';
  };

  const getCorrectAnswersCount = () => {
    if (!lessonConfig?.questions) return 0;
    return lessonConfig.questions.filter(question => 
      answers[question.id] === question.answer
    ).length;
  };

  console.log("LessonView 렌더링:", {
    lessonConfigTitle: lessonConfig?.title || "설정 없음",
    lessonId,
    hasMapConfig: !!lessonConfig?.mapConfig,
    mapCenter: lessonConfig?.mapConfig?.center,
    mapZoom: lessonConfig?.mapConfig?.zoom,
    questionsCount: lessonConfig?.questions?.length || 0,
    questionsCompleted
  });

  return (
    <div>
      {/* 디버깅 정보 */}
      <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
        📚 레슨 정보: {lessonConfig?.title || "로딩중..."} | 
        지도설정: {lessonConfig?.mapConfig ? "있음" : "없음"} | 
        질문: {lessonConfig?.questions?.length || 0}개 |
        완료: {questionsCompleted}개
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
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-lg font-bold text-blue-800">🗺️ 위치 관계 확인하기</h4>
            {questionsCompleted > 0 && (
              <div className="bg-white px-3 py-1 rounded-full text-sm font-medium">
                <span className="text-green-600">✅ {questionsCompleted}</span>
                <span className="text-gray-500">/{lessonConfig.questions.length}</span>
              </div>
            )}
          </div>
          
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
              disabled={Object.keys(answers).length < lessonConfig.questions.length || loading}
              className="mt-4 w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? '저장 중...' : '정답 확인하기'}
            </button>
          ) : (
            <div className="mt-4 space-y-2">
              <div className="bg-white p-3 rounded-lg text-center">
                <span className="text-lg font-bold">
                  결과: {getCorrectAnswersCount()}/{lessonConfig.questions.length}개 정답
                </span>
                {getCorrectAnswersCount() === lessonConfig.questions.length && (
                  <div className="text-green-600 font-medium mt-1">🎉 완벽합니다!</div>
                )}
              </div>
              <button
                onClick={() => {
                  setAnswers({});
                  setShowResults(false);
                }}
                className="w-full bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors"
              >
                다시 풀어보기
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default LessonView; 