"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  FileText,
  Wallet,
  Receipt,
  FolderOpen,
  ClipboardCheck,
  KeyRound,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import type { EntidadPortal } from "./types";

const NAV_BASE = [{ href: "/portal", label: "Inicio", icon: LayoutDashboard }];
const NAV_FINAL = [{ href: "/portal/cuenta", label: "Mi cuenta", icon: KeyRound }];

const NAV_POR_ROL: Record<EntidadPortal, typeof NAV_BASE> = {
  propietario: [
    { href: "/portal/propiedades", label: "Mis propiedades", icon: Building2 },
    { href: "/portal/contratos", label: "Mis contratos", icon: FileText },
    { href: "/portal/liquidaciones", label: "Mis liquidaciones", icon: Receipt },
    { href: "/portal/solicitudes", label: "Solicitudes de pago", icon: ClipboardCheck },
    { href: "/portal/documentos", label: "Mis documentos", icon: FolderOpen },
  ],
  arrendatario: [
    { href: "/portal/contratos", label: "Mis contratos", icon: FileText },
    { href: "/portal/cargos", label: "Mis cargos y pagos", icon: Wallet },
    { href: "/portal/documentos", label: "Mis documentos", icon: FolderOpen },
  ],
};

function NavLinks({ rol, onNavigate }: { rol: EntidadPortal; onNavigate?: () => void }) {
  const pathname = usePathname();
  const nav = [...NAV_BASE, ...NAV_POR_ROL[rol], ...NAV_FINAL];
  return (
    <nav className="flex flex-1 flex-col gap-1 px-3">
      {nav.map(({ href, label, icon: Icon }) => {
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
        <p className="text-xs text-white/50">Portal</p>
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

export function PortalSidebar({ nombre, rol }: { nombre: string; rol: EntidadPortal }) {
  const [abierto, setAbierto] = useState(false);
  const rolLabel = rol === "propietario" ? "Propietario" : "Arrendatario";

  return (
    <>
      <header className="no-print sticky top-0 z-30 flex items-center justify-between border-b border-white/10 bg-canvas px-4 py-3 md:hidden">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-burgundy text-[10px] font-bold text-white">
            RZK
          </span>
          <span className="font-semibold text-canvas-fg">RZK Prop</span>
        </div>
        <button
          onClick={() => setAbierto(true)}
          aria-label="Abrir menú"
          className="rounded-lg p-2 text-canvas-fg hover:bg-white/10"
        >
          <Menu size={22} />
        </button>
      </header>

      <aside className="no-print fixed inset-y-0 left-0 z-30 hidden w-64 flex-col bg-ink md:flex">
        <Marca />
        <NavLinks rol={rol} />
        <div className="mx-3 mb-2 rounded-lg bg-white/5 px-3 py-2.5">
          <p className="truncate text-sm font-medium text-white">{nombre}</p>
          <p className="text-xs uppercase tracking-wide text-burgundy-50/70">{rolLabel}</p>
        </div>
        <SalirBtn />
      </aside>

      {abierto && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setAbierto(false)} />
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
            <NavLinks rol={rol} onNavigate={() => setAbierto(false)} />
            <div className="mx-3 mb-2 rounded-lg bg-white/5 px-3 py-2.5">
              <p className="truncate text-sm font-medium text-white">{nombre}</p>
              <p className="text-xs uppercase tracking-wide text-burgundy-50/70">{rolLabel}</p>
            </div>
            <SalirBtn />
          </div>
        </div>
      )}
    </>
  );
}
