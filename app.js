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

/* 검색 결과 구절마다 붙일 적용/묵상 질문 — 특정 구절 해석을 단정하지 않고
   누구나 자기 상황에 비춰 스스로 답해보는 범용 질문이라 어떤 구절에
   붙여도 안전하다(MEDITATION_PROMPTS와 같은 원칙). 구절 번호를 기준으로
   결정론적으로 골라서, 같은 구절은 다시 봐도 같은 질문이 붙는다. */
const VERSE_APPLICATION_PROMPTS = [
  "이 말씀을 오늘 하루 어떻게 적용해볼 수 있을까요?",
  "이 구절에서 하나님의 성품 중 무엇이 보이나요?",
  "이 말씀이 나에게 주는 위로나 도전은 무엇인가요?",
  "이 구절을 읽고 떠오르는 기도 제목이 있다면 무엇인가요?",
  "이 말씀대로 산다면 오늘 나는 무엇을 다르게 할 수 있을까요?",
  "이 구절 속에서 나와 비슷한 상황이나 감정을 발견했나요?",
  "이 말씀을 누군가와 나눈다면 어떤 이야기를 하고 싶나요?",
  "이 구절에서 순종해야 할 부분이 있다면 무엇일까요?",
  "이 말씀은 어떤 약속이나 소망을 담고 있나요?",
  "이 구절을 통해 돌이키거나 회개할 부분이 있나요?",
  "이 말씀 속에서 감사할 이유를 찾는다면 무엇인가요?",
  "이 구절이 지금 내 삶의 어떤 부분과 맞닿아 있나요?",
];
function pickApplicationPrompt(bookIdx, chapter, verse){
  const idx = (bookIdx*10007 + chapter*101 + verse) % VERSE_APPLICATION_PROMPTS.length;
  return VERSE_APPLICATION_PROMPTS[idx];
}

/* 질문만으로는 막막할 수 있어, 참고할 만한 생각 한 조각과 실천 항목을
   덧붙인다. 구절에 특정 주제어가 실제로 들어있으면 그 주제에 맞는 것을
   쓰고(본문에 진짜 있는 단어에 근거하므로 지어낸 해석이 아니다), 없으면
   구절 번호로 결정론적으로 고른 범용 항목을 쓴다. 어느 쪽이든 "이 구절의
   정답"이 아니라 하나의 예시로만 제시한다. */
const THEME_APPLICATIONS = [
  {keyword:"사랑", thought:"이 말씀에는 '사랑'이라는 주제가 담겨 있어요. 오늘 그 사랑을 누구에게 흘려보낼 수 있을지 생각해보세요.", action:"오늘 만나는 사람 한 명에게 작은 친절이나 사랑을 표현해보세요."},
  {keyword:"감사", thought:"이 구절은 감사할 이유를 떠올리게 합니다.", action:"오늘 감사한 일 세 가지를 적어보세요."},
  {keyword:"기도", thought:"이 말씀은 기도로 이어질 수 있는 구절이에요.", action:"지금 잠깐 이 말씀을 붙들고 짧게 기도해보세요."},
  {keyword:"용서", thought:"이 구절은 용서에 대해 생각해보게 합니다.", action:"마음에 담아둔 사람이 있다면 오늘 용서하기로 결단해보세요."},
  {keyword:"순종", thought:"이 말씀은 순종이라는 주제를 담고 있어요.", action:"미뤄왔던 일 중 오늘 하나만 실천해보세요."},
  {keyword:"인내", thought:"이 구절은 인내를 이야기합니다.", action:"오늘 참기 힘든 상황이 오면 이 말씀을 떠올려보세요."},
  {keyword:"믿음", thought:"이 말씀은 믿음에 대해 다시 생각하게 합니다.", action:"지금 믿음이 필요한 상황 하나를 떠올리고 이 말씀을 붙들어보세요."},
  {keyword:"소망", thought:"이 구절은 소망을 담고 있어요.", action:"지금 힘든 상황이 있다면 이 말씀에서 소망을 찾아보세요."},
  {keyword:"겸손", thought:"이 말씀은 겸손에 대해 생각해보게 합니다.", action:"오늘 누군가를 나보다 낫게 여기는 태도를 한 번 실천해보세요."},
  {keyword:"평안", thought:"이 구절은 평안에 대한 말씀이에요.", action:"지금 마음이 어지럽다면 잠시 멈춰 이 말씀으로 숨을 고르세요."},
  {keyword:"회개", thought:"이 말씀은 돌이킴(회개)을 이야기합니다.", action:"오늘 하나님 앞에 솔직히 돌아볼 부분이 있다면 짧게 기도로 아뢰어보세요."},
  {keyword:"지혜", thought:"이 구절은 지혜를 구하게 합니다.", action:"오늘 결정할 일이 있다면 이 말씀을 떠올리며 지혜를 구해보세요."},
  {keyword:"기쁨", thought:"이 말씀은 기쁨에 대해 이야기합니다.", action:"오늘 작은 기쁨 하나를 찾아 감사해보세요."},
  {keyword:"두려움", thought:"이 구절은 두려움을 다루고 있어요.", action:"지금 두려운 일이 있다면 이 말씀을 붙들고 마음을 내려놓아보세요."},
];
const GENERIC_THOUGHTS = [
  "이 말씀을 천천히 다시 한 번 읽어보세요.",
  "이 구절에서 나에게 와닿는 단어 하나를 골라보세요.",
  "이 말씀이 쓰인 앞뒤 상황을 함께 찾아 읽어보면 더 잘 이해될 수 있어요.",
  "이 구절을 나만의 말로 바꿔 표현해보세요.",
];
const GENERIC_ACTIONS = [
  "이 구절을 소리 내어 한 번 더 읽어보세요.",
  "이 말씀을 손글씨로 옮겨 적어보세요.",
  "이 구절과 관련해 짧게 기도해보세요.",
  "이 말씀을 오늘 만나는 사람과 나눠보세요.",
  "이 구절을 오늘 하루 동안 마음에 품고 지내보세요.",
];
function pickThemeOrGeneric(text, bookIdx, chapter, verse){
  const theme = THEME_APPLICATIONS.find(t=> text.includes(t.keyword));
  if(theme) return theme;
  const idx = bookIdx*10007 + chapter*101 + verse;
  return {
    thought: GENERIC_THOUGHTS[idx % GENERIC_THOUGHTS.length],
    action: GENERIC_ACTIONS[(idx+2) % GENERIC_ACTIONS.length]
  };
}

/* 검색 결과가 없을 때 대신 추천할 어휘 — 성경에 실제로 자주 나오는 단어 위주로,
   검색해도 결과가 있을 만한 것만 골랐다. 사용자가 입력한 검색어와 이 목록을
   비교해(findSimilarTerms) 가장 가까운 것을 추천한다. */
const POPULAR_SEARCH_TERMS = [
  "사랑","믿음","소망","감사","기도","용서","지혜","평안","구원","인내",
  "겸손","순종","은혜","진리","빛","생명","평강","자비","긍휼","의",
  "정의","거룩","성령","부활","영생","천국","죄","회개","십자가","언약",
  "예언","기적","치유","축복","심판","두려움","담대함","충성","화평","기쁨",
  "슬픔","고난","시험","유혹","경외","찬양","경배","안식","목자","양",
  "씨앗","열매","빛과소금","소금","말씀","약속","순종","섬김","제자","전도"
];

/* 두 문자열 사이의 편집 거리(레벤슈타인 거리) — 오타·비슷한 단어 추천에 사용 */
function levenshtein(a, b){
  const m = a.length, n = b.length;
  const dp = Array.from({length: m+1}, ()=> new Array(n+1).fill(0));
  for(let i=0;i<=m;i++) dp[i][0] = i;
  for(let j=0;j<=n;j++) dp[0][j] = j;
  for(let i=1;i<=m;i++){
    for(let j=1;j<=n;j++){
      dp[i][j] = a[i-1]===b[j-1] ? dp[i-1][j-1] : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]);
    }
  }
  return dp[m][n];
}

/* 사용자가 입력한 검색어와 가장 가까운 어휘를 골라 추천한다 —
   서로 포함 관계면 우선하고, 그다음은 편집 거리가 가까운 순.
   words는 실제 성경 본문에서 뽑은 어휘(있으면)이고, 없으면 큐레이션한
   일반 단어 목록으로 대신한다. */
function findSimilarTerms(query, n=6, words=POPULAR_SEARCH_TERMS){
  const scored = words.map(w=>{
    const contains = w.includes(query) || query.includes(w);
    return { w, dist: levenshtein(query, w), contains };
  });
  scored.sort((a,b)=> (a.contains!==b.contains) ? (a.contains?-1:1) : a.dist-b.dist);
  const closest = scored[0];
  const isCloseMatch = closest && (closest.contains || closest.dist <= Math.max(1, Math.ceil(query.length*0.5)));
  return { terms: scored.slice(0,n).map(s=>s.w), isCloseMatch };
}

/* ---------- 성경 인물 색인 ----------
   구약·신약을 통틀어 잘 알려진 인물 위주로 뽑았다. 소개글은 여러 성경 인물 사전에서
   공통으로 확인되는 사실(생애의 핵심 사건, 예수와의 직접적 관계나 족보상의 연결)만
   담았고, 특정 교단의 해석이나 논쟁적인 신학적 주장은 넣지 않았다. 예수와의 연결은
   본문에 명시된 경우(족보, 예언 성취, 직접 만남 등)에만 적었고, 근거가 약한 인물에겐
   억지로 갖다 붙이지 않았다.
   일러스트는 실제로 어떻게 생겼는지 알 수 없는 인물들이므로 사실적 초상화가 아니라,
   머리/수염 스타일과 표정(성격을 보여주는 요소)만 조합한 원본 디자인의 단순한
   캐릭터 아바타로 그린다. figure: {hair, beard, mood} */
