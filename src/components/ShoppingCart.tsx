import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { smartToast } from '../utils/toastConfig';
import { ShoppingCart as CartIcon, Plus, Minus, Trash2, Package, ArrowRight } from 'lucide-react';
import { apiCall, API_ENDPOINTS, buildImageUrl } from '../config/api';
import { useApiQuery } from '../hooks/useApiQuery';
import { useQueryClient } from '@tanstack/react-query';
import AuthModal from './modals/AuthModal';
import CheckoutAuthModal from './modals/CheckoutAuthModal';
import PriceDisplay from './ui/PriceDisplay';
import LoadingSpinner from './ui/LoadingSpinner';



interface CartItem {
  id: number;
  productId: number;
  quantity: number;
  selectedOptions?: Record<string, string>;
  optionsPricing?: Record<string, number>;
  productOptions?: Array<{
    optionId: string;
    optionName: { ar: string; en: string };
    value: string | string[];
    priceModifier: number;
  }>;
  productOptionsPriceModifier?: number;
  attachments?: {
    images?: string[];
    text?: string;
  };
  addOns?: Array<{ 
    name: string; 
    name_ar?: string; 
    name_en?: string; 
    price: number; 
    description?: string; 
    description_ar?: string; 
    description_en?: string; 
  }>;
  totalPrice?: number;
  basePrice?: number;
  addOnsPrice?: number;
  product: {
    id: number;
    name: string;
    description?: string;
    price: number;
    originalPrice?: number;
    mainImage: string;
    detailedImages?: string[];
    isAvailable: boolean;
    productType?: string;
    additionalServices?: Array<{
      name: string;
      price: number;
      description?: string;
    }>;
  };
}

