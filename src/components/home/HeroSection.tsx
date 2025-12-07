import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import hero from '../../assets/her.mp4';
import heroImage from '../../assets/hero.webp';
import malakImage from '../../assets/malak-removebg-preview.png';

// 1. إضافة video cache في بداية الملف
const videoCache = new Map<string, Blob>();

const HeroSection: React.FC = () => {
  const { t } = useTranslation();
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [videoBlobUrl, setVideoBlobUrl] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // 2. تحميل الفيديو مرة واحدة فقط وحفظه في الذاكرة
  useEffect(() => {
    const loadVideoIntoCache = async () => {
      try {
        // تحقق إذا كان الفيديو موجود في الـ cache
        if (videoCache.has(hero)) {
          const cachedBlob = videoCache.get(hero)!;
          const blobUrl = URL.createObjectURL(cachedBlob);
          setVideoBlobUrl(blobUrl);
          return;
        }

        // إذا ما كان موجود، حمّله
        const response = await fetch(hero);
        if (!response.ok) throw new Error('Failed to fetch video');
        
        const blob = await response.blob();
        videoCache.set(hero, blob);
        
        const blobUrl = URL.createObjectURL(blob);
        setVideoBlobUrl(blobUrl);
      } catch (error) {
        console.warn('Error loading video:', error);
        // رجّع للـ original path لو حصل خطأ
        setVideoBlobUrl(hero);
      }
    };

    loadVideoIntoCache();
  }, []);

  // 3. تحسين autoplay logic
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    const tryPlay = () => {
      v.play()
        .catch((error) => {
          console.warn('Autoplay prevented:', error);
          // محاولة تشغيل بدون صوت إذا فشل
          v.muted = true;
          v.play().catch(() => {});
        });
    };

    // إذا كان الفيديو جاهز بالفعل
    if (v.readyState >= 3) {
      tryPlay();
    } else {
      // انتظر لحد ما يبقى جاهز
      v.addEventListener("canplay", tryPlay, { once: true });
    }

    return () => {
      v?.removeEventListener("canplay", tryPlay as any);
    };
  }, [videoBlobUrl]); // أضفنا dependency

  return (
    <section className="relative h-screen w-full overflow-hidden pt-28">
      {/* Background Placeholder Image */}
      <div 
        className={`absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat z-0 transition-opacity duration-500 ${
          videoLoaded ? 'opacity-0' : 'opacity-100'
        }`}
        style={{ backgroundImage: `url(${heroImage})` }}
      />
      
      {/* 4. استخدام blob URL إذا كان موجود، وإضافة preload الفيديو */}
      <video
        ref={videoRef}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        poster={heroImage}
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
          videoLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        src={videoBlobUrl || hero}
        onLoadedData={() => setVideoLoaded(true)}
        onCanPlay={() => setVideoLoaded(true)}
      />

      {/* طبقة overlay متدرجة */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/40 via-transparent to-black/30"></div>

      {/* طبقة ضوء ديناميكي */}
      <div className="absolute inset-0 bg-gradient-to-t from-transparent via-[#18b5d5]/5 to-transparent"></div>

      {/* المحتوى الرئيسي */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full w-full text-center px-8 space-y-5">

      {/* صورة مالك */}
        <div className="relative">
          <img 
            src={malakImage} 
            alt="Malak"
            className="w-24 sm:w-32 lg:w-40 h-auto object-contain drop-shadow-2xl transform hover:scale-105 transition-transform duration-500"
          />
          {/* تأثير توهج خلف الصورة */}
          <div className="absolute inset-0 bg-[#18b5d5]/20 blur-3xl -z-10 animate-pulse"></div>
        </div>

     

        <div className="relative group flex gap-2 mt-16 sm:mt-16 md:mt-12 lg:mt-10">
         <button
  onClick={() => {
    const section = document.querySelector('[data-section="themes"]');
    section?.scrollIntoView({ behavior: "smooth", block: "start" });
  }}
  className="btn btn-outline btn-standard-outline px-6 py-2 text-sm sm:px-8 sm:py-3 sm:text-base md:px-10 md:py-4 md:text-lg border-white/30 text-white rounded-lg sm:rounded-xl md:rounded-2xl backdrop-blur-md"
  style={{
    border: '2px solid rgba(255,255,255,0.3)'
  }}
>
  <span className="relative z-10">
    {t('home.hero.theme_showcase')}
  </span>
</button>

        <button
  onClick={() => {
    const section = document.querySelector('[data-section="services"]');
    section?.scrollIntoView({ behavior: "smooth", block: "start" });
  }}
  className="btn btn-outline btn-standard-outline px-6 py-2 text-sm sm:px-8 sm:py-3 sm:text-base md:px-10 md:py-4 md:text-lg border-white/30 text-white rounded-lg sm:rounded-xl md:rounded-2xl backdrop-blur-md"
  style={{
    border: '2px solid rgba(255,255,255,0.3)'
  }}
>
  <span className="relative z-10">
    {t('home.hero.why_us')}
  </span>
</button>

          {/* الهالة الخارجية */}
          {/* <div className="absolute inset-0 rounded-2xl bg-[#18b5d5] opacity-0 group-hover:opacity-30 blur-xl scale-75 group-hover:scale-125 transition-all duration-700 -z-30"></div> */}
        </div>

        {/* نقاط ديكور */}
        <div className="absolute top-1/4 left-10 w-2 h-2 bg-[#18b5d5]/20 rounded-full animate-pulse"></div>
        <div className="absolute top-1/3 right-16 w-1 h-1 bg-white/40 rounded-full animate-pulse delay-300"></div>
        <div className="absolute bottom-1/4 left-20 w-1.5 h-1.5 bg-[#18b5d5]/40 rounded-full animate-pulse delay-700"></div>
        <div className="absolute bottom-1/3 right-12 w-1 h-1 bg-white/30 rounded-full animate-pulse delay-1000"></div>
      </div>
    </section>
  );
};

export default HeroSection;