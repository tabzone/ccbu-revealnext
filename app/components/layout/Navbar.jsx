"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "../ThemeProvider";

export default function Navbar({ onToggleSidebar }) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();

  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef(null);
  const hoverTimeoutRef = useRef(null);

  const isRetailerPlanogram = pathname?.startsWith("/retailerPlanogram");
  const parts = pathname?.split("/") || [];
  const retailerId = parts[2];
  const retailerName = retailerId ? `Retailer ${retailerId}` : "Retailer Planogram";

  const handleMouseEnter = () => {
    clearTimeout(hoverTimeoutRef.current);
    setShowUserMenu(true);
  };

  const handleMouseLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setShowUserMenu(false);
    }, 150);
  };

  useEffect(() => {
    return () => clearTimeout(hoverTimeoutRef.current);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  // Theme-aware colors
  const isDark = theme === "dark";
  const headerBg = isDark ? "#191919" : "#ffffff";
  const borderColor = isDark ? "#333333" : "#e5e7eb";
  const textPrimary = isDark ? "#e5e7eb" : "#1f2937";
  const textSecondary = isDark ? "#9ca3af" : "#6b7280";
  const hoverBg = isDark ? "#333333" : "#f3f4f6";
  const buttonActiveBg = isDark ? "#2a2a2a" : "#f3f4f6";
  const dropdownBg = isDark ? "#242424" : "#ffffff";
  const dropdownBorder = isDark ? "#3f3f3f" : "#e5e7eb";
  const headerBgDrop = isDark ? "#2a2a2a" : "#f9fafb";
  const menuItemHover = isDark ? "#3f3f3f" : "#f3f4f6";
  const redText = isDark ? "#f87171" : "#dc2626";

  return (
    <header
      className="sticky top-0 z-40 border-b"
      style={{
        backgroundColor: headerBg,
        borderColor: borderColor,
      }}
    >
      <div className="flex items-center justify-between h-16 px-6 gap-6">

        {/* Sidebar toggle */}
        <button
          onClick={onToggleSidebar}
          className="flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-200 flex-shrink-0"
          style={{ color: textSecondary }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = hoverBg; e.currentTarget.style.color = textPrimary; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = textSecondary; }}
          aria-label="Toggle sidebar"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>

        {/* Logo */}
        <Link href="/" className="flex-shrink-0">
          <img src="/logo.avif" alt="logo" className="h-10 w-auto" />
        </Link>

        {/* Left Section - Back Button & Project Info */}
        {isRetailerPlanogram && (
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/")}
              className="flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-200 cursor-pointer"
              style={{
                color: textSecondary,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "#F40009";
                e.currentTarget.style.backgroundColor = hoverBg;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = textSecondary;
                e.currentTarget.style.backgroundColor = "transparent";
              }}
              aria-label="Go back"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path
                  d="M15 18L9 12L15 6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>

            <div style={{ height: "28px", width: "1px", backgroundColor: borderColor }} />

            <div className="flex flex-col gap-1">
              <h1 style={{ color: textPrimary }} className="text-base font-semibold">
                {retailerName}
              </h1>
              <p style={{ color: textSecondary }} className="text-xs">
                Retailer Planogram
              </p>
            </div>
          </div>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Right Section - Actions & User Menu */}
        <div className="flex items-center gap-4">

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="flex items-center cursor-pointer justify-center w-9 h-9 rounded-lg transition-all duration-200"
            style={{
              color: textSecondary,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = textPrimary;
              e.currentTarget.style.backgroundColor = '';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = textSecondary;
              e.currentTarget.style.backgroundColor = "transparent";
            }}
            aria-label="Toggle theme"
          >
            {theme === "light" ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M21 12.79A9 9 0 1 1 11.21 3c0 .28.02.56.05.84A7 7 0 0 0 21 12.79z" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="12" cy="12" r="5" />
                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
              </svg>
            )}
          </button>

          {/* Divider */}
          <div style={{ height: "28px", width: "1px", backgroundColor: borderColor }} />

          {/* User Menu - Hover Dropdown */}
          <div
            className="relative"
            ref={menuRef}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <button
              className="flex items-center cursor-pointer gap-3 px-3 py-2 rounded-lg transition-all duration-200"
              style={{
                backgroundColor: showUserMenu ? buttonActiveBg : "transparent",
                color: textPrimary,
              }}
              aria-haspopup="menu"
              aria-expanded={showUserMenu}
            >
              {/* <div
                className="w-9 h-9 rounded-full text-white flex items-center justify-center text-xs font-semibold flex-shrink-0 shadow-md"
                style={{
                  background: "linear-gradient(135deg, #F40009 0%, #D60008 100%)",
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 20c0-3.3137 3.58172-6 8-6s8 2.6863 8 6" strokeLinecap="round" />
                </svg>
              </div> */}

              <div className="flex flex-col gap-0.5">
                {/* <span style={{ color: textPrimary }} className="text-sm font-semibold">
                  Account
                </span> */}
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 20c0-3.3137 3.58172-6 8-6s8 2.6863 8 6" strokeLinecap="round" />
                </svg>
              </div>

              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className={`transition-transform duration-200 flex-shrink-0 ${showUserMenu ? "rotate-180" : ""}`}
                style={{ color: textSecondary }}
              >
                <path d="M6 9L12 15L18 9" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            {/* User Menu Dropdown */}
            {showUserMenu && (
              <div
                className="absolute right-0 mt-3  rounded-xl shadow-2xl overflow-hidden z-50"
                style={{
                     width: "200px",
                  backgroundColor: dropdownBg,
                  border: `1px solid ${dropdownBorder}`,
                }}
                role="menu"
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
              >
                {/* Menu Items */}
                <div className="py-2">
                  <button
                    onClick={() => {
                      router.push("/profile");
                      setShowUserMenu(false);
                    }}
                    className="w-full px-5 py-3 text-left text-sm cursor-pointer transition-colors duration-150 flex items-center gap-3"
                    style={{
                      color: textPrimary,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = menuItemHover;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                    }}
                    role="menuitem"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="flex-shrink-0">
                      <circle cx="12" cy="8" r="4" />
                      <path d="M4 20c0-3.3137 3.58172-6 8-6s8 2.6863 8 6" strokeLinecap="round" />
                    </svg>
                    <span>Profile Settings</span>
                  </button>

                  <button
                    onClick={() => {
                      handleLogout();
                      setShowUserMenu(false);
                    }}
                    className="w-full px-5 py-3 text-left text-sm cursor-pointer  transition-colors duration-150 flex items-center gap-3"
                    style={{
                      color: redText,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = isDark ? "rgba(239, 68, 68, 0.1)" : "rgba(239, 68, 68, 0.05)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                    }}
                    role="menuitem"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="flex-shrink-0">
                      <path d="M9 21H5C4.44772 21 4 20.5523 4 20V4C4 3.44772 4.44772 3 5 3H9" strokeLinecap="round" />
                      <path d="M16 17L21 12L16 7" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M21 12H9" strokeLinecap="round" />
                    </svg>
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}