"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchStreamVideosList, type StreamVideoListItem } from "@/lib/streaming-api";

export default function StreamVideosIndexPage() {
  const [items, setItems] = useState<StreamVideoListItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchStreamVideosList()
      .then((data) => {
        if (!cancelled) setItems(data);
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load videos.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10 text-white">
        <p className="text-red-300">{error}</p>
        <p className="mt-4 text-sm text-white/60">
          Ensure Django is running and Next rewrites <code className="text-white/80">/api/streaming/*</code> to the
          backend (see <code className="text-white/80">next.config.js</code>).
        </p>
      </main>
    );
  }

  if (!items) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10 text-white">
        <p className="text-white/70">Loading catalog…</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 text-white">
      <h1 className="text-2xl font-semibold tracking-tight">Stream videos</h1>
      <p className="mt-2 text-sm text-white/60">Secure MP4 catalog from Django (private storage + signed URLs).</p>
      <ul className="mt-8 space-y-4">
        {items.map((v) => (
          <li key={v.id} className="rounded-lg border border-white/10 bg-white/5 p-4">
            <Link href={`/streaming/videos/${v.id}`} className="text-lg font-medium text-sky-300 hover:underline">
              {v.title}
            </Link>
            <p className="mt-1 text-sm text-white/60">Status: {v.status}</p>
            <p className="text-sm text-white/60">Price: ${Number(v.price).toFixed(2)}</p>
          </li>
        ))}
      </ul>
      {items.length === 0 ? <p className="mt-8 text-white/50">No videos yet. Upload one in Django Admin.</p> : null}
    </main>
  );
}
