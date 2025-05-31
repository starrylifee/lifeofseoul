import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { awardStarsForQuiz } from '../utils/starAPI';

function QuizComponent({ lessonConfig, lessonId }) {
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
    if (Object.keys(answers).length < lessonConfig.questions.length) {
      alert('모든 문제에 답해주세요.');
      return;
    }

    setLoading(true);
    
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
      
      // 별 지급 (퀴즈를 처음 완료한 경우에만)
      let starsAwarded = 0;
      if (correctCount === lessonConfig.questions.length && questionsCompleted !== correctCount) {
        try {
          starsAwarded = await awardStarsForQuiz(currentUser.uid, lessonId);
          console.log(`별 ${starsAwarded}개 지급됨!`);
        } catch (starError) {
          console.error('별 지급 실패:', starError);
          // 별 지급 실패해도 퀴즈 결과는 저장됨
        }
      }
      
      setQuestionsCompleted(correctCount);
      setSavedAnswers(answers);
      
      // 성공 메시지
      if (correctCount === lessonConfig.questions.length) {
        const message = starsAwarded > 0 
          ? `🎉 축하합니다! 모든 문제를 맞혔습니다! ⭐ 별 ${starsAwarded}개를 획득했어요! (${correctCount}/${lessonConfig.questions.length})`
          : `🎉 축하합니다! 모든 문제를 맞혔습니다! (${correctCount}/${lessonConfig.questions.length})`;
        alert(message);
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

  if (!lessonConfig?.questions || lessonConfig.questions.length === 0) {
    return <div>퀴즈 문제가 없습니다.</div>;
  }

  // 차시별 퀴즈 제목 생성
  const getQuizTitle = () => {
    const title = lessonConfig?.title || '';
    if (title.includes('1차시')) return '🗺️ 서울과 경기도 위치 관계 확인하기';
    if (title.includes('2차시')) return '🌊 한강과 하천 위치 확인하기';
    if (title.includes('3차시')) return '🚇 교통 노선과 위치 확인하기';
    if (title.includes('4차시')) return '🚉 교통 중심지 확인하기';
    if (title.includes('5차시')) return '🏛️ 행정기관 위치 확인하기';
    if (title.includes('6차시')) return '🎭 문화시설 위치 확인하기';
    if (title.includes('7차시')) return '🏯 궁궐 위치 확인하기';
    if (title.includes('8차시')) return '🏰 한양도성 위치 확인하기';
    return '🗺️ 위치 관계 확인하기';
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h4 className="text-lg font-bold text-blue-800">{getQuizTitle()}</h4>
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
  );
}

export default QuizComponent; 