import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const Classroom = () => {
  const [lessons, setLessons] = useState([]);
  const [overall, setOverall] = useState({ completed: 0, total: 0 });

  useEffect(() => {
    // 레슨 데이터 로드
    const loadLessons = async () => {
      const lessonData = [];
      for (let i = 1; i <= 8; i++) {
        try {
          const config = await import(`../lessons/lesson${i}/config.js`);
          lessonData.push({
            id: i,
            ...config.default
          });
        } catch (error) {
          console.error(`레슨 ${i} 로드 실패:`, error);
        }
      }
      setLessons(lessonData);

      // 진행바용 총 레슨 수 설정
      setOverall((prev) => ({ ...prev, total: lessonData.length }));
    };

    loadLessons();
  }, []);

  const getLessonIcon = (lessonId) => {
    const icons = {
      1: '🏙️', 2: '🌊', 3: '🚇', 4: '🏛️', 
      5: '🎭', 6: '🏰', 7: '🏯', 8: '🗿'
    };
    return icons[lessonId] || '📚';
  };

  const getLessonColor = (lessonId) => {
    const colors = [
      'from-seoul-400 to-seoul-600',
      'from-hangang-400 to-hangang-600', 
      'from-purple-400 to-purple-600',
      'from-sunshine-400 to-sunshine-600',
      'from-pink-400 to-pink-600',
      'from-green-400 to-green-600',
      'from-indigo-400 to-indigo-600',
      'from-red-400 to-red-600'
    ];
    return colors[(lessonId - 1) % colors.length];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-friendly-mint via-white to-friendly-purple">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {/* 헤더 */}
        <div className="text-center mb-8 md:mb-12">
          <div className="inline-block bg-white rounded-3xl p-6 md:p-8 shadow-friendly mb-6">
            <span className="text-6xl md:text-8xl">🏫</span>
          </div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-800 mb-4 font-korean">
            서울의 생활 교실
          </h1>
          <p className="text-lg md:text-xl text-gray-600 font-korean">
            8개의 재미있는 수업으로 서울을 탐험해보세요! 🗺️
          </p>
        </div>

        {/* 진행 상황 */}
        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-soft mb-8 md:mb-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl md:text-2xl font-bold text-gray-800 font-korean">
              📊 나의 학습 진행 상황
            </h2>
            <div className="bg-seoul-50 rounded-xl px-4 py-2">
              <span className="text-seoul-600 font-medium text-sm md:text-base font-korean">
                {overall.completed}/{overall.total} 완료
              </span>
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 md:h-4">
            <div className="bg-gradient-to-r from-seoul-400 to-hangang-400 h-3 md:h-4 rounded-full transition-all duration-500" style={{width: `${overall.total ? (overall.completed / overall.total) * 100 : 0}%`}}></div>
          </div>
          <p className="text-sm text-gray-600 mt-2 font-korean">
            🎯 목표: 모든 수업을 완료하고 서울 전문가가 되어보세요!
          </p>
        </div>

        {/* 레슨 카드들 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
          {lessons.map((lesson) => (
            <Link
              key={lesson.id}
              to={`/lesson/${lesson.id}`}
              className="group bg-white rounded-3xl p-6 md:p-8 shadow-soft hover:shadow-friendly transition-all duration-300 hover:scale-105 border-2 border-transparent hover:border-seoul-200"
            >
              <div className="text-center">
                {/* 레슨 아이콘 */}
                <div className={`bg-gradient-to-br ${getLessonColor(lesson.id)} rounded-2xl p-4 md:p-6 mb-4 inline-block group-hover:scale-110 transition-transform duration-300`}>
                  <span className="text-4xl md:text-5xl">
                    {getLessonIcon(lesson.id)}
                  </span>
                </div>

                {/* 레슨 제목 */}
                <h3 className="text-lg md:text-xl font-bold text-gray-800 mb-2 font-korean leading-tight">
                  {lesson.title}
                </h3>

                {/* 레슨 목표 */}
                <p className="text-gray-600 text-sm md:text-base font-korean mb-4 leading-relaxed">
                  {lesson.goal}
                </p>

                {/* 상태 배지 */}
                <div className="flex justify-center mb-4">
                  <div className="bg-gray-100 rounded-xl px-3 py-1">
                    <span className="text-gray-600 font-medium text-xs md:text-sm font-korean">
                      🔒 시작하기
                    </span>
                  </div>
                </div>

                {/* 학습 활동 미리보기 */}
                <div className="bg-gray-50 rounded-xl p-3 text-left">
                  <p className="text-xs text-gray-500 mb-1 font-korean">주요 활동:</p>
                  <ul className="text-xs text-gray-600 space-y-1 font-korean">
                    {Array.isArray(lesson.basicLearning) && lesson.basicLearning.slice(0, 2).map((activity, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-seoul-400 mr-1">•</span>
                        <span className="line-clamp-1">{activity}</span>
                      </li>
                    ))}
                    {Array.isArray(lesson.basicLearning) && lesson.basicLearning.length > 2 && (
                      <li className="text-seoul-500 font-medium">
                        +{lesson.basicLearning.length - 2}개 더...
                      </li>
                    )}
                    {!Array.isArray(lesson.basicLearning) && (
                      <li className="flex items-start">
                        <span className="text-seoul-400 mr-1">•</span>
                        <span className="line-clamp-1">지도 탐험 활동</span>
                      </li>
                    )}
                  </ul>
                </div>

                {/* 호버 효과 */}
                <div className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="bg-seoul-50 rounded-xl p-2">
                    <span className="text-seoul-600 font-medium text-sm font-korean">
                      👆 클릭해서 시작하기
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* 하단 안내 */}
        <div className="mt-12 text-center">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-soft">
            <h3 className="text-lg font-bold text-gray-800 mb-2 font-korean">
              💡 학습 팁
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 font-korean">
              <div className="flex items-center justify-center">
                <span className="mr-2">🗺️</span>
                <span>지도에서 직접 탐험하기</span>
              </div>
              <div className="flex items-center justify-center">
                <span className="mr-2">📍</span>
                <span>마커로 중요한 장소 표시하기</span>
              </div>
              <div className="flex items-center justify-center">
                <span className="mr-2">🤝</span>
                <span>친구들과 함께 학습하기</span>
              </div>
            </div>
          </div>
        </div>

        {/* 돌아가기 버튼 */}
        <div className="mt-8 text-center">
          <Link
            to="/"
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-gray-400 to-gray-600 text-white rounded-2xl font-medium hover:from-gray-500 hover:to-gray-700 transition-all duration-200 hover:scale-105 shadow-soft font-korean"
          >
            <span className="mr-2">🏠</span>
            대시보드로 돌아가기
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Classroom; 