import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { smartToast } from '../utils/toastConfig';
 
import {
  ShoppingCart, Star, MessageSquare, Play, Eye, Headphones,
  Settings, Palette, Store, Smartphone, Languages, Search,
  RefreshCcw, Gift, Plus, Minus, ChevronDown, ChevronUp, FileText,
  Tablet,
  Monitor,
  X,
  ExternalLink, // ✅ أضف هذا
} from 'lucide-react';
// ✅ أضف React Icons
import { 
  FaUser, FaShoppingCart, FaHeart, FaStar, FaBolt, FaChartLine,
  FaTrophy, FaGift, FaShieldAlt, FaRocket, FaEnvelope, FaPhone,
  FaMapMarkerAlt, FaClock, FaCheck, FaTimes, FaCamera, FaImage,
  FaCode, FaPalette, FaMobile, FaLaptop, FaSearch, FaCog,
  FaBell, FaHome, FaTag, FaFire, FaThumbsUp, FaComments,
  FaUsers, FaBox, FaCreditCard, FaTruck, FaStore, FaChartBar,
  FaGlobe, FaLock, FaKey, FaEye, FaDownload, FaUpload,
  FaEdit, FaTrash, FaPlus, FaMinus, FaSave, FaUndo,
  FaShareAlt, FaPrint, FaFilePdf, FaFileExcel, FaFileWord
} from 'react-icons/fa';
import {
  MdDashboard, MdEmail, MdPhone, MdLocationOn, MdAccessTime,
  MdCheckCircle
} from 'react-icons/md';
import {
  IoMdCart, IoMdHeart, IoMdStar, IoMdTrophy, IoMdGift, IoMdRocket
} from 'react-icons/io';
import {
  AiFillStar, AiFillHeart, AiFillFire, AiFillThunderbolt,
  AiFillGift, AiFillTrophy, AiFillRocket, AiFillBell
} from 'react-icons/ai';
import {
  BsFillLightningFill, BsFillRocketFill, BsFillStarFill,
  BsFillHeartFill, BsFillTrophyFill, BsFillGiftFill
} from 'react-icons/bs';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { apiCall, API_ENDPOINTS, buildImageUrl } from '../config/api';
import { useApiQuery } from '../hooks/useApiQuery';
import { addToCartUnified, addToWishlistUnified } from '../utils/cartUtils';
import WhatsAppButton from './ui/WhatsAppButton';
import AuthModal from './modals/AuthModal';
import PriceDisplay from './ui/PriceDisplay';
import theme1 from '../assets/themecover.webp';
import theme2 from '../assets/111.webp';
import theme3 from '../assets/112.webp';
import theme4 from '../assets/113.webp';
import theme5 from '../assets/screencapture-desktop.png';
import theme6 from '../assets/screencapture-tablet.png';
import theme7 from '../assets/screencapture-phone2.png';
import angel from '../assets/angel.webp';
import LoadingSpinner from './ui/LoadingSpinner';
import { FeatureCounter } from './ui/FeatureCounter';
import ThemeWorks from './ThemeWorks';
import fallbackImg from '../assets/search_not_found.png';

const getIconComponent = (iconName: string) => {
  const icons: { [key: string]: any } = {
    FaUser, FaShoppingCart, FaHeart, FaStar, FaBolt, FaChartLine,
    FaTrophy, FaGift, FaShieldAlt, FaRocket, FaEnvelope, FaPhone,
    FaMapMarkerAlt, FaClock, FaCheck, FaTimes, FaCamera, FaImage,
    FaCode, FaPalette, FaMobile, FaLaptop, FaSearch, FaCog,
    FaBell, FaHome, FaTag, FaFire, FaThumbsUp, FaComments,
    FaUsers, FaBox, FaCreditCard, FaTruck, FaStore, FaChartBar,
    FaGlobe, FaLock, FaKey, FaEye, FaDownload, FaUpload,
    FaEdit, FaTrash, FaPlus, FaMinus, FaSave, FaUndo,
    FaShareAlt, FaPrint, FaFilePdf, FaFileExcel, FaFileWord,
    MdDashboard, MdEmail, MdPhone, MdLocationOn, MdAccessTime, MdCheckCircle,
    IoMdCart, IoMdHeart, IoMdStar, IoMdTrophy, IoMdGift, IoMdRocket,
    AiFillStar, AiFillHeart, AiFillFire, AiFillThunderbolt,
    AiFillGift, AiFillTrophy, AiFillRocket, AiFillBell,
    BsFillLightningFill, BsFillRocketFill, BsFillStarFill,
    BsFillHeartFill, BsFillTrophyFill, BsFillGiftFill
  };
  return icons[iconName] || FaUser;
};

gsap.registerPlugin(ScrollTrigger);

interface Theme {
  id: number;
  name: string;
  description: string;
  shortDescription?: string;
  price: number;
  originalPrice?: number;
  isAvailable: boolean;
  categoryId: number | null;
  productType?: string;
  mainImage: string;
  detailedImages: string[];
  faqs?: Array<{ question: string; answer: string }>;
  addOns?: Array<{ name: string; price: number; description?: string }>;
  isActive?: boolean;
  seoTitle?: string;
  seoDescription?: string;
  metaTitle?: string;
  metaDescription?: string;
  videoLink?: string;
  previewLink?: string;
  createdAt: string;
}

interface Category {
  id: number;
  name: string;
  description: string;
}

// Cache للصور الفاشلة مع انتهاء صلاحية محدودة
const failedImagesCache = new Map<string, number>();
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 دقائق

const isImageFailed = (src: string): boolean => {
  const failureTime = failedImagesCache.get(src);
  if (!failureTime) return false;
  
  // إذا مرت أكثر من 5 دقائق، حذف من الكاش
  if (Date.now() - failureTime > CACHE_EXPIRY) {
    failedImagesCache.delete(src);
    return false;
  }
  
  return true;
};

const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
  const target = e.currentTarget;
  const src = target.src;
  failedImagesCache.set(src, Date.now());
  target.onerror = null;
  target.src = fallbackImg;
  target.style.opacity = '0.3';
};

const getSafeImageUrl = (imageUrl: string | undefined | null): string => {
  if (!imageUrl) {
    return fallbackImg;
  }
  
  const trimmed = imageUrl.trim();
  if (!trimmed) {
    return fallbackImg;
  }
  
  // التعامل مع الصور من نوع base64 بمرونة أكبر
  if (trimmed.toLowerCase().startsWith('data:image/')) {
    // التأكد من أن الصورة base64 صالحة
    const base64Pattern = /^data:image\/[a-z]+;base64,/;
    if (base64Pattern.test(trimmed.toLowerCase())) {
      return trimmed;
    } else {
      // في حالة الصور base64 غير الكاملة، نحاول استخراج الجزء الصحيح
      const base64StartIndex = trimmed.toLowerCase().indexOf('base64,');
      if (base64StartIndex !== -1) {
        const imageType = trimmed.substring(0, trimmed.toLowerCase().indexOf(';'));
        const base64Data = trimmed.substring(base64StartIndex + 'base64,'.length);
        return `${imageType};base64,${base64Data}`;
      }
    }
  }
  
  // للصور العادية
  const fullUrl = buildImageUrl(trimmed);
  if (isImageFailed(fullUrl)) {
    return fallbackImg;
  }
  return fullUrl;
};

