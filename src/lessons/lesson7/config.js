// Lesson 7 Configuration
const lesson7Config = {
  title: '7차시: 서울의 궁궐',
  goal: '조선 궁궐 위치 및 역사 이해',
  basicLearning: [
    '경복궁, 창덕궁, 창경궁, 덕수궁, 경희궁 위치 확인',
    '각 궁궐의 건립 시기와 역사적 의미 학습',
    '궁궐별 주요 건물과 특징 알아보기',
    '조선시대 왕실 생활과 궁궐의 역할 이해'
  ],
  guidedActivity: [
    '5대 궁궐을 지도에 표시하고 특징 비교하기',
    '각 궁궐의 대표 건물과 정원 소개하기',
    '궁궐 관람 계획 세우고 발표하기'
  ],
  freeActivity: '가족과 방문했던 궁궐 경험 공유하고 추천 관람 코스 만들기',
  resources: {
    url: '', 
    description: 'PDF 서울의 생활 38~40쪽'
  },
  questions: [
    {
      id: 'q1',
      text: '조선시대 정궁(메인 궁궐)은',
      options: ['경복궁', '창덕궁', '창경궁', '덕수궁'],
      answer: '경복궁'
    },
    {
      id: 'q2', 
      text: '유네스코 세계문화유산으로 등록된 궁궐은',
      options: ['경복궁', '창덕궁', '창경궁', '덕수궁'],
      answer: '창덕궁'
    },
    {
      id: 'q3',
      text: '서울에 있는 조선시대 궁궐의 개수는',
      options: ['3개', '4개', '5개', '6개'],
      answer: '5개'
    },
    {
      id: 'q4',
      text: '대한제국 시대 황궁으로 사용된 궁궐은',
      options: ['경복궁', '창덕궁', '덕수궁', '경희궁'],
      answer: '덕수궁'
    },
    {
      id: 'q5',
      text: '경복궁의 정문 이름은',
      options: ['광화문', '돈화문', '대한문', '흥화문'],
      answer: '광화문'
    },
    {
      id: 'q6',
      text: '창덕궁의 후원(뒷정원) 이름은',
      options: ['비원', '후원', '어원', '상림원'],
      answer: '비원'
    },
    {
      id: 'q7',
      text: '현재 복원 중인 궁궐은',
      options: ['경복궁', '창덕궁', '경희궁', '모든 답이 맞음'],
      answer: '모든 답이 맞음'
    },
    {
      id: 'q8',
      text: '궁궐에서 왕이 정사를 보던 건물을 무엇이라 하는가',
      options: ['정전', '편전', '침전', '별전'],
      answer: '정전'
    }
  ],
  mapConfig: {
    center: { lat: 37.5665, lng: 126.9780 },
    zoom: 12,
    bounds: {
      north: 37.6013,
      south: 37.5269,
      east: 127.0190,
      west: 126.9348
    }
  }
};

export default lesson7Config; 