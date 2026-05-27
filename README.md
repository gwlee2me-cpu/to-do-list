# TO-DO 리스트 앱

React와 Vite를 사용한 현대적인 TO-DO 리스트 애플리케이션입니다.

## 기능

- ✅ 할 일 추가 및 삭제
- ✅ 할 일 완료 체크
- ✅ 날짜별 할 일 관리
- ✅ 드래그 앤 드롭으로 순서 변경
- ✅ 달력 뷰 (주간/월간 전환)
- ✅ 로컬 스토리지로 데이터 유지
- ✅ 반응형 디자인

## 개발 환경 설정

### 필수 요구사항
- Node.js 18 이상
- npm 또는 yarn

### 설치 및 실행
```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 빌드
npm run build

# 미리보기
npm run preview
```

## 배포

이 프로젝트는 GitHub Pages를 통해 자동 배포됩니다.

### GitHub Pages 배포 방법

1. **GitHub 저장소 생성**
   - GitHub에서 새 저장소를 만드세요 (이름: `to-do-list`)
   - Public으로 설정

2. **프로젝트 업로드**
   ```bash
   # Git 초기화 (아직 안 했다면)
   git init
   git add .
   git commit -m "Initial commit"

   # GitHub 저장소 연결 (YOUR_USERNAME을 실제 사용자명으로 변경)
   git remote add origin https://github.com/YOUR_USERNAME/to-do-list.git
   git push -u origin main
   ```

3. **GitHub Pages 활성화**
   - 저장소 Settings → Pages
   - Source를 "GitHub Actions"로 변경
   - 자동으로 배포됩니다

4. **배포 URL**
   - `https://YOUR_USERNAME.github.io/to-do-list/`

## 기술 스택

- **Frontend**: React 19
- **Build Tool**: Vite
- **Styling**: CSS Modules
- **Deployment**: GitHub Pages
- **CI/CD**: GitHub Actions

## 프로젝트 구조

```
src/
├── App.jsx          # 메인 애플리케이션 컴포넌트
├── App.css          # 스타일링
├── index.css        # 글로벌 스타일
└── main.jsx         # 애플리케이션 진입점
```

## 라이선스

MIT License
