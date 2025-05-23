import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import LessonView from '../components/LessonView';
// import { getLessonConfig, getLessonData } from '../utils/lessonLoader'; // Hypothetical lesson loader
// import MapView from '../components/MapView'; // Temporarily commented out to fix unused var warning

function LessonPage() {
  const { lessonId } = useParams();
  const [lessonConfig, setLessonConfig] = useState(null);
  const [lessonData, setLessonData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Implement actual data loading logic based on lessonId
    // This might involve fetching config from /lessons and data from Firebase
    const loadLesson = async () => {
      setLoading(true);
      try {
        // --- Placeholder Loading Logic ---
        // Dynamically import config based on lessonId
        const configModule = await import(`../lessons/lesson${lessonId}/config.js`);
        const config = configModule.default;
        setLessonConfig(config);

        // Fetch initial data (if any) or user's progress from Firebase
        // For now, using placeholder data or empty state
        // const data = await getLessonData(lessonId, userId); // Hypothetical
        setLessonData({ /* initialMarkers: [], initialShapes: [] */ }); // Placeholder
        // --- End Placeholder ---

      } catch (error) {
        console.error("Error loading lesson:", error);
        // TODO: Show error message to user
      } finally {
        setLoading(false);
      }
    };

    if (lessonId) {
      loadLesson();
    }

  }, [lessonId]);

  if (loading) {
    return <div className="text-center py-10">레슨 데이터를 불러오는 중...</div>;
  }

  if (!lessonConfig) {
    return <div className="text-center py-10 text-red-500">레슨 설정을 불러올 수 없습니다.</div>;
  }

  return (
    <div>
      {/* Pass loaded config and lessonId to LessonView */}
      {/* lessonData will be managed internally by MapView/LessonView using Firestore */}
      <LessonView lessonConfig={lessonConfig} lessonId={lessonId} />
    </div>
  );
}

export default LessonPage; 