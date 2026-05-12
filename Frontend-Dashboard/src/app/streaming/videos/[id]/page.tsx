"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import StreamHtmlVideoPlayer from "@/components/streaming/StreamHtmlVideoPlayer";
import {
  fetchStreamVideoDetail,
  fetchStreamVideoPlayback,
  type StreamPayload,
  type StreamVideoDetail
} from "@/lib/streaming-api";

export default function StreamVideoDetailPage() {
  const params = useParams();
  const raw = params.id;
  const id = typeof raw === "string" ? Number.parseInt(raw, 10) : Number.NaN;

  const [detail, setDetail] = useState<StreamVideoDetail | null>(null);
  const [playback, setPlayback] = useState<StreamPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!Number.isFinite(id)) {
      setError("Invalid video id.");
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const [d, p] = await Promise.all([fetchStreamVideoDetail(id), fetchStreamVideoPlayback(id)]);
        if (!cancelled) {
          setDetail(d);
          setPlayback(p);
        }
      } catch (e: unknown) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load video.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (error) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10 text-white">
        <p className="text-red-300">{error}</p>
        <Link href="/streaming/videos" className="mt-6 inline-block text-sky-300 hover:underline">
          ← Back to list
        </Link>
      </main>
    );
  }

  if (!detail || !playback) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10 text-white">
        <p className="text-white/70">Loading…</p>
      </main>
    );
  }

  const playbackUrl = playback.playback_url;

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 text-white">
      <Link href="/streaming/videos" className="text-sm text-sky-300 hover:underline">
        ← Catalog
      </Link>
      <h1 className="mt-4 text-2xl font-semibold tracking-tight">{detail.title}</h1>
      <p className="mt-2 text-sm text-white/60">Price: ${Number(detail.price).toFixed(2)}</p>
      <p className="mt-4 text-white/80 whitespace-pre-wrap">{detail.description}</p>

      <section className="mt-8 space-y-4">
        <p className="text-sm text-white/60">
          Status: <span className="text-white/90">{playback.status}</span>
        </p>
        {!playbackUrl ? (
          <p className="rounded border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
            Playback URL is not available yet (still processing or missing file). Refresh after upload completes.
          </p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-white/10 bg-black">
            <StreamHtmlVideoPlayer
              src={playbackUrl}
              className="rounded-[inherit]"
              playerLayout={detail.player_layout ?? "auto"}
              sourceWidth={detail.source_width ?? null}
              sourceHeight={detail.source_height ?? null}
            />
          </div>
        )}
      </section>
    </main>
  );
}
