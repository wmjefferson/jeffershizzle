<div align="center">
  <img src="../other/assets/jeffersh-git.jpeg" alt="Jeffershizzle banner" width="800" />
</div>

# Jeffershizzle

Jeffershizzle is a static image gallery with a small Python API for serving local and deployed image sets.

## What it includes

- a single-page gallery frontend
- a Python image API for local and server-hosted image folders
- Cloudflare tunnel support for the public API hostname
- local development flow that can run entirely from the project folder

## Local development

Frontend:

```powershell
python -m http.server 5500
```

Open:

- `http://127.0.0.1:5500/`

Local API:

```powershell
Set-Location C:\Users\wmjef\Desktop\Precious Box\Dotcoms\jeffershizzle\scripts
python jeffershizzle_images_api.py
```

This serves the API on port `8030` and expects the image library at:

- `E:\jeffershizzle\images`

## Production model

- frontend: `jeffershizzle.com`
- API: `https://api.jeffershizzle.com`
- image storage: `E:\jeffershizzle\images`
- tunnel name: `api-jeffershizzle`

## Companion docs

- `SETUP.md` for the full server and deployment walkthrough
- `JEFFERSHIZZLE_WORKFLOW.md` for the operating model and safe update pattern
