"use client";

import { useState } from "react";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import Footer from "./Footer";

export default function AppLayout({ children }) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="flex flex-col h-screen">
      <Navbar onToggleSidebar={() => setIsOpen((o) => !o)} isOpen={isOpen} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar isOpen={isOpen} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <main className="flex-1 overflow-auto p-4 bg-gray-100 dark:bg-[#191919] text-gray-900 dark:text-white">
            {children}
          </main>
          <Footer />
        </div>
      </div>
    </div>
  );
}