import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, X, Package } from 'lucide-react';
import { apiCall, API_ENDPOINTS, buildImageUrl } from '../../config/api';
import { useApiQuery } from '../../hooks/useApiQuery';
import { createProductSlug } from '../../utils/slugify';
import { useTranslation } from 'react-i18next';
import PriceDisplay from './PriceDisplay';
import Spinner from './Spinner';

interface Product {
  id: number;
  name: string;
  name_ar?: string;
  name_en?: string;
  description: any;
  description_ar?: string;
  description_en?: string;
  price: number;
  isAvailable: boolean;
  categoryId: number | null;
  mainImage: string;
  category?: {
    id: number;
    name: string;
    name_ar?: string;
    name_en?: string;
  };
}

interface LiveSearchProps {
  onClose?: () => void;
  className?: string;
}

const LiveSearch: React.FC<LiveSearchProps> = ({ onClose, className = '' }) => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [categoryMap, setCategoryMap] = useState<Record<number, { id: number; name: string; name_ar?: string; name_en?: string }>>({});
  
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // تحميل المنتجات عند بدء التطبيق
  const { data: productsResp, isLoading: productsLoading } = useApiQuery<any>({ endpoint: API_ENDPOINTS.PRODUCTS, queryKey: ['products'] });
  
  // تحميل البيانات من localStorage أولاً
  useEffect(() => {
    let productsLoaded = false;
    let categoriesLoaded = false;

    // تحميل المنتجات - نجرب جميع المصادر الممكنة
    const productSources = ['cachedAllProducts', 'searchProducts'];
    
    for (const source of productSources) {
      const cached = localStorage.getItem(source);
      if (cached && !productsLoaded) {
        try {
          const parsedProducts = JSON.parse(cached);
          const availableProducts = parsedProducts.filter((product: Product & { productType?: 'product' | 'theme' }) => 
            product.isAvailable && 
            product.name && 
            product.name.trim() !== '' && 
            (product.productType || 'product') !== 'theme'
          );
          
          if (availableProducts.length > 0) {
            setAllProducts(availableProducts);
            setIsLoading(false);
            productsLoaded = true;
            console.log(`✅ تم تحميل ${availableProducts.length} منتج من ${source}`);
          }
        } catch (error) {
          console.error(`❌ خطأ في تحميل ${source}:`, error);
        }
      }
    }

    // تحميل الفئات - نجرب جميع المصادر الممكنة
    const categorySources = ['cachedAllCategories', 'cachedCategories'];
    
    for (const source of categorySources) {
      const cached = localStorage.getItem(source);
      if (cached && !categoriesLoaded) {
        try {
          const parsed = JSON.parse(cached);
          const map: Record<number, { id: number; name: string; name_ar?: string; name_en?: string }> = {};
          parsed.forEach((c: any) => { 
            if (c && typeof c.id === 'number') map[c.id] = c; 
          });
          
          if (Object.keys(map).length > 0) {
            setCategoryMap(map);
            categoriesLoaded = true;
            console.log(`✅ تم تحميل ${Object.keys(map).length} فئة من ${source}`);
          }
        } catch (error) {
          console.error(`❌ خطأ في تحميل ${source}:`, error);
        }
      }
    }

    // إذا لم يتم تحميل المنتجات، نوقف التحميل
    if (!productsLoaded) {
      setIsLoading(false);
      console.warn('⚠️ لم يتم العثور على منتجات في localStorage');
    }
  }, []);

  // تحديث البيانات من API إذا توفرت
  useEffect(() => {
    if (!productsResp) return;
    const productsData = productsResp?.products || productsResp || [];
    const availableProducts = (productsData as any[])
      .filter((product: Product & { productType?: 'product' | 'theme' }) => 
        product.isAvailable && 
        product.name && 
        product.name.trim() !== '' && 
        (product.productType || 'product') !== 'theme'
      );
    
    if (availableProducts.length > 0) {
      setAllProducts(availableProducts as Product[]);
      localStorage.setItem('searchProducts', JSON.stringify(availableProducts));
      setIsLoading(false);
      console.log('✅ تم تحديث المنتجات من API:', availableProducts.length);
    }
  }, [productsResp]);

  const getLocalizedContent = (product: Product, field: 'name' | 'description') => {
    const currentLang = (localStorage.getItem('i18nextLng') || 'ar');
    const arField = `${field}_ar` as keyof Product;
    const enField = `${field}_en` as keyof Product;
    const baseValue = (product as any)[field];
    
    // ترتيب الأولوية حسب اللغة
    let value;
    if (currentLang === 'ar') {
      // أولوية: عربي -> إنجليزي -> أساسي
      value = (product as any)[arField] || (product as any)[enField] || baseValue;
    } else {
      // أولوية: إنجليزي -> عربي -> أساسي
      value = (product as any)[enField] || (product as any)[arField] || baseValue;
    }
    
    // إذا كانت القيمة فاضية، نستخدم الأساسي
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      value = baseValue;
    }
    
    if (Array.isArray(value)) {
      return value.map((b: any) => (b && b.text) ? b.text : '').join(' ');
    }
    return String(value || '');
  };

  const getCategoryName = (product: Product) => {
    const currentLang = (localStorage.getItem('i18nextLng') || 'ar');
    const pickName = (obj: any) => {
      if (!obj) return '';
      return currentLang === 'ar' ? (obj.name_ar ?? obj.name_en ?? obj.name ?? '') : (obj.name_en ?? obj.name_ar ?? obj.name ?? '');
    };
    const fromProduct = pickName(product.category);
    const fromMap = product.categoryId != null ? pickName(categoryMap[product.categoryId]) : '';
    return fromProduct || fromMap;
  };

  const performSearch = (query: string) => {
    if (!query || query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    console.log('🔍 البحث عن:', query, '- عدد المنتجات المتاحة:', allProducts.length);

    const searchTerm = query.trim().toLowerCase();

    const nameMatches = allProducts.filter(product => {
      // البحث في جميع حقول الاسم
      const name = (product.name || '').toLowerCase();
      const nameAr = (product.name_ar || '').toLowerCase();
      const nameEn = (product.name_en || '').toLowerCase();
      
      return name.includes(searchTerm) || 
             nameAr.includes(searchTerm) || 
             nameEn.includes(searchTerm);
    });

    const categoryMatches = allProducts.filter(product => {
      if (nameMatches.includes(product)) return false;
      const categoryText = getCategoryName(product).toLowerCase();
      return categoryText && categoryText.includes(searchTerm);
    });

    const descriptionMatches = allProducts.filter(product => {
      if (nameMatches.includes(product) || categoryMatches.includes(product)) return false;
      
      // البحث في جميع حقول الوصف
      const desc = getLocalizedContent(product, 'description').toLowerCase();
      const descAr = (product.description_ar || '').toLowerCase();
      const descEn = (product.description_en || '').toLowerCase();
      
      return desc.includes(searchTerm) || 
             descAr.includes(searchTerm) || 
             descEn.includes(searchTerm);
    });

    const combinedResults = [...nameMatches, ...categoryMatches, ...descriptionMatches];

    console.log('✅ نتائج البحث:', combinedResults.length);
    setSearchResults(combinedResults.slice(0, 6));
  };

  // التعامل مع تغيير النص
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    performSearch(value);
    setIsOpen(true);
  };

  // إغلاق البحث
  const handleClose = () => {
    setSearchQuery('');
    setSearchResults([]);
    setIsOpen(false);
    onClose?.();
  };

  // الانتقال إلى صفحة المنتج
  const handleProductClick = (product: Product) => {
    const localizedName = getLocalizedContent(product, 'name');
    const slug = createProductSlug(product.id, localizedName);
    navigate(`/product/${slug}`);
    handleClose();
  };

  // الانتقال إلى صفحة جميع النتائج
  const handleViewAll = () => {
    navigate(`/products?search=${encodeURIComponent(searchQuery)}`);
    handleClose();
  };

  // إغلاق عند الضغط خارج المكون أو الضغط على Escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        handleClose();
      }
    };

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscapeKey);
      document.body.style.overflow = 'hidden';
      
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('keydown', handleEscapeKey);
        document.body.style.overflow = 'unset';
      };
    }
  }, [isOpen]);

  return (
    <>
      {/* Search Icon Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="relative text-white/80 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-all duration-300 group"
      >
        <Search size={20} />
        <div className="absolute inset-0 rounded-xl bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      </button>

      {/* Search Overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center pt-20">
          <div ref={searchRef} className="w-full max-w-2xl mx-4">
            {/* Search Input */}
            <div className="relative mb-4">
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={handleInputChange}
                placeholder={t('search_placeholder', 'البحث عن المنتجات...')}
                className="w-full px-6 py-4 pl-14 pr-12 text-white placeholder-white/70 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/30 transition-all duration-300 shadow-lg text-lg text-right"
                autoFocus
              />
              <Search className="absolute right-5 top-1/2 transform -translate-y-1/2 text-white/70 w-6 h-6" />
              <button
                onClick={handleClose}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/70 hover:text-white transition-colors duration-200"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* نتائج البحث المحسنة */}
            {searchQuery.length >= 2 && (
              <div 
                className="rounded-2xl overflow-hidden shadow-2xl animate-in slide-in-from-top-2 duration-300"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 100%)',
                  backdropFilter: 'blur(40px) saturate(180%)',
                  WebkitBackdropFilter: 'blur(40px) saturate(180%)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  boxShadow: `
                    0 20px 60px rgba(0,0,0,0.3),
                    inset 1px 1px 1px rgba(255,255,255,0.1),
                    inset 0 1px 1px rgba(255,255,255,0.05)
                  `
                }}
              >
                 {isLoading ? (
                   <div className="p-8 text-center">
                     <div className="inline-flex items-center justify-center">
                       <Spinner size={40} primaryColor="#18b5d8" secondaryColor="#4fd1c5" trackColor="rgba(255, 255, 255, 0.2)" />
                     </div>
                     <p className="text-white/90 font-medium text-base mt-4">{t('live_search.loading', 'جاري التحميل...')}</p>
                   </div>
                 ) : searchResults.length > 0 ? (
                   <>
                     {/* قائمة النتائج المحسنة */}
                     <div className="max-h-80 overflow-y-auto custom-scrollbar">
                       {searchResults.map((product, index) => (
                         <button
                           key={product.id}
                           onClick={() => handleProductClick(product)}
                           className="w-full p-4 hover:bg-white/10 transition-all duration-300 border-b border-white/10 last:border-b-0 text-right group/item"
                           style={{
                             animationDelay: `${index * 50}ms`,
                             animation: 'slideInUp 0.4s ease-out forwards'
                           }}
                         >
                           <div className="flex items-center gap-4">
                             {/* صورة المنتج المحسنة */}
                             <div className="w-16 h-16 rounded-xl overflow-hidden bg-white/10 flex-shrink-0 group-hover/item:scale-105 transition-transform duration-300 border border-white/20 shadow-lg">
                               {product.mainImage ? (
                                 <img
                                   src={buildImageUrl(product.mainImage)}
                                   alt={getLocalizedContent(product, 'name')}
                                   className="w-full h-full object-cover"
                                 />
                               ) : (
                                 <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-white/5 to-white/10">
                                   <Package size={24} className="text-white/40" />
                                 </div>
                               )}
                             </div>
                             
                             {/* معلومات المنتج المحسنة */}
                             <div className="flex-1 min-w-0 text-right">
                               <h4 className="font-bold text-white truncate mb-1.5 group-hover/item:text-[#18b5d8] transition-colors duration-200 text-base">
                                 {getLocalizedContent(product, 'name')}
                               </h4>
                               {getCategoryName(product) && (
                                 <p className="text-sm text-white/70 truncate mb-2">
                                   {getCategoryName(product)}
                                 </p>
                               )}
                               <div className="flex items-center justify-end">
                                 <span className="text-sm font-bold text-white bg-gradient-to-r   px-3 py-1.5 rounded-lg shadow-md">
                                   <PriceDisplay price={product.price} />
                                 </span>
                               </div>
                             </div>
                             
                             {/* سهم الانتقال المحسّن */}
                             <div className="opacity-0 group-hover/item:opacity-100 transition-all duration-300 transform group-hover/item:-translate-x-1">
                               <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#18b5d8]/30 to-[#0891b2]/30 flex items-center justify-center border border-white/20">
                                 <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                                 </svg>
                               </div>
                             </div>
                           </div>
                         </button>
                       ))}
                     </div>
              
                     {/* زر عرض جميع النتائج المحسن */}
                     {searchResults.length >= 6 && (
                       <div className="p-4 border-t border-white/10 bg-white/5">
                         <button
                           onClick={handleViewAll}
                           className="w-full py-3 px-4 rounded-xl font-bold text-white bg-gradient-to-r from-[#18b5d8] to-[#0891b2] hover:from-[#1aa3c4] hover:to-[#0a7a94] transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.02] text-base"
                         >
                           {t('live_search.view_all_results', 'عرض جميع النتائج')}
                         </button>
                       </div>
                     )}
                   </>
                 ) : (
                   <div className="p-8 text-center">
                     <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center border border-white/20">
                       <Package size={32} className="text-white/50" />
                     </div>
                     <h3 className="text-base font-bold text-white mb-2">{t('live_search.no_results', 'لا توجد نتائج')}</h3>
                     <p className="text-sm text-white/70">{t('live_search.no_products_found', 'لم يتم العثور على منتجات تطابق بحثك')}</p>
                   </div>
                 )}
               </div>
             )}
           </div>
         </div>
       )}
       
       {/* إضافة الستايلات المخصصة */}
       <style>{`
         .custom-scrollbar::-webkit-scrollbar {
           width: 4px;
         }
         .custom-scrollbar::-webkit-scrollbar-track {
           background: rgba(255,255,255,0.05);
           border-radius: 2px;
         }
         .custom-scrollbar::-webkit-scrollbar-thumb {
           background: rgba(255,255,255,0.2);
           border-radius: 2px;
         }
         .custom-scrollbar::-webkit-scrollbar-thumb:hover {
           background: rgba(255,255,255,0.3);
         }
         
         @keyframes slideInUp {
           from {
             opacity: 0;
             transform: translateY(8px);
           }
           to {
             opacity: 1;
             transform: translateY(0);
           }
         }
       `}</style>
     </>
   );
};

export default LiveSearch;
