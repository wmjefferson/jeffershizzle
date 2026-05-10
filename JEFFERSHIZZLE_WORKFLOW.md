# Jeffershizzle Workflow

## Source Of Truth

- Local source folder:
  - `C:\Users\wmjef\Desktop\Precious Box\Dotcoms\jeffershizzle`
- Live frontend host:
  - `jeffershizzle.com` on ASO `public_html`
- Live image API:
  - `https://api.jeffershizzle.com`
- Live image root on home server:
  - `E:\jeffershizzle\images`

## Local Development

Jeffershizzle is a static SPA, not a build-based React app.

### Frontend

Run a simple local server from the project root:

```powershell
python -m http.server 5500
```

Open:

- `http://127.0.0.1:5500/`

The SPA auto-switches to:

- `http://localhost:8030/images`

when loaded from localhost.

### Local API

If you want local API testing too:

```powershell
Set-Location C:\Users\wmjef\Desktop\Precious Box\Dotcoms\jeffershizzle\scripts
python jeffershizzle_images_api.py
```

That expects:

- `E:\jeffershizzle\images`

and runs on:

- `http://localhost:8030`

## Production Deployment

### Frontend

Upload these root items to ASO `public_html`:

- `index.html`
- `manifest.json`
- `css\`
- `js\`

### Backend

The live API should run from the home server with:

- script: `jeffershizzle_images_api.py`
- port: `8030`
- image root: `E:\jeffershizzle\images`
- public API: `https://api.jeffershizzle.com`
- Cloudflare tunnel: `api-jeffershizzle`

### Tunnel Startup

Store the tunnel token outside the repo:

```powershell
New-Item -ItemType Directory -Force C:\Users\Bill\.cloudflared\tokens
'<paste-api-jeffershizzle-token-here>' | Set-Content C:\Users\Bill\.cloudflared\tokens\api-jeffershizzle.token
```

Start the tunnel with:

```powershell
cloudflared.exe tunnel run --token-file C:\Users\Bill\.cloudflared\tokens\api-jeffershizzle.token
```

## Safe Update Pattern

1. Edit locally in `jeffershizzle`
2. Test with `python -m http.server 5500`
3. If API-related, test against `localhost:8030` or `https://api.jeffershizzle.com`
4. Push to GitHub if desired
5. Upload frontend files to ASO
6. If backend changed, update the server-side script and restart it

## Notes

- This project came from a Google AI export and now lives as a static SPA plus Python image API.
- The zip export is kept in the project root as a source backup:
  - `jeffershizzle.zip`
