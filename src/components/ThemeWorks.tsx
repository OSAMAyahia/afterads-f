import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Monitor, Tablet, Smartphone, Eye, X, ExternalLink, Calendar } from 'lucide-react';
import { apiCall, API_ENDPOINTS, buildImageUrl } from '../config/api';
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
  const [device, setDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [isDeviceChanging, setIsDeviceChanging] = useState(false);
  const deviceChangeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [scrollOverlayActive, setScrollOverlayActive] = useState(false);
  const [scrollOverlayDevice, setScrollOverlayDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [isScrolling, setIsScrolling] = useState(false);
  const [currentScrollDevice, setCurrentScrollDevice] = useState<'desktop' | 'tablet' | 'mobile' | null>(null);
  const previewContainerRef = useRef<HTMLDivElement | null>(null);
  const scrollIntervalRef = useRef<number | null>(null);

  const startImageScroll = (device: 'desktop' | 'tablet' | 'mobile') => {
    setIsScrolling(true);
    setCurrentScrollDevice(device);
    
    const container = previewContainerRef.current;
    if (!container) return;
    
    // إعادة التمرير للبداية
    container.scrollTop = 0;
    
    // بدء التمرير التلقائي
    let scrollSpeed = 4;
    
    scrollIntervalRef.current = window.setInterval(() => {
      if (container) {
        container.scrollTop += scrollSpeed;
        
        // إذا وصلنا للنهاية، نرجع للبداية
        if (container.scrollTop >= container.scrollHeight - container.clientHeight) {
          container.scrollTop = 0;
        }
      }
    }, 30);
  };

  const stopImageScroll = () => {
    setIsScrolling(false);
    setCurrentScrollDevice(null);
    
    if (scrollIntervalRef.current) {
      clearInterval(scrollIntervalRef.current);
      scrollIntervalRef.current = null;
    }
  };

  // دالة لتغيير الجهاز مع تأخير (debouncing) لتحسين الأداء
  const handleDeviceChange = useCallback((device: 'desktop' | 'tablet' | 'mobile') => {
    // إلغاء أي تأخير سابق
    if (deviceChangeTimeoutRef.current) {
      clearTimeout(deviceChangeTimeoutRef.current);
    }
    
    // إظهار حالة التحميل
    setIsDeviceChanging(true);
    
    // تأخير بسيط (50ms) لتحسين استجابة الزر
    deviceChangeTimeoutRef.current = setTimeout(() => {
      setDevice(device);
      setIsDeviceChanging(false);
      
      // إيقاف التمرير عند تغيير الجهاز
      if (isScrolling) {
        stopImageScroll();
      }
    }, 50);
  }, [isScrolling]);

const handlePressStart = (selectedDevice: 'desktop' | 'tablet' | 'mobile') => {
    // تفعيل وضع المعاينة فقط بدون سكرول الموقع
    setScrollOverlayDevice(selectedDevice);
    setScrollOverlayActive(true);
  };

  const handlePressEnd = () => {
    setScrollOverlayActive(false);
  };

  useEffect(() => {
    return () => {
      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current);
      }
      // تنظيف التايمر عند إلغاء المكون
      if (deviceChangeTimeoutRef.current) {
        clearTimeout(deviceChangeTimeoutRef.current);
      }
    };
  }, []);

  if (!isOpen) return null;

  const getImageUrl = (path: string) => buildImageUrl(path);

  const currentImage =
    device === 'desktop'
      ? work.imageDesktop
      : device === 'tablet'
      ? work.imageTablet
      : work.imageMobile;

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-2 sm:p-4"
        onClick={onClose}
      >
        <div
          className="relative bg-[#121212] rounded-2xl border border-[#2a2a2a] max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
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

          {/* Device Selector */}
          <div className="flex flex-wrap justify-center gap-2 p-3 sm:p-4 bg-[#0f0f0f] border-b border-[#2a2a2a]">
            <button
              onClick={() => handleDeviceChange('desktop')}
              disabled={isDeviceChanging}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all relative ${
                device === 'desktop'
                  ? 'bg-[#929292] text-white shadow-md'
                  : 'bg-[#929292]/20 text-[#929292] border border-[#929292]/30 hover:bg-[#929292]/30'
              } ${isDeviceChanging ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>{t('theme_works.modal.device.desktop')}</span>
              {isDeviceChanging && device === 'desktop' && (
                <div className="absolute inset-0 bg-[#929292]/50 rounded-lg flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                </div>
              )}
            </button>
            <button
              onClick={() => handleDeviceChange('tablet')}
              disabled={isDeviceChanging}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all relative ${
                device === 'tablet'
                  ? 'bg-[#929292] text-white shadow-md'
                  : 'bg-[#929292]/20 text-[#929292] border border-[#929292]/30 hover:bg-[#929292]/30'
              } ${isDeviceChanging ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Tablet className="w-3.5 h-3.5" />
              <span>{t('theme_works.modal.device.tablet')}</span>
              {isDeviceChanging && device === 'tablet' && (
                <div className="absolute inset-0 bg-[#929292]/50 rounded-lg flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                </div>
              )}
            </button>
            <button
              onClick={() => handleDeviceChange('mobile')}
              disabled={isDeviceChanging}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all relative ${
                device === 'mobile'
                  ? 'bg-[#929292] text-white shadow-md'
                  : 'bg-[#929292]/20 text-[#929292] border border-[#929292]/30 hover:bg-[#929292]/30'
              } ${isDeviceChanging ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>{t('theme_works.modal.device.mobile')}</span>
              {isDeviceChanging && device === 'mobile' && (
                <div className="absolute inset-0 bg-[#929292]/50 rounded-lg flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                </div>
              )}
            </button>
          </div>

          {/* Image Preview with Scroll Effect */}
          <div className="flex items-center justify-center p-3 sm:p-4 flex-1 bg-[#0f0f0f]">
            <div
              ref={previewContainerRef}
              className={`bg-[#1a1a1a] rounded-lg overflow-hidden transition-all duration-500 ${
                device === 'desktop' 
                  ? 'w-full max-w-full h-[200px] sm:h-[254px] md:h-[308px] lg:h-[362px]' 
                  : device === 'tablet' 
                    ? 'w-full max-w-[90vw] sm:max-w-[380px] md:max-w-[420px] aspect-[3/4]' 
                    : 'w-full max-w-[90vw] sm:max-w-[250px] md:max-w-[280px] aspect-[9/20]'
              } flex items-start justify-center mx-auto cursor-pointer relative overflow-y-auto`}
              style={{
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
              }}
              onMouseEnter={() => startImageScroll(device)}
              onMouseLeave={stopImageScroll}
              onClick={() => handlePressStart(device)}
            >
              <img
                src={getImageUrl(currentImage)}
                alt={`${device} preview`}
                className={`w-full h-auto transition-transform duration-300 ${
                  device === 'desktop' ? 'object-contain object-top' : 'object-cover object-top'
                } ${scrollOverlayActive && scrollOverlayDevice === device ? 'opacity-0' : ''}`}
                style={{ minHeight: '100%', display: 'block' }}
                onError={(e) => {
                  e.currentTarget.src = fallbackImg;
                }}
                onLoad={(e) => {
                  // إعادة تعيين الموضع عند تحميل الصورة
                  if (previewContainerRef.current) {
                    previewContainerRef.current.scrollTop = 0;
                  }
                }}
              />
              
              {/* Badge للسكرول */}
              {isScrolling && currentScrollDevice === device && (
                <div className="absolute top-1.5 sm:top-2 left-1.5 sm:left-2 bg-green-500/90 backdrop-blur-sm px-1.5 sm:px-2 py-0.5 rounded-full text-white text-[10px] sm:text-xs font-semibold z-10 flex items-center gap-1">
                  <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                  <span>Scrolling</span>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons (Desktop only) */}
          {device === 'desktop' && (
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
          )}
        </div>
      </div>

      {/* Simple Image Preview Overlay */}
 {scrollOverlayActive && (
   <div
     className="fixed inset-0 z-[10003] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
     onClick={() => setScrollOverlayActive(false)}
   >
     <div
       className="bg-[#1a1a1a] rounded-lg overflow-hidden transition-all duration-500 max-w-[90vw] max-h-[90vh]"
       onClick={(e) => e.stopPropagation()}
     >
       <div className="relative">
         <img
           src={getImageUrl(currentImage)}
           alt={`${scrollOverlayDevice} preview`}
           className="w-full h-auto object-contain"
           style={{ maxHeight: '80vh' }}
           onError={(e) => {
             e.currentTarget.src = fallbackImg;
           }}
         />
         
         {/* Close button */}
         <button
           onClick={() => setScrollOverlayActive(false)}
           className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white p-1.5 rounded-full transition-colors"
         >
           <X className="w-4 h-4" />
         </button>
       </div>
     </div>
   </div>
 )}
    </>
  );
};

const ThemeWorks: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [works, setWorks] = useState<ThemeWork[]>([]);
  const { data: worksResp, isLoading: loading } = useApiQuery<any>({ endpoint: API_ENDPOINTS.THEME_WORKS.LIST, queryKey: ['theme-works'] });
  const [error, setError] = useState('');
  const [selectedWork, setSelectedWork] = useState<ThemeWork | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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
                <div className="relative aspect-[16/9] sm:aspect-[16/10] lg:aspect-[4/3] overflow-hidden bg-white/5">
                  <img 
                    src={getImageUrl(work.imageDesktop)}
                    alt="Work Preview"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    onError={(e) => {
                      e.currentTarget.src = fallbackImg;
                    }}
                  />
                  
                  {/* Overlay - يظهر فقط على الديسكتوب */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 hidden lg:flex items-center justify-center gap-3">
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
                <div className="p-3 sm:p-5 flex-1 flex flex-col justify-end">
                  {work.clientOpinion && (
                    <div className="mb-4">
                      <p className="text-gray-300 text-xs sm:text-sm leading-relaxed italic text-center line-clamp-2 sm:line-clamp-3">
                        {work.clientOpinion}
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
    </div>
  );
};

export default ThemeWorks;
