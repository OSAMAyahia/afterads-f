import React, { useEffect, useMemo, useState } from 'react';
import { Eye, EyeOff, Settings, FileText } from 'lucide-react';
import { useApiQuery } from '../../../hooks/useApiQuery';
import { API_ENDPOINTS, apiCall } from '../../../config/api';
import { useQueryClient } from '@tanstack/react-query';
import smartToast from '../../../utils/toastConfig';

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
    hero: 'البداية',
    heroThemeButton: 'زر "عرض الثيم"',
    heroMoreDetailsButton: 'زر "تفاصيل أكثر"',
    themes: 'ثيم ملاك',
    services: 'لماذا نحن',
    categories: 'الخدمات',
    testimonials: 'آراء العملاء',
    clients: 'عملاؤنا',
    faq: 'الأسئلة الشائعة',
    contact: 'اتصل بنا',
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
      smartToast.dashboard.success('تم حفظ إعدادات أقسام الرئيسية');
    } catch (e) {
      smartToast.dashboard.error('حدث خطأ أثناء الحفظ');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6" dir="rtl">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="bg-gradient-to-r from-[#203f61] to-[#2a537e] text-white rounded-2xl p-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold text-white flex items-center gap-3 mb-2">
                <Settings className="w-8 h-8" />
                CMS أقسام الرئيسية
              </h2>
              <p className="text-gray-200">تحكم في إظهار أو إخفاء كل قسم في الصفحة الرئيسية</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={save} disabled={saving} className="flex items-center gap-2 bg-white bg-opacity-20 text-white px-6 py-3 rounded-xl hover:bg-opacity-30 transition-all duration-300 font-medium border border-white/30 shadow-lg hover:shadow-xl transform hover:scale-105 backdrop-blur-sm">
                <FileText className="w-5 h-5" />
                حفظ الإعدادات
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">أقسام الصفحة الرئيسية</h3>
            <div className="flex items-center gap-2">
              <button onClick={() => setAll(true)} className="px-3 py-1.5 text-xs rounded-md bg-gray-100 hover:bg-gray-200">تفعيل الكل</button>
              <button onClick={() => setAll(false)} className="px-3 py-1.5 text-xs rounded-md bg-gray-100 hover:bg-gray-200">إخفاء الكل</button>
            </div>
          </div>
          <div className="space-y-2">
            {Object.entries(sections).map(([key, visible]) => (
              <div key={key} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  {visible ? <Eye className="w-4 h-4 text-green-600" /> : <EyeOff className="w-4 h-4 text-red-600" />}
                  <span className="text-sm font-medium">{labels[key] || key}</span>
                </div>
                <label className="inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={visible} onChange={(e) => toggleItem(key, e.target.checked)} className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-200 peer-checked:bg-[#203f61] rounded-full peer transition-all"></div>
                </label>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeSectionsCMS;
