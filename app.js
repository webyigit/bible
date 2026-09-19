// 성경 읽기 모바일웹 — 순수 JS 앱 로직
// Firebase는 firebase-config.js 에 값이 채워져 있을 때만 동적으로 연결됩니다.

/* ---------- 성경 목차 (66권, 표준 개신교 정경 순서 · 장 수는 고정된 구조 정보) ---------- */
const BOOKS = [
  ["창세기",50],["출애굽기",40],["레위기",27],["민수기",36],["신명기",34],
  ["여호수아",24],["사사기",21],["룻기",4],["사무엘상",31],["사무엘하",24],
  ["열왕기상",22],["열왕기하",25],["역대상",29],["역대하",36],["에스라",10],
  ["느헤미야",13],["에스더",10],["욥기",42],["시편",150],["잠언",31],
  ["전도서",12],["아가",8],["이사야",66],["예레미야",52],["예레미야애가",5],
  ["에스겔",48],["다니엘",12],["호세아",14],["요엘",3],["아모스",9],
  ["오바댜",1],["요나",4],["미가",7],["나훔",3],["하박국",3],
  ["스바냐",3],["학개",2],["스가랴",14],["말라기",4],
  ["마태복음",28],["마가복음",16],["누가복음",24],["요한복음",21],["사도행전",28],
  ["로마서",16],["고린도전서",16],["고린도후서",13],["갈라디아서",6],["에베소서",6],
  ["빌립보서",4],["골로새서",4],["데살로니가전서",5],["데살로니가후서",3],["디모데전서",6],
  ["디모데후서",4],["디도서",3],["빌레몬서",1],["히브리서",13],["야고보서",5],
  ["베드로전서",5],["베드로후서",3],["요한일서",5],["요한이서",1],["요한삼서",1],
  ["유다서",1],["요한계시록",22]
];
const TOTAL_CHAPTERS = BOOKS.reduce((s,b)=>s+b[1],0); // 1189

function planSequence(){
  // [{bookIdx, book, chapter}] 1189개, 창세기 1장부터 요한계시록 마지막장까지
  const seq = [];
  BOOKS.forEach((b,i)=>{ for(let c=1;c<=b[1];c++) seq.push({bookIdx:i, book:b[0], chapter:c}); });
  return seq;
}
const PLAN = planSequence();

const EMOJIS_PRIMARY = ["🙏","👍","❤️","😊","🔥","👏","🙌","💪","✨"];
const EMOJIS_EXTRA = ["😭","🥹","📖","🕊️","💖","😇","🎉","🌿"];
const EMOJIS = [...EMOJIS_PRIMARY, ...EMOJIS_EXTRA]; // 배지 등 "이미 고른 이모지인지" 판별용

/* 매일 돌아가며 보여줄 묵상 포인트 — 특정 본문 해석이 아니라 어떤 본문에도 적용 가능한
   일반적인 묵상 질문이라, 신학적으로 틀린 내용을 단정할 위험 없이 안전하게 쓸 수 있다. */
const MEDITATION_PROMPTS = [
  "오늘 본문에서 가장 마음에 와닿는 구절은 무엇인가요?",
  "이 말씀을 통해 하나님에 대해 새롭게 알게 된 것은 무엇인가요?",
  "오늘 배운 내용을 삶에 어떻게 적용할 수 있을까요?",
  "본문 속 인물의 행동에서 배울 점은 무엇인가요?",
  "오늘 하루 감사한 일 한 가지를 떠올려보세요.",
  "이 본문이 나에게 주는 위로나 도전은 무엇인가요?",
  "오늘 말씀을 한 문장으로 요약한다면?",
  "본문에서 반복되는 단어나 주제가 있나요?",
  "이 말씀을 통해 기도하고 싶은 제목은 무엇인가요?",
  "오늘 본문에서 이해가 안 되는 부분이 있다면 무엇인가요?",
  "본문 속 상황이 지금 내 삶과 비슷한 점이 있나요?",
  "오늘 말씀을 누군가와 나눈다면 어떤 이야기를 하고 싶나요?",
  "본문을 읽고 떠오른 하나님의 성품은 무엇인가요?",
  "오늘 하루 이 말씀을 기억하며 실천할 작은 행동은 무엇인가요?",
  "본문에서 하나님이 나에게 하시는 약속이 있다면 무엇인가요?",
];

/* ---------- 성경 인물 색인 ----------
   구약·신약을 통틀어 잘 알려진 인물 위주로 뽑았다. 요약은 여러 성경 인물 사전에서
   공통으로 확인되는 기본 사실(누구인지, 등장 본문)만 짧게 적었고, 신학적 해석이나
   논쟁적인 내용은 넣지 않았다. 아바타는 실존 인물의 얼굴을 그리는 대신, 역할을
   상징하는 이모지 아이콘 배지로만 표시한다. */
