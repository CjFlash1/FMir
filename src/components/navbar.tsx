"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X, Camera } from "lucide-react";
import { Button } from "./ui/button";
import { useTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { useSettings } from "@/lib/settings-context";

export function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const { t, lang, setLang } = useTranslation();
    const { getSetting } = useSettings();

    // Dynamic Menu Fetching
    const [dynamicPages, setDynamicPages] = useState<{ slug: string, title: string }[]>([]);

    useEffect(() => {
        fetch(`/api/menu?lang=${lang}`)
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setDynamicPages(data);
            })
            .catch(err => console.error("Failed to fetch menu:", err));
    }, [lang]);

    const navLinks = [
        { href: "/upload", label: t('nav.upload'), primary: true },
        { href: "/pricing", label: t('nav.pricing') },
        { href: "/p/help", label: t('nav.help', 'Допомога') },
        ...dynamicPages.map(page => ({ href: `/p/${page.slug}`, label: page.title }))
    ];

    // localized labels
    const labels: Record<string, { address: string, contact: string }> = {
        uk: { address: 'Адреса', contact: 'Зв\'яжіться з нами' },
        ru: { address: 'Адрес', contact: 'Свяжитесь с нами' },
        en: { address: 'Address', contact: 'Contact Us' }
    };
    const currentLabels = labels[lang as string] || labels.en;

    // Contact Data (Source: Original Site / Seed Data)
    const addresses: Record<string, string> = {
        uk: 'м. Дніпро, вул. Європейська 8',
        ru: 'г. Днепр, ул. Европейская 8',
        en: 'Dnipro, Yevropeyska St, 8'
    };
    const address = addresses[lang as string] || addresses.uk;
    const phone = '(099) 215-03-17'; // Primary phone

    // Google Maps Query
    const mapQuery = encodeURIComponent('м. Дніпро, вул. Європейська 8');
    const mapLink = `https://www.google.com/maps/search/?api=1&query=${mapQuery}`;

    // Logo Configuration - now using settings with fallbacks
    const logoConfig: Record<string, { mainSuffix: string, subtitle: string }> = {
        uk: {
            mainSuffix: getSetting('logo_suffix_uk') || '.СВІТ',
            subtitle: getSetting('logo_subtitle_uk') || 'онлайн фотолабораторія'
        },
        ru: {
            mainSuffix: getSetting('logo_suffix_ru') || '.MIR',
            subtitle: getSetting('logo_subtitle_ru') || 'онлайн фотолаборатория'
        },
        en: {
            mainSuffix: getSetting('logo_suffix_en') || '.MIR',
            subtitle: getSetting('logo_subtitle_en') || 'Online Photo Lab'
        }
    };
    const currentLogo = logoConfig[lang as string] || logoConfig.en;

    return (
        <nav className="sticky top-0 z-50 flex flex-col shadow-md font-sans">
            {/* Top Tier: Green Gradient Header */}
            <div className="bg-gradient-to-b from-[#00b352] to-[#009846] text-white py-2 md:py-4">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
                    {/* Logo Area */}
                    <Link href="/" className="flex items-center gap-3 md:gap-4 group shrink-0">
                        <div className="transition-transform group-hover:scale-105">
                            <img src="/logo.png" alt="Fujimir" className="h-8 md:h-12 w-auto" />
                        </div>
                        <div className="flex flex-col">
                            <span className="font-black text-xl md:text-3xl tracking-tighter leading-none whitespace-nowrap">
                                <span className="text-white">FUJI</span>
                                <span className="text-white/90 font-light">
                                    {currentLogo.mainSuffix}
                                </span>
                            </span>
                            <span className="text-[8px] md:text-[10px] text-white/80 uppercase tracking-[0.2em] font-bold mt-0.5 md:mt-1 hidden sm:block">
                                {currentLogo.subtitle}
                            </span>
                        </div>
                    </Link>

                    {/* Desktop Extended Info */}
                    <div className="hidden lg:flex items-center gap-6">
                        {/* Info Block */}
                        <div className="flex flex-col items-end text-right gap-1 text-sm leading-tight text-white/90">
                            <a
                                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(getSetting('contact_address') || address)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 hover:text-white transition-colors group/addr"
                            >
                                <span className="font-medium max-w-[250px] border-b border-transparent group-hover/addr:border-white/50">{getSetting('contact_address') || address}</span>
                                <span className="text-lg">📍</span>
                            </a>
                            <div className="flex items-center gap-2 text-xs opacity-90">
                                <span>{getSetting('contact_schedule') || t('header.schedule_default')}</span>
                                <span className="text-sm">🕒</span>
                            </div>
                        </div>

                        {/* Contact Block */}
                        <div className="grid grid-cols-[auto_auto] gap-x-3 gap-y-2 items-center">
                            <div className="flex flex-col items-center gap-0.5">
                                <a href={`tel:${getSetting('contact_phone1') || '(099) 215-03-17'}`} className="font-bold text-lg leading-none hover:text-white transition-colors">{getSetting('contact_phone1') || '(099) 215-03-17'}</a>
                                <a href={`tel:${getSetting('contact_phone2') || '(098) 492-73-87'}`} className="font-bold text-lg leading-none hover:text-white transition-colors">{getSetting('contact_phone2') || '(098) 492-73-87'}</a>
                            </div>
                            <span className="text-2xl leading-none">📞</span>

                            <a href={`mailto:${getSetting('contact_email') || 'fujimir@ukr.net'}`} className="font-bold text-sm border-b border-transparent hover:border-white/50 hover:text-white transition-colors justify-self-center">
                                {getSetting('contact_email') || 'fujimir@ukr.net'}
                            </a>
                            <span className="text-xl leading-none">✉️</span>
                        </div>

                        {/* Socials */}
                        {(getSetting('viber_active') === 'true' || getSetting('telegram_active') === 'true') && (
                            <div className="flex items-center gap-2 border-l border-white/20 pl-6 h-10">
                                {getSetting('viber_active') === 'true' && (
                                    <a href={getSetting('viber_link') || `viber://chat?number=${(getSetting('contact_phone1') || phone).replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="w-8 h-8 flex items-center justify-center hover:scale-110 transition-transform">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="#fff" className="w-full h-full"><rect width="512" height="512" rx="15%" fill="#665ca7" /><path fill="none" stroke="#fff" strokeLinecap="round" strokeWidth="10" d="M269 186a30 30 0 0 1 31 31m-38-58a64 64 0 0 1 64 67m-73-93a97 97 0 0 1 99 104" /><path fillRule="evenodd" d="M95 232c0-91 17-147 161-147s161 56 161 147-17 147-161 147l-26-1-53 63c-4 4-8 1-8-3v-69c-6 0-31-12-38-19-22-23-36-40-36-118zm-30 0c0-126 55-177 191-177s191 51 191 177-55 177-191 177c-10 0-18 0-32-2l-38 43c-7 8-28 11-28-13v-42c-6 0-20-6-39-18-19-13-54-44-54-145zm223 42q10-13 24-4l36 27q8 10-7 28t-28 15q-53-12-102-60t-61-104q0-20 25-34 13-9 22 5l25 35q6 12-7 22c-39 15 51 112 73 70z" /></svg>
                                    </a>
                                )}
                                {getSetting('telegram_active') === 'true' && (
                                    <a href={getSetting('telegram_link') || `https://t.me/+${(getSetting('contact_phone1') || phone).replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-[#0088cc] flex items-center justify-center hover:scale-110 transition-transform">
                                        <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.14-.3.26-.54.26l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.64-.203-.658-.64.135-.954l11.566-4.458c.538-.196 1.006.128.832.941z" /></svg>
                                    </a>
                                )}
                            </div>
                        )}

                        {/* Lang */}
                        <div className="flex items-center gap-2 text-xs font-bold border-l border-white/20 pl-6 h-10">
                            <button onClick={() => setLang('uk')} className={`transition-colors ${lang === 'uk' ? 'text-white scale-110' : 'text-white/60 hover:text-white'}`}>UA</button>
                            <button onClick={() => setLang('ru')} className={`transition-colors ${lang === 'ru' ? 'text-white scale-110' : 'text-white/60 hover:text-white'}`}>RU</button>
                            <button onClick={() => setLang('en')} className={`transition-colors ${lang === 'en' ? 'text-white scale-110' : 'text-white/60 hover:text-white'}`}>EN</button>
                        </div>
                    </div>

                    {/* Mobile Controls */}
                    <div className="flex items-center gap-4 lg:hidden">
                        {/* Mobile Socials (Visible on bar) */}
                        {(getSetting('viber_active') === 'true' || getSetting('telegram_active') === 'true') && (
                            <div className="flex items-center gap-2">
                                {getSetting('viber_active') === 'true' && (
                                    <a href={getSetting('viber_link') || `viber://chat?number=${(getSetting('contact_phone1') || phone).replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="w-8 h-8 flex items-center justify-center hover:scale-110 transition-transform">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="#fff" className="w-full h-full"><rect width="512" height="512" rx="15%" fill="#665ca7" /><path fill="none" stroke="#fff" strokeLinecap="round" strokeWidth="10" d="M269 186a30 30 0 0 1 31 31m-38-58a64 64 0 0 1 64 67m-73-93a97 97 0 0 1 99 104" /><path fillRule="evenodd" d="M95 232c0-91 17-147 161-147s161 56 161 147-17 147-161 147l-26-1-53 63c-4 4-8 1-8-3v-69c-6 0-31-12-38-19-22-23-36-40-36-118zm-30 0c0-126 55-177 191-177s191 51 191 177-55 177-191 177c-10 0-18 0-32-2l-38 43c-7 8-28 11-28-13v-42c-6 0-20-6-39-18-19-13-54-44-54-145zm223 42q10-13 24-4l36 27q8 10-7 28t-28 15q-53-12-102-60t-61-104q0-20 25-34 13-9 22 5l25 35q6 12-7 22c-39 15 51 112 73 70z" /></svg>
                                    </a>
                                )}
                                {getSetting('telegram_active') === 'true' && (
                                    <a href={getSetting('telegram_link') || `https://t.me/+${(getSetting('contact_phone1') || phone).replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-[#0088cc] flex items-center justify-center hover:scale-110 transition-transform">
                                        <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.14-.3.26-.54.26l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.64-.203-.658-.64.135-.954l11.566-4.458c.538-.196 1.006.128.832.941z" /></svg>
                                    </a>
                                )}
                            </div>
                        )}
                    </div>

                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className="p-2 text-white hover:bg-white/10 rounded-md"
                    >
                        {isOpen ? <X className="h-7 w-7" /> : <Menu className="h-7 w-7" />}
                    </button>
                </div>
            </div>

            {/* Bottom Tier: Tan Menu Bar */}
            <div className="bg-[#c5b98e] border-b border-[#a69269]/30 hidden md:block">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-12">
                        <div className="flex space-x-1">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={cn(
                                        "px-6 h-12 flex items-center text-sm font-bold transition-all uppercase tracking-wide",
                                        link.primary
                                            ? "bg-[#e31e24] text-white hover:bg-[#c31a1f] shadow-inner"
                                            : "text-[#4c4c4c] hover:bg-[#a69269]/20 hover:text-black"
                                    )}
                                >
                                    {link.label}
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {
                isOpen && (
                    <div className="md:hidden bg-[#f3f1e9] border-b border-tan-dark shadow-xl animate-in slide-in-from-top-2">
                        {/* Mobile Contact Info Block */}
                        <div className="px-4 py-4 bg-[#e8e4d3] border-b border-[#c5b98e] space-y-4">
                            <div className="flex items-start gap-4">
                                <span className="text-xl">📍</span>
                                <div className="flex flex-col">
                                    <span className="text-[10px] uppercase font-bold text-[#4c4c4c]/60 mb-0.5">{currentLabels.address}</span>
                                    <a href={mapLink} target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-[#1a1a1a] underline decoration-black/20 underline-offset-2 leading-tight">{getSetting('contact_address') || address}</a>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <span className="text-xl">🕒</span>
                                <div className="flex flex-col">
                                    <span className="text-[10px] uppercase font-bold text-[#4c4c4c]/60 mb-0.5">Schedule</span>
                                    <span className="text-sm font-bold text-[#1a1a1a] leading-tight">{getSetting('contact_schedule') || t('header.schedule_default')}</span>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <span className="text-xl">📞</span>
                                <div className="flex flex-col gap-1">
                                    <span className="text-[10px] uppercase font-bold text-[#4c4c4c]/60 mb-0.5">{currentLabels.contact}</span>
                                    <a href={`tel:${getSetting('contact_phone1') || '(099) 215-03-17'}`} className="text-lg font-bold text-[#1a1a1a] leading-none">{getSetting('contact_phone1') || '(099) 215-03-17'}</a>
                                    <a href={`tel:${getSetting('contact_phone2') || '(098) 492-73-87'}`} className="text-lg font-bold text-[#1a1a1a] leading-none">{getSetting('contact_phone2') || '(098) 492-73-87'}</a>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <span className="text-xl">✉️</span>
                                <div className="flex flex-col">
                                    <span className="text-[10px] uppercase font-bold text-[#4c4c4c]/60 mb-0.5">Email</span>
                                    <a href={`mailto:${getSetting('contact_email') || 'fujimir@ukr.net'}`} className="text-sm font-bold text-[#1a1a1a] underline decoration-black/20 underline-offset-2">{getSetting('contact_email') || 'fujimir@ukr.net'}</a>
                                </div>
                            </div>

                            <div className="flex gap-2 pt-2 border-t border-[#c5b98e]/50 mt-2">
                                <button onClick={() => setLang('uk')} className={`px-3 py-1 text-sm font-bold rounded ${lang === 'uk' ? 'bg-[#009846] text-white' : 'text-[#4c4c4c] bg-white/50'}`}>UA</button>
                                <button onClick={() => setLang('ru')} className={`px-3 py-1 text-sm font-bold rounded ${lang === 'ru' ? 'bg-[#009846] text-white' : 'text-[#4c4c4c] bg-white/50'}`}>RU</button>
                                <button onClick={() => setLang('en')} className={`px-3 py-1 text-sm font-bold rounded ${lang === 'en' ? 'bg-[#009846] text-white' : 'text-[#4c4c4c] bg-white/50'}`}>EN</button>
                            </div>
                        </div>

                        <div className="px-2 pt-2 pb-3 space-y-1">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    onClick={() => setIsOpen(false)}
                                    className={cn(
                                        "block px-3 py-3 rounded-md text-base font-bold uppercase tracking-wide",
                                        link.primary
                                            ? "bg-[#e31e24] text-white"
                                            : "text-[#4c4c4c] hover:bg-tan/20"
                                    )}
                                >
                                    {link.label}
                                </Link>
                            ))}
                        </div>
                    </div>
                )
            }
        </nav >
    );
}
