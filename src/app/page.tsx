import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 gap-8">
      <main className="flex flex-col gap-4 text-center items-center">
        <h1 className="text-5xl font-bold tracking-tight text-slate-900">
          Fujimir <span className="text-primary-600">Reborn</span>
        </h1>
        <p className="text-xl text-slate-600 max-w-2xl">
          Modern photo printing coming soon.
        </p>
        <Link href="/upload">
          <Button size="lg" className="text-lg px-8 py-6">
            Get Started
          </Button>
        </Link>
      </main>
    </div>
  );
}
