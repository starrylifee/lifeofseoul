// Lesson 1 Configuration
const lesson1Config = {
  title: '1차시: 서울의 모습과 특성',
  goal: '서울의 위치와 주변 도시 관계 이해',
  basicLearning: [
    '서울 범위를 노란색으로 색칠',
    '주변 도시(양주·하남·과천·인천: 분홍색)',
    '주변 도시(고양·성남·시흥·남양주: 하늘색)',
    '자치구 경계 및 명칭 확인하기'
  ],
  guidedActivity: [
    '지도에서 서울과 주변 도시 위치 관계 파악하기',
    '서울의 25개 자치구 위치 확인하기',
    '한강이 흐르는 방향 관찰하기'
  ],
  freeActivity: '자신이 살고 있는 자치구의 이름 유래 조사하고 발표하기',
  resources: {
    url: '', 
    description: 'PDF 서울의 생활 10~11쪽'
  },
  questions: [
    {
      id: 'q1',
      text: '서울특별시는 경기도 양주의',
      options: ['동쪽', '서쪽', '남쪽', '북쪽'],
      answer: '남쪽'
    },
    {
      id: 'q2', 
      text: '서울특별시는 강원특별자치도의',
      options: ['동쪽', '서쪽', '남쪽', '북쪽'],
      answer: '서쪽'
    },
    {
      id: 'q3',
      text: '서울특별시는 인천광역시의',
      options: ['동쪽', '서쪽', '남쪽', '북쪽'],
      answer: '동쪽'
    }
  ],
  mapConfig: {
    center: { lat: 37.5665, lng: 126.9780 }, // 서울 중심 좌표
    zoom: 11,
    bounds: {
      north: 37.7013,
      south: 37.4269,
      east: 127.2690,
      west: 126.7348
    }
  }
};

export default lesson1Config; 