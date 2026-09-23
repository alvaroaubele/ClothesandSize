"use client";

import { useState } from "react";

type Props = { url: string; regenerate: (fd: FormData) => Promise<void>; token: string };

export default function PrivateLinkCard({ url, regenerate, token }: Props) {
  const [copied, setCopied] = useState(false);
  const wa = `https://wa.me/?text=${encodeURIComponent(`My wedding wardrobe link (private, keep it to yourself): ${url}`)}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      window.prompt("Copy this link:", url);
    }
  }

  return (
    <section className="rounded-xl border border-gold/40 bg-gold/10 px-4 py-3 text-sm" aria-labelledby="private-link-heading">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p id="private-link-heading" className="font-semibold">
            Your private link
          </p>
          <p className="text-ink-soft">The only way back to this page. Keep it to yourself; anyone with it can see and change your details.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={copy} className="btn-primary" aria-live="polite">
            {copied ? "Copied" : "Copy link"}
          </button>
          <a href={wa} target="_blank" rel="noreferrer noopener" className="btn-secondary" title="Opens WhatsApp; choose yourself in the list">
            Send to myself on WhatsApp
          </a>
        </div>
      </div>
      <details className="mt-2 text-xs text-ink-soft">
        <summary className="cursor-pointer">Shared it by mistake?</summary>
        <form action={regenerate} className="mt-2 flex flex-wrap items-center gap-2">
          <input type="hidden" name="token" value={token} />
          <span>Get a new link; the old one stops working immediately.</span>
          <button type="submit" className="btn-secondary">
            Regenerate my link
          </button>
        </form>
      </details>
    </section>
  );
}
