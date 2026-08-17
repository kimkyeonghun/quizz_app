import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { extname, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const accessedAt = new Date().toISOString().slice(0, 10);
const assetRoot = resolve(root, "public/assets/person/private");
mkdirSync(assetRoot, { recursive: true });

const humanEntries = [
  ["박찬호", "박찬호", []], ["송혜교", "송혜교", []], ["전지현", "전지현", []], ["공유 (배우)", "공유", ["공지철"]],
  ["정우성", "정우성", []], ["박은빈", "박은빈", []], ["태연", "태연", ["김태연"]], ["수지 (1994년)", "수지", ["배수지"]],
  ["조정석", "조정석", []], ["박서준", "박서준", []], ["박보검", "박보검", []], ["마동석", "마동석", ["Don Lee"]],
  ["김우진 (양궁 선수)", "김우진", []], ["페이커", "페이커", ["Faker", "이상혁"]], ["김하성", "김하성", []], ["김태리", "김태리", []],
  ["이정후", "이정후", []], ["한소희", "한소희", []], ["장원영", "장원영", []], ["임영웅", "임영웅", []],
  ["카리나 (가수)", "카리나", ["유지민"]], ["안세영", "안세영", []], ["신유빈", "신유빈", []], ["김제덕", "김제덕", []],
];

const characterEntries = [
  ["Pikachu", "피카츄"], ["Doraemon", "도라에몽"], ["Shinnosuke Nohara", "짱구", ["노하라 신노스케"]],
  ["Gokuu Son", "손오공", ["Son Goku"]], ["Monkey D. Luffy", "몽키 D. 루피", ["루피"]], ["Roronoa Zoro", "롤로노아 조로", ["조로"]],
  ["Naruto Uzumaki", "우즈마키 나루토", ["나루토"]], ["Sasuke Uchiha", "우치하 사스케", ["사스케"]],
  ["Conan Edogawa", "에도가와 코난", ["코난"]], ["Totoro", "토토로"], ["Usagi Tsukino", "세일러 문", ["츠키노 우사기"]],
  ["Edward Elric", "에드워드 엘릭"], ["Eren Yeager", "에렌 예거"], ["Levi", "리바이"],
  ["Tanjirou Kamado", "카마도 탄지로", ["탄지로"]], ["Nezuko Kamado", "카마도 네즈코", ["네즈코"]],
  ["Satoru Gojou", "고죠 사토루", ["고죠"]], ["Anya Forger", "아냐 포저", ["아냐"]], ["Howl", "하울"], ["Chihiro Ogino", "오기노 치히로", ["치히로"]],
];

function unique(values) {
  return [...new Map(values.filter(Boolean).map((value) => [value.normalize("NFC").toLocaleLowerCase("ko-KR").replace(/\s+/g, " ").trim(), value])).values()];
}

function difficulty(index) {
  if (index < 8) return 1;
  if (index < 20) return 2;
  if (index < 33) return 3;
  if (index < 42) return 4;
  return 5;
}

async function download(url, filename, attempt = 0) {
  if (existsSync(resolve(assetRoot, filename))) return;
  const response = await fetch(url, { headers: { "User-Agent": "quiz-room-private-content-builder/1.0" } });
  if ((response.status === 429 || response.status >= 500) && attempt < 6) {
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 1000 * (attempt + 1)));
    return download(url, filename, attempt + 1);
  }
  if (!response.ok) throw new Error(`${response.status} 이미지 다운로드 실패: ${url}`);
  writeFileSync(resolve(assetRoot, filename), Buffer.from(await response.arrayBuffer()));
}

