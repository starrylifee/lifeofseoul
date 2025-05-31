// 별 시스템 및 펫 레벨 관리
export const STAR_LEVELS = [
  {
    level: 1,
    name: "서울 새내기",
    minStars: 0,
    maxStars: 4,
    pet: {
      name: "꼬마 해치",
      emoji: "🐣",
      description: "서울을 처음 탐험하는 귀여운 해치"
    },
    rewards: ["기본 마커 기능"]
  },
  {
    level: 2,
    name: "서울 탐험가",
    minStars: 5,
    maxStars: 9,
    pet: {
      name: "활발한 해치",
      emoji: "🦁",
      description: "서울 곳곳을 누비는 용감한 해치"
    },
    rewards: ["특별 마커 스타일", "이미지 업로드 기능"]
  },
  {
    level: 3,
    name: "서울 전문가",
    minStars: 10,
    maxStars: 19,
    pet: {
      name: "똑똑한 해치",
      emoji: "🎓",
      description: "서울의 역사와 문화를 잘 아는 박학한 해치"
    },
    rewards: ["고급 지도 기능", "친구 초대 기능", "특별 배지"]
  },
  {
    level: 4,
    name: "서울 마스터",
    minStars: 20,
    maxStars: 27,
    pet: {
      name: "왕관 해치",
      emoji: "👑",
      description: "서울의 모든 것을 마스터한 최고의 해치"
    },
    rewards: ["마스터 전용 테마", "리더보드 등록", "특별 칭호"]
  },
  {
    level: 5,
    name: "서울 전설",
    minStars: 28,
    maxStars: 32,
    pet: {
      name: "전설의 해치",
      emoji: "✨",
      description: "서울의 전설이 된 최고의 파트너 해치"
    },
    rewards: ["전설 테마", "모든 기능 해제", "명예의 전당"]
  }
];

// 별 개수로 레벨 계산
export const getStarLevel = (starCount) => {
  for (let i = STAR_LEVELS.length - 1; i >= 0; i--) {
    const level = STAR_LEVELS[i];
    if (starCount >= level.minStars) {
      return level;
    }
  }
  return STAR_LEVELS[0]; // 기본 레벨
};

// 다음 레벨까지 필요한 별 개수
export const getStarsToNextLevel = (starCount) => {
  const currentLevel = getStarLevel(starCount);
  const nextLevelIndex = STAR_LEVELS.findIndex(level => level.level === currentLevel.level) + 1;
  
  if (nextLevelIndex >= STAR_LEVELS.length) {
    return 0; // 최고 레벨
  }
  
  const nextLevel = STAR_LEVELS[nextLevelIndex];
  return nextLevel.minStars - starCount;
};

// 별 획득 방법
export const STAR_SOURCES = {
  QUIZ_COMPLETION: {
    type: "quiz",
    amount: 1,
    description: "퀴즈 완료"
  },
  PERFECT_QUIZ: {
    type: "perfect_quiz",
    amount: 2,
    description: "퀴즈 만점 완료"
  },
  PERFECT_QUIZ_RETRY: {
    type: "perfect_quiz_retry",
    amount: 1,
    description: "퀴즈 재도전 만점 완료"
  },
  TEACHER_REWARD: {
    type: "teacher",
    amount: 1,
    description: "교사 보상"
  },
  CREATIVE_MARKER: {
    type: "creative",
    amount: 1,
    description: "창의적 마커 작성"
  },
  ACTIVE_PARTICIPATION: {
    type: "participation",
    amount: 1,
    description: "적극적 참여"
  },
  PERFECT_LESSON: {
    type: "perfect",
    amount: 2,
    description: "완벽한 레슨 완료"
  }
};

// 별 지급 기록 생성
export const createStarRecord = (userId, lessonId, source, amount, teacherId = null) => {
  return {
    userId,
    lessonId,
    source: source.type,
    amount,
    description: source.description,
    teacherId,
    timestamp: new Date(),
    id: `star_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  };
}; 