const PEOPLE = [
  {name:"아담", category:"창조", icon:"🌱", color:["#8bc98b","#4a8f4a"], figure:{hair:"short",beard:"short",mood:"warm"},
    related:[{"name":"하와","reason":"하나님이 아담의 갈빗대로 지어 짝지어 주신 아내"}],
    gender:"남",
    summary:"하나님이 흙으로 빚어 생기를 불어넣으신 첫 사람으로, 에덴동산에서 하와와 함께 살았다. 선악을 알게 하는 나무의 열매를 먹지 말라는 명령을 어겨 동산에서 쫓겨났고, 이후 가인과 아벨을 비롯한 자녀를 낳았다. 누가복음 3장의 예수 족보는 계보를 거슬러 올라가 마지막에 아담에 이른다.",
    refs:"창세기 1~5장"},
  {name:"하와", category:"창조", icon:"🍎", color:["#ffb199","#e0577a"], figure:{hair:"veil",mood:"warm"},
    related:[{"name":"아담","reason":"하나님이 흙으로 빚어 지으신 남편"}],
    gender:"여",
    summary:"아담의 갈빗대로 지음받은 첫 여자로, '모든 산 자의 어머니'로 불린다. 뱀의 유혹에 넘어가 선악과를 먹고 아담에게도 주었으며, 그 결과 두 사람은 에덴동산에서 쫓겨났다. 이후 가인, 아벨, 셋을 낳았다.",
    refs:"창세기 2~4장"},
  {name:"노아", category:"족장 이전", icon:"🚢", color:["#7fb3d5","#4a7fa5"], figure:{hair:"long",beard:"long",mood:"serious"},
    gender:"남",
    summary:"당대에 하나님과 동행한 의인으로, 세상이 부패하자 하나님의 지시대로 거대한 방주를 지어 가족 여덟 명과 짐승들을 데리고 대홍수에서 살아남았다. 홍수 후 하나님은 다시는 물로 세상을 심판하지 않겠다는 언약의 표징으로 무지개를 두셨다. 누가복음 3장의 예수 족보에도 이름이 나온다.",
    refs:"창세기 6~9장"},
  {name:"아브라함", category:"족장", icon:"⭐", color:["#e0b04c","#8b5cf6"], figure:{hair:"long",beard:"long",mood:"wise"},
    related:[{"name":"사라","reason":"평생을 함께한 아내"},{"name":"이삭","reason":"노년에 약속대로 얻은 아들"}],
    gender:"남",
    summary:"본래 이름은 아브람으로, 하나님의 부르심을 받아 고향 갈대아 우르를 떠나 가나안으로 이주했다. 자손을 하늘의 별처럼 많게 하겠다는 언약을 받았고, 늙어서 아들 이삭을 얻었으며 훗날 이삭을 제물로 바치라는 시험을 통과했다. 마태복음 1장 예수의 족보가 바로 아브라함에서 시작된다.",
    refs:"창세기 12~25장"},
  {name:"사라", category:"족장", icon:"⛺", color:["#ff9fc2","#c2559a"], figure:{hair:"veil",mood:"gentle"},
    related:[{"name":"아브라함","reason":"남편"},{"name":"이삭","reason":"90세에 낳은 아들"}],
    gender:"여",
    summary:"아브라함의 아내로, 오랫동안 자녀가 없다가 90세에 약속의 아들 이삭을 낳았다. 처음 그 약속을 들었을 때는 속으로 웃었지만, 결국 하나님의 약속이 이루어지는 것을 직접 목격했다.",
    refs:"창세기 11~23장"},
  {name:"이삭", category:"족장", icon:"🐏", color:["#c9a27e","#8b5cf6"], figure:{hair:"short",beard:"short",mood:"gentle"},
    related:[{"name":"아브라함","reason":"아버지"},{"name":"사라","reason":"어머니"},{"name":"리브가","reason":"아내"},{"name":"야곱","reason":"쌍둥이 아들 중 하나"}],
    gender:"남",
    summary:"아브라함과 사라가 노년에 얻은 약속의 아들로, 모리아산에서 제물로 바쳐질 뻔했으나 하나님이 마련하신 숫양으로 대신되었다. 리브가와 결혼해 쌍둥이 야곱과 에서를 낳았다. 마태복음 1장 예수의 족보에 이름이 나온다.",
    refs:"창세기 21~35장"},
  {name:"리브가", category:"족장", icon:"🏺", color:["#ff9fc2","#c2559a"], figure:{hair:"veil",mood:"warm"},
    related:[{"name":"이삭","reason":"남편"},{"name":"야곱","reason":"장자권을 잇도록 이끈 아들"}],
    gender:"여",
    summary:"아브라함의 종이 우물가에서 만나 이삭의 아내로 데려온 여인으로, 낙타에게 물을 길어주는 후한 마음씨로 신붓감으로 선택되었다. 야곱과 에서 쌍둥이를 낳았고, 훗날 야곱이 장자의 축복을 받도록 이끌었다.",
    refs:"창세기 24~27장"},
  {name:"야곱", category:"족장", icon:"🪜", color:["#c9a27e","#8b5cf6"], figure:{hair:"long",beard:"long",mood:"wise"},
    related:[{"name":"이삭","reason":"아버지"},{"name":"리브가","reason":"어머니"},{"name":"라헬","reason":"가장 사랑한 아내"},{"name":"레아","reason":"첫 아내"},{"name":"요셉","reason":"라헬에게서 얻은 아들"}],
    gender:"남",
    summary:"이삭의 둘째 아들로, 형 에서의 장자권과 축복을 얻어냈다. 하란으로 도망가던 길에 하늘까지 닿은 사다리 꿈을 꾸었고, 얍복강에서 하나님의 사자와 씨름한 뒤 '이스라엘'이라는 새 이름을 받았다. 열두 아들이 훗날 이스라엘 열두 지파의 조상이 되었으며, 마태복음 1장 예수의 족보에도 이름이 나온다.",
    refs:"창세기 25~49장"},
  {name:"라헬", category:"족장", icon:"🐑", color:["#ff9fc2","#c2559a"], figure:{hair:"veil",mood:"warm"},
    related:[{"name":"야곱","reason":"남편"},{"name":"레아","reason":"같은 남편을 둔 언니"},{"name":"요셉","reason":"낳은 아들"}],
    gender:"여",
    summary:"야곱이 첫눈에 반해 칠 년을 일하고 얻으려 했던 아내로, 언니 레아가 먼저 시집오는 바람에 다시 칠 년을 더 일해야 했다. 오랫동안 자녀가 없다가 요셉과 베냐민을 낳았고, 베냐민을 낳다가 산고로 세상을 떠났다.",
    refs:"창세기 29~35장"},
  {name:"레아", category:"족장", icon:"🌾", color:["#ff9fc2","#c2559a"], figure:{hair:"veil",mood:"warm"},
    related:[{"name":"야곱","reason":"남편"},{"name":"라헬","reason":"같은 남편을 둔 동생"}],
    gender:"여",
    summary:"야곱의 첫 아내로, 아버지 라반의 계략으로 동생 라헬 대신 먼저 야곱과 혼인했다. 남편의 사랑을 덜 받았지만 르우벤, 시므온, 레위, 유다를 비롯해 가장 많은 아들을 낳았다.",
    refs:"창세기 29~35장"},
  {name:"요셉", category:"족장", icon:"🌾", color:["#e0b04c","#8b5cf6"], figure:{hair:"short",mood:"wise"},
    related:[{"name":"야곱","reason":"아버지"},{"name":"라헬","reason":"어머니"}],
    gender:"남",
    summary:"야곱이 라헬에게서 얻은 아들로, 채색옷을 입을 만큼 사랑받았지만 형들의 시기로 애굽에 노예로 팔려갔다. 누명을 쓰고 옥에 갇히기도 했으나 꿈 해석 능력으로 바로의 신임을 얻어 애굽의 총리가 되었고, 흉년이 들자 자신을 팔았던 형들을 용서하고 가족을 구했다.",
    refs:"창세기 37~50장"},
  {name:"모세", category:"출애굽", icon:"📜", color:["#7fb3d5","#4a7fa5"], figure:{hair:"long",beard:"long",mood:"serious"},
    related:[{"name":"아론","reason":"대변인 역할을 한 형"},{"name":"미리암","reason":"아기 때부터 지켜준 누이"},{"name":"여호수아","reason":"40년을 함께한 시종이자 후계자"}],
    gender:"남",
    summary:"히브리 노예의 아들로 태어나 애굽 공주의 아들로 자랐으나, 동족을 학대하는 애굽인을 죽이고 광야로 도망쳤다. 불타는 떨기나무에서 하나님의 부르심을 받아 이스라엘 백성을 애굽에서 이끌어냈고, 시내산에서 십계명을 받았다. 신명기 18장에는 하나님이 훗날 모세와 같은 선지자를 세우시리라는 예언이 있는데, 신약은 이를 예수와 연결지어 이해한다.",
    refs:"출애굽기~신명기"},
  {name:"아론", category:"출애굽", icon:"⚱️", color:["#e0b04c","#8b5cf6"], figure:{hair:"long",beard:"long",mood:"wise"},
    related:[{"name":"모세","reason":"동생"},{"name":"미리암","reason":"누이"}],
    gender:"남",
    summary:"모세의 형으로, 말을 잘 못하는 모세를 대신해 바로 앞에서 대변인 역할을 했다. 이스라엘의 첫 대제사장으로 세워졌지만, 모세가 산에 오른 사이 백성의 요구로 금송아지를 만드는 잘못을 저지르기도 했다.",
    refs:"출애굽기~민수기"},
  {name:"미리암", category:"출애굽", icon:"🎵", color:["#ff9fc2","#c2559a"], figure:{hair:"veil",mood:"joyful"},
    related:[{"name":"모세","reason":"동생"},{"name":"아론","reason":"오빠"}],
    gender:"여",
    summary:"모세와 아론의 누이로, 아기 모세가 나일강에 띄워졌을 때 지켜보다가 그의 친어머니를 유모로 연결해주었다. 홍해를 건넌 뒤 소고를 들고 춤추며 하나님을 찬양한 여선지자였다.",
    refs:"출애굽기 2장, 15장, 민수기 12장"},
  {name:"여호수아", category:"출애굽", icon:"⚔️", color:["#7fb3d5","#4a7fa5"], figure:{hair:"short",beard:"short",mood:"bold"},
    related:[{"name":"갈렙","reason":"함께 가나안을 정탐하고 믿음의 보고를 한 동료"},{"name":"모세","reason":"40년을 섬긴 스승"}],
    gender:"남",
    summary:"모세의 시종으로 40년 광야 생활을 함께했고, 가나안 정탐 때 갈렙과 함께 긍정적인 보고를 했던 두 사람 중 하나였다. 모세가 죽은 뒤 그 뒤를 이어 이스라엘 백성을 이끌고 요단강을 건너 가나안 땅을 정복했다.",
    refs:"여호수아서"},
  {name:"드보라", category:"사사", icon:"⚖️", color:["#ff9fc2","#c2559a"], figure:{hair:"veil",mood:"bold"},
    gender:"여",
    summary:"종려나무 아래 앉아 이스라엘의 송사를 재판하던 여선지자이자 유일한 여사사다. 장군 바락에게 가나안 군대와 싸우라고 명했고, 함께 나가 승리를 거둔 뒤 승전가를 불렀다.",
    refs:"사사기 4~5장"},
  {name:"기드온", category:"사사", icon:"🏺", color:["#c9a27e","#8b5cf6"], figure:{hair:"short",beard:"short",mood:"serious"},
    gender:"남",
    summary:"미디안의 압제 속에 포도주 틀에 숨어 밀을 타작하다가 천사의 부름을 받았다. 확신이 서지 않아 양털로 두 번이나 표징을 구했고, 결국 단 삼백 명의 용사로 나팔과 항아리, 횃불만으로 미디안 대군을 물리쳤다.",
    refs:"사사기 6~8장"},
  {name:"삼손", category:"사사", icon:"🦁", color:["#c9a27e","#8b5cf6"], figure:{hair:"long",mood:"bold"},
    gender:"남",
    summary:"나실인으로 태어나면서부터 머리카락을 자르지 않겠다는 서원을 지녀 엄청난 힘을 가졌다. 맨손으로 사자를 찢을 만큼 강했지만 들릴라에게 힘의 비밀을 털어놓았다가 배신당해 머리카락이 잘리고 힘을 잃었으며, 마지막 순간 다시 힘을 얻어 블레셋 신전을 무너뜨렸다.",
    refs:"사사기 13~16장"},
  {name:"룻", category:"룻기", icon:"🌾", color:["#e0b04c","#8b5cf6"], figure:{hair:"veil",mood:"warm"},
    related:[{"name":"나오미","reason":"끝까지 함께한 시어머니"},{"name":"다윗","reason":"룻의 증손자"}],
    gender:"여",
    summary:"모압 여인으로, 남편을 잃고도 시어머니 나오미를 떠나지 않고 '어머니의 백성이 내 백성이 되고 어머니의 하나님이 내 하나님이 되시리니'라며 함께 베들레헴으로 갔다. 이삭을 줍다가 보아스를 만나 재혼했고, 다윗의 증조모가 되었다. 마태복음 1장 예수의 족보에 이름이 오른 몇 안 되는 여성 중 하나다.",
    refs:"룻기"},
  {name:"나오미", category:"룻기", icon:"🌾", color:["#ff9fc2","#c2559a"], figure:{hair:"veil",mood:"sorrow"},
    related:[{"name":"룻","reason":"끝까지 곁을 지킨 며느리"}],
    gender:"여",
    summary:"흉년을 피해 모압으로 갔다가 남편과 두 아들을 모두 잃고 며느리 룻과 함께 고향 베들레헴으로 돌아온 과부다. 스스로를 '마라(쓰다)'라 부를 만큼 힘든 시절을 보냈지만, 룻과 보아스의 결혼을 주선하며 새로운 소망을 보았다.",
    refs:"룻기"},
  {name:"사무엘", category:"사사·선지자", icon:"🕯️", color:["#7fb3d5","#4a7fa5"], figure:{hair:"long",beard:"long",mood:"wise"},
    related:[{"name":"사울","reason":"기름 부어 첫 왕으로 세움"},{"name":"다윗","reason":"기름 부어 왕으로 세움"}],
    gender:"남",
    summary:"어머니 한나의 간절한 기도로 태어나 어릴 때부터 성전에서 자랐다. 밤에 하나님의 음성을 듣고 응답한 뒤 선지자로 세워졌으며, 이스라엘의 마지막 사사로서 사울과 다윗 모두에게 기름을 부어 왕으로 세웠다.",
    refs:"사무엘상"},
  {name:"사울", category:"왕", icon:"👑", color:["#9a94b5","#5b4a7a"], figure:{hair:"short",beard:"short",mood:"sorrow"},
    related:[{"name":"사무엘","reason":"기름 부어 왕으로 세운 선지자"},{"name":"다윗","reason":"시기해 죽이려 했던 신하"},{"name":"요나단","reason":"아들"}],
    gender:"남",
    summary:"이스라엘의 첫 번째 왕으로, 처음에는 겸손했으나 점차 하나님의 명령에 불순종하고 다윗을 시기해 여러 차례 죽이려 했다. 결국 블레셋과의 전투에서 패해 스스로 목숨을 끊었다.",
    refs:"사무엘상"},
  {name:"다윗", category:"왕", icon:"🪨", color:["#e0b04c","#8b5cf6"], figure:{hair:"short",beard:"short",mood:"bold"},
    related:[{"name":"사울","reason":"섬기다 쫓겨다닌 첫 왕"},{"name":"골리앗","reason":"물맷돌로 쓰러뜨린 블레셋 장수"},{"name":"요나단","reason":"생명을 나눈 벗"},{"name":"솔로몬","reason":"밧세바에게서 얻은 아들"},{"name":"사무엘","reason":"기름 부어 왕으로 세운 선지자"}],
    gender:"남",
    summary:"베들레헴의 목동이었다가 물맷돌 하나로 블레셋 장수 골리앗을 쓰러뜨려 이름을 알렸다. 사울에게 쫓기는 시절을 거쳐 왕이 되었고, 시편의 많은 부분을 지었다. 밧세바 사건 같은 큰 잘못도 저질렀지만 회개했으며, 마태복음 1장 예수의 족보에서 예수는 '다윗의 자손'으로 소개된다.",
    refs:"사무엘상~열왕기상"},
  {name:"골리앗", category:"왕정", icon:"⚔️", color:["#9a94b5","#5b4a7a"], figure:{hair:"short",beard:"long",mood:"bold"},
    related:[{"name":"다윗","reason":"물맷돌에 쓰러진 상대"}],
    gender:"남",
    summary:"키가 약 3미터에 달했다고 전해지는 블레셋의 거인 장수로, 40일 동안 이스라엘 군대를 조롱하며 일대일 대결을 청했다. 소년 다윗이 던진 물맷돌에 이마를 맞고 쓰러졌다.",
    refs:"사무엘상 17장"},
  {name:"요나단", category:"왕정", icon:"🏹", color:["#7fb3d5","#4a7fa5"], figure:{hair:"short",beard:"short",mood:"warm"},
    related:[{"name":"사울","reason":"아버지"},{"name":"다윗","reason":"생명을 나눈 벗"}],
    gender:"남",
    summary:"사울 왕의 아들이자 왕위 계승자였지만, 다윗과 '자기 생명을 사랑함같이' 우정을 나누며 아버지의 살해 계획에서 다윗을 여러 차례 구해주었다. 아버지와 함께 블레셋과의 전투에서 전사했다.",
    refs:"사무엘상"},
  {name:"솔로몬", category:"왕", icon:"👑", color:["#e0b04c","#8b5cf6"], figure:{hair:"short",beard:"short",mood:"wise"},
    related:[{"name":"다윗","reason":"아버지"}],
    gender:"남",
    summary:"다윗과 밧세바 사이에서 태어난 아들로, 왕이 된 뒤 재물이 아닌 지혜를 구해 하나님을 기쁘게 했다. 두 여인의 아기를 놓고 지혜로운 재판을 했고, 예루살렘 성전을 건축했지만 말년에는 많은 이방 아내들로 인해 우상숭배로 기울었다.",
    refs:"열왕기상 1~11장"},
  {name:"엘리야", category:"선지자", icon:"🔥", color:["#f4a261","#e0577a"], figure:{hair:"long",beard:"long",mood:"bold"},
    related:[{"name":"엘리사","reason":"갑절의 영감을 이어받은 후계자"},{"name":"세례요한","reason":"'엘리야의 심령과 능력으로' 온 인물로 신약에서 연결됨"}],
    gender:"남",
    summary:"갈멜산에서 바알 선지자 450명과 대결해 하늘에서 불이 내려오게 함으로 여호와가 참 신임을 증명했다. 그러나 이세벨의 위협에 광야로 도망쳐 죽고 싶다고 할 만큼 좌절하기도 했으며, 마지막에는 불수레와 불말을 타고 회오리바람 가운데 승천했다. 신약에서 예수가 변화산에서 모세와 함께 나타난 인물이 바로 엘리야이며, 세례요한은 '엘리야의 심령과 능력으로' 온 인물로 묘사된다.",
    refs:"열왕기상~열왕기하"},
  {name:"엘리사", category:"선지자", icon:"🌊", color:["#7fb3d5","#4a7fa5"], figure:{hair:"short",beard:"short",mood:"gentle"},
    related:[{"name":"엘리야","reason":"부름을 받고 따른 스승"}],
    gender:"남",
    summary:"밭을 갈다가 엘리야의 부름을 받고 소를 잡아 잔치를 벌인 뒤 그를 따랐다. 엘리야가 승천할 때 갑절의 영감을 구해 받았고, 이후 많은 치유와 기적을 행한 선지자로 활동했다.",
    refs:"열왕기하"},
  {name:"이사야", category:"대선지자", icon:"📜", color:["#7fb3d5","#4a7fa5"], figure:{hair:"long",beard:"long",mood:"serious"},
    gender:"남",
    summary:"유다 왕국에서 활동한 대선지자로, 성전에서 하나님의 영광을 보는 환상을 체험하고 '내가 여기 있나이다 나를 보내소서'라며 사명을 받아들였다. 처녀가 잉태해 아들을 낳으리라는 예언(7장)과 고난받는 종의 노래(53장) 등 메시아에 대한 예언을 여럿 남겼으며, 신약은 이를 예수의 탄생과 십자가 죽음의 성취로 인용한다.",
    refs:"이사야서"},
  {name:"예레미야", category:"대선지자", icon:"😢", color:["#7fb3d5","#4a7fa5"], figure:{hair:"long",beard:"long",mood:"sorrow"},
    gender:"남",
    summary:"'눈물의 선지자'로 불리며, 예루살렘의 멸망을 예언했으나 사람들에게 배척당하고 웅덩이에 갇히는 고초까지 겪었다. 그럼에도 하나님이 새 언약을 맺으실 것이라는 소망의 메시지도 함께 전했다.",
    refs:"예레미야서"},
  {name:"에스겔", category:"대선지자", icon:"👁️", color:["#7fb3d5","#4a7fa5"], figure:{hair:"short",beard:"long",mood:"serious"},
    gender:"남",
    summary:"바벨론 포로로 끌려간 제사장 출신 선지자로, 마른 뼈들이 살아나는 환상 등 강렬한 상징적 환상을 많이 본 것으로 알려져 있다.",
    refs:"에스겔서"},
  {name:"다니엘", category:"대선지자", icon:"🦁", color:["#9a94b5","#5b4a7a"], figure:{hair:"short",mood:"bold"},
    gender:"남",
    summary:"바벨론 포로로 끌려가 궁정에서 교육받으면서도 왕의 음식을 거절하며 신앙의 절개를 지켰다. 왕의 꿈을 해석해 총리 자리에 올랐고, 기도를 금하는 조서에도 굴하지 않고 기도하다 사자굴에 던져졌지만 하나님이 지켜주셨다.",
    refs:"다니엘서"},
  {name:"요나", category:"소선지자", icon:"🐋", color:["#7fb3d5","#4a7fa5"], figure:{hair:"short",beard:"short",mood:"sorrow"},
    gender:"남",
    summary:"니느웨로 가서 심판을 선포하라는 하나님의 명령을 피해 반대 방향인 다시스로 가는 배를 탔다가 풍랑을 만나 바다에 던져졌고, 큰 물고기 뱃속에서 사흘을 보낸 뒤 살아났다. 결국 니느웨로 가서 심판을 선포했지만 백성이 회개하고 살아나자 오히려 화를 냈다.",
    refs:"요나서"},
  {name:"욥", category:"지혜서", icon:"⛅", color:["#9a94b5","#5b4a7a"], figure:{hair:"long",beard:"long",mood:"sorrow"},
    gender:"남",
    summary:"흠 없고 정직한 사람이었으나 하루아침에 재산과 자녀를 모두 잃고 온몸에 악창이 나는 고난을 당했다. 친구들의 위로 아닌 위로를 들으면서도 하나님을 원망하지 않았고, 끝내 하나님의 응답을 들은 뒤 이전보다 더 많은 복을 받았다.",
    refs:"욥기"},
  {name:"에스더", category:"포로·귀환", icon:"👑", color:["#ff9fc2","#c2559a"], figure:{hair:"veil",mood:"bold"},
    related:[{"name":"모르드개","reason":"자신을 딸처럼 키운 사촌 오빠"}],
    gender:"여",
    summary:"고아로 자란 유대인 여성으로, 사촌 모르드개의 손에서 자라다가 페르시아 왕비로 뽑혔다. 유대 민족을 몰살하려는 하만의 음모를 알게 되자 '죽으면 죽으리이다'라는 각오로 목숨을 걸고 왕 앞에 나아가 자기 백성을 구했다.",
    refs:"에스더서"},
  {name:"모르드개", category:"포로·귀환", icon:"📯", color:["#e0b04c","#8b5cf6"], figure:{hair:"short",beard:"short",mood:"wise"},
    related:[{"name":"에스더","reason":"딸처럼 키운 사촌 동생"}],
    gender:"남",
    summary:"에스더를 딸처럼 키운 사촌 오빠로, 왕을 암살하려는 음모를 미리 알려 목숨을 구한 공로가 있었다. 하만의 미움을 샀지만 결국 하만이 준비한 처형대에 오히려 하만이 달리게 되었고, 자신은 총리 자리에 올랐다.",
    refs:"에스더서"},
  {name:"느헤미야", category:"포로·귀환", icon:"🧱", color:["#c9a27e","#8b5cf6"], figure:{hair:"short",beard:"short",mood:"bold"},
    gender:"남",
    summary:"페르시아 왕의 술 관원으로 있다가 예루살렘 성벽이 무너져 있다는 소식에 슬퍼하며 왕의 허락을 받아 귀환했다. 방해 세력의 위협 속에서도 백성들과 함께 무기를 들고 일하며 단 52일 만에 성벽을 재건했다.",
    refs:"느헤미야서"},
  {name:"에스라", category:"포로·귀환", icon:"📜", color:["#7fb3d5","#4a7fa5"], figure:{hair:"short",beard:"long",mood:"wise"},
    gender:"남",
    summary:"바벨론에서 율법을 깊이 연구한 학자이자 제사장으로, 포로 귀환 후 백성들 앞에서 율법책을 낭독하며 신앙 개혁을 이끌었다.",
    refs:"에스라서"},
  {name:"마리아", category:"신약·예수 탄생", icon:"🕊️", color:["#a7c7e7","#5b7fa6"], figure:{hair:"veil",mood:"gentle"},
    related:[{"name":"야고보(예수의 동생)","reason":"아들"},{"name":"요셉(예수의 아버지)","reason":"정혼자이자 남편"},{"name":"세례요한","reason":"누가복음에 친척으로 기록된 인물"}],
    gender:"여",
    summary:"나사렛의 젊은 여인으로, 천사 가브리엘에게서 성령으로 잉태해 메시아를 낳으리라는 소식을 듣고 '말씀대로 내게 이루어지이다'라며 순종했다. 예수를 낳아 기르며 십자가 처형 현장까지 끝까지 곁을 지켰다.",
    refs:"마태복음, 누가복음"},
  {name:"요셉(예수의 아버지)", category:"신약·예수 탄생", icon:"🔨", color:["#c9a27e","#8b5cf6"], figure:{hair:"short",beard:"short",mood:"gentle"},
    related:[{"name":"마리아","reason":"아내"}],
    gender:"남",
    summary:"목수 일을 하던 다윗의 후손으로, 정혼자 마리아가 잉태한 사실을 알고 조용히 파혼하려 했으나 꿈에 나타난 천사의 말을 듣고 그대로 마리아를 아내로 맞았다. 헤롯의 위협을 피해 가족을 이끌고 애굽으로 피신했다가 돌아와 나사렛에 정착했다.",
    refs:"마태복음, 누가복음"},
  {name:"세례요한", category:"신약·예수 탄생", icon:"🕊️", color:["#a7c7e7","#5b7fa6"], figure:{hair:"long",beard:"long",mood:"bold"},
    related:[{"name":"마리아","reason":"누가복음에 친척으로 기록됨"},{"name":"안드레","reason":"본래 그의 제자였다가 예수를 따르게 됨"}],
    gender:"남",
    summary:"제사장 사가랴와 엘리사벳이 노년에 얻은 아들로, 예수의 친척이다. 광야에서 낙타털 옷을 입고 메뚜기와 석청을 먹으며 지냈고, 요단강에서 회개의 세례를 베풀며 예수의 길을 예비했다. 직접 예수에게 세례를 주었고, 훗날 헤롯을 비판하다 목이 베여 순교했다.",
    refs:"마태복음 3장, 누가복음 1장 외"},
  {name:"베드로", category:"제자·사도", icon:"🎣", color:["#7fb3d5","#4a7fa5"], figure:{hair:"short",beard:"short",mood:"warm"},
    related:[{"name":"안드레","reason":"자신을 예수께 데려온 동생"},{"name":"야고보(세베대의 아들)","reason":"변화산 등 중요한 순간을 함께한 동료 제자"},{"name":"요한","reason":"변화산 등 중요한 순간을 함께한 동료 제자"}],
    gender:"남",
    summary:"갈릴리 호수의 어부였다가 예수의 부름을 받고 그물을 버려두고 따랐다. 예수를 '그리스도시요 살아계신 하나님의 아들'이라 고백했지만, 예수가 잡히던 밤에는 세 번이나 그를 모른다고 부인했다. 부활한 예수를 만난 뒤 회복되어 초대교회의 핵심 지도자가 되었다.",
    refs:"사복음서, 사도행전"},
  {name:"안드레", category:"제자·사도", icon:"🎣", color:["#7fb3d5","#4a7fa5"], figure:{hair:"short",beard:"short",mood:"warm"},
    related:[{"name":"베드로","reason":"자신이 예수께 데려온 형"},{"name":"세례요한","reason":"본래 그의 제자였음"}],
    gender:"남",
    summary:"베드로의 형제로, 본래 세례요한의 제자였다가 예수를 만나 따랐다. 형 베드로를 예수께 데려온 인물이며, 오병이어 사건에서 물고기 두 마리와 떡 다섯 개를 가진 소년을 예수께 소개했다.",
    refs:"사복음서"},
  {name:"야고보(세베대의 아들)", category:"제자·사도", icon:"🎣", color:["#7fb3d5","#4a7fa5"], figure:{hair:"short",beard:"short",mood:"bold"},
    related:[{"name":"요한","reason":"동생"},{"name":"베드로","reason":"변화산 등을 함께한 동료 제자"}],
    gender:"남",
    summary:"요한의 형제로, 베드로·요한과 함께 예수의 변화산 사건과 겟세마네 기도 같은 중요한 순간을 가장 가까이서 지켜본 제자 중 하나다. 헤롯 아그립바에 의해 열두 제자 중 처음으로 순교했다.",
    refs:"사복음서, 사도행전 12장"},
  {name:"요한", category:"제자·사도", icon:"🕊️", color:["#a7c7e7","#5b7fa6"], figure:{hair:"short",mood:"gentle"},
    related:[{"name":"야고보(세베대의 아들)","reason":"형"},{"name":"베드로","reason":"변화산 등을 함께한 동료 제자"},{"name":"마리아","reason":"십자가 아래서 부탁받아 자기 집에 모신 예수의 어머니"}],
    gender:"남",
    summary:"야고보의 동생으로, '예수께서 사랑하시는 제자'로 불리며 최후의 만찬에서 예수의 품에 기대었다. 십자가 아래서 예수의 어머니 마리아를 부탁받아 자기 집에 모셨고, 훗날 요한복음과 요한계시록을 기록했다고 전해진다.",
    refs:"사복음서, 요한계시록"},
  {name:"도마", category:"제자·사도", icon:"❓", color:["#7fb3d5","#4a7fa5"], figure:{hair:"short",beard:"short",mood:"serious"},
    gender:"남",
    summary:"부활한 예수가 처음 나타났을 때 그 자리에 없었기에 '내가 그 손의 못 자국을 보며 내 손가락을 그 못 자국에 넣어보지 않고는 믿지 못하겠다'며 의심했다. 일주일 뒤 예수가 다시 나타나 상처를 보여주자 '나의 주님이시요 나의 하나님이시니이다'라고 고백했다.",
    refs:"요한복음 20장"},
  {name:"마태", category:"제자·사도", icon:"📖", color:["#7fb3d5","#4a7fa5"], figure:{hair:"short",beard:"short",mood:"warm"},
    gender:"남",
    summary:"세관에 앉아 세금을 걷던 세리였으나, 예수가 '나를 따르라' 하시자 곧바로 일어나 따랐다. 이후 자기 집에서 예수를 위한 큰 잔치를 열어 동료 세리와 죄인들을 초대했으며, 마태복음을 기록했다고 전해진다.",
    refs:"마태복음 9장 외"},
  {name:"막달라마리아", category:"신약·여성", icon:"🌹", color:["#ff9fc2","#c2559a"], figure:{hair:"long",mood:"warm"},
    gender:"여",
    summary:"일곱 귀신에 들렸다가 예수께 고침받은 뒤 자기 소유로 예수와 제자들을 섬겼다. 십자가 처형과 장례를 끝까지 지켜보았고, 부활절 아침 빈 무덤을 처음 발견하고 부활하신 예수를 가장 먼저 만난 증인이 되었다.",
    refs:"누가복음 8장, 요한복음 20장"},
  {name:"마르다와나사로", category:"신약·여성", icon:"🏠", color:["#c9a27e","#8b5cf6"], figure:{hair:"veil",mood:"warm"},
    gender:"기타",
    summary:"베다니에 살던 마르다·마리아·나사로 삼남매는 예수와 가까이 지내던 가족이었다. 나사로가 병들어 죽자 예수는 나흘 만에 무덤을 찾아 '나사로야 나오라' 외쳐 그를 다시 살려냈고, 이는 예수가 행한 가장 극적인 표적 중 하나로 꼽힌다.",
    refs:"요한복음 11장"},
  {name:"바울", category:"사도", icon:"✍️", color:["#9a94b5","#5b4a7a"], figure:{hair:"short",beard:"short",mood:"serious"},
    related:[{"name":"바나바","reason":"회심 직후 자신을 받아들여 소개해준 첫 동역자"},{"name":"디모데","reason":"아들처럼 아끼며 데리고 다닌 제자"},{"name":"누가","reason":"여러 선교 여행에 동행한 동역자"},{"name":"스데반","reason":"돌에 맞아 죽는 순교 현장을 지켜봄(당시 이름 사울)"}],
    gender:"남",
    summary:"본래 이름은 사울로, 바리새인 중의 바리새인으로 그리스도인들을 핍박하던 인물이었다. 다메섹으로 가던 길에 부활한 예수를 만나 눈이 멀었다가 다시 보게 되는 극적인 회심을 겪은 뒤, 이방인을 위한 사도로 세 차례 선교 여행을 다니며 로마서·고린도전후서 등 신약의 여러 서신을 기록했다.",
    refs:"사도행전, 서신서"},
  {name:"바나바", category:"사도", icon:"🤝", color:["#7fb3d5","#4a7fa5"], figure:{hair:"short",beard:"short",mood:"warm"},
    related:[{"name":"요한마가","reason":"외삼촌-조카 관계"},{"name":"바울","reason":"소개해 받아들이고 함께 다닌 동역자"}],
    gender:"남",
    summary:"본명은 요셉이지만 '위로의 아들'이라는 뜻의 바나바로 불렸다. 회심 직후 다른 사도들이 경계하던 바울을 받아들여 소개해주었고, 바울의 첫 선교 여행 동역자가 되었다.",
    refs:"사도행전"},
  {name:"스데반", category:"초대교회", icon:"⭐", color:["#e0b04c","#8b5cf6"], figure:{hair:"short",mood:"joyful"},
    related:[{"name":"바울","reason":"자신이 순교하는 현장을 지켜본 인물(당시 이름 사울)"}],
    gender:"남",
    summary:"초대교회에서 구제 일을 맡은 일곱 집사 중 한 사람으로, 지혜와 성령이 충만했다. 유대 공회 앞에서 담대히 설교하다 돌에 맞아 죽었는데, 그 얼굴이 천사의 얼굴 같았다고 전해지며, 죽어가면서도 자신을 죽이는 이들을 용서해 달라고 기도한 초대교회 최초의 순교자다.",
    refs:"사도행전 6~7장"},
  {name:"디모데", category:"사도의 제자", icon:"📖", color:["#7fb3d5","#4a7fa5"], figure:{hair:"short",mood:"gentle"},
    related:[{"name":"바울","reason":"아들처럼 아끼며 이끌어준 스승"}],
    gender:"남",
    summary:"믿음이 좋은 어머니와 외할머니 아래서 어릴 때부터 성경을 배우며 자란 젊은 제자로, 바울이 아들처럼 아끼며 데리고 다녔다. 몸이 약했지만 여러 교회를 맡아 섬겼고, 바울이 보낸 디모데전후서의 수신자다.",
    refs:"사도행전, 디모데전후서"},
  {name:"누가", category:"사도의 제자", icon:"✍️", color:["#7fb3d5","#4a7fa5"], figure:{hair:"short",beard:"short",mood:"gentle"},
    related:[{"name":"바울","reason":"여러 선교 여행에 동행한 동역자"}],
    gender:"남",
    summary:"의사 출신으로, 바울의 선교 여행에 여러 차례 동행한 동역자였다. 목격자들을 자세히 취재해 예수의 생애를 정리한 누가복음과, 초대교회의 확장 과정을 기록한 사도행전을 남겼다.",
    refs:"누가복음, 사도행전, 골로새서 4장"},
  {name:"갈렙", category:"출애굽", icon:"🗺️", color:["#7fb3d5","#4a7fa5"], figure:{hair:"short",beard:"short",mood:"bold"},
    related:[{"name":"여호수아","reason":"함께 가나안을 정탐하고 믿음의 보고를 한 동료"}],
    gender:"남",
    summary:"열두 정탐꾼 중 하나로, 다른 열 명이 가나안 정복이 불가능하다고 낙심시킬 때 여호수아와 함께 '올라가서 그 땅을 취하자'며 믿음의 보고를 했다. 이 믿음 때문에 광야 세대 중 여호수아와 단둘이 약속의 땅에 들어갔고, 85세에도 정정하게 헤브론 산지를 기업으로 받았다.",
    refs:"민수기 13~14장, 여호수아 14장"},
  {name:"한나", category:"사사·선지자", icon:"🙏", color:["#ff9fc2","#c2559a"], figure:{hair:"veil",mood:"warm"},
    related:[{"name":"사무엘","reason":"간절히 기도해 얻은 뒤 하나님께 드린 아들"}],
    gender:"여",
    summary:"자녀가 없어 늘 슬퍼하다가 성전에서 소리 없이 입술만 움직이며 간절히 기도해 아들을 구했고, 제사장 엘리에게 취한 여자로 오해받기도 했다. 아들 사무엘을 얻자 서원대로 젖을 뗀 뒤 곧바로 성전에 데려가 하나님께 드렸다.",
    refs:"사무엘상 1~2장"},
  {name:"엘리", category:"사사·선지자", icon:"🕯️", color:["#c9a27e","#8b5cf6"], figure:{hair:"long",beard:"long",mood:"gentle"},
    related:[{"name":"사무엘","reason":"어릴 때부터 성전에서 키운 아이"}],
    gender:"남",
    summary:"실로 성막의 제사장으로 한나가 맡긴 어린 사무엘을 키웠다. 자신은 신실했지만 아들 홉니와 비느하스의 타락을 알고도 강하게 막지 못했고, 결국 두 아들이 전사하고 언약궤를 빼앗겼다는 소식을 듣다가 의자에서 넘어져 죽었다.",
    refs:"사무엘상 1~4장"},
  {name:"아비가일", category:"왕정", icon:"🫒", color:["#ff9fc2","#c2559a"], figure:{hair:"veil",mood:"wise"},
    related:[{"name":"다윗","reason":"나발이 죽은 뒤 아내가 됨"}],
    gender:"여",
    summary:"어리석고 인색한 나발의 아내였으나, 남편이 다윗의 부탁을 모욕적으로 거절해 몰살당할 위기에 처하자 몰래 음식을 챙겨 다윗을 지혜롭게 달래 피를 흘리지 않게 했다. 나발이 얼마 뒤 죽자 다윗의 아내가 되었다.",
    refs:"사무엘상 25장"},
  {name:"밧세바", category:"왕정", icon:"🛁", color:["#ff9fc2","#c2559a"], figure:{hair:"veil",mood:"sorrow"},
    related:[{"name":"다윗","reason":"훗날 아내가 됨"},{"name":"솔로몬","reason":"낳은 아들"}],
    gender:"여",
    summary:"다윗이 왕궁 옥상에서 목욕하는 모습을 보고 불러들여 임신시켰고, 이를 감추려던 다윗의 계략으로 남편 우리아가 전쟁터에서 죽임을 당했다. 훗날 다윗의 아내가 되어 솔로몬을 낳았고, 나단 선지자의 책망으로 다윗의 회개가 시작되는 계기가 되었다.",
    refs:"사무엘하 11~12장"},
  {name:"압살롬", category:"왕정", icon:"🌳", color:["#9a94b5","#5b4a7a"], figure:{hair:"long",mood:"bold"},
    related:[{"name":"다윗","reason":"반역을 일으킨 아들"}],
    gender:"남",
    summary:"다윗의 아들로, 누이 다말이 이복형 암논에게 욕을 당하자 그를 죽이고 도망쳤다가 훗날 화해했다. 그러나 백성의 마음을 얻어 아버지에게 반역을 일으켰고, 전투 중 노새를 타고 도망치다 무성한 상수리나무에 머리카락이 걸려 매달린 채 죽었다.",
    refs:"사무엘하 13~18장"},
  {name:"나단", category:"왕정", icon:"📯", color:["#7fb3d5","#4a7fa5"], figure:{hair:"short",beard:"long",mood:"serious"},
    related:[{"name":"다윗","reason":"죄를 지적한 선지자"}],
    gender:"남",
    summary:"다윗의 신임을 받던 선지자로, 밧세바 사건 뒤 '가난한 자의 양 새끼'를 빼앗은 부자 이야기로 다윗 스스로 자기 죄를 판결하게 만들어 회개시켰다. 훗날 아도니야의 왕위 찬탈 시도를 막고 솔로몬이 왕이 되도록 도왔다.",
    refs:"사무엘하 12장, 열왕기상 1장"},
  {name:"여로보암", category:"왕정", icon:"🐂", color:["#9a94b5","#5b4a7a"], figure:{hair:"short",beard:"short",mood:"serious"},
    gender:"남",
    summary:"솔로몬의 신하였다가 왕국이 남북으로 갈라질 때 북이스라엘의 초대 왕이 되었다. 백성이 예루살렘 성전으로 가는 것을 막으려 벧엘과 단에 금송아지를 세웠는데, 이는 이후 북이스라엘 왕들이 반복해서 지적받는 '여로보암의 죄'가 되었다.",
    refs:"열왕기상 11~14장"},
  {name:"르호보암", category:"왕정", icon:"👑", color:["#9a94b5","#5b4a7a"], figure:{hair:"short",beard:"short",mood:"serious"},
    related:[{"name":"솔로몬","reason":"아버지"}],
    gender:"남",
    summary:"솔로몬의 아들로 왕이 된 뒤, 원로들의 조언 대신 젊은 신하들의 강경한 조언을 따라 '내 아버지는 채찍으로 너희를 치셨으나 나는 전갈로 치겠다'며 백성을 위협했다. 이 일로 민심을 잃어 나라가 남유다와 북이스라엘로 갈라지는 계기를 만들었다.",
    refs:"열왕기상 12장"},
  {name:"아합", category:"왕정", icon:"🏹", color:["#9a94b5","#5b4a7a"], figure:{hair:"short",beard:"short",mood:"sorrow"},
    related:[{"name":"이세벨","reason":"아내"},{"name":"엘리야","reason":"여러 차례 대립한 선지자"}],
    gender:"남",
    summary:"북이스라엘의 왕으로 이세벨과 결혼해 바알 숭배를 나라 안에 들여왔다. 나봇의 포도원을 갖고 싶어 시무룩해 있다가 아내의 계략으로 나봇을 죽게 만들었고, 엘리야에게 여러 차례 책망을 들었다.",
    refs:"열왕기상 16~22장"},
  {name:"이세벨", category:"왕정", icon:"💄", color:["#9a94b5","#5b4a7a"], figure:{hair:"long",mood:"bold"},
    related:[{"name":"아합","reason":"남편"},{"name":"엘리야","reason":"죽이겠다고 위협한 선지자"}],
    gender:"여",
    summary:"아합의 아내로 바알과 아세라 숭배를 강요하며 여호와의 선지자들을 죽였다. 나봇을 거짓 증인으로 모함해 죽이고 포도원을 빼앗았으며, 갈멜산 대결에서 진 뒤 엘리야를 죽이겠다고 위협해 그를 광야로 도망치게 만들었다.",
    refs:"열왕기상 16장, 18~19장, 21장"},
  {name:"나아만", category:"선지자", icon:"🌊", color:["#7fb3d5","#4a7fa5"], figure:{hair:"short",beard:"short",mood:"warm"},
    related:[{"name":"엘리사","reason":"나병을 고쳐준 선지자"}],
    gender:"남",
    summary:"아람(수리아)의 존경받는 군대 장관이었으나 나병에 걸렸다. 엘리사가 요단강에 일곱 번 몸을 씻으라고 하자 처음엔 하찮게 여겨 화를 냈지만, 종의 설득으로 순종하자 살결이 어린아이처럼 깨끗해졌다.",
    refs:"열왕기하 5장"},
  {name:"히스기야", category:"왕정", icon:"🌤️", color:["#e0b04c","#8b5cf6"], figure:{hair:"short",beard:"long",mood:"wise"},
    gender:"남",
    summary:"유다의 왕으로 아버지 아하스가 세운 우상들을 없애고 신앙 개혁을 이끌었다. 앗수르 산헤립의 대군이 예루살렘을 포위했을 때 성전에서 간절히 기도해 위기를 넘겼고, 죽을병에 걸렸을 때도 기도해 생명이 15년 연장되었다.",
    refs:"열왕기하 18~20장"},
  {name:"요시야", category:"왕정", icon:"📜", color:["#e0b04c","#8b5cf6"], figure:{hair:"short",mood:"bold"},
    gender:"남",
    summary:"여덟 살에 왕이 된 유다의 어린 왕으로, 성전을 수리하던 중 발견된 율법책을 듣고 옷을 찢으며 슬퍼했다. 이를 계기로 우상을 대대적으로 제거하고 백성과 함께 언약을 새롭게 하는 신앙 개혁을 단행했다.",
    refs:"열왕기하 22~23장"},
  {name:"아모스", category:"소선지자", icon:"🐑", color:["#7fb3d5","#4a7fa5"], figure:{hair:"short",beard:"short",mood:"bold"},
    gender:"남",
    summary:"드고아의 목자였다가 하나님의 부르심을 받은 소선지자로, 제사장도 선지자의 아들도 아니었다. 겉으로는 번영하던 북이스라엘의 부패와 사회적 불의를 날카롭게 지적하며 '오직 정의를 물같이, 공의를 마르지 않는 강같이 흐르게 하라'고 외쳤다.",
    refs:"아모스서"},
  {name:"호세아", category:"소선지자", icon:"💔", color:["#7fb3d5","#4a7fa5"], figure:{hair:"short",beard:"long",mood:"sorrow"},
    gender:"남",
    summary:"하나님의 명령에 따라 음란한 여인 고멜과 결혼해 자녀를 낳았고, 고멜이 떠난 뒤에도 다시 값을 치르고 데려왔다. 자신의 아픈 결혼생활을 통해 이스라엘이 우상을 좇아도 끝까지 붙드시는 하나님의 신실한 사랑을 몸으로 보여준 소선지자다.",
    refs:"호세아서"},
  {name:"미가(선지자)", category:"소선지자", icon:"⚖️", color:["#7fb3d5","#4a7fa5"], figure:{hair:"long",beard:"long",mood:"serious"},
    gender:"남",
    summary:"유다의 소선지자로 지도자들의 부패와 사회적 불의를 강하게 꾸짖으면서도, '작은 고을 베들레헴 에브라다에서 장차 이스라엘을 다스릴 자가 나오리라'는 메시아 예언을 남겼다. 신약은 이 예언을 예수의 탄생 장소와 연결해 인용한다.",
    refs:"미가서"},
  {name:"하박국", category:"소선지자", icon:"❓", color:["#7fb3d5","#4a7fa5"], figure:{hair:"short",beard:"long",mood:"wise"},
    gender:"남",
    summary:"악인이 형통하고 폭력이 판치는데 하나님이 왜 침묵하시는지 솔직하게 따져 물은 소선지자다. 바벨론을 들어 심판하시겠다는 응답을 듣고 다시 고민했지만, 끝내 '의인은 그의 믿음으로 말미암아 살리라'는 깨달음에 이르렀다.",
    refs:"하박국서"},
  {name:"학개", category:"소선지자", icon:"🏗️", color:["#7fb3d5","#4a7fa5"], figure:{hair:"short",beard:"short",mood:"serious"},
    gender:"남",
    summary:"바벨론 포로에서 돌아온 백성이 자기 집 짓기에 바빠 성전 재건을 미루자, '이 성전이 황폐한데 너희가 판벽한 집에 거하는 것이 가하냐'며 다그친 소선지자다. 그의 촉구로 성전 재건 공사가 다시 시작되었다.",
    refs:"학개서"},
  {name:"스가랴(선지자)", category:"소선지자", icon:"🕎", color:["#7fb3d5","#4a7fa5"], figure:{hair:"short",beard:"long",mood:"wise"},
    gender:"남",
    summary:"학개와 같은 시기에 활동한 소선지자로, 성전 재건을 격려하며 여러 상징적인 환상을 전했다. '나귀 새끼를 탄 겸손한 왕' 같은 메시아 예언은 신약에서 예수의 예루살렘 입성과 연결된다.",
    refs:"스가랴서"},
  {name:"말라기", category:"소선지자", icon:"🔥", color:["#7fb3d5","#4a7fa5"], figure:{hair:"short",beard:"short",mood:"serious"},
    gender:"남",
    summary:"구약의 마지막 소선지자로, 형식적으로 흠 있는 제물을 드리고 십일조를 소홀히 하던 백성과 제사장들을 꾸짖었다. 주의 날이 오기 전에 '엘리야 같은 선지자'를 보내겠다는 예언을 남겼고, 신약은 이를 세례요한과 연결한다.",
    refs:"말라기서"},
  {name:"삭개오", category:"신약·예수 사역", icon:"🌳", color:["#e0b04c","#8b5cf6"], figure:{hair:"short",beard:"short",mood:"joyful"},
    gender:"남",
    summary:"여리고의 세리장으로 부자였지만 동족에게 세금을 걷어 미움받았다. 키가 작아 예수를 보려고 뽕나무에 올라갔다가 예수가 먼저 이름을 불러 자기 집에 머물자, 재산의 절반을 가난한 자에게 주고 속인 것은 네 배로 갚겠다고 다짐했다.",
    refs:"누가복음 19장"},
  {name:"니고데모", category:"신약·예수 사역", icon:"🌙", color:["#7fb3d5","#4a7fa5"], figure:{hair:"long",beard:"long",mood:"gentle"},
    gender:"남",
    summary:"바리새인이자 유대 공회원으로, 사람들 눈을 피해 밤에 예수를 찾아와 '거듭남'에 대해 물었다. 훗날 공회에서 예수를 조심스럽게 변호했고, 십자가 처형 후에는 몰약과 침향을 가지고 와 예수의 장례를 도왔다.",
    refs:"요한복음 3장, 7장, 19장"},
  {name:"빌라도", category:"신약·예수 수난", icon:"⚖️", color:["#9a94b5","#5b4a7a"], figure:{hair:"short",beard:"short",mood:"serious"},
    gender:"남",
    summary:"예수를 재판한 로마의 유대 총독으로, 예수에게서 죄를 찾지 못했으면서도 소요를 우려한 무리의 요구에 밀려 십자가형을 허락했다. 손을 씻으며 '이 사람의 피에 대해 나는 무죄하다'고 했지만 책임을 피하지는 못했다.",
    refs:"마태복음 27장, 요한복음 18~19장"},
  {name:"헤롯대왕", category:"신약·예수 탄생", icon:"👑", color:["#9a94b5","#5b4a7a"], figure:{hair:"short",beard:"short",mood:"serious"},
    gender:"남",
    summary:"로마가 세운 유대의 분봉왕으로, 동방박사에게서 '유대인의 왕으로 나신 이'에 대해 듣고 위협을 느껴 베들레헴과 그 인근의 두 살 이하 사내아이를 모두 죽이라 명령했다. 요셉은 꿈의 경고로 가족을 데리고 애굽으로 피신해 화를 면했다.",
    refs:"마태복음 2장"},
  {name:"가야바", category:"신약·예수 수난", icon:"🏛️", color:["#9a94b5","#5b4a7a"], figure:{hair:"short",beard:"long",mood:"serious"},
    gender:"남",
    summary:"그 해의 대제사장으로 '한 사람이 백성을 위해 죽는 것이 낫다'며 예수를 죽이기로 유대 공회를 주도했다. 예수를 심문한 뒤 신성모독죄로 몰아 로마 총독 빌라도에게 넘겼다.",
    refs:"마태복음 26장, 요한복음 11장, 18장"},
  {name:"아나니아와삽비라", category:"초대교회", icon:"💰", color:["#9a94b5","#5b4a7a"], figure:{hair:"short",beard:"short",mood:"sorrow"},
    gender:"기타",
    summary:"초대교회의 신자 부부로, 땅을 팔아 헌금하면서 일부를 몰래 감추고도 전부인 것처럼 베드로에게 거짓말했다. 사람이 아니라 하나님을 속인 것이라는 베드로의 말을 듣자 각각 그 자리에서 쓰러져 숨을 거두었다.",
    refs:"사도행전 5장"},
  {name:"빌립(집사)", category:"초대교회", icon:"🐎", color:["#7fb3d5","#4a7fa5"], figure:{hair:"short",beard:"short",mood:"warm"},
    gender:"남",
    summary:"구제 일을 맡은 일곱 집사 중 한 사람으로, 박해로 흩어진 뒤 사마리아에서 복음을 전해 많은 이가 믿게 했다. 광야 길에서 에티오피아 내시를 만나 이사야서를 설명해주고 그 자리에서 세례를 주었다.",
    refs:"사도행전 6장, 8장"},
  {name:"브리스길라와아굴라", category:"초대교회", icon:"⛺", color:["#7fb3d5","#4a7fa5"], figure:{hair:"short",mood:"warm"},
    related:[{"name":"바울","reason":"함께 천막을 만들며 동역한 선교 동료"}],
    gender:"기타",
    summary:"천막 만드는 일을 하며 바울과 함께 일하고 여러 도시를 함께 다닌 부부 동역자다. 언변이 뛰어나지만 세례요한의 세례만 알던 아볼로를 따로 데려다가 하나님의 도를 더 정확하게 가르쳐주었다.",
    refs:"사도행전 18장"},
  {name:"아볼로", category:"초대교회", icon:"📢", color:["#7fb3d5","#4a7fa5"], figure:{hair:"short",beard:"short",mood:"bold"},
    related:[{"name":"브리스길라와아굴라","reason":"성경을 더 정확히 가르쳐준 동역자"}],
    gender:"남",
    summary:"알렉산드리아 출신으로 성경에 능통하고 말솜씨가 뛰어난 유대인 신자였다. 처음엔 세례요한의 세례만 알았으나 브리스길라와 아굴라에게 더 정확한 가르침을 받은 뒤, 고린도에서 힘있게 복음을 전했다.",
    refs:"사도행전 18장, 고린도전서 3장"},
  {name:"실라", category:"사도의 제자", icon:"⛓️", color:["#7fb3d5","#4a7fa5"], figure:{hair:"short",beard:"short",mood:"bold"},
    related:[{"name":"바울","reason":"2차 선교 여행 동역자"}],
    gender:"남",
    summary:"바울의 2차 선교 여행에 동행한 동역자로, 빌립보에서 함께 매를 맞고 옥에 갇혔다. 한밤중에 매인 몸으로 찬송하며 기도하던 중 지진이 나 옥문이 열리는 일을 겪었다.",
    refs:"사도행전 15~18장"},
  {name:"요한마가", category:"사도의 제자", icon:"📖", color:["#7fb3d5","#4a7fa5"], figure:{hair:"short",mood:"gentle"},
    related:[{"name":"바울","reason":"선교 여행 중 갈등이 있었으나 훗날 다시 신임을 얻음"},{"name":"바나바","reason":"조카(외삼촌-조카 관계)"}],
    gender:"남",
    summary:"바나바의 조카로, 바울의 1차 선교 여행에 동행했다가 도중에 돌아가 버려 훗날 바울과 바나바가 갈라서는 원인이 되었다. 나중에는 바울에게도 '나의 일에 유익'하다는 인정을 받았고, 마가복음을 기록했다고 전해진다.",
    refs:"사도행전 12~13장, 15장, 디모데후서 4장"},
  {name:"야고보(예수의 동생)", category:"초대교회", icon:"✉️", color:["#a7c7e7","#5b7fa6"], figure:{hair:"short",beard:"long",mood:"wise"},
    related:[{"name":"마리아","reason":"어머니"}],
    gender:"남",
    summary:"예수의 육신의 동생으로, 예수가 활동하던 초기에는 믿지 않았으나 부활한 예수를 만난 뒤 예루살렘 교회의 지도자가 되었다. 이방인 신자에게 할례를 요구하지 말자는 예루살렘 공의회 결론을 이끌었고, 야고보서를 기록했다고 전해진다.",
    refs:"사도행전 15장, 야고보서"},
  {name:"가룟유다", category:"제자·사도", icon:"🪙", color:["#9a94b5","#5b4a7a"], figure:{hair:"short",beard:"short",mood:"sorrow"},
    gender:"남",
    summary:"열두 제자 중 회계를 맡았던 인물로, 은 삼십에 예수를 대제사장들에게 팔아넘겼다. 예수가 정죄받는 것을 보고 후회해 은을 돌려주려 했지만 받아들여지지 않았고, 결국 스스로 목숨을 끊었다.",
    refs:"마태복음 26~27장"},
  {name:"빌립(사도)", category:"제자·사도", icon:"🐟", color:["#7fb3d5","#4a7fa5"], figure:{hair:"short",beard:"short",mood:"gentle"},
    gender:"남",
    summary:"열두 제자 중 하나로, 오병이어 사건에서 예수가 '이 사람들을 먹일 떡을 어디서 사겠느냐' 묻자 이백 데나리온으로도 부족하다고 답했다. 그리스 말을 쓰는 이방인들이 예수를 뵙고 싶어 하자 안드레와 함께 그들을 예수께 데려갔다.",
    refs:"요한복음 1장, 6장, 12장"},
];

