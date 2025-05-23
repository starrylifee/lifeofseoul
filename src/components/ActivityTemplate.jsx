import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { updateLessonProgress } from '../utils/api';
import { LESSON_STEPS } from '../utils/constants';
import '../assets/styles/map.css';

function ActivityTemplate({ lessonConfig, children, lessonId, activityData }) {
  const { currentUser } = useAuth();
  const [currentStep, setCurrentStep] = useState(LESSON_STEPS.INTRO);
  const [stepProgress, setStepProgress] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [certificateUrl, setCertificateUrl] = useState(null);

  const steps = [
    { name: '소개', description: lessonConfig?.goal || '학습 목표 로딩 중...' },
    { name: '기초 배움', content: lessonConfig?.basicLearning || '내용 로딩 중...' },
    { name: '가이드 활동', content: lessonConfig?.guidedActivity || '내용 로딩 중...' },
    { name: '자유 활동', content: lessonConfig?.freeActivity || '내용 로딩 중...' },
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
        setCurrentStep(stepIndex + 1);
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
    setCurrentStep((prev) => Math.max(prev - 1, 0));
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

  return (
    <div className="border rounded-lg p-6 shadow-lg">
      <h2 className="text-2xl font-bold mb-4">{lessonConfig?.title || '레슨 제목'}</h2>

      {/* Step Indicator */}
      <div className="flex justify-center space-x-4 mb-6">
        {steps.map((step, index) => (
          <div 
            key={index} 
            className={`px-3 py-1 rounded-full text-sm ${
              index === currentStep 
                ? 'bg-blue-500 text-white' 
                : stepProgress[`step${index}`] 
                  ? 'bg-green-500 text-white' 
                  : 'bg-gray-200'
            }`}
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
      <div className="mb-6 min-h-[200px]">
        <h3 className="text-xl font-semibold mb-2">{steps[currentStep].name}</h3>
        
        {currentStep === LESSON_STEPS.INTRO && <div>{steps[currentStep].description}</div>}
        {currentStep === LESSON_STEPS.BASIC && <div>{steps[currentStep].content}</div>}
        {currentStep === LESSON_STEPS.GUIDED && (
          <div>
            <p className="mb-3">{steps[currentStep].content}</p>
            {children}
          </div>
        )} 
        {currentStep === LESSON_STEPS.FREE && (
          <div>
            <p className="mb-3">{steps[currentStep].content}</p>
            <textarea 
              className="w-full p-2 border rounded" 
              rows="4"
              placeholder="자유 활동 내용을 입력하세요..."
            ></textarea>
          </div>
        )}
      </div>

      {/* Certificate Display (if generated) */}
      {certificateUrl && (
        <div className="mb-6 text-center">
          <h3 className="text-xl font-semibold mb-2">인증장</h3>
          <img 
            src={certificateUrl} 
            alt="학습 인증장" 
            className="max-w-full h-auto mx-auto border p-2"
          />
          <button 
            onClick={() => window.open(certificateUrl, '_blank')}
            className="mt-2 px-4 py-2 bg-blue-500 text-white rounded"
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
          className="px-4 py-2 bg-gray-300 rounded disabled:opacity-50"
        >
          이전
        </button>

        {currentStep < steps.length - 1 ? (
          <button 
            onClick={handleNext} 
            disabled={isLoading}
            className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
          >
            {isLoading ? '저장 중...' : '다음'}
          </button>
        ) : allStepsCompleted ? (
          <button 
            onClick={generateCertificate} 
            disabled={isLoading || certificateUrl}
            className="px-4 py-2 bg-green-500 text-white rounded disabled:opacity-50"
          >
            {isLoading ? '생성 중...' : certificateUrl ? '인증장 발급 완료' : '인증장 발급'}
          </button>
        ) : (
          <button 
            onClick={() => handleStepComplete(currentStep)} 
            disabled={isLoading}
            className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
          >
            {isLoading ? '저장 중...' : '완료'}
          </button>
        )}
      </div>
    </div>
  );
}

export default ActivityTemplate; 