const ShoppingCart: React.FC = () => {
  const { t, i18n } = useTranslation('common');
  const isRTL = i18n.language === 'ar';
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showCheckoutAuthModal, setShowCheckoutAuthModal] = useState(false);
  const navigate = useNavigate();
  const [serverSubtotal, setServerSubtotal] = useState<number | null>(null);
  const [serverTotal, setServerTotal] = useState<number | null>(null);
  const [serverLoyaltyDiscount, setServerLoyaltyDiscount] = useState<number | null>(null);
  const [serverLoyaltyAvailable, setServerLoyaltyAvailable] = useState<number | null>(null);
  const queryClient = useQueryClient();
  const userId = useMemo(() => {
    try {
      const u = localStorage.getItem('user');
      if (!u) return undefined;
      const obj = JSON.parse(u);
      return obj?.id;
    } catch {
      return undefined;
    }
  }, []);
  const { data: serverCartResp, isLoading: serverCartLoading } = useApiQuery<any>({ endpoint: userId ? API_ENDPOINTS.USER_CART(userId) : '', queryKey: ['user-cart', userId], enabled: !!userId });

  // Helper function to get localized content for add-ons
  const getLocalizedAddOnContent = (field: 'name' | 'description', addOn: any) => {
    const currentLang = i18n.language;
    
    if (!addOn) return '';
    
    if (currentLang === 'ar') {
      return addOn[`${field}_ar`] || addOn[`${field}_en`] || addOn[field] || '';
    } else {
      return addOn[`${field}_en`] || addOn[`${field}_ar`] || addOn[field] || '';
    }
  };

  // Load cart from server for logged users, fallback to localStorage
  useEffect(() => {
    try {
      let cartToLoad: any[] = [];
      if (serverCartResp) {
        const srv = serverCartResp;
        if (Array.isArray(srv)) {
          cartToLoad = srv;
          setServerSubtotal(null);
          setServerTotal(null);
          setServerLoyaltyDiscount(null);
          setServerLoyaltyAvailable(null);
        } else if (srv && typeof srv === 'object') {
          if (Array.isArray((srv as any).cart)) {
            cartToLoad = (srv as any).cart;
          } else if (Array.isArray((srv as any).items)) {
            cartToLoad = (srv as any).items;
          }
          setServerSubtotal(typeof (srv as any).subtotal === 'number' ? (srv as any).subtotal : null);
          setServerTotal(typeof (srv as any).total === 'number' ? (srv as any).total : null);
          setServerLoyaltyDiscount(typeof (srv as any).loyaltyDiscount === 'number' ? (srv as any).loyaltyDiscount : null);
          setServerLoyaltyAvailable(typeof (srv as any).loyaltyAvailable === 'number' ? (srv as any).loyaltyAvailable : null);
        }
        // Validate cart data - filter out items with invalid product data
        cartToLoad = cartToLoad.filter((item: CartItem) => item && item.product && item.product.id && item.product.name);
        localStorage.setItem('cart', JSON.stringify(cartToLoad));
        window.dispatchEvent(new CustomEvent('cartUpdated'));
      } else {
        const savedCart = localStorage.getItem('cart');
        if (savedCart) {
          cartToLoad = JSON.parse(savedCart);
          // Validate cart data - filter out items with invalid product data
          cartToLoad = cartToLoad.filter((item: CartItem) => item && item.product && item.product.id && item.product.name);
        }
      }
      setCartItems(cartToLoad);
    } catch {
      smartToast.frontend.error('فشل في تحميل السلة');
    } finally {
      setIsInitialLoading(false);
    }
  }, [serverCartResp]);

  // Save cart to localStorage
  const saveCartToLocalStorage = useCallback((items: CartItem[]) => {
    try {
      localStorage.setItem('cart', JSON.stringify(items));
    } catch (error) {
      console.error('Error saving cart to localStorage:', error);
      smartToast.frontend.error(t('cart.saveError'));
    }
  }, [t]);

  // Update quantity
  const updateQuantity = useCallback(
    async (itemId: number, newQuantity: number) => {
      if (newQuantity < 1) return;

      try {
        // Check if user is logged in
        const userData = localStorage.getItem('user');
        
        if (userData) {
          const user = JSON.parse(userData);
          if (user?.id) {
            console.log('🔄 [ShoppingCart] Updating quantity on server for user:', user.id, 'item:', itemId, 'quantity:', newQuantity);
            
            // Update quantity on server
            await apiCall(API_ENDPOINTS.CART_ITEM(user.id, itemId), {
              method: 'PUT',
              body: JSON.stringify({ quantity: newQuantity })
            });
            queryClient.invalidateQueries({ queryKey: ['user-cart'] });
             
            console.log('✅ [ShoppingCart] Successfully updated quantity on server');
          }
        }
        
        // Update local state and localStorage
        const updatedItems = cartItems.map((item) =>
          item.id === itemId ? { ...item, quantity: newQuantity } : item
        );
        setCartItems(updatedItems);
        saveCartToLocalStorage(updatedItems);
        window.dispatchEvent(new Event('cartUpdated'));
        smartToast.frontend.success(t('cart.quantityUpdated'));
      } catch (error) {
        console.error('❌ [ShoppingCart] Error updating quantity:', error);
        
        // Still update locally even if server update fails
        const updatedItems = cartItems.map((item) =>
          item.id === itemId ? { ...item, quantity: newQuantity } : item
        );
        setCartItems(updatedItems);
        saveCartToLocalStorage(updatedItems);
        window.dispatchEvent(new Event('cartUpdated'));
        
        smartToast.frontend.error(t('cart.quantityUpdatedLocallyOnly'));
      }
    },
    [cartItems, saveCartToLocalStorage]
  );

  // Remove item from cart
  const removeFromCart = useCallback(
    async (itemId: number) => {
      try {
        // Check if user is logged in
        const userData = localStorage.getItem('user');
        
        if (userData) {
          const user = JSON.parse(userData);
          if (user?.id) {
            console.log('🗑️ [ShoppingCart] Removing item from server for user:', user.id, 'item:', itemId);
            
            // Delete from server
            await apiCall(API_ENDPOINTS.CART_ITEM(user.id, itemId), {
              method: 'DELETE'
            });
            queryClient.invalidateQueries({ queryKey: ['user-cart'] });
            
            console.log('✅ [ShoppingCart] Successfully removed item from server');
          }
        }
        
        // Update local state and localStorage
        const updatedItems = cartItems.filter((item) => item.id !== itemId);
        setCartItems(updatedItems);
        saveCartToLocalStorage(updatedItems);
        window.dispatchEvent(new Event('cartUpdated'));
        window.dispatchEvent(new CustomEvent('cartCountChanged', { detail: { count: updatedItems.length } }));
        smartToast.frontend.success(t('cart.itemRemoved'));
      } catch (error) {
        console.error('❌ [ShoppingCart] Error removing item:', error);
        
        // Still remove locally even if server removal fails
        const updatedItems = cartItems.filter((item) => item.id !== itemId);
        setCartItems(updatedItems);
        saveCartToLocalStorage(updatedItems);
        window.dispatchEvent(new Event('cartUpdated'));
        window.dispatchEvent(new CustomEvent('cartCountChanged', { detail: { count: updatedItems.length } }));
        
        smartToast.frontend.error(t('cart.itemRemovedLocallyOnly'));
      }
    },
    [cartItems, saveCartToLocalStorage]
  );

  // Clear entire cart
  const clearCart = useCallback(async () => {
    try {
      setCartItems([]);
      saveCartToLocalStorage([]);

      const userData = localStorage.getItem('user');
      if (userData) {
        try {
          const user = JSON.parse(userData);
          if (user?.id) {
            await apiCall(API_ENDPOINTS.USER_CART(user.id), { method: 'DELETE' });
            localStorage.setItem(`cartCount_${user.id}`, '0');
            queryClient.invalidateQueries({ queryKey: ['user-cart'] });
          }
        } catch (error) {
          console.error('Error clearing server cart:', error);
        }
      }

      localStorage.setItem('lastCartCount', '0');
      localStorage.removeItem('cart');

      window.dispatchEvent(new Event('cartUpdated'));
      window.dispatchEvent(new Event('cartCountChanged'));
      window.dispatchEvent(new Event('forceCartUpdate'));
      window.dispatchEvent(new CustomEvent('cartCleared', { detail: { count: 0 } }));

      document.querySelectorAll('[data-cart-count]').forEach((element) => {
        if (element instanceof HTMLElement) {
          element.textContent = '0';
          element.style.display = 'none';
        }
      });

      smartToast.frontend.success(t('cart.cartCleared'));
    } catch (error) {
      console.error('Error clearing cart:', error);
      smartToast.frontend.error(t('cart.clearCartError'));
    }
  }, [saveCartToLocalStorage]);

  // Calculate totals
  const subtotal = useMemo(() => {
    if (serverSubtotal !== null && serverSubtotal !== undefined) return serverSubtotal;
    return cartItems.reduce((total, item) => {
      const basePrice = item.basePrice || item.product?.price || 0;
      const addOnsPrice = item.addOnsPrice || 0;
      
      // Calculate options price from both sources
      let optionsPrice = 0;
      if (item.optionsPricing) {
        optionsPrice += Object.values(item.optionsPricing).reduce((sum, price) => sum + (price || 0), 0);
      }
      if (item.productOptionsPriceModifier) {
        optionsPrice += item.productOptionsPriceModifier;
      }
      
      const itemTotal = (basePrice + addOnsPrice + optionsPrice) * item.quantity;
      return total + itemTotal;
    }, 0);
  }, [cartItems]);

  const total = serverTotal ?? subtotal;

  // Proceed to checkout
  const proceedToCheckout = () => {
    const user = localStorage.getItem('user');
    if (!user) {
      setShowCheckoutAuthModal(true);
      return;
    }
    
    navigate('/checkout');
  };

  // Filter cart items - remove items with invalid product data
  const filteredCartItems = cartItems.filter(item => item && item.product && item.product.id && item.product.name);

  return (
    <section className="min-h-screen bg-[#1a1a1a] relative overflow-hidden overflow-x-hidden" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Animated Background Pattern - Matching Categories Page */}
      <div className="absolute inset-0 opacity-35">
        <div className="absolute inset-0">
          <div className="absolute font-mono text-base text-[#7a7a7a] animate-pulse" style={{ top: '10%', left: '15%', animationDelay: '1000ms' }}>
            const [cartItems, setCartItems] =
          </div>
          <div className="absolute font-mono text-base text-[#7a7a7a] animate-pulse" style={{ top: '20%', right: '10%', animationDelay: '1500ms' }}>
            API.fetchCart();
          </div>
          <div className="absolute font-mono text-base text-[#7a7a7a] animate-pulse" style={{ bottom: '25%', left: '20%', animationDelay: '2000ms' }}>
            cartItems.map(item =&gt;
          </div>
          <div className="absolute font-mono text-base text-[#7a7a7a] animate-pulse" style={{ bottom: '15%', right: '15%', animationDelay: '2500ms' }}>
            updateQuantity(item.id);
          </div>
          <div className="absolute font-mono text-base text-[#7a7a7a] animate-pulse" style={{ top: '35%', left: '60%', animationDelay: '3000ms' }}>
            removeFromCart(item.id);
          </div>
          <div className="absolute font-mono text-base text-[#7a7a7a] animate-pulse" style={{ top: '60%', right: '25%', animationDelay: '3500ms' }}>
            total += item.price;
          </div>
          <div className="absolute font-mono text-base text-[#7a7a7a] animate-pulse" style={{ bottom: '40%', left: '40%', animationDelay: '4000ms' }}>
            setLoading(false);
          </div>
        </div>
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#4a4a4a]/40 to-transparent animate-pulse"></div>
          <div className="absolute top-2/3 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#2a2a2a]/30 to-transparent animate-pulse delay-1000"></div>
          <div className="absolute left-1/4 top-0 w-px h-full bg-gradient-to-b from-transparent via-[#4a4a4a]/30 to-transparent animate-pulse delay-500"></div>
          <div className="absolute right-1/3 top-0 w-px h-full bg-gradient-to-b from-transparent via-[#2a2a7a]/35 to-transparent animate-pulse delay-1500"></div>
        </div>
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-2 h-2 bg-[#4a4a4a]/70 rounded-full animate-ping"></div>
          <div className="absolute top-40 right-32 w-1 h-1 bg-[#2a2a7a]/80 rounded-full animate-ping delay-700"></div>
          <div className="absolute bottom-32 left-40 w-1.5 h-1.5 bg-[#4a4a7a]/60 rounded-full animate-ping delay-1200"></div>
          <div className="absolute bottom-60 right-20 w-1 h-1 bg-[#2a2a7a]/70 rounded-full animate-ping delay-2000"></div>
          <div className="absolute top-1/2 left-1/3 w-1 h-1 bg-[#4a4a7a]/90 rounded-full animate-ping delay-300"></div>
          <div className="absolute top-80 right-1/4 w-1.5 h-1.5 bg-[#2a2a7a]/50 rounded-full animate-ping delay-1800"></div>
        </div>
        <div className="absolute inset-0 opacity-15">
          <div className="absolute top-0 left-10 text-[#7a7a7a] font-mono text-base leading-6 animate-pulse">
            1<br/>0<br/>1<br/>1<br/>0<br/>1<br/>0<br/>1<br/>1<br/>0
          </div>
          <div className="absolute top-0 left-32 text-[#7a7a7a] font-mono text-base leading-6 animate-pulse delay-500">
            0<br/>1<br/>0<br/>1<br/>1<br/>0<br/>1<br/>0<br/>1<br/>1
          </div>
          <div className="absolute top-0 right-20 text-[#7a7a7a] font-mono text-base leading-6 animate-pulse delay-1000">
            1<br/>1<br/>0<br/>1<br/>0<br/>1<br/>1<br/>0<br/>1<br/>0
          </div>
          <div className="absolute top-0 right-40 text-[#7a7a7a] font-mono text-base leading-6 animate-pulse delay-1500">
            0<br/>1<br/>1<br/>0<br/>1<br/>0<br/>1<br/>1<br/>0<br/>1
          </div>
        </div>
        <div className="absolute inset-0 opacity-35">
          <div className="absolute text-[#18b5d8]/50 text-3xl animate-[float_7s_ease-in-out_infinite]" style={{ top: '5%', left: '5%' }}>
            <span role="img" aria-label="cart">🛒</span>
          </div>
          <div className="absolute text-[#ffffff]/45 text-3xl animate-[float_7s_ease-in-out_infinite]" style={{ top: '15%', right: '10%', animationDelay: '600ms' }}>
            <span role="img" aria-label="package">📦</span>
          </div>
          <div className="absolute text-[#ffffff]/40 text-2xl animate-[glow_3.5s_ease-in-out_infinite]" style={{ top: '30%', right: '20%', animationDelay: '1200ms' }}>
            <span role="img" aria-label="shopping">🛍️</span>
          </div>
          <div className="absolute text-[#18b5d8]/50 text-2xl animate-[float_7s_ease-in-out_infinite]" style={{ bottom: '25%', right: '15%', animationDelay: '1800ms' }}>
            <span role="img" aria-label="checkout">💳</span>
          </div>
          <div className="absolute text-[#7a7a7a]/45 text-3xl animate-[glow_3.5s_ease-in-out_infinite]" style={{ top: '25%', left: '20%', animationDelay: '2400ms' }}>
            <span role="img" aria-label="bag">👜</span>
          </div>
          <div className="absolute text-[#7a7a7a]/50 text-4xl animate-[float_7s_ease-in-out_infinite]" style={{ bottom: '35%', left: '25%', animationDelay: '3000ms' }}>
            <span role="img" aria-label="delivery">🚚</span>
          </div>
        </div>
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-[#4a4a7a]/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/3 right-1/3 w-40 h-40 bg-[#4a4a7a]/8 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2000ms'}}></div>
          <div className="absolute top-2/3 left-2/3 w-28 h-28 bg-[#4a4a7a]/12 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1000ms'}}></div>
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
            0%, 100% { transform: translateY(0) rotate(0deg); }
            33% { transform: translateY(-10px) rotate(1deg); }
            66% { transform: translateY(5px) rotate(-1deg); }
          }
          @keyframes glow {
            0%, 100% { filter: drop-shadow(0 0 5px rgba(24, 181, 216, 0.3)); transform: scale(1); }
            50% { filter: drop-shadow(0 0 10px rgba(24, 181, 216, 0.7)); transform: scale(1.05); }
          }
          @keyframes shimmer {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
          }
          .animate-shimmer {
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
            background-size: 200% 100%;
            animation: shimmer 2s infinite;
          }
          @media (max-width: 640px) {
            .animate-pulse:not(.essential) { animation: none; }
          }
        `}
      </style>

      <div className="relative max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-8 lg:py-16 mt-[60px] sm:mt-[80px]">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-12">
          <div className="inline-flex items-center gap-1 sm:gap-3 mb-3 sm:mb-6">
           
            <h1 className="text-xl sm:text-3xl md:text-5xl font-black text-[#18b5d8]">
              {t('cart.title')} <span className="text-[#18b5d8]">{t('cart.yourCart')}</span>
            </h1>
            
          </div>
          <p className="text-sm sm:text-xl text-gray-300 max-w-3xl mx-auto px-2 sm:px-4">
            {t('cart.description')}
          </p>
        </div>

        {/* Clear Cart Button */}
        {cartItems.length > 0 && (
          <div className="relative flex mb-6 sm:mb-12 justify-center">
            <button
              onClick={clearCart}
              className="relative flex items-center gap-1 sm:gap-2 px-4 sm:px-8 py-2 sm:py-4 bg-gradient-to-r from-red-500 to-red-600 text-white font-bold rounded-xl sm:rounded-2xl hover:from-red-600 hover:to-red-700 transition-all duration-300 transform hover:scale-105 shadow-xl text-sm sm:text-base"
              aria-label={t('cart.clearCartAriaLabel')}
            >
              <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
              {t('cart.clearCart')}
            </button>
          </div>
        )}

        {/* Loading State */}
        {isInitialLoading && (
      <LoadingSpinner />
        )}

        {/* Empty Cart State */}
        {!isInitialLoading && filteredCartItems.length === 0 && (
          <div className="text-center py-16 px-4">
            <div className="relative w-20 h-20 mx-auto mb-8">
              <div className="absolute -inset-2 bg-gradient-to-br from-[#18b5d8]/30 to-[#16a2c7]/30 blur-sm transition-all duration-500" style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}></div>
              <div className="absolute inset-0 bg-gradient-to-br from-[#18b5d8]/20 to-[#16a2c7]/10 backdrop-blur-md border border-[#18b5d8]/30 transition-all duration-500" style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}></div>
              <div className="absolute inset-2 bg-gradient-to-br from-[#18b5d8]/15 to-transparent transition-all duration-700" style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <CartIcon className="w-10 h-10 text-[#18b5d8] animate-[glow_3.5s_ease-in-out_infinite]" />
              </div>
            </div>
            <h3 className="text-2xl font-black text-white mb-4">{t('cart.emptyTitle')}</h3>
            <p className="text-lg text-gray-300 mb-8 max-w-md mx-auto">
              {t('cart.emptyDescription')}
            </p>
            <div className="space-y-4 max-w-sm mx-auto">
              <Link
                to="/products"
                className="block w-full btn-pro btn-pro-lg"
                aria-label={t('cart.browseProducts')}
              >
                {t('cart.browseProducts')}
              </Link>
              <Link
                to="/"
                className="block w-full btn-pro-outline btn-pro-lg"
                aria-label={t('cart.backToHome')}
              >
                {t('cart.backToHome')}
              </Link>
            </div>
          </div>
        )}

        {/* Cart Items and Order Summary */}
        {!isInitialLoading && filteredCartItems.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-10 lg:gap-12">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4 sm:space-y-10">
              {filteredCartItems.map((item) => (
                <div
                  key={item.id}
                  className="w-full bg-white/5 backdrop-blur-2xl rounded-2xl sm:rounded-3xl shadow-2xl border border-white/20 overflow-hidden group hover:border-[#18b5d8]/50 hover:shadow-[0_0_20px_rgba(24,181,216,0.5)] transition-all duration-500 transform hover:-translate-y-1 relative"
                >
                  {/* Skip rendering if product data is invalid */}
                  {!item.product && (
                    <div className="p-8 text-center text-red-400">
                      <p>Product data is unavailable</p>
                    </div>
                  )}
                  {item.product && (
                    <>
                      {/* Decorative Circle */}
                      <div className="absolute top-0 right-0 w-16 h-16 sm:w-32 sm:h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 animate-pulse"></div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-6 p-4 sm:p-8 relative z-10">
                        {/* Product Image */}
                        <div className="md:col-span-1 order-1 relative">
                          <img
                            src={buildImageUrl(item.product?.mainImage || '')}
                            alt={item.product?.name || 'Product'}
                            loading="lazy"
                            className="w-full h-32 sm:h-48 object-cover rounded-xl sm:rounded-2xl border-2 border-[#18b5d8]/40 shadow-lg group-hover:border-[#18b5d8] transition-all duration-300 transform hover:scale-105"
                            onError={(e) => (e.currentTarget.src = 'https://tse1.mm.bing.net/th/id/OIP.M6p4cLkcKW9PWIObAjYi8gHaHa?cb=ucfimg2ucfimg=1&rs=1&pid=ImgDetMain&o=7&rm=3')}
                          />
                        </div>

                        {/* Product Info */}
                        <div className="md:col-span-2 order-2 flex flex-col justify-between">
                          <div>
                            <h3 className="text-lg sm:text-xl font-black text-white mb-1 sm:mb-2 line-clamp-2 hover:text-[#18b5d8] transition-colors duration-300">
                              {item.product?.name || 'Product Name Unavailable'}
                            </h3>
                            {item.product?.description && Array.isArray(item.product.description) && item.product.description.length > 0 && (
                              <div className="text-gray-300 text-xs sm:text-sm mb-2 sm:mb-3">
                                {item.product.description.map((desc: any, idx: number) => (
                                  <div key={idx} dangerouslySetInnerHTML={{ __html: desc.text || '' }} />
                                ))}
                              </div>
                            )}
                            
                            {/* Price Breakdown */}
                            <div className="mb-3 sm:mb-4 p-3 sm:p-4 bg-gradient-to-r from-[#18b5d8]/10 to-[#16a2c7]/10 rounded-lg sm:rounded-xl border border-[#18b5d8]/30">
                              <div className="space-y-2">
                                {/* Base Price */}
                                <div className="flex justify-between items-center">
                                  <span className="text-gray-300 text-xs sm:text-sm font-medium">{t('base_price')}:</span>
                                  <PriceDisplay 
                                    price={(item.product?.price || 0) * item.quantity} 
                                    className="text-sm sm:text-base font-bold text-white"
                                  />
                                </div>
                                
                                {/* Product Options Price */}
                                {item.productOptionsPriceModifier && item.productOptionsPriceModifier > 0 && (
                                  <div className="flex justify-between items-center">
                                    <span className="text-gray-300 text-xs sm:text-sm font-medium">{t('product_options')}:</span>
                                    <PriceDisplay 
                                      price={item.productOptionsPriceModifier * item.quantity} 
                                      className="text-sm sm:text-base font-bold text-[#18b5d8]"
                                    />
                                  </div>
                                )}
                                
                                {/* Add-ons Price */}
                                {item.addOnsPrice && item.addOnsPrice > 0 && (
                                  <div className="flex justify-between items-center">
                                    <span className="text-gray-300 text-xs sm:text-sm font-medium">{t('addons')}:</span>
                                    <PriceDisplay 
                                      price={item.addOnsPrice * item.quantity} 
                                      className="text-sm sm:text-base font-bold text-[#16a2c7]"
                                    />
                                  </div>
                                )}
                                
                                {/* Total Price */}
                                <div className="border-t border-white/20 pt-2 mt-2">
                                  <div className="flex justify-between items-center">
                                    <span className="text-white text-sm sm:text-base font-bold">{t('total')}:</span>
                                    <PriceDisplay 
                                      price={(() => {
                                        const basePrice = (item.product?.price || 0) * item.quantity;
                                        const optionsPrice = (item.productOptionsPriceModifier || 0) * item.quantity;
                                        const addOnsPrice = (item.addOnsPrice || 0) * item.quantity;
                                        return basePrice + optionsPrice + addOnsPrice;
                                      })()} 
                                      originalPrice={item.product?.originalPrice && item.product.originalPrice > (item.product?.price || 0) ? (item.product.originalPrice * item.quantity) : undefined}
                                      className="text-lg sm:text-xl font-black text-[#18b5d8]"
                                      size="lg"
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Quantity Controls */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 sm:gap-4 bg-white/10 rounded-full p-1 sm:p-2">
                              <button
                                type="button"
                                onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                                className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gradient-to-r from-[#18b5d8] to-[#16a2c7] text-white hover:from-[#16a2c7] hover:to-[#18b5d8] transition-all duration-300 flex items-center justify-center shadow-lg hover:shadow-[#18b5d8]/50 disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={item.quantity <= 1}
                                aria-label={t('cart.decreaseQuantity')}
                              >
                                <Minus className="w-3 h-3 sm:w-4 sm:h-4" />
                              </button>
                              <span className="text-white font-bold text-sm sm:text-base min-w-[2rem] sm:min-w-[2.5rem] text-center">
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gradient-to-r from-[#18b5d8] to-[#16a2c7] text-white hover:from-[#16a2c7] hover:to-[#18b5d8] transition-all duration-300 flex items-center justify-center shadow-lg hover:shadow-[#18b5d8]/50 disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={item.quantity >= 10}
                                aria-label={t('cart.increaseQuantity')}
                              >
                                <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                              </button>
                            </div>

                            {/* Remove Button */}
                            <button
                              type="button"
                              onClick={() => removeFromCart(item.id)}
                              className="flex items-center gap-1 sm:gap-2 text-red-400 hover:text-red-300 transition-colors font-bold text-sm sm:text-base"
                              aria-label={`${t('cart.removeFromCart')} ${item.product?.name || 'Product'}`}
                            >
                              <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                              {t('cart.removeFromCart')}
                            </button>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white/5 backdrop-blur-2xl rounded-2xl sm:rounded-3xl shadow-2xl border border-white/20 overflow-hidden group hover:border-[#18b5d8]/50 hover:shadow-[0_0_20px_rgba(24,181,216,0.5)] transition-all duration-500 sticky top-20 sm:top-24 relative">
                {/* Decorative Circle */}
                <div className="absolute -top-4 -left-4 w-16 h-16 sm:w-24 sm:h-24 bg-white/10 rounded-full animate-pulse"></div>
                <div className="bg-gradient-to-r from-[#18b5d8] to-[#16a2c7] px-4 sm:px-6 py-3 sm:py-5 relative z-10">
                  <h3 className="text-lg sm:text-2xl font-black text-white flex items-center gap-1 sm:gap-2">
                    <Package className="w-4 h-4 sm:w-6 sm:h-6" />
                    {t('cart.orderSummary')}
                  </h3>
                </div>
                <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 relative z-10">
                  {serverLoyaltyAvailable !== null && (
                    <div className="flex justify-between items-center p-3 sm:p-4 bg-white/5 rounded-lg sm:rounded-xl border border-white/10">
                      <span className="text-gray-300 font-medium text-sm sm:text-base">نقاط الولاء المتاحة:</span>
                      <span className="text-white font-black text-base sm:text-lg">{serverLoyaltyAvailable}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center p-3 sm:p-4 bg-white/5 rounded-lg sm:rounded-xl border border-white/10 hover:bg-white/10 transition-all duration-300">
                    <span className="text-gray-300 font-medium text-sm sm:text-base">{t('cart.subtotal')}:</span>
                    <PriceDisplay price={subtotal} className="font-black text-white text-base sm:text-lg" />
                  </div>

                  <div className="border-t-2 border-[#18b5d8]/30 pt-3 sm:pt-4">
                    {serverLoyaltyDiscount && serverLoyaltyDiscount > 0 && (
                      <div className="flex justify-between items-center p-3 sm:p-4 bg-purple-500/10 rounded-lg border border-purple-500/20 mb-2">
                        <span className="text-purple-400 font-medium text-sm sm:text-base">خصم نقاط الولاء</span>
                        <PriceDisplay price={-serverLoyaltyDiscount} className="font-black text-purple-400 text-base sm:text-lg" />
                      </div>
                    )}
                    <div className="flex justify-between items-center p-4 sm:p-6 bg-gradient-to-r from-[#18b5d8]/20 to-[#16a2c7]/20 rounded-xl sm:rounded-2xl border-2 border-[#18b5d8]/30">
                      <span className="font-black text-white text-lg sm:text-xl">{t('cart.total')}:</span>
                      <PriceDisplay price={total} className="text-2xl sm:text-3xl font-black text-[#18b5d8]" />
                    </div>
                  </div>
                  <button
                    onClick={proceedToCheckout}
                    className="w-full bg-gradient-to-r from-[#18b5d8] to-[#16a2c7] text-white font-black py-3 sm:py-4 rounded-xl sm:rounded-2xl hover:from-[#16a2c7] hover:to-[#18b5d8] transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 transform flex items-center justify-center gap-1 sm:gap-2 text-sm sm:text-base"
                    aria-label={t('cart.proceedToCheckout')}
                  >
                    <ArrowRight className={`w-4 h-4 sm:w-5 sm:h-5 ${isRTL ? 'rotate-180' : ''}`} />
                    {t('cart.proceedToCheckout')}
                  </button>
                  <Link
                    to="/products"
                    className="block w-full text-center mt-3 sm:mt-4 text-gray-300 hover:text-[#18b5d8] transition-colors font-bold text-sm sm:text-base"
                    aria-label={t('cart.continueShopping')}
                  >
                    {t('cart.continueShopping')}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Auth Modals */}
        {showAuthModal && (
          <AuthModal
            isOpen={showAuthModal}
            onClose={() => setShowAuthModal(false)}
            onLoginSuccess={() => {
              setShowAuthModal(false);
            }}
          />
        )}
        {showCheckoutAuthModal && (
          <CheckoutAuthModal
            isOpen={showCheckoutAuthModal}
            onClose={() => setShowCheckoutAuthModal(false)}
            onContinueAsGuest={() => {
              setShowCheckoutAuthModal(false);
              navigate('/checkout');
            }}
            onLoginSuccess={() => {
              setShowCheckoutAuthModal(false);
              navigate('/checkout');
            }}
          />
        )}
      </div>
    </section>
  );
};

export default ShoppingCart;