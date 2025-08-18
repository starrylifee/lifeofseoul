import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { doc, setDoc, getDoc, query, collection, where, getDocs } from 'firebase/firestore';
import { awardStarsForQuiz, getStarAttemptsForLesson } from '../utils/starAPI';

function QuizComponent({ lessonConfig, lessonId }) {
  const { currentUser } = useAuth();
  const [answers, setAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [, setSavedAnswers] = useState({});
  const [questionsCompleted, setQuestionsCompleted] = useState(0);
  const [loading, setLoading] = useState(false);
  const [starAttempts, setStarAttempts] = useState(0);
  const [firstAttemptPerfect, setFirstAttemptPerfect] = useState(false);

  // 선지 기반으로 정답 텍스트를 안정적으로 찾는 헬퍼
  const getCorrectOption = (question) => {
    const options = Array.isArray(question?.options) ? question.options : [];
    const answer = (question?.answer ?? '').toString();
    // 1) 완전 일치
    const exact = options.find((o) => o === answer);
    if (exact) return exact;
    // 2) 공백 제거/정규화 후 일치
    const strip = (s) => s.toString().replace(/\s+/g, '').trim();
    const normalized = options.find((o) => strip(o) === strip(answer));
    if (normalized) return normalized;
    // 3) 포함 관계 (양방향)
    const contains = options.find((o) => o.includes(answer) || answer.includes(o));
    if (contains) return contains;
    // 4) 최후 수단: 원문 반환
    return answer;
  };

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

        // 별 시도 횟수 확인
        const attempts = await getStarAttemptsForLesson(currentUser.uid, lessonId);
        setStarAttempts(attempts);

        // 첫 번째 시도에서 만점이었는지 확인
        if (attempts > 0) {
          const starHistoryQuery = query(
            collection(db, 'starHistory'),
            where('userId', '==', currentUser.uid),
            where('lessonId', '==', lessonId),
            where('source', '==', 'perfect_quiz')
          );
          const snapshot = await getDocs(starHistoryQuery);
          setFirstAttemptPerfect(snapshot.docs.length > 0);
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
      // 정답 개수 계산 (선지 정규화 매칭 사용)
      let correctCount = 0;
      lessonConfig.questions.forEach((question) => {
        const correctOption = getCorrectOption(question);
        if (answers[question.id] === correctOption) {
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
      
      // 별 지급 (재도전 1번 허용)
      let starsAwarded = 0;
      const isPerfectScore = correctCount === lessonConfig.questions.length;
      
      try {
        starsAwarded = await awardStarsForQuiz(currentUser.uid, lessonId, isPerfectScore);
        if (starsAwarded > 0) {
          console.log(`별 ${starsAwarded}개 지급됨!`);
          // 별 시도 횟수 업데이트
          const newAttempts = await getStarAttemptsForLesson(currentUser.uid, lessonId);
          setStarAttempts(newAttempts);
        }
      } catch (starError) {
        console.error('별 지급 실패:', starError);
        // 별 지급 실패해도 퀴즈 결과는 저장됨
      }
      
      setQuestionsCompleted(correctCount);
      setSavedAnswers(answers);
      // 제출 직후 결과 표시를 활성화하여 새로고침 없이 정오답 피드백을 보여줌
      setShowResults(true);
      
      // 성공 메시지 (시도 횟수에 따라 다른 메시지)
      if (isPerfectScore) {
        let message = '';
        if (starAttempts === 0) {
          // 첫 번째 시도 만점
          message = starsAwarded > 0 
            ? `🎉 축하합니다! 모든 문제를 맞혔습니다! ⭐ 별 ${starsAwarded}개를 획득했어요! (${correctCount}/${lessonConfig.questions.length})`
            : `🎉 축하합니다! 모든 문제를 맞혔습니다! (${correctCount}/${lessonConfig.questions.length})`;
        } else if (starAttempts === 1) {
          // 재도전 만점
          message = starsAwarded > 0 
            ? `🌟 재도전 성공! 만점으로 별 ${starsAwarded}개를 추가 획득했어요! (총 2개) (${correctCount}/${lessonConfig.questions.length})`
            : `🎉 재도전 성공! 모든 문제를 맞혔습니다! (${correctCount}/${lessonConfig.questions.length})`;
        } else {
          // 2번 모두 사용한 경우
          message = `🎉 완벽합니다! 모든 문제를 맞혔습니다! (${correctCount}/${lessonConfig.questions.length})`;
        }
        alert(message);
      } else if (correctCount > 0) {
        let message = '';
        if (starAttempts === 0) {
          // 첫 번째 시도
          message = starsAwarded > 0 
            ? `📝 결과가 저장되었습니다! 정답: ${correctCount}/${lessonConfig.questions.length}개 ⭐ 별 ${starsAwarded}개 획득! (재도전 기회 1번 있음)`
            : `📝 결과가 저장되었습니다! 정답: ${correctCount}/${lessonConfig.questions.length}개`;
        } else if (starAttempts === 1) {
          // 재도전에서 만점이 아닌 경우
          message = `📝 재도전 결과가 저장되었습니다! 정답: ${correctCount}/${lessonConfig.questions.length}개 (재도전에서는 만점일 때만 추가 별을 받을 수 있어요)`;
        } else {
          // 2번 모두 사용한 경우
          message = `📝 결과가 저장되었습니다! 정답: ${correctCount}/${lessonConfig.questions.length}개`;
        }
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
    const correctOption = getCorrectOption(question);
    return answers[questionId] === correctOption ? 'text-green-600' : 'text-red-600';
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
        <div className="flex items-center space-x-2">
          {questionsCompleted > 0 && (
            <div className="bg-white px-3 py-1 rounded-full text-sm font-medium">
              <span className="text-green-600">✅ {questionsCompleted}</span>
              <span className="text-gray-500">/{lessonConfig.questions.length}</span>
            </div>
          )}
          {starAttempts > 0 && (
            <div className="bg-yellow-50 px-3 py-1 rounded-full text-sm font-medium border border-yellow-200">
              <span className="text-yellow-600">⭐ {starAttempts}/2 시도</span>
            </div>
          )}
        </div>
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
              <option value="">정답을 선택하세요</option>
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
            {firstAttemptPerfect && (
              <div className="text-blue-600 font-medium mt-1">✨ 첫 시도 만점으로 최대 보상 획득!</div>
            )}
          </div>
          {!firstAttemptPerfect && starAttempts < 2 && (
            <button
              onClick={() => {
                setAnswers({});
                setShowResults(false);
              }}
              className="w-full bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors"
            >
              {starAttempts === 0 ? '다시 풀어보기' : 
               starAttempts === 1 ? '재도전하기 (만점 시 별 +1개)' : 
               '다시 풀어보기 (별 지급 완료)'}
            </button>
          )}
          {firstAttemptPerfect && (
            <div className="w-full bg-green-100 text-green-700 py-2 px-4 rounded-lg text-center font-medium">
              🏆 첫 시도 만점! 재도전 기회 없음 (최대 보상 달성)
            </div>
          )}
          {!firstAttemptPerfect && starAttempts >= 2 && (
            <div className="w-full bg-gray-100 text-gray-600 py-2 px-4 rounded-lg text-center font-medium">
              📝 모든 기회 사용 완료
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default QuizComponent; 