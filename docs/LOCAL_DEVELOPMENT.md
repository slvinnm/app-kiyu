# Local development

Local multi-hostname setup on Windows + Laragon (nginx), so every application is
reachable through a `.test` domain with no port in the browser URL.

| URL | Serves |
| --- | --- |
| `http://kiyu.test` | Next.js marketing site |
| `http://app.kiyu.test` | Next.js SaaS portal + platform admin |
| `http://{tenant}.kiyu.test` | Next.js tenant app (e.g. `acme.kiyu.test`) |
| `http://api.kiyu.test` | Laravel API |

One Next.js dev server serves all frontend hosts. Tenant and application context
come from the hostname, not from a separate server or a per-tenant env value.

## Architecture

```
browser ──80──> nginx (Laragon 1.31.9)
                   ├─ kiyu.test, app.kiyu.test, *.kiyu.test ──proxy──> 127.0.0.1:3000 (next dev)
                   └─ api.kiyu.test ──fastcgi──> php-fpm 9003/9004 ──> C:\laragon\www\kiyu\public
```

Hostname → area mapping lives in `lib/tenant/host.ts`:

| Host | Meaning |
| --- | --- |
| `kiyu.test` | marketing (`/` is rewritten to `/marketing` by `proxy.ts`) |
| `app.kiyu.test` | portal / platform admin |
| `{one-label}.kiyu.test` | tenant; the slug is that label |
| `api.kiyu.test` | API only, never reaches Next.js |

`app`, `api`, `kiyu`, `www` are reserved labels and never tenant slugs. Unknown
or inactive tenant slugs are rejected by the API (`404 Tenant not found.`).

## Files

| File | Purpose |
| --- | --- |
| `C:\laragon\etc\nginx\sites-enabled\00-upgrade-map.conf` | `$connection_upgrade` map for WebSocket proxying |
| `C:\laragon\etc\nginx\sites-enabled\00-kiyu-frontend.conf` | frontend vhosts → `127.0.0.1:3000` |
| `C:\laragon\etc\nginx\sites-enabled\api.kiyu.test.conf` | Laravel vhost → `C:/laragon/www/kiyu/public` |
| `app-kiyu/next.config.ts` | `allowedDevOrigins` for every frontend host |
| `app-kiyu/lib/tenant/host.ts` | host → tenant slug |
| `app-kiyu/proxy.ts` | marketing rewrite on the bare host |
| `app-kiyu/app/marketing/page.tsx` | marketing page |
| `kiyu/config/cors.php` | `CORS_ALLOWED_ORIGIN_PATTERNS` support |
| `docs/setup-acrylic-dns.ps1` | wildcard DNS setup (elevated, once) |

## Wildcard DNS

Windows hosts files have no wildcard support. Acrylic DNS Proxy (installed via
`winget install Mayakron.AcrylicDNS`) resolves `*.kiyu.test` to `127.0.0.1` and
forwards everything else upstream.

```powershell
# Elevated PowerShell, once. Writes the Acrylic hosts entry, points the active
# adapter's DNS at 127.0.0.1, restarts the service.
powershell -ExecutionPolicy Bypass -File docs/setup-acrylic-dns.ps1
```

`C:\Program Files (x86)\Acrylic DNS Proxy\AcrylicHosts.txt` then contains:

```
127.0.0.1 kiyu.test *.kiyu.test
```

Verify:

```bash
nslookup acme.kiyu.test 127.0.0.1
ping -n 1 acme.kiyu.test
```

### Fallback without a DNS proxy

Add explicit lines to `C:\Windows\System32\drivers\etc\hosts` (needs elevation)
and remove the adapter DNS override:

```
127.0.0.1 kiyu.test app.kiyu.test api.kiyu.test acme.kiyu.test beta.kiyu.test
```

Scripts and browsers then only resolve the listed tenants; add a line per new
tenant.

## Environment

### Frontend — `C:\laragon\www\app-kiyu`

`.env` and `.env.local` (dotenvx loads both; keep them in sync):

```dotenv
API_BASE_URL=http://api.kiyu.test/api
NEXT_PUBLIC_API_BASE_URL=http://api.kiyu.test/api
NEXT_PUBLIC_REVERB_HOST=kiyu.test
NEXT_PUBLIC_REVERB_PORT=6001
NEXT_PUBLIC_REVERB_SCHEME=http
```

