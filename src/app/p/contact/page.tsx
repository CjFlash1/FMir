"use client";

import { useTranslation } from "@/lib/i18n";
import { useSettings } from "@/lib/settings-context";
import { MapPin, Phone, Mail, Clock } from "lucide-react";

export default function ContactPage() {
    const { t, lang } = useTranslation();
    const { getSetting } = useSettings();

    // Helper for multilingual settings
    const tSetting = (key: string) => {
        return getSetting(`${key}_${lang}`) || getSetting(`${key}_en`) || getSetting(key);
    };

    const address = tSetting('contact_address') || "м. Дніпро, вул. Європейська 8";
    const schedule = tSetting('contact_schedule') || "Пн-Пт 9:00 - 18:00";
    const email = getSetting('contact_email') || "fujimir@ukr.net";
    const phone1 = getSetting('contact_phone1') || "(099) 215-03-17";
    const phone2 = getSetting('contact_phone2') || "(098) 492-73-87";

    const mapQuery = encodeURIComponent(address);
    const mapSrc = `https://www.google.com/maps/embed/v1/place?key=YOUR_API_KEY&q=${mapQuery}`;
    // Wait, embed usually requires API Key. 
    // Simple iframe with output=embed is safer without key for basic usage, or just link.
    // Better: use a link or non-API embed if possible. 
    // Standard embed: https://maps.google.com/maps?q=...&t=&z=13&ie=UTF8&iwloc=&output=embed
    const embedUrl = `https://maps.google.com/maps?q=${mapQuery}&t=&z=15&ie=UTF8&iwloc=&output=embed`;

    return (
        <div className="min-h-screen bg-[#f3f1e9] py-12 md:py-20">
            <div className="max-w-4xl mx-auto px-4">
                <div className="bg-white p-8 md:p-12 rounded-3xl shadow-xl border border-[#c5b98e]/20">
                    <header className="mb-12 text-center">
                        <h1 className="text-4xl font-black tracking-tight text-[#009846] sm:text-5xl uppercase italic">
                            {t('nav.contact') || "Контакти"}
                        </h1>
                        <div className="h-1 w-24 bg-[#e31e24] mx-auto mt-6 rounded-full" />
                    </header>

                    <div className="grid md:grid-cols-2 gap-12">
                        {/* Info Column */}
                        <div className="space-y-8">

                            {/* Address */}
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center shrink-0">
                                    <MapPin className="w-6 h-6 text-[#009846]" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-slate-900 mb-1">{t('settings.contact_address') || "Адреса"}</h3>
                                    <p className="text-[#4c4c4c] text-lg leading-relaxed">{address}</p>
                                </div>
                            </div>

                            {/* Schedule */}
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center shrink-0">
                                    <Clock className="w-6 h-6 text-orange-600" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-slate-900 mb-1">{t('settings.contact_schedule') || "Графік роботи"}</h3>
                                    <p className="text-[#4c4c4c] text-lg leading-relaxed whitespace-pre-line">{schedule}</p>
                                </div>
                            </div>

                            {/* Phones */}
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center shrink-0">
                                    <Phone className="w-6 h-6 text-blue-600" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-slate-900 mb-1">{t('checkout.phone') || "Телефони"}</h3>
                                    <div className="flex flex-col gap-1">
                                        <a href={`tel:${phone1}`} className="text-[#4c4c4c] text-lg hover:text-[#009846] font-medium transition-colors">{phone1}</a>
                                        <a href={`tel:${phone2}`} className="text-[#4c4c4c] text-lg hover:text-[#009846] font-medium transition-colors">{phone2}</a>
                                    </div>
                                </div>
                            </div>

                            {/* Email */}
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center shrink-0">
                                    <Mail className="w-6 h-6 text-purple-600" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-slate-900 mb-1">Email</h3>
                                    <a href={`mailto:${email}`} className="text-[#4c4c4c] text-lg hover:text-[#009846] transition-colors">{email}</a>
                                </div>
                            </div>

                        </div>

                        {/* Map Column */}
                        <div className="h-[400px] bg-slate-100 rounded-2xl overflow-hidden border border-slate-200">
                            <iframe
                                width="100%"
                                height="100%"
                                frameBorder="0"
                                scrolling="no"
                                marginHeight={0}
                                marginWidth={0}
                                src={embedUrl}
                                className="w-full h-full"
                            ></iframe>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
