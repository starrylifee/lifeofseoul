// Lesson 6 Configuration
const lesson6Config = {
  title: '6차시: 문화의 중심지',
  goal: '주요 문화 시설 위치 학습',
  basicLearning: [
    '경복궁, 창덕궁 등 고궁의 위치와 역사',
    '국립중앙박물관, 국립현대미술관 찾기',
    '세종문화회관, 예술의전당 등 공연장 알기',
    '이태원, 홍대, 강남 등 문화거리 특징'
  ],
  guidedActivity: [
    '문화시설을 지도에 표시하고 분류하기',
    '각 시설의 특징과 역할 발표하기',
    '우리 동네 문화시설 찾아보기'
  ],
  freeActivity: '가족과 방문했던 문화시설 경험 공유하고 추천 장소 추가하기',
  resources: {
    url: '', 
    description: 'PDF 서울의 생활 22~23, 34~35쪽'
  },
  questions: [
    {
      id: 'q1',
      text: '조선시대 정궁이었던 궁궐은',
      options: ['경복궁', '창덕궁', '창경궁', '덕수궁'],
      answer: '경복궁'
    },
    {
      id: 'q2', 
      text: '국립중앙박물관이 위치한 구는',
      options: ['용산구', '중구', '종로구', '서초구'],
      answer: '용산구'
    },
    {
      id: 'q3',
      text: '예술의전당이 위치한 곳은',
      options: ['서초구', '강남구', '중구', '종로구'],
      answer: '서초구'
    },
    {
      id: 'q4',
      text: '젊은이들의 문화거리로 유명한 곳은',
      options: ['홍대', '강남', '이태원', '모든 답이 맞음'],
      answer: '모든 답이 맞음'
    },
    {
      id: 'q5',
      text: '세종문화회관이 위치한 곳은',
      options: ['세종로', '충무로', '을지로', '태평로'],
      answer: '세종로'
    },
    {
      id: 'q6',
      text: '국립현대미술관 서울관이 있는 곳은',
      options: ['종로구', '중구', '용산구', '서초구'],
      answer: '종로구'
    },
    {
      id: 'q7',
      text: '외국인 관광객이 많이 찾는 문화거리는',
      options: ['이태원', '명동', '인사동', '모든 답이 맞음'],
      answer: '모든 답이 맞음'
    },
    {
      id: 'q8',
      text: '한국 전통문화를 체험할 수 있는 곳은',
      options: ['북촌한옥마을', '인사동', '경복궁', '모든 답이 맞음'],
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

export default lesson6Config; 