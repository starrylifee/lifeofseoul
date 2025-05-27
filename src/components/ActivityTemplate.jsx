import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { updateLessonProgress } from '../utils/api';
import { LESSON_STEPS } from '../utils/constants';
import '../assets/styles/map.css';

function ActivityTemplate({ lessonConfig, children, lessonId, activityData, onStepChange }) {
  const { currentUser } = useAuth();
  const [currentStep, setCurrentStep] = useState(LESSON_STEPS.INTRO);
  const [stepProgress, setStepProgress] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [certificateUrl, setCertificateUrl] = useState(null);

  const steps = [
    { 
      name: '소개', 
      key: 'introduction',
      description: '차시 목표와 학습 동기 유발' 
    },
    { 
      name: '기초 배움', 
      key: 'basicLearning',
      description: '교사 예시 데이터로 학습' 
    },
    { 
      name: '가이드 활동', 
      key: 'guidedActivity',
      description: '교사의 구체적 미션 수행' 
    },
    { 
      name: '확인문제', 
      key: 'quiz',
      description: '학습 내용 확인하기' 
    },
    { 
      name: '함께 만들어가는 서울', 
      key: 'collaborativeActivity',
      description: '다른 반과 공유하고 협력' 
    },
  ];

  // 진행 상태 초기화
  useEffect(() => {
    if (activityData?.progress) {
      setStepProgress(activityData.progress);
      
      // 마지막으로 진행 중이던 단계로 이동
      for (let i = steps.length - 1; i >= 0; i--) {
        if (activityData.progress[`step${i}`]) {
          setCurrentStep(i);
          break;
        }
      }
    }
  }, [activityData, steps.length]);

  const handleStepComplete = async (stepIndex) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // 해당 단계 완료 상태로 업데이트
      await updateLessonProgress(lessonId, currentUser.uid, stepIndex, true);
      
      // 로컬 상태 업데이트
      setStepProgress(prev => ({
        ...prev,
        [`step${stepIndex}`]: true
      }));
      
      // 다음 단계로 이동
      if (stepIndex < steps.length - 1) {
        const nextStep = stepIndex + 1;
        setCurrentStep(nextStep);
        if (onStepChange) {
          onStepChange(nextStep);
        }
      }
    } catch (err) {
      console.error("Error updating progress:", err);
      setError("진행 상태를 저장하는 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleNext = () => {
    // 현재 단계를 완료 처리하고 다음으로 이동
    handleStepComplete(currentStep);
  };

  const handlePrev = () => {
    const newStep = Math.max(currentStep - 1, 0);
    setCurrentStep(newStep);
    if (onStepChange) {
      onStepChange(newStep);
    }
  };

  const generateCertificate = async () => {
    try {
      setIsLoading(true);
      // 인증장 생성 로직 (예: PDF 생성 또는 특별한 상태 저장)
      // 일단은 간단히 이미지 URL만 반환하는 것으로 대체
      const url = `/certificates/lesson${lessonId}.png`;
      setCertificateUrl(url);
      
      // 나중에는 Firebase Storage에 저장된 URL을 반환하거나, 
      // 실시간으로 PDF를 생성하는 로직을 구현할 수 있음
    } catch (err) {
      console.error("Error generating certificate:", err);
      setError("인증장 발급 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  // 모든 단계가 완료되었는지 확인
  const allStepsCompleted = Object.keys(stepProgress).length === steps.length &&
    Object.values(stepProgress).every(value => value === true);

  // 소개 단계 렌더링
  const renderIntroduction = () => {
    const intro = lessonConfig?.introduction;
    if (!intro) return <div>소개 내용을 로딩 중...</div>;

    return (
      <div className="space-y-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="text-lg font-semibold mb-3 text-blue-800">🎯 학습 목표</h4>
          <ul className="space-y-2">
            {intro.objectives?.map((objective, index) => (
              <li key={index} className="flex items-start">
                <span className="text-blue-600 mr-2">✓</span>
                <span className="text-gray-700">{objective}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-green-50 p-4 rounded-lg">
          <h4 className="text-lg font-semibold mb-3 text-green-800">📖 학습 맥락</h4>
          <p className="text-gray-700 leading-relaxed">{intro.context}</p>
        </div>

        <div className="bg-yellow-50 p-4 rounded-lg">
          <h4 className="text-lg font-semibold mb-3 text-yellow-800">🏠 실생활 연관성</h4>
          <p className="text-gray-700 leading-relaxed">{intro.realLifeConnection}</p>
        </div>

        <div className="bg-purple-50 p-4 rounded-lg">
          <h4 className="text-lg font-semibold mb-3 text-purple-800">🤔 생각해볼 질문들</h4>
          <ul className="space-y-2">
            {intro.curiosityQuestions?.map((question, index) => (
              <li key={index} className="flex items-start">
                <span className="text-purple-600 mr-2">❓</span>
                <span className="text-gray-700">{question}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  };

  // 기초 배움 단계 렌더링
  const renderBasicLearning = () => {
    const basicLearning = lessonConfig?.basicLearning;
    if (!basicLearning) return <div>기초 배움 내용을 로딩 중...</div>;

    return (
      <div className="space-y-4">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="text-lg font-semibold mb-3 text-gray-800">📚 기초 배움 내용</h4>
          {Array.isArray(basicLearning) ? (
            <ul className="space-y-2">
              {basicLearning.map((item, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-blue-600 mr-2">📍</span>
                  <span className="text-gray-700">{item}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-700">{basicLearning}</p>
          )}
        </div>
        
        {/* 기초 배움 단계에서도 지도 표시 */}
        <div className="mt-4">
          <h4 className="text-lg font-medium mb-2 text-gray-800">🗺️ 지도에서 확인하기</h4>
          <div className="border rounded-lg p-2">
            {children}
          </div>
        </div>
      </div>
    );
  };

  // 가이드 활동 단계 렌더링
  const renderGuidedActivity = () => {
    const guidedActivity = lessonConfig?.guidedActivity;
    if (!guidedActivity) return <div>가이드 활동 내용을 로딩 중...</div>;

    return (
      <div className="space-y-4">
        <div className="bg-orange-50 p-4 rounded-lg">
          <h4 className="text-lg font-semibold mb-3 text-orange-800">🎯 {guidedActivity.title || '가이드 활동'}</h4>
          
          {guidedActivity.missions && Array.isArray(guidedActivity.missions) ? (
            <div className="space-y-4">
              {guidedActivity.missions.map((mission, index) => (
                <div key={mission.id || index} className="bg-white p-4 rounded-lg border border-orange-200">
                  <h5 className="font-semibold text-orange-700 mb-2">
                    미션 {index + 1}: {mission.title}
                  </h5>
                  <p className="text-gray-700 mb-2">{mission.description}</p>
                  {mission.example && (
                    <p className="text-sm text-gray-600 italic bg-gray-100 p-2 rounded">
                      {mission.example}
                    </p>
                  )}
                  {mission.requiredImages > 0 && (
                    <p className="text-sm text-blue-600 mt-2">
                      📷 이미지 {mission.requiredImages}개 필요
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : Array.isArray(guidedActivity) ? (
            <ul className="space-y-2">
              {guidedActivity.map((item, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-orange-600 mr-2">🎯</span>
                  <span className="text-gray-700">{item}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-700">{guidedActivity}</p>
          )}
        </div>
        
        {/* 가이드 활동 단계에서도 지도 표시 */}
        <div className="mt-4">
          <h4 className="text-lg font-medium mb-2 text-gray-800">🗺️ 미션 수행하기</h4>
          <div className="border rounded-lg p-2">
            {children}
          </div>
        </div>
      </div>
    );
  };

  // 확인문제 단계 렌더링
  const renderQuiz = () => {
    return (
      <div className="space-y-4">
        <div className="bg-yellow-50 p-4 rounded-lg">
          <h4 className="text-lg font-semibold mb-3 text-yellow-800">📝 확인문제</h4>
          <p className="text-gray-700 mb-3">지금까지 학습한 내용을 확인해보세요!</p>
        </div>
        
        {/* 퀴즈 컴포넌트가 여기에 렌더링됩니다 */}
        <div className="quiz-container">
          {children}
        </div>
      </div>
    );
  };

  // 함께 만들어가는 서울 단계 렌더링
  const renderCollaborativeActivity = () => {
    const collaborativeActivity = lessonConfig?.collaborativeActivity;
    if (!collaborativeActivity) return <div>협력 활동 내용을 로딩 중...</div>;

    return (
      <div className="space-y-4">
        <div className="bg-green-50 p-4 rounded-lg">
          <h4 className="text-lg font-semibold mb-3 text-green-800">🤝 함께 만들어가는 서울</h4>
          <p className="text-gray-700 leading-relaxed">{collaborativeActivity}</p>
        </div>
        
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="text-lg font-semibold mb-3 text-blue-800">👥 다른 반 활동 보기</h4>
          <p className="text-gray-600 mb-3">다른 반 친구들의 활동을 구경하고 댓글로 소통해보세요!</p>
          
          {/* 여기에 다른 반 활동을 보여주는 컴포넌트가 들어갈 예정 */}
          <div className="bg-white p-4 rounded border border-blue-200">
            <p className="text-gray-500 text-center">다른 반 활동 목록이 여기에 표시됩니다.</p>
          </div>
        </div>
        
        {/* 협력 활동에서도 지도 표시 */}
        <div className="mt-4">
          <h4 className="text-lg font-medium mb-2 text-gray-800">🗺️ 우리 반 활동 결과</h4>
          <div className="border rounded-lg p-2">
            {children}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="border rounded-lg p-6 shadow-lg">
      <h2 className="text-2xl font-bold mb-4">{lessonConfig?.title || '레슨 제목'}</h2>

      {/* Step Indicator */}
      <div className="flex justify-center space-x-2 mb-6 overflow-x-auto">
        {steps.map((step, index) => (
          <div 
            key={index} 
            className={`px-3 py-2 rounded-full text-sm whitespace-nowrap cursor-pointer transition-colors ${
              index === currentStep 
                ? 'bg-blue-500 text-white' 
                : stepProgress[`step${index}`] 
                  ? 'bg-green-500 text-white' 
                  : 'bg-gray-200 hover:bg-gray-300'
            }`}
            onClick={() => {
              setCurrentStep(index);
              if (onStepChange) {
                onStepChange(index);
              }
            }}
          >
            {step.name}
          </div>
        ))}
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Step Content */}
      <div className="mb-6 min-h-[400px]">
        <div className="mb-4">
          <h3 className="text-xl font-semibold text-gray-800">{steps[currentStep].name}</h3>
          <p className="text-gray-600 text-sm">{steps[currentStep].description}</p>
        </div>
        
        {currentStep === LESSON_STEPS.INTRO && renderIntroduction()}
        {currentStep === LESSON_STEPS.BASIC && renderBasicLearning()}
        {currentStep === LESSON_STEPS.GUIDED && renderGuidedActivity()}
        {currentStep === LESSON_STEPS.QUIZ && renderQuiz()}
        {currentStep === LESSON_STEPS.COLLABORATIVE && renderCollaborativeActivity()}
      </div>

      {/* Certificate Display (if generated) */}
      {certificateUrl && (
        <div className="mb-6 text-center">
          <h3 className="text-xl font-semibold mb-2">🏆 인증장</h3>
          <img 
            src={certificateUrl} 
            alt="학습 인증장" 
            className="max-w-full h-auto mx-auto border p-2"
          />
          <button 
            onClick={() => window.open(certificateUrl, '_blank')}
            className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            인증장 다운로드
          </button>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <button
          onClick={handlePrev}
          disabled={currentStep === 0 || isLoading}
          className="px-4 py-2 bg-gray-300 rounded disabled:opacity-50 hover:bg-gray-400 transition-colors"
        >
          이전
        </button>

        {currentStep < steps.length - 1 ? (
          <button 
            onClick={handleNext} 
            disabled={isLoading}
            className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50 hover:bg-blue-600 transition-colors"
          >
            {isLoading ? '저장 중...' : '다음'}
          </button>
        ) : allStepsCompleted ? (
          <button 
            onClick={generateCertificate} 
            disabled={isLoading || certificateUrl}
            className="px-4 py-2 bg-green-500 text-white rounded disabled:opacity-50 hover:bg-green-600 transition-colors"
          >
            {isLoading ? '생성 중...' : certificateUrl ? '인증장 발급 완료' : '🏆 인증장 발급'}
          </button>
        ) : (
          <button 
            onClick={() => handleStepComplete(currentStep)} 
            disabled={isLoading}
            className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50 hover:bg-blue-600 transition-colors"
          >
            {isLoading ? '저장 중...' : '완료'}
          </button>
        )}
      </div>
    </div>
  );
}

export default ActivityTemplate; 