import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LessonView from '../components/LessonView';
import { getStudentActivity } from '../utils/api';
import { ACTIVITY_STATUS } from '../utils/constants';
// import { getLessonConfig, getLessonData } from '../utils/lessonLoader'; // Hypothetical lesson loader
// import MapView from '../components/MapView'; // Temporarily commented out to fix unused var warning

function LessonPage() {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [lessonConfig, setLessonConfig] = useState(null);
  const [activityData, setActivityData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadLesson = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // 1. 레슨 설정 불러오기
        const configModule = await import(`../lessons/lesson${lessonId}/config.js`);
        const config = configModule.default;
        setLessonConfig(config);

        // 2. 초기 데이터 불러오기
        const dataModule = await import(`../lessons/lesson${lessonId}/data.json`);
        const initialData = dataModule.default;

        // 3. Firebase에서 학생 활동 데이터 불러오기
        if (currentUser) {
          const studentActivity = await getStudentActivity(lessonId, currentUser.uid);
          
          if (studentActivity) {
            // 기존 활동 데이터가 있으면 그것을 사용
            setActivityData(studentActivity);
          } else {
            // 새로운 활동인 경우 초기 데이터 사용
            setActivityData({
              status: ACTIVITY_STATUS.IN_PROGRESS,
              progress: {},
              initialMarkers: initialData.initialMarkers || [],
              initialShapes: initialData.initialShapes || [],
              userMarkers: [],
              userShapes: []
            });
          }
        }
      } catch (error) {
        console.error("Error loading lesson:", error);
        setError("레슨 데이터를 불러오는 중 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    };

    if (lessonId && currentUser) {
      loadLesson();
    } else if (!currentUser) {
      navigate('/login');
    }

  }, [lessonId, currentUser, navigate]);

  if (loading) {
    return <div className="text-center py-10">레슨 데이터를 불러오는 중...</div>;
  }

  if (error) {
    return <div className="text-center py-10 text-red-500">{error}</div>;
  }

  if (!lessonConfig) {
    return <div className="text-center py-10 text-red-500">레슨 설정을 불러올 수 없습니다.</div>;
  }

  return (
    <div>
      {/* Pass loaded config and lessonId to LessonView */}
      {/* lessonData will be managed internally by MapView/LessonView using Firestore */}
      <LessonView 
        lessonConfig={lessonConfig} 
        lessonId={lessonId} 
        activityData={activityData} 
      />
    </div>
  );
}

export default LessonPage; 