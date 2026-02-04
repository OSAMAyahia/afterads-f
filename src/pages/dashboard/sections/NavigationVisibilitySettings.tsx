import React, { useEffect, useMemo, useState } from 'react';
import { FileText, Eye, EyeOff, Settings, ListTree, Navigation, LayoutPanelLeft, LayoutPanelTop, Bookmark } from 'lucide-react';
import { useApiQuery } from '../../../hooks/useApiQuery';
import { API_ENDPOINTS, apiCall } from '../../../config/api';
import { useQueryClient } from '@tanstack/react-query';
import smartToast from '../../../utils/toastConfig';
import { ModernToggle } from '../../../components/ui';

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
      smartToast.dashboard.success('تم حفظ إعدادات التنقل بنجاح');
    } catch (e) {
      smartToast.dashboard.error('عذراً، فشل حفظ الإعدادات');
    } finally {
      setSaving(false);
    }
  };

  const setAll = (section: keyof VisibilitySettings, value: boolean) => {
    setSettings(prev => ({ ...prev, [section]: Object.keys(prev[section]).reduce((acc: VisibilityMap, k) => { acc[k] = value; return acc; }, {}) }));
  };

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen" dir="rtl">
      {/* Header section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#203f61] to-[#2a537e] text-white rounded-2xl p-8 shadow-2xl">
        <div className="absolute top-0 right-0 -u-translate-x-1/2 translate-y-1/2 w-72 h-72 bg-white/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="p-4 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/10 shadow-inner">
              <Navigation className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-3xl font-extrabold tracking-tight mb-2">إدارة خرائط الموقع</h2>
              <p className="text-gray-200 font-medium text-lg">تحكم في هيكلية الروابط وسهولة الوصول لصفحات موقعك</p>
            </div>
          </div>
          <button
            onClick={save}
            disabled={saving}
            className="flex items-center gap-2 bg-white text-[#203f61] px-6 py-3 rounded-xl hover:bg-gray-100 transition-all font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:transform-none"
          >
            <FileText className={`w-5 h-5 ${saving ? 'animate-pulse' : ''}`} />
            {saving ? 'جاري المزامنة...' : 'حفظ التغييرات'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Navbar Links Section */}
        <SectionCard
          title="روابط القائمة العلوية (Navbar)"
          icon={<LayoutPanelTop className="w-6 h-6" />}
          onSetAll={(v) => setAll('navbar', v)}
        >
          {Object.entries(settings.navbar).map(([href, visible]) => (
            <ToggleRow
              key={href}
              label={href}
              visible={visible}
              onToggle={(val) => toggleItem('navbar', href, val)}
            />
          ))}
        </SectionCard>

        {/* Footer Important Links Section */}
        <SectionCard
          title="روابط الفوتر الأساسية"
          icon={<Bookmark className="w-6 h-6" />}
          onSetAll={(v) => setAll('footerImportant', v)}
        >
          {Object.entries(settings.footerImportant).map(([to, visible]) => (
            <ToggleRow
              key={to}
              label={to}
              visible={visible}
              onToggle={(val) => toggleItem('footerImportant', to, val)}
            />
          ))}
        </SectionCard>

        {/* Footer Quick Links Section */}
        <SectionCard
          title="روابط الفوتر السريعة"
          icon={<ListTree className="w-6 h-6" />}
          onSetAll={(v) => setAll('footerQuick', v)}
        >
          {Object.entries(settings.footerQuick).map(([to, visible]) => (
            <ToggleRow
              key={to}
              label={to}
              visible={visible}
              onToggle={(val) => toggleItem('footerQuick', to, val)}
            />
          ))}
        </SectionCard>

        {/* Static Pages Section */}
        <SectionCard
          title="الصفحات الثابتة الإضافية"
          icon={<LayoutPanelLeft className="w-6 h-6" />}
          onSetAll={(v) => setSettings(prev => ({ ...prev, footerStaticPages: staticPages.reduce((acc: VisibilityMap, p: any) => { acc[p.slug] = v; return acc; }, {}) }))}
        >
          {staticPages.map((page: any) => {
            const key = page.slug;
            const visible = settings.footerStaticPages[key] ?? true;
            return (
              <ToggleRow
                key={key}
                label={page.title || key}
                visible={visible}
                onToggle={(val) => toggleItem('footerStaticPages', key, val)}
              />
            );
          })}
        </SectionCard>
      </div>
    </div>
  );
};

const SectionCard: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode; onSetAll: (v: boolean) => void }> = ({ title, icon, children, onSetAll }) => (
  <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden flex flex-col h-full">
    <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-blue-100 text-blue-600 rounded-2xl">
          {icon}
        </div>
        <h3 className="text-xl font-bold text-slate-800">{title}</h3>
      </div>
      <div className="flex gap-2">
        <button onClick={() => onSetAll(true)} className="p-2 text-xs font-bold text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">تفعيل الكل</button>
        <button onClick={() => onSetAll(false)} className="p-2 text-xs font-bold text-slate-400 hover:bg-slate-50 rounded-lg transition-colors">إخفاء</button>
      </div>
    </div>
    <div className="p-6 space-y-3 flex-grow overflow-y-auto max-h-[400px]">
      {children}
    </div>
  </div>
);

const ToggleRow: React.FC<{ label: string; visible: boolean; onToggle: (v: boolean) => void }> = ({ label, visible, onToggle }) => (
  <div className={`
    flex items-center justify-between p-4 rounded-2xl border transition-all duration-300
    ${visible ? 'bg-blue-50/20 border-blue-100/50' : 'bg-slate-50 border-slate-100 grayscale-[0.3] opacity-80'}
    hover:border-blue-200 hover:shadow-sm group
  `}>
    <div className="flex items-center gap-4">
      <div className={`
        p-2 rounded-xl transition-all duration-300
        ${visible ? 'bg-blue-100 text-blue-600 rotate-0' : 'bg-slate-200 text-slate-400 -rotate-12'}
      `}>
        {visible ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
      </div>
      <span className={`text-sm font-bold tracking-wide transition-colors ${visible ? 'text-slate-700' : 'text-slate-400'}`}>
        {label}
      </span>
    </div>
    <ModernToggle checked={visible} onChange={onToggle} />
  </div>
);

export default NavigationVisibilitySettings;