/* ---------- 성경 장소 색인 ----------
   여러 성경 지명 사전에서 공통으로 확인되는 위치·역할 정도만 담았고, 정확한
   현대 좌표나 특정 학설처럼 논쟁적인 내용은 넣지 않았다. */
const PLACES = [
  {name:"예루살렘", category:"도시", icon:"🏛️", color:["#e0b04c","#8b5cf6"],
    summary:"유다 산지에 있는 성으로, 다윗이 정복해 이스라엘의 수도로 삼았고 이후 솔로몬이 성전을 세웠다. 예수가 십자가에 못박히고 부활한 곳이며, 구약과 신약을 통틀어 가장 자주 등장하는 도시다.",
    refs:"사무엘하 5장, 열왕기상 6~8장, 마태복음 21~28장"},
  {name:"베들레헴", category:"도시", icon:"⭐", color:["#e0b04c","#4a8f4a"],
    summary:"예루살렘 남쪽의 작은 마을로, 다윗의 고향(에브라다)이며 미가서의 예언대로 예수가 태어난 곳이다.",
    refs:"룻기, 미가 5장, 마태복음 2장, 누가복음 2장"},
  {name:"나사렛", category:"도시", icon:"🏡", color:["#7fb3d5","#4a7fa5"],
    summary:"갈릴리 지방의 마을로, 예수가 어린 시절을 보낸 고향이다. 구약에는 언급이 없을 만큼 작은 동네였다.",
    refs:"마태복음 2장, 누가복음 1~2장, 4장"},
  {name:"가버나움", category:"도시", icon:"⛵", color:["#4dd4ff","#5e7bff"],
    summary:"갈릴리 호수 북쪽 연안의 마을로, 예수가 공생애 동안 활동 거점으로 삼았다. 베드로의 집이 있던 곳으로 전해진다.",
    refs:"마태복음 4장, 8장, 마가복음 1~2장"},
  {name:"여리고", category:"도시", icon:"🧱", color:["#ffb199","#e0577a"],
    summary:"요단강 서쪽의 오래된 성읍으로, 여호수아가 이끄는 이스라엘이 가나안 정착 초기에 정복했다. 예수 시대에는 삭개오를 만난 곳, 맹인을 고친 곳으로 등장한다.",
    refs:"여호수아 6장, 누가복음 19장"},
  {name:"갈릴리", category:"지역", icon:"🌄", color:["#7dff8f","#4a8f4a"],
    summary:"이스라엘 북부의 지방으로, 예수가 자라고 사역 대부분을 펼친 무대다. 나사렛·가버나움·가나 등이 이 지역에 속한다.",
    refs:"마태복음 4장, 누가복음 4장"},
  {name:"갈릴리 호수", category:"강·호수", icon:"🌊", color:["#4dd4ff","#5e7bff"],
    summary:"게네사렛 호수, 디베랴 바다로도 불리는 갈릴리 지방의 담수호. 예수가 풍랑을 잠잠케 하고 물 위를 걸었으며, 여러 제자가 이 호수에서 어부로 살았다.",
    refs:"마태복음 4장, 8장, 14장"},
  {name:"사해", category:"강·호수", icon:"🧂", color:["#ffe15e","#ff9d5e"],
    summary:"염분 농도가 매우 높아 생물이 거의 살지 못하는 호수로, 이스라엘과 요르단 사이 저지대에 있다. 요단강이 흘러드는 종착점이며, 인근에 소돔과 고모라가 있었다고 전해진다.",
    refs:"창세기 14장, 19장"},
  {name:"요단강", category:"강·호수", icon:"💧", color:["#4dd4ff","#7dff8f"],
    summary:"갈릴리 호수에서 사해로 흐르는 강으로, 여호수아 때 이스라엘 백성이 가나안 땅에 들어가며 건넜다. 예수가 세례 요한에게 세례를 받은 곳이기도 하다.",
    refs:"여호수아 3장, 마태복음 3장"},
  {name:"감람산", category:"산", icon:"🫒", color:["#7dff8f","#c8ff5e"],
    summary:"올리브산이라고도 하며, 예루살렘 동쪽에 있는 언덕이다. 예수가 자주 기도하러 올랐고, 겟세마네 동산이 이 산자락에 있으며, 승천한 곳으로 기록된다.",
    refs:"누가복음 22장, 사도행전 1장"},
  {name:"시내산", category:"산", icon:"⛰️", color:["#d16bff","#ff6bd8"],
    summary:"모세가 하나님께 십계명을 받은 산으로, 출애굽한 이스라엘 백성이 광야 여정 중 도착해 오래 머물렀다.",
    refs:"출애굽기 19~20장"},
  {name:"애굽", category:"나라", icon:"🐫", color:["#ffd166","#ff9d5e"],
    summary:"요셉이 총리가 되어 형제들을 불러들인 나라이자, 훗날 이스라엘 백성이 노예 생활을 하다 모세를 통해 탈출한 나라다. 헤롯을 피해 아기 예수 가족이 잠시 피신한 곳이기도 하다.",
    refs:"창세기 37~50장, 출애굽기 1~14장, 마태복음 2장"},
  {name:"바벨론", category:"나라", icon:"🏯", color:["#c8a2ff","#8b5cf6"],
    summary:"신바벨론 제국의 수도로, 유다가 멸망한 뒤 다니엘을 비롯한 많은 백성이 포로로 끌려간 곳이다.",
    refs:"열왕기하 25장, 다니엘 1장"},
  {name:"앗수르", category:"나라", icon:"⚔️", color:["#ff6b6b","#c15e5e"],
    summary:"북이스라엘을 정복해 멸망시킨 제국으로, 요나가 회개를 선포하러 간 니느웨가 이 제국의 수도였다.",
    refs:"열왕기하 17장, 요나서"},
  {name:"페르시아", category:"나라", icon:"👑", color:["#ffe15e","#e0b04c"],
    summary:"바벨론을 무너뜨린 뒤 고레스 왕의 칙령으로 포로로 끌려갔던 유대인들의 귀환과 성전 재건을 허락한 제국. 에스더서의 배경이다.",
    refs:"에스라 1장, 에스더서"},
  {name:"가나안", category:"지역", icon:"🗺️", color:["#7dff8f","#4dd4ff"],
    summary:"하나님이 아브라함과 그 후손에게 주겠다고 약속하신 땅으로, 훗날 이스라엘 열두 지파가 정착했다.",
    refs:"창세기 12장, 여호수아 11~21장"},
  {name:"다메섹", category:"도시", icon:"🏙️", color:["#4dd4ff","#5e7bff"],
    summary:"시리아 지역의 오래된 도시로, 사울(바울)이 그리스도인을 잡으러 가던 길에 부활한 예수를 만나 회심한 곳이다.",
    refs:"사도행전 9장"},
  {name:"안디옥", category:"도시", icon:"🕊️", color:["#ffb199","#e0577a"],
    summary:"시리아 지역의 도시로, 예수를 믿는 사람들이 처음으로 '그리스도인'이라 불리기 시작한 곳이며 바울 선교 여행의 출발 기지였다.",
    refs:"사도행전 11장, 13장"},
  {name:"에베소", category:"도시", icon:"🏺", color:["#7fb3d5","#4a7fa5"],
    summary:"소아시아(지금의 튀르키예)의 항구 도시로, 바울이 오래 머물며 사역했다. 바울이 이 도시의 교회에 보낸 편지가 에베소서다.",
    refs:"사도행전 19장, 에베소서"},
  {name:"빌립보", category:"도시", icon:"🏟️", color:["#d16bff","#ff6bd8"],
    summary:"마케도니아(그리스 북부)의 로마 식민 도시로, 바울이 유럽 땅에서 처음 교회를 세운 곳이다.",
    refs:"사도행전 16장, 빌립보서"},
  {name:"고린도", category:"도시", icon:"⚓", color:["#4dd4ff","#7dff8f"],
    summary:"그리스의 상업 항구 도시로, 바울이 오래 머물며 사역했다. 문제가 많았던 이 교회에 보낸 편지가 고린도전후서다.",
    refs:"사도행전 18장, 고린도전후서"},
  {name:"로마", category:"나라", icon:"🏟️", color:["#ff6b6b","#ffd166"],
    summary:"로마 제국의 수도로, 바울이 재판을 받기 위해 압송되어 마지막까지 머물며 복음을 전했다.",
    refs:"사도행전 28장, 로마서"},
  {name:"아덴", category:"도시", icon:"🏛️", color:["#ffffff","#bfe9ff"],
    summary:"그리스 철학의 중심지 아테네로, 바울이 아레오바고 언덕에서 알지 못하는 신에 대해 설교했다.",
    refs:"사도행전 17장"},
  {name:"소돔과 고모라", category:"도시", icon:"🔥", color:["#ff6b6b","#8b5cf6"],
    summary:"사해 부근에 있었던 것으로 전해지는 두 성읍으로, 죄악이 가득해 하나님의 심판으로 멸망했다. 롯의 가족이 탈출했다.",
    refs:"창세기 18~19장"},
  {name:"브엘세바", category:"도시", icon:"🏕️", color:["#ffe15e","#ff9d5e"],
    summary:"가나안 남쪽 경계의 성읍으로, 아브라함과 이삭이 우물을 파고 머물렀던 곳이다.",
    refs:"창세기 21장, 26장"},
  {name:"헤브론", category:"도시", icon:"🕳️", color:["#e0b04c","#8b5cf6"],
    summary:"아브라함이 막벨라 굴을 사서 사라를 장사한 곳이며, 다윗이 처음 유다의 왕으로 기름부음을 받은 도시다.",
    refs:"창세기 23장, 사무엘하 2장"},
  {name:"실로", category:"도시", icon:"⛺", color:["#7dff8f","#c8ff5e"],
    summary:"가나안 정착 초기에 성막(회막)이 오랫동안 세워져 있던 곳으로, 사사 시대 이스라엘 예배의 중심지였다.",
    refs:"여호수아 18장, 사무엘상 1~4장"},
  {name:"사마리아", category:"지역", icon:"🏞️", color:["#d16bff","#ff6bd8"],
    summary:"북이스라엘의 수도였던 도시이자 그 일대 지역의 이름으로, 예수 시대에는 유대인과 사마리아인 사이의 갈등의 배경이 되었다(수가성 우물가의 여인 이야기).",
    refs:"열왕기상 16장, 요한복음 4장"},
  {name:"모압", category:"나라", icon:"🌾", color:["#e0b04c","#4a8f4a"],
    summary:"사해 동쪽에 있던 나라로, 룻의 고향이며 이스라엘과 여러 차례 대립했다.",
    refs:"룻기, 민수기 22장"},
  {name:"블레셋", category:"지역", icon:"🛡️", color:["#ff6b6b","#c15e5e"],
    summary:"지중해 연안 지역에 살던 민족으로, 삼손과 다윗·골리앗 이야기 등 이스라엘과 잦은 전쟁을 벌인 배경이 된다.",
    refs:"사사기 13~16장, 사무엘상 17장"},
  {name:"니느웨", category:"도시", icon:"🐟", color:["#4dd4ff","#5e7bff"],
    summary:"앗수르 제국의 수도로, 요나가 하나님의 명령을 피해 도망갔다가 결국 가서 회개를 선포한 곳이다.",
    refs:"요나서"},
];

