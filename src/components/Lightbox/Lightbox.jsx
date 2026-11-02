"use client";
import { useEffect, useCallback } from "react";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

export default function Lightbox({
  images,
  index,
  onClose,
  onChange,
  alt = "",
}) {
  const isOpen = index !== null && index !== undefined;
  const hasMany = images.length > 1;

  const prev = useCallback(
    () => onChange((index - 1 + images.length) % images.length),
    [index, images.length, onChange],
  );
  const next = useCallback(
    () => onChange((index + 1) % images.length),
    [index, images.length, onChange],
  );

  useEffect(() => {
    if (!isOpen) return;

    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      if (hasMany && e.key === "ArrowLeft") prev();
      if (hasMany && e.key === "ArrowRight") next();
    };
    document.addEventListener("keydown", onKey);

    // запрещаем прокрутку страницы, пока открыто фото
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = oldOverflow;
    };
  }, [isOpen, hasMany, onClose, prev, next]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[1000] bg-black/90 flex items-center justify-center"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
        aria-label="Закрыть"
      >
        <X size={28} />
      </button>

      {hasMany && (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              prev();
            }}
            className="absolute left-2 md:left-6 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
            aria-label="Предыдущее фото"
          >
            <ChevronLeft size={32} />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              next();
            }}
            className="absolute right-2 md:right-6 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
            aria-label="Следующее фото"
          >
            <ChevronRight size={32} />
          </button>
        </>
      )}

      <div
        className="relative w-[92vw] h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <Image
          src={images[index]}
          alt={alt}
          fill
          className="object-contain"
          sizes="100vw"
          priority
        />
      </div>

      {hasMany && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/80 text-sm">
          {index + 1} / {images.length}
        </div>
      )}
    </div>
  );
}
