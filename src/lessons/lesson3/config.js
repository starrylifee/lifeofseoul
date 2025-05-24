// Lesson 3 Configuration
const lesson3Config = {
  title: '3차시: 서울의 도로와 지하철',
  goal: '주요 도로·지하철 노선 파악',
  basicLearning: [
    '자동차 전용도로 위치 확인하기',
    '지하철 노선도 살펴보기',
    '주요 교차로와 역 찾아보기',
    '교통 체계의 특징 알아보기'
  ],
  guidedActivity: [
    '도로·지하철 노선 지도에 그리기',
    '우리 동네 교통수단 조사하기',
    '가장 편리한 이동 경로 찾아보기'
  ],
  freeActivity: '자주 이용하는 교통수단과 경로 지도에 표시하고 발표하기',
  resources: {
    url: '', 
    description: 'PDF 서울의 생활 20~21쪽'
  },
  questions: [
    {
      id: 'q1',
      text: '서울의 대표적인 자동차 전용도로는',
      options: ['강변북로', '올림픽대로', '내부순환로', '모든 답이 맞음'],
      answer: '모든 답이 맞음'
    },
    {
      id: 'q2', 
      text: '서울 지하철에서 가장 많은 노선이 지나는 역은',
      options: ['을지로3가역', '종로3가역', '충무로역', '동대문역사문화공원역'],
      answer: '을지로3가역'
    },
    {
      id: 'q3',
      text: '서울의 교통 중심지 역할을 하는 곳은',
      options: ['강남', '종로', '을지로', '모든 답이 맞음'],
      answer: '모든 답이 맞음'
    }
  ],
  mapConfig: {
    center: { lat: 37.5665, lng: 126.9780 },
    zoom: 11,
    bounds: {
      north: 37.7013,
      south: 37.4269,
      east: 127.2690,
      west: 126.7348
    }
  }
};

export default lesson3Config; 