# The Ink Home — API Reference

All endpoints are mounted under `/api`.

## `GET /api/health`

Liveness + basic runtime reporting.

- **Auth:** none
- **Query params:** none
- **Response `200`**

```json
{
  "status": "ok",
  "uptime": 12.4,
  "stories": 42,
  "lastSync": "2026-11-18T19:47:16.253Z",
  "memory": { "rss": 0, "heapTotal": 0 },
  "environment": "production",
  "timestamp": "2026-11-18T19:47:16.253Z"
}
```

- **`405`** for any non-GET method.

## `GET /api/stories`

Returns the publication story archive.

- **Auth:** none
- **Response `200`**

```json
{
  "source": "medium-rss",
  "stories": [
    {
      "title": "How to not ruin a child's self-worth",
      "link": "https://medium.com/the-ink-home/...",
      "author": "Anjashi Sarkar",
      "role": "",
      "pubDate": "Thu, 01 Oct 2026 ... GMT",
      "categories": ["mental-health"],
      "description": "...",
      "content": "...",
      "cover": "/assets/...",
      "slug": "how-to-not-ruin-a-childs...",
      "avatar": ""
    }
  ]
}
```

- **`500`** with `{ "error": "Failed to load stories" }` when every source fails.

### Caching

- `Cache-Control: public, max-age=300, stale-while-revalidate=600`
- In-process TTL cache of 10 minutes with single-flight de-duplication.
- Optional disk snapshot persisted to `.cache/publication.json` and restored on boot.

## `GET /api/about`

Returns publication metadata used by the About page and the AI context.

- **Auth:** none
- **Response `200`**

```json
{
  "description": "...",
  "officialWebsite": "...",
  "editors": [{ "name": "Farhan Kabir", "role": "...", "bio": "...", "avatar": "...", "followers": 12, "mediumUrl": "..." }],
  "writers": [{ "name": "...", "role": "...", "bio": "...", "avatar": "..." }]
}
```

## `POST /api/ai`

Runs the Ink Assistant.

- **Auth:** none (per-IP rate limited; `x-forwarded-for` aware)
- **Request body**

```json
{
  "messages": [{ "role": "user", "content": "What are the submission guidelines?" }],
  "context": { "page": "browse", "storyTitle": "optional", "storyAuthor": "optional" },
  "temperature": 0.5,
  "max_tokens": 512,
  "stream": false
}
```

- **`400`** invalid request shape.
- **`429`** rate limited (10 requests / minute / IP).
- **`404`** not found.
- **`413`** payload too large.

### Responses

| Status | Body |
| --- | --- |
| `200` | `{ "reply": "..." }` |
| `400` | `{ "error": "Invalid request format." }` |
| `429` | `{ "error": "Too many requests..." }` |
| `502` | `{ "error": "The assistant returned an empty reply. Please try again." }` |
| `503` | `{ "error": "The assistant is not configured yet." }` |
| `504` | `{ "error": "The assistant timed out. Please try again." }` |

The AI is disabled (`503`) when `GROQ_API_KEY` is not configured.

## Error shapes

| Endpoint | Status | Body |
| --- | --- | --- |
| `/api/stories` | `500` | `{ "error": "Failed to load stories" }` |
| `/api/ai` | `400` | `{ "error": "Invalid request format." }` |

## Vercel function limits

| Function | maxDuration |
| --- | --- |
| `/api/stories` | 60 |
| `/api/ai` | 60 |
| `/api/about` | 30 |
| `/api/health` | 10 |

## Runtime contract

- All relative imports inside the serverless graph use explicit `.ts` extensions.
- All shared modules used by functions are imported with explicit `.ts` extensions (native ESM).
- Type-only imports must use `import type { ... }`.
- Handlers must not read files from the filesystem.