const PEOPLE = [
  {name:"아담", category:"창조", icon:"🌱", color:["#8bc98b","#4a8f4a"], summary:"하나님이 흙으로 지으신 첫 사람으로, 에덴동산에서 살았다.", refs:"창세기 1~5장"},
  {name:"하와", category:"창조", icon:"🍎", color:["#ffb199","#e0577a"], summary:"아담의 아내로 지음받은 첫 여자.", refs:"창세기 2~4장"},
  {name:"노아", category:"족장 이전", icon:"🚢", color:["#7fb3d5","#4a7fa5"], summary:"하나님의 명령으로 방주를 지어 대홍수에서 가족과 동물들을 구원했다.", refs:"창세기 6~9장"},
  {name:"아브라함", category:"족장", icon:"⭐", color:["#e0b04c","#8b5cf6"], summary:"믿음의 조상으로 불리며, 하나님과 언약을 맺고 이삭을 낳았다.", refs:"창세기 12~25장"},
  {name:"사라", category:"족장", icon:"⛺", color:["#ff9fc2","#c2559a"], summary:"아브라함의 아내로, 노년에 이삭을 낳았다.", refs:"창세기 11~23장"},
  {name:"이삭", category:"족장", icon:"🐏", color:["#c9a27e","#8b5cf6"], summary:"아브라함과 사라의 아들이며, 야곱과 에서의 아버지다.", refs:"창세기 21~35장"},
  {name:"리브가", category:"족장", icon:"🏺", color:["#ff9fc2","#c2559a"], summary:"이삭의 아내로, 야곱과 에서의 어머니다.", refs:"창세기 24~27장"},
  {name:"야곱", category:"족장", icon:"🪜", color:["#c9a27e","#8b5cf6"], summary:"이삭의 아들로 훗날 '이스라엘'이라는 이름을 받았으며, 열두 지파의 조상이 되었다.", refs:"창세기 25~49장"},
  {name:"라헬", category:"족장", icon:"🐑", color:["#ff9fc2","#c2559a"], summary:"야곱의 아내로, 요셉과 베냐민의 어머니다.", refs:"창세기 29~35장"},
  {name:"레아", category:"족장", icon:"🌾", color:["#ff9fc2","#c2559a"], summary:"야곱의 아내로, 여섯 아들의 어머니다.", refs:"창세기 29~35장"},
  {name:"요셉", category:"족장", icon:"🌾", color:["#e0b04c","#8b5cf6"], summary:"야곱의 아들로, 애굽의 총리가 되어 흉년에서 가족을 구했다.", refs:"창세기 37~50장"},
  {name:"모세", category:"출애굽", icon:"📜", color:["#7fb3d5","#4a7fa5"], summary:"이스라엘 백성을 애굽에서 이끌어냈고, 시내산에서 십계명을 받았다.", refs:"출애굽기~신명기"},
  {name:"아론", category:"출애굽", icon:"⚱️", color:["#e0b04c","#8b5cf6"], summary:"모세의 형으로, 이스라엘의 첫 대제사장이 되었다.", refs:"출애굽기~민수기"},
  {name:"미리암", category:"출애굽", icon:"🎵", color:["#ff9fc2","#c2559a"], summary:"모세와 아론의 누이로, 여선지자로 불렸다.", refs:"출애굽기 15장, 민수기 12장"},
  {name:"여호수아", category:"출애굽", icon:"⚔️", color:["#7fb3d5","#4a7fa5"], summary:"모세의 후계자로, 가나안 땅 정복을 이끌었다.", refs:"여호수아서"},
  {name:"드보라", category:"사사", icon:"⚖️", color:["#ff9fc2","#c2559a"], summary:"이스라엘의 여사사이자 여선지자로 활동했다.", refs:"사사기 4~5장"},
  {name:"기드온", category:"사사", icon:"🏺", color:["#c9a27e","#8b5cf6"], summary:"삼백 용사로 미디안 군대를 물리친 사사다.", refs:"사사기 6~8장"},
  {name:"삼손", category:"사사", icon:"🦁", color:["#c9a27e","#8b5cf6"], summary:"큰 힘을 가진 사사로, 들릴라에게 배신당해 힘을 잃었다.", refs:"사사기 13~16장"},
  {name:"룻", category:"룻기", icon:"🌾", color:["#e0b04c","#8b5cf6"], summary:"시어머니 나오미를 따른 모압 여인으로, 다윗의 증조모가 되었다.", refs:"룻기"},
  {name:"나오미", category:"룻기", icon:"🌾", color:["#ff9fc2","#c2559a"], summary:"룻의 시어머니로, 베들레헴으로 돌아온 과부다.", refs:"룻기"},
  {name:"사무엘", category:"사사·선지자", icon:"🕯️", color:["#7fb3d5","#4a7fa5"], summary:"이스라엘의 마지막 사사이자 선지자로, 사울과 다윗에게 기름을 부었다.", refs:"사무엘상"},
  {name:"사울", category:"왕", icon:"👑", color:["#9a94b5","#5b4a7a"], summary:"이스라엘의 첫 번째 왕이다.", refs:"사무엘상"},
  {name:"다윗", category:"왕", icon:"🪨", color:["#e0b04c","#8b5cf6"], summary:"이스라엘의 왕으로, 골리앗을 물리쳤고 시편의 많은 부분을 지었다.", refs:"사무엘상~열왕기상"},
  {name:"골리앗", category:"왕정", icon:"⚔️", color:["#9a94b5","#5b4a7a"], summary:"블레셋의 거인 장수로, 소년 다윗에게 패했다.", refs:"사무엘상 17장"},
  {name:"요나단", category:"왕정", icon:"🏹", color:["#7fb3d5","#4a7fa5"], summary:"사울의 아들로, 다윗과 깊은 우정을 나누었다.", refs:"사무엘상"},
  {name:"솔로몬", category:"왕", icon:"👑", color:["#e0b04c","#8b5cf6"], summary:"다윗의 아들로, 지혜로운 왕이자 예루살렘 성전을 건축했다.", refs:"열왕기상 1~11장"},
  {name:"엘리야", category:"선지자", icon:"🔥", color:["#f4a261","#e0577a"], summary:"갈멜산에서 바알 선지자들과 대결했고, 불수레를 타고 승천했다.", refs:"열왕기상~열왕기하"},
  {name:"엘리사", category:"선지자", icon:"🌊", color:["#7fb3d5","#4a7fa5"], summary:"엘리야의 후계자로 활동한 선지자다.", refs:"열왕기하"},
  {name:"이사야", category:"대선지자", icon:"📜", color:["#7fb3d5","#4a7fa5"], summary:"메시아에 대한 예언을 많이 남긴 대선지자다.", refs:"이사야서"},
  {name:"예레미야", category:"대선지자", icon:"😢", color:["#7fb3d5","#4a7fa5"], summary:"'눈물의 선지자'로 불리며 예루살렘의 멸망을 예언했다.", refs:"예레미야서"},
  {name:"에스겔", category:"대선지자", icon:"👁️", color:["#7fb3d5","#4a7fa5"], summary:"바벨론 포로 시대에 활동한 선지자다.", refs:"에스겔서"},
  {name:"다니엘", category:"대선지자", icon:"🦁", color:["#9a94b5","#5b4a7a"], summary:"바벨론과 페르시아 궁정에서 활동했으며, 사자굴에서 구원받았다.", refs:"다니엘서"},
  {name:"요나", category:"소선지자", icon:"🐋", color:["#7fb3d5","#4a7fa5"], summary:"니느웨로 가라는 하나님의 명령을 피하다 큰 물고기 뱃속에 들어갔다.", refs:"요나서"},
  {name:"욥", category:"지혜서", icon:"⛅", color:["#9a94b5","#5b4a7a"], summary:"극심한 고난 속에서도 믿음을 지킨 인물이다.", refs:"욥기"},
  {name:"에스더", category:"포로·귀환", icon:"👑", color:["#ff9fc2","#c2559a"], summary:"페르시아의 왕비가 되어 위기에 처한 유대 민족을 구했다.", refs:"에스더서"},
  {name:"모르드개", category:"포로·귀환", icon:"📯", color:["#e0b04c","#8b5cf6"], summary:"에스더의 사촌으로, 유대인을 구하는 데 힘썼다.", refs:"에스더서"},
  {name:"느헤미야", category:"포로·귀환", icon:"🧱", color:["#c9a27e","#8b5cf6"], summary:"예루살렘 성벽을 재건한 지도자다.", refs:"느헤미야서"},
  {name:"에스라", category:"포로·귀환", icon:"📜", color:["#7fb3d5","#4a7fa5"], summary:"율법학자로, 포로 귀환 후 신앙 개혁을 이끌었다.", refs:"에스라서"},
  {name:"마리아", category:"신약·예수 탄생", icon:"🕊️", color:["#a7c7e7","#5b7fa6"], summary:"예수 그리스도의 어머니다.", refs:"마태복음, 누가복음"},
  {name:"요셉(예수의 아버지)", category:"신약·예수 탄생", icon:"🔨", color:["#c9a27e","#8b5cf6"], summary:"마리아의 남편으로, 목수 일을 했다.", refs:"마태복음, 누가복음"},
  {name:"세례요한", category:"신약·예수 탄생", icon:"🕊️", color:["#a7c7e7","#5b7fa6"], summary:"예수의 길을 예비한 선지자로, 요단강에서 세례를 베풀었다.", refs:"마태복음 3장 외"},
  {name:"베드로", category:"제자·사도", icon:"🎣", color:["#7fb3d5","#4a7fa5"], summary:"예수의 열두 제자 중 한 사람으로, 초대교회의 지도자가 되었다.", refs:"사복음서, 사도행전"},
  {name:"안드레", category:"제자·사도", icon:"🎣", color:["#7fb3d5","#4a7fa5"], summary:"베드로의 형제로, 어부 출신 제자다.", refs:"사복음서"},
  {name:"야고보(세베대의 아들)", category:"제자·사도", icon:"🎣", color:["#7fb3d5","#4a7fa5"], summary:"요한의 형제로, 열두 제자 중 한 사람이다.", refs:"사복음서"},
  {name:"요한", category:"제자·사도", icon:"🕊️", color:["#a7c7e7","#5b7fa6"], summary:"열두 제자 중 한 사람으로, 요한복음과 요한계시록을 기록했다고 전해진다.", refs:"사복음서, 요한계시록"},
  {name:"도마", category:"제자·사도", icon:"❓", color:["#7fb3d5","#4a7fa5"], summary:"예수의 부활을 의심했다가 직접 확인한 제자다.", refs:"요한복음 20장"},
  {name:"마태", category:"제자·사도", icon:"📖", color:["#7fb3d5","#4a7fa5"], summary:"세리 출신 제자로, 마태복음을 기록했다고 전해진다.", refs:"마태복음"},
  {name:"막달라마리아", category:"신약·여성", icon:"🌹", color:["#ff9fc2","#c2559a"], summary:"예수를 따르던 여성 중 한 사람으로, 부활의 첫 증인이었다.", refs:"사복음서"},
  {name:"마르다와나사로", category:"신약·여성", icon:"🏠", color:["#c9a27e","#8b5cf6"], summary:"베다니에 살던 남매로, 나사로는 죽은 지 나흘 만에 살아났다.", refs:"요한복음 11장"},
  {name:"바울", category:"사도", icon:"✍️", color:["#9a94b5","#5b4a7a"], summary:"이방인을 위한 사도로, 신약의 여러 서신서를 기록했다.", refs:"사도행전, 서신서"},
  {name:"바나바", category:"사도", icon:"🤝", color:["#7fb3d5","#4a7fa5"], summary:"바울의 초기 선교 동역자였다.", refs:"사도행전"},
  {name:"스데반", category:"초대교회", icon:"⭐", color:["#e0b04c","#8b5cf6"], summary:"초대교회 최초의 순교자다.", refs:"사도행전 6~7장"},
  {name:"디모데", category:"사도의 제자", icon:"📖", color:["#7fb3d5","#4a7fa5"], summary:"바울의 제자로, 디모데전후서의 수신자다.", refs:"사도행전, 디모데전후서"},
  {name:"누가", category:"사도의 제자", icon:"✍️", color:["#7fb3d5","#4a7fa5"], summary:"의사 출신으로, 누가복음과 사도행전을 기록했다고 전해진다.", refs:"누가복음, 사도행전"},
];

