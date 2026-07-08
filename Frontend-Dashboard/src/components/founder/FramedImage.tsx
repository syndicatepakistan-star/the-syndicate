"use client";

import Image from "next/image";
import { type CSSProperties } from "react";
import { cn } from "@/components/dashboard/dashboardPrimitives";
import { encodePublicAssetPath, type FounderFrameName } from "@/lib/founderFrameAssets";

export type FramedImageProps = {
  src: string;
  alt: string;
  frame: FounderFrameName;
  className?: string;
  /** CSS object-position for the photo layer. */
  objectPosition?: string;
  /** Portrait card ratio — defaults to 9:16 for TikTok posters. */
  aspectRatio?: "3/4" | "9/16";
  priority?: boolean;
  sizes?: string;
};

const ASPECT_CLASS = {
  "3/4": "aspect-[3/4]",
  "9/16": "aspect-[9/16]",
} as const;

export function FramedImage({
  src,
  alt,
  frame,
  className,
  objectPosition = "center top",
  aspectRatio = "9/16",
  priority = false,
  sizes = "(max-width: 640px) 46vw, (max-width: 1024px) 31vw, 320px",
}: FramedImageProps) {
  const posterSrc = encodePublicAssetPath(src);

  const frameStyle = {
    ["--framed-image-object-position"]: objectPosition,
  } as CSSProperties;

  return (
    <div
      className={cn(
        "framed-image",
        `framed-image--${frame}`,
        "relative mx-auto w-full max-w-[320px]",
        ASPECT_CLASS[aspectRatio],
        className,
      )}
      style={frameStyle}
    >
      <div className="framed-image__shell h-full w-full">
        <div className="framed-image__photo relative h-full w-full overflow-hidden">
          <Image
            src={posterSrc}
            alt={alt}
            fill
            quality={85}
            priority={priority}
            loading={priority ? "eager" : "lazy"}
            fetchPriority={priority ? "high" : "auto"}
            decoding="async"
            sizes={sizes}
            className="framed-image__photo-img object-cover"
          />
        </div>
      </div>
    </div>
  );
}
