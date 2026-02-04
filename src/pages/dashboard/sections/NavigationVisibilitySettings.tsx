import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FileText, Eye, EyeOff, Settings } from 'lucide-react';
import { useApiQuery } from '../../../hooks/useApiQuery';
import { API_ENDPOINTS, apiCall } from '../../../config/api';
import { useQueryClient } from '@tanstack/react-query';
import smartToast from '../../../utils/toastConfig';

type VisibilityMap = Record<string, boolean>;
interface VisibilitySettings {
  navbar: VisibilityMap;
  footerImportant: VisibilityMap;
  footerQuick: VisibilityMap;
  footerStaticPages: VisibilityMap;
}

const STORAGE_KEY = 'ui_navigation_visibility';
const THEME_NAV_KEY = '/theme';
const THEME_NAV_LEGACY_KEY = '/theme/55';

const NavigationVisibilitySettings: React.FC = () => {
  const { t } = useTranslation();
  const { data: pagesResp } = useApiQuery<any>({ endpoint: API_ENDPOINTS.STATIC_PAGES, queryKey: ['static-pages'] });
  const { data: savedResp } = useApiQuery<any>({ endpoint: API_ENDPOINTS.NAVIGATION_VISIBILITY, queryKey: ['navigation-visibility'], staleTime: 60 * 60 * 1000 });
  const queryClient = useQueryClient();

  const normalizeNavbar = (map?: VisibilityMap): VisibilityMap => {
    const next: VisibilityMap = { ...(map || {}) };
    if (Object.prototype.hasOwnProperty.call(next, THEME_NAV_LEGACY_KEY) && !Object.prototype.hasOwnProperty.call(next, THEME_NAV_KEY)) {
      next[THEME_NAV_KEY] = next[THEME_NAV_LEGACY_KEY];
    }
    if (Object.prototype.hasOwnProperty.call(next, THEME_NAV_LEGACY_KEY)) {
      delete next[THEME_NAV_LEGACY_KEY];
    }
    return next;
  };

  const defaultSettings: VisibilitySettings = useMemo(() => ({
    navbar: {
      '/': true,
      '/theme': true,
      '/blog': true,
      '/documentation': true,
      '/categories': true,
      '/contact': true,
    },
    footerImportant: {
      '/about': true,
      '/contact': true,
      '/privacy-policy': true,
      '/terms-and-conditions': true,
    },
    footerQuick: {
      '/': true,
      '/documentation': true,
      '/blog': true,
      '/about': true,
    },
    footerStaticPages: {},
  }), []);

  const [settings, setSettings] = useState<VisibilitySettings>(defaultSettings);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const obj = Array.isArray(savedResp) ? savedResp[0] : (savedResp?.data ?? savedResp);
    if (obj) {
      setSettings({
        navbar: { ...defaultSettings.navbar, ...normalizeNavbar(obj.navbar || {}) },
        footerImportant: { ...defaultSettings.footerImportant, ...(obj.footerImportant || {}) },
        footerQuick: { ...defaultSettings.footerQuick, ...(obj.footerQuick || {}) },
        footerStaticPages: { ...(obj.footerStaticPages || {}) },
      });
      return;
    }
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        setSettings({
          navbar: { ...defaultSettings.navbar, ...normalizeNavbar(parsed.navbar || {}) },
          footerImportant: { ...defaultSettings.footerImportant, ...(parsed.footerImportant || {}) },
          footerQuick: { ...defaultSettings.footerQuick, ...(parsed.footerQuick || {}) },
          footerStaticPages: { ...(parsed.footerStaticPages || {}) },
        });
      } else {
        setSettings(defaultSettings);
      }
    } catch {
      setSettings(defaultSettings);
    }
  }, [defaultSettings, savedResp]);

  const staticPages = useMemo(() => {
    const arr = Array.isArray(pagesResp) ? pagesResp : pagesResp?.data || [];
    return arr
      .filter((p: any) => p?.isActive !== false)
      .map((p: any) => ({ id: p._id || p.id, title: p.title, slug: p.slug, showInFooter: p.showInFooter }));
  }, [pagesResp]);

  const toggleItem = (section: keyof VisibilitySettings, key: string, value: boolean) => {
    setSettings(prev => ({ ...prev, [section]: { ...prev[section], [key]: value } }));
  };

  const save = async () => {
    try {
      setSaving(true);
      await apiCall(API_ENDPOINTS.NAVIGATION_VISIBILITY, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      queryClient.invalidateQueries({ queryKey: ['navigation-visibility'] });
      smartToast.dashboard.success('تم حفظ إعدادات الظهور على الخادم');
    } catch (e) {
      smartToast.dashboard.error('حدث خطأ أثناء الحفظ');
    } finally {
      setSaving(false);
    }
  };

  const setAll = (section: keyof VisibilitySettings, value: boolean) => {
    setSettings(prev => ({ ...prev, [section]: Object.keys(prev[section]).reduce((acc: VisibilityMap, k) => { acc[k] = value; return acc; }, {}) }));
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6" dir="rtl">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="bg-gradient-to-r from-[#203f61] to-[#2a537e] text-white rounded-2xl p-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold text-white flex items-center gap-3 mb-2">
                <Settings className="w-8 h-8" />
                إعدادات ظهور الصفحات
              </h2>
              <p className="text-gray-200">تحكم في إظهار أو إخفاء روابط الـ Navbar والفوتر</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={save} disabled={saving} className="flex items-center gap-2 bg-white bg-opacity-20 text-white px-6 py-3 rounded-xl hover:bg-opacity-30 transition-all duration-300 font-medium border border-white/30 shadow-lg hover:shadow-xl transform hover:scale-105 backdrop-blur-sm">
                <FileText className="w-5 h-5" />
                حفظ الإعدادات
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">روابط Navbar</h3>
              <div className="flex items-center gap-2">
                <button onClick={() => setAll('navbar', true)} className="px-3 py-1.5 text-xs rounded-md bg-gray-100 hover:bg-gray-200">تفعيل الكل</button>
                <button onClick={() => setAll('navbar', false)} className="px-3 py-1.5 text-xs rounded-md bg-gray-100 hover:bg-gray-200">إخفاء الكل</button>
              </div>
            </div>
            <div className="space-y-2">
              {Object.entries(settings.navbar).map(([href, visible]) => (
                <div key={href} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    {visible ? <Eye className="w-4 h-4 text-green-600" /> : <EyeOff className="w-4 h-4 text-red-600" />}
                    <span className="text-sm font-medium">{href}</span>
                  </div>
                  <label className="inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={visible} onChange={(e) => toggleItem('navbar', href, e.target.checked)} className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-checked:bg-[#203f61] rounded-full peer transition-all"></div>
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">روابط الفوتر المهمة</h3>
              <div className="flex items-center gap-2">
                <button onClick={() => setAll('footerImportant', true)} className="px-3 py-1.5 text-xs rounded-md bg-gray-100 hover:bg-gray-200">تفعيل الكل</button>
                <button onClick={() => setAll('footerImportant', false)} className="px-3 py-1.5 text-xs rounded-md bg-gray-100 hover:bg-gray-200">إخفاء الكل</button>
              </div>
            </div>
            <div className="space-y-2">
              {Object.entries(settings.footerImportant).map(([to, visible]) => (
                <div key={to} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    {visible ? <Eye className="w-4 h-4 text-green-600" /> : <EyeOff className="w-4 h-4 text-red-600" />}
                    <span className="text-sm font-medium">{to}</span>
                  </div>
                  <label className="inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={visible} onChange={(e) => toggleItem('footerImportant', to, e.target.checked)} className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-checked:bg-[#203f61] rounded-full peer transition-all"></div>
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">روابط الفوتر السريعة</h3>
              <div className="flex items-center gap-2">
                <button onClick={() => setAll('footerQuick', true)} className="px-3 py-1.5 text-xs rounded-md bg-gray-100 hover:bg-gray-200">تفعيل الكل</button>
                <button onClick={() => setAll('footerQuick', false)} className="px-3 py-1.5 text-xs rounded-md bg-gray-100 hover:bg-gray-200">إخفاء الكل</button>
              </div>
            </div>
            <div className="space-y-2">
              {Object.entries(settings.footerQuick).map(([to, visible]) => (
                <div key={to} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    {visible ? <Eye className="w-4 h-4 text-green-600" /> : <EyeOff className="w-4 h-4 text-red-600" />}
                    <span className="text-sm font-medium">{to}</span>
                  </div>
                  <label className="inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={visible} onChange={(e) => toggleItem('footerQuick', to, e.target.checked)} className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-checked:bg-[#203f61] rounded-full peer transition-all"></div>
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">صفحات ثابتة في الفوتر</h3>
              <div className="flex items-center gap-2">
                <button onClick={() => setSettings(prev => ({ ...prev, footerStaticPages: staticPages.reduce((acc: VisibilityMap, p: any) => { acc[p.slug] = true; return acc; }, {}) }))} className="px-3 py-1.5 text-xs rounded-md bg-gray-100 hover:bg-gray-200">تفعيل الكل</button>
                <button onClick={() => setSettings(prev => ({ ...prev, footerStaticPages: staticPages.reduce((acc: VisibilityMap, p: any) => { acc[p.slug] = false; return acc; }, {}) }))} className="px-3 py-1.5 text-xs rounded-md bg-gray-100 hover:bg-gray-200">إخفاء الكل</button>
              </div>
            </div>
            <div className="space-y-2">
              {staticPages.map((page: any) => {
                const key = page.slug;
                const visible = settings.footerStaticPages[key] ?? true;
                return (
                  <div key={key} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      {visible ? <Eye className="w-4 h-4 text-green-600" /> : <EyeOff className="w-4 h-4 text-red-600" />}
                      <span className="text-sm font-medium">{page.title}</span>
                    </div>
                    <label className="inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked={visible} onChange={(e) => toggleItem('footerStaticPages', key, e.target.checked)} className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 peer-checked:bg-[#203f61] rounded-full peer transition-all"></div>
                    </label>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NavigationVisibilitySettings;
