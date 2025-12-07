import React from "react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { useTranslation } from 'react-i18next';
import { Users, Award, Shield, TrendingUp } from 'lucide-react';

interface Client {
  id: number;
  logo?: string;
  website?: string;
}

interface ClientsSectionProps {
  clients: Client[];
}

const styles = `
  @keyframes shimmer {
    0% { background-position: -200% center; }
    100% { background-position: 200% center; }
  }

  .gradient-text {
    background: linear-gradient(90deg, #18b5d8 0%, #18b5d8 50%, #0d8aa3 100%);
    background-size: 200% auto;
    animation: shimmer 4s linear infinite;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .transition-smooth {
    transition: all 0.5s ease-in-out;
  }

  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  }
`;

const ClientsSection: React.FC<ClientsSectionProps> = ({ clients }) => {
  const { t } = useTranslation();
  const settings = {
    dots: false,
    infinite: true,
    speed: 8000,
    slidesToShow: 6,
    slidesToScroll: 1,
    cssEase: "linear",
    autoplay: true,
    autoplaySpeed: 0,
    pauseOnHover: false,
    pauseOnFocus: false,
    responsive: [
      { breakpoint: 1536, settings: { slidesToShow: 6 } },
      { breakpoint: 1280, settings: { slidesToShow: 5 } },
      { breakpoint: 1024, settings: { slidesToShow: 4 } },
      { breakpoint: 768, settings: { slidesToShow: 3 } },
      { breakpoint: 480, settings: { slidesToShow: 3 } },
    ],
  };

  if (!clients || clients.length === 0) return null;

  return (
    <>
      <style>{styles}</style>
      <section
        data-section="clients"
        className="py-20 bg-[#292929] relative overflow-hidden w-full"
      >
        <div className="relative z-10 w-full">
          {/* العنوان */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-3 bg-[#18b5d8]/20 border border-[#18b5d8]/30 text-[#18b5d8] px-6 py-3 rounded-full mb-8 backdrop-blur-sm hover:bg-[#18b5d8]/30 transition-all duration-300">
              <Users className="w-5 h-5" />
              <span className="font-semibold">{t('clients.title')}</span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
              {t('clients.subtitle')} <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#18b5d5] to-[#0d8aa3] animate-pulse">{t('clients.partners')}</span>
            </h2>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto mt-4">
              نفخر بثقة شركاؤنا ونجاح شراكاتنا في تحقيق أهدافهم الرقمية
            </p>
          </div>

          {/* الكاروسيل */}
          <Slider {...settings}>
            {clients.map((client) =>
              client.logo ? (
                <div key={client.id} className="px-2 sm:px-3">
                  <div className="bg-[#333333]/90 backdrop-blur-lg border border-gray-600/40 rounded-xl sm:rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl hover:scale-[1.01] transition-all duration-200 group">
                    <a
                      href={
                        client.website
                          ? client.website.startsWith("http")
                            ? client.website
                            : `https://${client.website}`
                          : "#"
                      }
                      target={client.website ? "_blank" : "_self"}
                      rel="noopener noreferrer"
                      onClick={(e) => !client.website && e.preventDefault()}
                      className="block flex items-center justify-center p-4 sm:p-6 hover:bg-white/10 transition-all duration-200 active:scale-95"
                    >
                      <div className="relative">
                        <img
                          src={client.logo}
                          alt={t('clients.client_logo', { id: client.id })}
                          loading="lazy"
                          className="h-16 sm:h-20 w-auto object-contain grayscale group-hover:grayscale-0 transition-smooth"
                        />
                        {/* Hover overlay effect similar to FAQ */}
                        <div className="absolute inset-0 bg-gradient-to-br from-[#18b5d8]/20 to-[#0d8aa3]/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg" />
                      </div>
                    </a>
                    {/* Partner badge */}
                    <div className="px-4 pb-4 flex items-center justify-center">
                      <div className="flex items-center gap-1 text-xs text-[#18b5d8] bg-[#18b5d8]/20 px-2 py-1 rounded-full">
                        <Award className="w-3 h-3" />
                        <span>شريك موثوق</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null
            )}
          </Slider>
        </div>
      </section>
    </>
  );
};

export default ClientsSection;