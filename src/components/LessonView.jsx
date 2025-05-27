import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import ActivityTemplate from './ActivityTemplate';
import MapView from './MapView';
import QuizComponent from './QuizComponent';
import { LESSON_STEPS } from '../utils/constants';
import '../assets/styles/map.css';

// Receive lessonId, activityData from LessonPage
function LessonView({ lessonConfig, lessonId, activityData }) {
  // lessonConfig: 레슨의 목표, 단계별 설명 등 (lessons/lessonX/config.js 에서 로드)
  // lessonData: 레슨의 초기 데이터, 사용자 활동 데이터 등 (lessons/lessonX/data.json 또는 Firebase 에서 로드)

  const { currentUser } = useAuth();
  const [currentStep, setCurrentStep] = useState(LESSON_STEPS.INTRO);

  // 현재 단계를 ActivityTemplate에서 받아오기 위한 콜백
  const handleStepChange = (step) => {
    setCurrentStep(step);
  };



  // 현재 단계에 따라 렌더링할 컴포넌트 결정
  const renderStepContent = () => {
    if (currentStep === LESSON_STEPS.QUIZ) {
      return <QuizComponent lessonConfig={lessonConfig} lessonId={lessonId} />;
    } else {
      return (
        <MapView 
          lessonId={lessonId} 
          activityData={activityData} 
          mapConfig={lessonConfig?.mapConfig}
          currentStep={currentStep}
        />
      );
    }
  };

  return (
    <div>
      {/* 디버깅 정보 */}
      <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
        📚 레슨 정보: {lessonConfig?.title || "로딩중..."} | 
        지도설정: {lessonConfig?.mapConfig ? "있음" : "없음"} | 
        질문: {lessonConfig?.questions?.length || 0}개 |
        현재 단계: {currentStep}
      </div>

      {/* ActivityTemplate을 사용하여 레슨 UI 렌더링 */}
      <ActivityTemplate 
        lessonConfig={lessonConfig} 
        lessonId={lessonId}
        activityData={activityData}
        onStepChange={handleStepChange}
      >
        {renderStepContent()}
      </ActivityTemplate>


    </div>
  );
}

export default LessonView; 