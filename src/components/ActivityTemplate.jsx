import React, { useState } from 'react';

function ActivityTemplate({ lessonConfig, children }) {
  const [currentStep, setCurrentStep] = useState(0);
  const steps = [
    { name: '소개', description: lessonConfig?.goal || '학습 목표 로딩 중...' },
    { name: '기초 배움', content: lessonConfig?.basicLearning || '내용 로딩 중...' },
    { name: '가이드 활동', content: lessonConfig?.guidedActivity || '내용 로딩 중...' }, // MapView가 여기에 들어갈 수 있음
    { name: '자유 활동', content: lessonConfig?.freeActivity || '내용 로딩 중...' },
  ];

  const handleNext = () => {
    setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
  };

  const handlePrev = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  return (
    <div className="border rounded-lg p-6 shadow-lg">
      <h2 className="text-2xl font-bold mb-4">{lessonConfig?.title || '레슨 제목'}</h2>

      {/* Step Indicator */}
      <div className="flex justify-center space-x-4 mb-6">
        {steps.map((step, index) => (
          <div key={index} className={`px-3 py-1 rounded-full text-sm ${index === currentStep ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>
            {step.name}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div className="mb-6 min-h-[200px]">
        <h3 className="text-xl font-semibold mb-2">{steps[currentStep].name}</h3>
        {/* Render specific content based on step, potentially passing children */} 
        {currentStep === 0 && <div>{steps[currentStep].description}</div>}
        {currentStep === 1 && <div>{steps[currentStep].content}</div>}
        {currentStep === 2 && <div>{/* MapView or other guided activity content */}{children}</div>} 
        {currentStep === 3 && <div>{/* Free activity input/display */}{steps[currentStep].content}</div>} 
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <button
          onClick={handlePrev}
          disabled={currentStep === 0}
          className="px-4 py-2 bg-gray-300 rounded disabled:opacity-50"
        >
          이전
        </button>
        {currentStep < steps.length - 1 ? (
          <button onClick={handleNext} className="px-4 py-2 bg-blue-500 text-white rounded">
            다음
          </button>
        ) : (
          <button className="px-4 py-2 bg-green-500 text-white rounded">
            인증장 발급 (구현 필요)
          </button>
        )}
      </div>
    </div>
  );
}

export default ActivityTemplate; 