// Lesson 2 Configuration
const lesson2Config = {
  title: '2차시: 한강과 서울의 하천',
  goal: '한강 어원과 역할 파악',
  basicLearning: [
    '한강의 합류 지점 확인하기',
    '한강의 흐름 방향 알아보기',
    '서울의 주요 하천 찾아보기',
    '한강 다리들의 위치 확인하기'
  ],
  guidedActivity: [
    '한강 및 주요 하천 지도에 그리기',
    '한강이 서울에 미치는 영향 토론하기',
    '우리 동네 주변 하천 찾아보기'
  ],
  freeActivity: '집 근처 하천이나 개울 조사하고 한강과의 연결 관계 알아보기',
  resources: {
    url: '', 
    description: 'PDF 서울의 생활 18~19쪽'
  },
  questions: [
    {
      id: 'q1',
      text: '한강이 흐르는 방향은',
      options: ['동쪽에서 서쪽으로', '서쪽에서 동쪽으로', '남쪽에서 북쪽으로', '북쪽에서 남쪽으로'],
      answer: '동쪽에서 서쪽으로'
    },
    {
      id: 'q2', 
      text: '한강이 서울을 나누는 방향은',
      options: ['동서로', '남북으로', '대각선으로', '원형으로'],
      answer: '남북으로'
    },
    {
      id: 'q3',
      text: '한강에서 가장 유명한 다리 중 하나는',
      options: ['광진교', '한강대교', '반포대교', '모든 답이 맞음'],
      answer: '모든 답이 맞음'
    }
  ],
  mapConfig: {
    center: { lat: 37.5665, lng: 126.9780 },
    zoom: 12,
    bounds: {
      north: 37.7013,
      south: 37.4269,
      east: 127.2690,
      west: 126.7348
    }
  }
};

export default lesson2Config; 