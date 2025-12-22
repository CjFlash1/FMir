"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X, Camera } from "lucide-react";
import { Button } from "./ui/button";

export function Navbar() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex">
                        <Link href="/" className="flex-shrink-0 flex items-center gap-2">
                            <div className="bg-red-600 text-white p-1 rounded">
                                <Camera size={24} />
                            </div>
                            <span className="font-bold text-xl tracking-tight text-slate-900">Fujimir</span>
                        </Link>
                    </div>

                    <div className="hidden sm:ml-6 sm:flex sm:items-center sm:space-x-8">
                        <Link href="/upload" className="text-slate-600 hover:text-slate-900 px-3 py-2 rounded-md text-sm font-medium">
                            Order Prints
                        </Link>
                        <Link href="/pricing" className="text-slate-600 hover:text-slate-900 px-3 py-2 rounded-md text-sm font-medium">
                            Pricing
                        </Link>
                        <Link href="/about" className="text-slate-600 hover:text-slate-900 px-3 py-2 rounded-md text-sm font-medium">
                            About
                        </Link>
                        <Link href="/contact" className="text-slate-600 hover:text-slate-900 px-3 py-2 rounded-md text-sm font-medium">
                            Contact
                        </Link>
                        <Button size="sm">
                            Sign In
                        </Button>
                    </div>

                    <div className="-mr-2 flex items-center sm:hidden">
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className="inline-flex items-center justify-center p-2 rounded-md text-slate-400 hover:text-slate-500 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
                        >
                            <span className="sr-only">Open main menu</span>
                            {isOpen ? <X className="block h-6 w-6" /> : <Menu className="block h-6 w-6" />}
                        </button>
                    </div>
                </div>
            </div>

            {isOpen && (
                <div className="sm:hidden mobile-menu">
                    <div className="pt-2 pb-3 space-y-1">
                        <Link href="/upload" className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-slate-600 hover:bg-slate-50 hover:border-slate-300 hover:text-slate-800">
                            Order Prints
                        </Link>
                        <Link href="/pricing" className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-slate-600 hover:bg-slate-50 hover:border-slate-300 hover:text-slate-800">
                            Pricing
                        </Link>
                        <Link href="/about" className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-slate-600 hover:bg-slate-50 hover:border-slate-300 hover:text-slate-800">
                            About
                        </Link>
                        <Link href="/contact" className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-slate-600 hover:bg-slate-50 hover:border-slate-300 hover:text-slate-800">
                            Contact
                        </Link>
                    </div>
                </div>
            )}
        </nav>
    );
}
