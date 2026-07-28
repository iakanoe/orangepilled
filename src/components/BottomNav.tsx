"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "Inicio", icon: "🏠" },
  { href: "/vehiculos", label: "Vehículos", icon: "🚗" },
  { href: "/reportar", label: "Reportar", icon: "➕", center: true },
  { href: "/notificaciones", label: "Avisos", icon: "🔔" },
  { href: "/perfil", label: "Perfil", icon: "👤" },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white">
      <ul className="mx-auto flex max-w-lg items-stretch justify-around">
        {TABS.map((t) => {
          const active =
            t.href === "/" ? pathname === "/" : pathname.startsWith(t.href);
          if (t.center) {
            return (
              <li key={t.href} className="relative -mt-5">
                <Link
                  href={t.href}
                  aria-label={t.label}
                  className="grid h-14 w-14 place-items-center rounded-full bg-brand-600 text-2xl text-white shadow-lg"
                >
                  {t.icon}
                </Link>
              </li>
            );
          }
          return (
            <li key={t.href} className="flex-1">
              <Link
                href={t.href}
                className={`flex flex-col items-center gap-0.5 py-2 text-[11px] ${
                  active ? "text-brand-600" : "text-gray-400"
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