function chosung(ch){
  const code = (ch||"").charCodeAt(0) - 0xAC00;
  if(code < 0 || code > 11171) return null;
  const CHO = ["ㄱ","ㄲ","ㄴ","ㄷ","ㄸ","ㄹ","ㅁ","ㅂ","ㅃ","ㅅ","ㅆ","ㅇ","ㅈ","ㅉ","ㅊ","ㅋ","ㅌ","ㅍ","ㅎ"];
  return CHO[Math.floor(code / 588)];
}

/* ---------- 인물 아바타 일러스트 (원본 디자인) ----------
   실제 생김새를 알 수 없으므로 사실적 초상화가 아니라, 머리·수염 스타일과
   표정(눈썹 각도·입 모양)을 조합해 성격이 드러나도록 그린 단순한 캐릭터
   일러스트다. 색상은 인물별 color, 역할 아이콘은 icon을 뱃지로 함께 쓴다. */
const MOOD_PATHS = {
  warm:    { browRotL:-6,  browRotR:6,   mouth:"M40,58 Q50,65 60,58" },
  gentle:  { browRotL:-3,  browRotR:3,   mouth:"M41,58 Q50,63 59,58" },
  wise:    { browRotL:-8,  browRotR:2,   mouth:"M42,59 Q50,60 58,59" },
  serious: { browRotL:8,   browRotR:-8,  mouth:"M41,60 L59,60" },
  bold:    { browRotL:6,   browRotR:-6,  mouth:"M40,60 L60,60" },
  sorrow:  { browRotL:-10, browRotR:10,  mouth:"M41,62 Q50,57 59,62" },
  joyful:  { browRotL:-10, browRotR:10,  mouth:"M38,57 Q50,70 62,57" },
};
const SKIN = "#dba876";
const HAIR_COLOR = "#3d2a1e";
const VEIL_COLOR = "#8b6f9e";

