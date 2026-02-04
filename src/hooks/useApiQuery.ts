import { useQuery } from '@tanstack/react-query';
import { apiCall } from '../config/api';

type UseApiQueryParams<TData> = {
  endpoint: string;
  queryKey?: readonly unknown[];
  requestInit?: RequestInit;
  select?: (data: any) => TData;
  enabled?: boolean;
  staleTime?: number;
  refetchInterval?: number | false;
  refetchOnMount?: boolean | 'always';
  refetchOnWindowFocus?: boolean | 'always';
  refetchOnReconnect?: boolean | 'always';
};

type MockDataFactory = () => any;

const deepClone = <T,>(value: T): T => {
  try {
    return JSON.parse(JSON.stringify(value)) as T;
  } catch {
    return value;
  }
};

const nowIso = () => new Date().toISOString();

const MOCK_CATEGORIES = [
  {
    id: 1,
    name: 'خدمات السوشيال ميديا',
    name_ar: 'خدمات السوشيال ميديا',
    name_en: 'Social Media Services',
    description: 'إدارة حساباتك وصناعة محتوى احترافي يزيد المبيعات.',
    description_ar: 'إدارة حساباتك وصناعة محتوى احترافي يزيد المبيعات.',
    description_en: 'Account management and pro content that boosts sales.',
    image: 'https://images.unsplash.com/photo-1557838923-2985c318be48?auto=format&fit=crop&w=1200&q=70',
    categoryType: 'regular'
  },
  {
    id: 2,
    name: 'تصميم الجرافيك',
    name_ar: 'تصميم الجرافيك',
    name_en: 'Graphic Design',
    description: 'بوستات وبنرات وهوية بصرية متناسقة وقابلة للتطبيق.',
    description_ar: 'بوستات وبنرات وهوية بصرية متناسقة وقابلة للتطبيق.',
    description_en: 'Posts, banners, and coherent brand identity assets.',
    image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=70',
    categoryType: 'regular'
  },
  {
    id: 3,
    name: 'إعلانات ممولة',
    name_ar: 'إعلانات ممولة',
    name_en: 'Paid Ads',
    description: 'حملات ممولة مدروسة مع تتبع وتحسين مستمر.',
    description_ar: 'حملات ممولة مدروسة مع تتبع وتحسين مستمر.',
    description_en: 'Well-planned campaigns with tracking and continuous optimization.',
    image: 'https://images.unsplash.com/photo-1553877522-43269d4ea984?auto=format&fit=crop&w=1200&q=70',
    categoryType: 'regular'
  },
  {
    id: 4,
    name: 'باقات المتاجر',
    name_ar: 'باقات المتاجر',
    name_en: 'Store Packages',
    description: 'باقات جاهزة لتجهيز متجرك وتحسين تجربة الشراء.',
    description_ar: 'باقات جاهزة لتجهيز متجرك وتحسين تجربة الشراء.',
    description_en: 'Ready packages to set up your store and improve UX.',
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1200&q=70',
    categoryType: 'regular'
  },
  {
    id: 10,
    name: 'ثيمات',
    name_ar: 'ثيمات',
    name_en: 'Themes',
    description: 'ثيمات متاجر جاهزة وسريعة ومتوافقة مع الجوال.',
    description_ar: 'ثيمات متاجر جاهزة وسريعة ومتوافقة مع الجوال.',
    description_en: 'Ready-to-use store themes, fast and mobile-friendly.',
    image: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=70',
    categoryType: 'theme'
  }
] as const;

