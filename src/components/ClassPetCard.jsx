import React from 'react';

function ClassPetCard({ xp, level, nextLevelXp, unlockedLessons }) {
  const baseSrc = `/assets/classPet/base_level_${Math.max(1, Math.min(4, level))}.png`;

  const overlays = Array.from({ length: 8 }, (_, i) => ({
    idx: i + 1,
    src: `/assets/classPet/overlay_lesson_${i + 1}.png`,
    unlocked: !!unlockedLessons[i]
  }));

  const progressRatio = Math.max(0, Math.min(1, xp / nextLevelXp));

  return (
    <div className="bg-white rounded-3xl p-6 shadow-soft mb-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-4 font-korean">🟡 반 해치</h2>
      <div className="flex flex-col lg:flex-row gap-6 items-center">
        {/* 이미지 영역 */}
        <div className="relative w-[512px] h-[512px] shrink-0">
          <img src={baseSrc} alt="class pet" className="absolute inset-0 w-full h-full object-contain" />
          {overlays.map((ov) => (
            <img
              key={ov.idx}
              src={ov.src}
              alt={`lesson ${ov.idx}`}
              className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-300 ${ov.unlocked ? 'opacity-100' : 'opacity-20'}`}
            />
          ))}
        </div>

        {/* 정보 영역 */}
        <div className="flex-1 w-full">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xl font-bold">Lv {level}</div>
            <div className="text-sm text-gray-600">XP: {xp} / {nextLevelXp}</div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
            <div
              className="h-4 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500"
              style={{ width: `${Math.round(progressRatio * 100)}%` }}
            />
          </div>

          <div className="mt-6">
            <div className="text-sm text-gray-600 mb-2 font-korean">차시 해금 현황</div>
            <div className="grid grid-cols-4 gap-2">
              {overlays.map((ov) => (
                <div key={ov.idx} className={`text-center text-xs px-2 py-1 rounded ${ov.unlocked ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}`}>
                  {ov.unlocked ? `레슨 ${ov.idx} 해금` : `레슨 ${ov.idx}`}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ClassPetCard;