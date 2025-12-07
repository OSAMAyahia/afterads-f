import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaInstagram, FaWhatsapp, FaTwitter, FaFacebookF, FaEnvelope, FaPhone, FaMapMarkerAlt, FaClock } from 'react-icons/fa';
import { ArrowUp, ExternalLink, Award, Users, Zap, Mail, Phone, MapPin } from 'lucide-react';
import { apiCall, API_ENDPOINTS } from '../../config/api';
import { useApiQuery } from '../../hooks/useApiQuery';
import { useTranslation } from 'react-i18next';
import logo from "../../assets/logo.webp";
import salla from "../../assets/sallalogo.webp";
import R from "../../assets/R.png";
import Heart from "../../assets/red-heart-element-png.webp";
import KSA from "../../assets/45266df85e3e2526fc96a3dd6adea56a.png";

interface StaticPage {
  _id: string;  // ✅ البيانات جاية بـ _id مش id
  title: string;
  slug: string;
  content: any;
  showInFooter?: boolean;
  isActive?: boolean;
  createdAt: string;
}
const GlobalFooter: React.FC = () => {
  const { t } = useTranslation();
  const [staticPages, setStaticPages] = useState<StaticPage[]>([]);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const location = useLocation();

const { data: pagesResp } = useApiQuery<any>({ 
  endpoint: API_ENDPOINTS.STATIC_PAGES, 
  queryKey: ['static-pages'],
  staleTime: Infinity, // البيانات تفضل في الكاش للأبد
  cacheTime: 1000 * 60 * 60 * 24 // تتمسح من الذاكرة بعد 24 ساعة
});  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  console.log('Footer static pages:', staticPages);

 useEffect(() => {
  if (!pagesResp) return;
  
  const arr = Array.isArray(pagesResp) ? pagesResp : pagesResp?.data || [];
  console.log("📄 [Footer] Raw data:", arr);
  
  // تحويل _id إلى id + فلترة البيانات النشطة فقط
  const activePages = arr
    .filter((p: any) => p?.isActive !== false) // ✅ عرض كل حاجة ما عدا اللي isActive: false
    .map((p: any) => ({
      ...p,
      id: p._id || p.id // تحويل _id إلى id
    }));
  
  console.log("✅ [Footer] Active pages:", activePages);
  setStaticPages(activePages);
}, [pagesResp]);
  const { data: navVisibilityResp } = useApiQuery<any>({ endpoint: API_ENDPOINTS.NAVIGATION_VISIBILITY, queryKey: ['navigation-visibility'], staleTime: Infinity });
  const navVisibility = React.useMemo(() => {
    const obj = Array.isArray(navVisibilityResp) ? navVisibilityResp[0] : (navVisibilityResp?.data ?? navVisibilityResp);
    const normalize = (m?: Record<string, boolean>) => {
      const r: Record<string, boolean> = {};
      if (!m) return r;
      Object.keys(m).forEach(k => { r[k] = (m as any)[k]; });
      return r;
    };
    return {
      navbar: normalize(obj?.navbar),
      footerImportant: normalize(obj?.footerImportant),
      footerQuick: normalize(obj?.footerQuick),
      footerStaticPages: normalize(obj?.footerStaticPages)
    };
  }, [navVisibilityResp]);
  const shouldShowLink = (section: keyof typeof navVisibility, key: string) => {
    const s = (navVisibility as any)[section] as Record<string, boolean>;
    if (s && Object.prototype.hasOwnProperty.call(s, key)) {
      return s[key] !== false;
    }
    try {
      const raw = localStorage.getItem('ui_navigation_visibility');
      const parsed = raw ? JSON.parse(raw) : {};
      const map = parsed[section] || {};
      if (Object.prototype.hasOwnProperty.call(map, key)) return map[key] !== false;
    } catch {}
    return true;
  };
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const importantLinks = [
    { to: "/about", label: t('footer.about_us') },
    { to: "/contact", label: t('footer.contact_us') },
    { to: "/privacy-policy", label: t('footer.privacy_policy') },
    { to: "/terms-and-conditions", label: t('footer.terms_conditions') },
  ];

  const quickLinks = [
    { name: t('footer.home'), to: "/" },
    { name: t('nav.documentation'), to: "/documentation" },
    { name: t('footer.blog'), to: "/blog" },
    { name: t('footer.about_us'), to: "/about" },
  ];

  return (
    <>
      <div className="bg-[#0f1012] border-b border-gray-800">
  <div className="w-full bg-[#0f1113] py-6">
  <div className="mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
    <div className="flex flex-col md:flex-row items-center gap-4 justify-center">
      <p className="text-[#18b5d5] text-sm font-medium text-center w-full md:w-auto mb-2 md:mb-0">
        {t('footer.stay_connected')}
      </p>

      <div className="flex w-full md:flex-1 max-w-xl lg:max-w-2xl gap-1.5">
        <input
          type="email"
          placeholder={t('footer.email_placeholder')}
          className="flex-1 px-4 py-2.5 rounded-lg bg-[#1a1c1e]/80 border border-[#18b5d5]/20 text-white placeholder-gray-500 focus:outline-none focus:border-[#18b5d5] focus:ring-1 focus:ring-[#18b5d5]/50 transition-all text-sm"
        />
        <button
          onClick={() => {}}
          className="px-5 py-2.5 bg-gradient-to-r from-[#18b5d5] to-[#16a8c4] text-white font-medium rounded-lg hover:shadow-[0_8px_24px_rgba(24,181,213,0.25)] transition-all text-sm whitespace-nowrap group transition-all duration-300 hover:shadow-lg hover:shadow-[#18b5d5]/25 hover:scale-105 border border-[#18b5d5]/30"
        >
          {t('footer.subscribe_now')}
        </button>
      </div>
    </div>
  </div>
</div>

      </div>
      {/* Main Footer */}
      <footer className="relative bg-[#121315] overflow-hidden">
        {/* Decorative dots */}
        <div className="absolute inset-0 opacity-30">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="absolute w-0.5 h-0.5 bg-[#18b5d5] rounded-full animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 2}s`,
              }}
            />
          ))}
        </div>

        <div className="relative z-10 py-8 md:py-10">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
            {/* Main Grid - 4 Columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 mb-6">
              
              {/* Column 1: About & Social */}
              <div className="lg:col-span-1 text-center lg:text-right">
                <a href="/" className="inline-block mb-3">
                  <img
                    src={logo}
                    alt="AfterAds"
                    className="w-32 h-auto object-contain hover:scale-105 transition-transform duration-300"
                  />
                </a>
                <p className="text-gray-400 text-sm leading-relaxed mb-2 max-w-xs mx-auto lg:mx-0">
                  {t('footer.company_description')}
                </p>
                <div className="mb-4"></div>

                

                {/* Social Media */}
                <div className="flex justify-center lg:justify-start gap-2 text-2xl mb-4">
                  <a href="https://www.instagram.com/afteradscom" target="_blank" rel="noopener noreferrer" 
                    className="text-[#bac6d9] hover:text-[#18b5d5] transition-colors duration-300">
                    <FaInstagram />
                  </a>
                  <a href="https://wa.me/201069006131" target="_blank" rel="noopener noreferrer"
                    className="text-[#bac6d9] hover:text-[#18b5d5] transition-colors duration-300">
                    <FaWhatsapp />
                  </a>
                  <a href="https://x.com/afteradscom" target="_blank" rel="noopener noreferrer"
                    className="text-[#bac6d9] hover:text-[#18b5d5] transition-colors duration-300">
                    <FaTwitter />
                  </a>
                  <a href="https://www.facebook.com/afteradscom" target="_blank" rel="noopener noreferrer"
                    className="text-[#bac6d9] hover:text-[#18b5d5] transition-colors duration-300">
                    <FaFacebookF />
                  </a>
                  <a href="mailto:info@afterads.com"
                    className="text-[#bac6d9] hover:text-[#18b5d5] transition-colors duration-300">
                    <FaEnvelope />
                  </a>
                  <a href="tel:+201069006131"
                    className="text-[#bac6d9] hover:text-[#18b5d5] transition-colors duration-300">
                    <FaPhone />
                  </a>
                </div>
              </div>

              {/* Column 2: Important Links */}
              <div className="text-center lg:text-right">
                <h3 className="text-white font-semibold text-lg mb-3">
                  {t('footer.important_links')}
                </h3>
                <ul className="space-y-2">
                  {importantLinks.filter(link => shouldShowLink('footerImportant', link.to)).map((link, index) => (
                    <li key={index}>
                      <Link
                        to={link.to}
                        className="text-gray-400 hover:text-[#18b5d5] transition-colors duration-300 text-sm block"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
   {staticPages.filter((page) => {
     const bySetting = shouldShowLink('footerStaticPages', page.slug);
     const byFlag = page.showInFooter !== false;
     return bySetting && byFlag;
   }).map((page) => (
  <li key={page.id}>
    <Link
      to={`/page/${page.slug}`}  // ✅ تصحيح الـ syntax
      className="text-gray-400 hover:text-[#18b5d5] transition-colors duration-300 text-sm block"
    >
      {page.title}
    </Link>
  </li>
))}
                </ul>
              </div>

              {/* Column 3: Quick Links */}
              <div className="text-center lg:text-right">
                <h3 className="text-white font-semibold text-lg mb-3">
                  {t('footer.quick_links')}
                </h3>
                <ul className="space-y-2">
                  {quickLinks.filter(link => shouldShowLink('footerQuick', link.to)).map((link, index) => (
                    <li key={index}>
                      <Link
                        to={link.to}
                        className="text-gray-400 hover:text-[#18b5d5] transition-colors duration-300 text-sm block"
                      >
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Column 4: Contact & Partners */}
              <div className="text-center lg:text-right">
                <h3 className="text-white font-semibold text-lg mb-3">
                  {t('footer.contact_us')}
                </h3>
                
                {/* Contact Info */}
                <div className="space-y-2 mb-4 text-sm">
                  <div className="flex items-center justify-center lg:justify-start gap-2 text-gray-400">
                    <MapPin className="w-4 h-4 text-[#18b5d5]" />
                    <span>{t('footer.location')}</span>
                  </div>
                  <div className="flex items-center justify-center lg:justify-start gap-2 text-gray-400">
                    <Phone className="w-4 h-4 text-[#18b5d5]" />
                    <span dir="ltr">01069006131</span>
                  </div>
                  <div className="flex items-center justify-center lg:justify-start gap-2 text-gray-400">
                    <Mail className="w-4 h-4 text-[#18b5d5]" />
                    <span className="text-xs">info@afterads.com</span>
                  </div>
                </div>

                {/* Partners */}
                <div>
                  <h4 className="text-white font-medium text-sm mb-2">{t('footer.partners')}</h4>
                  <a
                    href="https://salla.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-all duration-300"
                  >
                    <img src={salla} alt="Salla" className="h-8 object-contain" />
                  </a>
                </div>
              </div>
            </div>

            {/* Copyright Section */}
            <div className="border-t border-gray-800 pt-4">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm">
                {/* Left: Copyright & Tax */}
                <div className="text-gray-400 text-xs md:text-sm">
                  <p>{t('footer.copyright')}</p>
                 </div>

                {/* Center: Egypt Eagle + Heart + Saudi Arabia Logo */}
         <div className="flex items-center gap-3">

  {/* مصر */}
  <img 
    src={R} 
    alt="Egypt" 
    className="w-12 h-9  "
    title="مصر"
  />

  {/* قلب */}
  <img 
    src={Heart} 
    alt="Love" 
    className="w-6 h-6 object-contain animate-pulse"
  />

  {/* السعودية */}
  <img 
    src={KSA} 
    alt="Saudi Arabia" 
    className="w-12 h-9 object-contain"
    title="السعودية"
  />
</div>


                {/* Right: Copyright & Tax (repeated) */}
                <div className="text-gray-400 text-xs md:text-sm">
                   <p className=" ">{t('footer.tax_number')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Scroll to Top Button */}
      {showScrollTop && !location.pathname.includes('/theme/') && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-4 sm:bottom-6 md:bottom-8 right-4 sm:right-6 md:right-8 w-12 h-12 sm:w-14 sm:h-14 bg-white/10 border border-white/20 text-[#18b5d5] rounded-full shadow-xl hover:shadow-[#18b5d5]/25 transition-all duration-300 transform hover:scale-110 z-50 flex items-center justify-center group lg:hidden"
          aria-label={t('footer.scroll_to_top')}
        >
          <ArrowUp className="w-5 h-5 sm:w-6 sm:h-6 group-hover:animate-bounce" />
        </button>
      )}

      <style>{`
        @keyframes gentle-float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        
        .animate-gentle-float {
          animation: gentle-float 4s ease-in-out infinite;
        }

        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }

        .shimmer {
          background: linear-gradient(90deg, transparent, rgba(24, 181, 213, 0.4), transparent);
          background-size: 200% 100%;
          animation: shimmer 3s infinite;
        }
      `}</style>
    </>
  );
};

export default GlobalFooter;