const MOCK_PRODUCTS = [
  {
    id: 55,
    name: 'باقة إدارة محتوى شهرية',
    name_ar: 'باقة إدارة محتوى شهرية',
    name_en: 'Monthly Content Management Package',
    description: '<h2>باقة محتوى متكاملة</h2><p>خطة شهرية تشمل صناعة المحتوى، تصميم، نشر، وتقارير أداء.</p><ul><li>12 بوست تصميم</li><li>8 ريلز/فيديو قصير</li><li>تقارير أسبوعية</li></ul>',
    description_ar: '<h2>باقة محتوى متكاملة</h2><p>خطة شهرية تشمل صناعة المحتوى، تصميم، نشر، وتقارير أداء.</p><ul><li>12 بوست تصميم</li><li>8 ريلز/فيديو قصير</li><li>تقارير أسبوعية</li></ul>',
    description_en: '<h2>Complete content package</h2><p>A monthly plan covering content, design, publishing, and performance reports.</p><ul><li>12 designed posts</li><li>8 reels/short videos</li><li>Weekly reports</li></ul>',
    shortDescription: 'إدارة محتوى + تصميم + نشر + تقارير',
    shortDescription_ar: 'إدارة محتوى + تصميم + نشر + تقارير',
    shortDescription_en: 'Management + design + publishing + reports',
    price: 3500,
    originalPrice: 4200,
    isAvailable: true,
    categoryId: 1,
    productType: 'product',
    mainImage: 'https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&w=1400&q=70',
    detailedImages: [
      'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1400&q=70',
      'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1400&q=70'
    ],
    faqs: [
      { question: 'هل الباقة تشمل كتابة المحتوى؟', answer: 'نعم، تشمل كتابة المحتوى وإعداد خطة نشر شهرية.' },
      { question: 'هل يوجد تعديل على التصميمات؟', answer: 'نعم، يوجد حتى 2 تعديلات لكل تصميم.' }
    ],
    createdAt: nowIso()
  },
  {
    id: 56,
    name: 'تصميم هوية بصرية',
    name_ar: 'تصميم هوية بصرية',
    name_en: 'Brand Identity Design',
    description: '<p>شعار + ألوان + خطوط + تطبيقات أساسية للهوية.</p>',
    description_ar: '<p>شعار + ألوان + خطوط + تطبيقات أساسية للهوية.</p>',
    description_en: '<p>Logo + colors + typography + core brand assets.</p>',
    price: 2500,
    originalPrice: 3000,
    isAvailable: true,
    categoryId: 2,
    productType: 'product',
    mainImage: 'https://images.unsplash.com/photo-1526481280695-3c687fd5432c?auto=format&fit=crop&w=1400&q=70',
    detailedImages: [
      'https://images.unsplash.com/photo-1522542550221-31fd19575a2d?auto=format&fit=crop&w=1400&q=70'
    ],
    createdAt: nowIso()
  },
  {
    id: 57,
    name: 'إدارة حملة ممولة (فيسبوك/انستجرام)',
    name_ar: 'إدارة حملة ممولة (فيسبوك/انستجرام)',
    name_en: 'Paid Campaign Management (Meta)',
    description: '<p>إعداد الحملة + الاستهداف + تتبع التحويلات + تحسين يومي.</p>',
    description_ar: '<p>إعداد الحملة + الاستهداف + تتبع التحويلات + تحسين يومي.</p>',
    description_en: '<p>Setup + targeting + conversion tracking + daily optimization.</p>',
    price: 1800,
    isAvailable: true,
    categoryId: 3,
    productType: 'product',
    mainImage: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=1400&q=70',
    detailedImages: [
      'https://images.unsplash.com/photo-1553877522-43269d4ea984?auto=format&fit=crop&w=1400&q=70'
    ],
    createdAt: nowIso()
  },
  {
    id: 58,
    name: 'تهيئة متجر سلة (أساسي)',
    name_ar: 'تهيئة متجر سلة (أساسي)',
    name_en: 'Salla Store Setup (Basic)',
    description: '<p>تجهيز الصفحات الأساسية، الشحن والدفع، وإعدادات المتجر.</p>',
    description_ar: '<p>تجهيز الصفحات الأساسية، الشحن والدفع، وإعدادات المتجر.</p>',
    description_en: '<p>Basic pages, payments & shipping, and store settings.</p>',
    price: 2200,
    isAvailable: true,
    categoryId: 4,
    productType: 'product',
    mainImage: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1400&q=70',
    detailedImages: [
      'https://images.unsplash.com/photo-1515165562835-c4c7bfeae4d8?auto=format&fit=crop&w=1400&q=70'
    ],
    createdAt: nowIso()
  },
  {
    id: 101,
    name: 'ثيم متجر احترافي - ثيم Aurora',
    name_ar: 'ثيم متجر احترافي - ثيم Aurora',
    name_en: 'Pro Store Theme - Aurora',
    description: '<h2>ثيم سريع ومتجاوب</h2><p>تصميم حديث مع صفحات جاهزة وتهيئة SEO.</p>',
    description_ar: '<h2>ثيم سريع ومتجاوب</h2><p>تصميم حديث مع صفحات جاهزة وتهيئة SEO.</p>',
    description_en: '<h2>Fast & responsive</h2><p>Modern design with ready pages and SEO setup.</p>',
    price: 950,
    originalPrice: 1200,
    isAvailable: true,
    categoryId: 10,
    productType: 'theme',
    mainImage: 'https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&w=1400&q=70',
    detailedImages: [
      'https://images.unsplash.com/photo-1556761175-4b46a572b786?auto=format&fit=crop&w=1400&q=70',
      'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=1400&q=70'
    ],
    previewLink: 'https://example.com/theme/aurora',
    createdAt: nowIso()
  }
] as const;

