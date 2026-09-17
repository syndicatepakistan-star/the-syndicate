# Email / calendar DNS for `the-syndicate.com`

Calendar invites come from Google Calendar for **`audit@the-syndicate.com`**.
Gmail’s “Invitation from an unknown sender” banner appears when the recipient has never interacted with that address before. Correct DNS does **not** remove that first-time banner entirely, but it improves deliverability and trust (less spam / spoof risk).

Do **not** change MX / SPF / DKIM / DMARC when only switching the website (Railway ↔ Hostinger). See `DNS_ROLLBACK_the-syndicate.com.md`.

## 1. Confirm Google Workspace owns the mailbox

`audit@the-syndicate.com` must be a real Google Workspace user (or Google Group that can own a calendar). OAuth for booking uses that account.

## 2. SPF (TXT on apex)

In Hostinger DNS for `the-syndicate.com`, ensure one SPF TXT on `@`:

```text
v=spf1 include:_spf.google.com ~all
```

If you already have an SPF record (e.g. Resend / Klaviyo), **merge** into a single TXT — do not create two SPF records:

```text
v=spf1 include:_spf.google.com include:amazonses.com include:spf.klaviyo.com ~all
```

(Adjust includes to match whatever you already use for Resend/Klaviyo/SMTP.)

## 3. DKIM (Google Workspace)

1. Admin console → **Apps** → **Google Workspace** → **Gmail** → **Authenticate email**
2. Generate DKIM for `the-syndicate.com`
3. Add the TXT record Google shows (usually `google._domainkey`)
4. Click **Start authentication** after DNS propagates (can take up to 48h; often minutes)

## 4. DMARC (recommended)

TXT on `_dmarc`:

```text
v=DMARC1; p=none; rua=mailto:audit@the-syndicate.com; pct=100
```

Start with `p=none`, then move to `quarantine` / `reject` once reports look clean.

## 5. Calendar display timezone (organizer)

Even with guest timezone on events, set the founder calendar default:

1. Sign in as `audit@the-syndicate.com`
2. Google Calendar → **Settings** → **General** → **Timezone**
3. Prefer **United Kingdom** (`Europe/London`) if that is the label you want on invites when no guest TZ is sent

App booking now sends the guest’s selected city timezone (e.g. London) on the event, so invites should show **11:00 London**, not Paris CEST.

## 6. Quick checks

| Check | Tool |
|-------|------|
| SPF / DKIM / DMARC | [MXToolbox](https://mxtoolbox.com/) or [Google Admin Toolbox Check MX](https://toolbox.googleapps.com/apps/checkmx/) |
| From alignment | Send a test from `audit@…` and view “Show original” in Gmail (`spf=pass`, `dkim=pass`, `dmarc=pass`) |

## Unknown-sender banner (expected on first contact)

Gmail still shows:

> You haven’t interacted with audit@the-syndicate.com before

That is **recipient reputation**, not a broken DNS record. Recipients can click **Yes** to auto-add future invites. Warming the address (real replies, consistent From name “THE SYNDICATE”) reduces friction over time.
