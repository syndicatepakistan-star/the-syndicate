"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { resolveDjangoMediaUrl } from "@/lib/courses-api";
import { optimizeCoverImageSrc } from "@/lib/optimizeImageUrl";
import {
  resolveProgramPlaylistThumbnail,
  type ProgramPlaylistLike,
} from "@/lib/programPlaylistCatalog";
import { cn } from "@/components/dashboard/dashboardPrimitives";

type Props = {
  playlist: ProgramPlaylistLike & { cover_image_url?: string | null };
  gradClassName: string;
  imageClassName?: string;
  objectFit?: "cover" | "contain";
  loading?: "eager" | "lazy";
  fetchPriority?: "high" | "auto";
  decoding?: "async" | "auto";
  displayWidth?: number;
};

export function ProgramPlaylistCoverImage({
  playlist,
  gradClassName,
  imageClassName,
  objectFit = "cover",
  loading = "lazy",
  fetchPriority,
  displayWidth = 384,
}: Props) {
  const djangoCover = resolveDjangoMediaUrl(playlist.cover_image_url ?? null);
  const staticThumb = resolveProgramPlaylistThumbnail(playlist);
  const primarySrc = optimizeCoverImageSrc(staticThumb ?? djangoCover ?? undefined, displayWidth);
  const fallbackSrc = optimizeCoverImageSrc(
    staticThumb && djangoCover && djangoCover !== staticThumb ? djangoCover : staticThumb ?? djangoCover ?? undefined,
    displayWidth
  );

  const [src, setSrc] = useState(primarySrc);

  useEffect(() => {
    setSrc(primarySrc);
  }, [primarySrc]);

  const activeSrc = src || fallbackSrc;
  const isPriority = loading === "eager";

  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="relative h-full w-full">
        {activeSrc ? (
          <Image
            src={activeSrc}
            alt=""
            fill
            sizes="(max-width: 640px) 46vw, (max-width: 1279px) 46vw, 340px"
            quality={55}
            loading={loading}
            priority={isPriority}
            fetchPriority={fetchPriority ?? (isPriority ? "high" : "auto")}
            decoding="async"
            onError={() => {
              if (fallbackSrc && src !== fallbackSrc) {
                setSrc(fallbackSrc);
              }
            }}
            className={
              imageClassName ??
              cn(
                "program-playlist-card__cover-img",
                objectFit === "contain"
                  ? "object-contain object-center"
                  : "object-cover object-center",
              )
            }
          />
        ) : null}
        <div
          className={cn(
            "pointer-events-none absolute inset-0 z-[1] bg-gradient-to-t opacity-40 mix-blend-multiply",
            gradClassName,
          )}
          aria-hidden
        />
      </div>
    </div>
  );
}
