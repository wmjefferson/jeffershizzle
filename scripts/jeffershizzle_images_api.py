"""
Jeffershizzle Images API
Serves gallery images for jeffershizzle.com
Port: 8030  |  Root: E:\\jeffershizzle\\images
"""

import json
import mimetypes
import shutil
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, unquote, urlparse

try:
    from PIL import Image

    PIL_AVAILABLE = True
except ImportError:
    PIL_AVAILABLE = False

ROOT = Path(r"E:\jeffershizzle\images").resolve()
HOST = "0.0.0.0"
PORT = 8030

IMAGE_EXTS = {
    ".jpg",
    ".jpeg",
    ".png",
    ".gif",
    ".webp",
    ".bmp",
    ".svg",
    ".tif",
    ".tiff",
    ".avif",
    ".jfif",
}

ALLOWED_ORIGINS = {
    "https://www.jeffershizzle.com",
    "https://jeffershizzle.com",
    "http://localhost:3000",
    "http://localhost:5500",
    "http://127.0.0.1:5500",
}


def safe_path(rel_path: str) -> Path:
    """Resolve a relative path safely, preventing directory traversal."""
    rel_path = rel_path.replace("\\", "/").strip("/")
    target = (ROOT / rel_path).resolve()
    if target != ROOT and ROOT not in target.parents:
        raise ValueError("Path escapes root")
    return target


def rel_url(path: Path) -> str:
    return path.relative_to(ROOT).as_posix()


def guess_kind(ext: str) -> str:
    return "image" if ext.lower() in IMAGE_EXTS else "other"


def get_cors_origin(handler: BaseHTTPRequestHandler) -> str | None:
    """Return the origin if it is in the allowed list."""
    origin = handler.headers.get("Origin", "")
    return origin if origin in ALLOWED_ORIGINS else None


