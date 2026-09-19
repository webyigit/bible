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

const EMOJIS = ["🙏","👍","❤️","😊","🔥"];

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
  translation: LS.get("translation", "GAE"),
  planStart: LS.get("planStart", null), // Firebase 있으면 원격 값으로 덮어씀
  readDates: LS.get("readDates", {}),   // { "2026-09-19": "🙏" } 로컬 개인 기록(오프라인 대비)
  bookmarks: LS.get("bookmarks", []),
};
if(!state.uid){ state.uid = "u_"+Math.random().toString(36).slice(2)+Date.now().toString(36); LS.set("uid", state.uid); }
if(!state.planStart){ state.planStart = todayISO(); LS.set("planStart", state.planStart); }

/* ---------- 성경 본문 API 어댑터 ----------
   기본값으로 bolls.life 공개 API 형식을 사용합니다 (다국어/한국어 번역본 지원, 무료, 키 불필요).
   이 세션 환경에서는 외부 네트워크 검증이 막혀 있어 번역본 코드(GAE)를 실제로 호출 확인하지
   못했습니다. 실패 시 화면과 설정 > 디버그에 원인을 표시하니, 다른 코드로 바꿔가며 테스트해보세요. */
const BibleAPI = {
  base: "https://bolls.life/api",
  async getChapter(translation, bookIdx, chapter){
    const bookId = bookIdx+1; // bolls.life 는 창세기=1 ... 요한계시록=66 순서를 사용
    const url = `${this.base}/get-text/${encodeURIComponent(translation)}/${bookId}/${chapter}/`;
    const res = await fetch(url);
    if(!res.ok) throw new Error(`HTTP ${res.status} — ${url}`);
    const data = await res.json();
    if(!Array.isArray(data) || data.length===0) throw new Error(`빈 응답 — ${url}`);
    return data.map(v => ({ verse: v.verse ?? v.pk ?? "", text: (v.text||"").replace(/<[^>]+>/g,"") }));
  },
  async search(translation, query){
    const url = `${this.base}/find/${encodeURIComponent(translation)}/?search=${encodeURIComponent(query)}&match_case=false&match_whole=false`;
    const res = await fetch(url);
    if(!res.ok) throw new Error(`HTTP ${res.status} — ${url}`);
    const data = await res.json();
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
  }catch(err){
    console.error("Firebase 초기화 실패", err);
    setText("firebase-status", "Firebase 연결 실패: "+err.message+" (로컬 전용 모드로 계속)");
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
document.getElementById("btn-goto-settings").addEventListener("click", ()=>{
  document.querySelector('nav.bottom .nav-btn[data-tab="tab-settings"]').click();
});

/* ---------- 설정 적용 ---------- */
function applySettings(){
  document.body.dataset.theme = state.darkMode ? "dark" : "light";
  document.documentElement.style.setProperty("--font-scale", state.fontScale);
  document.getElementById("toggle-dark").checked = state.darkMode;
  document.getElementById("font-size-label").textContent = Math.round(state.fontScale*100)+"%";
  document.getElementById("nickname-input").value = state.nickname;
  document.getElementById("bible-translation").value = state.translation;
  document.getElementById("plan-start").value = state.planStart;
}
document.getElementById("toggle-dark").addEventListener("change", e=>{
  state.darkMode = e.target.checked; LS.set("darkMode", state.darkMode); applySettings();
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
  state.translation = document.getElementById("bible-translation").value.trim() || "GAE";
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
  const idx = ((daysBetween(state.planStart, todayISO()) % PLAN.length) + PLAN.length) % PLAN.length;
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
  EMOJIS.forEach(em=>{
    const b = document.createElement("button");
    b.className = "emoji-btn"+(em===pickedEmoji?" picked":"");
    b.textContent = em;
    b.addEventListener("click", async ()=>{
      await pushReaction(todayISO(), em);
      setText("my-status-label", `오늘 ${em} 로 표시함`);
      renderEmojiPicker(em);
      toast("읽음으로 표시했습니다");
    });
    wrap.appendChild(b);
  });
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

function renderBookmarks(){
  const wrap = document.getElementById("bookmark-list");
  if(state.bookmarks.length===0){
    wrap.innerHTML = '<div class="empty">저장된 북마크가 없습니다.<br>오늘 본문에서 구절을 눌러 북마크를 남겨보세요.</div>';
    return;
  }
  wrap.innerHTML = "";
  [...state.bookmarks].sort((a,b)=>b.ts-a.ts).forEach(b=>{
    const div = document.createElement("div");
    div.className = "bookmark-item";
    div.innerHTML = `
      <div class="row between">
        <span class="ref">${b.book} ${b.chapter}:${b.verse}</span>
        <button class="btn ghost small" data-del="${b.bookIdx}:${b.chapter}:${b.verse}">삭제</button>
      </div>
      <div class="muted" style="margin-top:4px;">${escapeHtml(b.text)}</div>
      ${b.note ? `<div class="note">${escapeHtml(b.note)}</div>` : ""}
    `;
    wrap.appendChild(div);
  });
  wrap.querySelectorAll("[data-del]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const [bookIdx,chapter,verse] = btn.dataset.del.split(":").map(Number);
      state.bookmarks = state.bookmarks.filter(b=> !(b.bookIdx===bookIdx && b.chapter===chapter && b.verse===verse));
      LS.set("bookmarks", state.bookmarks);
      renderBookmarks();
      renderVerses();
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
