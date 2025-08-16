// 모든 레슨 설정을 한 곳에서 관리
export const lessonConfigs = {};

// 레슨 설정을 동적으로 로드하는 함수
export const loadLessonConfig = async (lessonId) => {
  try {
    const configModule = await import(`../lessons/lesson${lessonId}/config.js`);
    return configModule.default;
  } catch (error) {
    console.error(`Error loading lesson ${lessonId} config:`, error);
    return null;
  }
};

// 모든 레슨 설정을 미리 로드하는 함수
export const loadAllLessonConfigs = async () => {
  const configs = {};
  
  // 1-12차시까지 로드
  for (let i = 1; i <= 12; i++) {
    try {
      const config = await loadLessonConfig(i);
      if (config) {
        configs[i] = config;
      }
    } catch (error) {
      console.error(`Failed to load lesson ${i}:`, error);
      // 기본 설정으로 대체
      configs[i] = {
        title: `${i}차시`,
        questions: [] // 빈 배열로 초기화
      };
    }
  }
  
  return configs;
};

// 캐시된 설정들
let cachedConfigs = null;

// 캐시된 설정을 가져오는 함수
export const getCachedLessonConfigs = async () => {
  if (!cachedConfigs) {
    cachedConfigs = await loadAllLessonConfigs();
  }
  return cachedConfigs;
};
