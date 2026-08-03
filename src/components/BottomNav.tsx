"use client";

import Link from "@/components/Link";
import { usePathname } from "next/navigation";
import { Home, Car, Map, Search, Bell, type LucideIcon } from "lucide-react";

const TABS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/", label: "Inicio", icon: Home },
  { href: "/vehiculos", label: "Vehículos", icon: Car },
  { href: "/ciudad", label: "Mapa", icon: Map },
  { href: "/consultar", label: "Consultar", icon: Search },
  { href: "/notificaciones", label: "Avisos", icon: Bell },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="vt-bottom-nav pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-gray-200/80 bg-white/85 backdrop-blur-md dark:border-gray-800/80 dark:bg-gray-950/80">
      <ul className="mx-auto flex max-w-lg items-stretch justify-around">
        {TABS.map((t) => {
          const active =
            t.href === "/" ? pathname === "/" : pathname.startsWith(t.href);
          const Icon = t.icon;
          return (
            <li key={t.href} className="flex-1">
              <Link
                href={t.href}
                aria-current={active ? "page" : undefined}
                className={`pressable flex flex-col items-center gap-1 pt-2.5 pb-1.5 text-[10px] font-medium tracking-tight transition-colors ${
                  active
                    ? "text-brand-600 dark:text-brand-400"
                    : "text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                }`}
              >
                <Icon
                  className="h-[22px] w-[22px]"
                  strokeWidth={active ? 2.4 : 1.9}
                  aria-hidden
                />
                {t.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
