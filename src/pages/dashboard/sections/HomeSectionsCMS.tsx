import React, { useEffect, useMemo, useState } from 'react';
import { Eye, EyeOff, Settings, FileText, Layout } from 'lucide-react';
import { useApiQuery } from '../../../hooks/useApiQuery';
import { API_ENDPOINTS, apiCall } from '../../../config/api';
import { useQueryClient } from '@tanstack/react-query';
import smartToast from '../../../utils/toastConfig';
import { ModernToggle } from '../../../components/ui';

type VisibilityMap = Record<string, boolean>;

const HOME_SECTIONS_STORAGE_KEY = 'ui_home_sections_visibility';

const HomeSectionsCMS: React.FC = () => {
  const queryClient = useQueryClient();
  const { data: savedResp } = useApiQuery<any>({
    endpoint: API_ENDPOINTS.HOME_SECTIONS_VISIBILITY,
    queryKey: ['home-sections-visibility'],
    staleTime: Infinity
  });

  const defaultSections: VisibilityMap = useMemo(() => ({
    hero: true,
    heroThemeButton: true,
    heroMoreDetailsButton: true,
    themes: true,
    services: true,
    categories: true,
    testimonials: true,
    clients: true,
    faq: true,
    contact: true,
  }), []);

  const labels: Record<string, string> = useMemo(() => ({
    hero: 'قسم البداية (Hero)',
    heroThemeButton: 'زر "عرض الثيم"',
    heroMoreDetailsButton: 'زر "تفاصيل أكثر"',
    themes: 'معرض الثيمات',
    services: 'قسم "لماذا نحن"',
    categories: 'قسم الخدمات الرئيسية',
    testimonials: 'آراء العملاء ومراجعاتهم',
    clients: 'معرض شركاء النجاح',
    faq: 'قسم الأسئلة الشائعة',
    contact: 'نموذج تواصل معنا',
  }), []);

  const [sections, setSections] = useState<VisibilityMap>(defaultSections);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const obj = Array.isArray(savedResp) ? savedResp[0] : (savedResp?.data ?? savedResp);
    if (obj?.sections && typeof obj.sections === 'object') {
      setSections({ ...defaultSections, ...obj.sections });
      try {
        localStorage.setItem(HOME_SECTIONS_STORAGE_KEY, JSON.stringify(obj.sections));
      } catch { }
      return;
    }
    try {
      const raw = localStorage.getItem(HOME_SECTIONS_STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : null;
      if (parsed && typeof parsed === 'object') {
        setSections({ ...defaultSections, ...parsed });
        return;
      }
    } catch { }
    setSections(defaultSections);
  }, [defaultSections, savedResp]);

  const toggleItem = (key: string, value: boolean) => {
    setSections(prev => ({ ...prev, [key]: value }));
  };

  const setAll = (value: boolean) => {
    setSections(prev => Object.keys(prev).reduce((acc: VisibilityMap, k) => {
      acc[k] = value;
      return acc;
    }, {}));
  };

  const save = async () => {
    try {
      setSaving(true);
      await apiCall(API_ENDPOINTS.HOME_SECTIONS_VISIBILITY, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sections })
      });
      try {
        localStorage.setItem(HOME_SECTIONS_STORAGE_KEY, JSON.stringify(sections));
      } catch { }
      queryClient.setQueryData(['home-sections-visibility'], { sections });
      queryClient.invalidateQueries({ queryKey: ['home-sections-visibility'] });
      smartToast.dashboard.success('تم حفظ إعدادات أقسام الرئيسية بنجاح');
    } catch (e) {
      smartToast.dashboard.error('حدث خطأ أثناء حفظ الإعدادات');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen" dir="rtl">
      {/* Header Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#203f61] to-[#2a537e] text-white rounded-2xl p-8 shadow-2xl">
        <div className="absolute top-0 right-0 -u-translate-x-1/2 translate-y-1/2 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10">
              <Layout className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-3xl font-extrabold tracking-tight mb-2">تخصيص الصفحة الرئيسية</h2>
              <p className="text-gray-200 font-medium">تحكم كامل في ظهور العناصر والأقسام لمنح زوارك أفضل تجربة</p>
            </div>
          </div>
          <button
            onClick={save}
            disabled={saving}
            className="flex items-center gap-2 bg-white text-[#203f61] px-6 py-3 rounded-xl hover:bg-gray-100 transition-all font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:transform-none"
          >
            <FileText className={`w-5 h-5 ${saving ? 'animate-pulse' : ''}`} />
            {saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
          </button>
        </div>
      </div>

      {/* Content Section */}
      <div className="bg-white rounded-[2rem] shadow-xl shadow-blue-900/5 border border-gray-100 overflow-hidden">
        <div className="px-8 py-6 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-2 h-8 bg-blue-600 rounded-full" />
            <h3 className="text-xl font-bold text-gray-800">إدارة ظهور الأقسام</h3>
          </div>
          <div className="flex items-center gap-3 bg-white p-1 rounded-xl shadow-sm border border-gray-200/50">
            <button
              onClick={() => setAll(true)}
              className="px-4 py-2 text-sm font-bold text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-100"
            >
              تفعيل الكل
            </button>
            <div className="w-px h-6 bg-gray-200" />
            <button
              onClick={() => setAll(false)}
              className="px-4 py-2 text-sm font-bold text-gray-500 hover:bg-gray-50 rounded-lg transition-colors border border-transparent hover:border-gray-200"
            >
              إخفاء الكل
            </button>
          </div>
        </div>

        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(sections).map(([key, visible]) => (
            <div
              key={key}
              className={`
                flex items-center justify-between p-5 rounded-2xl border transition-all duration-300
                ${visible
                  ? 'bg-blue-50/30 border-blue-100 shadow-sm'
                  : 'bg-gray-50 border-gray-100 grayscale-[0.5]'
                }
                hover:shadow-md hover:border-blue-200 group
              `}
            >
              <div className="flex items-center gap-4">
                <div className={`
                  p-3 rounded-xl transition-colors duration-300
                  ${visible ? 'bg-blue-100 text-blue-600' : 'bg-gray-200 text-gray-400'}
                `}>
                  {visible ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                </div>
                <div className="flex flex-col">
                  <span className={`text-base font-bold transition-colors ${visible ? 'text-gray-800' : 'text-gray-500'}`}>
                    {labels[key] || key}
                  </span>
                  <span className="text-xs text-gray-400 font-medium">{visible ? 'مرئي حالياً' : 'مخفي عن الزوار'}</span>
                </div>
              </div>

              <ModernToggle
                checked={visible}
                onChange={(val) => toggleItem(key, val)}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HomeSectionsCMS;
