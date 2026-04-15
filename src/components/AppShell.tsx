import { useCallback, useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { Toaster } from "sonner";
import TopBar from "./TopBar";
import Sidebar from "./sidebar/Sidebar";
import SearchPalette from "./search/SearchPalette";

const GRID_STYLE = {
  gridTemplateColumns: "284px 1fr",
  gridTemplateRows: "64px 1fr",
} as const;

const TOASTER_STYLE = {
  background: "#1F2128",
  border: "1px solid #2A2D34",
  color: "#E3E3E7",
  fontFamily: '"Roboto Flex Variable", "Roboto Flex", system-ui, sans-serif',
  fontSize: "13px",
  borderRadius: "12px",
} as const;

export default function AppShell() {
  const [searchOpen, setSearchOpen] = useState(false);

  const openSearch = useCallback(() => setSearchOpen(true), []);
  const closeSearch = useCallback(() => setSearchOpen(false), []);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === "Escape") setSearchOpen(false);
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  return (
    <div className="h-full grid" style={GRID_STYLE}>
      <TopBar onOpenSearch={openSearch} />
      <Sidebar />
      <main className="row-start-2 col-start-2 overflow-y-auto bg-vsc-bg">
        <Outlet />
      </main>
      <SearchPalette open={searchOpen} onClose={closeSearch} />
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
