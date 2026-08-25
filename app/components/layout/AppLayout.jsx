"use client";

import { useState } from "react";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import Footer from "./Footer";
import useAppTheme from "@/app/hooks/useAppTheme";

export default function AppLayout({ children }) {
  const [isOpen, setIsOpen] = useState(true);
  const { bgSub, textPri } = useAppTheme();

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <Navbar
        onToggleSidebar={() => setIsOpen((o) => !o)}
        isOpen={isOpen}
      />

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <Sidebar isOpen={isOpen} />

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <main
            className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden p-4"
            style={{
              backgroundColor: bgSub,
              color: textPri,
            }}
          >
            {children}
          </main>

          <Footer />
        </div>
      </div>
    </div>
  );
}