function chosung(ch){
  const code = (ch||"").charCodeAt(0) - 0xAC00;
  if(code < 0 || code > 11171) return null;
  const CHO = ["ㄱ","ㄲ","ㄴ","ㄷ","ㄸ","ㄹ","ㅁ","ㅂ","ㅃ","ㅅ","ㅆ","ㅇ","ㅈ","ㅉ","ㅊ","ㅋ","ㅌ","ㅍ","ㅎ"];
  return CHO[Math.floor(code / 588)];
}

/* ---------- 유튜브 링크 → 영상ID / 썸네일 ---------- */
function parseYouTubeId(url){
  if(!url) return null;
  const patterns = [
    /youtu\.be\/([\w-]{11})/,
    /[?&]v=([\w-]{11})/,
    /youtube\.com\/embed\/([\w-]{11})/,
    /youtube\.com\/shorts\/([\w-]{11})/,
  ];
  for(const re of patterns){ const m = url.match(re); if(m) return m[1]; }
  return null;
}
function parsePlaylistId(input){
  if(!input) return null;
  const m = input.match(/[?&]list=([\w-]+)/);
  if(m) return m[1];
  if(/^[\w-]{10,}$/.test(input.trim())) return input.trim(); // 이미 ID만 입력한 경우
  return null;
}

/* ---------- 로컬 저장소 ---------- */
const LS = {
  get(k, d){ try{ const v = localStorage.getItem("bible_app_"+k); return v===null? d : JSON.parse(v); }catch(e){ return d; } },
  set(k, v){ try{ localStorage.setItem("bible_app_"+k, JSON.stringify(v)); }catch(e){} }
};

function todayISO(){
  const d = new Date();
  const tz = d.getTimezoneOffset()*60000;
  return new Date(d - tz).toISOString().slice(0,10);
}
function daysBetween(aISO,bISO){
  const a = new Date(aISO+"T00:00:00"), b = new Date(bISO+"T00:00:00");
  return Math.round((b-a)/86400000);
}

let state = {
  nickname: LS.get("nickname",""),
  uid: LS.get("uid", null),
  darkMode: LS.get("darkMode", window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches),
  fontScale: LS.get("fontScale", 1),
  translation: LS.get("translation", "KRV"),
  planStart: LS.get("planStart", null), // Firebase 있으면 원격 값으로 덮어씀
  readDates: LS.get("readDates", {}),   // { "2026-09-19": "🙏" } 로컬 개인 기록(오프라인 대비)
  bookmarks: LS.get("bookmarks", []),
  deletedBookmarks: LS.get("deletedBookmarks", []),
  deletedMeditationNotes: LS.get("deletedMeditationNotes", {}), // { "2026-09-19": {text, deletedAt} }
  meditationNotes: LS.get("meditationNotes", {}), // { "2026-09-19": "오늘 느낀 점..." }
  chapterVerseCounts: LS.get("chapterVerseCounts", {}), // { "2026-09-19": 31 } 실제 API로 받아온 절 수
  todayVideoUrl: LS.get("todayVideoUrl", ""),
  playlistId: LS.get("playlistId", ""),
  youtubeApiKey: LS.get("youtubeApiKey", ""), // 이 기기에만 저장, Firestore에는 절대 쓰지 않음
  videoAutoFetchedDate: LS.get("videoAutoFetchedDate", ""),
};
if(!state.uid){ state.uid = "u_"+Math.random().toString(36).slice(2)+Date.now().toString(36); LS.set("uid", state.uid); }
if(!state.planStart){
  // 기본값: 올해 1월 1일 = 1일차. 재생목록 영상도 같은 날짜 세기로 맞물려 돌아간다.
  state.planStart = `${new Date().getFullYear()}-01-01`;
  LS.set("planStart", state.planStart);
}
function currentPlanDay1based(){
  return Math.max(1, daysBetween(state.planStart, todayISO()) + 1);
}

/* ---------- 성경 본문 API 어댑터 ----------
   bolls.life 공개 API(무료, 키 불필요)를 사용합니다. 기본 번역본은 KRV(개역한글, 1961) —
   bolls.life·YouVersion 등 여러 성경 서비스가 공통으로 쓰는 표준 약어입니다. 개역개정판은
   저작권 문제로 무료 공개 API에서 거의 제공되지 않아 개역한글을 기본값으로 뒀습니다.
   이 세션 환경은 외부 네트워크가 막혀 있어 실제 호출로 직접 검증하지는 못했으니, 배포 후
   본문이 안 뜨면 설정 > 디버그의 오류 메시지를 확인하고 번역본 코드를 바꿔가며 테스트해주세요. */
const BibleAPI = {
  // bolls.life가 CORS를 막아 직접 fetch가 실패할 수 있어(주로 "Failed to fetch") 공개 CORS
  // 프록시로도 "동시에" 시도한다. 순서대로(직접 실패 → 프록시 시도) 하면 실패를 기다리는
  // 시간만큼 느려지므로, Promise.any로 둘 중 먼저 성공하는 쪽을 그대로 쓴다.
  async _fetchJson(url){
    const tryFetch = async (u, label) => {
      const res = await fetch(u);
      if(!res.ok) throw new Error(`HTTP ${res.status} (${label}) — ${url}`);
      return await res.json();
    };
    const proxied = `https://corsproxy.io/?url=${encodeURIComponent(url)}`;
    try{
      return await Promise.any([tryFetch(url, "직접"), tryFetch(proxied, "프록시")]);
    }catch(agg){
      const msgs = (agg.errors || [agg]).map(e=> e.message).join(" / ");
      throw new Error(`본문 조회 실패: ${msgs}`);
    }
  },
  _chapterCache: new Map(),
  _searchCache: new Map(),
  async getChapter(translation, bookIdx, chapter){
    const cacheKey = `${translation}:${bookIdx}:${chapter}`;
    if(this._chapterCache.has(cacheKey)) return this._chapterCache.get(cacheKey);
    const bookId = bookIdx+1; // bolls.life 는 창세기=1 ... 요한계시록=66 순서를 사용
    const url = `https://bolls.life/get-text/${encodeURIComponent(translation)}/${bookId}/${chapter}/`;
    const data = await this._fetchJson(url);
    if(!Array.isArray(data) || data.length===0) throw new Error(`빈 응답 — ${url}`);
    const result = data.map(v => ({ verse: v.verse ?? v.pk ?? "", text: (v.text||"").replace(/<[^>]+>/g,"") }));
    this._chapterCache.set(cacheKey, result);
    return result;
  },
  async search(translation, query){
    const cacheKey = `${translation}:${query}`;
    if(this._searchCache.has(cacheKey)) return this._searchCache.get(cacheKey);
    const url = `https://bolls.life/v2/find/${encodeURIComponent(translation)}?search=${encodeURIComponent(query)}&match_case=false&match_whole=false`;
    const data = await this._fetchJson(url);
    const list = Array.isArray(data) ? data : (data.results||[]);
    const result = list.map(v => ({
      bookIdx: (v.book ?? v.book_id ?? 1)-1,
      chapter: v.chapter, verse: v.verse,
      text: (v.text||"").replace(/<[^>]+>/g,"")
    }));
    this._searchCache.set(cacheKey, result);
    return result;
  }
};

/* ---------- Firebase (선택) ---------- */
let fb = { app:null, auth:null, db:null, ready:false };
async function initFirebase(){
  const cfg = window.BIBLE_APP_FIREBASE_CONFIG;
  if(!cfg){ setText("firebase-status","Firebase 미연결 (로컬 전용 모드)"); return; }
  try{
    const [{initializeApp}, authMod, fsMod] = await Promise.all([
      import("https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js"),
      import("https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js"),
      import("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js"),
    ]);
    fb.app = initializeApp(cfg);
    fb.auth = authMod.getAuth(fb.app);
    fb.db = fsMod.getFirestore(fb.app);
    fb.mod = { ...authMod, ...fsMod };
    await authMod.signInAnonymously(fb.auth);
    await new Promise(resolve=>{
      authMod.onAuthStateChanged(fb.auth, user=>{ if(user){ state.uid = user.uid; resolve(); } });
    });
    fb.ready = true;
    setText("firebase-status","Firebase 연결됨 · 그룹 기능 활성화");

    // 공유 읽기계획 시작일: 없으면 내가 생성, 있으면 그 값을 사용
    const {doc, getDoc, setDoc} = fb.mod;
    const planRef = doc(fb.db, "config", "plan");
    const snap = await getDoc(planRef);
    if(snap.exists()){
      state.planStart = snap.data().startDate;
    } else {
      await setDoc(planRef, { startDate: state.planStart });
    }
    LS.set("planStart", state.planStart);

    // 닉네임 동기화
    if(state.nickname){
      await setDoc(doc(fb.db,"users",state.uid), { nickname: state.nickname, updatedAt: Date.now() }, {merge:true});
    }

    document.getElementById("rank-empty").style.display = "none";
    document.getElementById("group-hint").style.display = "none";
    watchTodayReactions();
    watchRanking();
    watchMeditationCounts();
    watchTodayVideo();
  }catch(err){
    console.error("Firebase 초기화 실패", err);
    setText("firebase-status", "Firebase 연결 실패: "+err.message+" (로컬 전용 모드로 계속)");
  }
}

