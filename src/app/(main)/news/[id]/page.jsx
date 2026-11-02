"use client";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useBanner } from "@/lib/news/hooks/hooks";
import { getNewsImages } from "@/lib/news/utils/getNewsImages";
import Image from "next/image";
import { ArrowLeft, ZoomIn } from "lucide-react";
import { useTranslation } from "react-i18next";
import Lightbox from "@/components/Lightbox/Lightbox";

// Фото в своих пропорциях, без фона и обрезки, с ограничением высоты
const PhotoBox = ({ src, alt, priority = false, onOpen }) => (
  <div className="flex justify-center">
    <button
      type="button"
      onClick={onOpen}
      className="group relative inline-block max-w-full rounded-lg overflow-hidden cursor-zoom-in"
      aria-label="Открыть фото"
    >
      <Image
        src={src}
        alt={alt}
        width={0}
        height={0}
        priority={priority}
        sizes="(max-width: 768px) 100vw, 50vw"
        className="block w-auto h-auto max-w-full max-h-[300px] sm:max-h-[400px] lg:max-h-[480px] transition-transform duration-300 group-hover:scale-[1.02]"
      />
      <span className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition">
        <span className="opacity-0 group-hover:opacity-100 transition bg-white/90 text-[#0E2E5B] rounded-full p-3">
          <ZoomIn size={24} />
        </span>
      </span>
    </button>
  </div>
);

export default function NewsDetailPage() {
  const { t } = useTranslation();
  const params = useParams();
  const router = useRouter();
  const { data, isLoading } = useBanner();
  const newsId = parseInt(params.id);
  const [viewerIndex, setViewerIndex] = useState(null);

  const newsItem = data?.find((item) => item.id === newsId);

  if (isLoading) {
    return (
      <div className="max-w-[1280px] mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
            <div className="aspect-[3/1] bg-gray-200 rounded-lg"></div>
            <div className="aspect-[3/1] bg-gray-200 rounded-lg"></div>
          </div>
          <div className="h-12 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!newsItem) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold text-gray-700 mb-4">
          {t("newsDetail.notFound.title")}
        </h1>
        <button
          onClick={() => router.back()}
          className="text-[#0E2E5B] hover:underline"
        >
          {t("newsDetail.notFound.backButton")}
        </button>
      </div>
    );
  }

  const { main, second } = getNewsImages(newsItem);
  const photos = [main, second].filter(Boolean);
  const alt = newsItem.title || t("newsDetail.imageAlt");

  return (
    <div className="max-w-[1280px] mx-auto px-4 py-8">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-[#0E2E5B] hover:underline mb-6 transition-colors"
      >
        <ArrowLeft size={20} />
        <span>{t("newsDetail.backButton")}</span>
      </button>

      {photos.length > 0 ? (
        <div
          className={
            photos.length === 2
              ? "grid grid-cols-1 md:grid-cols-2 gap-5 items-start mb-6" // 1 | отступ | 2
              : "max-w-[1000px] mx-auto mb-6" // только 1 фото
          }
        >
          {photos.map((src, i) => (
            <PhotoBox
              key={src}
              src={src}
              alt={`${alt}${i ? ` — ${i + 1}` : ""}`}
              priority={i === 0}
              onOpen={() => setViewerIndex(i)}
            />
          ))}
        </div>
      ) : (
        <div className="w-full h-[400px] md:h-[500px] bg-gradient-to-tr from-gray-300 to-gray-200 rounded-lg mb-6 flex items-center justify-center">
          <span className="text-gray-400 text-lg">
            {t("newsDetail.noImage")}
          </span>
        </div>
      )}

      {newsItem.category_display && (
        <div className="mb-4">
          <span className="inline-block bg-[#0E2E5B] text-white text-sm px-3 py-1 rounded-full">
            {t("newsDetail.categoryBadge")}
          </span>
        </div>
      )}

      <h1 className="text-2xl md:text-4xl font-bold text-[#1e293b] mb-4">
        {newsItem.title || t("newsDetail.noTitle")}
      </h1>

      {newsItem.created_at && (
        <div className="text-gray-500 text-sm mb-6">
          {new Date(newsItem.created_at).toLocaleDateString(
            t("newsDetail.locale") || "ru-RU",
            { day: "numeric", month: "long", year: "numeric" },
          )}
        </div>
      )}

      <div className="prose prose-lg max-w-none text-[#64748b] leading-relaxed whitespace-pre-line">
        {newsItem.description || t("newsDetail.noDescription")}
      </div>

      <Lightbox
        images={photos}
        index={viewerIndex}
        onClose={() => setViewerIndex(null)}
        onChange={setViewerIndex}
        alt={alt}
      />
    </div>
  );
}
