# 성경 읽기 모바일웹

순수 HTML/CSS/JS로 만든 모바일 웹앱입니다. 빌드 도구가 없어서 파일만 열거나
GitHub Pages 에 올리면 바로 동작합니다.

## 기능

- **오늘의 읽기**: 하루 1장씩 창세기부터 요한계시록까지 순서대로 자동 배정, 전체 진행률 표시
- **오늘의 영상**: 매일 영상이 하나씩 추가되는 유튜브 재생목록을 등록하면 최신 영상을 자동으로 가져와 썸네일 카드로 표시(Firebase 연결 시 그룹 전체 공유), 또는 링크를 직접 붙여넣어 고정하는 방식도 지원
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

## 재생목록에서 "오늘의 영상" 자동으로 가져오기

매일 영상을 하나씩 올려주시는 분이 쓰는 유튜브 재생목록이 있다면, 그 재생목록을 등록해서
앱이 매일 최신 영상을 자동으로 가져오게 할 수 있습니다.

1. https://console.cloud.google.com 에서 프로젝트 생성(기존 Firebase 프로젝트를 그대로 써도 됩니다)
2. **API 및 서비스 > 라이브러리**에서 **YouTube Data API v3** 검색 후 사용 설정
3. **API 및 서비스 > 사용자 인증 정보 > API 키 만들기**로 키 발급
   - 보안을 위해 키를 만든 뒤 "키 제한사항 > API 제한"에서 YouTube Data API v3만 허용하도록
     제한해두는 걸 권장합니다.
4. 앱의 **설정 > 오늘의 영상 — 재생목록 자동 연동**에서 재생목록 링크와 위에서 만든 API 키를
   입력하고 저장

이 API 키는 **내 기기(브라우저)에만 저장되고 Firebase나 다른 사람에게 공유되지 않습니다.**
그룹 전체에는 매일 계산된 "오늘의 영상 링크"만 공유됩니다 — 그래서 재생목록 자동 연동은
그룹당 한 사람(보통 영상을 매일 올려주는 분)만 설정해두면 됩니다. 무료 할당량은 하루
10,000유닛이고 이 앱은 하루 한 번만 확인하므로 충분합니다.

## 성경 본문 API에 대한 안내 (중요)

본문은 무료 공개 API인 [bolls.life](https://bolls.life)에서 실시간으로 가져옵니다.

- 엔드포인트: `https://bolls.life/get-text/<번역본코드>/<책번호>/<장번호>/`
- 검색: `https://bolls.life/v2/find/<번역본코드>?search=<검색어>`
- 기본 번역본 코드는 `KRV`(개역한글, 1961년판)입니다. `KRV`는 YouVersion(Bible.com)을
  비롯한 여러 성경 서비스가 공통으로 쓰는 표준 약어입니다. 개역개정판은 대한성서공회가
  저작권을 적극적으로 관리하고 있어 무료 공개 API에서는 거의 제공되지 않기 때문에,
  더 오래되었지만 자유롭게 배포되는 개역한글을 기본값으로 뒀습니다.

이 앱을 만든 개발 환경(샌드박스)은 외부 네트워크 접속이 통째로 막혀 있어서 위 URL과
번역본 코드를 실제로 호출해서 검증하지는 못했습니다 — 여러 출처를 교차 확인해 신뢰도를
높였을 뿐, 100% 확인된 값은 아닙니다. 배포 후 처음 열었을 때 "성경 본문을 불러오지
못했습니다" 라는 메시지가 뜨면:

1. 설정 탭 하단 "디버그" 문구에 뜨는 오류 메시지를 확인하세요 (HTTP 상태 코드나 응답
   내용이 힌트가 됩니다).
2. 설정 > 성경 본문 소스 > 번역본 코드를 다른 값으로 바꿔서 저장해보세요.
3. 어떤 오류가 떴는지 알려주시면 바로 고쳐드리겠습니다.

번역본 코드나 API를 완전히 다른 것으로 바꾸고 싶다면 `app.js` 상단의
`BibleAPI` 객체만 교체하면 됩니다 (URL 형식과 응답 파싱 부분).

### 검토했지만 쓰지 않은 대안

- **wldeh/bible-api** (GitHub, jsDelivr로 제공되는 200개 이상 번역본 정적 JSON): 실제
  목록을 확인해보니 한국어 번역본이 포함되어 있지 않아 제외했습니다.
- **AI 현대어 의역 성경 데이터셋** (예: cameleonh/open-korean-bible류 프로젝트): 저장소
  설명에 "AI 생성 번역이며 신학적 정확성을 보증하지 않는다"고 명시되어 있어, 매일 성경
  본문으로 쓰기에는 부적절하다고 판단해 사용하지 않았습니다.

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