function watchTodayVideo(){
  const {doc, onSnapshot} = fb.mod;
  onSnapshot(doc(fb.db,"config","video"), snap=>{
    if(snap.exists()){
      state.todayVideoUrl = snap.data().url || "";
      LS.set("todayVideoUrl", state.todayVideoUrl);
      document.getElementById("today-video-input").value = state.todayVideoUrl;
      renderVideoCard();
    }
  }, err=> console.error("오늘의 영상 조회 실패", err));
}

async function saveTodayVideo(url){
  state.todayVideoUrl = url;
  LS.set("todayVideoUrl", url);
  document.getElementById("today-video-input").value = url;
  if(fb.ready){
    const {doc, setDoc} = fb.mod;
    await setDoc(doc(fb.db,"config","video"), { url, updatedAt: Date.now() }, {merge:true});
  }
  renderVideoCard();
}

function renderVideoCard(){
  const card = document.getElementById("today-video-card");
  const vid = parseYouTubeId(state.todayVideoUrl);
  if(!vid){ card.style.display = "none"; return; }
  card.href = state.todayVideoUrl;
  document.getElementById("today-video-thumb").src = `https://img.youtube.com/vi/${vid}/hqdefault.jpg`;
  card.style.display = "block";
}

function renderMeditation(dayIdx, dateISO){
  const prompt = MEDITATION_PROMPTS[(dayIdx - 1) % MEDITATION_PROMPTS.length];
  setText("meditation-prompt", prompt);
  document.getElementById("meditation-note").value = state.meditationNotes[dateISO] || "";
  setText("meditation-status", state.meditationNotes[dateISO] ? "오늘 묵상노트를 작성했어요" : "");
}
document.getElementById("meditation-save").addEventListener("click", async ()=>{
  const text = document.getElementById("meditation-note").value;
  await saveMeditationNote(todayISO(), text);
  document.getElementById("meditation-note").value = "";
  setText("meditation-status", text.trim() ? "오늘 묵상노트를 저장했어요 · 북마크 탭 > 🌱 묵상노트에서 볼 수 있어요" : "");
  toast("묵상노트를 저장했습니다");
});

/* ---------- 재생목록에서 '오늘의 영상' 자동 가져오기 ----------
   재생목록은 1일차 영상부터 순서대로 쌓여있다고 보고, 오늘이 읽기 시작일(설정 >
   읽기 시작일, 기본값 올해 1월 1일) 기준 며칠째인지 계산해 그 순번의 영상을 가져온다.
   성경 본문도 같은 날짜 세기(currentPlanDay1based)를 쓰므로 영상과 본문이 항상 같은
   날로 맞물린다. YouTube Data API는 오프셋 조회가 안 되어 필요한 순번까지 페이지를
   순회해야 하지만, 하루 한 번만 호출하므로 무료 할당량(1일 10,000유닛) 안에서 충분하다. */
