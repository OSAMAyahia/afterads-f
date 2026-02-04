import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useTranslation } from 'react-i18next';
import { useApiQuery } from '../../hooks/useApiQuery';
import { API_ENDPOINTS } from '../../config/api';

interface Section {
  id: string;
  name: string;
}

const HOME_SECTIONS_STORAGE_KEY = 'ui_home_sections_visibility';

const ScrollProgressIndicator: React.FC = () => {
  const { t } = useTranslation();
  const [currentSection, setCurrentSection] = useState<number>(0);
  const [isVisible, setIsVisible] = useState<boolean>(false);

  const { data: homeSectionsResp } = useApiQuery<any>({
    endpoint: API_ENDPOINTS.HOME_SECTIONS_VISIBILITY_ENTRY,
    queryKey: ['home-sections-visibility'],
    staleTime: Infinity,
    refetchInterval: 30000,
    refetchOnMount: 'always'
  });

  const homeSectionsVisibility = useMemo(() => {
    const defaults: Record<string, boolean> = {
      hero: true,
      themes: true,
      services: true,
      categories: true,
      testimonials: true,
      clients: true,
      faq: true,
      contact: true,
    };

    let fromStorage: Record<string, boolean> | null = null;
    try {
      const raw = localStorage.getItem(HOME_SECTIONS_STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : null;
      if (parsed && typeof parsed === 'object') {
        fromStorage = parsed;
      }
    } catch { }

    const obj = Array.isArray(homeSectionsResp) ? homeSectionsResp[0] : (homeSectionsResp?.data ?? homeSectionsResp);
    const fromServer = obj?.sections && typeof obj.sections === 'object' ? obj.sections : null;
    const ready = Boolean(fromStorage) || Boolean(fromServer);
    if (!ready) {
      return Object.keys(defaults).reduce((acc: Record<string, boolean>, k) => {
        acc[k] = false;
        return acc;
      }, {});
    }
    return { ...defaults, ...(fromStorage || {}), ...(fromServer || {}) };
  }, [homeSectionsResp]);
  useEffect(() => {
    const obj = Array.isArray(homeSectionsResp) ? homeSectionsResp[0] : (homeSectionsResp?.data ?? homeSectionsResp);
    if (!(obj?.sections && typeof obj.sections === 'object')) return;
    try {
      localStorage.setItem(HOME_SECTIONS_STORAGE_KEY, JSON.stringify(obj.sections));
    } catch { }
  }, [homeSectionsResp]);

  const sections: Section[] = useMemo(() => ([
    { id: "hero", name: t('scroll_progress.beginning') },
    { id: "themes", name: t('scroll_progress.theme_malak') },
    { id: "services", name: t('scroll_progress.why_us') },
    { id: "categories", name: t('scroll_progress.our_products') },
    { id: "testimonials", name: t('scroll_progress.client_reviews') },
    { id: "clients", name: t('scroll_progress.our_clients') },
    { id: "faq", name: t('scroll_progress.faq') },
    { id: "contact", name: t('scroll_progress.contact_us') },
  ]).filter(section => homeSectionsVisibility[section.id] !== false), [t, homeSectionsVisibility]);

  const handleScroll = useCallback(() => {
    const scrollTop = window.scrollY;
    setIsVisible(scrollTop > 200);

    let currentSectionIndex = 0;
    for (let i = 0; i < sections.length; i++) {
      const element = document.querySelector(`[data-section="${sections[i].id}"]`);
      if (element) {
        const rect = element.getBoundingClientRect();
        const elementTop = rect.top + scrollTop;
        if (scrollTop >= elementTop - 200) {
          currentSectionIndex = i;
        }
      }
    }
    setCurrentSection(currentSectionIndex);
  }, [sections]);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  const handleSectionClick = useCallback((index: number) => {
    const section = sections[index];
    const element = 
      document.querySelector(`#${section.id}`) ||
      document.querySelector(`[data-section="${section.id}"]`);
    
    element?.scrollIntoView({ 
      behavior: "smooth",
      block: "start"
    });
  }, [sections]);

  const step = 35;
  const firstDotOffset = 30;
  const endPadding = 60;
  const containerHeight = Math.max(140, firstDotOffset + Math.max(0, sections.length - 1) * step + endPadding);

  if (!isVisible || sections.length === 0) return null;

  return (
    <div className="fixed left-6 top-1/2 -translate-y-1/2 z-50 hidden lg:block">
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes whatsapp-glow {
            0%, 100% {
              box-shadow: 0 4px 20px rgba(24, 181, 213, 0.3);
            }
            50% {
              box-shadow: 0 4px 30px rgba(24, 181, 213, 0.6), 0 0 20px rgba(24, 181, 213, 0.4);
            }
          }
          
          @keyframes wiggle {
            0%, 100% { transform: rotate(0deg); }
            25% { transform: rotate(-5deg); }
            75% { transform: rotate(5deg); }
          }
          
          .animate-wiggle:hover {
            animation: wiggle 1s ease-in-out infinite alternate;
          }
          
          .white-dot {
            background: white;
            border: 1px solid rgba(255, 255, 255, 0.5);
          }
          
          .active-dot {
            background: #18B5D5;
            animation: whatsapp-glow 2s ease-in-out infinite;
          }
          
          .active-text {
            text-shadow: 0 0 8px rgba(24, 181, 213, 0.6);
          }
        `
      }} />
      <div className="relative" style={{ height: `${containerHeight}px` }}>
        <div className="absolute left-2 top-0 w-0.5 h-full bg-gradient-to-b from-[#18B5D5] to-[#1AC8E8]"></div>
        <div className="absolute left-0 top-0 w-4 h-4 active-dot rounded-full"></div>
        {sections.map((section, index) => {
          const y = 30 + (index * 35);
          return (
            <div key={section.id} className="relative">
              <div
                className={`absolute -translate-y-1/2 w-2 h-2 rounded-full cursor-pointer transition-all duration-300 ${
                  index === currentSection
                    ? 'scale-125 active-dot'
                    : 'white-dot hover:scale-125 animate-wiggle'
                }`}
                style={{
                  left: '5px',
                  top: `${y}px`
                }}
                onClick={() => handleSectionClick(index)}
              ></div>
              <div
                className={`absolute -translate-y-1/2 cursor-pointer transition-all duration-300 ${
                  index === currentSection
                    ? 'text-[#18B5D5] font-semibold active-text'
                    : 'text-white hover:text-[#1AC8E8]'
                }`}
                style={{
                  left: '22px',
                  top: `${y}px`
                }}
                onClick={() => handleSectionClick(index)}
              >
                <span className="text-sm whitespace-nowrap font-medium">{section.name}</span>
              </div>
            </div>
          );
        })}
        <div className="absolute left-0 bottom-0 w-4 h-4 active-dot rounded-full"></div>
      </div>
    </div>
  );
};

export default ScrollProgressIndicator;
