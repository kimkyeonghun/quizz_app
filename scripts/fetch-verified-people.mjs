import { mkdirSync, writeFileSync } from "node:fs";
import { extname, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const accessedAt = new Date().toISOString().slice(0, 10);
const api = "https://www.wikidata.org/w/api.php";
const wikipediaApi = "https://ko.wikipedia.org/w/api.php";
const sleep = (ms) => new Promise((resolvePromise) => setTimeout(resolvePromise, ms));
const difficulty = (index, total) => index < Math.floor(total * 0.2) ? 1 : index < Math.floor(total * 0.45) ? 2 : index < Math.floor(total * 0.75) ? 3 : index < Math.floor(total * 0.95) ? 4 : 5;
const clean = (value = "") => value.replace(/<[^>]+>/g, " ").replace(/&[^;]+;/g, " ").replace(/\s+/g, " ").trim();
const uniqueAnswers = (values) => [...new Map(values.filter(Boolean).map((value) => [value.normalize("NFC").trim().toLocaleLowerCase("ko-KR").replace(/\s+/g, " "), value])).values()];

const peopleByCategory = {
  entertainment: ["봉준호","박찬욱","송강호","윤여정","이병헌","전도연","최민식","김혜수","유재석","아이유","싸이","지드래곤","RM","진","제이홉","엠마 왓슨","톰 크루즈","레오나르도 디카프리오","키아누 리브스","스칼릿 조핸슨","로버트 다우니 주니어","제니퍼 로렌스","브래드 피트","앤 해서웨이","메릴 스트립","스티븐 스필버그","크리스토퍼 놀런","제임스 캐머런","미야자키 하야오","성룡","양자경","주성치","아델","테일러 스위프트","비욘세","브루노 마스","에드 시런","레이디 가가","마이클 잭슨","프레디 머큐리"],
  sports: ["손흥민","김연아","류현진","박세리","박지성","이강인","김민재","황희찬","김연경","이상화","우상혁","오상욱","펠레","디에고 마라도나","리오넬 메시","크리스티아누 호날두","킬리안 음바페","루카 모드리치","지네딘 지단","데이비드 베컴","마이클 조던","르브론 제임스","코비 브라이언트","스테픈 커리","세리나 윌리엄스","로저 페더러","라파엘 나달","노바크 조코비치","우사인 볼트","마이클 펠프스","시몬 바일스","타이거 우즈","오타니 쇼헤이","스즈키 이치로","무하마드 알리"],
  science: ["알베르트 아인슈타인","마리 퀴리","아이작 뉴턴","찰스 다윈","니콜라 테슬라","앨런 튜링","에이다 러브레이스","스티븐 호킹","갈릴레오 갈릴레이","요하네스 케플러","루이 파스퇴르","알렉산더 플레밍","제인 구달","칼 세이건","닐 디그래스 타이슨","팀 버너스리","스티브 잡스","빌 게이츠","일론 머스크","마크 저커버그","제프 베이조스","리처드 파인만","닐스 보어","막스 플랑크","그레고어 멘델"],
  history: ["세종대왕","이순신","신사임당","유관순","안중근","김구","윤봉길","정약용","장영실","광개토대왕","알렉산더 대왕","율리우스 카이사르","클레오파트라","나폴레옹 보나파르트","에이브러햄 링컨","윈스턴 처칠","마하트마 간디","넬슨 만델라","마틴 루터 킹 주니어","엘리자베스 2세","잔 다르크","칭기즈 칸","마르코 폴로","플로렌스 나이팅게일","헬렌 켈러"],
  culture: ["레오나르도 다 빈치","빈센트 반 고흐","파블로 피카소","클로드 모네","프리다 칼로","살바도르 달리","오귀스트 로댕","미켈란젤로","윌리엄 셰익스피어","제인 오스틴","레프 톨스토이","표도르 도스토옙스키","어니스트 헤밍웨이","조앤 K. 롤링","무라카미 하루키","한강","백남준","김홍도","신윤복","루트비히 판 베토벤","볼프강 아마데우스 모차르트","요한 제바스티안 바흐","프레데리크 쇼팽","표트르 차이콥스키","밥 딜런"]
};

const footballNames = [
  "박지성","손흥민","이강인","김민재","황희찬","이재성","기성용","구자철","안정환","차범근",
  "리오넬 메시","크리스티아누 호날두","네이마르","킬리안 음바페","루카 모드리치","지네딘 지단","티에리 앙리","데이비드 베컴","웨인 루니","스티븐 제라드",
  "프랭크 램파드","안드레아 피를로","카카","호나우지뉴","디디에 드로그바","사무엘 에토","루이스 수아레스","로베르트 레반도프스키","카림 벤제마","즐라탄 이브라히모비치",
  "호나우두","히바우두","루이스 피구","라울 곤살레스","페르난도 토레스","다비드 비야","안드레스 이니에스타","세스크 파브레가스","사비 알론소","토니 크로스",
  "카세미루","앙헬 디 마리아","가레스 베일","에덴 아자르","아르연 로번","프랑크 리베리","토마스 뮐러","마리오 괴체","미로슬라프 클로제","바스티안 슈바인슈타이거",
  "케빈 더 브라위너","엘링 홀란","모하메드 살라","사디오 마네","버질 판 데이크","해리 케인","손흥민","부카요 사카","마커스 래시퍼드","브루노 페르난데스",
  "폴 포그바","은골로 캉테","클로드 마켈렐레","파트리크 비에라","로이 킨","폴 스콜스","라이언 긱스","에릭 칸토나","뤼트 판 니스텔로이","로빈 판 페르시",
  "데니스 베르캄프","루드 굴리트","마르코 판 바스턴","클라렌서 세도르프","파벨 네드베트","알레산드로 델 피에로","프란체스코 토티","잔루이지 부폰","파비오 칸나바로","파올로 말디니",
  "세르히오 라모스","헤라르드 피케","카를레스 푸욜","마르셀루","다니 아우베스","호베르투 카를루스","카푸","필리프 람","마누엘 노이어","페트르 체흐",
  "에드윈 판 데르 사르","이케르 카시야스","티보 쿠르투아","알리송 베케르","에데르송","야야 투레","다비드 실바","세르히오 아구에로","카를로스 테베스","하비에르 마스체라노",
  "후안 세바스티안 베론","가브리엘 바티스투타","에르난 크레스포","곤살로 이과인","파울로 디발라","라우타로 마르티네스","앙투안 그리즈만","올리비에 지루","폴 가스코인","마이클 오언",
  "앨런 시어러","게리 리네커","존 테리","리오 퍼디낸드","솔 캠벨","애슐리 콜","조 콜","데이비드 시먼","루카쿠","로멜루 루카쿠",
  "피에르에므리크 오바메양","알렉시스 산체스","메수트 외질","로랑 코시엘니","윌리안","후안 마타","네마냐 비디치","하비에르 에르난데스","디미타르 베르바토프","미하엘 발라크",
  "마이클 에시엔","존 오비 미켈","페르난지뉴","하메스 로드리게스","라다멜 팔카오","헐크","오스카르","필리페 쿠티뉴","호베르투 피르미누","루카스 모우라"
];

const officialCareerSources = {
  "지네딘 지단": ["Real Madrid", "Zinedine Zidane", "https://www.realmadrid.com/en-US/the-club/history/football-legends/zinedine-zidane"],
  "박지성": ["Manchester United", "Ji-sung Park", "https://www.manutd.com/en/players-and-staff/detail/ji-sung-park"],
  "티에리 앙리": ["Arsenal", "Thierry Henry", "https://www.arsenal.com/history/profiles/307/thierry-henry"],
  "스티븐 제라드": ["Liverpool FC", "Steven Gerrard confirms retirement", "https://www.liverpoolfc.com/news/announcements/244291-steven-gerrard-confirms-retirement-from-football"],
  "프랭크 램파드": ["Chelsea FC", "Frank Lampard", "https://www.chelseafc.com/en/frank-lampard"],
  "웨인 루니": ["Manchester United", "Wayne Rooney", "https://www.manutd.com/en/players-and-staff/detail/wayne-rooney"],
  "안드레아 피를로": ["Juventus", "Thanks for everything, Maestro", "https://www.juventus.com/en/news/articles/thanks-for-everything-maestro"],
  "카카": ["AC Milan", "Ricardo Kaká Hall of Fame", "https://www.acmilan.com/en/hall-of-fame/inductees/ricardo-kaka"],
  "호나우지뉴": ["FC Barcelona", "Ronaldinho", "https://players.fcbarcelona.com/en/player/763-ronaldinho-ronaldo-assis-moreira"],
  "데이비드 베컴": ["Manchester United", "David Beckham", "https://www.manutd.com/en/players-and-staff/detail/david-beckham"],
  "디디에 드로그바": ["Chelsea FC", "Didier Drogba", "https://www.chelseafc.com/en/didier-drogba"],
};

async function json(url, attempt = 0) {
  const response = await fetch(url, { headers: { "User-Agent": "quiz-room-content-builder/1.0 (offline educational quiz)" } });
  if (response.status === 429 && attempt < 6) {
    await sleep(1000 * (attempt + 1));
    return json(url, attempt + 1);
  }
  if (!response.ok) throw new Error(`${response.status} ${url}`);
  return response.json();
}

async function download(url, attempt = 0) {
  const cleanUrl = new URL(url);
  cleanUrl.search = "";
  cleanUrl.pathname = cleanUrl.pathname.replace(/\/\d+px-/, "/500px-");
  const response = await fetch(cleanUrl, { headers: { "User-Agent": "quiz-room-content-builder/1.0" } });
  if ((response.status === 429 || response.status >= 500) && attempt < 6) {
    await sleep(1000 * (attempt + 1));
    return download(url, attempt + 1);
  }
  if (!response.ok) throw new Error(`이미지 다운로드 실패: ${cleanUrl}`);
  return Buffer.from(await response.arrayBuffer());
}

async function entities(ids) {
  const output = new Map();
  for (let index = 0; index < ids.length; index += 40) {
    const params = new URLSearchParams({ action: "wbgetentities", ids: ids.slice(index, index + 40).join("|"), props: "labels|aliases", languages: "ko|en", format: "json", origin: "*" });
    const result = await json(`${api}?${params}`);
    Object.entries(result.entities).forEach(([id, entity]) => output.set(id, entity));
  }
  return output;
}

async function resolveCandidates(entries) {
  const resolved = [];
  for (let index = 0; index < entries.length; index += 40) {
    const batch = entries.slice(index, index + 40);
    const params = new URLSearchParams({ action: "query", titles: batch.map((entry) => entry.name).join("|"),
      prop: "pageprops|pageimages", piprop: "name|thumbnail", pithumbsize: "800", redirects: "1", format: "json", origin: "*" });
    const result = await json(`${wikipediaApi}?${params}`);
    const redirects = new Map((result.query.redirects ?? []).map((redirect) => [redirect.from, redirect.to]));
    const byTitle = new Map(Object.values(result.query.pages).map((page) => [page.title, page]));
    batch.forEach((entry) => {
      const page = byTitle.get(redirects.get(entry.name) ?? entry.name);
      if (page?.pageprops?.wikibase_item) resolved.push({ ...entry, id: page.pageprops.wikibase_item, file: page.pageimage, thumburl: page.thumbnail?.source });
    });
    await sleep(500);
  }
  const details = await entities(resolved.map((entry) => entry.id));
  return resolved.map((entry) => ({ ...entry, entity: details.get(entry.id) })).filter((entry) => entry.entity);
}

async function commonsInfo(files) {
  const output = new Map();
  for (let index = 0; index < files.length; index += 8) {
    await Promise.all(files.slice(index, index + 8).map(async (file) => {
      const descriptionurl = `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(file.replaceAll(" ", "_"))}`;
      const response = await fetch(descriptionurl, { headers: { "User-Agent": "quiz-room-content-builder/1.0" } });
      if (!response.ok) return;
      const html = await response.text();
      const shortName = html.match(/licensetpl(?:&#95;|_)short[^>]*>([^<]+)/i)?.[1];
      const authorHtml = html.match(/id="fileinfotpl(?:&#95;|_)aut"[^>]*>Author<\/td>\s*<td[^>]*>([\s\S]*?)<\/td>/i)?.[1];
      output.set(file, { descriptionurl, extmetadata: { LicenseShortName: { value: shortName ?? "" }, Artist: { value: authorHtml ?? "Wikimedia Commons contributor" } } });
    }));
    await sleep(150);
  }
  return output;
}

function licenseData(info) {
  const raw = clean(info.extmetadata?.LicenseShortName?.value);
  const mapping = {
    "CC0": ["CC0", "https://creativecommons.org/publicdomain/zero/1.0/"],
    "Public domain": ["PDM", "https://creativecommons.org/publicdomain/mark/1.0/"],
    "CC BY 2.0": ["CC BY 2.0", "https://creativecommons.org/licenses/by/2.0/"],
    "CC BY 3.0": ["CC BY 3.0", "https://creativecommons.org/licenses/by/3.0/"],
    "CC BY 4.0": ["CC BY 4.0", "https://creativecommons.org/licenses/by/4.0/"],
    "CC BY-SA 3.0": ["CC BY-SA 3.0", "https://creativecommons.org/licenses/by-sa/3.0/"],
    "CC BY-SA 4.0": ["CC BY-SA 4.0", "https://creativecommons.org/licenses/by-sa/4.0/"],
  };
  return mapping[raw];
}

async function buildPeople() {
  const targetCount = 115;
  const entries = Object.entries(peopleByCategory).flatMap(([category, names]) => names.map((name) => ({ name, category })));
  const resolved = await resolveCandidates(entries);
  const withFiles = resolved.filter((entry) => entry.file && entry.thumburl);
  const infos = await commonsInfo([...new Set(withFiles.map((entry) => entry.file))]);
  const validCandidates = withFiles.filter((entry) => {
    const info = infos.get(entry.file);
    const extension = extname(new URL(entry.thumburl ?? "https://x/x").pathname).toLowerCase();
    return info && licenseData(info) && [".jpg", ".jpeg", ".png", ".webp"].includes(extension);
  });
  const quotas = { entertainment: 30, sports: 30, science: 20, history: 20, culture: 20 };
  const valid = Object.entries(quotas).flatMap(([category, count]) => validCandidates.filter((entry) => entry.category === category).slice(0, count)).slice(0, targetCount);
  if (valid.length < targetCount) throw new Error(`허용 라이선스 인물 이미지가 ${valid.length}개뿐입니다.`);
  const assetRoot = resolve(root, "public/assets/person");
  mkdirSync(assetRoot, { recursive: true });
  const questions = [];
  for (const [index, entry] of valid.entries()) {
    const info = infos.get(entry.file);
    const url = entry.thumburl ?? info.thumburl ?? info.url;
    const extension = extname(new URL(url).pathname).toLowerCase() === ".jpeg" ? ".jpg" : extname(new URL(url).pathname).toLowerCase();
    const filename = `person_${String(index + 1).padStart(6, "0")}${extension}`;
    writeFileSync(resolve(assetRoot, filename), await download(url));
    const [license, licenseUrl] = licenseData(info);
    const koLabel = entry.entity.labels?.ko?.value ?? entry.name;
    const enLabel = entry.entity.labels?.en?.value;
    const aliases = (entry.entity.aliases?.ko ?? []).map((item) => item.value);
    questions.push({
      id: `person_${String(index + 1).padStart(6, "0")}`, gameType: "person_quiz", answer: koLabel,
      acceptedAnswers: uniqueAnswers([koLabel, enLabel, ...aliases]), category: entry.category,
      tags: ["wikimedia"], difficulty: difficulty(index, valid.length), enabled: true, verified: true,
      asset: `/assets/person/${filename}`, sources: [{ title: koLabel, publisher: "Wikidata", url: `https://www.wikidata.org/wiki/${entry.id}`, accessedAt }],
      attribution: { author: clean(info.extmetadata?.Artist?.value) || "Wikimedia Commons contributor", sourceUrl: info.descriptionurl,
        license, licenseUrl, modified: "Wikimedia Commons의 500px 이하 썸네일로 크기 조정", accessedAt },
      metadata: { clue: clean(entry.entity.descriptions?.ko?.value ?? "") || `${entry.category} 분야 인물` },
    });
    if ((index + 1) % 10 === 0) console.log(`인물 이미지 ${index + 1}/${valid.length}`);
  }
  writeFileSync(resolve(root, "data/person/persons.json"), `${JSON.stringify(questions, null, 2)}\n`);
}

async function buildCareers() {
  const targetCount = 105;
  const uniqueNames = [...new Set(footballNames)];
  const resolved = await resolveCandidates(uniqueNames.map((name) => ({ name })));
  const values = resolved.map((entry) => `wd:${entry.id}`).join(" ");
  const query = `SELECT ?player ?club ?clubLabel ?start ?end WHERE { VALUES ?player { ${values} } ?player p:P54 ?membership. ?membership ps:P54 ?club. OPTIONAL { ?membership pq:P580 ?start. } OPTIONAL { ?membership pq:P582 ?end. } SERVICE wikibase:label { bd:serviceParam wikibase:language "ko,en". } }`;
  const params = new URLSearchParams({ query, format: "json" });
  const sparql = await json(`https://query.wikidata.org/sparql?${params}`);
  const membershipsByPlayer = Map.groupBy(sparql.results.bindings, (row) => row.player.value.split("/").at(-1));
  const rows = [];
  for (const entry of resolved) {
    const career = (membershipsByPlayer.get(entry.id) ?? []).map((row) => ({
      club: row.clubLabel.value,
      start: row.start ? Number(row.start.value.slice(0, 4)) : null,
      end: row.end ? Number(row.end.value.slice(0, 4)) : null,
    })).filter((item) => item.club && !/(대표팀|national|under-|u-\d|올림픽|autonomous football team|후베닐|academy|reserve|\sII$|\s[BC]$)/i.test(item.club))
      .sort((a, b) => (a.start ?? 9999) - (b.start ?? 9999));
    const deduped = career.filter((item, index) => index === 0 || item.club !== career[index - 1].club || item.start !== career[index - 1].start);
    if (deduped.length >= 4) rows.push({ ...entry, career: deduped });
    if (rows.length === targetCount) break;
  }
  if (rows.length < targetCount) throw new Error(`4개 이상 클럽 경력이 확인된 선수가 ${rows.length}명뿐입니다.`);
  const questions = rows.map((entry, index) => {
    const career = entry.career.map((item, careerIndex) => ({ club: item.club, order: careerIndex + 1 }));
    const koLabel = entry.entity.labels?.ko?.value ?? entry.name;
    const enLabel = entry.entity.labels?.en?.value;
    const aliases = (entry.entity.aliases?.ko ?? []).map((item) => item.value);
    const official = officialCareerSources[koLabel];
    const sources = [
      ...(official ? [{ publisher: official[0], title: official[1], url: official[2], accessedAt }] : []),
      { title: `${koLabel} club membership statements`, publisher: "Wikidata", url: `https://www.wikidata.org/wiki/${entry.id}`, accessedAt },
    ];
    return { id: `career_${String(index + 1).padStart(6, "0")}`, gameType: "football_career", answer: koLabel,
      acceptedAnswers: uniqueAnswers([koLabel, enLabel, ...aliases]), category: "sports", subcategory: "football",
      tags: ["career", "wikidata"], difficulty: difficulty(index, rows.length), enabled: true, verified: true,
      sources,
      metadata: { career, verifiedAt: accessedAt } };
  });
  writeFileSync(resolve(root, "data/football-career/football-careers.json"), `${JSON.stringify(questions, null, 2)}\n`);
}

if (!process.argv.includes("--careers-only")) await buildPeople();
if (!process.argv.includes("--people-only")) await buildCareers();
console.log("요청한 인물/선수 커리어 데이터 생성을 완료했습니다.");