// ✅ PreviewModal مبسط لإصلاح مشكلة عرض الصور
const PreviewModal: React.FC<{ 
  images: string[]; 
  title: string; 
  isOpen: boolean; 
  onClose: () => void; 
}> = ({ images, title, isOpen, onClose }) => {
  const { t } = useTranslation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  // إعادة تعيين المؤشر عند فتح المودال أو تغير الصور
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(0);
      setIsAutoPlaying(true);
      console.log('PreviewModal Opened. Images:', images?.length);
    }
  }, [isOpen, images]); // أضفنا images هنا عشان لو اتغيرت والنافذة مفتوحة

  useEffect(() => {
    if (!isOpen || !isAutoPlaying || !images || images.length <= 1) return;
    const id = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % images.length);
    }, 4000);
    return () => clearInterval(id);
  }, [isAutoPlaying, images, isOpen]); // أضفنا isOpen و images

  const next = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!images?.length) return;
    setCurrentIndex(p => (p + 1) % images.length);
    setIsAutoPlaying(false);
  };

  const prev = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!images?.length) return;
    setCurrentIndex(p => (p - 1 + images.length) % images.length);
    setIsAutoPlaying(false);
  };

  const goTo = (i: number, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentIndex(i);
    setIsAutoPlaying(false);
  };

  if (!isOpen) return null;

  const currentImage = images && images.length > 0 ? images[currentIndex] : null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-md p-2 sm:p-4"
      onClick={onClose}
    >
      <div
        className="relative bg-[#121212] rounded-2xl border border-[#2a2a2a] w-full max-w-5xl h-[80vh] flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-[#0f0f0f] border-b border-[#2a2a2a] z-20">
          <h3 className="text-white font-medium text-lg truncate pr-4">
            {title || t('theme_works.overlay.preview')}
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Image Area */}
        <div className="flex-1 relative flex items-center justify-center bg-black overflow-hidden">
          {!currentImage ? (
             <div className="text-gray-400">No images available</div>
          ) : (
          <img
  key={`${currentIndex}-${currentImage ? currentImage.substring(0, Math.min(50, currentImage.length)) : ''}`}
  src={getSafeImageUrl(currentImage)}
  alt={`${title} - ${currentIndex + 1}`}
  className="max-w-full max-h-full object-contain"
  style={{ maxHeight: '80vh' }}
  loading="lazy"
  onError={(e) => {
    console.error('PreviewModal Image Error:', currentImage ? currentImage.substring(0, 100) : 'null');
    handleImageError(e);
    // محاولة ثانية مع تقسيم الصورة إذا كانت كبيرة جداً
    if (currentImage && currentImage.startsWith('data:image/') && currentImage.length > 10000) {
      setTimeout(() => {
        const img = e.currentTarget;
        if (img.src === fallbackImg) {
          try {
            const parts = currentImage.match(/.{1,10000}/g) || [];
            if (parts.length > 1) {
              img.src = parts[0] + '...';
            }
          } catch (err) {
            console.error('Failed to process large base64 image:', err);
          }
        }
      }, 500);
    }
  }}
/>
          )}

          {/* Controls */}
          {images && images.length > 1 && (
            <>
              <button
                onClick={prev}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-colors z-20"
              >
                <span className="text-xl font-bold">←</span>
              </button>
              <button
                onClick={next}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-colors z-20"
              >
                <span className="text-xl font-bold">→</span>
              </button>
              
              {/* Indicators */}
              <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 z-20 px-4">
                {images.map((_, i) => (
                  <button
                    key={i}
                    onClick={(e) => goTo(i, e)}
                    className={`w-2.5 h-2.5 rounded-full transition-all ${
                      i === currentIndex ? 'bg-[#18b5d8] w-6' : 'bg-white/30 hover:bg-white/50'
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const ThemeDetail: React.FC = () => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const { param } = useParams<{ param?: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const isNumericId = param && /^\d+$/.test(param);
  const themeId = isNumericId ? param : undefined;

  const purchaseSectionRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);

  const [theme, setTheme] = useState<Theme | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [selectedImage, setSelectedImage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [showFixedButtons, setShowFixedButtons] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [selectedAddOns, setSelectedAddOns] = useState<{ [key: number]: boolean }>({});
  const [isAddOnsExpanded, setIsAddOnsExpanded] = useState(false);
  const [featuresInView, setFeaturesInView] = useState(false);
  const [dynamicComponents, setDynamicComponents] = useState<any[]>([]);
  const [componentsLoading, setComponentsLoading] = useState(false);
  const [mainPreviewDevice, setMainPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [isDeviceChanging, setIsDeviceChanging] = useState(false);
  const deviceChangeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [imagesModalOpen, setImagesModalOpen] = useState(false);
  const [imagesModalList, setImagesModalList] = useState<string[]>([]);
  const [imagesModalTitle, setImagesModalTitle] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalImages, setModalImages] = useState<string[]>([]);
  const [modalTitle, setModalTitle] = useState('');

  const [isScrolling, setIsScrolling] = useState(false);
  const [currentScrollDevice, setCurrentScrollDevice] = useState<'desktop' | 'tablet' | 'mobile' | null>(null);
  const scrollIntervalRef = useRef<number | null>(null);
  const imageContainerRef = useRef<HTMLDivElement | null>(null);

  const startImageScroll = (device: 'desktop' | 'tablet' | 'mobile') => {
    setIsScrolling(true);
    setCurrentScrollDevice(device);
    const container = imageContainerRef.current;
    if (!container) return;
    container.scrollTop = 0;
    let scrollSpeed = 4;
    scrollIntervalRef.current = window.setInterval(() => {
      if (container) {
        container.scrollTop += scrollSpeed;
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
      window.clearInterval(scrollIntervalRef.current);
      scrollIntervalRef.current = null;
    }
    if (imageContainerRef.current) {
      imageContainerRef.current.scrollTop = 0;
    }
  };

  const handleDeviceChange = useCallback((device: 'desktop' | 'tablet' | 'mobile') => {
    if (deviceChangeTimeoutRef.current) {
      clearTimeout(deviceChangeTimeoutRef.current);
    }
    setIsDeviceChanging(true);
    deviceChangeTimeoutRef.current = setTimeout(() => {
      setMainPreviewDevice(device);
      setIsDeviceChanging(false);
      if (isScrolling) {
        stopImageScroll();
      }
    }, 50);
  }, [isScrolling]);

  useEffect(() => {
    return () => {
      stopImageScroll();
      if (deviceChangeTimeoutRef.current) {
        clearTimeout(deviceChangeTimeoutRef.current);
      }
    };
  }, []);

  const FAQCard: React.FC<{ faq: { question: string; answer: string }; index: number }> = ({ faq, index }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
      <div className="bg-gradient-to-r from-[#1a1a1a]/80 to-[#2a2a2a]/60 rounded-xl border border-[#18b5d8]/20 overflow-hidden transition-all duration-300 hover:border-[#18b5d8]/40 hover:shadow-lg hover:shadow-[#18b5d8]/10">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full p-4 sm:p-6 text-right flex items-center justify-between group transition-all duration-200 hover:bg-[#18b5d8]/5"
        >
          <div className="flex items-start gap-3 sm:gap-4 flex-1">
            <div className="bg-gradient-to-r from-[#18b5d8] to-[#16a8cc] rounded-full w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center text-white font-bold text-sm sm:text-base flex-shrink-0 mt-1">
              {index + 1}
            </div>
            <h4 className="font-semibold text-white text-sm sm:text-base lg:text-lg text-right leading-relaxed group-hover:text-[#18b5d8] transition-colors duration-200">
              {faq.question}
            </h4>
          </div>
          <div className="flex-shrink-0 mr-3 sm:mr-4">
            {isOpen ? (
              <ChevronUp className="w-5 h-5 sm:w-6 sm:h-6 text-[#18b5d8] transition-transform duration-200" />
            ) : (
              <ChevronDown className="w-5 h-5 sm:w-6 sm:h-6 text-[#7a7a7a] group-hover:text-[#18b5d8] transition-colors duration-200" />
            )}
          </div>
        </button>
        <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
          <div className="px-4 sm:px-6 pb-4 sm:pb-6">
            <div className="bg-[#0f0f0f]/50 rounded-lg p-4 sm:p-5 border-r-4 border-[#18b5d8] mr-11 sm:mr-14">
              <p className="text-[#e0e0e0] text-sm sm:text-base leading-relaxed whitespace-pre-wrap">
                {faq.answer}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const DynamicComponentCard: React.FC<{ component: any; index: number; onShowImages: (comp: any) => void }> = ({ component, index, onShowImages }) => {
    const [currentDevice, setCurrentDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
    const deviceStyles = {
      desktop: 'w-full',
      tablet: 'max-w-3xl mx-auto',
      mobile: 'max-w-sm mx-auto'
    };
    return (
      <div className="space-y-4">
        <div className={`transition-all duration-500 scale-90 sm:scale-95 ${deviceStyles[currentDevice]}`}>
          <div className="group relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-[#18b5d5]/5 via-transparent to-[#18b5d5]/5 rounded-xl sm:rounded-3xl opacity-0 group-hover:opacity-100 transition-all duration-700 blur-xl"></div>
            <div className="relative bg-gradient-to-br from-[#292929]/60 via-[#1a1a1a]/80 to-[#292929]/60 rounded-xl sm:rounded-3xl border border-[#18b5d5]/20 group-hover:border-[#18b5d5]/40 transition-all duration-500 overflow-hidden group-hover:shadow-2xl group-hover:shadow-[#18b5d5]/10">
              <div className={`flex ${currentDevice === 'mobile' ? 'flex-col' : 'flex-col xl:flex-row'}`}>
                <div className={`${currentDevice === 'mobile' ? 'w-full' : 'w-full xl:w-40'} flex-shrink-0 relative`}>
                  <div className="relative overflow-hidden rounded-t-xl sm:rounded-t-3xl xl:rounded-l-3xl xl:rounded-tr-none bg-white">
                    <div className="relative h-32 sm:h-40 lg:h-48">
                      <div className="absolute top-0 left-0 w-16 h-16 bg-[#fec72d] transform -rotate-0 origin-top-left z-10">
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Star className="w-6 h-6 text-gray-600" fill="currentColor" />
                        </div>
                        <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#d4a828]"></div>
                        <div className="absolute top-0 right-0 h-full w-0.5 bg-[#d4a828]"></div>
                      </div>
                      {component.backgroundImage ? (
                        <img
                          src={getSafeImageUrl(component.backgroundImage)}
                          alt={component.title}
                          className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-700"
                          onError={handleImageError}
                          loading="lazy"
                        />
                      ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 gap-4">
                          {component.icon && (() => {
                            const IconComponent = getIconComponent(component.icon);
                            return <IconComponent className="w-10 h-10 sm:w-12 sm:h-12 text-gray-600" />;
                          })()}
                          <p className="text-gray-800 text-sm sm:text-base font-semibold text-center">
                            {component.overlayText || component.title}
                          </p>
                        </div>
                      )}
                      <div className="absolute top-4 right-4 bg-gradient-to-r from-[#18b5d5]/90 to-[#18b5d5]/70 backdrop-blur-sm rounded-full px-3 py-1.5 border border-[#18b5d5]/30 z-20">
                        <span className="text-white text-xs font-bold">#{component.orderNumber}</span>
                      </div>
                      <div className="absolute bottom-4 left-4 w-3 h-3 bg-[#18b5d5] rounded-full animate-pulse"></div>
                    </div>
                  </div>
                </div>
                <div className={`flex-1 ${currentDevice === 'mobile' ? 'p-3' : 'p-3 sm:p-4 lg:p-6'} flex flex-col justify-center`}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="bg-gradient-to-r from-[#18b5d5]/20 to-[#18b5d5]/10 px-4 py-2 rounded-full border border-[#18b5d5]/30">
                      <span className="text-[#18b5d5] text-sm font-semibold">{component.category}</span>
                    </div>
                    <div className="h-px flex-1 bg-gradient-to-r from-[#18b5d5]/30 to-transparent"></div>
                    {Array.isArray(component.galleryImages) && component.galleryImages.length > 0 && (
                      <button
                        onClick={() => onShowImages(component)}
                        type="button"
                        className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-[#18b5d5]/20 to-[#18b5d5]/10 border border-[#18b5d5]/30 text-[#18b5d5] text-sm font-semibold group transition-all duration-300 hover:shadow-lg hover:shadow-[#18b5d5]/25 hover:scale-105 border border-[#18b5d5]/30"
                      >
                        <FaImage className="w-4 h-4" />
                        <span>عرض الصور ({component.galleryImages.length})</span>
                      </button>
                    )}
                  </div>
                  <h3 className={`${currentDevice === 'mobile' ? 'text-sm' : 'text-base sm:text-lg lg:text-xl'} font-black text-white mb-2 leading-tight group-hover:text-[#18b5d5] transition-colors duration-300`}>
                    {component.title}
                  </h3>
                  <p className={`text-[#a1a1a1] ${currentDevice === 'mobile' ? 'text-xs' : 'text-xs sm:text-sm'} leading-relaxed mb-3`}>
                    {component.description}
                  </p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {component.features && component.features.map((feature: string, idx: number) => (
                      <span 
                        key={idx}
                        className="bg-[#18b5d5]/10 text-[#18b5d5] px-3 py-1 rounded-full text-xs font-medium border border-[#18b5d5]/20"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#18b5d5]/50 to-transparent transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const images = [theme1, theme2, theme3, theme4];
  const [validCarouselImages, setValidCarouselImages] = useState<string[]>(images);

  // تنظيف الكاش عند تحميل المكون وإعادة محاولة تحميل الصور
  useEffect(() => {
    // مسح الكاش القديم عند تحميل المكون
    failedImagesCache.clear();
    setValidCarouselImages(images);
    
    // Debug: طباعة معلومات عن الصور
    console.log('Theme images loaded:', images.map(img => ({
      src: img,
      isValid: !isImageFailed(img)
    })));
  }, []);

  useEffect(() => {
    const handleScroll = () => setShowFixedButtons(window.scrollY > 300);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!isAutoPlaying) return;
    if (validCarouselImages.length === 0) return;
    const id = setInterval(() => {
      setCurrentImageIndex(prev => (prev + 1) % validCarouselImages.length);
    }, 4000);
    return () => clearInterval(id);
  }, [isAutoPlaying, validCarouselImages.length]);

  const { data: activeCardsResp, isLoading: cardsLoading } = useApiQuery<any>({ endpoint: 'theme-card?isActive=true', queryKey: ['theme-cards-active'] });

  useEffect(() => {
    if (!activeCardsResp) return;
    const list = Array.isArray(activeCardsResp) ? activeCardsResp : (activeCardsResp?.data || []);
    const validatedList = list.map((component: any) => {
      const validGalleryImages = Array.isArray(component.galleryImages)
        ? component.galleryImages.filter((img: string) => {
            if (!img) return false;
            const trimmed = String(img).trim();
            if (!trimmed) return false;
            return true;
          })
        : [];
      return {
        ...component,
        galleryImages: validGalleryImages,
        backgroundImage: component.backgroundImage && component.backgroundImage.trim() !== '' 
          ? component.backgroundImage 
          : null
      };
    });
    setDynamicComponents(validatedList);
    setComponentsLoading(false);
  }, [activeCardsResp]);

const nextImage = () => {
  setIsAutoPlaying(false);
  setCurrentImageIndex(prev => {
    const nextIndex = (prev + 1) % validCarouselImages.length;
    // تشغيل حركة الانتقال السلس
    gsap.to({}, {
      duration: 0.5,
      onComplete: () => {
        setTimeout(() => {
          setIsAutoPlaying(true);
        }, 3500);
      }
    });
    return nextIndex;
  });
};

const prevImage = () => {
  setIsAutoPlaying(false);
  setCurrentImageIndex(prev => {
    const prevIndex = (prev - 1 + validCarouselImages.length) % validCarouselImages.length;
    gsap.to({}, {
      duration: 0.5,
      onComplete: () => {
        setTimeout(() => {
          setIsAutoPlaying(true);
        }, 3500);
      }
    });
    return prevIndex;
  });
};

const goToImage = (i: number) => {
  if (i === currentImageIndex) return;
  setIsAutoPlaying(false);
  setCurrentImageIndex(i);
  gsap.to({}, {
    duration: 0.5,
    onComplete: () => {
      setTimeout(() => {
        setIsAutoPlaying(true);
      }, 3500);
    }
  });
};

  const { data: themeResp, isLoading: themeLoading } = useApiQuery<any>({ endpoint: themeId ? API_ENDPOINTS.PRODUCT_BY_ID(themeId) : '', queryKey: ['theme', themeId], enabled: !!themeId });
  const { data: categoryResp, isLoading: categoryLoading } = useApiQuery<any>({ endpoint: themeResp?.categoryId ? API_ENDPOINTS.CATEGORY_BY_ID(themeResp.categoryId) : '', queryKey: ['category', themeResp?.categoryId], enabled: !!themeResp?.categoryId });

  useEffect(() => {
    if (!themeResp) return;
    const data = themeResp?.data || themeResp;
    if (!data?.id) {
      setError('لم يتم العثور على الثيم');
      setLoading(false);
      return;
    }
    setTheme(data);
    setSelectedImage(data.mainImage);
    setLoading(false);
  }, [themeResp]);

  useEffect(() => {
    if (!categoryResp) return;
    const cat = categoryResp?.data || categoryResp;
    setCategory(cat);
  }, [categoryResp]);

  useEffect(() => {
    gsap.utils.toArray('.animate-section').forEach((el: any) => {
      gsap.from(el, {
        opacity: 0,
        y: 50,
        duration: 1,
        scrollTrigger: { trigger: el, start: 'top 80%', toggleActions: 'play none none reverse' }
      });
    });
    const u = localStorage.getItem('user');
    if (u) setUser(JSON.parse(u));
  }, [t]);

  useEffect(() => {
    if (!featuresRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setFeaturesInView(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.2 }
    );
    observer.observe(featuresRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!featuresInView) setFeaturesInView(true);
    }, 2500);
    return () => clearTimeout(timer);
  }, [featuresInView]);

  const handleLoginSuccess = (u: any) => {
    setUser(u);
    localStorage.setItem('user', JSON.stringify(u));
    setIsAuthModalOpen(false);
    try {
      window.dispatchEvent(new CustomEvent('userUpdated', { detail: u }));
    } catch {}
    smartToast.frontend.success(t('auth.messages.loginSuccess'));
  };

  const increaseQuantity = () => setQuantity(p => p + 1);
  const decreaseQuantity = () => setQuantity(p => Math.max(1, p - 1));
  const toggleAddOn = (i: number) => setSelectedAddOns(p => ({ ...p, [i]: !p[i] }));
  const calculateTotalPrice = () => {
    if (!theme) return 0;
    let total = theme.price * quantity;
    theme.addOns?.forEach((a, i) => selectedAddOns[i] && (total += a.price * quantity));
    return total;
  };
  const getSelectedAddOnsData = () => theme?.addOns?.filter((_, i) => selectedAddOns[i]) ?? [];

  if (loading) return <LoadingSpinner message={t('home.themes.loading')} />;
  if (error || !theme) {
    return (
      <div className="min-h-screen bg-[#292929] flex items-center justify-center px-4" dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}>
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">{t('home.themes.error_loading')}</h2>
          <p className="text-[#7a7a7a] mb-6">{error || t('home.themes.not_found')}</p>
          <button
            onClick={() => navigate('/')}
            className="bg-gradient-to-r from-[#18b5d5] to-[#16a8cc] hover:from-[#16a3c0] hover:to-[#1490b0] text-white px-6 py-3 rounded-lg transition-all duration-300 transform hover:scale-105 font-medium hover:shadow-lg hover:shadow-[#18b5d5]/25 border border-[#18b5d5]/30"
          >
            {t('home.themes.back_to_home')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <section className="min-h-screen bg-[#292929] relative overflow-hidden" dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Animated Background Pattern */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-[#292929] via-[#4a4a4a] to-[#2a2a2a] opacity-90" />
        <div className="absolute inset-0 opacity-20">
          <div className="absolute font-mono text-base text-[#7a7a7a] animate-pulse" style={{ top: '5%', left: '5%' }}>
            &lt;div className=&quot;hero&quot;&gt;
          </div>
          <div className="absolute font-mono text-base text-[#7a7a7a] animate-pulse" style={{ top: '15%', right: '10%', animationDelay: '500ms' }}>
            function analytics()
          </div>
          <div className="absolute font-mono text-base text-[#7a7a7a] animate-pulse" style={{ bottom: '20%', left: '15%', animationDelay: '1000ms' }}>
            const [data, setData] =
          </div>
          <div className="absolute font-mono text-base text-[#7a7a7a] animate-pulse" style={{ bottom: '10%', right: '5%', animationDelay: '1500ms' }}>
            SEO.optimize();
          </div>
          <div className="absolute font-mono text-base text-[#7a7a7a] animate-pulse" style={{ top: '25%', left: '50%', animationDelay: '2000ms' }}>
            API.fetch(&#39;/products&#39;)
          </div>
          <div className="absolute font-mono text-base text-[#7a7a7a] animate-pulse" style={{ top: '35%', right: '20%', animationDelay: '2500ms' }}>
            useState(&#123; loading: false &#125;);
          </div>
          <div className="absolute font-mono text-base text-[#7a7a7a] animate-pulse" style={{ bottom: '30%', left: '25%', animationDelay: '3000ms' }}>
            fetchData().then(res =&gt;
          </div>
          <div className="absolute font-mono text-base text-[#7a7a7a] animate-pulse" style={{ top: '50%', left: '30%', animationDelay: '3500ms' }}>
            renderUI(component);
          </div>
          <div className="absolute font-mono text-base text-[#7a7a7a] animate-pulse" style={{ bottom: '15%', right: '15%', animationDelay: '4000ms' }}>
            &lt;RouterProvider /&gt;
          </div>
          <div className="absolute font-mono text-base text-[#7a7a7a] animate-pulse" style={{ top: '60%', left: '20%', animationDelay: '4500ms' }}>
            const query = useQuery();
          </div>
          <div className="absolute font-mono text-base text-[#7a7a7a] animate-pulse" style={{ top: '10%', left: '70%', animationDelay: '5000ms' }}>
            useEffect(() =&gt;
          </div>
          <div className="absolute font-mono text-base text-[#7a7a7a] animate-pulse" style={{ bottom: '25%', right: '25%', animationDelay: '5500ms' }}>
            async function init()
          </div>
          <div className="absolute font-mono text-base text-[#7a7a7a] animate-pulse" style={{ top: '40%', left: '40%', animationDelay: '6000ms' }}>
            setTimeout(() =&gt;
          </div>
          <div className="absolute font-mono text-base text-[#7a7a7a] animate-pulse" style={{ bottom: '35%', right: '30%', animationDelay: '6500ms' }}>
            &lt;Suspense fallback=&quot;loading&quot;&gt;
          </div>
          <div className="absolute font-mono text-base text-[#7a7a7a] animate-pulse" style={{ top: '70%', left: '10%', animationDelay: '7000ms' }}>
            export default App;
          </div>
        </div>
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#4a4a4a]/40 to-transparent animate-pulse"></div>
          <div className="absolute top-2/3 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#2a2a2a]/30 to-transparent animate-pulse delay-1000"></div>
          <div className="absolute left-1/4 top-0 w-px h-full bg-gradient-to-b from-transparent via-[#4a4a4a]/30 to-transparent animate-pulse delay-500"></div>
          <div className="absolute right-1/3 top-0 w-px h-full bg-gradient-to-b from-transparent via-[#2a2a2a]/35 to-transparent animate-pulse delay-1500"></div>
        </div>
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-2 h-2 bg-[#4a4a4a]/70 rounded-full animate-ping"></div>
          <div className="absolute top-40 right-32 w-1 h-1 bg-[#2a2a2a]/80 rounded-full animate-ping delay-700"></div>
          <div className="absolute bottom-32 left-40 w-1.5 h-1.5 bg-[#4a4a4a]/60 rounded-full animate-ping delay-1200"></div>
          <div className="absolute bottom-60 right-20 w-1 h-1 bg-[#2a2a2a]/70 rounded-full animate-ping delay-2000"></div>
          <div className="absolute top-1/2 left-1/3 w-1 h-1 bg-[#4a4a4a]/90 rounded-full animate-ping delay-300"></div>
          <div className="absolute top-80 right-1/4 w-1.5 h-1.5 bg-[#2a2a2a]/50 rounded-full animate-ping delay-1800"></div>
        </div>
        <div className="absolute inset-0 opacity-15">
          <div className="absolute top-0 left-10 text-[#7a7a7a] font-mono text-base leading-6 animate-pulse">
            1<br />0<br />1<br />1<br />0<br />1<br />0<br />1<br />1<br />0
          </div>
          <div className="absolute top-0 left-32 text-[#7a7a7a] font-mono text-base leading-6 animate-pulse delay-500">
            0<br />1<br />0<br />1<br />1<br />0<br />1<br />0<br />1<br />1
          </div>
          <div className="absolute top-0 right-20 text-[#7a7a7a] font-mono text-base leading-6 animate-pulse delay-1000">
            1<br />1<br />0<br />1<br />0<br />1<br />1<br />0<br />1<br />0
          </div>
          <div className="absolute top-0 right-40 text-[#7a7a7a] font-mono text-base leading-6 animate-pulse delay-1500">
            0<br />1<br />1<br />0<br />1<br />0<br />1<br />1<br />0<br />1
          </div>
        </div>
        <div className="absolute inset-0 opacity-35">
          <div className="absolute text-[#18b5d8]/50 text-3xl animate-[float_7s_ease-in-out_infinite]" style={{ top: '5%', left: '5%' }}>
            <span role="img" aria-label="chart">📊</span>
          </div>
          <div className="absolute text-[#ffffff]/45 text-3xl animate-[float_7s_ease-in-out_infinite]" style={{ top: '15%', right: '10%', animationDelay: '600ms' }}>
            <span role="img" aria-label="trending">📈</span>
          </div>
          <div className="absolute text-[#ffffff]/40 text-2xl animate-[glow_3.5s_ease-in-out_infinite]" style={{ top: '30%', right: '20%', animationDelay: '1200ms' }}>
            <span role="img" aria-label="bulb">💡</span>
          </div>
          <div className="absolute text-[#18b5d8]/50 text-2xl animate-[float_7s_ease-in-out_infinite]" style={{ bottom: '25%', right: '15%', animationDelay: '1800ms' }}>
            <span role="img" aria-label="target">🎯</span>
          </div>
          <div className="absolute text-[#7a7a7a]/45 text-3xl animate-[glow_3.5s_ease-in-out_infinite]" style={{ top: '25%', left: '20%', animationDelay: '2400ms' }}>
            <span role="img" aria-label="laptop">💻</span>
          </div>
          <div className="absolute text-[#7a7a7a]/50 text-4xl animate-[float_7s_ease-in-out_infinite]" style={{ bottom: '35%', left: '25%', animationDelay: '3000ms' }}>
            <span role="img" aria-label="rocket">🚀</span>
          </div>
          <div className="absolute text-[#7a7a7a]/40 text-2xl animate-[float_7s_ease-in-out_infinite]" style={{ top: '55%', right: '25%', animationDelay: '3600ms' }}>
            <span role="img" aria-label="search">🔍</span>
          </div>
          <div className="absolute text-[#7a7a7a]/45 text-3xl animate-[glow_3.5s_ease-in-out_infinite]" style={{ top: '10%', left: '60%', animationDelay: '4200ms' }}>
            <span role="img" aria-label="gear">⚙️</span>
          </div>
          <div className="absolute text-[#7a7a7a]/50 text-2xl animate-[float_7s_ease-in-out_infinite]" style={{ bottom: '15%', right: '30%', animationDelay: '4800ms' }}>
            <span role="img" aria-label="phone">📱</span>
          </div>
          <div className="absolute text-[#7a7a7a]/45 text-3xl animate-[float_7s_ease-in-out_infinite]" style={{ top: '65%', left: '15%', animationDelay: '5400ms' }}>
            <span role="img" aria-label="globe">🌐</span>
          </div>
        </div>
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-[#4a4a4a]/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/3 right-1/3 w-40 h-40 bg-[#4a4a4a]/8 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2000ms' }}></div>
          <div className="absolute top-2/3 left-2/3 w-28 h-28 bg-[#4a4a4a]/12 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1000ms' }}></div>
        </div>
        <div className="absolute inset-0 opacity-15 animate-pulse"
          style={{
            backgroundImage: `linear-gradient(rgba(74, 74, 74, 0.3) 1px, transparent 1px),
            linear-gradient(90deg, rgba(74, 74, 74, 0.3) 1px, transparent 1px)`,
            backgroundSize: '40px 40px'
          }}>
        </div>
      </div>

      <style>
        {`
          @keyframes float {
            0%, 100% {
              transform: translateY(0) rotate(0deg) scale(1);
            }
            50% {
              transform: translateY(-15px) rotate(5deg) scale(1.1);
            }
          }
          @keyframes glow {
            0%, 100% {
              filter: drop-shadow(0 0 5px rgba(122, 122, 122, 0.3));
              transform: scale(1);
            }
            50% {
              filter: drop-shadow(0 0 10px rgba(122, 122, 122, 0.7));
              transform: scale(1.05);
            }
          }
          @keyframes parallax {
            0% { transform: translateY(0); }
            100% { transform: translateY(-50px); }
          }
          .parallax-bg {
            animation: parallax 10s linear infinite alternate;
          }
          .micro-hover:hover {
            transform: scale(1.05) rotate(2deg);
            transition: transform 0.3s ease-in-out;
          }
          .iframe-overlay {
            pointer-events: none;
            will-change: transform;
            backface-visibility: hidden;
          }
          div::-webkit-scrollbar { display: none; }
        `}
      </style>

      <style>
  {`
    .perspective-1000 {
      perspective: 1000px;
    }
    .carousel-slide-enter {
      transform: translateX(100%);
      opacity: 0.2;
    }
    .carousel-slide-enter-active {
      transform: translateX(0);
      opacity: 1;
      transition: all 800ms cubic-bezier(0.23, 1, 0.32, 1);
    }
    .carousel-slide-exit {
      transform: translateX(0);
      opacity: 1;
    }
    .carousel-slide-exit-active {
      transform: translateX(-100%);
      opacity: 0.2;
      transition: all 800ms cubic-bezier(0.23, 1, 0.32, 1);
    }
    .smooth-shadow {
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
      transition: box-shadow 0.5s ease;
    }
    .smooth-shadow:hover {
      box-shadow: 0 25px 60px rgba(24, 181, 216, 0.3);
    }
    @keyframes fadeInSlide {
      from {
        opacity: 0.5;
        transform: translateX(100%) scale(0.95);
      }
      to {
        opacity: 1;
        transform: translateX(0) scale(1);
      }
    }
    .fade-in-slide {
      animation: fadeInSlide 0.8s cubic-bezier(0.23, 1, 0.32, 1) forwards;
    }
    .fade-out-slide {
      animation: fadeInSlide 0.8s cubic-bezier(0.23, 1, 0.32, 1) reverse forwards;
    }
  `}
</style>

      <div className="relative max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 lg:py-16 mt-[60px] sm:mt-[80px]">
        <div className="flex justify-center my-3 sm:my-6">
          <img src={angel} alt="angel theme preview" className="w-24 sm:w-32 lg:w-40 h-auto" />
        </div>
        <h2 className="text-xl sm:text-3xl lg:text-4xl font-bold text-white mb-4 sm:mb-8 text-center px-2">
          {t('home.themes.number_one')}
        </h2>

        {/* Hero Section with Enhanced Carousel */}
        <div className="relative z-10 w-full px-2 sm:px-4 py-6 sm:py-12 lg:py-20">
          <div className="max-w-7xl mx-auto">
            <div className="w-full mb-6 sm:mb-12 relative group">
              <div className="relative overflow-hidden rounded-xl sm:rounded-2xl lg:rounded-3xl shadow-2xl bg-gradient-to-br from-gray-800 via-gray-900 to-black border border-gray-700/50">
               <div className="relative h-[250px] sm:h-[400px] lg:h-[700px] overflow-hidden perspective-1000">
  {validCarouselImages.map((image, index) => {
    const isCurrent = index === currentImageIndex;
    const isNext = index === ((currentImageIndex + 1) % validCarouselImages.length);
    const isPrevious = index === ((currentImageIndex - 1 + validCarouselImages.length) % validCarouselImages.length);
    
    // حساب z-index لترتيب الصور بشكل صحيح
    let zIndex = 10;
    if (isCurrent) zIndex = 30;
    else if (isNext) zIndex = 20;
    else if (isPrevious) zIndex = 15;
    
    return (
      <div
        key={index}
        className={`absolute inset-0 transition-all duration-1000 ease-in-out transform-gpu will-change-transform ${
          isCurrent 
            ? 'opacity-100 translate-x-0 z-[30]'
            : isNext
              ? 'opacity-90 translate-x-full z-[20]'
              : isPrevious
                ? 'opacity-80 -translate-x-full z-[15]'
                : 'opacity-40 translate-x-full z-10'
        }`}
        style={{ zIndex }}
      >
        <img
          src={image}
          alt={`Malak Theme ${index + 1}`}
          className="w-full h-full object-cover transition-transform duration-700"
          onError={(e) => {
            const target = e.currentTarget;
            console.error(`Failed to load carousel image: ${image}`);
            if (!target.dataset.retryAttempted) {
              target.dataset.retryAttempted = 'true';
              const retryUrl = image + '?retry=' + Date.now();
              console.log(`Retrying image with: ${retryUrl}`);
              target.src = retryUrl;
              setTimeout(() => {
                if (target.src.includes('?retry=')) {
                  console.log(`Fallback to placeholder for: ${image}`);
                  target.src = fallbackImg;
                }
              }, 2000);
            } else {
              console.log(`Using fallback for: ${image}`);
              target.src = fallbackImg;
            }
          }}
          onLoad={(e) => {
            const target = e.currentTarget;
            target.style.opacity = '1';
          }}
          style={{ 
            opacity: 0,
            transform: isCurrent ? 'translateZ(50px)' : isNext ? 'translateZ(30px)' : 'translateZ(0)',
            filter: isCurrent ? 'brightness(1.1)' : 'brightness(0.95)',
          }}
        />
        {/* الطبقات التأثيرية للعمق */}
        <div className={`absolute inset-0 bg-gradient-to-t ${isCurrent ? 'from-black/40' : 'from-black/30'} via-transparent to-black/10 transition-opacity duration-700`}></div>
        <div className="absolute inset-0 bg-gradient-to-r from-[#18b5d8]/5 via-transparent to-purple-500/5"></div>
      </div>
    );
  })}
</div>
                <button
                  onClick={prevImage}
                  className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 bg-black/60 backdrop-blur-sm hover:bg-[#18b5d8]/80 text-white p-2 sm:p-4 rounded-full transition-all duration-300 opacity-0 group-hover:opacity-100 hover:scale-110 shadow-lg z-10"
                >
                  <svg className="w-4 h-4 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 bg-black/60 backdrop-blur-sm hover:bg-[#18b5d8]/80 text-white p-2 sm:p-4 rounded-full transition-all duration-300 opacity-0 group-hover:opacity-100 hover:scale-110 shadow-lg z-10"
                >
                  <svg className="w-4 h-4 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                <div className="absolute top-2 sm:top-6 right-2 sm:right-6 bg-black/70 backdrop-blur-sm text-white px-2 sm:px-4 py-1 sm:py-2 rounded-full text-xs sm:text-sm font-semibold border border-white/20">
                  <span className="text-[#18b5d8]">{currentImageIndex + 1}</span> / {validCarouselImages.length}
                </div>
                {isAutoPlaying && (
                  <div className="absolute top-2 sm:top-6 left-2 sm:left-6 bg-gradient-to-r from-green-500/90 to-emerald-500/90 backdrop-blur-sm text-white px-2 sm:px-3 py-1 sm:py-2 rounded-full text-xs font-semibold flex items-center gap-1 sm:gap-2 border border-white/20">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full animate-pulse"></div>
                    <span className="hidden sm:inline">{t('home.themes.autoplay_on')}</span>
                    <span className="sm:hidden">{t('home.themes.autoplay_short')}</span>
                  </div>
                )}
                <div className="absolute bottom-0 left-0 w-full h-1 bg-black/30">
                  <div
                    className="h-full bg-gradient-to-r from-[#18b5d8] to-purple-500 transition-all duration-300"
                    style={{ width: `${((currentImageIndex + 1) / validCarouselImages.length) * 100}%` }}
                  ></div>
                </div>
              </div>
           <div className="flex justify-center mt-4 sm:mt-8 gap-2 sm:gap-3">
  {validCarouselImages.map((_, index) => {
    const isActive = index === currentImageIndex;
    return (
      <button
        key={index}
        onClick={() => goToImage(index)}
        className={`relative transition-all duration-500 cursor-pointer ${isActive
          ? 'w-8 sm:w-10 h-2 sm:h-3 bg-gradient-to-r from-[#18b5d8] to-purple-500 rounded-full scale-110 shadow-lg'
          : 'w-3 sm:w-4 h-2 sm:h-3 bg-gray-700/50 hover:bg-gray-600 rounded-full'
        }`}
        aria-label={`الذهاب للصورة ${index + 1}`}
      >
        {isActive && (
          <div className="absolute inset-0 bg-gradient-to-r from-[#18b5d8] to-purple-500 rounded-full animate-pulse opacity-75"></div>
        )}
        <div className={`absolute inset-0 rounded-full transition-all duration-500 ${
          isActive ? 'bg-white/90 scale-75' : 'bg-white/40 scale-90 hover:scale-100'
        }`} />
      </button>
    );
  })}
</div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center px-2">
              <button
                onClick={() => window.open('https://salla.com/themes/1499917793', '_blank')}
                className="w-full sm:w-auto flex items-center justify-center gap-2 sm:gap-3 bg-gradient-to-r from-[#18b5d5] to-[#16a8cc] text-white px-4 sm:px-8 py-3 sm:py-4 rounded-lg sm:rounded-xl text-sm sm:text-lg font-semibold hover:from-[#16a8cc] hover:to-[#18b5d5] transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl group transition-all duration-300 hover:shadow-lg hover:shadow-[#18b5d5]/25 hover:scale-105 border border-[#18b5d5]/30"
              >
                <ShoppingCart className="w-4 h-4 sm:w-6 sm:h-6" />
                <span className="hidden sm:inline">{t('home.themes.View_Cart')}</span>
                <span className="sm:hidden">{t('home.themes.View_Cart')}</span>
              </button>
              <a
                href="https://drive.google.com/drive/folders/1TuMasEWd5kB6_DzDN9OVhj8afVS6w9zb"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto flex items-center justify-center gap-2 sm:gap-3 bg-gradient-to-r from-red-600 to-red-800 text-white px-4 sm:px-8 py-3 sm:py-4 rounded-lg sm:rounded-xl text-sm sm:text-lg font-semibold hover:from-red-700 hover:to-red-900 transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl group transition-all duration-300 hover:shadow-lg hover:shadow-[#18b5d5]/25 hover:scale-105 border border-[#18b5d5]/30"
              >
                <Play className="w-4 h-4 sm:w-6 sm:h-6" />
                <span className="hidden sm:inline">{t('home.themes.video_explanation')}</span>
                <span className="sm:hidden">{t('home.themes.video_explanation')}</span>
              </a>
              <a
                href="https://salla.sa/dev-etmlwprywtygjjcy"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto flex items-center justify-center gap-2 sm:gap-3 bg-green-700 text-white px-4 sm:px-8 py-3 sm:py-4 rounded-lg sm:rounded-xl text-sm sm:text-lg font-semibold hover:bg-green-800 transition-all duration-300 transform shadow-lg hover:shadow-xl hover:shadow-[#18b5d5]/25 hover:scale-105 border border-[#18b5d5]/30 group"
              >
                <Eye className="w-4 h-4 sm:w-6 sm:h-6" />
                <span className="hidden sm:inline">{t('home.themes.preview_theme')}</span>
                <span className="sm:hidden">{t('home.themes.preview_theme')}</span>
              </a>
            </div>
          </div>
        </div>

        {/* Device Preview Section */}
        <div className="mt-6 mb-6 animate-section flex justify-center px-2 sm:px-0 w-full">
          <div className="shadow-2xl p-2 sm:p-3 w-full max-w-[95vw] sm:max-w-[60vw] lg:max-w-[50vw]">
            <div className="flex justify-center items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3 bg-gradient-to-r from-[#18b5d8]/10 to-transparent px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg border border-[#18b5d8]/20 w-fit mx-auto">
              <span className="text-[#18b5d8] text-[10px] sm:text-xs font-medium">{t('home.themes.preview_label')}</span>
              <button
                onClick={() => handleDeviceChange('desktop')}
                disabled={isDeviceChanging}
                className={`p-0.5 sm:p-1 rounded-lg transition-all relative ${
                  mainPreviewDevice === 'desktop' 
                    ? 'bg-[#18b5d8] text-white shadow-lg' 
                    : 'bg-white/10 text-[#18b5d8] hover:bg-white/20'
                } ${isDeviceChanging ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Monitor className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                {isDeviceChanging && mainPreviewDevice === 'desktop' && (
                  <div className="absolute inset-0 bg-[#18b5d8]/50 rounded-lg flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  </div>
                )}
              </button>
              <button
                onClick={() => handleDeviceChange('tablet')}
                disabled={isDeviceChanging}
                className={`p-0.5 sm:p-1 rounded-lg transition-all relative ${
                  mainPreviewDevice === 'tablet' 
                    ? 'bg-[#18b5d8] text-white shadow-lg' 
                    : 'bg-white/10 text-[#18b5d8] hover:bg-white/20'
                } ${isDeviceChanging ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Tablet className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                {isDeviceChanging && mainPreviewDevice === 'tablet' && (
                  <div className="absolute inset-0 bg-[#18b5d8]/50 rounded-lg flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  </div>
                )}
              </button>
              <button
                onClick={() => handleDeviceChange('mobile')}
                disabled={isDeviceChanging}
                className={`p-0.5 sm:p-1 rounded-lg transition-all relative ${
                  mainPreviewDevice === 'mobile' 
                    ? 'bg-[#18b5d8] text-white shadow-lg' 
                    : 'bg-white/10 text-[#18b5d8] hover:bg-white/20'
                } ${isDeviceChanging ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Smartphone className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                {isDeviceChanging && mainPreviewDevice === 'mobile' && (
                  <div className="absolute inset-0 bg-[#18b5d8]/50 rounded-lg flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  </div>
                )}
              </button>
            </div>
            <div className="relative w-full mx-auto max-w-full flex justify-center">
              <div className="group relative overflow-hidden rounded-lg bg-gradient-to-br from-[#292929]/60 to-[#1a1a1a]/80 border border-[#18b5d8]/30">
                <div className="absolute top-1.5 sm:top-2 right-1.5 sm:right-2 bg-[#18b5d8]/90 backdrop-blur-sm px-1.5 sm:px-2 py-0.5 rounded-full text-white text-[10px] sm:text-xs font-semibold z-10 flex items-center gap-1">
                  {mainPreviewDevice === 'desktop' && <><Monitor className="w-2 h-2 sm:w-2.5 sm:h-2.5" /> <span className="hidden sm:inline">Desktop</span></>}
                  {mainPreviewDevice === 'tablet' && <><Tablet className="w-2 h-2 sm:w-2.5 sm:h-2.5" /> <span className="hidden sm:inline">Tablet</span></>}
                  {mainPreviewDevice === 'mobile' && <><Smartphone className="w-2 h-2 sm:w-2.5 sm:h-2.5" /> <span className="hidden sm:inline">Mobile</span></>}
                </div>
                {isScrolling && currentScrollDevice === mainPreviewDevice && (
                  <div className="absolute top-1.5 sm:top-2 left-1.5 sm:left-2 bg-green-500/90 backdrop-blur-sm px-1.5 sm:px-2 py-0.5 rounded-full text-white text-[10px] sm:text-xs font-semibold z-10 flex items-center gap-1">
                    <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                    <span>Scrolling</span>
                  </div>
                )}
                <div 
                  ref={imageContainerRef}
                  className={`bg-white/5 rounded-lg overflow-hidden transition-all duration-500 ${
                    mainPreviewDevice === 'desktop' 
                      ? 'w-full max-w-full h-[200px] sm:h-[254px] md:h-[308px] lg:h-[362px]' 
                      : mainPreviewDevice === 'tablet' 
                        ? 'w-full max-w-[90vw] sm:max-w-[380px] md:max-w-[420px] aspect-[3/4]' 
                        : 'w-full max-w-[90vw] sm:max-w-[250px] md:max-w-[280px] aspect-[9/20]'
                  } flex items-start justify-center mx-auto cursor-pointer relative overflow-y-auto`}
                  style={{
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none',
                  }}
                  onMouseEnter={() => startImageScroll(mainPreviewDevice)}
                  onMouseLeave={stopImageScroll}
                >
                  <img 
                    src={
                      mainPreviewDevice === 'desktop' ? theme5 :
                      mainPreviewDevice === 'tablet' ? theme6 :
                      theme7
                    }
                    alt={`${mainPreviewDevice} Preview`}
                    className={`w-full h-auto transition-transform duration-300 ${
                      mainPreviewDevice === 'desktop' 
                        ? 'object-contain object-top' 
                        : 'object-cover object-top'
                    }`}
                    style={{ minHeight: '100%', display: 'block' }}
                    onLoad={(e) => {
                      if (imageContainerRef.current) {
                        imageContainerRef.current.scrollTop = 0;
                      }
                    }}
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-[#18b5d8]/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none flex items-end justify-center pb-4">
                  <span className="text-white text-xs sm:text-sm font-medium bg-black/50 px-3 py-1 rounded-full">
                    Hover to scroll
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Why Choose Malak Theme Section */}
        <div className="mt-8 sm:mt-16 mb-12 sm:mb-20 relative animate-section">
          <div className="absolute inset-0 bg-gradient-to-br from-[#18b5d5]/5 via-transparent to-[#292929]/20 rounded-xl sm:rounded-3xl"></div>
          <div className="absolute top-0 left-0 w-16 sm:w-32 h-16 sm:h-32 bg-gradient-to-br from-[#18b5d5]/20 to-transparent rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 right-0 w-20 sm:w-40 h-20 sm:h-40 bg-gradient-to-tl from-[#18b5d5]/15 to-transparent rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="relative bg-gradient-to-br from-[#292929]/98 via-[#1a1a1a]/95 to-[#292929]/98 rounded-xl sm:rounded-3xl backdrop-blur-xl border border-[#18b5d5]/20 shadow-2xl p-4 sm:p-8 lg:p-12 overflow-hidden">
            <div className="absolute top-3 sm:top-6 right-3 sm:right-6 w-1.5 sm:w-2 h-1.5 sm:h-2 bg-[#18b5d5] rounded-full animate-ping"></div>
            <div className="absolute bottom-4 sm:bottom-8 left-4 sm:left-8 w-1 h-1 bg-[#18b5d5]/70 rounded-full animate-ping delay-500"></div>
            <div className="text-center mb-8 sm:mb-16">
              <div className="inline-flex items-center gap-2 sm:gap-3 bg-gradient-to-r from-[#18b5d5]/20 to-[#18b5d5]/10 px-3 sm:px-6 py-2 sm:py-3 rounded-full border border-[#18b5d5]/30 mb-4 sm:mb-6">
                <div className="w-1.5 sm:w-2 h-1.5 sm:h-2 bg-[#18b5d5] rounded-full animate-pulse"></div>
                <span className="text-[#18b5d5] font-medium text-xs sm:text-sm">{t('home.themes.discover_features')}</span>
              </div>
              <h2 className="text-2xl sm:text-4xl lg:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-[#18b5d5] to-white mb-4 sm:mb-6 leading-tight px-2">
                {t('home.themes.why_choose_malak')}
              </h2>
              <p className="text-sm sm:text-xl text-[#a1a1a1] max-w-3xl mx-auto leading-relaxed px-4">
                {t('home.themes.optimal_solution')}
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8">
              <div className="text-center group">
                <div className="bg-gradient-to-br from-[#292929]/30 to-[#292929]/20 border border-[#ffffff]/30 rounded-xl sm:rounded-2xl p-4 sm:p-8 hover:from-[#292929]/40 hover:to-[#292929]/30 transition-all duration-300">
                  <Smartphone className="w-6 sm:w-10 h-6 sm:h-10 mx-auto mb-2 sm:mb-4 text-[#18b5d5]" />
                  <h3 className="text-sm sm:text-lg font-semibold text-white mb-1 sm:mb-2">{t('home.themes.responsive_design')}</h3>
                  <p className="text-[#a1a1a1] text-xs sm:text-sm">{t('home.themes.responsive_description')}</p>
                </div>
              </div>
              <div className="text-center group">
                <div className="bg-gradient-to-br from-[#18b5d5]/10 to-[#18b5d5]/5 border border-[#18b5d5]/20 rounded-xl sm:rounded-2xl p-4 sm:p-8 hover:from-[#18b5d5]/15 hover:to-[#18b5d5]/10 transition-all duration-300">
                  <Languages className="w-6 sm:w-10 h-6 sm:h-10 mx-auto mb-2 sm:mb-4 text-[#18b5d5]" />
                  <h3 className="text-sm sm:text-lg font-semibold text-white mb-1 sm:mb-2">{t('home.themes.arabic_support')}</h3>
                  <p className="text-[#a1a1a1] text-xs sm:text-sm">{t('home.themes.arabic_description')}</p>
                </div>
              </div>
              <div className="text-center group">
                <div className="bg-gradient-to-br from-[#292929]/30 to-[#292929]/20 border border-[#ffffff]/30 rounded-xl sm:rounded-2xl p-4 sm:p-8 hover:from-[#292929]/40 hover:to-[#292929]/30 transition-all duration-300">
                  <Search className="w-6 sm:w-10 h-6 sm:h-10 mx-auto mb-2 sm:mb-4 text-[#18b5d5]" />
                  <h3 className="text-sm sm:text-lg font-semibold text-white mb-1 sm:mb-2">{t('home.themes.seo_optimization')}</h3>
                  <p className="text-[#a1a1a1] text-xs sm:text-sm">{t('home.themes.seo_description')}</p>
                </div>
              </div>
              <div className="text-center group">
                <div className="bg-gradient-to-br from-[#18b5d5]/10 to-[#18b5d5]/5 border border-[#18b5d5]/20 rounded-xl sm:rounded-2xl p-4 sm:p-8 hover:from-[#18b5d5]/15 hover:to-[#18b5d5]/10 transition-all duration-300">
                  <RefreshCcw className="w-6 sm:w-10 h-6 sm:h-10 mx-auto mb-2 sm:mb-4 text-[#18b5d5]" />
                  <h3 className="text-sm sm:text-lg font-semibold text-white mb-1 sm:mb-2">{t('home.themes.free_updates')}</h3>
                  <p className="text-[#a1a1a1] text-xs sm:text-sm">{t('home.themes.updates_description')}</p>
                </div>
              </div>
            </div>
            <div ref={featuresRef} className="mt-16 pt-12 border-t border-[#18b5d8]/20">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-8 max-w-5xl mx-auto">
                <FeatureCounter key="p1" icon={Palette} number="25+" label={t('home.themes.professional_elements')} shouldAnimate={featuresInView} delay={0} variant="primary" />
                <FeatureCounter key="p2" icon={Settings} number="250+" label={t('home.themes.features.advanced_customization.title')} shouldAnimate={featuresInView} delay={100} variant="secondary" />
                <FeatureCounter key="p3" icon={Headphones} number="24/7" label={t('home.themes.technical_support')} shouldAnimate={featuresInView} delay={200} variant="primary" />
                <FeatureCounter key="p4" icon={Store} number="4000+" label={t('home.themes.active_store')} shouldAnimate={featuresInView} delay={300} variant="secondary" />
              </div>
            </div>
          </div>
        </div>

        {/* Premium Components Showcase */}
        <div className="mt-12 sm:mt-20 mb-12 sm:mb-16 relative animate-section">
          <div className="absolute inset-0 bg-gradient-to-br from-[#18b5d5]/3 via-transparent to-[#292929]/10 rounded-xl sm:rounded-3xl"></div>
          <div className="absolute top-5 sm:top-10 right-5 sm:right-10 w-12 sm:w-24 h-12 sm:h-24 bg-gradient-to-br from-[#18b5d5]/15 to-transparent rounded-full blur-2xl animate-pulse"></div>
          <div className="absolute bottom-5 sm:bottom-10 left-5 sm:left-10 w-16 sm:w-32 h-16 sm:h-32 bg-gradient-to-tl from-[#18b5d5]/10 to-transparent rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="relative bg-gradient-to-br from-[#1a1a1a]/98 via-[#292929]/95 to-[#1a1a1a]/98 rounded-xl sm:rounded-3xl backdrop-blur-xl border border-[#18b5d5]/20 shadow-2xl overflow-hidden">
            <div className="absolute inset-0 opacity-5">
              <div className="absolute inset-0" style={{
                backgroundImage: `radial-gradient(circle at 1px 1px, #18b5d5 1px, transparent 0)`,
                backgroundSize: '20px 20px'
              }}></div>
            </div>
            <div className="relative p-4 sm:p-6 lg:p-12 pb-6 sm:pb-8">
              <div className="text-center mb-8 sm:mb-12">
                <div className="inline-flex items-center gap-2 sm:gap-3 bg-gradient-to-r from-[#18b5d5]/20 to-[#18b5d5]/10 px-3 sm:px-6 py-2 sm:py-3 rounded-full border border-[#18b5d5]/30 mb-4 sm:mb-6">
                  <div className="w-1.5 sm:w-2 h-1.5 sm:h-2 bg-[#18b5d5] rounded-full animate-pulse"></div>
                  <span className="text-[#18b5d5] font-medium text-xs sm:text-sm">{t('home.themes.features.advanced_elements.title')}</span>
                </div>
                <h2 className="text-xl sm:text-2xl lg:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-[#18b5d5] to-white mb-4 sm:mb-6 leading-tight px-4">
                  {t('home.themes.features.homepage_elements.title')}
                </h2>
                <p className="text-sm sm:text-lg lg:text-xl text-[#a1a1a1] max-w-4xl mx-auto leading-relaxed px-4">
                  {t('home.themes.features.professional_elements.desc')}
                </p>
              </div>
            </div>
            <div className="relative px-2 sm:px-4 lg:px-12 pb-8 sm:pb-12">
              {/* ✅ تعديل: عرض زوجين في الصف */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8">
                {componentsLoading ? (
                  <div className="col-span-2 flex justify-center items-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#18b5d5]"></div>
                  </div>
                ) : dynamicComponents.length > 0 ? (
                  dynamicComponents.map((component, index) => (
                    <DynamicComponentCard
                      key={component._id || index}
                      component={component}
                      index={index}
                      onShowImages={(comp) => {
                        setModalTitle(comp.title || t('home.themes.image_preview'));
                        setModalImages(comp.galleryImages || []);
                        setIsModalOpen(true);
                      }}
                    />
                  ))
                ) : (
                  <div className="col-span-2 text-center py-20">
                    <p className="text-[#a1a1a1] text-lg">لا توجد عناصر متاحة حالياً</p>
                  </div>
                )}
              </div>
              <div className="mt-8 sm:mt-16 text-center">
                <div className="bg-gradient-to-r from-[#18b5d5]/10 via-[#18b5d5]/5 to-[#18b5d5]/10 rounded-xl sm:rounded-2xl border border-[#18b5d5]/20 p-4 sm:p-8">
                  <h3 className="text-lg sm:text-2xl font-bold text-white mb-2 sm:mb-3">{t('home.themes.not_everything')}</h3>
                  <p className="text-[#a1a1a1] mb-4 sm:mb-6 text-sm sm:text-base">{t('home.themes.discover_more_features')}</p>
                  <div className="flex items-center justify-center gap-2 text-[#18b5d5]">
                    <span className="text-xs sm:text-sm font-medium">{t('home.themes.more_creativity_awaits')}</span>
                    <div className="w-1.5 sm:w-2 h-1.5 sm:h-2 bg-[#18b5d5] rounded-full animate-pulse"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section - Fixed Horizontal Bar */}
        <div className="fixed bottom-0 left-0 right-0 bg-[#292929] z-[9999] animate-section">
          <div ref={purchaseSectionRef} className="bg-[#292929] backdrop-blur-2xl border-t border-[#18b5d8]/30 shadow-2xl">
            <div className="max-w-7xl mx-auto px-2 sm:px-4 py-2 sm:py-3">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-4">
                <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0 w-full sm:w-auto">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 rounded-lg overflow-hidden border border-[#18b5d8]/20 flex-shrink-0">
                    <img 
                      src={getSafeImageUrl(theme.mainImage)}
                      alt={theme.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      onError={handleImageError}
                    />
                  </div>
                  <div className="flex flex-col flex-1 min-w-0">
                    <h3 className="text-xs sm:text-sm font-bold text-[#18b5d8] mb-1 truncate">{theme.name}</h3>
                    <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                      {theme.originalPrice && theme.originalPrice > theme.price ? (
                        <>
                          <PriceDisplay price={theme.price} className="text-sm sm:text-base font-bold text-[#18b5d8]" />
                          <PriceDisplay price={theme.originalPrice} className="text-xs text-gray-400 line-through" />
                          <span className="bg-red-500/20 text-red-600 px-1 sm:px-1.5 py-0.5 rounded-full text-[10px] sm:text-xs font-bold">
                            -{Math.round(((theme.originalPrice - theme.price) / theme.originalPrice) * 100)}%
                          </span>
                        </>
                      ) : (
                        <PriceDisplay price={theme.price} className="text-sm sm:text-base font-bold text-[#18b5d8]" />
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0 w-full sm:w-auto justify-center">
                  <button
                    onClick={() => window.open('https://salla.com/themes/1499917793', '_blank')}
                    className="flex items-center gap-1 sm:gap-2 bg-gradient-to-r from-[#041a20] to-[#051c20] text-white px-3 sm:px-6 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-bold hover:from-[#16a8cc] hover:to-[#18b5d8] transition-all duration-300 shadow-lg hover:shadow-xl group transition-all duration-300 hover:shadow-lg hover:shadow-[#18b5d5]/25 hover:scale-105 border border-[#18b5d5]/30"
                  >
                    <ShoppingCart className="w-3 h-3 sm:w-4 sm:h-4 group-hover/button:animate-bounce" />
                    <span className="hidden sm:inline">{t('home.themes.get_theme_now')}</span>
                    <span className="sm:hidden">{t('home.themes.buy')}</span>
                  </button>
                  <a
                    href="https://drive.google.com/drive/folders/1TuMasEWd5kB6_DzDN9OVhj8afVS6w9zb"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 sm:gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 sm:px-4 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-all duration-300 group hover:shadow-lg hover:shadow-[#18b5d5]/25 hover:scale-105 border border-[#18b5d5]/30"
                  >
                    <Play className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">{t('home.themes.video')}</span>
                  </a>
                  <a
                    href="https://salla.sa/dev-etmlwprywtygjjcy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 sm:gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 sm:px-4 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-all duration-300 group hover:shadow-lg hover:shadow-[#18b5d5]/25 hover:scale-105 border border-[#18b5d5]/30"
                  >
                    <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">{t('home.themes.preview')}</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="scale-90 sm:scale-95 lg:scale-100">
          <ThemeWorks />
        </div>

        {/* FAQ Section */}
        {theme?.faqs && theme.faqs.length > 0 && (
          <div className="mt-12 sm:mt-16 animate-section">
            <div className="relative">
              <div className="absolute inset-0 overflow-hidden rounded-3xl">
                <div className="absolute top-10 right-10 w-32 h-32 bg-gradient-to-br from-[#18b5d8]/10 to-transparent rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-10 left-10 w-40 h-40 bg-gradient-to-tl from-[#18b5d8]/8 to-transparent rounded-full blur-3xl animate-pulse delay-1000"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-gradient-to-r from-[#18b5d8]/5 to-transparent rounded-full blur-2xl animate-pulse delay-500"></div>
              </div>
              <div className="relative bg-gradient-to-br from-[#1a1a1a]/95 via-[#292929]/90 to-[#1a1a1a]/95 rounded-2xl sm:rounded-3xl backdrop-blur-xl border border-[#18b5d8]/20 shadow-2xl p-6 sm:p-8 lg:p-10">
                <div className="flex items-center gap-3 mb-6 sm:mb-8">
                  <div className="bg-gradient-to-r from-[#18b5d8] to-[#16a8cc] p-2 rounded-lg">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-white">
                    {t('home.themes.faq')}
                  </h2>
                </div>
                <p className="text-[#a1a1a1] text-sm sm:text-base max-w-2xl leading-relaxed mb-8">
                  {t('home.themes.features.faq_answers.desc', { themeName: theme.name })}
                </p>
                <div className="space-y-3 sm:space-y-4">
                  {theme.faqs.map((faq, index) => (
                    <FAQCard key={index} faq={faq} index={index} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          onLoginSuccess={handleLoginSuccess}
        />

        {/* ✅ Modal Slider */}
        <PreviewModal
          images={modalImages}
          title={modalTitle}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      </div>
    </section>
  );
};

export default ThemeDetail;
