<div align="center">
  <img src="./git-banner.jpeg" alt="Jeffershizzle Banner" width="800" />
</div>

# Jeffershizzle — Setup Guide for Home Computer

## What's in This Export

```
jeffershizzle-export/
├── spa/                          ← The SPA website (deploy to ASO)
│   ├── index.html
│   ├── manifest.json
│   ├── css/styles.css
│   ├── js/config.js
│   └── js/app.js
├── scripts/                      ← Server scripts (run on home computer)
│   ├── jeffershizzle_images_api.py   ← Image API (port 8030)
│   └── copy_jeffershizzle_images.py  ← Image migration tool
├── manifest.json                 ← Master manifest (backup copy)
└── SETUP.md                      ← This file
```

---

## Step 1: Set Up Image Folder

The API serves images from `E:\jeffershizzle\images\`.

If you already ran `copy_jeffershizzle_images.py` on the server, you need those
images on your home machine too. Either:

- **Copy** the `E:\jeffershizzle\images\` folder from the server
- **Or re-run** the copy script (requires `jeffershizzle-legacy\EXP\` folder + `_tree_data.json`)

The BACK02 landing backgrounds should be at:
```
E:\jeffershizzle\images\landing\01.jpg through 92.jpg
```

---

## Step 2: Install & Run the API

```powershell
# From wherever you put the scripts:
python jeffershizzle_images_api.py
```

It will start on port 8030, serving from `E:\jeffershizzle\images\`.

> **Optional:** Install Pillow for image dimension metadata:
> `pip install Pillow`

---

## Step 3: Run the Cloudflare Tunnel

```powershell
cloudflared.exe tunnel run --token eyJhIjoiNmY0NGE5MzZjY2Y0NzFhNDYwNDM1Zjg1MzZkZTg4ZTgiLCJ0IjoiNWNiMjlkOGItNzk0MC00MDk0LTgyMWUtMjcxMmIzNDlhMmRkIiwicyI6IllUazRZakUxTkRBdE5Fa3paQzAwWmpObUxXRmlPREV0WmpSak1tSTNOemN6TmpZdyJ9
```

This routes `api.jeffershizzle.com` → `localhost:8030`.

Make sure the tunnel's public hostname is configured in Cloudflare dashboard:
- **Subdomain:** `api`
- **Domain:** `jeffershizzle.com`
- **Service:** `http://localhost:8030`

---

## Step 4: Deploy SPA to A Small Orange

Upload the contents of the `spa/` folder to your ASO web root for jeffershizzle.com:
- Via FTP/SFTP to the `public_html` directory
- Or via ASO's cPanel File Manager

Files to upload:
```
index.html
manifest.json
css/styles.css
js/config.js
js/app.js
```

---

## Step 5: Local Development

To develop locally without deploying:

```powershell
# Terminal 1: Image API
python jeffershizzle_images_api.py

# Terminal 2: Dev server (from the spa folder)
python -m http.server 5500 --directory path\to\spa

# Open: http://127.0.0.1:5500/
```

The SPA auto-detects localhost and uses `http://localhost:8030` for images.

---

## Route Map

| Route | Description |
|-------|-------------|
| `#/` | Landing page (random BACK02 background + text window) |
| `#/enter` | Entry gallery (two photos, click to enlarge) |
| `#/NNN` | Gallery (293 galleries, NNN = 001-293) |
| `#/NNN/N` | Enlarged photo (click follows spiderweb link) |
| `#/browse` | Alphabetical category listing (301 entries) |

---

## Key Config

- **API port:** 8030
- **Image root:** `E:\jeffershizzle\images\`
- **CORS origins:** `jeffershizzle.com`, `www.jeffershizzle.com`, `localhost:3000`, `localhost:5500`
- **Cloudflare tunnel:** `api-jeffershizzle` (ID: 8e56ed6a-8926-4e30-9f43-e964aa762f26)
- **ASO host:** 143.95.39.115

---

## Antigravity Conversation

This project was built in conversation ID: `44db77cb-f193-4686-9fb5-05dbef263283`

Key artifacts are in:
```
C:\Users\Bill\.gemini\antigravity\brain\44db77cb-f193-4686-9fb5-05dbef263283\
├── implementation_plan.md
├── task.md
├── walkthrough.md
├── cloudflare_tunnel_setup.md
├── site_analysis.md
├── gallery_tree_structure.md
├── spiderweb_connections.md
└── spiderweb_link_map.md
```
