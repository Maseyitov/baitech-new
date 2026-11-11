"use client";

import React, { useRef } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";
import "./recommendations.scss";
import Card from "../ui/card/Card";
import { useProducts } from "@/lib/products/hooks/hooks";
import { useTranslation } from "react-i18next";
import { IoChevronBackOutline, IoChevronForwardOutline } from "react-icons/io5";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

const CardSkeleton = () => (
  <div className="card-skeleton animate-pulse">
    <div className="bg-gray-200 h-48 rounded-lg mb-3"></div>
    <div className="space-y-2">
      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
    </div>
  </div>
);

export function Recommendations({ categoryName }) {
  const { t } = useTranslation();
  const {
    products = [],
    isLoading,
    isError,
  } = useProducts({ category: categoryName || "" });
  const prevRef = useRef(null);
  const nextRef = useRef(null);

  const recommendedProducts = products.slice(0, 10);

  if (isError) {
    return (
      <div className="recommendations">
        <h2 className="recommendations__title">{t("recommendations.title")}</h2>
        <div className="recommendations__error">
          <p className="text-center text-red-500 py-8">
            {t("recommendations.error")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="recommendations">
      <div className="recommendations__head">
        <h2 className="recommendations__title">{t("recommendations.title")}</h2>

        <Link
          href={
            categoryName
              ? `/catalog?category=${encodeURIComponent(categoryName)}`
              : "/catalog"
          }
          className="recommendations__all"
        >
          {t("recommendations.all", "Смотреть все")}
          <ArrowRight size={18} />
        </Link>
      </div>
      <div className="recommendations-carousel">
        <button
          ref={prevRef}
          className="recommendations__nav recommendations__nav--prev"
          aria-label="Previous products"
        >
          <IoChevronBackOutline size={22} />
        </button>
        <button
          ref={nextRef}
          className="recommendations__nav recommendations__nav--next"
          aria-label="Next products"
        >
          <IoChevronForwardOutline size={22} />
        </button>

        <Swiper
          modules={[Navigation, Pagination]}
          spaceBetween={10}
          slidesPerView={1.5}
          centeredSlides
          pagination={false}
          navigation
          onBeforeInit={(swiper) => {
            swiper.params.navigation.prevEl = prevRef.current;
            swiper.params.navigation.nextEl = nextRef.current;
          }}
          loop
          grabCursor
          breakpoints={{
            380: { slidesPerView: 1.5, spaceBetween: 8, centeredSlides: true },
            640: {
              slidesPerView: 2.2,
              spaceBetween: 10,
              centeredSlides: false,
            },
            768: {
              slidesPerView: 3.2,
              spaceBetween: 18,
              centeredSlides: false,
            },
            1024: {
              slidesPerView: 3.2,
              spaceBetween: 20,
              centeredSlides: false,
            },
            1200: { slidesPerView: 4, spaceBetween: 20, centeredSlides: false },
          }}
          className="recommendationsSwiper"
        >
          {isLoading ? (
            [...Array(6)].map((_, index) => (
              <SwiperSlide key={`skeleton-${index}`}>
                <CardSkeleton />
              </SwiperSlide>
            ))
          ) : recommendedProducts.length === 0 ? (
            <div className="w-full text-center py-8 text-gray-500">
              Нет рекомендаций
            </div>
          ) : (
            recommendedProducts.map((product) => (
              <SwiperSlide key={product.id}>
                <Card product={product} />
              </SwiperSlide>
            ))
          )}
        </Swiper>
      </div>
    </div>
  );
}
