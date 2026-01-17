export default async function handler(req, res) {
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

    try {
        const payload = req.body || {};
        const ip =
            (req.headers["x-forwarded-for"] || "").toString().split(",")[0].trim() ||
            req.socket?.remoteAddress ||
            "";

        const r = await fetch("https://web.nuralite.co.nz/api/leads/Solution_Users/default.aspx/Lead_Add", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ ...payload, IP_Address: ip })
        });

        const j = await r.json().catch(() => ({}));
        return res.status(200).json({ ipCaptured: ip || null, data: j });
    } catch (e) {
        return res.status(500).json({ error: e?.message || String(e) });
    }
}