function personAvatarSVG(p){
  const f = p.figure || {};
  const mood = MOOD_PATHS[f.mood] || MOOD_PATHS.gentle;
  const [c1,c2] = p.color;
  const gradId = "grad-" + p.name.replace(/[^\w가-힣]/g,"");

  let hairShape = "";
  if(f.hair === "short"){
    hairShape = `<path d="M27,40 Q30,15 50,15 Q70,15 73,40 Q73,28 50,26 Q27,28 27,40 Z" fill="${HAIR_COLOR}"/>`;
  } else if(f.hair === "long"){
    hairShape = `<path d="M25,66 Q22,16 50,14 Q78,16 75,66 Q75,44 68,40 Q66,28 50,26 Q34,28 32,40 Q25,44 25,66 Z" fill="${HAIR_COLOR}"/>`;
  } else if(f.hair === "veil"){
    hairShape = `<path d="M20,78 Q16,20 50,14 Q84,20 80,78 Q80,50 50,48 Q20,50 20,78 Z" fill="${VEIL_COLOR}"/>`;
  }

  let beardShape = "";
  if(f.beard === "short"){
    beardShape = `<path d="M36,54 Q36,68 50,70 Q64,68 64,54 Q64,64 50,66 Q36,64 36,54 Z" fill="${HAIR_COLOR}"/>`;
  } else if(f.beard === "long"){
    beardShape = `<path d="M33,52 Q31,80 50,86 Q69,80 67,52 Q67,74 50,78 Q33,74 33,52 Z" fill="${HAIR_COLOR}"/>`;
  }

  return `
  <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="${gradId}" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/>
      </linearGradient>
    </defs>
    <circle cx="50" cy="50" r="50" fill="${gradId ? `url(#${gradId})` : c1}"/>
    <path d="M14,100 Q14,72 50,70 Q86,72 86,100 Z" fill="#fff" opacity=".9"/>
    <path d="M14,100 Q14,72 50,70 Q86,72 86,100 Z" fill="url(#${gradId})"/>
    <rect x="43" y="58" width="14" height="14" fill="${SKIN}"/>
    <circle cx="50" cy="42" r="23" fill="${SKIN}"/>
    ${f.hair === "long" || f.hair === "veil" ? hairShape : ""}
    ${beardShape}
    <g stroke="#2b2420" stroke-width="2.4" stroke-linecap="round">
      <line x1="37" y1="36" x2="45" y2="34" transform="rotate(${mood.browRotL} 41 35)"/>
      <line x1="55" y1="34" x2="63" y2="36" transform="rotate(${mood.browRotR} 59 35)"/>
    </g>
    <circle cx="42" cy="41" r="2.3" fill="#2b2420"/>
    <circle cx="58" cy="41" r="2.3" fill="#2b2420"/>
    <path d="${mood.mouth}" fill="none" stroke="#7a4a3a" stroke-width="2.2" stroke-linecap="round"/>
    ${f.hair === "short" ? hairShape : ""}
    <circle cx="80" cy="80" r="15" fill="${c2}" stroke="#fff" stroke-width="3"/>
    <text x="80" y="86" font-size="15" text-anchor="middle">${p.icon}</text>
  </svg>`;
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
    const lsKey = "chapterBackup_" + cacheKey;
    let data, usedBackup = false;
    try{
      const url = `https://bolls.life/get-text/${encodeURIComponent(translation)}/${bookId}/${chapter}/`;
      data = await this._fetchJson(url);
      LS.set(lsKey, data); // 성공한 응답은 통신이 안 될 때를 대비해 기기에 그대로 저장해둔다
    }catch(liveErr){
      // 안전장치: ① 예전에 성공해서 기기에 저장해 둔 응답, ② 이 사이트와 함께 배포된
      // 정적 백업(bible-backup/, GitHub Actions가 주기적으로 채워둠) 순서로 시도한다.
      const lsCached = LS.get(lsKey, null);
      if(lsCached){
        data = lsCached; usedBackup = true;
      } else {
        try{
          const backupUrl = `bible-backup/${encodeURIComponent(translation)}/${bookId}/${chapter}.json`;
          const res = await fetch(backupUrl);
          if(!res.ok) throw new Error(`백업도 없음 (HTTP ${res.status})`);
          data = await res.json();
          usedBackup = true;
        }catch(backupErr){
          throw liveErr; // 원인 파악이 되도록 원래(실시간 호출) 에러를 보여준다
        }
      }
    }
    if(!Array.isArray(data) || data.length===0) throw new Error(`빈 응답 — ${translation} ${bookId}:${chapter}`);
    const result = data.map(v => ({ verse: v.verse ?? v.pk ?? "", text: (v.text||"").replace(/<[^>]+>/g,"") }));
    result._fromBackup = usedBackup;
    this._chapterCache.set(cacheKey, result);
    return result;
  },
  _normalizeSearchText(s){
    return (s||"").replace(/[\s.,!?;:'"“”‘’·\-–—()[\]]/g, "").toLowerCase();
  },

  _searchIndexCache: new Map(),
  /* 실시간 검색(v2/find)이 안 될 때의 안전장치: bible-backup/에 미리 받아둔
     번역본 전체 본문을 하나로 합친 검색 인덱스를 받아 브라우저에서 직접 훑는다.
     (scripts/build_search_index.mjs가 만들어 두고, 첫 성공 후엔 메모리에 캐시) */
  async _searchLocalIndex(translation, query){
    let index = this._searchIndexCache.get(translation);
    if(!index){
      const res = await fetch(`bible-backup/${encodeURIComponent(translation)}/search-index.json`);
      if(!res.ok) throw new Error(`검색 인덱스 없음 (HTTP ${res.status})`);
      index = await res.json();
      this._searchIndexCache.set(translation, index);
    }
    const qNorm = this._normalizeSearchText(query);
    const result = [];
    for(const [bookIdx, chapter, verse, text] of index){
      if(this._normalizeSearchText(text).includes(qNorm)) result.push({ bookIdx, chapter, verse, text });
    }
    return result;
  },

  _vocabCache: new Map(),
  /* 검색 결과가 없을 때 "추천 단어"를 실제 성경 어휘에서 뽑기 위한 목록.
     로컬 인덱스를 공백 기준으로 토큰화해 자주 나오는 순으로 상위 N개만 쓴다
     (조사가 붙은 형태 그대로라 "아들이라"처럼 실제 검색어와 맞아떨어진다). */
  async _getVocabulary(translation){
    if(this._vocabCache.has(translation)) return this._vocabCache.get(translation);
    let index = this._searchIndexCache.get(translation);
    if(!index){
      const res = await fetch(`bible-backup/${encodeURIComponent(translation)}/search-index.json`);
      if(!res.ok) throw new Error(`검색 인덱스 없음 (HTTP ${res.status})`);
      index = await res.json();
      this._searchIndexCache.set(translation, index);
    }
    const counts = new Map();
    const stripRe = /[.,!?;:'"“”‘’·\-–—()[\]0-9]/g;
    for(const [, , , text] of index){
      text.split(/\s+/).forEach(tok=>{
        const w = tok.replace(stripRe, "");
        if(w.length >= 2) counts.set(w, (counts.get(w)||0)+1);
      });
    }
    const vocab = [...counts.entries()].sort((a,b)=> b[1]-a[1]).slice(0,3000).map(e=>e[0]);
    this._vocabCache.set(translation, vocab);
    return vocab;
  },

  async search(translation, query){
    const cacheKey = `${translation}:${query}`;
    if(this._searchCache.has(cacheKey)) return this._searchCache.get(cacheKey);
    const qNorm = this._normalizeSearchText(query);
    let result = [], liveErr = null;
    try{
      // match_case=false, match_whole=false 조합은 "벡터 유사도" 검색이 되어(bolls.life
      // 공식 문서 확인) 뜻이 비슷하기만 해도 걸리고(과거 오탐 버그의 원인), 일부
      // 번역본(KRV 포함)에서는 검색 인덱스가 없는지 match_whole=true 로도 여전히
      // HTTP 400을 돌려주거나, 아예 조용히 빈 결과만 돌려준다(예: "내아들이라"
      // 같은 붙여쓴 구절은 단어 단위 매칭에 걸리지 않는다).
      const url = `https://bolls.life/v2/find/${encodeURIComponent(translation)}?search=${encodeURIComponent(query)}&match_case=false&match_whole=true`;
      const data = await this._fetchJson(url);
      const list = Array.isArray(data) ? data : (data.results||[]);
      const mapped = list.map(v => ({
        bookIdx: (v.book ?? v.book_id ?? 1)-1,
        chapter: v.chapter, verse: v.verse,
        text: (v.text||"").replace(/<[^>]+>/g,"")
      }));
      // API가 검색어를 단어 단위로 느슨하게 매칭해, 단어 하나만 우연히 겹쳐도
      // (예: "술 마시지 마라" → 지명 "마라"만 있는 구절) 결과에 섞여 나온다.
      // 띄어쓰기·문장부호 차이는 무시하고, 검색어가 실제 본문에 그대로(순서대로)
      // 붙어서 들어있는 구절만 정확한 결과로 남긴다.
      result = mapped.filter(v => this._normalizeSearchText(v.text).includes(qNorm));
    }catch(err){
      liveErr = err;
    }
    let usedFallback = false;
    if(result.length === 0){
      // 실시간이 아예 실패했거나(오류), 성공했지만 못 찾은 경우(단어 단위
      // 매칭의 한계) 모두 여기서 저장해둔 본문 전체를 직접 훑어 보완한다.
      // KRV는 사실상 이 경로가 주 검색 역할을 한다.
      try{
        result = await this._searchLocalIndex(translation, query);
        usedFallback = true;
      }catch(fallbackErr){
        if(liveErr) throw liveErr; // 원인 파악이 되도록 원래(실시간 호출) 에러를 보여준다
        // 실시간은 성공(그냥 0건)했는데 로컬 인덱스만 못 받아온 경우는 0건 그대로 둔다
      }
    }
    result._fromBackup = usedFallback;
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
  document.querySelectorAll(".js-theme-choice").forEach(btn=>{
    btn.classList.toggle("active", btn.dataset.themeChoice === (state.darkMode ? "dark" : "light"));
  });
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
document.querySelectorAll(".js-theme-choice").forEach(btn=>{
  btn.addEventListener("click", ()=> setDarkMode(btn.dataset.themeChoice === "dark"));
});

document.getElementById("btn-share").addEventListener("click", async ()=>{
  const url = location.href;
  try{
    if(navigator.clipboard && navigator.clipboard.writeText){
      await navigator.clipboard.writeText(url);
    } else {
      const ta = document.createElement("textarea");
      ta.value = url; ta.style.position = "fixed"; ta.style.opacity = "0";
      document.body.appendChild(ta); ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    toast("링크가 복사되었습니다");
  }catch(err){
    console.error(err);
    toast("복사에 실패했습니다");
  }
});
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
    if(verses._fromBackup) toast("실시간 서버에 연결이 안 돼 저장된 본문을 보여드려요");
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

/* 실제 불꽃놀이처럼: 화면 정중앙에서 한 번에 터져 화면 전체로 천천히 퍼졌다가 서서히 사라진다 */
function spawnConfetti(){
  const canvas = document.createElement("canvas");
  canvas.style.cssText = "position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:9999;";
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const W = window.innerWidth, H = window.innerHeight;
  canvas.width = W*dpr; canvas.height = H*dpr;
  document.body.appendChild(canvas);
  const ctx = canvas.getContext("2d");
  ctx.scale(dpr, dpr);

  const GRAVITY = 0.005;
  const FRICTION = 0.995;
  const PALETTES = [
    ["#ff6b6b","#ffd166"], ["#4dd4ff","#5e7bff"], ["#d16bff","#ff6bd8"],
    ["#7dff8f","#c8ff5e"], ["#ffe15e","#ff9d5e"], ["#ffffff","#bfe9ff"]
  ];

  const cx = W/2, cy = H/2;
  const maxDist = Math.hypot(W,H)/2 + 30;

  let pieces = [];

  function burst(colors, delay){
    setTimeout(()=>{
      const n = 90 + Math.floor(Math.random()*40);
      for(let i=0;i<n;i++){
        const angle = (Math.PI*2*i)/n + Math.random()*0.3;
        const speed = (maxDist/200) * (0.45+Math.random()*0.75);
        pieces.push({
          x: cx, y: cy, vx: Math.cos(angle)*speed, vy: Math.sin(angle)*speed,
          color: colors[i%colors.length], life: 1,
          decay: 0.0011 + Math.random()*0.0009,
          size: 5 + Math.random()*5,
          rot: Math.random()*Math.PI*2,
          rotSpeed: (Math.random()-0.5)*0.35,
          round: Math.random()<0.4 // 꽃가루처럼 둥근 조각과 각진 색종이 조각을 섞는다
        });
      }
    }, delay);
  }

  // 색이 다른 팔레트 2~3개를 살짝 시차를 두고 같은 중심에서 터뜨려 화면 전체를 채운다
  const shuffled = [...PALETTES].sort(()=>Math.random()-0.5);
  const layerCount = 2 + Math.floor(Math.random()*2);
  for(let i=0;i<layerCount;i++) burst(shuffled[i], i*120);

  const startTime = performance.now();
  const maxDuration = 16000;

  function frame(now){
    const t = now - startTime;
    ctx.clearRect(0,0,W,H);

    pieces.forEach(p=>{
      p.vy += GRAVITY;
      p.vx *= FRICTION; p.vy *= FRICTION;
      p.x += p.vx; p.y += p.vy;
      p.rot += p.rotSpeed;
      p.life -= p.decay;
    });
    pieces = pieces.filter(p=>p.life>0);

    pieces.forEach(p=>{
      const alpha = Math.max(0, p.life);
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.scale(Math.cos(p.rot), 1); // 종이·꽃잎이 뒤집히며 팔랑이는 느낌
      ctx.fillStyle = hexToRgba(p.color, alpha);
      if(p.round){
        ctx.beginPath();
        ctx.ellipse(0, 0, p.size/2, p.size/3, 0, 0, Math.PI*2);
        ctx.fill();
      } else {
        ctx.fillRect(-p.size/2, -p.size/3, p.size, p.size*0.66);
      }
      ctx.restore();
    });

    if(t < maxDuration || pieces.length){
      requestAnimationFrame(frame);
    } else {
      canvas.remove();
    }
  }
  requestAnimationFrame(frame);
}

function hexToRgba(hex, alpha){
  const h = hex.replace("#","");
  const r = parseInt(h.substring(0,2),16);
  const g = parseInt(h.substring(2,4),16);
  const b = parseInt(h.substring(4,6),16);
  return `rgba(${r},${g},${b},${alpha})`;
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
/* 검색 결과 없음 안내에 쓸 원본 일러스트 (책 + 돋보기, 특정 캐릭터 아님) */
function emptySearchIllustrationSVG(){
  return `<svg viewBox="0 0 120 90" width="120" height="90" fill="none" stroke="currentColor"
    stroke-width="3" stroke-linecap="round" stroke-linejoin="round" opacity="0.5">
    <path d="M10 20 C 30 12, 50 12, 58 20 L 58 68 C 50 60, 30 60, 10 68 Z"/>
    <path d="M106 20 C 86 12, 66 12, 58 20 L 58 68 C 66 60, 86 60, 106 68 Z"/>
    <line x1="20" y1="28" x2="46" y2="24"/>
    <line x1="20" y1="38" x2="46" y2="34"/>
    <line x1="20" y1="48" x2="46" y2="44"/>
    <circle cx="88" cy="46" r="14" stroke-width="3.5"/>
    <line x1="98" y1="56" x2="110" y2="68" stroke-width="4"/>
  </svg>`;
}

/* 구약(창세기~말라기)은 0~38번, 신약(마태복음~요한계시록)은 39~65번 */
function isOldTestament(bookIdx){ return bookIdx < 39; }

let lastSearchResults = [];
let lastSearchQuery = "";
let searchTestamentFilter = ""; // "" | "OT" | "NT"
let searchChosungFilter = null;

async function doSearch(){
  const q = document.getElementById("search-input").value.trim();
  const wrap = document.getElementById("search-results");
  const testamentSeg = document.getElementById("search-testament-seg");
  const chosungWrap = document.getElementById("search-chosung-filter");
  if(!q){
    wrap.innerHTML=""; testamentSeg.style.display="none"; chosungWrap.innerHTML="";
    return;
  }
  wrap.innerHTML = '<div class="empty">검색 중…</div>';
  testamentSeg.style.display = "none";
  chosungWrap.innerHTML = "";
  try{
    lastSearchResults = await BibleAPI.search(state.translation, q);
    lastSearchQuery = q;
    searchTestamentFilter = ""; searchChosungFilter = null;
    document.querySelectorAll("#search-testament-seg .seg-btn").forEach(b=> b.classList.toggle("active", b.dataset.testament===""));
    if(lastSearchResults.length===0){
      renderSearchResultsList();
      return;
    }
    testamentSeg.style.display = "flex";
    renderSearchChosungFilter();
    renderSearchResultsList();
    if(lastSearchResults._fromBackup) toast("실시간 서버에 연결이 안 돼 저장된 본문에서 찾았어요");
  }catch(err){
    console.error(err);
    setText("api-debug", "마지막 오류(검색): "+err.message);
    wrap.innerHTML = `<div class="empty" style="text-align:center;">
      <div style="margin-bottom:8px;">${emptySearchIllustrationSVG()}</div>
      <div>검색 중 문제가 생겼어요.</div>
      <div class="muted" style="margin-top:6px;font-size:.88em;">잠시 후 다시 시도해주세요.</div>
      <button class="btn small ghost" id="search-retry-btn" style="margin-top:12px;">다시 시도</button>
    </div>`;
    document.getElementById("search-retry-btn").addEventListener("click", doSearch);
  }
}

function renderSearchChosungFilter(){
  const wrap = document.getElementById("search-chosung-filter");
  const base = lastSearchResults.filter(r=>
    !searchTestamentFilter || (searchTestamentFilter==="OT") === isOldTestament(r.bookIdx));
  renderChosungFilter(wrap, base, r=> BOOKS[r.bookIdx][0], searchChosungFilter, c=>{
    searchChosungFilter = c; renderSearchChosungFilter(); renderSearchResultsList();
  });
}

/* 검색 결과 구절에서 검색어에 해당하는 부분을 <mark>로 감싼다. 띄어쓰기·
   문장부호가 검색어와 본문에서 다를 수 있으니(예: "취하지말라"↔"취하지 말라"),
   먼저 그대로 찾아보고 안 되면 정규화한 위치를 원문 위치로 되짚어 감싼다. */
function highlightMatch(text, query){
  if(!query) return escapeHtml(text);
  const lowerText = text.toLowerCase(), lowerQuery = query.toLowerCase();
  const idx = lowerText.indexOf(lowerQuery);
  if(idx !== -1){
    return escapeHtml(text.slice(0,idx))
      + '<mark class="hl">' + escapeHtml(text.slice(idx, idx+query.length)) + '</mark>'
      + escapeHtml(text.slice(idx+query.length));
  }
  const stripRe = /[\s.,!?;:'"“”‘’·\-–—()[\]]/;
  const map = [];
  let normalized = "";
  for(let i=0;i<text.length;i++){
    if(!stripRe.test(text[i])){ normalized += text[i].toLowerCase(); map.push(i); }
  }
  const qNorm = lowerQuery.replace(new RegExp(stripRe.source,"g"), "");
  const nIdx = qNorm ? normalized.indexOf(qNorm) : -1;
  if(nIdx === -1) return escapeHtml(text);
  const startOrig = map[nIdx], endOrig = map[nIdx+qNorm.length-1]+1;
  return escapeHtml(text.slice(0,startOrig))
    + '<mark class="hl">' + escapeHtml(text.slice(startOrig,endOrig)) + '</mark>'
    + escapeHtml(text.slice(endOrig));
}

async function renderSearchResultsList(){
  const wrap = document.getElementById("search-results");
  const q = lastSearchQuery;
  if(lastSearchResults.length===0){
    // 실제 성경 본문에서 뽑은 어휘와 비교해 추천한다(안 되면 큐레이션 목록으로 대신).
    let vocab = POPULAR_SEARCH_TERMS;
    try{ vocab = await BibleAPI._getVocabulary(state.translation); }catch(e){ /* 큐레이션 목록으로 대체 */ }
    const { terms: suggestions, isCloseMatch } = findSimilarTerms(q, 6, vocab);
    const hintText = isCloseMatch ? "혹시 이 단어를 찾으셨나요?" : "대신 이런 단어는 어때요?";
    wrap.innerHTML = `<div class="empty" style="text-align:center;">
      <div style="margin-bottom:8px;">${emptySearchIllustrationSVG()}</div>
      <div>"${escapeHtml(q)}"에 대한 검색 결과가 없습니다.</div>
      <div class="muted" style="margin-top:6px;font-size:.88em;">${hintText}</div>
      <div class="row wrap" id="search-suggestions" style="justify-content:center;gap:6px;margin-top:10px;"></div>
    </div>`;
    const sugWrap = document.getElementById("search-suggestions");
    suggestions.forEach(term=>{
      const b = document.createElement("button");
      b.className = "btn small ghost";
      b.textContent = term;
      b.addEventListener("click", ()=>{
        document.getElementById("search-input").value = term;
        doSearch();
      });
      sugWrap.appendChild(b);
    });
    return;
  }
  let results = lastSearchResults.filter(r=>
    !searchTestamentFilter || (searchTestamentFilter==="OT") === isOldTestament(r.bookIdx));
  if(searchChosungFilter) results = results.filter(r=> chosung(BOOKS[r.bookIdx][0][0]) === searchChosungFilter);
  // 창세기~요한계시록 순서(책 번호 -> 장 -> 절)로 항상 정렬
  results = [...results].sort((a,b)=> a.bookIdx-b.bookIdx || a.chapter-b.chapter || a.verse-b.verse);

  wrap.innerHTML = `<div class="muted" style="margin:0 4px 10px;font-size:.85em;">검색 결과 ${results.length}건</div>`;
  if(results.length===0){
    wrap.innerHTML += '<div class="card"><div class="empty">필터 조건에 맞는 결과가 없습니다.</div></div>';
    return;
  }
  const resultsWrap = document.createElement("div");
  results.slice(0,50).forEach(r=>{
    const bookName = BOOKS[r.bookIdx] ? BOOKS[r.bookIdx][0] : `책${r.bookIdx+1}`;
    const themeApp = pickThemeOrGeneric(r.text, r.bookIdx, r.chapter, r.verse);
    const div = document.createElement("div");
    div.className = "card";
    div.innerHTML = `<div class="passage-ref" style="font-size:1em;">${bookName} ${r.chapter}:${r.verse}</div>
      <div style="margin-top:4px;">${highlightMatch(r.text, q)}</div>
      <div class="muted" style="margin-top:8px;padding-top:8px;border-top:2px solid var(--border);font-size:.88em;">💭 생각해보기: ${escapeHtml(pickApplicationPrompt(r.bookIdx, r.chapter, r.verse))}</div>
      <div class="muted" style="margin-top:6px;font-size:.88em;">💡 이렇게도 생각해볼 수 있어요: ${escapeHtml(themeApp.thought)}</div>
      <div class="muted" style="margin-top:6px;font-size:.88em;">✅ 실천하기: ${escapeHtml(themeApp.action)}</div>`;
    resultsWrap.appendChild(div);
  });
  wrap.appendChild(resultsWrap);
}

document.querySelectorAll("#search-testament-seg .seg-btn").forEach(btn=>{
  btn.addEventListener("click", ()=>{
    searchTestamentFilter = btn.dataset.testament;
    document.querySelectorAll("#search-testament-seg .seg-btn").forEach(b=> b.classList.toggle("active", b===btn));
    searchChosungFilter = null;
    renderSearchChosungFilter();
    renderSearchResultsList();
  });
});

/* ---------- 검색 탭: 본문 검색 / 인물 / 장소 전환 ---------- */
document.querySelectorAll("#search-mode-seg .seg-btn").forEach(btn=>{
  btn.addEventListener("click", ()=>{
    const mode = btn.dataset.searchMode;
    document.querySelectorAll("#search-mode-seg .seg-btn").forEach(b=>{
      b.classList.toggle("active", b.dataset.searchMode === mode);
    });
    document.getElementById("search-mode-text").style.display = mode === "text" ? "block" : "none";
    document.getElementById("search-mode-people").style.display = mode === "people" ? "block" : "none";
    document.getElementById("search-mode-places").style.display = mode === "places" ? "block" : "none";
  });
});
document.querySelector('#search-mode-seg .seg-btn[data-search-mode="text"]').classList.add("active");

/* 초성별 인원/개수를 괄호로 표기한 색인 필터 버튼을 그린다 (인물·장소 색인 공용) */
function renderChosungFilter(wrap, items, getName, selectedChar, onSelect){
  const chars = [...new Set(items.map(it=> chosung(getName(it)[0])).filter(Boolean))].sort();
  wrap.innerHTML = "";
  const allBtn = document.createElement("button");
  allBtn.className = "chosung-btn" + (selectedChar===null ? " active" : "");
  allBtn.textContent = `전체 (${items.length})`;
  allBtn.addEventListener("click", ()=> onSelect(null));
  wrap.appendChild(allBtn);
  chars.forEach(c=>{
    const count = items.filter(it=> chosung(getName(it)[0]) === c).length;
    const b = document.createElement("button");
    b.className = "chosung-btn" + (selectedChar===c ? " active" : "");
    b.textContent = `${c} (${count})`;
    b.addEventListener("click", ()=> onSelect(c));
    wrap.appendChild(b);
  });
}

/* ---------- 성경 인물 색인 ---------- */
let peopleFilterChar = null;
let peopleGenderFilter = "";
let peopleCategoryFilter = null;

function renderPeopleFilters(){
  const base = PEOPLE.filter(p=> (!peopleGenderFilter || p.gender===peopleGenderFilter)
    && (!peopleCategoryFilter || p.category===peopleCategoryFilter));
  renderChosungFilter(document.getElementById("people-filter"), base, p=>p.name, peopleFilterChar, c=>{
    peopleFilterChar = c; renderPeopleFilters(); renderPeopleList();
  });
}

function renderPeopleCategoryFilter(){
  const wrap = document.getElementById("people-category-filter");
  const base = PEOPLE.filter(p=> (!peopleGenderFilter || p.gender===peopleGenderFilter)
    && (!peopleFilterChar || chosung(p.name[0])===peopleFilterChar));
  const cats = [...new Set(base.map(p=> p.category))].sort((a,b)=> a.localeCompare(b, "ko"));
  wrap.innerHTML = "";
  const allBtn = document.createElement("button");
  allBtn.className = "chosung-btn" + (peopleCategoryFilter===null ? " active" : "");
  allBtn.textContent = `전체 (${base.length})`;
  allBtn.addEventListener("click", ()=>{
    peopleCategoryFilter = null; renderPeopleCategoryFilter(); renderPeopleFilters(); renderPeopleList();
  });
  wrap.appendChild(allBtn);
  cats.forEach(cat=>{
    const count = base.filter(p=> p.category===cat).length;
    const b = document.createElement("button");
    b.className = "chosung-btn" + (peopleCategoryFilter===cat ? " active" : "");
    b.textContent = `${cat} (${count})`;
    b.addEventListener("click", ()=>{
      peopleCategoryFilter = cat; renderPeopleCategoryFilter(); renderPeopleFilters(); renderPeopleList();
    });
    wrap.appendChild(b);
  });
}

document.querySelectorAll("#people-gender-seg .seg-btn").forEach(btn=>{
  btn.addEventListener("click", ()=>{
    peopleGenderFilter = btn.dataset.gender;
    document.querySelectorAll("#people-gender-seg .seg-btn").forEach(b=> b.classList.toggle("active", b===btn));
    renderPeopleCategoryFilter();
    renderPeopleFilters();
    renderPeopleList();
  });
});

/* 필터 3종(성별·시대·초성)을 늘어놓으면 자리를 너무 차지해서, 다이얼로그로 감췄다 */
function updatePeopleFilterButtonLabel(){
  const activeCount = (peopleGenderFilter ? 1 : 0) + (peopleCategoryFilter ? 1 : 0) + (peopleFilterChar ? 1 : 0);
  document.getElementById("people-filter-btn").textContent = activeCount ? `🔍 필터 (${activeCount})` : "🔍 필터";
}

const peopleFilterDialog = document.getElementById("people-filter-dialog");
document.getElementById("people-filter-btn").addEventListener("click", ()=> peopleFilterDialog.showModal());
document.getElementById("people-filter-close").addEventListener("click", ()=> peopleFilterDialog.close());
document.getElementById("people-filter-apply").addEventListener("click", ()=> peopleFilterDialog.close());
peopleFilterDialog.addEventListener("click", (e)=>{ if(e.target === peopleFilterDialog) peopleFilterDialog.close(); });
document.getElementById("people-filter-reset").addEventListener("click", ()=>{
  peopleGenderFilter = ""; peopleCategoryFilter = null; peopleFilterChar = null;
  document.querySelectorAll("#people-gender-seg .seg-btn").forEach(b=> b.classList.toggle("active", b.dataset.gender===""));
  renderPeopleCategoryFilter();
  renderPeopleFilters();
  renderPeopleList();
});

function renderPeopleList(){
  updatePeopleFilterButtonLabel();
  const q = document.getElementById("people-search").value.trim();
  const wrap = document.getElementById("people-list");
  let list = PEOPLE;
  if(peopleGenderFilter) list = list.filter(p=> p.gender === peopleGenderFilter);
  if(peopleCategoryFilter) list = list.filter(p=> p.category === peopleCategoryFilter);
  if(peopleFilterChar) list = list.filter(p=> chosung(p.name[0]) === peopleFilterChar);
  if(q) list = list.filter(p=> p.name.includes(q) || p.summary.includes(q) || p.category.includes(q));
  list = [...list].sort((a,b)=> a.name.localeCompare(b.name, "ko"));
  if(list.length===0){ wrap.innerHTML = '<div class="card"><div class="empty">해당하는 인물이 없습니다.</div></div>'; return; }
  wrap.innerHTML = '<div class="card" id="people-rows"></div>';
  const rowsWrap = document.getElementById("people-rows");
  list.forEach(p=>{
    const row = document.createElement("div");
    row.className = "people-row";
    const relatedLine = (p.related && p.related.length)
      ? `<div class="muted" style="font-size:.8em;margin-top:2px;">관련: ${p.related.map(r=> escapeHtml(r.name)).join(", ")}</div>`
      : "";
    row.innerHTML = `<div class="mini-avatar">${personAvatarSVG(p)}</div>
      <div><div style="font-weight:700;">${escapeHtml(p.name)}</div><div class="muted" style="font-size:.85em;">${escapeHtml(p.category)}</div>${relatedLine}</div>`;
    row.addEventListener("click", ()=> openPersonDetail(p));
    rowsWrap.appendChild(row);
  });
}
document.getElementById("people-search").addEventListener("input", renderPeopleList);

const personDialog = document.getElementById("person-dialog");
/* "마태복음 4장, 8장, 마가복음 1~2장"처럼 쉼표로 나열된 refs 문자열에서
   장을 특정할 수 있는 부분을 전부 뽑는다. 책 이름 없이 "8장"만 있으면
   바로 앞에 나온 책이 이어지는 것으로 본다. 책 이름만 있거나(장 없음)
   "사무엘상~열왕기상"처럼 책 자체가 범위인 경우는 장을 특정할 수 없어
   건너뛰고 unparsed에 원문 그대로 남긴다. */
function parseAllChapterRefs(refsStr){
  const chapters = [], unparsed = [];
  if(!refsStr) return { chapters, unparsed };
  let curBookIdx = null, curBookName = null;
  refsStr.split(",").map(s=>s.trim()).filter(Boolean).forEach(seg=>{
    let m = seg.match(/^([가-힣]+)\s*(\d+)(?:[~-](\d+))?\s*장?$/);
    if(m){
      const bookIdx = BOOKS.findIndex(b=> b[0] === m[1]);
      if(bookIdx !== -1){
        curBookIdx = bookIdx; curBookName = m[1];
        const from = parseInt(m[2],10), to = m[3] ? parseInt(m[3],10) : from;
        for(let c=from; c<=to; c++) chapters.push({bookIdx, chapter:c, bookName:m[1]});
        return;
      }
    }
    m = seg.match(/^(\d+)(?:[~-](\d+))?\s*장$/);
    if(m && curBookIdx !== null){
      const from = parseInt(m[1],10), to = m[2] ? parseInt(m[2],10) : from;
      for(let c=from; c<=to; c++) chapters.push({bookIdx:curBookIdx, chapter:c, bookName:curBookName});
      return;
    }
    // "사무엘상~열왕기상"처럼 장 없이 책~책 범위인 경우: 정확한 장은 특정할 수
    // 없지만, 이야기가 시작되는 첫 책 1장이라도 보여주는 게 아무것도 안 보여
    // 주는 것보다 낫다.
    m = seg.match(/^([가-힣]+)\s*[~-]\s*([가-힣]+)$/);
    if(m){
      const bookIdx = BOOKS.findIndex(b=> b[0] === m[1]);
      if(bookIdx !== -1){
        curBookIdx = bookIdx; curBookName = m[1];
        chapters.push({bookIdx, chapter:1, bookName:m[1], rangeNote:seg});
        return;
      }
    }
    unparsed.push(seg);
  });
  return { chapters, unparsed };
}

/* 인물/장소 상세 다이얼로그의 "관련 본문" 아래에 실제 본문을 미리보기로 —
   장을 특정할 수 있는 인용은 전부 보여준다(첫 번째 것만이 아니라). */
async function renderVersePreview(containerId, refsStr){
  const box = document.getElementById(containerId);
  const { chapters, unparsed } = parseAllChapterRefs(refsStr);
  if(chapters.length === 0){
    box.innerHTML = `<div class="vp-title">본문 미리보기</div><div class="muted">인용된 장을 특정할 수 없어 여기서는 보여드릴 수 없어요. 위 관련 본문을 성경 본문 검색에서 직접 찾아보세요.</div>`;
    return;
  }
  box.innerHTML = `<div class="vp-title">본문 미리보기</div><div class="muted">불러오는 중…</div>`;
  const results = await Promise.allSettled(
    chapters.map(c => BibleAPI.getChapter(state.translation, c.bookIdx, c.chapter))
  );
  let html = `<div class="vp-title">본문 미리보기</div>`;
  results.forEach((r, i)=>{
    const c = chapters[i];
    const label = c.rangeNote
      ? `${escapeHtml(c.bookName)} ${c.chapter}장 (${escapeHtml(c.rangeNote)}에 걸친 이야기의 시작 부분)`
      : `${escapeHtml(c.bookName)} ${c.chapter}장`;
    html += `<div style="font-weight:700;margin-top:${i?12:0}px;margin-bottom:4px;">${label}</div>`;
    html += r.status === "fulfilled"
      ? r.value.map(v => `<div class="vp-verse"><span class="vp-num">${v.verse}</span>${escapeHtml(v.text)}</div>`).join("")
      : `<div class="muted">본문을 불러오지 못했습니다.</div>`;
  });
  if(unparsed.length){
    html += `<div class="muted" style="margin-top:12px;font-size:.85em;">그 외 참고 본문: ${escapeHtml(unparsed.join(", "))}</div>`;
  }
  box.innerHTML = html;
}

function openPersonDetail(p){
  const avatar = document.getElementById("person-avatar");
  avatar.style.background = "none";
  avatar.style.boxShadow = "none";
  avatar.innerHTML = personAvatarSVG(p);
  setText("person-name", p.name);
  setText("person-category", p.category);
  setText("person-summary", p.summary);
  setText("person-refs", "관련 본문: " + p.refs);
  const relatedWrap = document.getElementById("person-related");
  relatedWrap.innerHTML = "";
  (p.related||[]).forEach(r=>{
    const chip = document.createElement("span");
    chip.className = "related-chip";
    chip.textContent = `${r.name} — ${r.reason}`;
    const target = PEOPLE.find(pp=> pp.name === r.name);
    if(target){
      chip.style.cursor = "pointer";
      chip.addEventListener("click", ()=> openPersonDetail(target));
    }
    relatedWrap.appendChild(chip);
  });
  renderVersePreview("person-preview", p.refs);
  personDialog.showModal();
}
document.getElementById("person-close").addEventListener("click", ()=> personDialog.close());
personDialog.addEventListener("click", (e)=>{ if(e.target === personDialog) personDialog.close(); });

setText("people-criteria-note",
  `성경에는 이름이 나오는 사람이 1,000명이 넘지만, 이 색인에는 그중 실제 사건이나 ` +
  `행적이 본문에 남아있는 인물만 ${PEOPLE.length}명 골라 담았습니다. 족보에만 이름이 ` +
  `나오는("OO가 OO를 낳고") 인물은 넣지 않았어요.`);

renderPeopleCategoryFilter();
renderPeopleFilters();
renderPeopleList();

/* ---------- 성경 장소 색인 ---------- */
let placesFilterChar = null;
function renderPlacesFilters(){
  renderChosungFilter(document.getElementById("places-filter"), PLACES, pl=>pl.name, placesFilterChar, c=>{
    placesFilterChar = c; renderPlacesFilters(); renderPlacesList();
  });
}

function renderPlacesList(){
  const q = document.getElementById("places-search").value.trim();
  const wrap = document.getElementById("places-list");
  let list = PLACES;
  if(placesFilterChar) list = list.filter(pl=> chosung(pl.name[0]) === placesFilterChar);
  if(q) list = list.filter(pl=> pl.name.includes(q) || pl.summary.includes(q) || pl.category.includes(q));
  list = [...list].sort((a,b)=> a.name.localeCompare(b.name, "ko"));
  if(list.length===0){ wrap.innerHTML = '<div class="card"><div class="empty">해당하는 장소가 없습니다.</div></div>'; return; }
  wrap.innerHTML = '<div class="card" id="places-rows"></div>';
  const rowsWrap = document.getElementById("places-rows");
  list.forEach(pl=>{
    const row = document.createElement("div");
    row.className = "people-row";
    row.innerHTML = `<div class="mini-avatar" style="background:linear-gradient(135deg, ${pl.color[0]}, ${pl.color[1]});display:flex;align-items:center;justify-content:center;font-size:22px;">${pl.icon}</div>
      <div><div style="font-weight:700;">${escapeHtml(pl.name)}</div><div class="muted" style="font-size:.85em;">${escapeHtml(pl.category)}</div></div>`;
    row.addEventListener("click", ()=> openPlaceDetail(pl));
    rowsWrap.appendChild(row);
  });
}
document.getElementById("places-search").addEventListener("input", renderPlacesList);

const placeDialog = document.getElementById("place-dialog");
function openPlaceDetail(pl){
  const avatar = document.getElementById("place-avatar");
  avatar.style.background = `linear-gradient(135deg, ${pl.color[0]}, ${pl.color[1]})`;
  avatar.style.display = "flex";
  avatar.style.alignItems = "center";
  avatar.style.justifyContent = "center";
  avatar.style.fontSize = "48px";
  avatar.textContent = pl.icon;
  setText("place-name", pl.name);
  setText("place-category", pl.category);
  setText("place-summary", pl.summary);
  setText("place-refs", "관련 본문: " + pl.refs);
  renderVersePreview("place-preview", pl.refs);
  placeDialog.showModal();
}
document.getElementById("place-close").addEventListener("click", ()=> placeDialog.close());
placeDialog.addEventListener("click", (e)=>{ if(e.target === placeDialog) placeDialog.close(); });

setText("places-criteria-note",
  `성경에는 지명이 수백 곳 넘게 나오지만, 이 색인에는 그중 널리 알려졌거나 ` +
  `주요 사건의 배경이 되는 장소만 ${PLACES.length}곳 골라 담았습니다.`);

renderPlacesFilters();
renderPlacesList();

/* ---------- 시작 ---------- */
applySettings();
renderToday();
renderRank();
initFirebase();
autoFetchTodayVideo(false);
