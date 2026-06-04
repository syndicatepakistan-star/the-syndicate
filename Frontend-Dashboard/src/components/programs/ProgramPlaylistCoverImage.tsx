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
  loading?: "eager" | "lazy";
  fetchPriority?: "high" | "auto";
  decoding?: "async" | "auto";
  /** Display width hint for Next/Image + Cloudinary transforms. */
  displayWidth?: number;
};

export function ProgramPlaylistCoverImage({
  playlist,
  gradClassName,
  imageClassName,
  loading = "lazy",
  fetchPriority,
  displayWidth = 640,
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

  return (
    <>
      <div className={cn("h-full w-full bg-gradient-to-t opacity-95", gradClassName)} />
      {activeSrc ? (
        <Image
          src={activeSrc}
          alt=""
          fill
          sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 320px"
          quality={72}
          loading={loading}
          priority={loading === "eager"}
          fetchPriority={fetchPriority}
          decoding="async"
          onError={() => {
            if (fallbackSrc && src !== fallbackSrc) {
              setSrc(fallbackSrc);
            }
          }}
          className={
            imageClassName ??
            "absolute inset-0 h-full w-full object-cover object-center [backface-visibility:hidden]"
          }
        />
      ) : null}
    </>
  );
}
