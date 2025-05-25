// Lesson 4 Configuration
const lesson4Config = {
  title: '4차시: 교통의 중심지',
  goal: '기차역·공항·버스터미널 위치 이해',
  basicLearning: [
    '서울역, 용산역 등 주요 기차역 찾기',
    '김포공항, 인천공항 위치 확인하기',
    '고속버스터미널, 동서울터미널 알아보기',
    '각 교통시설의 역할과 특징 이해하기'
  ],
  guidedActivity: [
    '지도에 아이콘으로 교통시설 위치 표시하기',
    '각 교통시설의 기능과 중요성 설명하기',
    '우리 동네에서 가장 가까운 교통시설 찾기'
  ],
  freeActivity: '가족여행 때 이용했던 교통시설 경험 공유하고 지도에 표시하기',
  resources: {
    url: '', 
    description: 'PDF 서울의 생활 22~25쪽'
  },
  questions: [
    {
      id: 'q1',
      text: '서울의 대표적인 기차역은',
      options: ['서울역', '용산역', '청량리역', '모든 답이 맞음'],
      answer: '모든 답이 맞음'
    },
    {
      id: 'q2', 
      text: '인천국제공항은 서울에서',
      options: ['동쪽', '서쪽', '남쪽', '북쪽'],
      answer: '서쪽'
    },
    {
      id: 'q3',
      text: '고속버스터미널이 위치한 지역은',
      options: ['강남구', '강북구', '서초구', '송파구'],
      answer: '서초구'
    },
    {
      id: 'q4',
      text: 'KTX가 출발하는 주요 역은',
      options: ['서울역', '용산역', '청량리역', '서울역과 용산역'],
      answer: '서울역과 용산역'
    },
    {
      id: 'q5',
      text: '김포공항의 주요 역할은',
      options: ['국제선 전용', '국내선 중심', '화물 전용', '군용 전용'],
      answer: '국내선 중심'
    },
    {
      id: 'q6',
      text: '동서울터미널이 위치한 구는',
      options: ['강동구', '송파구', '광진구', '성동구'],
      answer: '광진구'
    },
    {
      id: 'q7',
      text: '서울역에서 출발하는 지하철 노선은',
      options: ['1호선만', '4호선만', '1호선과 4호선', '2호선과 3호선'],
      answer: '1호선과 4호선'
    },
    {
      id: 'q8',
      text: '인천국제공항으로 가는 교통수단은',
      options: ['공항철도', '공항버스', '택시', '모든 답이 맞음'],
      answer: '모든 답이 맞음'
    }
  ],
  mapConfig: {
    center: { lat: 37.5665, lng: 126.9780 },
    zoom: 10,
    bounds: {
      north: 37.8,
      south: 37.3,
      east: 127.5,
      west: 126.5
    }
  }
};

export default lesson4Config; 