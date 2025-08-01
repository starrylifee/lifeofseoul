# Life of Seoul - EduTech Tool

서울 초등학교 4학년 사회과 '지역사회' 단원 학습을 위한 지도 기반 에듀테크 도구입니다.

## 주요 기능

- 지도 기반 학습 활동
- 학생 참여형 마커 생성
- 교사 대시보드
- 실시간 학습 데이터 수집

## 기술 스택

- React
- Firebase (Authentication, Firestore, Storage)
- Leaflet 지도 API
- Tailwind CSS

## 최근 업데이트

### 이미지 업로드 기능 개선 (2025-04-02)

- Firebase Blaze 요금제로 전환하여 이미지 업로드 기능 활성화
- 자동 이미지 리사이징 기능 추가
  - 업로드 전 클라이언트 측에서 이미지 크기 조정 (최대 800x600)
  - 1MB 이상 이미지 자동 압축
  - 이미지 품질 최적화 (85% 품질)
- 다중 이미지 업로드 지원
- 스토리지 사용량 최적화

## 설치 및 실행

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm start

# 프로덕션 빌드
npm run build
```

## 환경 설정

`.env` 파일에 다음 환경 변수를 설정해야 합니다:

```
REACT_APP_FIREBASE_API_KEY=
REACT_APP_FIREBASE_AUTH_DOMAIN=
REACT_APP_FIREBASE_PROJECT_ID=
REACT_APP_FIREBASE_STORAGE_BUCKET=
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=
REACT_APP_FIREBASE_APP_ID=
```

## 배포

Firebase Hosting을 통해 배포합니다:

```bash
firebase deploy
``` 