const MOCK_TESTIMONIALS = [
  {
    id: 1,
    name: 'سارة العتيبي',
    position: 'صاحبة متجر عطور',
    testimonial: 'فرق واضح في المبيعات بعد تحسين المحتوى والحملات. شغل احترافي وسريع.',
    image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=800&q=70',
    createdAt: nowIso()
  },
  {
    id: 2,
    name: 'محمد الهاجري',
    position: 'مدير تسويق',
    testimonial: 'التقارير والمتابعة اليومية خلتنا نعرف بالضبط إيه اللي شغال وإيه لا.',
    image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=70',
    createdAt: nowIso()
  },
  {
    id: 3,
    name: 'ريم السبيعي',
    position: 'براند ملابس',
    testimonial: 'الهوية البصرية طلعت ممتازة ومتناسقة على كل المنصات.',
    image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=70',
    createdAt: nowIso()
  },
  {
    id: 4,
    name: 'أحمد الدوسري',
    position: 'متجر إلكترونيات',
    testimonial: 'تحسين تجربة المتجر ساعد في رفع التحويل وتقليل سلات مهجورة.',
    image: 'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=800&q=70',
    createdAt: nowIso()
  }
] as const;

const MOCK_CLIENTS = [
  {
    id: 1,
    name: 'Aurora Store',
    logo: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=60',
    website: 'https://example.com',
    createdAt: nowIso()
  },
  {
    id: 2,
    name: 'Bloom Cosmetics',
    logo: 'https://images.unsplash.com/photo-1526481280695-3c687fd5432c?auto=format&fit=crop&w=600&q=60',
    website: 'https://example.com',
    createdAt: nowIso()
  },
  {
    id: 3,
    name: 'Meta Growth',
    logo: 'https://images.unsplash.com/photo-1556761175-4b46a572b786?auto=format&fit=crop&w=600&q=60',
    website: 'https://example.com',
    createdAt: nowIso()
  }
] as const;

