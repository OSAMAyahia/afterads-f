import React from 'react';
import { Link } from 'react-router-dom';
import { Monitor, Smartphone, TrendingUp, PenTool, Zap, Star } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { buildImageUrl } from '../../config/api';

interface Category {
  id: number;
  name: string;
  name_ar?: string;
  name_en?: string;
  description: string;
  description_ar?: string;
  description_en?: string;
  image: string;
  categoryType?: 'regular' | 'theme';
}

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  isAvailable: boolean;
  categoryId: number | null;
  mainImage: string;
  detailedImages?: string[];
  productType?: string;
  createdAt?: string;
}

interface CategoryProducts {
  category: Category;
  products: Product[];
}

interface CategoriesSectionProps {
  categoryProducts: CategoryProducts[];
  loading: boolean;
}

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap');

  .gradient-text {
    background: linear-gradient(135deg, #18b5d5 0%, #ffffff 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
`;

const CategoriesSection: React.FC<CategoriesSectionProps> = ({ categoryProducts, loading }) => {
  const { t, i18n } = useTranslation();
  const orderedIcons = [Monitor, Smartphone, TrendingUp, PenTool];

  const getServiceIcon = (index: number) => {
    return index < 4 ? orderedIcons[index] : Monitor;
  };

  const getLocalizedContent = (item: any, field: string) => {
    const currentLang = i18n.language;
    const langField = `${field}_${currentLang}`;
    
    if (item[langField] && item[langField].trim()) {
      return item[langField];
    }
    
    const otherLang = currentLang === 'ar' ? 'en' : 'ar';
    const otherLangField = `${field}_${otherLang}`;
    if (item[otherLangField] && item[otherLangField].trim()) {
      return item[otherLangField];
    }
    
    return item[field] || '';
  };

  const createCategorySlug = (name: string, id: number) => {
    const slug = name
      .replace(/\s+/g, '-')
      .replace(/[^\w\-أ-ي]/g, '')
      .toLowerCase();
    return `${slug}-${id}`;
  };

  if (loading) {
    return (
      <section data-section="categories" className="py-16 md:py-24 bg-[#292929] relative overflow-hidden" role="region" aria-labelledby="categories-heading">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 md:mb-16">
            <div className="h-6 md:h-8 bg-[#1f1f1f]/70 rounded-full w-32 md:w-48 mx-auto mb-3 md:mb-4"></div>
            <div className="h-4 md:h-6 bg-[#1f1f1f]/70 rounded-full w-64 md:w-96 mx-auto"></div>
          </div>
          <div className="space-y-4 md:space-y-6">
            {[...Array(4)].map((_, index) => (
              <div key={index} className="bg-[#1f1f1f]/70 rounded-xl md:rounded-2xl p-4 md:p-6 h-56 md:h-72 border border-[#18b5d5]/10">
                <div className="w-12 h-12 md:w-16 md:h-16 bg-[#18b5d5]/10 rounded-xl mb-3 md:mb-4"></div>
                <div className="h-4 md:h-6 bg-[#18b5d5]/10 rounded w-24 md:w-32 mb-3 md:mb-4"></div>
                <div className="h-3 md:h-4 bg-[#18b5d5]/10 rounded w-full mb-2"></div>
                <div className="h-3 md:h-4 bg-[#18b5d5]/10 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <>
      <style>{styles}</style>
      <section data-section="categories" className="py-16 md:py-28 bg-[#292929] relative overflow-hidden font-['Cairo']" role="region" aria-labelledby="categories-heading">
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-16 md:mb-24">
            <div className="inline-flex items-center gap-2 sm:gap-3 bg-[#1f1f1f]/70 border border-[#18b5d5]/30 text-[#18b5d5] px-4 sm:px-6 py-2 sm:py-3 rounded-full mb-6 md:mb-8">
              <Zap className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="font-bold text-xs sm:text-sm md:text-base">{t('home.categories.featured_products')}</span>
              <Star className="w-3 h-3 sm:w-4 sm:h-4" />
            </div>
            <h2 id="categories-heading" className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white mb-4 md:mb-6 leading-tight px-2">
              <span className="gradient-text">{t('home.categories.title')}</span>
            </h2>
            <p className="text-sm sm:text-base md:text-lg text-[#ffffff]/75 max-w-3xl mx-auto leading-relaxed font-light px-4">
              {t('home.categories.subtitle')}
            </p>
          </div>

          {/* Categories Grid */}
          <div className="space-y-4 md:space-y-6">
            {categoryProducts.map((categoryProduct, index) => {
              const IconComponent = getServiceIcon(index);
              const isEven = index % 2 === 0;
              return (
                <div key={categoryProduct.category.id}>
                  <Link
                    to={`/category/${createCategorySlug(getLocalizedContent(categoryProduct.category, 'name'), categoryProduct.category.id)}`}
                    aria-label={`${t('home.categories.discover_category')} ${getLocalizedContent(categoryProduct.category, 'name')}`}
                    className="group relative overflow-hidden rounded-lg md:rounded-2xl h-48 sm:h-56 md:h-72 w-full block bg-[#1f1f1f]/60 border border-[#18b5d5]/20"
                  >
                    <div className={`relative z-20 h-full flex flex-col md:${isEven ? 'flex-row-reverse' : 'flex-row'}`}>
                      {/* Image Section */}
                      <div className="w-full md:w-1/3 h-32 md:h-full relative overflow-hidden bg-gradient-to-br from-[#18b5d5]/5 to-transparent">
                        <div className="absolute inset-0">
                          {categoryProduct.category.image ? (
                            <img
                              src={buildImageUrl(categoryProduct.category.image)}
                              alt={getLocalizedContent(categoryProduct.category, 'name')}
                              className="w-full h-full object-contain p-3 md:p-4"
                              loading="lazy"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <IconComponent className="w-10 h-10 md:w-16 md:h-16 text-[#18b5d5]/50" />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Content Section */}
                      <div
                        className={`flex-1 p-4 sm:p-5 md:p-8 flex flex-col ${
                          isEven ? "md:items-start md:text-left" : "md:items-end md:text-right"
                        } items-center text-center justify-between`}
                      >
                        <div className="w-full">
                          <IconComponent className="w-5 h-5 md:w-6 md:h-6 text-[#18b5d5] mb-2 md:mb-3 mx-auto md:mx-0" />

                          <h3
                            className={`text-base sm:text-lg md:text-2xl font-bold text-white mb-1 md:mb-2 leading-tight ${
                              isEven ? "md:text-left" : "md:text-right"
                            } text-center`}
                          >
                            {getLocalizedContent(categoryProduct.category, 'name')}
                          </h3>
                          <p
                            className={`text-[#ffffff]/65 mb-3 md:mb-4 text-xs sm:text-sm md:text-base leading-relaxed line-clamp-2 ${
                              isEven ? "md:text-left" : "md:text-right"
                            } text-center`}
                          >
                            {getLocalizedContent(categoryProduct.category, 'description')}
                          </p>
                        </div>

                        <div
                          className={`flex items-center gap-2 ${
                            isEven ? "md:justify-start" : "md:justify-end"
                          } justify-center mt-auto w-full`}
                        >
                          <div className="inline-flex items-center gap-2 px-4 sm:px-5 md:px-6 py-2 md:py-2.5 bg-[#18b5d5]/15 border border-[#18b5d5]/30 text-[#18b5d5] text-xs md:text-sm font-semibold rounded-lg md:rounded-xl">
                            {t('home.categories.discover_product')}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
};

export default CategoriesSection;