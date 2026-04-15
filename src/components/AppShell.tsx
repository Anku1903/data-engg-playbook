import { useCallback, useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Toaster } from "sonner";
import TopBar from "./TopBar";
import Sidebar from "./sidebar/Sidebar";

const TOASTER_STYLE = {
  background: "#1F2128",
  border: "1px solid #2A2D34",
  color: "#E3E3E7",
  fontFamily: '"Roboto Flex Variable", "Roboto Flex", system-ui, sans-serif',
  fontSize: "13px",
  borderRadius: "12px",
} as const;

export default function AppShell() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { pathname } = useLocation();

  const openMenu = useCallback(() => setMobileMenuOpen(true), []);
  const closeMenu = useCallback(() => setMobileMenuOpen(false), []);

  // Close mobile menu on route change.
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Close mobile menu on Escape.
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileMenuOpen(false);
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  return (
    <div className="h-full flex flex-col md:grid md:grid-rows-[64px_1fr] md:grid-cols-[284px_1fr]">
      <TopBar onOpenMenu={openMenu} />
      <Sidebar mobileOpen={mobileMenuOpen} onCloseMobile={closeMenu} />
      <main className="md:row-start-2 md:col-start-2 flex-1 min-h-0 overflow-y-auto bg-vsc-bg">
        <Outlet />
      </main>
      <Toaster
        theme="dark"
        position="bottom-right"
        richColors
        closeButton
        toastOptions={{ style: TOASTER_STYLE }}
      />
    </div>
  );
}