const MOCK_STATIC_PAGES = [
  {
    id: 1,
    title: 'سياسة الخصوصية',
    slug: 'privacy-policy',
    content: [
      { text: '<h2>مقدمة</h2><p>نحترم خصوصيتك ونلتزم بحماية بياناتك.</p>' },
      { text: '<h3>البيانات التي نجمعها</h3><p>قد نجمع بيانات التواصل ومعلومات الطلب.</p>' },
      { text: '<h3>استخدام البيانات</h3><p>نستخدم البيانات لتحسين الخدمة والرد على الاستفسارات.</p>' }
    ],
    metaDescription: 'سياسة الخصوصية الخاصة بخدمات AfterAds.',
    isActive: true,
    showInFooter: true,
    imageUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1600&q=70',
    createdAt: nowIso(),
    updatedAt: nowIso()
  },
  {
    id: 2,
    title: 'الشروط والأحكام',
    slug: 'terms-and-conditions',
    content: [
      { text: '<h2>الشروط</h2><p>باستخدامك للخدمة فأنت توافق على الشروط التالية.</p>' },
      { text: '<h3>الدفع والاسترجاع</h3><p>تفاصيل الدفع، مواعيد التسليم، وسياسة الاسترجاع.</p>' }
    ],
    metaDescription: 'الشروط والأحكام لاستخدام خدمات AfterAds.',
    isActive: true,
    showInFooter: true,
    imageUrl: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=1600&q=70',
    createdAt: nowIso(),
    updatedAt: nowIso()
  }
] as const;

const MOCK_THEME_CARDS = [
  {
    _id: 'theme-card-1',
    title: 'سرعة تحميل عالية',
    description: 'ثيمات مُحسّنة للأداء وتجربة مستخدم ممتازة.',
    overlayText: 'Performance',
    orderNumber: 1,
    category: 'عنصر متقدم',
    features: ['تحسين صور', 'Lazy Loading', 'SEO Ready'],
    isActive: true,
    displayOrder: 1,
    backgroundImage: 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=1400&q=70',
    icon: 'FaBolt',
    galleryImages: [
      'https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&w=1400&q=70',
      'https://images.unsplash.com/photo-1556761175-4b46a572b786?auto=format&fit=crop&w=1400&q=70'
    ]
  },
  {
    _id: 'theme-card-2',
    title: 'تصميم متجاوب بالكامل',
    description: 'عرض مثالي على الجوال والتابلت والكمبيوتر.',
    overlayText: 'Responsive',
    orderNumber: 2,
    category: 'عنصر متقدم',
    features: ['Mobile First', 'Tablet Ready', 'Desktop Layouts'],
    isActive: true,
    displayOrder: 2,
    backgroundImage: 'https://images.unsplash.com/photo-1553877522-43269d4ea984?auto=format&fit=crop&w=1400&q=70',
    icon: 'FaMobile',
    galleryImages: [
      'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1400&q=70'
    ]
  },
  {
    _id: 'theme-card-3',
    title: 'تهيئة SEO جاهزة',
    description: 'تحسين بنية الصفحات وروابط صديقة لمحركات البحث.',
    overlayText: 'SEO',
    orderNumber: 3,
    category: 'عنصر متقدم',
    features: ['Meta Tags', 'Schema', 'Fast Indexing'],
    isActive: true,
    displayOrder: 3,
    backgroundImage: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1400&q=70',
    icon: 'FaSearch',
    galleryImages: []
  }
] as const;

const MOCK_THEME_WORKS = [
  {
    id: 1,
    imageMobile: 'https://images.unsplash.com/photo-1523474253046-8cd2748b5fd2?auto=format&fit=crop&w=800&q=70',
    imageTablet: 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=1200&q=70',
    imageDesktop: 'https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&w=1600&q=70',
    link: 'https://example.com',
    clientOpinion: 'ثيم سريع وجذاب، وسهّل علينا عرض المنتجات بشكل أفضل.',
    clientName: 'Aurora Store',
    clientImage: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=70',
    workDate: '2025-11-10',
    isActive: true,
    createdAt: nowIso(),
    updatedAt: nowIso()
  },
  {
    id: 2,
    imageMobile: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=70',
    imageTablet: 'https://images.unsplash.com/photo-1526481280695-3c687fd5432c?auto=format&fit=crop&w=1200&q=70',
    imageDesktop: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1600&q=70',
    link: 'https://example.com',
    clientOpinion: 'تجربة مستخدم ممتازة وموبايل فريندلي بشكل واضح.',
    clientName: 'Bloom Cosmetics',
    clientImage: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=70',
    workDate: '2025-09-22',
    isActive: true,
    createdAt: nowIso(),
    updatedAt: nowIso()
  }
] as const;

