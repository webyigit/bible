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

const EMOJIS_PRIMARY = ["🙏","👍","❤️","😊","🔥"];
const EMOJIS_EXTRA = ["😭","🥹","💪","🙌","✨","📖","🕊️","💖","😇","👏","🎉","🌿"];
const EMOJIS = [...EMOJIS_PRIMARY, ...EMOJIS_EXTRA]; // 배지 등 "이미 고른 이모지인지" 판별용

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
  // bolls.life가 CORS를 막아 직접 fetch가 실패하면(주로 "Failed to fetch") 공개 CORS
  // 프록시를 한 번 더 시도한다. 둘 다 실패하면 마지막 오류를 그대로 올려서 화면/디버그에 보여준다.
  async _fetchJson(url){
    try{
      const res = await fetch(url);
      if(!res.ok) throw new Error(`HTTP ${res.status} — ${url}`);
      return await res.json();
    }catch(directErr){
      try{
        const proxied = `https://corsproxy.io/?url=${encodeURIComponent(url)}`;
        const res2 = await fetch(proxied);
        if(!res2.ok) throw new Error(`HTTP ${res2.status} (프록시 경유) — ${url}`);
        return await res2.json();
      }catch(proxyErr){
        throw new Error(`직접 호출 실패(${directErr.message}) / 프록시 경유도 실패(${proxyErr.message})`);
      }
    }
  },
  async getChapter(translation, bookIdx, chapter){
    const bookId = bookIdx+1; // bolls.life 는 창세기=1 ... 요한계시록=66 순서를 사용
    const url = `https://bolls.life/get-text/${encodeURIComponent(translation)}/${bookId}/${chapter}/`;
    const data = await this._fetchJson(url);
    if(!Array.isArray(data) || data.length===0) throw new Error(`빈 응답 — ${url}`);
    return data.map(v => ({ verse: v.verse ?? v.pk ?? "", text: (v.text||"").replace(/<[^>]+>/g,"") }));
  },
  async search(translation, query){
    const url = `https://bolls.life/v2/find/${encodeURIComponent(translation)}?search=${encodeURIComponent(query)}&match_case=false&match_whole=false`;
    const data = await this._fetchJson(url);
    const list = Array.isArray(data) ? data : (data.results||[]);
    return list.map(v => ({
      bookIdx: (v.book ?? v.book_id ?? 1)-1,
      chapter: v.chapter, verse: v.verse,
      text: (v.text||"").replace(/<[^>]+>/g,"")
    }));
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
  document.getElementById("toggle-dark").checked = state.darkMode;
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
document.getElementById("toggle-dark").addEventListener("change", e=> setDarkMode(e.target.checked));
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
  setText("today-daycount", `읽기 ${idx+1}/${TOTAL_CHAPTERS}일차`);
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
  }catch(err){
    console.error(err);
    textEl.innerHTML = "";
    errEl.style.display = "block";
    errEl.textContent = "성경 본문을 불러오지 못했습니다. 설정 > 성경 본문 소스에서 번역본 코드를 확인해주세요.";
    setText("api-debug", "마지막 오류: "+err.message);
  }

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

  EMOJIS_PRIMARY.forEach(em => wrap.appendChild(makeBtn(em)));

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
  EMOJIS_EXTRA.forEach(em => extraRow.appendChild(makeBtn(em)));
  wrap.appendChild(extraRow);

  more.textContent = extraRow.style.display === "none" ? "+" : "–";
  more.addEventListener("click", ()=>{
    const willOpen = extraRow.style.display === "none";
    extraRow.style.display = willOpen ? "flex" : "none";
    more.textContent = willOpen ? "–" : "+";
  });
}

