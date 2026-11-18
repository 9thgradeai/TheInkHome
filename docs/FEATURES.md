# The Ink Home — Feature Status

## Shipped

- Immersive landing with animated 3D scene (lazy-loaded).
- Latest stories feed with category filter + search.
- Full stories archive page with filtering/search/pagination.
- Writers & editors directory.
- About page with editorial desk and publishing topics.
- Reading page with sanitized content, like/save/share actions, author footer.
- Ink Assistant chat (Groq-backed, server-side prompt, quick questions, rate limited).
- Sunday-dispatch style subscribe CTA pointing at the Medium publication.

## In progress

- Real newsletter delivery (currently a Medium follow CTA).

## Known limitations

- Story archive reflects the last successful Medium RSS sync (max 50 entries).
- AI responses are non-streaming and capped at 512 tokens.
- Rate limiting is in-memory per instance.

## Removed / dead code

- Dead components, dead API functions, fabricated fallback content and fake interactions have been
  removed; see `/docs/IMPLEMENTATION_PLAN.md`.
