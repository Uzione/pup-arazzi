# 📱 Pup-arazzi Mobile App

Pup-arazzi의 React Native Expo 기반 모바일 애플리케이션입니다.

---

## 🚀 실행 방법

```bash
npm install
npm start
```

Expo 실행 후 QR 코드를 스캔하여 모바일 환경에서 테스트할 수 있습니다.

---

## 📂 폴더 구조

```text
app/
├── App.js
├── app.json
├── index.js
├── package.json
├── assets/
└── src/
    ├── components/
    ├── navigation/
    ├── screens/
    ├── services/
    └── utils/
```

---

## 🔧 주요 기능

- 반려견 피부 사진 촬영 및 업로드
- 진단 결과 화면 제공
- 진단 이력 관리
- 위치 기반 동물병원 검색
- FastAPI 백엔드 서버와 API 통신

---

## ⚙️ 기술 스택

- React Native
- Expo
- JavaScript
- React Navigation
- REST API

---

## 🔐 환경 변수

`.env` 파일은 GitHub에 업로드하지 않습니다.

예시:

```env
API_BASE_URL=http://localhost:8000
```

---

## 📌 주의사항

- 앱 실행 전 필요한 패키지를 설치해야 합니다.
- 백엔드 서버가 실행 중이어야 API 기능이 정상 작동합니다.
- `.env`, API Key, 토큰 정보는 GitHub에 올리지 않습니다.
