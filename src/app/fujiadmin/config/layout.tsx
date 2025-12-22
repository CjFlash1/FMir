import Link from "next/link";
import { Settings, Maximize, FileText, PlusCircle, Globe, Gift, Percent } from "lucide-react";

const navItems = [
    { name: 'Print Sizes', href: '/fujiadmin/config/sizes', icon: Maximize },
    { name: 'Paper Types', href: '/fujiadmin/config/paper', icon: FileText },
    { name: 'Extra Options', href: '/fujiadmin/config/options', icon: PlusCircle },
    { name: 'Gifts', href: '/fujiadmin/config/gifts', icon: Gift },
    { name: 'Discounts', href: '/fujiadmin/config/discounts', icon: Percent },
    { name: 'Translations', href: '/fujiadmin/config/translations', icon: Globe },
];

export default function ConfigLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-2 mb-8">
                <Settings className="w-8 h-8 text-slate-400" />
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">System Configuration</h1>
            </div>

            <div className="flex gap-4 border-b border-slate-200">
                {navItems.map((item) => (
                    <Link
                        key={item.name}
                        href={item.href}
                        className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-slate-600 hover:text-primary-600 hover:border-b-2 hover:border-primary-600 transition-all border-b-2 border-transparent"
                    >
                        <item.icon className="w-4 h-4" />
                        {item.name}
                    </Link>
                ))}
            </div>

            <div className="pt-4">
                {children}
            </div>
        </div>
    );
}
