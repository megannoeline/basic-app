const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || "0.0.0.0";
const ENABLE_CRASH = process.env.ENABLE_CRASH === "true";
const PUBLIC_DIR = path.join(__dirname, "public");
const INDEX_PATH = path.join(PUBLIC_DIR, "index.html");

function sendJson(res, statusCode, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "Content-Length": Buffer.byteLength(body)
  });
  res.end(body);
}

function sendHtml(res, statusCode, html) {
  res.writeHead(statusCode, {
    "Content-Type": "text/html; charset=utf-8",
    "Cache-Control": "no-store",
    "Content-Length": Buffer.byteLength(html)
  });
  res.end(html);
}

function notFound(res, pathname) {
  sendJson(res, 404, {
    ok: false,
    error: "Not Found",
    path: pathname
  });
}

const server = http.createServer((req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  const pathname = parsedUrl.pathname;

  if (pathname === "/favicon.ico") {
    res.writeHead(204);
    res.end();
    return;
  }

  if (pathname === "/health") {
    sendJson(res, 200, {
      ok: true,
      status: "healthy",
      timestamp: new Date().toISOString()
    });
    return;
  }

  if (pathname === "/api/success") {
    sendJson(res, 200, {
      ok: true,
      message: "Success response from basic-app",
      timestamp: new Date().toISOString()
    });
    return;
  }

  if (pathname === "/api/error" || pathname === "/api/fail") {
    const rawCode = Number(parsedUrl.searchParams.get("code"));
    const statusCode = Number.isInteger(rawCode) && rawCode >= 400 && rawCode <= 599 ? rawCode : 500;
    sendJson(res, statusCode, {
      ok: false,
      message: `Intentional failure with HTTP ${statusCode}`,
      timestamp: new Date().toISOString()
    });
    return;
  }

  if (pathname === "/api/slow" || pathname === "/api/timeout") {
    const rawMs = Number(parsedUrl.searchParams.get("ms"));
    const waitMs = Number.isInteger(rawMs) && rawMs >= 0 ? Math.min(rawMs, 60000) : 10000;
    setTimeout(() => {
      sendJson(res, 200, {
        ok: true,
        message: `Delayed success after ${waitMs}ms`,
        waitedMs: waitMs,
        timestamp: new Date().toISOString()
      });
    }, waitMs);
    return;
  }

  if (pathname === "/api/crash") {
    if (!ENABLE_CRASH) {
      sendJson(res, 403, {
        ok: false,
        message: "Crash endpoint is disabled. Set ENABLE_CRASH=true to enable it.",
        timestamp: new Date().toISOString()
      });
      return;
    }

    sendJson(res, 200, {
      ok: true,
      message: "Server will crash in 200ms",
      timestamp: new Date().toISOString()
    });

    setTimeout(() => {
      throw new Error("Intentional crash triggered via /api/crash");
    }, 200);
    return;
  }

  if (pathname === "/" || pathname === "/index.html") {
    fs.readFile(INDEX_PATH, "utf8", (err, html) => {
      if (err) {
        sendJson(res, 500, {
          ok: false,
          error: "Failed to read index.html"
        });
        return;
      }
      sendHtml(res, 200, html);
    });
    return;
  }

  notFound(res, pathname);
});

server.listen(PORT, HOST, () => {
  console.log(`basic-app listening on http://${HOST}:${PORT}`);
});
