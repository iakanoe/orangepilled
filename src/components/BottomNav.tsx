"use client";

import Link from "@/components/Link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Home, Car, Map, Search, Bell, type LucideIcon } from "lucide-react";

const TABS: { href: string; labelKey: string; icon: LucideIcon }[] = [
  { href: "/", labelKey: "inicio", icon: Home },
  { href: "/vehiculos", labelKey: "vehiculos", icon: Car },
  { href: "/ciudad", labelKey: "mapa", icon: Map },
  { href: "/consultar", labelKey: "consultar", icon: Search },
  { href: "/notificaciones", labelKey: "avisos", icon: Bell },
];

export default function BottomNav() {
  const pathname = usePathname();
  const t = useTranslations("nav");

  return (
    <nav className="vt-bottom-nav pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-gray-200/80 bg-white/85 backdrop-blur-md dark:border-gray-800/80 dark:bg-gray-950/80">
      <ul className="mx-auto flex max-w-lg items-stretch justify-around">
        {TABS.map((tab) => {
          const active =
            tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
          const Icon = tab.icon;
          return (
            <li key={tab.href} className="flex-1">
              <Link
                href={tab.href}
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
                {t(tab.labelKey)}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
