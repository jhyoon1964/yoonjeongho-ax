// ============================================================
//  /api/generate — 업로드된 파일들로 Dify 교안 생성 워크플로우 실행
//  - 입력: { fileIds: [..], url: "" }
//  - Dify 워크플로우 변수 매핑:
//      doc → 업로드한 파일 목록(array[file])
//      url → 영상요약 텍스트 (v1.0 에서는 빈 값)
//  - 출력: Dify 가 반환한 교안 텍스트(result 변수)
// ============================================================

export const config = { maxDuration: 60 };

const DIFY_BASE = (process.env.DIFY_API_BASE || "https://api.dify.ai/v1").replace(/\/$/, "");
const DIFY_USER = process.env.DIFY_USER || "web-user";

function readJson(req) {
  if (req.body && typeof req.body === "object" && !Buffer.isBuffer(req.body)) {
    return Promise.resolve(req.body);
  }
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => {
      try { resolve(JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}")); }
      catch (e) { reject(e); }
    });
    req.on("error", reject);
  });
}

// Dify outputs 객체에서 교안 본문을 찾아낸다.
function pickResult(outputs) {
  if (!outputs || typeof outputs !== "object") return "";
  // PRD 기준 변수명은 result. 없으면 흔한 대체 키, 그래도 없으면 첫 문자열 값.
  const prefer = ["result", "text", "output", "answer", "교안"];
  for (const k of prefer) {
    if (typeof outputs[k] === "string" && outputs[k].trim()) return outputs[k];
  }
  for (const v of Object.values(outputs)) {
    if (typeof v === "string" && v.trim()) return v;
  }
  return "";
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "POST 만 허용됩니다." });
  }

  const need = process.env.ACCESS_TOKEN;
  if (need && req.headers["x-access-token"] !== need) {
    return res.status(401).json({ error: "접근 권한이 없습니다." });
  }

  const apiKey = process.env.DIFY_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "서버에 DIFY_API_KEY 가 설정되지 않았습니다." });
  }

  try {
    const body = await readJson(req);
    const fileIds = Array.isArray(body.fileIds) ? body.fileIds.filter(Boolean) : [];
    const url = typeof body.url === "string" ? body.url : "";

    if (fileIds.length === 0) {
      return res.status(400).json({ error: "업로드된 문서가 없습니다." });
    }

    const inputs = {
      doc: fileIds.map((id) => ({
        type: "document",
        transfer_method: "local_file",
        upload_file_id: id,
      })),
      url: url,
    };

    const r = await fetch(`${DIFY_BASE}/workflows/run`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ inputs, response_mode: "blocking", user: DIFY_USER }),
    });

    const text = await r.text();
    if (!r.ok) {
      return res.status(502).json({ error: `Dify 워크플로우 실행 실패 (${r.status})`, detail: text.slice(0, 800) });
    }

    let data;
    try { data = JSON.parse(text); } catch { data = {}; }

    const status = data?.data?.status;
    if (status && status !== "succeeded") {
      const errMsg = data?.data?.error || "워크플로우가 정상 종료되지 않았습니다.";
      return res.status(502).json({ error: `교안 생성 실패: ${errMsg}` });
    }

    const result = pickResult(data?.data?.outputs);
    if (!result) {
      return res.status(502).json({ error: "교안 결과를 찾지 못했습니다.", detail: JSON.stringify(data?.data?.outputs || {}).slice(0, 800) });
    }

    return res.status(200).json({ result });
  } catch (e) {
    return res.status(500).json({ error: "교안 생성 처리 중 오류", detail: String(e).slice(0, 500) });
  }
}
