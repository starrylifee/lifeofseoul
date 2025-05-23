// 사용자 역할
export const USER_ROLES = {
  TEACHER: 'teacher',
  STUDENT: 'student',
  ADMIN: 'admin'
};

// 레슨 단계
export const LESSON_STEPS = {
  INTRO: 0,     // 소개
  BASIC: 1,     // 기초 배움
  GUIDED: 2,    // 가이드된 활동
  FREE: 3       // 자유 활동
};

// 활동 상태
export const ACTIVITY_STATUS = {
  NOT_STARTED: '시작하기',
  IN_PROGRESS: '진행 중',
  COMPLETED: '완료'
};

// 지도 관련 상수
export const MAP_CONSTANTS = {
  DEFAULT_CENTER: [37.5665, 126.9780], // 서울시청 좌표
  DEFAULT_ZOOM: 12,
  MIN_ZOOM: 10,
  MAX_ZOOM: 18
};

// 레슨 목록
export const LESSONS = [
  { id: '1', title: '1차시: 서울의 모습과 특성' },
  { id: '2', title: '2차시: 한강과 서울의 하천' },
  { id: '3', title: '3차시: 서울의 도로와 지하철' },
  { id: '4', title: '4차시: 교통의 중심지' },
  { id: '5', title: '5차시: 행정의 중심지' },
  { id: '6', title: '6차시: 문화의 중심지' },
  { id: '7', title: '7차시: 서울의 궁궐' },
  { id: '8', title: '8차시: 한양도성의 성곽과 대문' }
];

// 도형 그리기 도구 타입
export const DRAW_TOOLS = {
  POLYGON: 'polygon',
  RECTANGLE: 'rectangle',
  CIRCLE: 'circle',
  MARKER: 'marker',
  POLYLINE: 'polyline',
  NONE: 'none'
};

// 색상 팔레트
export const COLOR_PALETTE = [
  '#FF0000', // 빨강
  '#FF9900', // 주황
  '#FFFF00', // 노랑
  '#00FF00', // 초록
  '#0000FF', // 파랑
  '#9900FF', // 보라
  '#FF00FF', // 핑크
  '#000000', // 검정
  '#FFFFFF'  // 흰색
]; 