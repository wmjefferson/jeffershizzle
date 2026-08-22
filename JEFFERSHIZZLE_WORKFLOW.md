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

Jeffershizzle uses Vite for instant hot module reloading and bundling.

### Frontend

Run the Vite dev server from the project root:

```powershell
npm run dev
```

Open:

- `http://localhost:5500/`

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

Build and publish automatically:

```powershell
npm run publish
```

Or build manually to `dist/` with `npm run build` and upload the contents of `dist/` to ASO `public_html`.

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

1. Edit locally in `jeffershizzle` with `npm run dev`
2. Test against `http://localhost:5500` and API
3. Push to GitHub if desired
4. Run `npm run publish` to build and upload to ASO
5. If backend changed, update the server-side script and restart it

## Notes

- This project came from a Google AI export and now lives as a static SPA plus Python image API.
- The zip export is kept in the project root as a source backup:
  - `jeffershizzle.zip`
