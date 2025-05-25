// Lesson 5 Configuration
const lesson5Config = {
  title: '5차시: 행정의 중심지',
  goal: '행정기관 위치 및 역할 이해',
  basicLearning: [
    '서울시청과 구청의 역할 알아보기',
    '국회의사당과 정부청사 위치 확인하기',
    '대법원과 검찰청 기능 이해하기',
    '교육청과 경찰청 역할 학습하기'
  ],
  guidedActivity: [
    '행정기관 위치를 지도에 표시하기',
    '각 기관의 기능과 역할 설명하기',
    '우리 동네 구청과 주민센터 찾아보기'
  ],
  freeActivity: '가족과 함께 방문했던 행정기관 경험 공유하고 지도에 표시하기',
  resources: {
    url: '', 
    description: 'PDF 서울의 생활 22~23, 26~27쪽'
  },
  questions: [
    {
      id: 'q1',
      text: '서울특별시의 행정 중심지는',
      options: ['중구', '종로구', '강남구', '영등포구'],
      answer: '중구'
    },
    {
      id: 'q2', 
      text: '국회의사당이 위치한 곳은',
      options: ['여의도', '종로', '중구', '강남'],
      answer: '여의도'
    },
    {
      id: 'q3',
      text: '대법원이 위치한 구는',
      options: ['서초구', '중구', '종로구', '강남구'],
      answer: '서초구'
    },
    {
      id: 'q4',
      text: '청와대(현 용산 대통령실)가 있던 곳은',
      options: ['종로구', '중구', '용산구', '서대문구'],
      answer: '종로구'
    },
    {
      id: 'q5',
      text: '서울시교육청이 위치한 구는',
      options: ['종로구', '중구', '강남구', '서초구'],
      answer: '종로구'
    },
    {
      id: 'q6',
      text: '정부서울청사가 위치한 곳은',
      options: ['중구', '종로구', '용산구', '서대문구'],
      answer: '중구'
    },
    {
      id: 'q7',
      text: '서울중앙지방검찰청이 있는 구는',
      options: ['서초구', '중구', '종로구', '강남구'],
      answer: '서초구'
    },
    {
      id: 'q8',
      text: '서울특별시청 앞 광장의 이름은',
      options: ['서울광장', '시청광장', '중구광장', '태평로광장'],
      answer: '서울광장'
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

export default lesson5Config; 