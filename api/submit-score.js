// Vercel 서버리스 함수: 점수 제출(위변조 방지용)
//
// 클라이언트는 이 엔드포인트로만 점수를 보낼 수 있고, 실제 DB 쓰기는
// 서버에만 보관된 service_role 키로 수행한다(브라우저에 노출 안 됨).
// Supabase 테이블 RLS에서 anon 의 insert 정책을 제거하면, 클라이언트가
// 직접 임의 점수를 넣는 것을 막을 수 있다(읽기는 공개 유지).
//
// Vercel 환경변수(Project Settings > Environment Variables)에 설정 필요:
//   - SUPABASE_URL                : 예) https://xxxx.supabase.co
//   - SUPABASE_SERVICE_ROLE_KEY   : Supabase > Project Settings > API > service_role (secret)
//     ※ service_role 키는 절대 저장소/클라이언트에 커밋하지 말 것.

const MAX_SCORE = 99999999;
const MAX_COINS = 99999999;

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "method-not-allowed" });

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return res.status(500).json({ error: "server-not-configured" });

  let body = req.body;
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch (e) {
      body = {};
    }
  }
  body = body || {};

  const nick = String(body.nick || "")
    .replace(/[\u0000-\u001f]/g, "")
    .trim()
    .slice(0, 10);
  const score = Math.floor(Number(body.score));
  const coins = Math.floor(Number(body.coins));

  // 유효성/타당성 검사 (말이 안 되는 값 차단)
  if (!nick) return res.status(400).json({ error: "invalid-nick" });
  if (!Number.isFinite(score) || score < 0 || score > MAX_SCORE) {
    return res.status(400).json({ error: "invalid-score" });
  }
  if (!Number.isFinite(coins) || coins < 0 || coins > MAX_COINS) {
    return res.status(400).json({ error: "invalid-coins" });
  }

  try {
    const r = await fetch(`${url}/rest/v1/scores`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: key,
        Authorization: `Bearer ${key}`,
        Prefer: "return=minimal",
      },
      body: JSON.stringify({ nick, score, coins }),
    });
    if (!r.ok) {
      const detail = await r.text().catch(() => "");
      return res.status(502).json({ error: "db-error", detail: detail.slice(0, 200) });
    }
    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(502).json({ error: "network-error" });
  }
};
