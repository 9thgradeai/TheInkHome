import React, { useState } from "react";
import { ArrowUpRight, CheckCircle2, Mail } from "lucide-react";

interface NewsletterSignupProps {
  defaultEmail?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function NewsletterSignup({ defaultEmail = "" }: NewsletterSignupProps) {
  const [email, setEmail] = useState(defaultEmail);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = email.trim();
    if (!EMAIL_RE.test(value)) {
      setError("Please enter a valid email address.");
      return;
    }
    setError(null);
    setDone(true);
  };

  return (
    <div className="rounded-2xl border border-white/15 bg-black/40 p-6 backdrop-blur sm:p-8">
      <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/60">Email digest</span>
      <h3 className="mt-3 font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">The Sunday Dispatch.</h3>
      <p className="mt-3 text-sm leading-relaxed text-white/70">
        One thoughtful letter when a new story lands. No noise, no schedule, no algorithm tax.
      </p>
      {done ? (
        <p className="mt-6 flex items-center gap-2 rounded-xl border border-[#c8ff4d]/30 bg-[#c8ff4d]/10 px-4 py-3 text-sm text-[#c8ff4d]" role="status">
          <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> You're on the list. Welcome aboard.
        </p>
      ) : (
        <form onSubmit={submit} className="mt-6 space-y-3">
          <label htmlFor="newsletter-email" className="sr-only">Email address</label>
          <input
            id="newsletter-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            className="w-full rounded-xl border border-white/15 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-[#c8ff4d]/50 focus:outline-none focus:ring-1 focus:ring-[#c8ff4d]/30"
          />
          {error && (
            <p role="alert" className="text-xs text-amber-300">{error}</p>
          )}
          <button
            type="submit"
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#c8ff4d] px-5 py-3 text-[11px] font-bold uppercase tracking-[0.16em] text-black transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c8ff4d] focus-visible:ring-offset-2 focus-visible:ring-offset-[#08080a] active:scale-95"
          >
            Subscribe <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </form>
      )}
      <p className="mt-4 flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.14em] text-white/40">
        <Mail className="h-3 w-3" aria-hidden="true" /> Or just follow The Ink Home on Medium
      </p>
    </div>
  );
}
