# Cloudflare Tunnel Setup — api-jeffershizzle

## Step 0: Is jeffershizzle.com on Cloudflare DNS yet?

Check: go to [dash.cloudflare.com](https://dash.cloudflare.com) → see if `jeffershizzle.com` appears as a zone.

- **If YES** → skip to Step 1
- **If NO** → do Step 0a first

### Step 0a: Add jeffershizzle.com to Cloudflare

1. Cloudflare dashboard → **Add a site** → enter `jeffershizzle.com`
2. Pick the **Free** plan
3. Cloudflare scans existing DNS records. Verify it found these (add if missing):

   | Type | Name | Value | Proxy |
   |------|------|-------|-------|
   | A | `jeffershizzle.com` | `143.95.39.115` | Proxied (orange cloud) |
   | A | `www` | `143.95.39.115` | Proxied (orange cloud) |

4. Cloudflare gives you two nameservers (e.g. `ada.ns.cloudflare.com`, `lee.ns.cloudflare.com`)
5. Go to your **domain registrar** (wherever you bought jeffershizzle.com) → update nameservers to Cloudflare's two
6. Wait for propagation (usually 10 min – 24 hrs)

> [!NOTE]
> This does **NOT** move your website off A Small Orange. ASO still hosts the site files. Cloudflare just sits in front as a DNS proxy/CDN. Everything keeps working exactly as before.

---

## Step 1: Create the tunnel

On your home server, open PowerShell:

```powershell
cloudflared tunnel create api-jeffershizzle
```

This prints something like:
```
Tunnel credentials written to C:\Users\Bill\.cloudflared\<tunnel-id>.json
Created tunnel api-jeffershizzle with id abcd1234-...
```

**Save that tunnel ID** — you'll need it in Step 2.

---

## Step 2: Route DNS

```powershell
cloudflared tunnel route dns api-jeffershizzle api.jeffershizzle.com
```

This creates a CNAME record in Cloudflare pointing `api.jeffershizzle.com` → your tunnel.

---

## Step 3: Create config (optional but recommended)

Create `C:\Users\Bill\.cloudflared\config-jeffershizzle.yml`:

```yaml
tunnel: <paste-tunnel-id-here>
credentials-file: C:\Users\Bill\.cloudflared\<paste-tunnel-id-here>.json

ingress:
  - hostname: api.jeffershizzle.com
    service: http://localhost:8030
  - service: http_status:404
```

---

## Step 4: Test-run the tunnel

```powershell
cloudflared tunnel --config C:\Users\Bill\.cloudflared\config-jeffershizzle.yml run
```

If it connects, you should see `Registered tunnel connection` messages.

> [!TIP]
> If you prefer using token files like your other tunnels, you can also go to **Cloudflare Zero Trust dashboard** → **Tunnels** → select `api-jeffershizzle` → copy the token, save it to `C:\Users\Bill\.cloudflared\tokens\api-jeffershizzle.token`, and run with:
> ```powershell
> cloudflared tunnel run --token-file C:\Users\Bill\.cloudflared\tokens\api-jeffershizzle.token
> ```

---

## Step 5: Verify

Once both the API (port 8030) and tunnel are running:

```
https://api.jeffershizzle.com/
```

Should show the API status page. We'll build the API script next.

---

## Updated Startup Notes

Add to `DOTCOM NOTES SERVER.txt`:

```
VSCODE -    python E:\scripts\jeffershizzle_images_api.py
VSCODE -    cloudflared tunnel run --token-file C:\Users\Bill\.cloudflared\tokens\api-jeffershizzle.token

cloudflared tunnel list should show
    api-perihelion
    api-dookydetective
    api-jeffershizzle
with active connections.
```

---

## Summary

| What | Where |
|------|-------|
| `www.jeffershizzle.com` | A Small Orange (143.95.39.115) — SPA files |
| `api.jeffershizzle.com` | Cloudflare Tunnel → localhost:8030 — images |
| Tunnel name | `api-jeffershizzle` |
| API script | `E:\scripts\jeffershizzle_images_api.py` |
| Images | `E:\jeffershizzle\images\001\` through `293\` |
