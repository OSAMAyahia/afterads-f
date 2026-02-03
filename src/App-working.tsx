import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { smartToast } from './utils/toastConfig';
import 'react-toastify/dist/ReactToastify.css';
import { ChevronLeft, Package, Sparkles } from 'lucide-react';
import { createCategorySlug } from './utils/slugify';
import { apiCall, API_ENDPOINTS, buildImageUrl } from './config/api';
import PriceDisplay from './components/ui/PriceDisplay';
import Spinner from './components/ui/Spinner';

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  isAvailable: boolean;
  categoryId: number | null;
  productType?: string;
  mainImage: string;
  detailedImages?: string[];
  createdAt?: string;
}

interface Category {
  id: number;
  name: string;
  description: string;
  image: string;
}

const App: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      console.log('🔄 Fetching data...');
      
      // جلب التصنيفات
      const categoriesData = await apiCall(API_ENDPOINTS.CATEGORIES);
      console.log('✅ Categories fetched:', categoriesData.length);
      setCategories(categoriesData);
      
      // جلب المنتجات
      const productsData = await apiCall(API_ENDPOINTS.PRODUCTS);
      console.log('✅ Products fetched:', productsData.length);
      setProducts(productsData);
      
      setError('');
      smartToast.frontend.success(`تم تحميل ${categoriesData.length} تصنيف و ${productsData.length} منتج بنجاح!`);
    } catch (error) {
      console.error('❌ Error fetching data:', error);
      setError(error instanceof Error ? error.message : 'خطأ في تحميل البيانات');
      smartToast.frontend.error('فشل في تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-rose-50 flex items-center justify-center">
        <div className="text-center">
          <Spinner size={128} primaryColor="#ec4899" secondaryColor="#ec4899" trackColor="rgba(236, 72, 153, 0.2)" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">جاري التحميل...</h2>
          <p className="text-gray-600">يرجى الانتظار</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-2xl shadow-xl max-w-md">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-red-600 mb-4">خطأ في التحميل</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button 
            onClick={fetchData}
            className="bg-pink-500 text-white px-6 py-3 rounded-lg hover:bg-pink-600 transition-colors"
          >
            إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-50" dir="rtl">
      <ToastContainer 
        position="top-center"
        autoClose={4000}
        hideProgressBar={false}
        newestOnTop={true}
        closeOnClick
        rtl
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
        limit={3}
        containerId="main-toast-container"
        style={{ 
          zIndex: 999999,
          top: '80px',
          fontSize: '16px'
        }}
        toastStyle={{
          minHeight: '60px',
          fontSize: '16px'
        }}
      />
      
      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-pink-100/40 via-rose-50/30 to-pink-100/40" />
        <div className="relative container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-4 mb-6">
            <Sparkles className="w-8 h-8 text-pink-500 animate-pulse" />
            <h1 className="text-4xl md:text-6xl font-black bg-gradient-to-r from-pink-600 via-rose-600 to-pink-600 bg-clip-text text-transparent">
              مرحباً بكم في متجرنا
            </h1>
            <Sparkles className="w-8 h-8 text-pink-500 animate-pulse" />
          </div>
          <div className="h-1 bg-gradient-to-r from-pink-400 via-rose-500 to-pink-400 rounded-full mb-8 mx-auto w-64 shadow-lg" />
          <p className="text-xl text-gray-700 font-medium max-w-2xl mx-auto leading-relaxed">
            اكتشف تشكيلة متنوعة من المنتجات عالية الجودة
          </p>
          <div className="flex items-center justify-center gap-2 mt-6 bg-white/80 backdrop-blur-xl border border-pink-200/50 px-6 py-3 rounded-2xl shadow-lg">
            <Package className="w-5 h-5 text-pink-500" />
            <span className="text-gray-700 font-semibold">{categories.length} مجموعة متاحة</span>
          </div>
        </div>
      </section>
      
      {/* Categories Section */}
      <section className="relative py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">مجموعاتنا المميزة</h2>
            <div className="h-1 bg-gradient-to-r from-pink-400 via-rose-500 to-pink-400 rounded-full mb-6 mx-auto w-32 shadow-lg" />
          </div>
          
          {categories.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {categories.map((category, index) => (
                <div key={category.id} className="relative group">
                  <Link to={`/category/${createCategorySlug(category.id, category.name)}`}>
                    <div className="bg-white rounded-2xl overflow-hidden border border-pink-200/60 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
                      <div className="relative h-48 overflow-hidden">
                        <img
                          src={buildImageUrl(category.image)}
                          alt={category.name}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          onError={(e) => {
                            e.currentTarget.src = `https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=300&fit=crop&crop=center&auto=format,compress&q=60&ixlib=rb-4.0.3`;
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-pink-900/60 via-pink-500/20 to-transparent" />
                        <div className="absolute top-4 right-4 w-8 h-8 bg-gradient-to-br from-pink-500 to-rose-500 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg">
                          {index + 1}
                        </div>
                      </div>
                      
                      <div className="p-6 text-center">
                        <h3 className="text-lg font-bold text-gray-800 mb-2">
                          {category.name}
                        </h3>
                        <div className="h-0.5 bg-gradient-to-r from-transparent via-pink-400 to-transparent rounded-full mb-3 mx-auto w-12" />
                        <p className="text-sm text-gray-600 leading-relaxed mb-4 line-clamp-2">
                          {category.description || 'اكتشف مجموعة متنوعة من المنتجات عالية الجودة'}
                        </p>
                        <div className="bg-gradient-to-r from-pink-500 to-rose-500 text-white px-4 py-2 rounded-xl font-medium hover:from-pink-600 hover:to-rose-600 shadow-lg inline-flex items-center gap-2 transition-all duration-300 hover:shadow-xl hover:scale-105">
                          <span>استكشف المجموعة</span>
                          <ChevronLeft className="w-4 h-4" />
                        </div>
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="bg-white rounded-2xl p-12 border border-gray-200 shadow-xl max-w-lg mx-auto">
                <Package className="w-16 h-16 text-gray-400 mx-auto mb-6" />
                <h3 className="text-xl font-bold text-gray-800 mb-4">لا توجد مجموعات حالياً</h3>
                <p className="text-gray-600">سيتم إضافة مجموعات جديدة قريباً</p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Products Section */}
      <section className="relative py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">أحدث المنتجات</h2>
            <div className="h-1 bg-gradient-to-r from-pink-400 via-rose-500 to-pink-400 rounded-full mb-6 mx-auto w-32 shadow-lg" />
            <p className="text-gray-600">اكتشف أحدث إضافاتنا من المنتجات المميزة</p>
          </div>
          
          {products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.slice(0, 8).map((product) => (
                <div key={product.id} className="bg-white rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={buildImageUrl(product.mainImage)}
                      alt={product.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = `https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=300&fit=crop&crop=center&auto=format,compress&q=60&ixlib=rb-4.0.3`;
                      }}
                    />
                    <div className="absolute top-3 left-3 bg-pink-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
                      جديد
                    </div>
                  </div>
                  
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2 line-clamp-1">
                      {product.name}
                    </h3>
                    <div className="flex items-center justify-center gap-1 mb-3">
                      <PriceDisplay 
                        price={product.price} 
                        originalPrice={product.originalPrice}
                        className="text-lg font-bold text-pink-600"
                      />
                    </div>
                    <Link
                      to={`/product/${product.id}`}
                      className="w-full bg-gradient-to-r from-pink-500 to-rose-500 text-white py-2 rounded-lg font-semibold hover:from-pink-600 hover:to-rose-600 transition-all duration-200 flex items-center justify-center gap-2"
                    >
                      <span>عرض التفاصيل</span>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="bg-white rounded-2xl p-12 border border-gray-200 shadow-xl max-w-lg mx-auto">
                <Package className="w-16 h-16 text-gray-400 mx-auto mb-6" />
                <h3 className="text-xl font-bold text-gray-800 mb-4">لا توجد منتجات حالياً</h3>
                <p className="text-gray-600">سيتم إضافة منتجات جديدة قريباً</p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div className="text-center md:text-right">
              <h3 className="text-xl font-bold mb-4">AfterAds</h3>
              <p className="text-gray-300">
                متجرك المفضل لأفضل المنتجات بجودة عالية وتصميم فاخر
              </p>
            </div>
            
            <div className="text-center">
              <h4 className="font-bold mb-4">روابط سريعة</h4>
              <ul className="space-y-2">
                <li><Link to="/" className="text-gray-300 hover:text-white transition-colors">الرئيسية</Link></li>
                <li><Link to="/products" className="text-gray-300 hover:text-white transition-colors">المنتجات</Link></li>
                <li><Link to="/about" className="text-gray-300 hover:text-white transition-colors">من نحن</Link></li>
                <li><Link to="/contact" className="text-gray-300 hover:text-white transition-colors">اتصل بنا</Link></li>
              </ul>
            </div>
            
            <div className="text-center md:text-left">
              <h4 className="font-bold mb-4">تواصل معنا</h4>
              <div className="space-y-2">
                <p className="text-gray-300">📞 +966547493606</p>
                <p className="text-gray-300">✉️ info@afterads.</p>
                <p className="text-gray-300">📍 المملكة العربية السعودية</p>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-700 pt-6 text-center">
            <p className="text-gray-300">
              © 2025 GHEM.STORE. جميع الحقوق محفوظة.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
