// ============================================================
//  /api/ppt — 교안 텍스트를 받아 브랜드 PPTX 생성 후 반환
//  교안 출력의 "# 2. 슬라이드" 섹션을 파싱해 네이비+그린 발표자료 생성.
//  (로컬 서버의 pptx-builder.js 와 동일 로직)
// ============================================================
import PptxGenJS from "pptxgenjs";
const Pptx = PptxGenJS.default || PptxGenJS;

export const config = { maxDuration: 30 };

const NAVY = "14315F", GREEN = "1FA968", GREENL = "2EC97F",
      INK = "1A2430", MUTED = "8A97A6", WHITE = "FFFFFF", LINE = "DCEAE1",
      ICE = "CADCEF", ICE2 = "AFC3DF";
const F = "Malgun Gothic";
const W = 13.333, H = 7.5;
const shadow = () => ({ type: "outer", color: "1A2430", blur: 9, offset: 3, angle: 135, opacity: 0.13 });

function cleanTitle(name) {
  return String(name || "교안")
    .replace(/\.[^.]+$/, "").replace(/^\d{10,}_/, "").replace(/_교안$/, "")
    .replace(/[_]+/g, " ").trim() || "교안";
}
function extractSlideSection(text) {
  const lines = String(text).split(/\r?\n/);
  let start = -1, end = lines.length;
  for (let i = 0; i < lines.length; i++) {
    if (start < 0) { if (/^#\s*2[.\)]?\s.*슬라이드/.test(lines[i])) start = i + 1; }
    else if (/^#\s+\S/.test(lines[i])) { end = i; break; }
  }
  return start < 0 ? null : lines.slice(start, end).join("\n");
}
function parseSlideBlocks(block) {
  const slides = []; let cur = null;
  for (const ln of block.split(/\r?\n/)) {
    const b = ln.match(/^\s*[-*•]\s+(.*)$/);
    const h = ln.match(/^##\s*(?:슬라이드\s*\d*\s*[\/:·\-]?\s*)?(.*)$/);
    if (h && !b) { cur = { title: (h[1] || "").trim(), bullets: [] }; slides.push(cur); }
    else if (b && cur) { const t = b[1].trim(); if (t && t !== "---") cur.bullets.push(t); }
  }
  return slides.filter(s => s.title || s.bullets.length);
}
function parseGeneric(text) {
  const lines = String(text).split(/\r?\n/); const slides = []; let cur = null;
  for (const ln of lines) {
    if (/^#\s+\S/.test(ln)) { cur = null; continue; }
    const b = ln.match(/^\s*[-*•]\s+(.*)$/);
    const h = ln.match(/^##\s+(.*)$/);
    if (h && !b) { cur = { title: h[1].replace(/^슬라이드\s*\d*\s*[\/:]?\s*/, "").trim(), bullets: [] }; slides.push(cur); }
    else if (b && cur) { const t = b[1].trim(); if (t && t !== "---") cur.bullets.push(t); }
  }
  return slides.filter(s => s.bullets.length || s.title);
}

// 마크다운 구조가 없는 평문(예: PDF에서 추출한 텍스트)을 슬라이드로 변환.
//  "# 제목" 줄을 섹션 경계로 보고, 각 섹션 본문을 문장 단위 불릿으로 나눠 분할.
function parsePlainText(text) {
  const SENT_PER_SLIDE = 6, MAX_BULLET = 180, MAX_SLIDES = 60;
  const lines = String(text).split(/\r?\n/);
  const blocks = [];
  let cur = { title: "", body: [] };
  for (const ln of lines) {
    const h = ln.match(/^#\s+(.*)$/);
    if (h) {
      if (cur.title || cur.body.length) blocks.push(cur);
      cur = { title: (h[1] || "").trim(), body: [] };
    } else if (ln.trim()) {
      cur.body.push(ln.trim());
    }
  }
  if (cur.title || cur.body.length) blocks.push(cur);
  if (!blocks.length) return [];

  const slides = [];
  for (const b of blocks) {
    const joined = b.body.join(" ").replace(/\s+/g, " ").trim();
    // 문장 단위 분리(마침표·물음표·느낌표·"다." 등). 룩비하인드 없이 처리.
    let sentences = joined ? (joined.match(/[^.!?。…]+[.!?。…]+|\S[^.!?。…]*$/g) || [joined]) : [];
    sentences = sentences.map(s => s.trim()).filter(s => s.length > 1)
      .map(s => s.length > MAX_BULLET ? s.slice(0, MAX_BULLET - 1) + "…" : s);
    if (!sentences.length) { if (b.title) slides.push({ title: b.title, bullets: [] }); continue; }
    for (let i = 0; i < sentences.length; i += SENT_PER_SLIDE) {
      if (slides.length >= MAX_SLIDES) break;
      slides.push({
        title: (b.title || "내용") + (i > 0 ? " (계속)" : ""),
        bullets: sentences.slice(i, i + SENT_PER_SLIDE),
      });
    }
    if (slides.length >= MAX_SLIDES) break;
  }
  return slides;
}

async function buildLessonPptx(text, rawName) {
  const deckTitle = cleanTitle(rawName);
  let slides = [];
  const sec = extractSlideSection(text);
  if (sec) slides = parseSlideBlocks(sec);
  if (!slides.length) slides = parseGeneric(text);
  if (!slides.length) slides = parsePlainText(text);
  if (!slides.length) slides = [{ title: "교안", bullets: [String(text).slice(0, 400)] }];

  const cover = slides.find(s => /표지|cover|title/i.test(s.title));
  const thanks = [...slides].reverse().find(s => /감사|thank/i.test(s.title));
  const content = slides.filter(s => s !== cover && s !== thanks);

  const pres = new Pptx();
  pres.layout = "LAYOUT_WIDE"; pres.author = "윤정호"; pres.title = deckTitle;

  const addTitle = (s, t) => {
    s.addShape(pres.shapes.RECTANGLE, { x: 0.62, y: 0.6, w: 0.16, h: 0.46, fill: { color: GREEN } });
    s.addText(t || "", { x: 0.95, y: 0.5, w: 11.6, h: 0.7, fontFace: F, fontSize: 27, bold: true, color: NAVY, margin: 0, valign: "middle" });
  };
  const foot = (s, n) => {
    s.addText(deckTitle + " · 윤정호 AX Lecturer", { x: 0.6, y: H - 0.55, w: 8.5, h: 0.3, fontFace: F, fontSize: 9, color: MUTED, margin: 0 });
    s.addText(String(n).padStart(2, "0"), { x: W - 1.2, y: H - 0.55, w: 0.6, h: 0.3, align: "right", fontFace: F, fontSize: 9, color: MUTED, margin: 0 });
  };

  // Cover
  let s = pres.addSlide(); s.background = { color: NAVY };
  s.addShape(pres.shapes.OVAL, { x: 10.2, y: 4.2, w: 5.4, h: 5.4, fill: { color: GREEN, transparency: 82 } });
  s.addShape(pres.shapes.OVAL, { x: 11.9, y: -1.6, w: 3.4, h: 3.4, fill: { color: GREENL, transparency: 88 } });
  s.addText("AI 자동 생성 교안 · 발표자료", { x: 0.92, y: 1.65, w: 9, h: 0.4, fontFace: F, fontSize: 15, bold: true, color: GREENL, charSpacing: 2, margin: 0 });
  s.addText(deckTitle, { x: 0.92, y: 2.25, w: 11.4, h: 2.3, fontFace: F, fontSize: 38, bold: true, color: WHITE, lineSpacingMultiple: 1.08, margin: 0, valign: "top" });
  const coverSub = (cover && cover.bullets.length) ? (cover.bullets.filter(b => !/강사명|수업일자|날짜/.test(b))[0] || "") : "";
  if (coverSub) s.addText(coverSub, { x: 0.94, y: 4.75, w: 10.6, h: 0.5, fontFace: F, fontSize: 15, italic: true, color: ICE2, margin: 0 });
  s.addText("강사 윤정호   |   제조·R&D 현장을 아는 AX 강사", { x: 0.94, y: 5.6, w: 11, h: 0.4, fontFace: F, fontSize: 14, color: ICE, margin: 0 });

  // Content
  content.forEach((sl, i) => {
    const s2 = pres.addSlide(); s2.background = { color: WHITE };
    addTitle(s2, sl.title || ("슬라이드 " + (i + 2)));
    s2.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.9, y: 1.85, w: 11.53, h: 4.6, rectRadius: 0.1, fill: { color: WHITE }, line: { color: LINE, width: 1 }, shadow: shadow() });
    const bl = sl.bullets.length ? sl.bullets : ["(내용 없음)"];
    const fs = bl.length >= 7 ? 14 : bl.length >= 5 ? 16 : 18;
    const spc = bl.length >= 7 ? 6 : bl.length >= 5 ? 9 : 13;
    const items = bl.map(b => ({ text: b, options: { bullet: { indent: 18 }, color: INK, breakLine: true, paraSpaceAfter: spc } }));
    s2.addText(items, { x: 1.35, y: 2.25, w: 10.6, h: 3.85, fontFace: F, fontSize: fs, color: INK, margin: 0, valign: "top" });
    foot(s2, i + 2);
  });

  // Closing
  const cs = pres.addSlide(); cs.background = { color: NAVY };
  cs.addShape(pres.shapes.OVAL, { x: -1.6, y: 4.4, w: 5, h: 5, fill: { color: GREEN, transparency: 85 } });
  cs.addShape(pres.shapes.OVAL, { x: 10.9, y: -1.9, w: 4.6, h: 4.6, fill: { color: GREENL, transparency: 88 } });
  cs.addText(thanks && thanks.title ? thanks.title : "감사합니다", { x: 0.92, y: 2.4, w: 11.5, h: 1.3, fontFace: F, fontSize: 48, bold: true, color: WHITE, margin: 0 });
  const clb = (thanks && thanks.bullets.length) ? thanks.bullets : ["문의: kamon00@naver.com"];
  cs.addText(clb.map(b => ({ text: b, options: { breakLine: true, color: ICE, paraSpaceAfter: 6 } })), { x: 0.94, y: 3.95, w: 11, h: 1.7, fontFace: F, fontSize: 15, margin: 0, valign: "top" });

  return await pres.write({ outputType: "nodebuffer" });
}

async function readJson(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (req.body && typeof req.body === "string") { try { return JSON.parse(req.body); } catch { return {}; } }
  const chunks = [];
  for await (const c of req) chunks.push(c);
  try { return JSON.parse(Buffer.concat(chunks).toString("utf8")); } catch { return {}; }
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST 만 허용됩니다." });
  const need = process.env.ACCESS_TOKEN;
  if (need && req.headers["x-access-token"] !== need) {
    return res.status(401).json({ error: "접근 권한이 없습니다." });
  }
  try {
    const body = await readJson(req);
    const text = body.text || "";
    const name = body.filename || "교안";
    if (!String(text).trim()) return res.status(400).json({ error: "교안 텍스트가 비어 있습니다." });

    const buf = await buildLessonPptx(text, name);
    const outName = encodeURIComponent(cleanTitle(name) + "_발표자료.pptx");
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.presentationml.presentation");
    res.setHeader("Content-Disposition", `attachment; filename*=UTF-8''${outName}`);
    res.statusCode = 200;
    return res.end(buf);
  } catch (e) {
    return res.status(500).json({ error: "PPT 생성 오류", detail: String(e && e.message ? e.message : e).slice(0, 300) });
  }
}
