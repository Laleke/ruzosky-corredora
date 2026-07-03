"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  Users,
  UserSquare2,
  FileText,
  Receipt,
  Wallet,
  LogOut,
  Menu,
  X,
} from "lucide-react";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/propiedades", label: "Propiedades", icon: Building2 },
  { href: "/propietarios", label: "Propietarios", icon: Users },
  { href: "/arrendatarios", label: "Arrendatarios", icon: UserSquare2 },
  { href: "/contratos", label: "Contratos", icon: FileText },
  { href: "/cobros", label: "Cobros y pagos", icon: Receipt },
  { href: "/liquidaciones", label: "Liquidaciones", icon: Wallet },
];

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-1 flex-col gap-1 px-3">
      {NAV.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
              active
                ? "bg-burgundy text-white"
                : "text-white/70 hover:bg-white/10 hover:text-white"
            }`}
          >
            <Icon size={18} strokeWidth={2} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

function Marca() {
  return (
    <div className="flex items-center gap-2.5 px-5 py-5">
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-burgundy text-xs font-bold text-white">
        RZK
      </span>
      <div className="leading-tight">
        <p className="text-sm font-semibold text-white">RZK Prop</p>
        <p className="text-xs text-white/50">Administración</p>
      </div>
    </div>
  );
}

function SalirBtn() {
  return (
    <form action="/auth/signout" method="post" className="px-3 pb-4 pt-2">
      <button
        type="submit"
        className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white"
      >
        <LogOut size={18} />
        Cerrar sesión
      </button>
    </form>
  );
}

export function Sidebar({
  nombre,
  rol,
}: {
  nombre: string;
  rol: string;
}) {
  const [abierto, setAbierto] = useState(false);

  return (
    <>
      {/* Topbar móvil */}
      <header className="no-print sticky top-0 z-30 flex items-center justify-between border-b border-line bg-white px-4 py-3 md:hidden">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-burgundy text-[10px] font-bold text-white">
            RZK
          </span>
          <span className="font-semibold text-ink">RZK Prop</span>
        </div>
        <button
          onClick={() => setAbierto(true)}
          aria-label="Abrir menú"
          className="rounded-lg p-2 text-ink hover:bg-stone-100"
        >
          <Menu size={22} />
        </button>
      </header>

      {/* Sidebar desktop */}
      <aside className="no-print fixed inset-y-0 left-0 z-30 hidden w-64 flex-col bg-ink md:flex">
        <Marca />
        <NavLinks />
        <div className="mx-3 mb-2 rounded-lg bg-white/5 px-3 py-2.5">
          <p className="truncate text-sm font-medium text-white">{nombre}</p>
          <p className="text-xs uppercase tracking-wide text-burgundy-50/70">
            {rol}
          </p>
        </div>
        <SalirBtn />
      </aside>

      {/* Drawer móvil */}
      {abierto && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setAbierto(false)}
          />
          <div className="absolute inset-y-0 left-0 flex w-64 flex-col bg-ink">
            <div className="flex items-center justify-between pr-3">
              <Marca />
              <button
                onClick={() => setAbierto(false)}
                aria-label="Cerrar menú"
                className="rounded-lg p-2 text-white/70 hover:bg-white/10"
              >
                <X size={20} />
              </button>
            </div>
            <NavLinks onNavigate={() => setAbierto(false)} />
            <div className="mx-3 mb-2 rounded-lg bg-white/5 px-3 py-2.5">
              <p className="truncate text-sm font-medium text-white">{nombre}</p>
              <p className="text-xs uppercase tracking-wide text-burgundy-50/70">
                {rol}
              </p>
            </div>
            <SalirBtn />
          </div>
        </div>
      )}
    </>
  );
}