class Handler(BaseHTTPRequestHandler):
    def _cors_headers(self) -> None:
        """Add CORS headers to the response when the origin is allowed."""
        origin = get_cors_origin(self)
        if origin:
            self.send_header("Access-Control-Allow-Origin", origin)
            self.send_header("Access-Control-Allow-Credentials", "true")
            self.send_header("Access-Control-Allow-Headers", "Content-Type")
            self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")

    def _send_json(self, data, status=200) -> None:
        body = json.dumps(data, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self._cors_headers()
        self.end_headers()
        self.wfile.write(body)

    def _send_file(self, file_path: Path) -> None:
        """Serve a file with appropriate headers and aggressive caching."""
        if not file_path.is_file():
            self._send_json({"error": "File not found"}, 404)
            return

        ctype, _ = mimetypes.guess_type(str(file_path))
        ctype = ctype or "application/octet-stream"
        size = file_path.stat().st_size

        self.send_response(200)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(size))
        self.send_header("Cache-Control", "public, max-age=31536000, immutable")
        self._cors_headers()
        self.end_headers()

        with open(file_path, "rb") as file_handle:
            shutil.copyfileobj(file_handle, self.wfile)

    def do_OPTIONS(self) -> None:
        self.send_response(204)
        origin = get_cors_origin(self)
        if origin:
            self.send_header("Access-Control-Allow-Origin", origin)
            self.send_header("Access-Control-Allow-Credentials", "true")
            self.send_header("Access-Control-Allow-Headers", "Content-Type")
            self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
        self.end_headers()

    def do_GET(self) -> None:
        parsed = urlparse(self.path)
        path = parsed.path
        query = parse_qs(parsed.query)

        try:
            if path.startswith("/images/"):
                rel = unquote(path[len("/images/") :])
                target = safe_path(rel)
                self._send_file(target)
                return

            if path == "/api/list":
                rel = unquote(query.get("path", [""])[0])
                current = safe_path(rel)
                if not current.exists() or not current.is_dir():
                    self._send_json({"error": "Folder not found"}, 404)
                    return

                folders = []
                files = []
                for entry in sorted(current.iterdir(), key=lambda p: (not p.is_dir(), p.name.lower())):
                    if entry.name.startswith("."):
                        continue
                    item = {
                        "name": entry.name,
                        "path": rel_url(entry),
                    }
                    if entry.is_dir():
                        item["type"] = "directory"
                        folders.append(item)
                    elif guess_kind(entry.suffix) == "image":
                        item["type"] = "image"
                        item["url"] = f"/images/{rel_url(entry)}"
                        item["size"] = entry.stat().st_size
                        files.append(item)

                self._send_json(
                    {
                        "current": rel,
                        "folders": folders,
                        "images": files,
                        "counts": {
                            "folders": len(folders),
                            "images": len(files),
                        },
                    }
                )
                return

            if path.startswith("/api/gallery/"):
                gallery_id = unquote(path[len("/api/gallery/") :]).strip("/")
                gallery_path = safe_path(gallery_id)
                if not gallery_path.is_dir():
                    self._send_json({"error": "Gallery not found"}, 404)
                    return

                images = []
                for entry in sorted(gallery_path.iterdir(), key=lambda p: p.name.lower()):
                    if entry.is_file() and guess_kind(entry.suffix) == "image":
                        meta = {"name": entry.name, "url": f"/images/{rel_url(entry)}"}
                        if PIL_AVAILABLE and entry.suffix.lower() != ".svg":
                            try:
                                with Image.open(entry) as img:
                                    meta["width"], meta["height"] = img.size
                            except Exception:
                                pass
                        images.append(meta)

                self._send_json({"id": gallery_id, "images": images, "count": len(images)})
                return

            if path in ("/", "/index.html", "/health"):
                galleries = [directory.name for directory in ROOT.iterdir() if directory.is_dir()] if ROOT.exists() else []
                html = f"""<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Jeffershizzle Images API</title>
    <style>
    :root {{ color-scheme: dark; }}
    body {{
        margin: 0;
        min-height: 100vh;
        display: grid;
        place-items: center;
        background: #111;
        color: #e5e5e5;
        font: 16px/1.6 "Segoe UI", Arial, sans-serif;
    }}
    main {{
        width: min(520px, calc(100vw - 48px));
        padding: 28px 32px;
        border: 1px solid #333;
        background: #1a1a1a;
    }}
    h1 {{ margin: 0 0 8px; font-size: 24px; }}
    code {{
        display: inline-block;
        padding: 2px 6px;
        background: #222;
        border: 1px solid #333;
        font-size: 14px;
    }}
    .ok {{ color: #4ade80; }}
    </style>
</head>
<body>
    <main>
        <h1>jeffershizzle images api</h1>
        <p class="ok">API running - serving {len(galleries)} galleries from port {PORT}</p>
        <p>Endpoints:</p>
        <ul>
            <li><code>/images/&lt;gallery&gt;/&lt;file&gt;</code> - serve image</li>
            <li><code>/api/list?path=&lt;gallery&gt;</code> - list contents</li>
            <li><code>/api/gallery/&lt;id&gt;</code> - gallery info with dimensions</li>
        </ul>
    </main>
</body>
</html>""".encode("utf-8")
                self.send_response(200)
                self.send_header("Content-Type", "text/html; charset=utf-8")
                self.send_header("Content-Length", str(len(html)))
                self._cors_headers()
                self.end_headers()
                self.wfile.write(html)
                return

            self._send_json({"error": "Not found"}, 404)

        except ValueError:
            self._send_json({"error": "Invalid path"}, 400)
        except Exception as exc:
            self._send_json({"error": str(exc)}, 500)

    def log_message(self, format, *args) -> None:
        """Keep logs quiet unless something useful happened."""
        if len(args) >= 2:
            status = str(args[1])
            if status.startswith(("4", "5")):
                super().log_message(format, *args)
            elif "/images/" not in str(args[0]):
                super().log_message(format, *args)


if __name__ == "__main__":
    ROOT.mkdir(parents=True, exist_ok=True)
    print("Jeffershizzle Images API")
    print(f"  Root:  {ROOT}")
    print(f"  Port:  {PORT}")
    print(f"  URL:   http://localhost:{PORT}")
    print(f"  CORS:  {', '.join(sorted(ALLOWED_ORIGINS))}")
    print()
    server = ThreadingHTTPServer((HOST, PORT), Handler)
    server.serve_forever()
