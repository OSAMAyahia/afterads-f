import React, { useState, useEffect, useRef } from 'react';
import { Monitor, Tablet, Smartphone, Eye, X, ExternalLink, MessageSquare, Calendar, User } from 'lucide-react';
import { apiCall, API_ENDPOINTS, buildImageUrl, getApiBaseUrl } from '../config/api';
import { useApiQuery } from '../hooks/useApiQuery';
import fallbackImg from '../assets/search_not_found.png';
import { useTranslation } from 'react-i18next';

interface ThemeWork {
  _id?: string;
  id: number;
  imageMobile: string;
  imageTablet: string;
  imageDesktop: string;
  link: string;
  clientOpinion?: string;
  clientName?: string;
  clientImage?: string;
  workDate?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface PreviewModalProps {
  work: ThemeWork;
  isOpen: boolean;
  onClose: () => void;
}

const PreviewModal: React.FC<PreviewModalProps> = ({ work, isOpen, onClose }) => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const [device, setDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

  if (!isOpen) return null;

  const getImageUrl = (path: string) => buildImageUrl(path);

  const currentImage =
    device === 'desktop'
      ? work.imageDesktop
      : device === 'tablet'
      ? work.imageTablet
      : work.imageMobile;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-2 sm:p-4"
      onClick={onClose}
    >
      <div
        className="relative bg-[#121212] rounded-2xl border border-[#2a2a2a] max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header: Preview label + Close button (non-absolute) */}
        <div className="p-3 pb-2 bg-[#0f0f0f] border-b border-[#2a2a2a]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-full backdrop-blur-sm">
              <Eye className="w-3.5 h-3.5 text-[#929292]" />
              <span className="text-[#929292] text-xs font-medium">
                {t('theme_works.overlay.preview')}
              </span>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-sm transition-colors"
              aria-label={t('close')}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Device Selector Buttons */}
        <div className="flex flex-wrap justify-center gap-2 p-3 sm:p-4 bg-[#0f0f0f] border-b border-[#2a2a2a]">
          <button
            onClick={() => setDevice('desktop')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              device === 'desktop'
                ? 'bg-[#929292] text-white shadow-md'
                : 'bg-[#929292]/20 text-[#929292] border border-[#929292]/30 hover:bg-[#929292]/30'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>{t('theme_works.modal.device.desktop')}</span>
          </button>
          <button
            onClick={() => setDevice('tablet')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              device === 'tablet'
                ? 'bg-[#929292] text-white shadow-md'
                : 'bg-[#929292]/20 text-[#929292] border border-[#929292]/30 hover:bg-[#929292]/30'
            }`}
          >
            <Tablet className="w-3.5 h-3.5" />
            <span>{t('theme_works.modal.device.tablet')}</span>
          </button>
          <button
            onClick={() => setDevice('mobile')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              device === 'mobile'
                ? 'bg-[#929292] text-white shadow-md'
                : 'bg-[#929292]/20 text-[#929292] border border-[#929292]/30 hover:bg-[#929292]/30'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>{t('theme_works.modal.device.mobile')}</span>
          </button>
        </div>

        {/* Image Preview */}
        <div className="flex items-center justify-center p-3 sm:p-4 flex-1 bg-[#0f0f0f]">
          <div
            className={`bg-[#1a1a1a] rounded-lg overflow-hidden w-full h-full flex items-center justify-center ${
              device === 'desktop'
                ? 'max-w-full max-h-full'
                : device === 'tablet'
                ? 'max-w-md sm:max-w-lg'
                : 'max-w-[260px] sm:max-w-[300px]'
            }`}
          >
            <img
              src={getImageUrl(currentImage)}
              alt={`${device} preview`}
              className={`w-full h-full ${
                device === 'desktop' ? 'object-contain' : 'object-cover'
              }`}
              onError={(e) => {
                e.currentTarget.src = fallbackImg;
              }}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2.5 p-3 sm:p-4 bg-[#0f0f0f] border-t border-[#2a2a2a]">
          <button
            onClick={() =>
              setDevice(prev =>
                prev === 'desktop' ? 'tablet' : prev === 'tablet' ? 'mobile' : 'desktop'
              )
            }
            className="flex-1 flex items-center justify-center gap-1.5 bg-[#929292]/20 backdrop-blur-sm text-white px-2.5 py-2 sm:px-3 sm:py-2.5 rounded-lg text-xs sm:text-sm font-medium border border-[#929292]/30 hover:bg-[#929292]/30 transition-all"
          >
            <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>{t('theme_works.overlay.preview')}</span>
          </button>
          <a
            href={work.link}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-1.5 bg-[#929292]/20 backdrop-blur-sm text-white px-2.5 py-2 sm:px-3 sm:py-2.5 rounded-lg text-xs sm:text-sm font-medium border border-[#929292]/30 hover:bg-[#929292]/30 transition-all"
          >
            <ExternalLink className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>{t('theme_works.overlay.visit')}</span>
          </a>
        </div>
      </div>
    </div>
  );
};;;;

const ThemeWorks: React.FC = () => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const [works, setWorks] = useState<ThemeWork[]>([]);
  const { data: worksResp, isLoading: loading } = useApiQuery<any>({ endpoint: API_ENDPOINTS.THEME_WORKS.LIST, queryKey: ['theme-works'] });
  const [error, setError] = useState('');
  const [selectedWork, setSelectedWork] = useState<ThemeWork | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [maskActive, setMaskActive] = useState(false);
  const [overlayRect, setOverlayRect] = useState<{ top: number; left: number; width: number; height: number } | null>(null);
  const holdTimerRef = useRef<number | null>(null);
  const scrollRafRef = useRef<number | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [iframeReady, setIframeReady] = useState(false);
  
  const embedMode = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('embed') === 'true';

  useEffect(() => {
    if (!worksResp) return;
    const data = Array.isArray(worksResp) ? worksResp : worksResp?.data || worksResp?.items || [];
    const activeWorks = data.filter((work: ThemeWork) => work.isActive);
    setWorks(activeWorks);
    setError('');
  }, [worksResp, t]);

  const handlePreview = (work: ThemeWork) => {
    setSelectedWork(work);
    setIsModalOpen(true);
  };

  const getImageUrl = (path: string) => buildImageUrl(path);

  const contentCloneRef = useRef<HTMLDivElement | null>(null);
  const [contentHeight, setContentHeight] = useState(0);
  const [scrollOffset, setScrollOffset] = useState(0);

  // Start scroll animation after content height is set
  useEffect(() => {
    if (maskActive && contentHeight > 0 && overlayRect) {
      startContentScroll();
    }
  }, [contentHeight, maskActive, overlayRect]);

  const startContentScroll = () => {
    if (!contentCloneRef.current || contentHeight === 0 || !overlayRect) return;
    
    const speed = 4;
    let currentOffset = 0;
    
    const step = () => {
      const maxOffset = Math.max(0, contentHeight - overlayRect.height);
      currentOffset += speed;
      
      if (currentOffset >= maxOffset) {
        // Stop animation when reaching the bottom
        scrollRafRef.current = null;
        setScrollOffset(maxOffset);
        return;
      }
      
      setScrollOffset(currentOffset);
      scrollRafRef.current = requestAnimationFrame(step);
    };
    
    scrollRafRef.current = requestAnimationFrame(step);
  };

  const stopScrollAnimation = () => {
    if (scrollRafRef.current) {
      cancelAnimationFrame(scrollRafRef.current);
      scrollRafRef.current = null;
    }
  };
const handlePressStart = (rect: DOMRect, imageElement: HTMLElement) => {
  if (holdTimerRef.current) {
    window.clearTimeout(holdTimerRef.current);
  }
  holdTimerRef.current = window.setTimeout(() => {
    // استخدم موقع وحجم الصورة الفعلي بدلاً من الكونتينر
    const imgRect = imageElement.getBoundingClientRect();
    setOverlayRect({ 
      top: imgRect.top, 
      left: imgRect.left, 
      width: imgRect.width, 
      height: imgRect.height 
    });
    setMaskActive(true);
    
    // Clone content and calculate height
    const bodyClone = document.body.cloneNode(true) as HTMLElement;
    
    // Fix image URLs in cloned content to prevent 404 errors
    const images = bodyClone.querySelectorAll('img');
    images.forEach(img => {
      if (img.src && !img.src.startsWith('http') && !img.src.startsWith('data:')) {
        // Convert relative URLs to absolute
        const baseUrl = getApiBaseUrl();
        if (img.src.startsWith('/')) {
          img.src = baseUrl + img.src;
        } else {
          img.src = baseUrl + '/' + img.src;
        }
      }
    });
    
    // Store the cloned content in the ref
    if (contentCloneRef.current) {
      contentCloneRef.current.innerHTML = '';
      contentCloneRef.current.appendChild(bodyClone);
      
      // Debug: Check if content was added
      console.log('Content cloned successfully, children count:', bodyClone.children.length);
      console.log('Content height set to:', tempDiv.scrollHeight);
    }
    
    // Calculate height using a temporary container
    const tempDiv = document.createElement('div');
    tempDiv.style.position = 'absolute';
    tempDiv.style.top = '-9999px';
    tempDiv.style.left = '-9999px';
    tempDiv.style.width = `${imgRect.width}px`;
    tempDiv.appendChild(bodyClone.cloneNode(true));
    document.body.appendChild(tempDiv);
    
    setContentHeight(tempDiv.scrollHeight);
    setScrollOffset(0);
    
    // Cleanup after animation
    setTimeout(() => {
      document.body.removeChild(tempDiv);
    }, 100);
  }, 500);
};

  const handlePressEnd = () => {
    if (holdTimerRef.current) {
      window.clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    stopScrollAnimation();
    setMaskActive(false);
    setScrollOffset(0);
    setContentHeight(0);
    setOverlayRect(null);
  }; 
  

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#18b5d8]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <p className="text-red-400 text-lg">{error}</p>
      </div>
    );
  }

  if (works.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-[#a1a1a1] text-lg">{t('theme_works.no_works')}</p>
      </div>
    );
  }

  return (
    <div className="mt-12 sm:mt-20 mb-12 sm:mb-16 relative animate-section">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#18b5d8]/3 via-transparent to-[#292929]/10 rounded-3xl"></div>
      <div className="absolute top-10 right-10 w-24 h-24 bg-gradient-to-br from-[#18b5d8]/15 to-transparent rounded-full blur-2xl animate-pulse"></div>
      <div className="absolute bottom-10 left-10 w-32 h-32 bg-gradient-to-tl from-[#18b5d8]/10 to-transparent rounded-full blur-3xl animate-pulse delay-1000"></div>

      <div className="relative bg-gradient-to-br from-[#1a1a1a]/98 via-[#292929]/95 to-[#1a1a1a]/98 rounded-3xl backdrop-blur-xl border border-[#18b5d8]/20 shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="relative p-6 sm:p-12 pb-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-3 bg-gradient-to-r from-[#18b5d8]/20 to-[#18b5d8]/10 px-6 py-3 rounded-full border border-[#18b5d8]/30 mb-6">
              <div className="w-2 h-2 bg-[#18b5d8] rounded-full animate-pulse"></div>
                <span className="text-[#18b5d8] font-medium text-sm">{t('theme_works.header.badge')}</span>
            </div>
<h2 className="text-xl sm:text-2xl lg:text-4xl font-black text-white mb-4 sm:mb-6 leading-snug">
              {t('theme_works.header.title')}
            </h2>
            <p className="text-lg sm:text-xl text-[#a1a1a1] max-w-3xl mx-auto leading-relaxed">
              {t('theme_works.header.description')}
            </p>
          </div>
        </div>

        {/* Works Grid */}
        <div className="relative px-4 sm:px-12 pb-12">
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {works.map((work, index) => (
           <div 
  key={work._id || work.id || index}
  className="bg-[#1e1e1e]/95 backdrop-blur-lg border border-gray-700/20 rounded-xl sm:rounded-2xl overflow-hidden hover:border-[#18b5d8]/30 transition-all duration-300 group h-full flex flex-col scale-95 sm:scale-100"
>
                {/* Image Container */}
<div
  className="relative aspect-[16/9] sm:aspect-[16/10] lg:aspect-[4/3] overflow-hidden bg-white/5 cursor-pointer"
  onMouseDown={(e) => {
    const container = e.currentTarget;
    const img = container.querySelector('img');
    if (img) {
      handlePressStart(container.getBoundingClientRect(), img);
    }
  }}
  onMouseUp={handlePressEnd}
  onMouseLeave={handlePressEnd}
  onTouchStart={(e) => {
    const container = e.currentTarget;
    const img = container.querySelector('img');
    if (img) {
      handlePressStart(container.getBoundingClientRect(), img);
    }
  }}
  onTouchEnd={handlePressEnd}
>
  <img 
    src={getImageUrl(work.imageDesktop)}
    alt="Work Preview"
    className={`w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ${maskActive ? 'opacity-0' : ''}`}
    onError={(e) => {
      e.currentTarget.src = fallbackImg;
    }}
  />
                  
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center gap-3">
                 <button
  onClick={() => handlePreview(work)}
  className="bg-gradient-to-r from-[#18b5d8] to-[#16a8cc] text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold hover:from-[#16a8cc] hover:to-[#18b5d8] transition-all duration-300 transform hover:scale-105 flex items-center gap-1.5 sm:gap-2"
>
  <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
  <span>{t('theme_works.overlay.preview')}</span>
</button>
                    <a
                  href={work.link}
  target="_blank"
  rel="noopener noreferrer"
  className="bg-white/20 backdrop-blur-sm text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold hover:bg-white/30 transition-all duration-300 flex items-center gap-1.5 sm:gap-2"
>
  <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4" />
  <span>{t('theme_works.overlay.visit')}</span>
</a>
                  </div>

               
                </div>

                {/* Content */}
<div className="p-3 sm:p-5 flex-1 flex flex-col justify-end">                  {work.clientOpinion && (
                    <div className="mb-4">
<p className="text-gray-300 text-xs sm:text-sm leading-relaxed italic text-center line-clamp-2 sm:line-clamp-3">                        "{work.clientOpinion}"
                      </p>
                    </div>
                  )}
                  
                  {/* Client Info */}
                  <div className="relative">
                    <div className="h-px bg-gradient-to-r from-transparent via-[#18b5d8]/20 to-transparent mb-4"></div>
        <div className="flex items-center gap-2 sm:gap-3">
  {work.clientImage ? (
    <img
      src={getImageUrl(work.clientImage)}
      alt={work.clientName || 'Client'}
      className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl object-cover border-2 border-[#18b5d8]/20 shadow-lg group-hover:border-[#18b5d8]/60 transition-all duration-500"
    />
  ) : (
    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-[#18b5d8] to-[#0f8aa3] rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg">
                          <span className="text-white font-bold text-lg">
                            {work.clientName ? work.clientName.charAt(0).toUpperCase() : '?'}
                          </span>
                        </div>
                      )}
               <div className="flex-1">
  <h3 className="font-bold text-white text-sm sm:text-base group-hover:text-[#18b5d8]/90 transition-colors">
    {work.clientName || 'اسم العميل'}
  </h3>
  {work.workDate && (
    <p className="text-[10px] sm:text-xs text-gray-400 flex items-center gap-1 mt-0.5 sm:mt-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(work.workDate).toLocaleDateString('ar-SA')}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Line Animation */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#18b5d8]/50 to-transparent transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {selectedWork && (
        <PreviewModal 
          work={selectedWork}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      )}

      {maskActive && overlayRect && (
        <div className="fixed z-[10001] pointer-events-none">
          {/* Covers outside the hole */}
          <div
            className="fixed bg-black/40"
            style={{ top: 0, left: 0, width: '100vw', height: `${overlayRect.top}px` }}
          />
          <div
            className="fixed bg-black/40"
            style={{ top: `${overlayRect.top + overlayRect.height}px`, left: 0, width: '100vw', height: `calc(100vh - ${overlayRect.top + overlayRect.height}px)` }}
          />
          <div
            className="fixed bg-black/40"
            style={{ top: `${overlayRect.top}px`, left: 0, width: `${overlayRect.left}px`, height: `${overlayRect.height}px` }}
          />
          <div
            className="fixed bg-black/40"
            style={{ top: `${overlayRect.top}px`, left: `${overlayRect.left + overlayRect.width}px`, width: `calc(100vw - ${overlayRect.left + overlayRect.width}px)`, height: `${overlayRect.height}px` }}
          />

          {/* Content container with cloned content */}
           <div
             className="fixed overflow-hidden"
             style={{ 
               top: `${overlayRect.top}px`, 
               left: `${overlayRect.left}px`, 
               width: `${overlayRect.width}px`, 
               height: `${overlayRect.height}px`,
               borderRadius: '0.75rem',
               border: '4px solid rgba(255,255,255,0.3)',
               boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
               backgroundColor: 'transparent'
             }}
           >
             <div
             ref={contentCloneRef}
             className="overlay-content-container"
             style={{
               transform: `translateY(-${scrollOffset}px)`,
               width: '100%',
               height: `${contentHeight}px`,
               scrollbarWidth: 'none',
               msOverflowStyle: 'none',
               overflow: 'hidden',
               minHeight: '100px'
             }}
           />
         </div>
       </div>
     )}
   </div>
  );
};

export default ThemeWorks;