const MOCK_DOCUMENTATION_STRUCTURE = [
  {
    id: 'main-1',
    title: 'البدء',
    slug: 'getting-started',
    icon: 'BookOpen',
    description: 'مقدمة سريعة لفهم النظام واستخدامه.',
    order: 1,
    isActive: true,
    categories: [
      {
        id: 'cat-1',
        title: 'نظرة عامة',
        slug: 'overview',
        icon: 'Home',
        description: 'معلومات أساسية قبل البدء.',
        order: 1,
        isActive: true,
        classifications: [
          { id: 'class-1', title: 'معلومات عامة', slug: 'general', icon: 'Layers', order: 1 }
        ],
        documentations: [
          {
            id: 'doc-1',
            title: 'كيف تبدأ؟',
            slug: 'how-to-start',
            icon: 'FileText',
            description: 'خطوات سريعة للإعداد.',
            order: 1,
            classificationId: 'class-1',
            content: [
              { text: '<h2>الخطوة 1: تجهيز البيانات</h2><p>أضف الأقسام والمنتجات من لوحة التحكم أو استخدم الداتا الافتراضية.</p>' },
              { text: '<h2>الخطوة 2: تخصيص المظهر</h2><p>اختر الثيم المناسب وراجع عناصر الثيم.</p>' },
              { text: '<h3>ملاحظة</h3><p>يمكنك تعديل النصوص والصفحات الثابتة من قسم Static Pages.</p>' }
            ],
            metadata: { totalViews: 0 }
          }
        ],
        metadata: { totalViews: 0, totalDocs: 1, totalClassifications: 1 }
      }
    ],
    metadata: { totalViews: 0, totalCategories: 1, totalDocs: 1 }
  },
  {
    id: 'main-2',
    title: 'إدارة المتجر',
    slug: 'store-management',
    icon: 'Settings',
    description: 'إرشادات لإدارة المنتجات والطلبات.',
    order: 2,
    isActive: true,
    categories: [
      {
        id: 'cat-2',
        title: 'المنتجات',
        slug: 'products',
        icon: 'Package',
        description: 'إضافة وتعديل المنتجات وخياراتها.',
        order: 1,
        isActive: true,
        classifications: [
          { id: 'class-2', title: 'إدارة المنتجات', slug: 'product-management', icon: 'Layers', order: 1 }
        ],
        documentations: [
          {
            id: 'doc-2',
            title: 'أفضل ممارسات تسعير المنتج',
            slug: 'pricing-best-practices',
            icon: 'FileText',
            description: 'نصائح لتسعير واضح وفعّال.',
            order: 1,
            classificationId: 'class-2',
            content: [
              { text: '<h2>استخدم سعر واضح</h2><p>اعرض السعر والسعر قبل الخصم إن وجد.</p>' },
              { text: '<h2>أضف وصف مختصر</h2><p>يساعد في رفع معدل التحويل.</p>' }
            ],
            metadata: { totalViews: 0 }
          }
        ],
        metadata: { totalViews: 0, totalDocs: 1, totalClassifications: 1 }
      }
    ],
    metadata: { totalViews: 0, totalCategories: 1, totalDocs: 1 }
  }
] as const;

const normalizeEndpoint = (endpoint: string) => String(endpoint || '').trim().replace(/^\/+/, '');

const extractPathAndQuery = (endpoint: string) => {
  const normalized = normalizeEndpoint(endpoint);
  const [path, query] = normalized.split('?', 2);
  return { path: path || '', query: query || '' };
};

