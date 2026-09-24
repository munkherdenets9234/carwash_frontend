import { ImageIcon } from "lucide-react";
import Image from "next/image";

import { cn } from "@/lib/utils";

/**
 * A photograph, or an honest stand-in for one that has not been taken yet.
 *
 * The content modules ship without image files. Rather than pointing
 * next/image at paths that 404 — which fails the build for a static import and
 * shows a broken tile for a runtime one — an entry with no `src` renders a
 * labelled frame. Add the file, set `src`, and the same tile becomes the
 * photograph with no other change.
 */
export function Photo({
  src,
  alt,
  width,
  height,
  className,
  sizes,
  priority,
}: {
  src?: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  sizes?: string;
  priority?: boolean;
}) {
  if (!src || !width || !height) {
    return (
      <div
        // Not aria-hidden: the caption is the only description of what belongs
        // here, and a sighted visitor gets it too.
        className={cn(
          "flex flex-col items-center justify-center gap-2 overflow-hidden bg-muted p-4 text-center",
          className,
        )}
      >
        <ImageIcon aria-hidden className="size-5 text-muted-foreground" />
        <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">{alt}</span>
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      sizes={sizes}
      priority={priority}
      className={cn("object-cover", className)}
    />
  );
}
