"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n";
import { useSettings } from "@/lib/settings-context";
import { Upload, ChevronRight, Check } from "lucide-react";

export default function Home() {
  const { t } = useTranslation();
  const { getSetting } = useSettings();
  const siteName = getSetting('site_name', 'Fujimir');

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative py-24 overflow-hidden bg-gradient-to-br from-[#00b352] via-[#009846] to-[#0d4829] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center md:text-left">
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="flex-1">
              <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-6 uppercase">
                {t('hero.title')} <br />
                <span className="text-[#e31e24] italic drop-shadow-[0_2px_2px_rgba(0,0,0,0.3)]">{siteName}</span>
              </h1>
              <p className="text-xl md:text-2xl text-white/80 max-w-2xl mb-10 font-bold">
                {t('hero.subtitle')}
              </p>
              <div className="flex flex-col sm:flex-row items-center gap-4 justify-center md:justify-start">
                <Link href="/upload">
                  <Button size="lg" className="bg-[#e31e24] hover:bg-[#c31a1f] text-white text-xl px-10 py-8 rounded-xl gap-3 shadow-2xl shadow-red-900/40 font-black uppercase tracking-tighter transition-transform hover:scale-105 active:scale-95">
                    <Upload size={24} />
                    {t('nav.upload')}
                  </Button>
                </Link>
                <Link href="/pricing">
                  <Button size="lg" className="bg-white text-[#009846] hover:bg-white/90 text-xl px-10 py-8 rounded-xl gap-2 font-black uppercase tracking-tighter shadow-xl">
                    {t('nav.pricing')}
                    <ChevronRight size={24} />
                  </Button>
                </Link>
              </div>
            </div>
            <div className="flex-1 relative hidden lg:block">
              <div className="relative w-full aspect-square max-w-md ml-auto">
                <div className="absolute inset-0 bg-white/10 rounded-full blur-3xl animate-pulse" />
                <img src="/logo.png" alt="Promo" className="relative z-10 w-full h-auto drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-3xl" />
              </div>
            </div>
          </div>
        </div>

        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      </section>

      {/* Benefits Section */}
      <section className="py-24 bg-[#f3f1e9] border-b border-[#c5b98e]/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              { title: t("benefits.quality.title") || "Premium Quality", desc: t("benefits.quality.desc") || "Original Fuji Crystal Archive paper for brilliant colors and sharp details.", icon: <Check size={32} /> },
              { title: t("benefits.discounts.title") || "Auto Discounts", desc: t("benefits.discounts.desc") || "Order more, pay less. Discounts are applied automatically in your cart.", icon: <Check size={32} /> },
              { title: t("benefits.delivery.title") || "Fast Delivery", desc: t("benefits.delivery.desc") || "Production starts immediately after upload. Shipping across Ukraine.", icon: <Check size={32} /> }
            ].map((benefit, i) => (
              <div key={i} className="flex flex-col items-center text-center group bg-white p-10 rounded-3xl shadow-sm border border-[#c5b98e]/20 hover:shadow-xl hover:-translate-y-1 transition-all">
                <div className="w-16 h-16 bg-[#009846] text-white rounded-2xl flex items-center justify-center mb-8 transform group-hover:rotate-12 transition-transform">
                  {benefit.icon}
                </div>
                <h3 className="text-2xl font-black text-[#4c4c4c] mb-4 uppercase tracking-tighter">{benefit.title}</h3>
                <p className="text-[#4c4c4c]/80 leading-relaxed font-bold">{benefit.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
