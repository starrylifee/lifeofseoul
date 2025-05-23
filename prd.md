# PRD (Product Requirements Document)

## 1. 프로젝트 개요
- **목표**: 초등학교 4학년 사회과 ‘지역사회’ 단원을 위한 지도 기반 에듀테크 도구 개발  
- **문제 정의**: 서울·경기도 등 지역사회 교육과정을 반영할 수 있는 전용 학습 도구 부재로 인해 직접 제작 필요  

## 2. 대상 사용자 및 이해관계자
- **주 사용자**: 초등학생(4학년)  
- **부 사용자**: 지도 교사  
- **이해관계자**: 학교 행정팀, 학급 관리자, 교육 연구진  

## 3. 주요 기능 및 요구사항

### 3.1 필수 기능
- **지도 위 표시 기능**: 크롬북에서 이용 가능한 웹 기반 지도 렌더링 및 편집  
- **가이드 활동 템플릿**: 학습 목표, 기초 배움, 가이드된 활동, 자유 활동 기본 포맷 제공  
- **실시간 공유 및 겹쳐 보기**: 반 내 표시 내용 실시간 공유, 여러 학급 데이터 병합 뷰 제공  
- **사진·자료 제시**: 학습 주제 관련 이미지 자료 업로드 및 화면 표시  
- **인증 및 권한 관리**: Firebase Authentication 및 Firestore 연동  
  - **교사 계정**: 전체 학생 데이터 조회·수정·삭제 권한  
  - **학생 계정**: 본인 데이터 조회·수정 권한  
  - 로그인 후 화면 상단에 사용자 ID 표시 및 활동 로깅  
  - 총 계정 수: 교사 1명, 학생 35명 (ID/PW 페어)  

### 3.2 선택(옵션) 기능
- 다른 지역(경기도 등)용 템플릿 지원 (차후 확장)  
- 학생별 활동 히스토리 저장 및 조회  
- 간단한 퀴즈·토론 인터랙션 기능  
- **학급 간 비교 기능**: 교사가 학급별 지도 데이터를 필터링하여 비교·분석  

## 4. 비즈니스/교육 목표
- 서울 지역 특성(산업·교통·문화 등)에 대한 심층 학습 지원  
- 교사-학생 협업 학습 활성화  
- 데이터 기반 활동 기록 공유로 학급 간 토론 및 비교 촉진  

## 5. 성공 기준 (KPI)
- **지도 표시 횟수**: 학생당 평균 표시 횟수  
- **만족도**: 교사 및 학생 대상 설문 만족도 점수  
- **파일럿 참여 학급 수**: 최소 3~4개 학급 파일럿 완료  

## 6. 제약 사항 및 가정
- **예산·인력**: 개인 개발자 1인, 별도 예산 없음  
- **파일럿 범위**: 3~4개 학급  
- **기기 환경**: 크롬북(인터넷 연결) 기반 웹 애플리케이션  
- **기술 선택**: React, Firebase, 지도 API(Leaflet.js 또는 Google Maps JS)  

## 7. 일정 및 마일스톤
- **요구사항 확정**: 5월 중  
- **디자인·프로토타이핑**: 6월 초  
- **개발·내부 테스트**: 6월 말  
- **파일럿 운영(3~4개 학급)**: 7월 중순  
- **최종 배포 및 방학 숙제 배포**: 7월 말  

## 8. 추가 고려 사항
- **보안·프라이버시**: 학생 개인정보 비식별 처리, HTTPS 통신  
- **접근성**: 크롬북 및 학교 네트워크 최적화  
- **언어**: 한글 UI/UX만 지원  

## 9. 폴더 구조 및 기술 스택

