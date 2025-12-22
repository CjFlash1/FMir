"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Save, Globe, Phone, Mail, Instagram, Facebook } from "lucide-react";

const SETTING_GROUPS = [
    {
        title: "General Information",
        description: "Basic site configuration and metadata.",
        items: [
            { key: "site_name", label: "Site Name", icon: Globe, placeholder: "e.g. Fujimir Photo Center" },
            { key: "contact_email", label: "Support Email", icon: Mail, placeholder: "contact@fujimir.com.ua" },
            { key: "contact_phone", label: "Contact Phone", icon: Phone, placeholder: "+380..." },
        ]
    },
    {
        title: "Social Links",
        description: "Links to your social media profiles.",
        items: [
            { key: "social_instagram", label: "Instagram URL", icon: Instagram, placeholder: "https://instagram.com/..." },
            { key: "social_facebook", label: "Facebook URL", icon: Facebook, placeholder: "https://facebook.com/..." },
        ]
    }
];

export default function SettingsPage() {
    const [settings, setSettings] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<string | null>(null);

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
            <h1 className="text-2xl font-bold">Global Settings</h1>

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
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
