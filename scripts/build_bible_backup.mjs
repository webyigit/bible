// 성경 본문 API(bolls.life)가 실시간으로 응답하지 않을 때를 대비한 정적 백업을
// 만든다. 이 저장소(GitHub Pages)에 함께 배포돼서, 앱이 실시간 호출에 실패하면
// 이 폴더의 파일을 대신 읽는다 (app.js의 BibleAPI.getChapter 참고).
//
// 이 스크립트는 브라우저가 아니라 서버(예: GitHub Actions 러너)에서 실행되는
// 것을 전제로 한다 — CORS 문제 없이 bolls.life를 직접 호출할 수 있기 때문이다.
// (반대로 이 코드베이스를 만든 샌드박스는 외부망이 막혀 있어 여기서 직접
// 돌려서 채울 수는 없었다. README의 "성경 본문 API에 대한 안내" 참고.)
//
// 실행: node scripts/build_bible_backup.mjs [번역본코드]  (기본값 KRV)

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");

const translation = process.argv[2] || "KRV";

const appJs = fs.readFileSync(path.join(repoRoot, "app.js"), "utf8");
const m = appJs.match(/const BOOKS = \[([\s\S]*?)\n\];/);
if (!m) throw new Error("app.js에서 BOOKS 배열을 찾지 못했습니다.");
const BOOKS = eval(`[${m[1]}]`); // [["창세기",50], ...] 형태의 순수 데이터 리터럴

const outDir = path.join(repoRoot, "bible-backup", translation);
fs.mkdirSync(outDir, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchChapter(bookId, chapter, retries = 2) {
  const url = `https://bolls.life/get-text/${encodeURIComponent(translation)}/${bookId}/${chapter}/`;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (!Array.isArray(data) || data.length === 0) throw new Error("빈 응답");
      return data;
    } catch (err) {
      if (attempt === retries) throw err;
      await sleep(500 * (attempt + 1));
    }
  }
}

let ok = 0, failed = [];
for (let bookIdx = 0; bookIdx < BOOKS.length; bookIdx++) {
  const bookId = bookIdx + 1;
  const [bookName, chapterCount] = BOOKS[bookIdx];
  const bookDir = path.join(outDir, String(bookId));
  fs.mkdirSync(bookDir, { recursive: true });
  for (let chapter = 1; chapter <= chapterCount; chapter++) {
    const outPath = path.join(bookDir, `${chapter}.json`);
    try {
      const data = await fetchChapter(bookId, chapter);
      fs.writeFileSync(outPath, JSON.stringify(data));
      ok++;
    } catch (err) {
      failed.push(`${bookName} ${chapter}장: ${err.message}`);
      console.error(`실패 — ${bookName} ${chapter}장: ${err.message}`);
    }
    await sleep(120); // bolls.life에 부담 주지 않도록 살짝 간격을 둔다
  }
  console.log(`${bookName} 완료 (${chapterCount}장)`);
}

console.log(`\n총 ${ok}개 장 저장, 실패 ${failed.length}개`);
if (failed.length) {
  console.log("실패 목록:\n" + failed.join("\n"));
  // 일부 실패는 있어도(일시적 오류 등) 나머지 백업은 그대로 유효하므로 exit 1로
  // 워크플로 전체를 실패시키지는 않는다 — 다음 정기 실행에서 다시 채워진다.
}