- **기술 스택**: React, React Router, Firebase, 지도 라이브러리(Leaflet.js/Google Maps), Tailwind CSS  
- **디렉토리 구조**:

  ```text
  project-root/                 # 프로젝트 루트 폴더
  ├── README.md                 # 프로젝트 개요 및 실행 방법 설명
  ├── package.json              # npm 패키지 설정 및 스크립트
  ├── public/                   # 정적 파일(HTML, favicon 등)
  │   ├── index.html            # 메인 HTML 템플릿
  │   └── favicon.ico           # 아이콘 파일
  ├── src/                      # 애플리케이션 소스 코드
  │   ├── assets/               # 이미지, 스타일 등 정적 자원
  │   │   ├── images/           # 지도 마커, 아이콘 등 이미지 파일
  │   │   └── styles/           # 전역 CSS, Tailwind 설정 등
  │   ├── components/           # 재사용 가능한 UI 컴포넌트
  │   │   ├── Header.jsx             # 상단 네비게이션 바 컴포넌트
  │   │   ├── Footer.jsx             # 하단 정보 표시 컴포넌트
  │   │   ├── MapView.jsx            # 지도 렌더링 및 편집 기능 컴포넌트
  │   │   ├── ActivityTemplate.jsx   # 레슨별 UI 레이아웃 컴포넌트
  │   │   └── LessonView.jsx         # 레슨 데이터를 템플릿에 주입해 렌더링
  │   ├── pages/                 # 페이지 단위 컴포넌트
  │   │   ├── Dashboard.jsx          # 메인 대시보드 페이지
  │   │   ├── Classroom.jsx          # 학급별 활동 뷰 페이지
  │   │   ├── LessonPage.jsx         # 단일 레슨 실행 페이지
  │   │   └── ShareView.jsx          # 학급 간 공유 뷰 페이지
  │   ├── lessons/               # 차시별 설정 폴더
  │   │   ├── lesson1/               # 1차시 데이터 및 설정
  │   │   │   ├── config.js          # 학습목표 및 활동 설정
  │   │   │   └── data.json          # 초기 지도 표시 요소 데이터
  │   │   └── lessonN/               # N차시 각 폴더 (반복 사용)
  │   │       └── ...                # 동일 구조 반복
  │   ├── utils/                 # 유틸리티 함수 및 상수
  │   │   ├── api.js                # Firebase, 지도 API 호출 함수
  │   │   └── constants.js          # 상수 정의
  │   ├── App.jsx                # 라우터 및 전역 설정 컴포넌트
  │   ├── index.jsx              # 루트 렌더링 진입점
  │   └── index.css              # 전역 스타일(CSS/Tailwind)
  ├── .env                       # 환경 변수 설정 파일
  └── .gitignore                 # Git 무시 파일 목록

## 10. 개발 프로세스

```mermaid
flowchart TD
  A[1. 요구사항 확정] --> B[2. 개발 환경 세팅]
  B --> C[3. 폴더 구조 및 기본 템플릿 구현]
  C --> D[4. 지도 표시 컴포넌트 개발]
  D --> E[5. ActivityTemplate 및 LessonView 구현]
  E --> F[6. 레슨1 데이터 연동 및 테스트]
  F --> G[7. 레슨N 추가 및 반복 적용]
  G --> H[8. 실시간 공유 기능 구현]
  H --> I[9. 파일럿 테스트 및 피드백 수집]
  I --> J[10. 최종 배포 및 방학 숙제 배포]

### 단계별 가이드
- **요구사항 확정**: PRD 문서 검토 및 핵심 기능 우선순위 확정  
- **개발 환경 세팅**: `npx create-react-app` 프로젝트 생성, 라이브러리 설치  
- **템플릿 구현**: 공통 컴포넌트(지도, 템플릿) 기본 구조 작성  
- **지도 기능 개발**: 지도 렌더링 및 사용자 표시 기능 구현  
- **레슨 뷰 연결**: 레슨별 `config/data` 연동하여 UI 완성  
- **추가 레슨 적용**: 동일 패턴으로 다른 차시 추가  
- **공유 기능**: Firebase 실시간 DB 및 인증 기반 동기화  
- **파일럿 테스트**: 학급별 운영 및 피드백 수집  
- **최종 배포**: 정적 호스팅 업로드 및 학생 안내  

---

## 11. 프론트엔드 사용자 흐름 및 UI 설계

- **대시보드**  
  - 교사: 전체 학급 및 학생 진행 현황 요약  
  - 학생: 자신의 레슨 리스트와 완료 단계 표시  

- **레슨 선택**  
  1. 차시 버튼(1차시, 2차시, …) 클릭  
  2. 학습 목표 및 리소스 소개 모달 표시  
  3. 모달 ‘시작’ 클릭 시 레슨 페이지로 이동  

