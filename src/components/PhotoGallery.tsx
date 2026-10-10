import { useState } from 'react';
import { ChevronLeft, ChevronRight, Expand } from 'lucide-react';

interface PhotoGalleryProps {
  images: string[];
  alt: string;
}

export default function PhotoGallery({ images, alt }: PhotoGalleryProps) {
  const [active, setActive] = useState(0);
  const [expanded, setExpanded] = useState(false);

  const go = (dir: number) => {
    setActive((prev) => {
      const next = prev + dir;
      if (next < 0) return images.length - 1;
      if (next >= images.length) return 0;
      return next;
    });
  };

  if (images.length === 0) return null;

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
      <div className="relative aspect-[16/10] overflow-hidden bg-gray-100">
        <img
          src={images[active]}
          alt={`${alt} — image ${active + 1}`}
          className="h-full w-full object-cover"
        />

        {images.length > 1 && (
          <>
            <button
              onClick={() => go(-1)}
              className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-gray-700 shadow-md backdrop-blur transition-colors hover:bg-white"
              aria-label="Previous image"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={() => go(1)}
              className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-gray-700 shadow-md backdrop-blur transition-colors hover:bg-white"
              aria-label="Next image"
            >
              <ChevronRight size={20} />
            </button>

            <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
              {images.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActive(i)}
                  className={`h-2 rounded-full transition-all ${
                    i === active
                      ? 'w-6 bg-white'
                      : 'w-2 bg-white/50 hover:bg-white/80'
                  }`}
                  aria-label={`Go to image ${i + 1}`}
                />
              ))}
            </div>
          </>
        )}

        <button
          onClick={() => setExpanded(true)}
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-gray-700 shadow-sm backdrop-blur transition-colors hover:bg-white"
          aria-label="Expand image"
        >
          <Expand size={16} />
        </button>
      </div>

      {images.length > 1 && (
        <div className="flex gap-2 p-3">
          {images.map((src, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`relative aspect-square h-16 flex-shrink-0 overflow-hidden rounded-lg transition-all ${
                i === active
                  ? 'ring-2 ring-green-600 ring-offset-1'
                  : 'opacity-60 hover:opacity-100'
              }`}
            >
              <img
                src={src}
                alt={`${alt} thumbnail ${i + 1}`}
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {expanded && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/80 p-4 backdrop-blur"
          onClick={() => setExpanded(false)}
        >
          <img
            src={images[active]}
            alt={`${alt} — expanded`}
            className="max-h-[90vh] max-w-full rounded-xl object-contain"
          />
          <button
            onClick={() => setExpanded(false)}
            className="absolute right-6 top-6 rounded-full bg-white/90 px-4 py-2 text-sm font-medium text-gray-700 shadow-lg"
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
}
