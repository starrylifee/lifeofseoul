// Lesson 8 Configuration
const lesson8Config = {
  title: '8차시: 한양도성의 성곽과 대문',
  goal: '사대문과 한양도성 위치 및 역사 이해',
  basicLearning: [
    '한양도성의 건설 목적과 역사 학습',
    '사대문(동대문, 서대문, 남대문, 북대문) 위치 확인',
    '소사문과 암문의 역할과 위치 알아보기',
    '현재 남아있는 성곽 구간 찾아보기'
  ],
  guidedActivity: [
    '한양도성 전체 경로를 지도에 그려보기',
    '사대문과 소사문 위치 표시하고 특징 설명하기',
    '성곽 탐방 코스 계획 세우기'
  ],
  freeActivity: '가족과 함께 성곽길을 걸어본 경험 공유하고 추천 구간 표시하기',
  resources: {
    url: '', 
    description: 'PDF 서울의 생활 41~42쪽'
  },
  questions: [
    {
      id: 'q1',
      text: '한양도성의 사대문 중 동쪽 문은',
      options: ['흥인지문', '돈의문', '숭례문', '숙정문'],
      answer: '흥인지문'
    },
    {
      id: 'q2', 
      text: '남대문의 정식 명칭은',
      options: ['숭례문', '흥인지문', '돈의문', '숙정문'],
      answer: '숭례문'
    },
    {
      id: 'q3',
      text: '현재 복원된 서대문의 이름은',
      options: ['돈의문', '서소문', '소의문', '창의문'],
      answer: '돈의문'
    },
    {
      id: 'q4',
      text: '북대문의 정식 명칭은',
      options: ['숙정문', '창의문', '혜화문', '광희문'],
      answer: '숙정문'
    },
    {
      id: 'q5',
      text: '한양도성의 총 길이는 약',
      options: ['12km', '15km', '18km', '21km'],
      answer: '18km'
    },
    {
      id: 'q6',
      text: '한양도성이 건설된 시기는',
      options: ['1394년', '1396년', '1398년', '1400년'],
      answer: '1396년'
    },
    {
      id: 'q7',
      text: '현재 국보 제1호는',
      options: ['숭례문', '흥인지문', '돈의문', '숙정문'],
      answer: '숭례문'
    },
    {
      id: 'q8',
      text: '한양도성 성곽길 중 가장 인기 있는 구간은',
      options: ['낙산구간', '인왕산구간', '남산구간', '모든 답이 맞음'],
      answer: '모든 답이 맞음'
    }
  ],
  mapConfig: {
    center: { "lat": 37.5665, "lng": 126.9780 },
    zoom: 12,
    bounds: {
      north: 37.6013,
      south: 37.5269,
      east: 127.0190,
      west: 126.9348
    }
  }
};

export default lesson8Config; 