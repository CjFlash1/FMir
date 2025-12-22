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
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center">
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 mb-6 italic">
              {siteName} <span className="text-primary-600 not-italic">Reborn</span>
            </h1>
            <p className="text-xl md:text-2xl text-slate-600 max-w-3xl mx-auto mb-10">
              {t('hero.subtitle')}. {t('Modern photo printing at your fingertips.')}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/upload">
                <Button size="lg" className="text-lg px-8 py-7 rounded-full gap-2 shadow-lg shadow-primary-500/20">
                  <Upload size={20} />
                  {t('nav.upload')}
                </Button>
              </Link>
              <Link href="/pricing">
                <Button size="lg" variant="outline" className="text-lg px-8 py-7 rounded-full gap-2">
                  {t('nav.pricing')}
                  <ChevronRight size={20} />
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-[500px] h-[500px] bg-primary-100/50 rounded-full blur-3xl opacity-50" />
        <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-emerald-100/50 rounded-full blur-3xl opacity-50" />
      </section>

      {/* Benefits Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
            {[
              { title: "Premium Quality", desc: "We use professional Fuji paper and chemistry." },
              { title: "Smart Pricing", desc: "Volume discounts apply automatically to your cart." },
              { title: "Fast Delivery", desc: "Swift processing and shipping across Ukraine." }
            ].map((benefit, i) => (
              <div key={i} className="flex flex-col items-center">
                <div className="w-16 h-16 bg-primary-50 text-primary-600 rounded-2xl flex items-center justify-center mb-6">
                  <Check size={32} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-4">{benefit.title}</h3>
                <p className="text-slate-600">{benefit.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
