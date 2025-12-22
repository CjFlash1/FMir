"use client";

import { useSettings } from "@/lib/settings-context";
import { Instagram, Facebook } from "lucide-react";

export function Footer() {
    const { getSetting } = useSettings();
    const instagram = getSetting('social_instagram');
    const facebook = getSetting('social_facebook');
    const siteName = getSetting('site_name', 'Fujimir');

    return (
        <footer className="bg-slate-50 border-t border-slate-200 mt-auto">
            <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 md:flex md:items-center md:justify-between lg:px-8">
                <div className="flex justify-center space-x-6 md:order-2">
                    {instagram && (
                        <a href={instagram} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-slate-500">
                            <span className="sr-only">Instagram</span>
                            <Instagram className="h-6 w-6" />
                        </a>
                    )}
                    {facebook && (
                        <a href={facebook} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-slate-500">
                            <span className="sr-only">Facebook</span>
                            <Facebook className="h-6 w-6" />
                        </a>
                    )}
                </div>
                <div className="mt-8 md:mt-0 md:order-1">
                    <p className="text-center text-base text-slate-400">
                        &copy; {new Date().getFullYear()} {siteName}. All rights reserved. {getSetting('contact_phone')}
                    </p>
                </div>
            </div>
        </footer>
    );
}
