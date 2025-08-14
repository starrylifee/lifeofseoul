import React, { useState, useEffect } from 'react';
import { getStarLevel, getStarsToNextLevel } from '../utils/starSystem';
import { getStudentStars } from '../utils/starAPI';

const StarLevelDisplay = ({ userId, compact = false }) => {
  const [totalStars, setTotalStars] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStars = async () => {
      if (!userId) return;
      
      try {
        const stars = await getStudentStars(userId);
        setTotalStars(stars);
      } catch (error) {
        console.error('별 개수 로드 실패:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStars();
  }, [userId]);

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-20 bg-gray-200 rounded-lg"></div>
      </div>
    );
  }

  const currentLevel = getStarLevel(totalStars);
  const starsToNext = getStarsToNextLevel(totalStars);
  const progressPercent = currentLevel.maxStars > 0 
    ? Math.min(((totalStars - currentLevel.minStars) / (currentLevel.maxStars - currentLevel.minStars)) * 100, 100)
    : 100;

  if (compact) {
    return (
      <div className="flex items-center space-x-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-3">
        <div className="text-3xl">{currentLevel.pet.emoji}</div>
        <div>
          <div className="font-bold text-sm text-gray-800">{currentLevel.name}</div>
          <div className="text-xs text-gray-600">⭐ {totalStars}개</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-yellow-50 via-orange-50 to-pink-50 rounded-3xl p-6 shadow-soft border-2 border-yellow-100">
      {/* 펫과 레벨 정보 */}
      <div className="text-center mb-4">
        <div className="text-6xl mb-2 animate-bounce">{currentLevel.pet.emoji}</div>
        <h3 className="text-xl font-bold text-gray-800 mb-1">{currentLevel.pet.name}</h3>
        <p className="text-sm text-gray-600 mb-2">{currentLevel.pet.description}</p>
        <div className="bg-white rounded-xl px-4 py-2 inline-block">
          <span className="text-lg font-bold text-yellow-600">{currentLevel.name}</span>
        </div>
      </div>

      {/* 별 개수와 진행률 */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">보유 별</span>
          <span className="text-lg font-bold text-yellow-600">⭐ {totalStars}개</span>
        </div>

        {starsToNext > 0 && (
          <>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">다음 레벨까지</span>
              <span className="font-medium text-gray-800">{starsToNext}개 남음</span>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-yellow-400 to-orange-400 h-3 rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
          </>
        )}

        {starsToNext === 0 && (
          <div className="text-center py-2">
            <span className="text-sm font-medium text-purple-600">🏆 최고 레벨 달성!</span>
          </div>
        )}
      </div>

      {/* 보상 목록 (구현 예정) */}
      <div className="mt-4 pt-4 border-t border-yellow-200">
        <div className="text-xs text-gray-500 text-center">구현 예정</div>
        {false && (
          <>
            <h4 className="text-sm font-medium text-gray-700 mb-2">🎁 레벨 혜택</h4>
            <div className="space-y-1">
              {currentLevel.rewards.map((reward, index) => (
                <div key={index} className="text-xs text-gray-600 flex items-center">
                  <span className="text-green-500 mr-1">✓</span>
                  {reward}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default StarLevelDisplay; 