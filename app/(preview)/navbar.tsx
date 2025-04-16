"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function Navbar() {
  const pathname = usePathname();
  
  return (
    <header className="sticky top-0 z-50 w-full border-b border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex">
          <Link href="/" className="flex items-center space-x-2">
            <span className="font-bold text-lg">RAG AI</span>
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-2">
          {pathname === "/" ? (
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin">Área Administrativa</Link>
            </Button>
          ) : pathname.includes("/admin") ? (
            <Button variant="outline" size="sm" asChild>
              <Link href="/">Voltar ao Chat</Link>
            </Button>
          ) : null}
        </div>
      </div>
    </header>
  );
} 