"use client"
import React, { useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Autoplay, EffectFade, Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/effect-fade';
import 'swiper/css/navigation';
import 'swiper/css/autoplay';
import './HeroBanner.scss';
import { useBanners } from '../../lib/banners/hooks/hooks';
import { IoChevronBack, IoChevronForward } from 'react-icons/io5';
import Image from 'next/image';
import { getSectionKeyByName } from '@/lib/catalog/sectionCategories';

export function Banner({ categoryName }) {
  const [prevEl, setPrevEl] = useState(null);
  const [nextEl, setNextEl] = useState(null);

  const { data: banners = [], isLoading, error } = useBanners('main');

    // Раздел текущей страницы: videoSurveillance или pcComponents
  const pageSection = categoryName ? getSectionKeyByName(categoryName) : null;

  const filteredBanners = pageSection
    ? banners.filter((b) => {
        const bannerSection = getSectionKeyByName(b.title);
        // Баннер без раздела показываем везде, с разделом только в своём
        return !bannerSection || bannerSection === pageSection;
      })
    : banners;

  if (isLoading) return <div className="loader"></div>;
  if (error) return null;
  if (filteredBanners.length === 0) return null;

  return (
    <div className="hero-banner container">
      <Swiper
        modules={[Pagination, Autoplay, EffectFade, Navigation]}
        spaceBetween={0}
        slidesPerView={1}
        pagination={{ clickable: true, dynamicBullets: false }}
        navigation={{ prevEl, nextEl }}
        autoplay={{ delay: 4000, disableOnInteraction: false, pauseOnMouseEnter: true }}
        effect="fade"
        fadeEffect={{ crossFade: true }}
        loop={filteredBanners.length > 1}
        speed={200}
        className="hero-banner__swiper"
      >
        {filteredBanners.map((banner, index) => {
          const backgroundImage = banner.existing_images?.[0]?.image;
          return (
            <SwiperSlide key={banner.id}>
              <div className="banner-slide">
                {backgroundImage ? (
                  <Image
                    src={backgroundImage}
                    alt={banner.title || 'banner'}
                    width={0}
                    height={0}
                    sizes="100vw"
                    className="banner-slide__img"
                    priority={index === 0}
                    quality={80}
                  />
                ) : (
                  <div className="banner-slide__fallback" />
                )}
                <div className="banner-slide__overlay" />
                <div className="banner-slide__content container" />
              </div>
            </SwiperSlide>
          );
        })}

        <button
          type="button"
          ref={(node) => setPrevEl(node)}
          className="hero-banner__arrow hero-banner__arrow--prev"
          aria-label="Назад"
        >
          <IoChevronBack size={24} />
        </button>
        <button
          type="button"
          ref={(node) => setNextEl(node)}
          className="hero-banner__arrow hero-banner__arrow--next"
          aria-label="Вперёд"
        >
          <IoChevronForward size={24} />
        </button>
      </Swiper>
    </div>
  );
}