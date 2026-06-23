# Syndicate Stream Catalog IDs

Stable **catalog slugs** survive DB wipes. Django `playlist_id` values are assigned on seed and printed in the manifest JSON.

## Commands (from `Backend/`)

```bash
# 1) Wipe all playlists/videos (+ optional test purchases)
python manage.py purge_stream_catalog --include-plan-purchases

# 2) Rebuild empty playlist structure (no StreamVideo rows)
python manage.py seed_syndicate_catalog --purge --publish --write-manifest catalog_manifest.json

# 3) Auto-link HLS when index.m3u8 exists in R2
python manage.py seed_syndicate_catalog --with-videos --link-r2
```

## Level 1 — Business Psychology (`level1-psych-01` … `level1-psych-11`)

| Slug | Title | R2 path hint |
|------|-------|----------------|
| `level1-psych-01` | The 9 to 5 Exit Strategy | `Business Psychology/9 to 5 Exit/Lesson 1 - 9 to 5 Exit Strategy/index.m3u8` |
| `level1-psych-02` | Zero to One Million | `Business Psychology/Zero to 1 Million/Lesson 1 - Zero to One Million/index.m3u8` |
| `level1-psych-03` | Hustle Hard | `Business Psychology/Hustle Hard/Intro/index.m3u8` |
| `level1-psych-04` | Mastering Consistency | `Business Psychology/Mastering Consistency/Intro/index.m3u8` |
| `level1-psych-05` | The Secret To Transformation | `Business Psychology/Secret To Transformation/Intro/index.m3u8` |
| `level1-psych-06` | The Compound Effect | `Business Psychology/Compound Effect/Intro/index.m3u8` |
| `level1-psych-07` | The Micro Business Protocol | `Business Psychology/Micro Business Protocol/Intro/index.m3u8` |
| `level1-psych-08` | Mastering Risk and Uncertainty | `Business Psychology/Risk and Uncertainty/Intro/index.m3u8` |
| `level1-psych-09` | Business Warfare | `Business Psychology/Business Warfare/Intro/index.m3u8` |
| `level1-psych-10` | Syndicate 13 Business Rules | `Business Psychology/13 Business Rules/Intro/index.m3u8` |
| `level1-psych-11` | Syndicate Money Philosophy | `Business Psychology/Money Philosophy/Intro/index.m3u8` |

**Category total:** $150 (split across 11 programs). **Money Mastery** unlocks all.

## Level 1 — Business Model (`level1-model-01` … `level1-model-11`)

| Slug | Title | R2 path hint |
|------|-------|----------------|
| `level1-model-01` | N8N AI Automation | `Business Models/N8N AI Automation/Intro/index.m3u8` |
| `level1-model-02` | AI Automations | `Business Models/Ai Automation/Intro/index.m3u8` |
| `level1-model-03` | App Building (using Flutter) | `Business Models/App Building Flutter/Intro/index.m3u8` |
| `level1-model-04` | Building Apps using React JS | `Business Models/React JS/Intro/index.m3u8` |
| `level1-model-05` | Book Publishing On Amazon (KINDLE) | `Business Models/Amazon KDP/Intro/index.m3u8` |
| `level1-model-06` | Building Games Using Unreal Engine | `Business Models/Unreal Engine/Intro/index.m3u8` |
| `level1-model-07` | Framer Crash Course | `Business Models/Framer Crash Course/Intro/index.m3u8` |
| `level1-model-08` | Graphics Design Using Canva | `Business Models/Canva/Intro/index.m3u8` |
| `level1-model-09` | Print On Demand Clothing | `Business Models/Print On Demand/Intro/index.m3u8` |
| `level1-model-10` | Python Programming | `Business Models/Python Programming/Intro/index.m3u8` |
| `level1-model-11` | WordPress Blog | `Business Models/WordPress Blog/Intro/index.m3u8` |

## Mid-ticket packs ($150 pack / à la carte totals)

| Pack slug | Checkout | À la carte total | Module slug pattern |
|-----------|----------|------------------|---------------------|
| `agentic_ai` | $150 | $230 | `agentic_ai_c01` … `agentic_ai_c26` |
| `ai_content_automation` | $150 | $250 | `ai_content_c01` … `ai_content_c29` |
| `trading_technical_analysis` | $150 | ~$200 (4 modules × $50) | see below |

### Agentic AI R2 root: `Agentic AI/{title}/{inner}/index.m3u8`

### AI Content R2 root: `Ai Content Automation/{title}/{inner}/index.m3u8`

## Trading nested structure

| Parent module slug | R2 folder | Submodule slugs |
|--------------------|-----------|-----------------|
| `trading_master_secrets` | `Secrets/` | `trading_secrets_01` … `trading_secrets_17` |
| `trading_master_setups` | `Setups/` | `trading_setups_01` … `trading_setups_18` |
| `trading_master_strategies` | `Strategies/` | `trading_strategies_01` … `trading_strategies_08` |
| `trading_scalpel_protocol` | `The Scalpel Protocol Architecting Wealth on the 1-Minute Chart/` | `trading_scalpel_01` … `trading_scalpel_10` |

R2 root: `Trading with Advanced Technical Analysis/`

## Money Mastery (`bundle`)

Unlocks **all** Level 1 + all vault/trading modules. No separate playlist row.

## Admin workflow (your next step)

1. Run seed (playlists only).
2. For each playlist, create **one StreamVideo**:
   - `original_video` = full R2 key to `index.m3u8`
   - `playback_kind` = `hls`, `status` = `ready`
3. Add **StreamPlaylistItem** linking video → playlist.
4. Set `is_coming_soon = False` when playback works.

Or run `seed_syndicate_catalog --with-videos --link-r2` to auto-link manifests that already exist in R2.
