export function Footer() {
    return (
        <footer className="bg-slate-50 border-t border-slate-200 mt-auto">
            <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 md:flex md:items-center md:justify-between lg:px-8">
                <div className="mt-8 md:mt-0 md:order-1">
                    <p className="text-center text-base text-slate-400">
                        &copy; {new Date().getFullYear()} Fujimir. All rights reserved. Dnipro, Ukraine.
                    </p>
                </div>
            </div>
        </footer>
    );
}
