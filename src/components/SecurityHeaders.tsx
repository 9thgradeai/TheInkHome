export function SecurityHeaders() {
  return (
    <>
      <meta httpEquiv="Content-Security-Policy" content={[
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: https: blob:",
        "media-src 'self' blob:",
        "font-src 'self' data:",
        "connect-src 'self' https://api.groq.com https://api.rss2json.com https://medium.com",
        "frame-src 'self' https://medium.com",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
      ].join("; ")} />
      <meta httpEquiv="Cross-Origin-Embedder-Policy" content="require-corp" />
      <meta httpEquiv="Cross-Origin-Resource-Policy" content="cross-origin" />
      <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
      <meta httpEquiv="X-Frame-Options" content="DENY" />
      <meta httpEquiv="Referrer-Policy" content="strict-origin-when-cross-origin" />
    </>
  );
}
