// bolls.life의 실시간 검색(v2/find)이 특정 번역본(KRV 등)에서 HTTP 400을
// 돌려주는 문제가 있어(검색 인덱스가 없는 것으로 보임), bible-backup/에 이미
// 받아둔 본문 전체를 하나의 검색용 인덱스 파일로 합쳐둔다. app.js의
// BibleAPI.search가 실시간 검색에 실패하면 이 파일을 대신 읽어 브라우저에서
// 직접 훑어 찾는다.
//
// build_bible_backup.mjs가 먼저 실행되어 bible-backup/<번역본>/ 아래 장별
// JSON이 이미 있어야 한다 (네트워크 호출 없이 그 파일들만 읽어서 합친다).
//
// 실행: node scripts/build_search_index.mjs [번역본코드]  (기본값 KRV)

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const translation = process.argv[2] || "KRV";
const dir = path.join(repoRoot, "bible-backup", translation);

const appJs = fs.readFileSync(path.join(repoRoot, "app.js"), "utf8");
const m = appJs.match(/const BOOKS = \[([\s\S]*?)\n\];/);
if (!m) throw new Error("app.js에서 BOOKS 배열을 찾지 못했습니다.");
const BOOKS = eval(`[${m[1]}]`);

// [bookIdx, chapter, verse, text] 튜플 배열 — 객체 키 반복을 피해 크기를 줄인다.
const index = [];
let missing = 0;
for (let bookIdx = 0; bookIdx < BOOKS.length; bookIdx++) {
  const bookId = bookIdx + 1;
  const [, chapterCount] = BOOKS[bookIdx];
  for (let chapter = 1; chapter <= chapterCount; chapter++) {
    const file = path.join(dir, String(bookId), `${chapter}.json`);
    if (!fs.existsSync(file)) { missing++; continue; }
    const verses = JSON.parse(fs.readFileSync(file, "utf8"));
    for (const v of verses) {
      const text = (v.text || "").replace(/<[^>]+>/g, "");
      index.push([bookIdx, chapter, v.verse ?? v.pk ?? 0, text]);
    }
  }
}

fs.writeFileSync(path.join(dir, "search-index.json"), JSON.stringify(index));
console.log(`검색 인덱스 생성 완료: ${translation} — 절 ${index.length}개, 빠진 장 ${missing}개`);