async function buildHumans() {
  const params = new URLSearchParams({
    action: "query", titles: humanEntries.map(([title]) => title).join("|"), prop: "pageimages|info",
    piprop: "name|thumbnail", pithumbsize: "500", inprop: "url", format: "json", origin: "*",
  });
  const response = await fetch(`https://ko.wikipedia.org/w/api.php?${params}`, { headers: { "User-Agent": "quiz-room-private-content-builder/1.0" } });
  if (!response.ok) throw new Error(`Wikipedia API 오류: ${response.status}`);
  const result = await response.json();
  const pages = new Map(Object.values(result.query.pages).map((page) => [page.title, page]));
  const questions = [];
  for (const [index, [title, answer, aliases]] of humanEntries.entries()) {
    const page = pages.get(title);
    if (!page?.thumbnail?.source || !page.fullurl) throw new Error(`${title}: 프로필 이미지를 찾을 수 없습니다.`);
    const extension = [".jpg", ".jpeg", ".png", ".webp"].includes(extname(new URL(page.thumbnail.source).pathname).toLowerCase())
      ? extname(new URL(page.thumbnail.source).pathname).toLowerCase().replace(".jpeg", ".jpg") : ".jpg";
    const filename = `private_person_${String(index + 1).padStart(3, "0")}${extension}`;
    await download(page.thumbnail.source, filename);
    questions.push({
      id: `person_private_${String(index + 1).padStart(6, "0")}`, gameType: "person_quiz", answer,
      acceptedAnswers: unique([answer, ...aliases]), category: index < 12 ? "entertainment" : "sports",
      tags: ["private-only", "wikipedia-profile"], difficulty: difficulty(index), enabled: true, verified: true,
      usageScope: "private_only", asset: `/assets/person/private/${filename}`,
      sources: [{ title: page.title, publisher: "한국어 위키백과", url: page.fullurl, accessedAt }],
      attribution: { author: "원본 페이지에 표시된 저작권자", sourceUrl: page.fullurl, license: "PRIVATE LOCAL USE",
        modified: "Wikipedia 제공 썸네일을 친구 모임용으로 로컬 저장", accessedAt },
      metadata: { clue: `${index < 12 ? "대중문화" : "스포츠"} 분야 인물` },
    });
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 250));
  }
  return questions;
}

async function buildCharacters(offset) {
  const query = `query($search:String){Character(search:$search){id name{full native alternative} image{large} siteUrl}}`;
  const questions = [];
  for (const [characterIndex, [search, answer, aliases = []]] of characterEntries.entries()) {
    const character = await fetchCharacter(query, search);
    if (!character?.image?.large || !character.siteUrl) throw new Error(`${search}: 캐릭터 이미지를 찾을 수 없습니다.`);
    const extension = extname(new URL(character.image.large).pathname).toLowerCase() || ".jpg";
    const filename = `private_character_${String(characterIndex + 1).padStart(3, "0")}${extension}`;
    await download(character.image.large, filename);
    const index = offset + characterIndex;
    questions.push({
      id: `person_character_${String(characterIndex + 1).padStart(6, "0")}`, gameType: "person_quiz", answer,
      acceptedAnswers: unique([answer, ...aliases, character.name.full, character.name.native, ...(character.name.alternative ?? [])]),
      category: "animation_character", tags: ["private-only", "animation", "anilist"], difficulty: difficulty(index),
      enabled: true, verified: true, usageScope: "private_only", asset: `/assets/person/private/${filename}`,
      sources: [{ title: character.name.full, publisher: "AniList", url: character.siteUrl, accessedAt }],
      attribution: { author: "해당 캐릭터 및 애니메이션 권리자", sourceUrl: character.siteUrl, license: "PRIVATE LOCAL USE",
        modified: "AniList 제공 캐릭터 이미지를 친구 모임용으로 로컬 저장", accessedAt },
      metadata: { clue: "애니메이션 캐릭터" },
    });
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 150));
  }
  return questions;
}

async function fetchCharacter(query, search, attempt = 0) {
  const response = await fetch("https://graphql.anilist.co", {
    method: "POST", headers: { "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({ query, variables: { search } }),
  });
  if ((response.status === 429 || response.status >= 500) && attempt < 6) {
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 1000 * (attempt + 1)));
    return fetchCharacter(query, search, attempt + 1);
  }
  if (!response.ok) throw new Error(`AniList API 오류: ${response.status} (${search})`);
  return (await response.json()).data?.Character;
}

const humans = await buildHumans();
const characters = await buildCharacters(humans.length);
const questions = [...humans, ...characters];
if (questions.length !== 44) throw new Error(`로컬 전용 인물 문제가 ${questions.length}개입니다.`);
writeFileSync(resolve(root, "data/person/private-persons.json"), `${JSON.stringify(questions, null, 2)}\n`);
console.log(`로컬 전용 인물 ${humans.length}명과 애니메이션 캐릭터 ${characters.length}개를 생성했습니다.`);
