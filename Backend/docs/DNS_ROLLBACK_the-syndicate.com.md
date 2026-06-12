# the-syndicate.com — DNS rollback (Hostinger → WordPress)

Saved **2026-05-19** before pointing the domain at Railway.

## WordPress / Hostinger (restore these to switch back)

| Type  | Name | TTL  | Content / Value                          |
|-------|------|------|------------------------------------------|
| ALIAS | `@`  | 300  | `the-syndicate.com.cdn.hstgr.net`        |
| CNAME | `www`| 300  | `www.the-syndicate.com.cdn.hstgr.net`    |

**Do not change** MX, SPF, DKIM, Resend, DMARC, autodiscover, or other email records when switching.

## Railway (current target — Syndicate Frontend)

| Type  | Name | TTL  | Content / Value                |
|-------|------|------|--------------------------------|
| ALIAS | `@`  | 300  | `i0nb8tzu.up.railway.app`      |
| CNAME | `www`| 300  | `i0nb8tzu.up.railway.app`      |

Railway verification TXT (apex):

| Type | Name              | Value                                                                 |
|------|-------------------|-----------------------------------------------------------------------|
| TXT  | `_railway-verify` | `railway-verify=cd1b56dc49176f09f565adb589f5cc9b3497fbc91a0105901583f08e4210ef81` |

## Switch back to WordPress

1. Hostinger → **the-syndicate.com** → **Manage DNS records**
2. **Edit** `ALIAS @` → `the-syndicate.com.cdn.hstgr.net`
3. **Edit** `CNAME www` → `www.the-syndicate.com.cdn.hstgr.net`
4. Delete any `_railway-verify*` TXT records if you added them
5. Wait 15–60 minutes; WordPress site returns on Hostinger

## Switch to Railway again

Reverse: set `@` ALIAS and `www` CNAME to `i0nb8tzu.up.railway.app` (or latest value from Railway → Domains → DNS records).