async function fetchPlaylistVideoAtIndex(apiKey, playlistId, index1based){
  let pageToken = "";
  let collected = [];
  let guard = 0;
  while(collected.length < index1based){
    const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=${encodeURIComponent(playlistId)}&key=${encodeURIComponent(apiKey)}${pageToken ? `&pageToken=${pageToken}` : ""}`;
    const res = await fetch(url);
    if(!res.ok){
      const body = await res.text().catch(()=> "");
      throw new Error(`HTTP ${res.status} — ${body.slice(0,200)}`);
    }
    const data = await res.json();
    if(Array.isArray(data.items)) collected = collected.concat(data.items);
    pageToken = data.nextPageToken || "";
    guard++;
    if(!pageToken || guard >= 50) break;
  }
  const item = collected[index1based - 1];
  if(!item) throw new Error(`재생목록에 ${index1based}번째(오늘) 영상이 아직 없습니다 (현재 ${collected.length}개)`);
  const vid = item.snippet.resourceId.videoId;
  return `https://www.youtube.com/watch?v=${vid}`;
}

async function autoFetchTodayVideo(force){
  if(!state.playlistId || !state.youtubeApiKey) return;
  if(!force && state.videoAutoFetchedDate === todayISO()) return;
  const statusEl = document.getElementById("playlist-status");
  const dayIdx = currentPlanDay1based();
  if(statusEl) statusEl.textContent = `재생목록에서 ${dayIdx}일차 영상을 확인하는 중…`;
  try{
    const url = await fetchPlaylistVideoAtIndex(state.youtubeApiKey, state.playlistId, dayIdx);
    await saveTodayVideo(url);
    state.videoAutoFetchedDate = todayISO();
    LS.set("videoAutoFetchedDate", state.videoAutoFetchedDate);
    if(statusEl) statusEl.textContent = `✅ ${dayIdx}일차 영상을 가져왔습니다: ` + url;
  }catch(err){
    console.error("재생목록 자동 확인 실패", err);
    if(statusEl) statusEl.textContent = "❌ 재생목록 확인 실패: " + err.message;
  }
}

async function pushReaction(dateISO, emoji){
  state.readDates[dateISO] = emoji;
  LS.set("readDates", state.readDates);
  if(!fb.ready) return;
  const {doc, setDoc} = fb.mod;
  await setDoc(doc(fb.db, "reactions", `${dateISO}_${state.uid}`), {
    date: dateISO, uid: state.uid, nickname: state.nickname || "익명", emoji, ts: Date.now()
  });
}

function watchTodayReactions(){
  const {collection, query, where, onSnapshot} = fb.mod;
  const q = query(collection(fb.db,"reactions"), where("date","==", todayISO()));
  onSnapshot(q, snap=>{
    const list = [];
    snap.forEach(d=> list.push(d.data()));
    renderReactorList(list);
  }, err=> console.error("오늘 반응 조회 실패", err));
}

let allReactionsCache = [];
function watchRanking(){
  const {collection, onSnapshot} = fb.mod;
  onSnapshot(collection(fb.db,"reactions"), snap=>{
    allReactionsCache = [];
    snap.forEach(d=> allReactionsCache.push(d.data()));
    renderRank();
  }, err=> console.error("전체 반응 조회 실패", err));
}

let allMeditationCountsCache = [];
function watchMeditationCounts(){
  const {collection, onSnapshot} = fb.mod;
  onSnapshot(collection(fb.db,"meditationCounts"), snap=>{
    allMeditationCountsCache = [];
    snap.forEach(d=> allMeditationCountsCache.push(d.data()));
    renderRank();
  }, err=> console.error("묵상노트 집계 조회 실패", err));
}

async function saveMeditationNote(dateISO, text){
  if(text.trim()){
    state.meditationNotes[dateISO] = text;
  } else {
    delete state.meditationNotes[dateISO];
  }
  LS.set("meditationNotes", state.meditationNotes);
  if(fb.ready){
    const {doc, setDoc} = fb.mod;
    const count = Object.keys(state.meditationNotes).length;
    await setDoc(doc(fb.db,"meditationCounts",state.uid), {
      uid: state.uid, nickname: state.nickname || "익명", count, updatedAt: Date.now()
    });
  }
}

/* ---------- 유틸 UI ---------- */
function setText(id, text){ const el=document.getElementById(id); if(el) el.textContent = text; }
function toast(msg){
  const t = document.getElementById("toast");
  t.textContent = msg; t.classList.add("show");
  clearTimeout(toast._t); toast._t = setTimeout(()=> t.classList.remove("show"), 1800);
}

/* ---------- 탭 전환 ---------- */
document.querySelectorAll("nav.bottom .nav-btn").forEach(btn=>{
  btn.addEventListener("click", ()=>{
    document.querySelectorAll("nav.bottom .nav-btn").forEach(b=>b.classList.remove("active"));
    document.querySelectorAll("main .tab").forEach(t=>t.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById(btn.dataset.tab).classList.add("active");
    if(btn.dataset.tab==="tab-rank") renderRank();
    if(btn.dataset.tab==="tab-bookmark") renderBookmarks();
  });
});
/* ---------- 설정 적용 ---------- */
function applySettings(){
  document.body.dataset.theme = state.darkMode ? "dark" : "light";
  document.documentElement.style.setProperty("--font-scale", state.fontScale);
  document.querySelectorAll("#theme-seg .seg-btn").forEach(btn=>{
    btn.classList.toggle("active", btn.dataset.themeChoice === (state.darkMode ? "dark" : "light"));
  });
  document.getElementById("btn-theme-toggle").textContent = state.darkMode ? "☀️" : "🌙";
  document.getElementById("font-size-label").textContent = Math.round(state.fontScale*100)+"%";
  document.getElementById("nickname-input").value = state.nickname;
  document.getElementById("bible-translation").value = state.translation;
  document.getElementById("plan-start").value = state.planStart;
  document.getElementById("today-video-input").value = state.todayVideoUrl;
  document.getElementById("playlist-input").value = state.playlistId;
  document.getElementById("youtube-apikey-input").value = state.youtubeApiKey;
}
function setDarkMode(on){
  state.darkMode = on; LS.set("darkMode", state.darkMode); applySettings();
}
document.querySelectorAll("#theme-seg .seg-btn").forEach(btn=>{
  btn.addEventListener("click", ()=> setDarkMode(btn.dataset.themeChoice === "dark"));
});
document.getElementById("btn-theme-toggle").addEventListener("click", ()=> setDarkMode(!state.darkMode));
document.getElementById("today-video-save").addEventListener("click", ()=>{
  saveTodayVideo(document.getElementById("today-video-input").value.trim());
  toast("오늘의 영상 링크를 저장했습니다");
});
document.getElementById("playlist-save").addEventListener("click", ()=>{
  const raw = document.getElementById("playlist-input").value.trim();
  const id = parsePlaylistId(raw);
  const statusEl = document.getElementById("playlist-status");
  if(raw && !id){ statusEl.textContent = "❌ 재생목록 링크에서 ID를 찾지 못했습니다. list= 뒤의 값을 확인해주세요."; return; }
  state.playlistId = id || "";
  state.youtubeApiKey = document.getElementById("youtube-apikey-input").value.trim();
  LS.set("playlistId", state.playlistId);
  LS.set("youtubeApiKey", state.youtubeApiKey);
  if(!state.playlistId || !state.youtubeApiKey){
    statusEl.textContent = "재생목록 ID와 API 키를 모두 입력해야 자동 연동이 켜집니다.";
    return;
  }
  autoFetchTodayVideo(true);
});
document.getElementById("font-plus").addEventListener("click", ()=>{
  state.fontScale = Math.min(1.4, +(state.fontScale+0.1).toFixed(2)); LS.set("fontScale", state.fontScale); applySettings();
});
document.getElementById("font-minus").addEventListener("click", ()=>{
  state.fontScale = Math.max(0.8, +(state.fontScale-0.1).toFixed(2)); LS.set("fontScale", state.fontScale); applySettings();
});
document.getElementById("nickname-save").addEventListener("click", async ()=>{
  state.nickname = document.getElementById("nickname-input").value.trim() || "익명";
  LS.set("nickname", state.nickname);
  if(fb.ready){
    const {doc, setDoc} = fb.mod;
    await setDoc(doc(fb.db,"users",state.uid), { nickname: state.nickname, updatedAt: Date.now() }, {merge:true});
  }
  toast("닉네임을 저장했습니다");
});
document.getElementById("bible-source-save").addEventListener("click", async ()=>{
  state.translation = document.getElementById("bible-translation").value.trim() || "KRV";
  const newStart = document.getElementById("plan-start").value.trim();
  if(/^\d{4}-\d{2}-\d{2}$/.test(newStart)) state.planStart = newStart;
  LS.set("translation", state.translation);
  LS.set("planStart", state.planStart);
  if(fb.ready){
    const {doc, setDoc} = fb.mod;
    await setDoc(doc(fb.db,"config","plan"), { startDate: state.planStart }, {merge:true});
  }
  toast("저장했습니다. 오늘 화면을 새로고침합니다");
  renderToday();
});

/* ---------- 오늘의 읽기 ---------- */
function getPlanEntryForToday(){
  const idx = (currentPlanDay1based() - 1) % PLAN.length;
  return { idx, entry: PLAN[idx] };
}

let currentChapterVerses = [];
async function renderToday(){
  const dateISO = todayISO();
  setText("today-date", new Date().toLocaleDateString("ko-KR", {year:"numeric",month:"long",day:"numeric",weekday:"long"}));
  const {idx, entry} = getPlanEntryForToday();
  setText("today-daycount", `전체 성경 ${TOTAL_CHAPTERS}장 중 ${idx+1}번째 장 (${idx+1}일차)`);
  setText("today-ref", `${entry.book} ${entry.chapter}장`);
  document.getElementById("plan-progress-bar").style.width = Math.round(((idx+1)/TOTAL_CHAPTERS)*100)+"%";
  setText("plan-progress-label", `전체 성경 통독 진행률 ${((idx+1)/TOTAL_CHAPTERS*100).toFixed(1)}%`);
  renderVideoCard();

  const textEl = document.getElementById("today-text");
  const errEl = document.getElementById("today-error");
  errEl.style.display = "none";
  textEl.innerHTML = "본문을 불러오는 중입니다…";
  try{
    const verses = await BibleAPI.getChapter(state.translation, entry.bookIdx, entry.chapter);
    currentChapterVerses = verses.map(v=>({...v, bookIdx:entry.bookIdx, book:entry.book, chapter:entry.chapter}));
    renderVerses();
    state.chapterVerseCounts[dateISO] = currentChapterVerses.length;
    LS.set("chapterVerseCounts", state.chapterVerseCounts);
  }catch(err){
    console.error(err);
    textEl.innerHTML = "";
    errEl.style.display = "block";
    errEl.textContent = "성경 본문을 불러오지 못했습니다. 설정 > 성경 본문 소스에서 번역본 코드를 확인해주세요.";
    setText("api-debug", "마지막 오류: "+err.message);
  }

  renderMeditation(idx, dateISO);

  // 오늘 내 읽음 상태
  const mine = state.readDates[dateISO];
  setText("my-status-label", mine ? `오늘 ${mine} 로 표시함` : "아직 표시 안함");
  renderEmojiPicker(mine);

  const groupHint = document.getElementById("group-hint");
  if(!fb.ready){
    groupHint.style.display = "block";
    groupHint.textContent = "그룹원과 읽음 표시를 공유하려면 설정에서 Firebase 연동이 필요합니다.";
    document.getElementById("today-reactors").innerHTML = "";
  } else {
    groupHint.style.display = "none";
  }

  renderBookmarkHighlights();
}

function renderEmojiPicker(pickedEmoji){
  const wrap = document.getElementById("emoji-picker");
  wrap.innerHTML = "";
  const pickedInExtra = EMOJIS_EXTRA.includes(pickedEmoji);

  const makeBtn = (em) => {
    const b = document.createElement("button");
    b.className = "emoji-btn"+(em===pickedEmoji?" picked":"");
    b.textContent = em;
    b.addEventListener("click", async ()=>{
      await pushReaction(todayISO(), em);
      setText("my-status-label", `오늘 ${em} 로 표시함`);
      renderEmojiPicker(em);
      spawnConfetti();
      toast("읽음으로 표시했습니다");
    });
    return b;
  };

  // "+" 목록에서 고른 이모지는 맨 앞자리로 끌어와 매번 펼치지 않아도 바로 보이게 한다.
  const primaryToShow = pickedInExtra ? [pickedEmoji, ...EMOJIS_PRIMARY] : EMOJIS_PRIMARY;
  primaryToShow.forEach(em => wrap.appendChild(makeBtn(em)));

  const more = document.createElement("button");
  more.className = "emoji-btn emoji-more";
  more.setAttribute("aria-label", "이모지 더보기");
  wrap.appendChild(more);

  // extraRow는 wrap의 자식으로 둬서, 다음 렌더링 때 wrap.innerHTML="" 로
  // 함께 정리되도록 한다 (예전엔 형제 노드로 붙여서 재렌더링마다 쌓였음).
  const extraRow = document.createElement("div");
  extraRow.className = "emoji-row";
  extraRow.style.cssText = "width:100%;margin-top:8px;";
  extraRow.style.display = pickedInExtra ? "flex" : "none";
  const extraToShow = pickedInExtra ? EMOJIS_EXTRA.filter(em => em !== pickedEmoji) : EMOJIS_EXTRA;
  extraToShow.forEach(em => extraRow.appendChild(makeBtn(em)));
  wrap.appendChild(extraRow);

  more.textContent = extraRow.style.display === "none" ? "+" : "–";
  more.addEventListener("click", ()=>{
    const willOpen = extraRow.style.display === "none";
    extraRow.style.display = willOpen ? "flex" : "none";
    more.textContent = willOpen ? "–" : "+";
  });
}

/* 화면 정중앙에서 색종이가 사방으로 펑 터져 화면 전체를 채우는 축제 효과 */
function spawnConfetti(){
  const colors = ["#8b5cf6","#ff8fab","#ffd166","#06d6a0","#4cc9f0"];
  const emojis = ["🎉","✨","🎊","💜","⭐"];
  const cx = window.innerWidth/2, cy = window.innerHeight/2;
  const maxDist = Math.hypot(window.innerWidth, window.innerHeight)/2 + 60;
  const count = 110;
  for(let i=0;i<count;i++){
    const p = document.createElement("span");
    const useEmoji = Math.random() < 0.25;
    if(useEmoji){
      p.textContent = emojis[Math.floor(Math.random()*emojis.length)];
      p.style.cssText = `position:fixed;left:${cx}px;top:${cy}px;font-size:${16+Math.random()*14}px;
        pointer-events:none;z-index:9999;transform:translate(-50%,-50%);`;
    } else {
      const size = 6 + Math.random()*8;
      p.style.cssText = `position:fixed;left:${cx}px;top:${cy}px;width:${size}px;height:${size}px;
        background:${colors[i%colors.length]};border-radius:${Math.random()<0.5?"50%":"2px"};
        pointer-events:none;z-index:9999;transform:translate(-50%,-50%);`;
    }
    document.body.appendChild(p);
    const angle = Math.random()*Math.PI*2;
    const dist = maxDist*(0.4+Math.random()*0.6);
    const dx = Math.cos(angle)*dist, dy = Math.sin(angle)*dist;
    const rot = (Math.random()-0.5)*720;
    const duration = 1100 + Math.random()*700;
    const delay = Math.random()*120;
    p.animate([
      { transform: "translate(-50%,-50%) translate(0,0) rotate(0deg)", opacity: 1 },
      { transform: `translate(-50%,-50%) translate(${dx}px, ${dy}px) rotate(${rot}deg)`, opacity: 1, offset: 0.7 },
      { transform: `translate(-50%,-50%) translate(${dx}px, ${dy+140}px) rotate(${rot}deg)`, opacity: 0 }
    ], { duration, delay, easing: "cubic-bezier(.15,.6,.35,1)", fill: "forwards" })
      .onfinish = () => p.remove();
  }
}

function renderReactorList(list){
  const wrap = document.getElementById("today-reactors");
  wrap.innerHTML = "";
  if(list.length===0){ wrap.innerHTML = '<span class="muted">아직 아무도 표시하지 않았어요</span>'; return; }
  list.sort((a,b)=> (b.ts||0)-(a.ts||0));
  list.forEach(r=>{
    const chip = document.createElement("span");
    chip.className = "reactor-chip";
    chip.textContent = `${r.emoji} ${r.nickname||"익명"}`;
    wrap.appendChild(chip);
  });
}

function renderVerses(){
  const textEl = document.getElementById("today-text");
  textEl.innerHTML = "";
  const bmKeySet = new Set(state.bookmarks.map(b=>`${b.bookIdx}:${b.chapter}:${b.verse}`));
  currentChapterVerses.forEach(v=>{
    const div = document.createElement("div");
    const key = `${v.bookIdx}:${v.chapter}:${v.verse}`;
    div.className = "verse"+(bmKeySet.has(key)?" bookmarked":"");
    div.innerHTML = `<span class="vnum">${v.verse}</span>${escapeHtml(v.text)}`;
    div.addEventListener("click", ()=> openNoteDialog(v));
    textEl.appendChild(div);
  });
}
function renderBookmarkHighlights(){ /* renderVerses 안에서 처리됨: 자리표시자 유지 */ }

function escapeHtml(s){
  return (s||"").replace(/[&<>"']/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}

/* ---------- 북마크 ---------- */
const noteDialog = document.getElementById("note-dialog");
let pendingVerse = null;
function openNoteDialog(v){
  pendingVerse = v;
  const existing = state.bookmarks.find(b=> b.bookIdx===v.bookIdx && b.chapter===v.chapter && b.verse===v.verse);
  document.getElementById("note-dialog-ref").textContent = `${v.book} ${v.chapter}:${v.verse}`;
  document.getElementById("note-input").value = existing ? existing.note : "";
  document.getElementById("note-save").textContent = existing ? "메모 수정" : "북마크 저장";
  noteDialog.showModal();
}
document.getElementById("note-cancel").addEventListener("click", ()=> noteDialog.close());
document.getElementById("note-close").addEventListener("click", ()=> noteDialog.close());
noteDialog.addEventListener("click", (e)=>{ if(e.target === noteDialog) noteDialog.close(); });
document.getElementById("note-save").addEventListener("click", ()=>{
  if(!pendingVerse) return;
  const note = document.getElementById("note-input").value;
  const key = b => b.bookIdx===pendingVerse.bookIdx && b.chapter===pendingVerse.chapter && b.verse===pendingVerse.verse;
  const existingIdx = state.bookmarks.findIndex(key);
  const item = {
    bookIdx: pendingVerse.bookIdx, book: pendingVerse.book, chapter: pendingVerse.chapter,
    verse: pendingVerse.verse, text: pendingVerse.text, note, ts: Date.now()
  };
  if(existingIdx>=0) state.bookmarks[existingIdx] = item; else state.bookmarks.push(item);
  LS.set("bookmarks", state.bookmarks);
  noteDialog.close();
  renderVerses();
  toast("북마크에 저장했습니다");
});

let bookmarkView = "active";
document.getElementById("bm-view-active").addEventListener("click", ()=> switchBookmarkView("active"));
document.getElementById("bm-view-meditation").addEventListener("click", ()=> switchBookmarkView("meditation"));
document.getElementById("bm-view-trash").addEventListener("click", ()=> switchBookmarkView("trash"));
function switchBookmarkView(view){
  bookmarkView = view;
  document.getElementById("bm-view-active").className = "btn small" + (view==="active" ? "" : " ghost");
  document.getElementById("bm-view-meditation").className = "btn small" + (view==="meditation" ? "" : " ghost");
  document.getElementById("bm-view-trash").className = "btn small" + (view==="trash" ? "" : " ghost");
  renderBookmarks();
}

function renderMeditationList(){
  const wrap = document.getElementById("bookmark-list");
  const dates = Object.keys(state.meditationNotes).filter(d=> state.meditationNotes[d].trim()).sort().reverse();
  if(dates.length===0){
    wrap.innerHTML = '<div class="empty">저장된 묵상노트가 없습니다.<br>오늘 탭에서 묵상노트를 남겨보세요.</div>';
    return;
  }
  wrap.innerHTML = "";
  dates.forEach(date=>{
    const div = document.createElement("div");
    div.className = "bookmark-item";
    div.innerHTML = `
      <span class="ref">${date}</span>
      <div class="note" style="margin-top:4px;">${escapeHtml(state.meditationNotes[date])}</div>
      <div class="row" style="margin-top:10px;gap:8px;">
        <button class="btn ghost small" data-med-del="${date}">🗑️ 삭제</button>
      </div>
    `;
    wrap.appendChild(div);
  });
  wrap.querySelectorAll("[data-med-del]").forEach(btn=>{
    btn.addEventListener("click", async ()=>{
      const date = btn.dataset.medDel;
      state.deletedMeditationNotes[date] = { text: state.meditationNotes[date], deletedAt: Date.now() };
      LS.set("deletedMeditationNotes", state.deletedMeditationNotes);
      await saveMeditationNote(date, "");
      if(date === todayISO()) renderMeditation(currentPlanDay1based(), todayISO());
      renderMeditationList();
      toast("삭제됨 탭으로 옮겼습니다");
    });
  });
}

function renderBookmarks(){
  if(bookmarkView === "meditation"){ renderMeditationList(); return; }
  if(bookmarkView === "trash"){ renderTrash(); return; }

  const wrap = document.getElementById("bookmark-list");
  const list = state.bookmarks;
  if(list.length===0){
    wrap.innerHTML = '<div class="empty">저장된 북마크가 없습니다.<br>오늘 본문에서 구절을 눌러 북마크를 남겨보세요.</div>';
    return;
  }
  wrap.innerHTML = "";
  [...list].sort((a,b)=>b.ts-a.ts).forEach(b=>{
    const key = `${b.bookIdx}:${b.chapter}:${b.verse}`;
    const div = document.createElement("div");
    div.className = "bookmark-item";
    div.innerHTML = `
      <span class="ref">${b.book} ${b.chapter}:${b.verse}</span>
      <div class="muted" style="margin-top:4px;">${escapeHtml(b.text)}</div>
      ${b.note ? `<div class="note">${escapeHtml(b.note)}</div>` : ""}
      <div class="row" style="margin-top:10px;gap:8px;"><button class="btn ghost small" data-del="${key}">🗑️ 삭제</button></div>
    `;
    wrap.appendChild(div);
  });
  wrap.querySelectorAll("[data-del]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const [bookIdx,chapter,verse] = btn.dataset.del.split(":").map(Number);
      const idx = state.bookmarks.findIndex(b=> b.bookIdx===bookIdx && b.chapter===chapter && b.verse===verse);
      if(idx<0) return;
      const [removed] = state.bookmarks.splice(idx,1);
      removed.deletedAt = Date.now();
      state.deletedBookmarks.push(removed);
      LS.set("bookmarks", state.bookmarks);
      LS.set("deletedBookmarks", state.deletedBookmarks);
      renderBookmarks();
      renderVerses();
      toast("삭제됨 탭으로 옮겼습니다");
    });
  });
}

/* 북마크 휴지통 + 묵상노트 휴지통을 한 화면에서 함께 보여준다 */
function renderTrash(){
  const wrap = document.getElementById("bookmark-list");
  const bookmarkItems = state.deletedBookmarks.map(b=> ({ type:"bookmark", key:`${b.bookIdx}:${b.chapter}:${b.verse}`, deletedAt:b.deletedAt, data:b }));
  const meditationItems = Object.entries(state.deletedMeditationNotes).map(([date,info])=> ({ type:"meditation", key:date, deletedAt:info.deletedAt, data:{date, text:info.text} }));
  const items = [...bookmarkItems, ...meditationItems].sort((a,b)=> b.deletedAt-a.deletedAt);

  if(items.length===0){
    wrap.innerHTML = '<div class="empty">삭제된 항목이 없습니다.</div>';
    return;
  }
  wrap.innerHTML = "";
  items.forEach(item=>{
    const div = document.createElement("div");
    div.className = "bookmark-item";
    if(item.type === "bookmark"){
      const b = item.data;
      div.innerHTML = `
        <span class="ref">🔖 ${b.book} ${b.chapter}:${b.verse}</span>
        <div class="muted" style="margin-top:4px;">${escapeHtml(b.text)}</div>
        ${b.note ? `<div class="note">${escapeHtml(b.note)}</div>` : ""}
        <div class="row" style="margin-top:10px;gap:8px;">
          <button class="btn ghost small" data-restore-bm="${item.key}">↩️ 북마크하기</button>
          <button class="btn ghost small" data-purge-bm="${item.key}">🗑️ 영구삭제</button>
        </div>`;
    } else {
      div.innerHTML = `
        <span class="ref">🌱 ${item.data.date}</span>
        <div class="note" style="margin-top:4px;">${escapeHtml(item.data.text)}</div>
        <div class="row" style="margin-top:10px;gap:8px;">
          <button class="btn ghost small" data-restore-med="${item.key}">↩️ 묵상노트로 복원</button>
          <button class="btn ghost small" data-purge-med="${item.key}">🗑️ 영구삭제</button>
        </div>`;
    }
    wrap.appendChild(div);
  });

  wrap.querySelectorAll("[data-restore-bm]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const [bookIdx,chapter,verse] = btn.dataset.restoreBm.split(":").map(Number);
      const idx = state.deletedBookmarks.findIndex(b=> b.bookIdx===bookIdx && b.chapter===chapter && b.verse===verse);
      if(idx<0) return;
      const [restored] = state.deletedBookmarks.splice(idx,1);
      delete restored.deletedAt;
      state.bookmarks.push(restored);
      LS.set("bookmarks", state.bookmarks);
      LS.set("deletedBookmarks", state.deletedBookmarks);
      renderTrash();
      renderVerses();
      toast("북마크를 복원했습니다");
    });
  });
  wrap.querySelectorAll("[data-purge-bm]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const [bookIdx,chapter,verse] = btn.dataset.purgeBm.split(":").map(Number);
      state.deletedBookmarks = state.deletedBookmarks.filter(b=> !(b.bookIdx===bookIdx && b.chapter===chapter && b.verse===verse));
      LS.set("deletedBookmarks", state.deletedBookmarks);
      renderTrash();
      toast("완전히 삭제했습니다");
    });
  });
  wrap.querySelectorAll("[data-restore-med]").forEach(btn=>{
    btn.addEventListener("click", async ()=>{
      const date = btn.dataset.restoreMed;
      const info = state.deletedMeditationNotes[date];
      if(!info) return;
      delete state.deletedMeditationNotes[date];
      LS.set("deletedMeditationNotes", state.deletedMeditationNotes);
      await saveMeditationNote(date, info.text);
      if(date === todayISO()) renderMeditation(currentPlanDay1based(), todayISO());
      renderTrash();
      toast("묵상노트를 복원했습니다");
    });
  });
  wrap.querySelectorAll("[data-purge-med]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      delete state.deletedMeditationNotes[btn.dataset.purgeMed];
      LS.set("deletedMeditationNotes", state.deletedMeditationNotes);
      renderTrash();
      toast("완전히 삭제했습니다");
    });
  });
}

