/**
 * Xerophis WebSocket realtime server (production transport).
 *
 * The in-browser client uses Server-Sent Events (`/api/realtime`) by default,
 * which works through any reverse proxy and is the path used by the demo.
 * This WebSocket server is the drop-in upgrade for production/VPS: it accepts
 * WS connections on `wss://host/ws` and broadcasts realtime events.
 *
 * Run locally:  node server/realtime-ws.mjs
 * In Docker:    xerophis-realtime service (see docker-compose.yml)
 */
import { WebSocketServer } from "ws";
import { createServer } from "node:http";

const PORT = Number(process.env.REALTIME_PORT ?? 3001);
const wss = new WebSocketServer({ noServer: true });
const server = createServer();
const clients = new Set();

server.on("upgrade", (req, socket, head) => {
  let pathname = "/ws";
  try {
    pathname = new URL(req.url ?? "/", "http://" + req.headers.host).pathname;
  } catch {}
  if (pathname !== "/ws") return socket.destroy();
  // Security note: verify the `xerophis_session` cookie here in production.
  wss.handleUpgrade(req, socket, head, (ws) => wss.emit("connection", ws, req));
});

wss.on("connection", (ws) => {
  clients.add(ws);
  ws.send(JSON.stringify({ type: "connected", data: { service: "xerophis-realtime" }, ts: Date.now() }));
  ws.on("message", async (raw) => {
    let msg;
    try { msg = JSON.parse(String(raw)); } catch { return; }
    broadcast({ type: msg.type ?? "event", data: msg.data, ts: Date.now() });
  });
  ws.on("close", () => clients.delete(ws));
});

function broadcast(payload) {
  const text = JSON.stringify(payload);
  for (const c of clients) if (c.readyState === 1) c.send(text);
}

server.on("request", (req, res) => {
  if (req.method === "POST" && req.url === "/emit") {
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", () => {
      try {
        const parsed = JSON.parse(body);
        broadcast({ type: parsed.type ?? "event", data: parsed.data, ts: Date.now() });
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: true }));
      } catch {
        res.writeHead(400); res.end("{}");
      }
    });
    return;
  }
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ status: "ok", app: "Xerophis realtime" }));
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`[xerophis-realtime] WebSocket server listening on ws://0.0.0.0:${PORT}/ws`);
});
