"use client";
import React, { useRef } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Navigation } from "swiper/modules";
import "swiper/css";
import "./style.scss";
import { useBanner } from "@/lib/news/hooks/hooks";
import { getNewsImages } from "@/lib/news/utils/getNewsImages";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { IoChevronBackOutline, IoChevronForwardOutline } from "react-icons/io5";

const NewsSkeleton = () => (
  <div
    className="bg-white flex flex-col gap-[10px] rounded-[15px] shadow-sm animate-pulse"
    style={{ padding: "10px" }}
  >
    <div className="h-[250px] lg:h-[320px] w-full bg-gray-200 rounded-[10px]" />
    <div className="px-2 h-[80px] space-y-2">
      <div className="h-6 bg-gray-200 rounded w-3/4" />
      <div className="h-4 bg-gray-200 rounded w-full" />
      <div className="h-4 bg-gray-200 rounded w-5/6" />
    </div>
  </div>
);

export function News() {
  const { data, isLoading, error } = useBanner();
  const { t } = useTranslation();
  const router = useRouter();
  const newsItems = data || [];
  const shouldLoop = (isLoading ? 3 : newsItems.length) > 3;

  const prevRef = useRef(null);
  const nextRef = useRef(null);

  // Функция для перехода на страницу новости
  const handleNewsClick = (item) => {
    router.push(`/news/${item.id}`);
  };

  return (
    <section className="pb-16 max-w-[1350px] mx-auto xl:px-0">
      <div className="w-full mx-auto px-3 xl:px-0">
        <h2
          className="sm:text-5xl text-3xl font-bold md:text-center text-start text-[#1e293b]"
          style={{ marginBottom: "50px" }}
        >
          {t("news.news")}
        </h2>

        {error && !isLoading && (
          <div className="text-center py-10">
            <p className="text-red-500">Ошибка загрузки новостей</p>
          </div>
        )}

        <div className="news-slider">
          <button
            type="button"
            ref={prevRef}
            className="news__nav news__nav--prev"
            aria-label="Previous news"
            onClick={(e) => e.preventDefault()}
          >
            <IoChevronBackOutline size={22} />
          </button>
          <button
            type="button"
            ref={nextRef}
            className="news__nav news__nav--next"
            aria-label="Next news"
            onClick={(e) => e.preventDefault()}
          >
            <IoChevronForwardOutline size={22} />
          </button>

          <Swiper
            className="news-slider__swiper"
            modules={[Autoplay, Navigation]}
            spaceBetween={20}
            slidesPerView={1.2}
            centeredSlides={false}
            loop={shouldLoop}
            grabCursor={true}
            autoplay={
              shouldLoop ? { delay: 3000, stopOnInteraction: false } : false
            }
            navigation={{
              prevEl: prevRef.current,
              nextEl: nextRef.current,
            }}
            onBeforeInit={(swiper) => {
              swiper.params.navigation.prevEl = prevRef.current;
              swiper.params.navigation.nextEl = nextRef.current;
            }}
            breakpoints={{
              640: { slidesPerView: 2, spaceBetween: 20 },
              1024: { slidesPerView: 3, spaceBetween: 20 },
            }}
          >
            {isLoading
              ? [...Array(3)].map((_, index) => (
                  <SwiperSlide key={`skeleton-${index}`}>
                    <NewsSkeleton />
                  </SwiperSlide>
                ))
              : newsItems.map((item) => {
                  const { main: imageUrl } = getNewsImages(item); // только 1-е фото
                  const title = item.title || "Без названия";
                  const description =
                    item.description || "Описание отсутствует";

                  return (
                    <SwiperSlide key={item.id}>
                      <div
                        className="bg-white flex flex-col gap-[10px] rounded-[15px] shadow-sm transition-all duration-300 hover:shadow-[5px_5px_5px_5px_rgba(3,3,3,0.37)] cursor-pointer"
                        style={{ padding: "10px" }}
                        onClick={() => handleNewsClick(item)}
                      >
                        <div className="h-[250px] lg:h-[320px] w-full bg-[#bfbfbf] rounded-[10px] shrink-0 overflow-hidden relative">
                          {imageUrl ? (
                            <>
                              {/* размытый фон из этого же фото */}
                              <Image
                                src={imageUrl}
                                alt=""
                                aria-hidden
                                fill
                                className="object-cover blur-xl scale-110 opacity-60"
                                sizes="33vw"
                              />
                              {/* само фото целиком, без обрезки */}
                              <Image
                                src={imageUrl}
                                alt={title}
                                fill
                                className="object-contain"
                                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                              />
                            </>
                          ) : (
                            <div className="w-full h-full bg-gradient-to-tr from-gray-300 to-gray-200 rounded-[10px] flex items-center justify-center">
                              <span className="text-gray-400 text-sm">
                                {item.category_display}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="px-2 h-[80px]">
                          <h3 className="text-[14px] lg:text-[20px] font-semibold text-[#1e293b] mb-2 leading-tight line-clamp-1">
                            {title}
                          </h3>
                          <p className="text-[#64748b] text-[12px] lg:text-[16px] line-clamp-2">
                            {description}
                          </p>
                        </div>
                      </div>
                    </SwiperSlide>
                  );
                })}
          </Swiper>

          {!isLoading && !error && newsItems.length === 0 && (
            <div className="text-center py-10">
              <p className="text-gray-500">Новостей пока нет</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
