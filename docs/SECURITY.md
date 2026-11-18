# The Ink Home — Security

## Transport & headers

Applied by `helmet` in `server.ts` and by `vercel.json` for static hosts.

| Header | Value |
| --- | --- |
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `DENY` |
| `Frame-Options` | `DENY` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` |
| `Cross-Origin-Opener-Policy` | `same-origin` |
| `Cross-Origin-Resource-Policy` | `cross-origin` |
| `Cross-Origin-Embedder-Policy` | `credentialless` |

## Content Security Policy

```
default-src 'self';
script-src 'self';
style-src 'self' 'unsafe-inline';
img-src 'self' data: blob: https:;
font-src 'self' data:;
connect-src 'self';
media-src 'self' https:;
object-src 'none';
frame-src 'self' https:;
base-uri 'self';
form-action 'self';
frame-ancestors 'none';
upgrade-insecure-requests
```

- `script-src 'self'` — no external scripts, no inline scripts in production.
- `style-src 'self' 'unsafe-inline'` — inline styles are used for motion/gradient styling.
- `img-src` allows `https:` so Medium / Unsplash cover images can load.
- `frame-src https:` allows embedded Medium/Youtube frames where present.

## Rate limiting

- Global API limiter: `300` requests / 15 minutes / IP.
- AI assistant: `10` requests / minute / IP (in-memory, per instance).

## Client-side hardening

- Like / save actions are local-only (`localStorage`) and never send data off-site.
- Reading content is sanitized with `isomorphic-dompurify` before rendering.
- No secrets, tokens or API keys are shipped to the browser bundle; the AI key is read server-side.

## Known limitations

- Rate limits are in-memory per instance; a multi-instance deploy should back them with a shared store.
- CSP `style-src 'unsafe-inline'` is required for inline style attributes.
- HSTS preload is registered on the host domain only once the domain is verified.
