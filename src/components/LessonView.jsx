import React from 'react';
import ActivityTemplate from './ActivityTemplate';
import MapView from './MapView'; // 가이드 활동 단계에서 사용될 수 있음
import '../assets/styles/map.css';

// Receive lessonId, activityData from LessonPage
function LessonView({ lessonConfig, lessonId, activityData }) {
  // lessonConfig: 레슨의 목표, 단계별 설명 등 (lessons/lessonX/config.js 에서 로드)
  // lessonData: 레슨의 초기 데이터, 사용자 활동 데이터 등 (lessons/lessonX/data.json 또는 Firebase 에서 로드)

  // TODO: Load initial data based on lessonId if needed (e.g., base map layers)

  return (
    <div>
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
    </div>
  );
}

export default LessonView; 