- **레슨 페이지 (4단계 순차 완료)**  
  1. 소개(학습 목표) 보기  
  2. 기초 배움 확인  
  3. 가이드된 활동 수행(지도 표시)  
  4. 자유 활동 작성  

- **인증장 발급**  
  - 모든 4단계 완료 시 ‘인증장 발급’ 버튼 활성화  
  - 인증장은 PDF 다운로드 가능  

---

## 12. 예시 레슨 구성

### 1차시: ‘서울의 모습과 특성’
- **학습 목표**: 서울의 위치와 주변 도시 관계 이해  
- **기초 배움**:  
  - 서울 범위를 노란색으로 색칠  
  - 주변 도시(양주·하남·과천·인천: 분홍, 고양·성남·시흥·남양주: 하늘색) 색칠 및 표기  
  - 자치구 경계 및 명칭 그리기  
- **가이드된 활동**:  
  1. 지도에서 색칠하며 위치 관계 설명  
  2. 자치구 특징 발표  
- **자유 활동**: 자신 거주 자치구 이름 유래 조사 및 발표  
- **자료 및 리소스**: PDF ‘서울의 생활’ 10~11쪽  

### 2차시: ‘한강과 서울의 하천’
- **학습 목표**: 한강 어원과 역할 파악  
- **기초 배움**: 한강의 합류 지점 및 흐름 확인  
- **가이드된 활동**: 한강 및 주요 하천 지도 그리기  
- **자유 활동**: 추가 하천 조사 및 표기  
- **자료 및 리소스**: PDF ‘서울의 생활’ 18~19쪽  

### 3차시: ‘서울의 도로와 지하철’
- **학습 목표**: 주요 도로·지하철 노선 파악  
- **기초 배움**: 자동차 전용도로 및 지하철 현황 학습  
- **가이드된 활동**: 도로·노선 지도 그리기  
- **자유 활동**: 자주 이용 교통수단 추가 표기  
- **자료 및 리소스**: PDF ‘서울의 생활’ 20~21쪽  

### 4차시: ‘교통의 중심지’
- **학습 목표**: 기차역·공항·버스터미널 위치 이해  
- **기초 배움**: 주요 교통 시설 기능 학습  
- **가이드된 활동**: 아이콘으로 위치 표기 및 설명  
- **자유 활동**: 이용 경험 공유  
- **자료 및 리소스**: PDF ‘서울의 생활’ 22~25쪽  

### 5차시: ‘행정의 중심지’
- **학습 목표**: 행정기관 위치 및 역할 이해  
- **기초 배움**: 시청·교육청·국회·정부청사·대법원 기능 학습  
- **가이드된 활동**: 기관 위치 지도 표기  
- **자유 활동**: 경험 공유 및 추가 표기  
- **자료 및 리소스**: PDF ‘서울의 생활’ 22~23, 26~27쪽  

### 6차시: ‘문화의 중심지’
- **학습 목표**: 주요 문화 시설 위치 학습  
- **기초 배움**: 이태원·스카이돔 역사 및 특징 학습  
- **가이드된 활동**: 시설 지도 표기 및 발표  
- **자유 활동**: 개인 추천 시설 추가  
- **자료 및 리소스**: PDF ‘서울의 생활’ 22~23, 34~35쪽  

### 7차시: ‘서울의 궁궐’
- **학습 목표**: 조선 궁궐 위치 및 수 이해  
- **기초 배움**: 주요 궁궐 학습  
- **가이드된 활동**: 궁궐 지도 표기 및 특징 발표  
- **자유 활동**: 방문 희망 궁궐 표기  
- **자료 및 리소스**: PDF ‘서울의 생활’ 38~40쪽  

### 8차시: ‘한양도성의 성곽과 대문’
- **학습 목표**: 사대문 위치 및 역사 이해  
- **기초 배움**: 사대문 명칭 및 의미 학습  
- **가이드된 활동**: 성곽·문터 지도 표기 및 설명  
- **자유 활동**: 성곽 구간 추가 표시  
- **자료 및 리소스**: PDF ‘서울의 생활’ 41~42쪽  