/* ---------- 통계 / 순위 ---------- */
function computeLocalStats(dates){
  const set = new Set(dates);
  const total = set.size;
  let streak = 0;
  let cursor = set.has(todayISO()) ? todayISO() : new Date(Date.now()-86400000).toISOString().slice(0,10);
  while(set.has(cursor)){ streak++; cursor = new Date(new Date(cursor)-86400000).toISOString().slice(0,10); }
  const now = new Date();
  const y=now.getFullYear(), m=now.getMonth();
  const daysElapsed = now.getDate();
  let inMonth = 0;
  set.forEach(d=>{ const dd=new Date(d); if(dd.getFullYear()===y && dd.getMonth()===m) inMonth++; });
  const monthPct = daysElapsed? Math.round((inMonth/daysElapsed)*100) : 0;
  return {total, streak, monthPct};
}

function getPlanDaysRange(){
  const total = currentPlanDay1based();
  const days = [];
  for(let i=1;i<=total;i++){
    const d = new Date(state.planStart+"T00:00:00");
    d.setDate(d.getDate() + (i-1));
    const dateISO = new Date(d - d.getTimezoneOffset()*60000).toISOString().slice(0,10);
    const entry = PLAN[(i-1) % PLAN.length];
    days.push({ day:i, date:dateISO, book:entry.book, chapter:entry.chapter });
  }
  return days;
}