`NEXT_PUBLIC_TENANT_SLUG` is a fallback for non-tenant hosts such as
`localhost:3000`; on `{slug}.kiyu.test` the slug comes from the hostname and the
value is ignored. `www`, `app`, `api`, `kiyu` are never tenant slugs.

### Backend — `C:\laragon\www\kiyu`

```dotenv
APP_URL=http://api.kiyu.test
CORS_ALLOWED_ORIGINS=http://kiyu.test,http://app.kiyu.test
CORS_ALLOWED_ORIGIN_PATTERNS=#^http://[a-z0-9-]+[.]kiyu[.]test$#
```

- Write dots as `[.]` in `CORS_ALLOWED_ORIGIN_PATTERNS`: dotenv rejects an
  unquoted backslash escape.
- `supports_credentials` stays `false`. Auth is a Bearer token (from the API)
  stored in a signed HttpOnly cookie; no cookie crosses an origin boundary.
- Sanctum stateful domains are not used. `SESSION_DOMAIN=null` stays.
- After editing backend `.env`, clear the config cache:

  ```bash
  cd /c/laragon/www/kiyu
  php artisan config:clear
  ```

## Startup

```bash
# Laragon: Start All (nginx, PHP FastCGI, MySQL, and Reverb or `php artisan reverb:start`)
cd /c/laragon/www/app-kiyu && npm run dev      # next dev on :3000
```

`next dev` binds `0.0.0.0:3000`; nginx proxies to `127.0.0.1`. No browser URL
needs a port.

## Surviving a reboot

Laragon regenerates `auto.*.conf` vhosts for every project (including
`auto.kiyu.test.conf` → Laravel) whenever it starts, and it deletes renamed
`.disabled` copies. The `00-` prefix keeps `00-kiyu-frontend.conf` ahead of them
in nginx's `sites-enabled/*.conf` glob, so the frontend keeps winning.

After any reboot or Laragon "Start All", check once:

```bash
cd /c/laragon/bin/nginx/nginx-1.31.9
./nginx.exe -t 2>&1 | grep -i "conflict"   # silence = healthy
```

If it prints `conflicting server name "kiyu.test" ... ignored`, the duplicate
Laravel vhost is loaded anyway; remove it:

```bash
rm /c/laragon/etc/nginx/sites-enabled/auto.kiyu.test.conf \
   /c/laragon/etc/nginx/sites-enabled/auto.app-kiyu.test.conf
cd /c/laragon/bin/nginx/nginx-1.31.9 && ./nginx.exe -s reload
```

Notes: Acrylic is a Windows service (`Automatic`) and starts itself; the adapter
DNS override persists. `SSLEnabled=0` in `C:\laragon\usr\laragon.ini` means
nothing listens on 443 — HTTP only, as on the initial setup. The `next dev`
process does not auto-start: run `npm run dev` after each reboot.

## Verification

```bash
for h in kiyu.test app.kiyu.test acme.kiyu.test api.kiyu.test; do
  printf "%-22s %s\n" "$h" "$(curl -s -o /dev/null -w '%{http_code}' "http://$h/")"
done
```

Expected: `kiyu.test 200`, `app.kiyu.test 307` (→ `/login`), `acme.kiyu.test 307`,
`api.kiyu.test/up 200`.

| Check | Command |
| --- | --- |
| Marketing page | `curl -s http://kiyu.test/ \| head` |
| Portal login | `curl -s -o /dev/null -w '%{http_code}' http://app.kiyu.test/login` → `200` |
| Tenant login | `curl -s -o /dev/null -w '%{http_code}' http://acme.kiyu.test/login` → `200` |
| API health | `curl -s http://api.kiyu.test/up \| grep -o 'Application up'` |
| Tenant resolution | `curl -s -H 'X-Tenant-Slug: acme' http://api.kiyu.test/api/departments/active` |
| Unknown tenant | `curl -s -o /dev/null -w '%{http_code}' -H 'X-Tenant-Slug: nobody' http://api.kiyu.test/api/departments/active` → `404` |
| CORS allow | `curl -s -D - -o /dev/null -X OPTIONS -H 'Origin: http://acme.kiyu.test' -H 'Access-Control-Request-Method: GET' http://api.kiyu.test/api/visits/x/track \| grep -i access-control-allow-origin` |
| CORS deny | same with `Origin: http://evil.example.com` → no `Access-Control-Allow-Origin` |
| HMR socket | DevTools → Network → WS → `_next/hmr` returns `101` and stays open |
| Frontend tests | `npm run test` |

