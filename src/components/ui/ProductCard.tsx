import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { smartToast } from '../../utils/toastConfig';
import { Heart, ShoppingCart, CheckCircle, ArrowUpDown } from 'lucide-react';
import { createProductSlug } from '../../utils/slugify';
import { addToCartUnified, addToWishlistUnified, removeFromWishlistUnified } from '../../utils/cartUtils';
import { buildImageUrl } from '../../config/api';
import PriceDisplay from '../ui/PriceDisplay';
import fallbackImg from '../../assets/search_not_found.png';

interface Product {
  id: number;
  name: string;
  name_ar?: string;
  name_en?: string;
  description: any;
  description_ar?: string;
  description_en?: string;
  price: number;
  originalPrice?: number;
  isAvailable: boolean;
  categoryId?: number | null;
  subcategoryId?: number | null;
  mainImage: string;
  detailedImages?: string[];
  createdAt?: string;
  hasRequiredOptions?: boolean;
}

interface ProductCardProps {
  product: Product;
  viewMode?: 'grid' | 'list';
  variant?: 'default' | 'blog';
}

const ProductCard: React.FC<ProductCardProps> = ({ product, viewMode = 'grid', variant = 'default' }) => {
  const { t, i18n } = useTranslation(['product_card', 'product', 'common']);
  const isRTL = i18n.language === 'ar';
  const [quantity, setQuantity] = useState(1);
  const [isInWishlist, setIsInWishlist] = useState(false);
  const navigate = useNavigate();

  // Helper function to get localized content
  const getLocalizedContent = (field: 'name' | 'description') => {
    const currentLang = i18n.language;
    const arField = `${field}_ar` as keyof Product;
    const enField = `${field}_en` as keyof Product;
    const value = currentLang === 'ar'
      ? (product[arField] as any) || (product[enField] as any) || (product as any)[field]
      : (product[enField] as any) || (product[arField] as any) || (product as any)[field];
    if (Array.isArray(value)) {
      return value.map((b: any) => (b && b.text) ? b.text : '').join(' ');
    }
    return String(value || '');
  };

  useEffect(() => {
    checkWishlistStatus();
  }, [product.id]);

  useEffect(() => {
    const handleWishlistUpdate = (event: any) => {
      if (event.detail && Array.isArray(event.detail)) {
        setIsInWishlist(event.detail.includes(product.id));
      } else {
        checkWishlistStatus();
      }
    };

    window.addEventListener('wishlistUpdated', handleWishlistUpdate);
    return () => window.removeEventListener('wishlistUpdated', handleWishlistUpdate);
  }, [product.id]);

  const truncateDescription = (text: string, maxWords: number = 8): string => {
    // إزالة HTML tags
    const cleanText = text.replace(/<[^>]*>/g, '').trim();
    const words = cleanText.split(' ');
    if (words.length <= maxWords) return cleanText;
    return words.slice(0, maxWords).join(' ') + '...';
  };

  const checkWishlistStatus = () => {
    try {
      const savedWishlist = localStorage.getItem('wishlist');
      if (savedWishlist) {
        const parsedWishlist = JSON.parse(savedWishlist);
        if (Array.isArray(parsedWishlist)) {
          setIsInWishlist(parsedWishlist.includes(product.id));
        }
      }
    } catch (error) {
      console.error(t('product_detail:wishlist_error'), error);
      setIsInWishlist(false);
    }
  };

  const toggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      if (isInWishlist) {
        const success = await removeFromWishlistUnified(product.id, getLocalizedContent('name'));
        if (success) setIsInWishlist(false);
      } else {
        const success = await addToWishlistUnified(product.id, getLocalizedContent('name'));
        if (success) setIsInWishlist(true);
      }
    } catch (error) {
      console.error('Error updating wishlist:', error);
      smartToast.frontend.error(t('product_detail:wishlist_error'));
    }
  };

  const addToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Check if product has required options
    if (product.hasRequiredOptions) {
      // Redirect to product detail page to select options
      const productPath = `/product/${createProductSlug(product.id, getLocalizedContent('name'))}`;
      navigate(productPath);
      smartToast.frontend.info(t('product_detail:wishlist_error'));
      return;
    }
    
    try {
      const success = await addToCartUnified(product.id, getLocalizedContent('name'), quantity);
      if (success) {
        smartToast.frontend.success(t('product:added_to_cart', { name: getLocalizedContent('name') }));
      } else {
        smartToast.frontend.error(t('product:add_to_cart_failed'));
      }
    } catch (error) {
      console.error('Error adding product to cart:', error);
      smartToast.frontend.error(t('product_detail:add_to_cart_error'));
    }
  };

  const increaseQuantity = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (quantity < 99) setQuantity(prev => prev + 1);
  };

  const decreaseQuantity = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (quantity > 1) setQuantity(prev => prev - 1);
  };

  const handleProductClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const productPath = `/product/${createProductSlug(product.id, getLocalizedContent('name'))}`;
    navigate(productPath);
  };

  // ---- BLOG VARIANT LIST VIEW ----
  if (variant === 'blog' && viewMode === 'list') {
    return (
      <div className="relative w-full mb-6">
        <div className="bg-[#333333]/60 backdrop-blur border border-[#444444] rounded-2xl overflow-hidden">
          <Link
            to={`/product/${createProductSlug(product.id, getLocalizedContent('name'))}`}
            className="block hover:border-[#18b5d5] transition-all duration-300 hover:shadow-2xl hover:shadow-[#18b5d5]/25 group"
            onClick={handleProductClick}
            aria-label={t('product:view_product_details', { name: getLocalizedContent('name') })}
          >
          <div className="flex items-center p-6 gap-6">
            <div className="relative w-24 h-24 flex-shrink-0">
              <div className="relative w-full h-full rounded-xl overflow-hidden border border-[#444444] bg-[#3a3a3a]">
                <img
                  src={product.mainImage ? buildImageUrl(product.mainImage) : fallbackImg}
                  alt={getLocalizedContent('name')}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300 will-change-transform"
                  loading="lazy"
                  onError={(e) => { e.currentTarget.src = fallbackImg; }}
                />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap gap-2 mb-2">
                <span className="text-xs bg-[#18b5d5]/30 text-white px-3 py-1 rounded-full">
                  {product.isAvailable ? t('available') : t('unavailable')}
                </span>
              </div>
              <h3 dir="rtl" className="text-xl font-bold text-white mb-2  transition-colors duration-300 line-clamp-2">
                {getLocalizedContent('name')}
              </h3>
              <p className="text-[#CCCCCC] text-sm leading-relaxed line-clamp-2 mb-3">
                {truncateDescription(getLocalizedContent('description'))}
              </p>
              <div className="flex items-center justify-between text-xs text-[#BBBBBB] border-t border-[#444444] pt-3 mt-auto">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-[#18b5d5]" />
                  <PriceDisplay 
                    price={product.price}
                    originalPrice={product.originalPrice}
                    size="md"
                    variant="card"
                    className="min-h-[28px]"
                  />
                </div>
                {product.isAvailable && (
                  <button
                    onClick={addToCart}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#18b5d5]/40 text-white hover:bg-[#18b5d5]/20 transition-all"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    <span className="font-medium text-sm">{t('addToCart')}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </Link>
        </div>
      </div>
    );
  }

  // ---- LIST VIEW (DEFAULT) ----
  if (viewMode === 'list') {
    return (
      <div className="relative w-full mb-6">
        {product.originalPrice && 
          <div className="absolute -top-3 -left-3 bg-gradient-to-r from-red-600 to-red-500 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-2xl backdrop-blur-sm z-[100]">
            {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF
          </div>
        }

        <Link
          to={`/product/${createProductSlug(product.id, getLocalizedContent('name'))}`}
          className="block bg-[#333333]/60 backdrop-blur border border-[#444444] rounded-2xl overflow-hidden hover:border-[#18b5d5] transition-all duration-300 hover:shadow-2xl hover:shadow-[#18b5d5]/25 group"
          onClick={handleProductClick}
          aria-label={t('product:view_product_details', { name: getLocalizedContent('name') })}
        >
          <div className="flex items-center p-6 gap-6">
            <div className="relative w-24 h-24 flex-shrink-0">
              <div className="relative w-full h-full rounded-xl overflow-hidden border border-[#444444] bg-[#3a3a3a]">
                <img
                  src={product.mainImage ? buildImageUrl(product.mainImage) : fallbackImg}
                  alt={getLocalizedContent('name')}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300 will-change-transform"
                  loading="lazy"
                  onError={(e) => { e.currentTarget.src = fallbackImg; }}
                />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap gap-2 mb-2">
                <span className="text-xs bg-[#18b5d5]/30 text-white px-3 py-1 rounded-full">
                  {product.isAvailable ? t('available') : t('unavailable')}
                </span>
              </div>
              <h3 dir="rtl" className="text-xl font-bold text-white mb-2 group-hover:text-[#18b5d5] transition-colors duration-300 line-clamp-2">
                {getLocalizedContent('name')}
              </h3>
              <p className="text-[#CCCCCC] text-sm leading-relaxed line-clamp-2">
                {truncateDescription(getLocalizedContent('description'))}
              </p>
              <div className="flex items-center gap-2 text-xs text-[#BBBBBB] border-t border-[#444444] pt-3 mt-3">
                <CheckCircle className="w-4 h-4 text-[#18b5d5]" />
                <PriceDisplay 
                  price={product.price}
                  originalPrice={product.originalPrice}
                  size="md"
                  variant="card"
                  className="min-h-[28px]"
                />
              </div>
            </div>
          </div>
          </Link>
          <div className="flex items-center justify-end gap-2 px-6 pb-6 pt-2">
            <button
              onClick={toggleWishlist}
              className={`w-9 h-9 rounded-full border border-[#18b5d5]/40 flex items-center justify-center transition-all duration-200 ${
                isInWishlist ? 'text-red-500 bg-red-500/10' : 'text-white hover:bg-[#18b5d5]/10'
              }`}
              type="button"
              aria-label={isInWishlist ? t('product_card:remove_from_wishlist') : t('product_card:add_to_wishlist')}
            >
              <Heart className={`w-4 h-4 ${isInWishlist ? 'fill-red-500' : ''}`} />
            </button>
            {product.isAvailable && (
              <button
                onClick={addToCart}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-[#18b5d5]/40 text-white hover:bg-[#18b5d5]/20 transition-all"
              >
                <ShoppingCart className="w-4 h-4" />
                <span className="font-medium text-sm">{t('addToCart')}</span>
              </button>
            )}
          </div>
        </div>
    );
  }

  // ---- BLOG VARIANT GRID VIEW ----
  if (variant === 'blog') {
    return (
      <div className="relative w-full px-2 py-3">
        <Link
          to={`/product/${createProductSlug(product.id, getLocalizedContent('name'))}`}
          className="block bg-[#333333]/60 backdrop-blur border border-[#444444] rounded-2xl overflow-hidden hover:border-[#18b5d5] transition-all duration-300 hover:shadow-2xl hover:shadow-[#18b5d5]/25 h-full flex flex-col group"
          onClick={handleProductClick}
          aria-label={t('product:view_product_details', { name: getLocalizedContent('name') })}
        >
          <div className="relative h-48 overflow-hidden bg-[#3a3a3a]">
            <img
              src={product.mainImage ? buildImageUrl(product.mainImage) : fallbackImg}
              alt={getLocalizedContent('name')}
              onError={(e) => { e.currentTarget.src = fallbackImg; }}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
            />
          </div>

          <div className="p-6 flex flex-col flex-grow">
            <div className="flex flex-wrap gap-2 mb-3">
              <span className="text-xs bg-[#18b5d5]/30 text-white px-3 py-1 rounded-full">
                {product.isAvailable ? t('available') : t('unavailable')}
              </span>
            </div>

            <h3 className="text-xl font-bold mb-3 line-clamp-2   text-white transition-colors">
              {getLocalizedContent('name')}
            </h3>

            <p className="text-[#CCCCCC] text-sm mb-4 line-clamp-2 flex-grow">
              {truncateDescription(getLocalizedContent('description'))}
            </p>

            <div className="flex items-center justify-between text-xs text-[#BBBBBB] border-t border-[#444444] pt-4 mt-auto">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-[#18b5d5]" />
                <PriceDisplay 
                  price={product.price}
                  originalPrice={product.originalPrice}
                  size="md"
                  variant="card"
                />
              </div>
              {product.isAvailable && (
                <button
                  onClick={addToCart}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#18b5d5]/40 text-white hover:bg-[#18b5d5]/20 transition-all"
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span className="font-medium text-sm">{t('addToCart')}</span>
                </button>
              )}
            </div>
          </div>
        </Link>
      </div>
    );
  }

  // ---- GRID VIEW (DEFAULT) ----
  return (
    <div className="relative w-full px-2 py-3">
      {product.originalPrice && 
        <div className="absolute -top-3 -left-3 bg-gradient-to-r from-red-600 to-red-500 text-white px-4 py-2 rounded-full text-xs font-bold shadow-2xl backdrop-blur-sm z-[100]">
          {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF
        </div>
      }

      <div className="bg-[#333333]/60 backdrop-blur border border-[#444444] rounded-2xl overflow-hidden">
        <Link
          to={`/product/${createProductSlug(product.id, getLocalizedContent('name'))}`}
          className="block hover:border-[#18b5d5] transition-all duration-300 hover:shadow-2xl hover:shadow-[#18b5d5]/25"
          onClick={handleProductClick}
          aria-label={t('product:view_product_details', { name: getLocalizedContent('name') })}
        >
        <div className="relative h-48 overflow-hidden bg-[#3a3a3a]">
          <img
            src={product.mainImage ? buildImageUrl(product.mainImage) : fallbackImg}
            alt={getLocalizedContent('name')}
            onError={(e) => { e.currentTarget.src = fallbackImg; }}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          />
        </div>

          <div className="p-6 flex flex-col">
          <div className="flex flex-wrap gap-2 mb-3">
            <span className="text-xs bg-[#18b5d5]/30 text-white px-3 py-1 rounded-full">
              {product.isAvailable ? t('available') : t('unavailable')}
            </span>
          </div>

          <h3 className="text-xl font-bold mb-3 line-clamp-2   text-white transition-colors">
            {getLocalizedContent('name')}
          </h3>

          <p className="text-[#CCCCCC] text-sm mb-4 line-clamp-2 flex-grow">
            {truncateDescription(getLocalizedContent('description'))}
          </p>

          <div className="flex items-center gap-2 text-xs text-[#BBBBBB] border-t border-[#444444] pt-4">
            <CheckCircle className="w-4 h-4 text-[#18b5d5]" />
            <PriceDisplay 
              price={product.price}
              originalPrice={product.originalPrice}
              size="md"
              variant="card"
            />
          </div>
        </div>
        </Link>
        <div className="flex items-center justify-end gap-2 px-6 pb-6 pt-2">
          <button
            onClick={toggleWishlist}
            className={`w-9 h-9 rounded-full border border-[#18b5d5]/40 flex items-center justify-center transition-all duration-200 ${
              isInWishlist ? 'text-red-500 bg-red-500/10' : 'text-white hover:bg-[#18b5d5]/10'
            }`}
            type="button"
            aria-label={isInWishlist ? t('product_card:remove_from_wishlist') : t('product_card:add_to_wishlist')}
          >
            <Heart className={`w-4 h-4 ${isInWishlist ? 'fill-red-500' : ''}`} />
          </button>
          {product.isAvailable && (
            <button
              onClick={addToCart}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-[#18b5d5]/40 text-white hover:bg-[#18b5d5]/20 transition-all"
            >
              <ShoppingCart className="w-4 h-4" />
              <span className="font-medium text-sm">{t('addToCart')}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