let statDetailCache = { readDays:[], missedDays:[] };
function updateExtendedStats(){
  const days = getPlanDaysRange();
  const readSet = new Set(Object.keys(state.readDates));
  const readDays = days.filter(d=> readSet.has(d.date));
  const missedDays = days.filter(d=> !readSet.has(d.date));
  const versesTotal = readDays.reduce((sum,d)=> sum + (state.chapterVerseCounts[d.date]||0), 0);
  statDetailCache = { readDays, missedDays };
  setText("stat-verses", versesTotal);
  setText("stat-missed", missedDays.length);
}

const statDetailDialog = document.getElementById("stat-detail-dialog");
function openStatDetail(kind){
  const list = kind === "missed" ? statDetailCache.missedDays : statDetailCache.readDays;
  const title = kind === "missed" ? "놓친 말씀 목록" : (kind === "verses" ? "읽은 구절 상세" : "읽은 날짜 목록");
  setText("stat-detail-title", title);
  const wrap = document.getElementById("stat-detail-list");
  if(list.length===0){
    wrap.innerHTML = '<div class="empty">해당하는 기록이 없습니다.</div>';
  } else {
    wrap.innerHTML = "";
    [...list].reverse().forEach(d=>{
      const vcount = state.chapterVerseCounts[d.date];
      const row = document.createElement("div");
      row.className = "bookmark-item";
      row.innerHTML = `<span class="ref">${d.day}일차 · ${d.date}</span>
        <div class="muted" style="margin-top:4px;">${d.book} ${d.chapter}장${vcount?` · ${vcount}절`:""}</div>`;
      wrap.appendChild(row);
    });
  }
  statDetailDialog.showModal();
}
document.getElementById("stat-detail-close").addEventListener("click", ()=> statDetailDialog.close());
statDetailDialog.addEventListener("click",(e)=>{ if(e.target===statDetailDialog) statDetailDialog.close(); });
document.querySelectorAll(".stat-click").forEach(btn=>{
  btn.addEventListener("click", ()=> openStatDetail(btn.dataset.stat));
});