HMR and Fast Refresh work through the proxy: the WebSocket upgrade returns `101`
and the map passes `Connection: upgrade` only when the client requested it.

## Troubleshooting

| Symptom | Cause / fix |
| --- | --- |
| `502 Bad Gateway` on a frontend host | `next dev` is not running. Start it, then retry. |
| `404` on a frontend host, `not found` | Tenant slug has no row / inactive, or the host is reserved. Check `select slug,status from tenants;` |
| `Brand new tenant host does not resolve` | Acrylic service stopped or adapter DNS changed. `Restart-Service AcrylicDNSProxySvc`; verify adapter DNS is `127.0.0.1`. |
| `Laragon regenerated auto.kiyu.test.conf` | Laragon rewrites auto vhosts on every Start All / reboot. The `00-` prefix on `00-kiyu-frontend.conf` makes nginx prefer it, but the duplicate still logs `conflicting server name` and Laragon's Laravel vhost would serve `*.kiyu.test` if the prefix were lost. Delete the generated `auto.kiyu.test.conf` and `auto.app-kiyu.test.conf`, then `nginx -s reload`. See "Surviving a reboot". |
| `The environment file is invalid` | A backslash escape in a backend `.env` value. Use `[.]` in patterns. |
| `CORS preflight blocked` | Origin missing from `CORS_ALLOWED_ORIGINS` or not matching the pattern; clear the backend config cache. |
| `api.kiyu.test` serves Next.js | A stray vhost with a broader `server_name`. `nginx -T \| grep -n api.kiyu.test`; remove the duplicate. |
| `nginx -t` fails | Run `C:\laragon\bin\nginx\nginx-1.31.9\nginx.exe -t` and read the reported file:line. Reload only after it passes. |

Logs: `C:\laragon\bin\nginx\nginx-1.31.9\logs\` (`error.log`,
`api.kiyu.test.access.log`, `api.kiyu.test.error.log`), Laravel at
`C:\laragon\www\kiyu\storage\logs\laravel.log`.

## Rollback

Everything above is reversible; nothing touches the database.

```powershell
# 1. Nginx: remove the added vhosts, restore Laragon's generated ones.
Remove-Item 'C:\laragon\etc\nginx\sites-enabled\00-kiyu-frontend.conf'
Remove-Item 'C:\laragon\etc\nginx\sites-enabled\api.kiyu.test.conf'
Remove-Item 'C:\laragon\etc\nginx\sites-enabled\00-upgrade-map.conf'
# Laragon recreates its own auto.*.conf vhosts on the next Start All.
C:\laragon\bin\nginx\nginx-1.31.9\nginx.exe -t
C:\laragon\bin\nginx\nginx-1.31.9\nginx.exe -s reload

# 2. DNS: restore the adapter DNS (was 192.168.216.229 on Wi-Fi), stop Acrylic,
#    remove its wildcard entry.
Set-DnsClientServerAddress -InterfaceAlias 'Wi-Fi' -ServerAddresses 192.168.216.229
Stop-Service AcrylicDNSProxySvc
Set-Service AcrylicDNSProxySvc -StartupType Disabled
# Remove the '127.0.0.1 kiyu.test *.kiyu.test' line from
# C:\Program Files (x86)\Acrylic DNS Proxy\AcrylicHosts.txt
winget uninstall Mayakron.AcrylicDNS
```

3. Revert the project files (`git checkout -- .env.example lib/actions/auth.ts
   next.config.ts proxy.ts`, delete `app/marketing/`, `lib/tenant/`, `docs/`) and
   restore the previous values in `app-kiyu/.env{,.local}` and `kiyu/.env`
   (`API_BASE_URL=https://kiyu.test/api`, `APP_URL=https://kiyu.test`, no CORS
   pattern). Then `php artisan config:clear`.

The adapter DNS is the only system-wide change, and it was
`192.168.216.229` (Wi-Fi, router) before this setup.
