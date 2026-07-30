"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "Inicio", icon: "🏠" },
  { href: "/vehiculos", label: "Vehículos", icon: "🚗" },
  { href: "/ciudad", label: "Mapa", icon: "🗺️" },
  { href: "/consultar", label: "Consultar", icon: "🔎" },
  { href: "/notificaciones", label: "Avisos", icon: "🔔" },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
      <ul className="mx-auto flex max-w-lg items-stretch justify-around">
        {TABS.map((t) => {
          const active =
            t.href === "/" ? pathname === "/" : pathname.startsWith(t.href);
          return (
            <li key={t.href} className="flex-1">
              <Link
                href={t.href}
                className={`flex flex-col items-center gap-0.5 py-2 text-[11px] ${
                  active
                    ? "text-brand-600 dark:text-brand-400"
                    : "text-gray-400 dark:text-gray-500"
                }`}
              >
                <span className="text-xl leading-none">{t.icon}</span>
                {t.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
