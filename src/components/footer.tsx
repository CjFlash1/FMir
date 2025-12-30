"use client";

import { useSettings } from "@/lib/settings-context";
import { useTranslation } from "@/lib/i18n";
import { Instagram, Facebook } from "lucide-react";
import Link from "next/link";

export function Footer() {
    const { getSetting } = useSettings();
    const { t } = useTranslation();
    const instagram = getSetting('social_instagram');
    const facebook = getSetting('social_facebook');
    const siteName = getSetting('site_name', 'Fujimir');
    const viberActive = getSetting('viber_active') === 'true';
    const telegramActive = getSetting('telegram_active') === 'true';
    const viberLink = getSetting('viber_link');
    const telegramLink = getSetting('telegram_link');

    return (
        <footer className="bg-[#c5b98e] border-t border-[#a69269]/30 mt-auto shadow-inner text-[#4c4c4c]">
            <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 md:flex md:items-center md:justify-between lg:px-8">
                <div className="flex justify-center space-x-6 md:order-2">
                    {instagram && (
                        <a href={instagram} target="_blank" rel="noopener noreferrer" className="text-[#4c4c4c]/70 hover:text-white transition-colors">
                            <span className="sr-only">Instagram</span>
                            <Instagram className="h-6 w-6" />
                        </a>
                    )}
                    {facebook && (
                        <a href={facebook} target="_blank" rel="noopener noreferrer" className="text-[#4c4c4c]/70 hover:text-white transition-colors">
                            <span className="sr-only">Facebook</span>
                            <Facebook className="h-6 w-6" />
                        </a>
                    )}
                    {viberActive && viberLink && (
                        <a href={viberLink} className="w-7 h-7 flex items-center justify-center hover:scale-110 transition-transform" title="Viber">
                            <span className="sr-only">Viber</span>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className="w-full h-full">
                                <rect width="512" height="512" rx="15%" fill="#665ca7" className="opacity-70 hover:opacity-100 transition-opacity" />
                                <path fill="none" stroke="#fff" strokeLinecap="round" strokeWidth="10" d="M269 186a30 30 0 0 1 31 31m-38-58a64 64 0 0 1 64 67m-73-93a97 97 0 0 1 99 104" />
                                <path fill="#fff" fillRule="evenodd" d="M95 232c0-91 17-147 161-147s161 56 161 147-17 147-161 147l-26-1-53 63c-4 4-8 1-8-3v-69c-6 0-31-12-38-19-22-23-36-40-36-118zm-30 0c0-126 55-177 191-177s191 51 191 177-55 177-191 177c-10 0-18 0-32-2l-38 43c-7 8-28 11-28-13v-42c-6 0-20-6-39-18-19-13-54-44-54-145zm223 42q10-13 24-4l36 27q8 10-7 28t-28 15q-53-12-102-60t-61-104q0-20 25-34 13-9 22 5l25 35q6 12-7 22c-39 15 51 112 73 70z" />
                            </svg>
                        </a>
                    )}
                    {telegramActive && telegramLink && (
                        <a href={telegramLink} target="_blank" rel="noopener noreferrer" className="w-7 h-7 rounded-full bg-[#0088cc]/70 hover:bg-[#0088cc] flex items-center justify-center hover:scale-110 transition-all" title="Telegram">
                            <span className="sr-only">Telegram</span>
                            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white">
                                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.14-.3.26-.54.26l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.64-.203-.658-.64.135-.954l11.566-4.458c.538-.196 1.006.128.832.941z" />
                            </svg>
                        </a>
                    )}
                </div>
                <div className="flex flex-col md:flex-row items-center gap-8 md:order-1">
                    <p className="text-center text-sm font-bold uppercase tracking-wider text-[#4c4c4c] opacity-60">
                        &copy; {new Date().getFullYear()} {siteName}.
                    </p>
                    <div className="flex items-center gap-6 text-xs font-black uppercase tracking-widest text-[#4c4c4c]/80">
                        <Link href="/p/about" className="hover:text-white transition-colors">{t('nav.about')}</Link>
                        <Link href="/p/contact" className="hover:text-white transition-colors">{t('nav.contact')}</Link>
                        <Link href="/pricing" className="hover:text-white transition-colors">{t('nav.pricing')}</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
