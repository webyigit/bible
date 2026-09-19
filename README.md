# 성경 읽기 모바일웹

순수 HTML/CSS/JS로 만든 모바일 웹앱입니다. 빌드 도구가 없어서 파일만 열거나
GitHub Pages 에 올리면 바로 동작합니다.

## 기능

- **오늘의 읽기**: 하루 1장씩 창세기부터 요한계시록까지 순서대로 자동 배정, 전체 진행률 표시
- **읽음 표시(그룹 공감)**: 카카오톡처럼 무료 이모지(🙏 👍 ❤️ 😊 🔥)로 오늘 읽었음을 표시, 그룹원 전체가 실시간으로 확인
- **내 통계 / 그룹 순위**: 총 읽은 날, 연속 일수, 이번달 참여율, 그룹 리더보드
- **북마크 · 하이라이트 · 메모**: 구절을 눌러 저장, 메모 남기기 (기기별 저장)
- **본문 검색**
- **다크모드 / 글자 크기 조절**

## 파일 구성

| 파일 | 역할 |
|---|---|
| `index.html` | 화면 구조 · 스타일 |
| `app.js` | 앱 로직 (읽기 계획, 성경 API 호출, Firebase 연동, 통계) |
| `firebase-config.js` | 그룹 기능용 Firebase 설정값 (비워두면 로컬 전용 모드) |

## 그룹 기능(읽음 표시 공유·순위) 켜는 법

그룹원끼리 "누가 오늘 읽었는지"를 공유하려면 무료 Firebase 프로젝트가 하나 필요합니다.
로그인 절차 없이 기기별로 자동 연결되고(익명 인증), 비용 없이 소규모 그룹 정도는
무료 한도 안에서 충분히 씁니다.

1. https://console.firebase.google.com 에서 새 프로젝트 생성
2. 왼쪽 메뉴 **빌드 > Firestore Database** → 데이터베이스 만들기 (프로덕션 모드로 시작해도 됩니다, 규칙은 아래에서 바꿉니다)
3. 왼쪽 메뉴 **빌드 > Authentication** → **Sign-in method** 에서 **익명(Anonymous)** 로그인 활성화
4. 프로젝트 설정(톱니바퀴) > 일반 > 내 앱 > 웹 앱 추가(</> 아이콘) → 나오는 `firebaseConfig` 값을 복사
5. 이 저장소의 `firebase-config.js` 를 열어 `window.BIBLE_APP_FIREBASE_CONFIG = null;` 을
   복사한 값으로 교체 (예시가 파일 아래쪽 주석에 있습니다)
6. Firestore **규칙** 탭에 아래 규칙을 붙여넣고 게시:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == uid;
    }
    match /reactions/{docId} {
      allow read: if true;
      allow create, update: if request.auth != null && request.resource.data.uid == request.auth.uid;
      allow delete: if false;
    }
    match /config/plan {
      allow read: if true;
      allow create: if request.auth != null;
      allow update: if request.auth != null;
    }
  }
}
```

7. 파일을 저장하고 다시 배포(GitHub Pages 등)하면 설정 화면에 "Firebase 연결됨"이 표시됩니다.

Firebase를 설정하지 않아도 앱은 그대로 동작합니다. 다만 읽음 표시는 내 기기에만
남고, 그룹 순위 탭에는 "Firebase 연동이 필요합니다" 안내만 보입니다.

## 성경 본문 API에 대한 안내 (중요)

본문은 무료 공개 API인 [bolls.life](https://bolls.life)에서 실시간으로 가져오도록
구현했습니다. 이 앱을 만든 개발 환경(샌드박스)은 외부 네트워크 접속이 막혀 있어서
**번역본 코드(기본값 `GAE`)가 실제로 맞는지 직접 확인하지 못한 상태**입니다.

배포 후 처음 열었을 때 "성경 본문을 불러오지 못했습니다" 라는 메시지가 뜨면:

1. 설정 탭 하단 "디버그" 문구에 뜨는 오류 메시지를 확인하세요.
2. 설정 > 성경 본문 소스 > 번역본 코드를 다른 값으로 바꿔서 저장해보세요.
3. 어떤 오류가 떴는지 알려주시면 바로 고쳐드리겠습니다.

번역본 코드나 API를 완전히 다른 것으로 바꾸고 싶다면 `app.js` 상단의
`BibleAPI` 객체만 교체하면 됩니다 (URL 형식과 응답 파싱 부분).

## 데이터에 대한 원칙

성경 본문·검색 결과는 항상 외부 API에서 그때그때 받아온 값만 보여주고,
앱이 임의로 본문을 지어내지 않습니다. API 호출이 실패하면 빈 화면 대신
실패했다는 안내를 보여줍니다.

## GitHub Pages로 배포하기 (Windows, PowerShell 5.1 기준)

PowerShell 5.1에서는 `&&`가 안 되니 한 줄씩 실행하세요.

```powershell
git add .
git commit -m "메시지"
git push
```

그 다음 GitHub 저장소 **Settings > Pages** 에서 Source를 `main` 브랜치, 폴더는
`/ (root)` 로 설정하면 `https://<계정>.github.io/<저장소이름>/` 주소로 접속됩니다.
