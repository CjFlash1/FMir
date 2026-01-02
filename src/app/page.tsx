"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n";
import { useSettings } from "@/lib/settings-context";
import { Upload, ArrowRight, Check, Zap, ShieldCheck, Heart, Star, Image as ImageIcon, Truck } from "lucide-react";

export default function Home() {
  const { t } = useTranslation();
  const { getSetting } = useSettings();
  const siteName = getSetting('site_name', 'FUJI-Світ');
  const [giftThreshold, setGiftThreshold] = useState<number>(1200);

  useEffect(() => {
    fetch('/api/gifts/threshold')
      .then(res => res.json())
      .then(data => {
        if (data.hasGift && data.minAmount) {
          setGiftThreshold(data.minAmount);
        }
      })
      .catch(console.error);
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-[#fdfbf7]"> {/* Warm paper-like background */}

      {/* Modern Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-16">

            {/* Left Content */}
            <div className="flex-1 text-center lg:text-left relative z-20">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-100/50 text-amber-700 font-bold text-sm mb-8 animate-fade-in-up border border-amber-200/50">
                <Star size={16} className="fill-current" />
                <span>{t('hero.best_quality')}</span>
              </div>

              <h1 className="text-5xl lg:text-7xl font-bold tracking-tight text-slate-800 mb-8 leading-[1.1]">
                {t('hero.title')}
              </h1>

              <p className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-medium">
                {t('hero.description')}
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
                <Link href="/upload" className="w-full sm:w-auto">
                  <Button size="lg" className="w-full h-16 bg-[#e31e24] hover:bg-[#c31a1f] text-white text-lg px-8 rounded-2xl gap-3 shadow-xl shadow-red-500/20 transition-all hover:-translate-y-1">
                    <Upload className="w-6 h-6" />
                    {t('nav.upload')}
                  </Button>
                </Link>
                <Link href="/pricing" className="w-full sm:w-auto">
                  <Button size="lg" variant="outline" className="w-full h-16 border-2 border-[#e6e0d4] text-slate-700 hover:bg-white hover:border-slate-300 text-lg px-8 rounded-2xl gap-2 transition-all bg-white/50">
                    {t('nav.pricing')}
                    <ArrowRight className="w-5 h-5" />
                  </Button>
                </Link>
              </div>

              <div className="mt-12 flex items-center justify-center lg:justify-start gap-8 text-slate-500 text-sm font-medium">
                {/* Text removed as requested */}
              </div>
            </div>

            {/* Right Visual - Photo Composition */}
            <div className="flex-1 relative w-full max-w-[500px] lg:max-w-none mx-auto lg:h-auto mt-8 lg:mt-0 z-10">
              {/* Decoration blobs */}
              <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-amber-100 rounded-full blur-3xl opacity-40 mix-blend-multiply animate-blob"></div>
              <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-red-100 rounded-full blur-3xl opacity-40 mix-blend-multiply animate-blob animation-delay-2000"></div>

              {/* Floating Cards */}
              <div className="relative w-full lg:h-full perspective-1000">
                {/* Main Photo (Family) - Relative on mobile, Absolute on Desktop */}
                <div className="relative mx-auto lg:absolute lg:top-10 lg:right-10 w-64 h-80 bg-white p-3 rounded-2xl shadow-2xl transform lg:rotate-6 hover:rotate-3 transition-all duration-500 z-20 hover:z-50 hover:scale-105">
                  <img src="/images/assets/hero-1.jpg" className="w-full h-full object-cover rounded-xl" alt="Happy moments" />
                </div>

                {/* Secondary Photo (Travel) - Hidden on very small mobile to prevent clutter/overlap */}
                <div className="absolute bottom-10 lg:bottom-20 left-4 lg:left-10 w-60 h-72 bg-white p-3 rounded-2xl shadow-xl transform -rotate-3 hover:rotate-0 transition-all duration-500 z-10 hover:z-50 hover:scale-105 hidden sm:block">
                  <img src="/images/assets/hero-2.jpg" className="w-full h-full object-cover rounded-xl" alt="Travel memories" />
                </div>

                {/* Small Photo (Friends) */}
                <div className="absolute top-32 left-0 lg:-left-4 w-48 h-56 bg-white p-2 rounded-2xl shadow-lg transform -rotate-12 hover:-rotate-6 transition-all duration-500 z-0 hover:z-50 hover:scale-105 hidden md:block">
                  <img src="/images/assets/hero-3.jpg" className="w-full h-full object-cover rounded-xl" alt="Friends" />
                </div>

                {/* Extra Photo (Portrait) */}
                <div className="absolute bottom-40 right-4 lg:-right-4 w-40 h-40 bg-white p-2 rounded-2xl shadow-lg transform rotate-12 hover:rotate-6 transition-all duration-500 z-30 hover:z-50 hover:scale-105 hidden sm:block">
                  <img src="/images/assets/hero-4.jpg" className="w-full h-full object-cover rounded-xl" alt="Portrait" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 bg-white/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
              <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
                <Truck className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-3">{t('benefits.delivery.title')}</h3>
              <p className="text-slate-500 leading-relaxed text-sm font-medium">
                {t('benefits.delivery.desc')}
              </p>
            </div>

            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
              <div className="w-14 h-14 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mb-6">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-3">{t('benefits.quality.title')}</h3>
              <p className="text-slate-500 leading-relaxed text-sm font-medium">
                {t('benefits.quality.desc')}
              </p>
            </div>

            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
              <div className="w-14 h-14 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center mb-6">
                <Heart className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-3">{t('benefits.discounts.title')}</h3>
              <p className="text-slate-500 leading-relaxed text-sm font-medium">
                {t('benefits.discounts.desc')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Products Showcase */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-800 mb-4">{t('home.what_we_print')}</h2>
            <p className="text-slate-500 max-w-2xl mx-auto font-medium">
              {t('home.formats_desc')}
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
            {/* 10x15 */}
            <div className="group relative aspect-[4/5] bg-white rounded-3xl overflow-hidden cursor-pointer shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100">
              <img
                src="/images/assets/prod-10x15.jpg"
                alt="10x15 photos"
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60"></div>

              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <span className="text-white font-bold text-4xl drop-shadow-md">10x15</span>
              </div>
              <div className="absolute inset-x-0 bottom-0 p-6">
                <p className="text-white font-bold text-lg">10x15 cm</p>
                <p className="text-slate-200 text-xs font-bold uppercase">{t('format.classic')}</p>
              </div>
            </div>

            {/* Magnets */}
            <div className="group relative aspect-[4/5] bg-white rounded-3xl overflow-hidden cursor-pointer shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100">
              <img
                src="/images/assets/prod-magnets.jpg"
                alt="Magnets"
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60"></div>

              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <p className="text-white font-bold text-3xl drop-shadow-md text-center px-2">{t('pricing.magnets')}</p>
              </div>
              <div className="absolute inset-x-0 bottom-0 p-6">
                <p className="text-white font-bold text-lg">{t('pricing.magnets')}</p>
                <p className="text-slate-200 text-xs font-bold uppercase">{t('format.magnet')}</p>
              </div>
            </div>

            {/* 15x21 */}
            <div className="group relative aspect-[4/5] bg-white rounded-3xl overflow-hidden cursor-pointer shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100">
              <img
                src="/images/assets/prod-15x21.jpg"
                alt="15x21 photos"
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60"></div>

              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <span className="text-white font-bold text-4xl drop-shadow-md">15x21</span>
              </div>
              <div className="absolute inset-x-0 bottom-0 p-6">
                <p className="text-white font-bold text-lg">15x21 cm</p>
                <p className="text-slate-200 text-xs font-bold uppercase">{t('format.a5')}</p>
              </div>
            </div>

            {/* Large */}
            <div className="group relative aspect-[4/5] bg-white rounded-3xl overflow-hidden cursor-pointer shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100">
              <img
                src="/images/assets/prod-20x30.jpg"
                alt="20x30 photos"
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60"></div>

              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <span className="text-white font-bold text-4xl drop-shadow-md">20x30</span>
              </div>
              <div className="absolute inset-x-0 bottom-0 p-6">
                <p className="text-white font-bold text-lg">20x30 cm</p>
                <p className="text-slate-200 text-xs font-bold uppercase">{t('format.a4')}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SEO Text Section (Full) */}
      <section className="py-24 bg-white/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-xl font-bold text-slate-800 mb-8 uppercase tracking-widest text-opacity-50">
            {t('home.seo.title')}
          </h2>
          <div className="prose prose-slate max-w-none text-slate-600 font-medium">
            <p>
              {t('home.seo.intro')}
            </p>
            <p className="mt-4">
              {t('home.seo.offer')}
            </p>

            <p className="font-bold text-slate-800 mt-8 mb-4">
              {t('home.seo.services_title')}
            </p>
            <ul className="list-disc pl-0 list-inside space-y-2 inline-block text-left">
              <li>{t('home.seo.service_scanning')}</li>
              <li>{t('home.seo.service_restoration')}</li>
              <li>{t('home.seo.service_redeye')}</li>
              <li>{t('home.seo.service_collage')}</li>
              <li>{t('home.seo.service_docs')}</li>
              <li>{t('home.seo.service_film')}</li>
              <li>{t('home.seo.service_frames')}</li>
            </ul>

            <p className="text-lg font-bold text-[#009846] mt-12">
              {t('home.seo.slogan')}
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#009846] to-[#007a38]"></div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>

        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 tracking-tight">
            {t('home.ready_to_print')}
          </h2>
          <p className="text-green-100 text-xl mb-12 max-w-2xl mx-auto font-medium opacity-90">
            {t('home.cta_desc')}
          </p>

          <Link href="/upload">
            <Button size="lg" className="h-20 bg-white text-[#009846] hover:bg-green-50 text-2xl px-16 rounded-3xl font-bold shadow-2xl shadow-green-900/20 transition-all hover:scale-105 hover:-translate-y-1">
              {t('nav.upload')}
              <Upload className="w-6 h-6 ml-3" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