function renderRank(){
  const myLocalStats = computeLocalStats(Object.keys(state.readDates));
  setText("stat-total", myLocalStats.total);
  setText("stat-streak", myLocalStats.streak);
  setText("stat-month", myLocalStats.monthPct+"%");
  updateExtendedStats();
  const streakBadge = document.getElementById("header-streak");
  if(myLocalStats.streak > 0){
    streakBadge.style.display = "inline-block";
    streakBadge.textContent = `🔥 ${myLocalStats.streak}일 연속`;
  } else {
    streakBadge.style.display = "none";
  }

  const rankEmpty = document.getElementById("rank-empty");
  const rankTable = document.getElementById("rank-table");
  const thead = document.getElementById("rank-thead");
  if(!fb.ready){ rankEmpty.style.display="block"; rankTable.style.display="none"; return; }

  let rows;
  if(rankCategory === "meditation"){
    thead.innerHTML = "<tr><th>#</th><th>이름</th><th>작성한 묵상노트</th></tr>";
    rows = allMeditationCountsCache
      .map(m=> ({uid:m.uid, nickname:m.nickname, count:m.count||0}))
      .filter(r=> r.count>0)
      .sort((a,b)=> b.count-a.count);
  } else {
    thead.innerHTML = "<tr><th>#</th><th>이름</th><th>총 읽은 날</th><th>연속</th></tr>";
    const byUser = {};
    allReactionsCache.forEach(r=>{
      byUser[r.uid] = byUser[r.uid] || {nickname:r.nickname, dates:[]};
      byUser[r.uid].dates.push(r.date);
      byUser[r.uid].nickname = r.nickname || byUser[r.uid].nickname;
    });
    rows = Object.entries(byUser).map(([uid,info])=>{
      const st = computeLocalStats(info.dates);
      return {uid, nickname: info.nickname, total: st.total, streak: st.streak};
    }).sort((a,b)=> b.total-a.total || b.streak-a.streak);
  }

  if(rows.length===0){ rankEmpty.style.display="block"; rankTable.style.display="none"; return; }
  rankEmpty.style.display="none"; rankTable.style.display="table";
  const body = document.getElementById("rank-body");
  body.innerHTML = "";
  rows.forEach((r,i)=>{
    const tr = document.createElement("tr");
    if(r.uid===state.uid) tr.className="me";
    const nameCell = `${escapeHtml(r.nickname||"익명")}${r.uid===state.uid?" (나)":""}`;
    tr.innerHTML = rankCategory === "meditation"
      ? `<td class="num">${i+1}</td><td>${nameCell}</td><td>${r.count}</td>`
      : `<td class="num">${i+1}</td><td>${nameCell}</td><td>${r.total}</td><td>${r.streak}</td>`;
    body.appendChild(tr);
  });
}

let rankCategory = "read";
document.getElementById("rank-cat-read").addEventListener("click", ()=> switchRankCategory("read"));
document.getElementById("rank-cat-meditation").addEventListener("click", ()=> switchRankCategory("meditation"));
function switchRankCategory(cat){
  rankCategory = cat;
  document.getElementById("rank-cat-read").className = "btn small" + (cat==="read" ? "" : " ghost");
  document.getElementById("rank-cat-meditation").className = "btn small" + (cat==="meditation" ? "" : " ghost");
  renderRank();
}

/* ---------- 검색 ---------- */
document.getElementById("search-btn").addEventListener("click", doSearch);
document.getElementById("search-input").addEventListener("keydown", e=>{ if(e.key==="Enter") doSearch(); });
async function doSearch(){
  const q = document.getElementById("search-input").value.trim();
  const wrap = document.getElementById("search-results");
  if(!q){ wrap.innerHTML=""; return; }
  wrap.innerHTML = '<div class="empty">검색 중…</div>';
  try{
    const results = await BibleAPI.search(state.translation, q);
    if(results.length===0){ wrap.innerHTML = '<div class="empty">검색 결과가 없습니다.</div>'; return; }
    wrap.innerHTML = "";
    results.slice(0,50).forEach(r=>{
      const bookName = BOOKS[r.bookIdx] ? BOOKS[r.bookIdx][0] : `책${r.bookIdx+1}`;
      const div = document.createElement("div");
      div.className = "card";
      div.innerHTML = `<div class="passage-ref" style="font-size:1em;">${bookName} ${r.chapter}:${r.verse}</div>
        <div style="margin-top:4px;">${escapeHtml(r.text)}</div>`;
      wrap.appendChild(div);
    });
  }catch(err){
    console.error(err);
    wrap.innerHTML = `<div class="empty">검색에 실패했습니다. 설정에서 번역본 코드를 확인해주세요.<br><span style="font-size:.85em;">${escapeHtml(err.message)}</span></div>`;
  }
}

/* ---------- 검색 탭: 본문 검색 / 인물 검색 전환 ---------- */
document.querySelectorAll("#search-mode-seg .seg-btn").forEach(btn=>{
  btn.addEventListener("click", ()=>{
    const mode = btn.dataset.searchMode;
    document.querySelectorAll("#search-mode-seg .seg-btn").forEach(b=>{
      b.classList.toggle("active", b.dataset.searchMode === mode);
    });
    document.getElementById("search-mode-text").style.display = mode === "text" ? "block" : "none";
    document.getElementById("search-mode-people").style.display = mode === "people" ? "block" : "none";
  });
});
document.querySelector('#search-mode-seg .seg-btn[data-search-mode="text"]').classList.add("active");

/* ---------- 성경 인물 색인 ---------- */
let peopleFilterChar = null;
function renderPeopleFilters(){
  const wrap = document.getElementById("people-filter");
  const chars = [...new Set(PEOPLE.map(p=> chosung(p.name[0])).filter(Boolean))].sort();
  wrap.innerHTML = "";
  const allBtn = document.createElement("button");
  allBtn.className = "chosung-btn" + (peopleFilterChar===null ? " active" : "");
  allBtn.textContent = "전체";
  allBtn.addEventListener("click", ()=>{ peopleFilterChar = null; renderPeopleFilters(); renderPeopleList(); });
  wrap.appendChild(allBtn);
  chars.forEach(c=>{
    const b = document.createElement("button");
    b.className = "chosung-btn" + (peopleFilterChar===c ? " active" : "");
    b.textContent = c;
    b.addEventListener("click", ()=>{ peopleFilterChar = c; renderPeopleFilters(); renderPeopleList(); });
    wrap.appendChild(b);
  });
}

function renderPeopleList(){
  const q = document.getElementById("people-search").value.trim();
  const wrap = document.getElementById("people-list");
  let list = PEOPLE;
  if(peopleFilterChar) list = list.filter(p=> chosung(p.name[0]) === peopleFilterChar);
  if(q) list = list.filter(p=> p.name.includes(q) || p.summary.includes(q) || p.category.includes(q));
  if(list.length===0){ wrap.innerHTML = '<div class="card"><div class="empty">해당하는 인물이 없습니다.</div></div>'; return; }
  wrap.innerHTML = '<div class="card" id="people-rows"></div>';
  const rowsWrap = document.getElementById("people-rows");
  list.forEach(p=>{
    const row = document.createElement("div");
    row.className = "people-row";
    row.innerHTML = `<div class="mini-avatar" style="background:linear-gradient(135deg,${p.color[0]},${p.color[1]});">${p.icon}</div>
      <div><div style="font-weight:700;">${escapeHtml(p.name)}</div><div class="muted" style="font-size:.85em;">${escapeHtml(p.category)}</div></div>`;
    row.addEventListener("click", ()=> openPersonDetail(p));
    rowsWrap.appendChild(row);
  });
}
document.getElementById("people-search").addEventListener("input", renderPeopleList);

const personDialog = document.getElementById("person-dialog");
function openPersonDetail(p){
  const avatar = document.getElementById("person-avatar");
  avatar.style.background = `linear-gradient(135deg,${p.color[0]},${p.color[1]})`;
  avatar.textContent = p.icon;
  setText("person-name", p.name);
  setText("person-category", p.category);
  setText("person-summary", p.summary);
  setText("person-refs", "관련 본문: " + p.refs);
  personDialog.showModal();
}
document.getElementById("person-close").addEventListener("click", ()=> personDialog.close());
personDialog.addEventListener("click", (e)=>{ if(e.target === personDialog) personDialog.close(); });

renderPeopleFilters();
renderPeopleList();

/* ---------- 시작 ---------- */
applySettings();
renderToday();
renderRank();
initFirebase();
autoFetchTodayVideo(false);
