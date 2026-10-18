"use client";

import { useState } from "react";

/**
 * Galeri foto usaha di halaman profil: foto utama besar + thumbnail klik.
 * Foto dilayani dari /api/providers/[id]/images/[n] (published = publik).
 */
export default function PhotoGallery({
  images,
  name,
  initialsText,
}: {
  images: string[];
  name: string;
  initialsText: string;
}) {
  const [active, setActive] = useState(0);

  if (images.length === 0) {
    return (
      <div className="flex aspect-[4/3] w-full items-center justify-center rounded-xl border border-green/10 bg-green-tint">
        <span className="font-serif text-5xl font-semibold text-green">{initialsText}</span>
      </div>
    );
  }

  return (
    <div>
      <div className="aspect-[4/3] w-full overflow-hidden rounded-xl border border-green/10 bg-green-tint">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={images[active]}
          src={images[active]}
          alt={`Foto ${active + 1} usaha ${name}`}
          className="h-full w-full object-cover"
        />
      </div>
      {images.length > 1 && (
        <div className="mt-3 flex gap-3">
          {images.map((src, i) => (
            <button
              key={src}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Lihat foto ${i + 1}`}
              className={`h-20 w-20 overflow-hidden rounded-lg border-2 transition ${
                i === active
                  ? "border-green"
                  : "border-line opacity-70 hover:opacity-100"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt={`Thumbnail ${i + 1} ${name}`}
                loading="lazy"
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