/* 화면 전체에 색종이가 비처럼 쏟아지는 축제 효과 */
function spawnConfetti(){
  const colors = ["#8b5cf6","#ff8fab","#ffd166","#06d6a0","#4cc9f0"];
  const emojis = ["🎉","✨","🎊","💜","⭐"];
  const count = 90;
  for(let i=0;i<count;i++){
    const p = document.createElement("span");
    const startX = Math.random()*window.innerWidth;
    const delay = Math.random()*350;
    const useEmoji = Math.random() < 0.25;
    if(useEmoji){
      p.textContent = emojis[Math.floor(Math.random()*emojis.length)];
      p.style.cssText = `position:fixed;left:${startX}px;top:-30px;font-size:${16+Math.random()*14}px;
        pointer-events:none;z-index:9999;`;
    } else {
      const size = 6 + Math.random()*8;
      p.style.cssText = `position:fixed;left:${startX}px;top:-20px;width:${size}px;height:${size}px;
        background:${colors[i%colors.length]};border-radius:${Math.random()<0.5?"50%":"2px"};
        pointer-events:none;z-index:9999;`;
    }
    document.body.appendChild(p);
    const fallDist = window.innerHeight + 60;
    const drift = (Math.random()-0.5)*180;
    const rot = (Math.random()-0.5)*720;
    const duration = 1400 + Math.random()*900;
    p.animate([
      { transform: "translate(0,0) rotate(0deg)", opacity: 1 },
      { transform: `translate(${drift}px, ${fallDist}px) rotate(${rot}deg)`, opacity: 1, offset: 0.85 },
      { transform: `translate(${drift}px, ${fallDist+20}px) rotate(${rot}deg)`, opacity: 0 }
    ], { duration, delay, easing: "cubic-bezier(.15,.5,.35,1)", fill: "forwards" })
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
document.getElementById("bm-view-trash").addEventListener("click", ()=> switchBookmarkView("trash"));
function switchBookmarkView(view){
  bookmarkView = view;
  document.getElementById("bm-view-active").className = "btn small" + (view==="active" ? "" : " ghost");
  document.getElementById("bm-view-trash").className = "btn small" + (view==="trash" ? "" : " ghost");
  renderBookmarks();
}

function renderBookmarks(){
  const wrap = document.getElementById("bookmark-list");
  const list = bookmarkView === "trash" ? state.deletedBookmarks : state.bookmarks;

  if(list.length===0){
    wrap.innerHTML = bookmarkView === "trash"
      ? '<div class="empty">삭제된 북마크가 없습니다.</div>'
      : '<div class="empty">저장된 북마크가 없습니다.<br>오늘 본문에서 구절을 눌러 북마크를 남겨보세요.</div>';
    return;
  }

  wrap.innerHTML = "";
  const sortKey = bookmarkView === "trash" ? "deletedAt" : "ts";
  [...list].sort((a,b)=>b[sortKey]-a[sortKey]).forEach(b=>{
    const key = `${b.bookIdx}:${b.chapter}:${b.verse}`;
    const div = document.createElement("div");
    div.className = "bookmark-item";
    const actionBtn = bookmarkView === "trash"
      ? `<button class="btn ghost small icon-only" data-restore="${key}" aria-label="복원" title="복원">↩️</button>
         <button class="btn ghost small icon-only" data-purge="${key}" aria-label="완전 삭제" title="완전 삭제">🗑️</button>`
      : `<button class="btn ghost small icon-only" data-del="${key}" aria-label="삭제" title="삭제">🗑️</button>`;
    div.innerHTML = `
      <div class="row between">
        <span class="ref">${b.book} ${b.chapter}:${b.verse}</span>
        <span class="row" style="gap:4px;">${actionBtn}</span>
      </div>
      <div class="muted" style="margin-top:4px;">${escapeHtml(b.text)}</div>
      ${b.note ? `<div class="note">${escapeHtml(b.note)}</div>` : ""}
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
  wrap.querySelectorAll("[data-restore]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const [bookIdx,chapter,verse] = btn.dataset.restore.split(":").map(Number);
      const idx = state.deletedBookmarks.findIndex(b=> b.bookIdx===bookIdx && b.chapter===chapter && b.verse===verse);
      if(idx<0) return;
      const [restored] = state.deletedBookmarks.splice(idx,1);
      delete restored.deletedAt;
      state.bookmarks.push(restored);
      LS.set("bookmarks", state.bookmarks);
      LS.set("deletedBookmarks", state.deletedBookmarks);
      renderBookmarks();
      renderVerses();
      toast("북마크를 복원했습니다");
    });
  });
  wrap.querySelectorAll("[data-purge]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const [bookIdx,chapter,verse] = btn.dataset.purge.split(":").map(Number);
      state.deletedBookmarks = state.deletedBookmarks.filter(b=> !(b.bookIdx===bookIdx && b.chapter===chapter && b.verse===verse));
      LS.set("deletedBookmarks", state.deletedBookmarks);
      renderBookmarks();
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

function renderRank(){
  const myLocalStats = computeLocalStats(Object.keys(state.readDates));
  setText("stat-total", myLocalStats.total);
  setText("stat-streak", myLocalStats.streak);
  setText("stat-month", myLocalStats.monthPct+"%");
  const streakBadge = document.getElementById("header-streak");
  if(myLocalStats.streak > 0){
    streakBadge.style.display = "inline-block";
    streakBadge.textContent = `🔥 ${myLocalStats.streak}일 연속`;
  } else {
    streakBadge.style.display = "none";
  }

  const rankEmpty = document.getElementById("rank-empty");
  const rankTable = document.getElementById("rank-table");
  if(!fb.ready){ rankEmpty.style.display="block"; rankTable.style.display="none"; return; }

  const byUser = {};
  allReactionsCache.forEach(r=>{
    byUser[r.uid] = byUser[r.uid] || {nickname:r.nickname, dates:[]};
    byUser[r.uid].dates.push(r.date);
    byUser[r.uid].nickname = r.nickname || byUser[r.uid].nickname;
  });
  const rows = Object.entries(byUser).map(([uid,info])=>{
    const st = computeLocalStats(info.dates);
    return {uid, nickname: info.nickname, total: st.total, streak: st.streak};
  }).sort((a,b)=> b.total-a.total || b.streak-a.streak);

  if(rows.length===0){ rankEmpty.style.display="block"; rankTable.style.display="none"; return; }
  rankEmpty.style.display="none"; rankTable.style.display="table";
  const body = document.getElementById("rank-body");
  body.innerHTML = "";
  rows.forEach((r,i)=>{
    const tr = document.createElement("tr");
    if(r.uid===state.uid) tr.className="me";
    tr.innerHTML = `<td class="num">${i+1}</td><td>${escapeHtml(r.nickname||"익명")}${r.uid===state.uid?" (나)":""}</td><td>${r.total}</td><td>${r.streak}</td>`;
    body.appendChild(tr);
  });
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

/* ---------- 시작 ---------- */
applySettings();
renderToday();
renderRank();
initFirebase();
autoFetchTodayVideo(false);