const getMockResponseForEndpoint = (endpoint: string): any | undefined => {
  const { path, query } = extractPathAndQuery(endpoint);

  if (!path) return undefined;

  if (path === 'categories') return deepClone(MOCK_CATEGORIES);
  if (path.startsWith('categories/')) {
    const id = Number(path.split('/')[1]);
    const cat = (MOCK_CATEGORIES as any[]).find(c => Number(c.id) === id);
    return cat ? deepClone(cat) : undefined;
  }

  if (path === 'products') return deepClone({ products: MOCK_PRODUCTS });
  if (path.startsWith('products/')) {
    const parts = path.split('/');
    const maybeId = parts[1];
    const id = Number(maybeId);
    const product = (MOCK_PRODUCTS as any[]).find(p => Number(p.id) === id);
    if (product) return deepClone(product);
  }
  if (path.startsWith('products/category/')) {
    const id = Number(path.split('/')[2]);
    const products = (MOCK_PRODUCTS as any[]).filter(p => Number(p.categoryId) === id);
    return deepClone({ products });
  }

  if (path === 'static-pages') return deepClone(MOCK_STATIC_PAGES);
  if (path.startsWith('static-pages/')) {
    const identifier = decodeURIComponent(path.split('/')[1] || '');
    const byId = (MOCK_STATIC_PAGES as any[]).find(p => String(p.id) === identifier);
    const bySlug = (MOCK_STATIC_PAGES as any[]).find(p => String(p.slug) === identifier);
    return deepClone(byId || bySlug);
  }

  if (path === 'testimonials' || path === 'testimonials/active' || path === 'testimonials/featured') {
    return deepClone(MOCK_TESTIMONIALS);
  }
  if (path === 'clients' || path === 'clients/active' || path === 'clients/featured') {
    return deepClone(MOCK_CLIENTS);
  }

  if (path === 'documentations/structure') {
    return deepClone({ navigation: MOCK_DOCUMENTATION_STRUCTURE });
  }
  if (path === 'documentations') {
    return deepClone(MOCK_DOCUMENTATION_STRUCTURE);
  }

  if (path === 'theme-card' || path.startsWith('theme-card/')) {
    const params = new URLSearchParams(query);
    const isActive = params.get('isActive');
    const list = (MOCK_THEME_CARDS as any[]).filter(c => (isActive === 'true' ? Boolean(c.isActive) : true));
    return deepClone(list);
  }

  if (path === 'theme-works' || path.startsWith('theme-works/')) {
    const params = new URLSearchParams(query);
    const isActive = params.get('isActive');
    const list = (MOCK_THEME_WORKS as any[]).filter(w => (isActive === 'true' ? Boolean(w.isActive) : true));
    return deepClone(list);
  }

  return undefined;
};

const isEmptyResponse = (data: any): boolean => {
  if (data == null) return true;
  if (Array.isArray(data)) return data.length === 0;
  if (typeof data === 'object') {
    if (Array.isArray((data as any).data)) return (data as any).data.length === 0;
    if (Array.isArray((data as any).products)) return (data as any).products.length === 0;
  }
  return false;
};

export function useApiQuery<TData = any>({
  endpoint,
  queryKey,
  requestInit,
  select,
  enabled = true,
  staleTime,
  refetchInterval,
  refetchOnMount,
  refetchOnWindowFocus,
  refetchOnReconnect
}: UseApiQueryParams<TData>) {
  return useQuery<TData>({
    queryKey: queryKey ?? [endpoint, requestInit],
    queryFn: async () => {
      const useMock = Boolean((import.meta as any)?.env?.DEV);
      const mock = useMock ? getMockResponseForEndpoint(endpoint) : undefined;
      try {
        const data = await apiCall(endpoint, requestInit);
        if (useMock && mock !== undefined && isEmptyResponse(data)) {
          return mock;
        }
        return data;
      } catch (error) {
        if (useMock && mock !== undefined) {
          return mock;
        }
        throw error;
      }
    },
    select,
    enabled,
    staleTime,
    refetchInterval,
    refetchOnMount,
    refetchOnWindowFocus,
    refetchOnReconnect
  });
}
