"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Loader2, Save, Globe, Phone, Mail, Instagram, Facebook, Search } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

interface SettingItem {
    key: string;
    label: string;
    icon: any;
    placeholder?: string;
    type?: 'text' | 'boolean';
}

export default function SettingsPage() {
    const { t } = useTranslation();
    const [settings, setSettings] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<string | null>(null);

    const SETTING_GROUPS = [
        {
            title: t('settings.general'),
            description: t('settings.general_desc'),
            items: [
                { key: "site_name", label: t('settings.site_name'), icon: Globe, placeholder: "e.g. Fujimir Photo Center" },
                { key: "contact_email", label: t('settings.support_email'), icon: Mail, placeholder: "contact@fujimir.com.ua" },
                { key: "contact_phone1", label: t('settings.contact_phone1'), icon: Phone, placeholder: "+380..." },
                { key: "contact_phone2", label: t('settings.contact_phone2'), icon: Phone, placeholder: "+380..." },
                { key: "contact_address", label: t('settings.contact_address'), icon: Globe, placeholder: "Address..." },
                { key: "contact_schedule", label: t('settings.contact_schedule'), icon: Globe, placeholder: "Schedule..." },
            ]
        },
        {
            title: t('settings.branding'),
            description: t('settings.branding_desc'),
            items: [
                { key: "logo_suffix_uk", label: t('settings.logo_suffix_uk'), icon: Globe, placeholder: "FUJI-Світ" },
                { key: "logo_suffix_ru", label: t('settings.logo_suffix_ru'), icon: Globe, placeholder: "FUJI-Мир" },
                { key: "logo_suffix_en", label: t('settings.logo_suffix_en'), icon: Globe, placeholder: "FUJI-World" },
                { key: "logo_subtitle_uk", label: t('settings.logo_subtitle_uk'), icon: Globe, placeholder: "ФОТОЛАБ" },
                { key: "logo_subtitle_ru", label: t('settings.logo_subtitle_ru'), icon: Globe, placeholder: "ФОТОЛАБ" },
                { key: "logo_subtitle_en", label: t('settings.logo_subtitle_en'), icon: Globe, placeholder: "PHOTOLAB" },
            ]
        },
        {
            title: t('settings.social'),
            description: t('settings.social_desc'),
            items: [
                { key: "social_instagram", label: t('settings.instagram'), icon: Instagram, placeholder: "https://instagram.com/..." },
                { key: "social_facebook", label: t('settings.facebook'), icon: Facebook, placeholder: "https://facebook.com/..." },
            ]
        },
        {
            title: t('settings.messengers'),
            description: t('settings.messengers_desc'),
            items: [
                { key: "viber_link", label: t('settings.viber'), icon: Phone, placeholder: "viber://chat?number=..." },
                { key: "telegram_link", label: t('settings.telegram'), icon: Globe, placeholder: "https://t.me/..." },
                { key: "viber_active", label: t('settings.viber_active'), icon: Globe, type: 'boolean' as const },
                { key: "telegram_active", label: t('settings.telegram_active'), icon: Globe, type: 'boolean' as const },
            ]
        },
        {
            title: t('settings.analytics'),
            description: t('settings.analytics_desc'),
            items: [
                { key: "ga4_measurement_id", label: t('settings.ga4_measurement_id'), icon: Search, placeholder: "G-XXXXXXXXXX" },
                { key: "yandex_metrica_id", label: t('settings.yandex_metrica_id'), icon: Search, placeholder: "12345678" },
                { key: "facebook_pixel_id", label: t('settings.facebook_pixel_id'), icon: Search, placeholder: "1234567890" },
            ]
        },
        {
            title: t('settings.seo'),
            description: t('settings.seo_desc'),
            items: [
                { key: "google_verification", label: t('settings.google_verification'), icon: Search, placeholder: "google-site-verification code" },
                { key: "yandex_verification", label: t('settings.yandex_verification'), icon: Search, placeholder: "yandex-verification code" },
                { key: "bing_verification", label: t('settings.bing_verification'), icon: Search, placeholder: "msvalidate.01 code" },
            ]
        }
    ];

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await fetch("/api/fujiadmin/settings");
            const data = await res.json();
            const settingsMap = data.reduce((acc: any, curr: any) => {
                acc[curr.key] = curr.value;
                return acc;
            }, {});
            setSettings(settingsMap);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (key: string, value: string) => {
        setSaving(key);
        try {
            await fetch("/api/fujiadmin/settings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ key, value }),
            });
            // Brief delay for UX
            await new Promise(r => setTimeout(r, 500));
        } catch (e) {
            console.error(e);
        } finally {
            setSaving(null);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl space-y-6">
            <h1 className="text-2xl font-bold">{t('admin.settings')}</h1>

            {SETTING_GROUPS.map((group) => (
                <Card key={group.title}>
                    <CardHeader>
                        <CardTitle>{group.title}</CardTitle>
                        <CardDescription>{group.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {group.items.map((item) => (
                            <div key={item.key} className="space-y-2">
                                <label className="text-sm font-semibold flex items-center gap-2">
                                    <item.icon className="w-4 h-4 text-slate-400" />
                                    {item.label}
                                </label>
                                <div className="flex gap-2">
                                    {item.type === 'boolean' ? (
                                        <div className="flex items-center gap-3 pt-1">
                                            <Switch
                                                checked={settings[item.key] === 'true'}
                                                onCheckedChange={(checked) => {
                                                    const val = checked ? 'true' : 'false';
                                                    setSettings((prev) => ({ ...prev, [item.key]: val }));
                                                    handleSave(item.key, val);
                                                }}
                                            />
                                            <span className={`text-xs font-bold uppercase tracking-wider ${settings[item.key] === 'true' ? 'text-green-600' : 'text-slate-400'}`}>
                                                {settings[item.key] === 'true' ? 'ON' : 'OFF'}
                                            </span>
                                            {saving === item.key && <Loader2 className="w-3 h-3 animate-spin text-slate-400 ml-2" />}
                                        </div>
                                    ) : (
                                        <>
                                            <Input
                                                placeholder={item.placeholder}
                                                value={settings[item.key] || ""}
                                                onChange={(e) => setSettings({ ...settings, [item.key]: e.target.value })}
                                                className="flex-1"
                                            />
                                            <Button
                                                onClick={() => handleSave(item.key, settings[item.key])}
                                                disabled={saving === item.key}
                                                variant="outline"
                                                size="sm"
                                            >
                                                {saving === item.key ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <Save className="w-4 h-4" />
                                                )}
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
