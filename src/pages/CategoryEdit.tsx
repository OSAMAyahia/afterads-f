import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { smartToast } from '../utils/toastConfig';
import { apiCall, API_ENDPOINTS, buildApiUrl, buildImageUrl } from '../config/api';
import Spinner from '../components/ui/Spinner';

interface Category {
  id: number;
  name: string;
  description: string;
  image: string;
  createdAt: string;
}

const CategoryEdit: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [category, setCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image: null as File | null
  });

  useEffect(() => {
    fetchCategory();
  }, [id]);

  const fetchCategory = async () => {
    if (!id) return;
    
    try {
      setFetchLoading(true);
      const data = await apiCall(API_ENDPOINTS.CATEGORY_BY_ID(id));
      setCategory(data);
      setFormData({
        name: data.name,
        description: data.description,
        image: null
      });
    } catch (error) {
      console.error('Error:', error);
      smartToast.dashboard.error('فشل في جلب بيانات التصنيف');
      navigate('/admin?tab=categories');
    } finally {
      setFetchLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const submitData = new FormData();
      submitData.append('name', formData.name);
      submitData.append('description', formData.description);
      
      if (formData.image) {
        submitData.append('mainImage', formData.image);
      }

      const response = await fetch(buildApiUrl(API_ENDPOINTS.CATEGORY_BY_ID(id!)), {
        method: 'PUT',
        body: submitData
      });

      if (!response.ok) {
        throw new Error('فشل في تحديث التصنيف');
      }

      smartToast.dashboard.success('تم تحديث التصنيف بنجاح!');
      // Trigger a refresh in the main app
      window.dispatchEvent(new Event('categoriesUpdated'));
      navigate('/admin?tab=categories');
    } catch (error) {
      console.error('Error:', error);
      smartToast.dashboard.error('فشل في تحديث التصنيف');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData(prev => ({
        ...prev,
        image: e.target.files![0]
      }));
    }
  };

  if (fetchLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4" dir="rtl">
        <div className="text-center">
          <Spinner size={32} primaryColor="#ea580c" secondaryColor="#ea580c" trackColor="rgba(234, 88, 12, 0.2)" />
          <p className="text-gray-600 text-sm sm:text-base">جارٍ تحميل بيانات التصنيف...</p>
        </div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4" dir="rtl">
        <div className="text-center">
          <Spinner size={32} primaryColor="#ea580c" secondaryColor="#ea580c" trackColor="rgba(234, 88, 12, 0.2)" />
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">جاري التحميل...</h2>
          <p className="text-gray-600 text-sm">يتم تحميل بيانات التصنيف</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50" dir="rtl">
      {/* Top Navigation */}
      <div className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between h-auto sm:h-16 py-3 sm:py-0 gap-3 sm:gap-0">
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
              <Link to="/admin?tab=categories" className="flex items-center text-gray-600 hover:text-orange-600 transition-colors text-sm sm:text-base">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                العودة إلى التصنيفات
              </Link>
              <div className="hidden sm:block h-6 w-px bg-gray-300"></div>
              <div className="flex items-center">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg flex items-center justify-center text-white text-xs sm:text-sm font-bold ml-2 sm:ml-3">
                  ✏️
                </div>
                <div>
                  <h1 className="text-base sm:text-lg font-bold text-gray-900">تعديل التصنيف: {category.name}</h1>
                  <p className="text-xs sm:text-sm text-gray-500">تحديث بيانات ومعلومات التصنيف</p>
                </div>
              </div>
            </div>
            <div className="bg-orange-100 text-orange-600 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium">
              📂 تعديل التصنيف
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto py-6 sm:py-8 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-4 sm:px-6 py-3 sm:py-4">
                <h2 className="text-base sm:text-lg font-bold text-white flex items-center">
                  <span className="w-5 h-5 sm:w-6 sm:h-6 bg-white bg-opacity-30 rounded-lg flex items-center justify-center text-orange-600 text-xs sm:text-sm ml-2 sm:ml-3">📝</span>
                  تحديث معلومات التصنيف
                </h2>
              </div>

              <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                {/* اسم التصنيف */}
                <div>
                  <label htmlFor="name" className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2 sm:mb-3">
                    اسم التصنيف *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 shadow-sm transition-all duration-200 text-sm sm:text-base"
                    placeholder="أدخل اسم التصنيف"
                  />
                </div>

                {/* وصف التصنيف */}
                <div>
                  <label htmlFor="description" className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2 sm:mb-3">
                    وصف التصنيف *
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    required
                    rows={6}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 shadow-sm transition-all duration-200 resize-none"
                    placeholder="أدخل وصف مفصل للتصنيف وما يحتويه من منتجات"
                  />
                </div>

                {/* أزرار الحفظ والإلغاء */}
                <div className="flex gap-4 pt-6 border-t border-gray-200">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 flex items-center justify-center px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:from-orange-600 hover:to-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 font-semibold shadow-lg"
                  >
                    {loading ? (
                      <>
                        <Spinner
                          size={20}
                          className="-ml-1 mr-3"
                          primaryColor="#ffffff"
                          secondaryColor="#ffffff"
                          trackColor="rgba(255, 255, 255, 0.3)"
                        />
                        جارٍ التحديث...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        تحديث التصنيف
                      </>
                    )}
                  </button>
                  
                  <Link
                    to="/admin?tab=categories"
                    className="flex-1 px-6 py-3 text-gray-700 bg-gray-200 rounded-xl hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all duration-200 font-medium text-center"
                  >
                    إلغاء
                  </Link>
                </div>
              </form>
            </div>
          </div>

          {/* Image Upload Sidebar */}
          <div className="space-y-6">
            {/* Current & New Image */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-purple-500 to-purple-600 px-6 py-4">
                <h2 className="text-lg font-bold text-white flex items-center">
                  <span className="w-6 h-6 bg-white bg-opacity-30 rounded-lg flex items-center justify-center text-purple-600 text-sm ml-3">🖼️</span>
                  صورة التصنيف
                </h2>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Current Image */}
                {category.image && !formData.image && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">الصورة الحالية</h4>
                    <div className="relative">
                      <img
                        src={buildImageUrl(category.image)}
                        alt={category.name}
                        className="w-full h-48 object-cover rounded-xl shadow-md border border-gray-200"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-40 rounded-xl flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                        <p className="text-white text-sm font-medium">انقر أدناه لتغيير الصورة</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* New Image Preview */}
                {formData.image && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">الصورة الجديدة</h4>
                    <div className="relative">
                      <img
                        src={URL.createObjectURL(formData.image)}
                        alt="معاينة"
                        className="w-full h-48 object-cover rounded-xl shadow-md border border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, image: null }))}
                        className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors shadow-lg"
                        title="إزالة الصورة الجديدة"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    <div className="text-center mt-2">
                      <p className="text-sm font-medium text-gray-900">{formData.image.name}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {(formData.image.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                )}

                {/* Upload New Image */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">
                    {category.image && !formData.image ? 'تغيير الصورة' : 'رفع صورة جديدة'}
                  </h4>
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-purple-400 transition-colors">
                    <input
                      id="image"
                      name="image"
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleImageChange}
                    />
                    <label htmlFor="image" className="cursor-pointer">
                      <div className="text-purple-500 mb-3">
                        <svg className="mx-auto h-12 w-12" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                          <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-gray-900">اختر صورة جديدة</p>
                        <p className="text-xs text-gray-500">PNG, JPG, GIF حتى 10MB</p>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Category Info */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 border border-green-200">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center text-white text-sm flex-shrink-0">
                  📊
                </div>
                <div>
                  <h3 className="font-semibold text-green-900 mb-2">معلومات التصنيف</h3>
                  <div className="text-sm text-green-800 space-y-1">
                    <p>• تاريخ الإنشاء: {category.createdAt ? new Date(category.createdAt).toLocaleDateString('ar-SA') : 'غير محدد'}</p>
                    <p>• رقم التصنيف: #{category.id}</p>
                    <p>• حالة الصورة: {category.image ? 'متوفرة' : 'غير متوفرة'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryEdit;
