"use client";

import { resolveDjangoMediaUrl } from "@/lib/courses-api";
import {
  resolveProgramPlaylistThumbnail,
  type ProgramPlaylistLike,
} from "@/lib/programPlaylistCatalog";
import { cn } from "@/components/dashboard/dashboardPrimitives";

type Props = {
  playlist: ProgramPlaylistLike & { cover_image_url?: string | null };
  gradClassName: string;
  imageClassName?: string;
  loading?: "eager" | "lazy";
  fetchPriority?: "high" | "auto";
  decoding?: "async" | "auto";
};

export function ProgramPlaylistCoverImage({
  playlist,
  gradClassName,
  imageClassName,
  loading = "lazy",
  fetchPriority,
  decoding = "async",
}: Props) {
  const djangoCover = resolveDjangoMediaUrl(playlist.cover_image_url ?? null);
  const primarySrc = resolveProgramPlaylistThumbnail(playlist, djangoCover);
  const fallbackSrc = resolveProgramPlaylistThumbnail(playlist, null);

  return (
    <>
      <div className={cn("h-full w-full bg-gradient-to-t opacity-95", gradClassName)} />
      {primarySrc ? (
        <img
          src={primarySrc}
          alt=""
          loading={loading}
          fetchPriority={fetchPriority}
          decoding={decoding}
          onError={(e) => {
            const img = e.currentTarget;
            if (fallbackSrc && img.src !== fallbackSrc && !img.dataset.fallbackApplied) {
              img.dataset.fallbackApplied = "1";
              img.src = fallbackSrc;
              img.style.display = "";
              return;
            }
            img.style.display = "none";
          }}
          className={
            imageClassName ??
            "absolute inset-0 h-full w-full object-cover object-center [image-rendering:high-quality] [backface-visibility:hidden]"
          }
        />
      ) : null}
    </>
  );
}
