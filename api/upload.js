// ============================================================
//  /api/upload — 파일 1개를 Dify 파일 업로드 API로 중개(프록시)
//  - 프런트엔드에서 파일을 raw(octet-stream) 바디로 보내면,
//    이 함수가 Dify로 multipart 업로드하고 file_id 를 돌려준다.
//  - Dify API 키는 환경변수(DIFY_API_KEY)로만 사용 (프런트 노출 금지)
// ============================================================

export const config = { maxDuration: 30 };

const DIFY_BASE = (process.env.DIFY_API_BASE || "https://api.dify.ai/v1").replace(/\/$/, "");
const DIFY_USER = process.env.DIFY_USER || "web-user";

// req.body 가 이미 Buffer 면 그대로, 아니면 스트림을 모아서 Buffer 로.
function readBuffer(req) {
  if (Buffer.isBuffer(req.body)) return Promise.resolve(req.body);
  if (req.body && typeof req.body === "object" && req.body.type === "Buffer") {
    return Promise.resolve(Buffer.from(req.body.data));
  }
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "POST 만 허용됩니다." });
  }

  // 비밀 토큰 검증 (환경변수 ACCESS_TOKEN 이 설정된 경우에만 동작)
  const need = process.env.ACCESS_TOKEN;
  if (need && req.headers["x-access-token"] !== need) {
    return res.status(401).json({ error: "접근 권한이 없습니다." });
  }

  const apiKey = process.env.DIFY_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "서버에 DIFY_API_KEY 가 설정되지 않았습니다." });
  }

  try {
    const filename = decodeURIComponent(req.headers["x-filename"] || "document");
    const mime = req.headers["x-filemime"] || "application/octet-stream";
    const buf = await readBuffer(req);

    if (!buf || buf.length === 0) {
      return res.status(400).json({ error: "파일 내용이 비어 있습니다." });
    }

    const form = new FormData();
    form.append("file", new Blob([buf], { type: mime }), filename);
    form.append("user", DIFY_USER);

    const r = await fetch(`${DIFY_BASE}/files/upload`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form,
    });

    const text = await r.text();
    if (!r.ok) {
      return res.status(502).json({ error: `Dify 파일 업로드 실패 (${r.status})`, detail: text.slice(0, 500) });
    }

    let data;
    try { data = JSON.parse(text); } catch { data = {}; }
    if (!data.id) {
      return res.status(502).json({ error: "Dify 응답에 파일 ID가 없습니다.", detail: text.slice(0, 500) });
    }

    return res.status(200).json({ id: data.id, name: data.name || filename });
  } catch (e) {
    return res.status(500).json({ error: "업로드 처리 중 오류", detail: String(e).slice(0, 500) });
  }
}
