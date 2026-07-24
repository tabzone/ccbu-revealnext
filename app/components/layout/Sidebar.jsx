"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import useAppTheme from "@/app/hooks/useAppTheme";

export default function Sidebar({ isOpen }) {
  const pathname = usePathname();
  const [expandedItems, setExpandedItems] = useState([]);
  const { bg, border, textPri, textSec, hover, accent } = useAppTheme();

  const getNavItems = () => {
    if (pathname?.startsWith("/retailerPlanogram")) {
      const parts = pathname.split("/");
      const id = parts[2] || "0";

      return [
        {
          label: "Master Data",
          href: "#",
          icon: (
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
              <path d="M4 6h16M4 10h16M4 14h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              <rect x="13" y="12" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
            </svg>
          ),
          children: [
            { label: "Products", href: `/retailerPlanogram/${id}/products` },
            { label: "Stores", href: `/retailerPlanogram/${id}/stores` },
            { label: "Week Setup", href: `/retailerPlanogram/${id}/timesetup` },
          ],
        },
        {
          label: "Planogram",
          href: `https://revealpog.vercel.app`,
          target: "_blank",
          rel: "noopener noreferrer",
          icon: (
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
              <rect x="3" y="4" width="18" height="16" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
              <path d="M3 9.33h18M3 14.67h18M9 4v16M15 4v16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          ),
        },
        {
          label: "Weekly Sales Upload",
          href: `/retailerPlanogram/${id}/weeklySalesUpload`,
          icon: (
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
              <path d="M5 9h14v10H5V9Z" stroke="currentColor" strokeWidth="1.8" />
              <path d="M4 9l1-4h14l1 4" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
              <path d="M12 18v-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              <path d="M9.5 15.5L12 13l2.5 2.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ),
        },
        {
          label: "Settings",
          href: "#",
          children: [{ label: "Users", href: `/retailerPlanogram/${id}/users` }],
          icon: (
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
              <path d="M12 2V5M12 19V22M2 12H5M19 12H22M4.9 4.9L7 7M17 17L19.1 19.1M19.1 4.9L17 7M7 17L4.9 19.1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          ),
        },
      ];
    }

    return [
      {
        label: "Dashboard",
        href: "/",
        icon: (
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
            <rect x="3" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
            <rect x="14" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
            <rect x="3" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
            <rect x="14" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
          </svg>
        ),
      },
      {
        label: "Manage Reports",
        href: "/manageReports",
        icon: (
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
            <path d="M9 17H15M9 13H15M9 9H11M5 3H19C19.5523 3 20 3.44772 20 4V20C20 20.5523 19.5523 21 19 21H5C4.44772 21 4 20.5523 4 20V4C4 3.44772 4.44772 3 5 3Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        ),
      },
      {
        label: "Users",
        href: "/users",
        icon: (
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.8" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ),
      },
    ];
  };

  const navItems = useMemo(() => getNavItems(), [pathname]);

  // Check if item should be expanded (user toggle OR pathname match)
  const isItemExpanded = (item) => {
    const userToggled = expandedItems.includes(item.label);
    const pathMatches = item.children?.some(
      (child) => pathname === child.href || pathname?.startsWith(child.href + "/")
    );
    return userToggled || pathMatches;
  };

  const isItemActive = (item) => {
    return item.children?.some(
      (child) => pathname === child.href || pathname?.startsWith(child.href + "/")
    ) || (item.href !== "#" && (pathname === item.href || pathname?.startsWith(item.href + "/")));
  };

  return (
    <aside
      className={`
        h-screen
        border-r
        transition-all
        duration-300
        flex
        flex-col
        ${isOpen ? "w-64" : "w-20"}
      `}
      style={{ backgroundColor: bg, borderColor: border, color: textPri }}
    >
      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto mt-4 px-3 py-4 space-y-2" role="navigation" aria-label="Main navigation">
        {navItems.map((item) => {
          const expanded = isItemExpanded(item);
          const active = isItemActive(item);

          if (item.children) {
            const submenuId = `submenu-${item.label.replace(/\s+/g, "-")}`;

            return (
              <div key={item.label}>
                <button
                  type="button"
                  aria-expanded={expanded}
                  aria-controls={submenuId}
                  onClick={() =>
                    setExpandedItems((prev) =>
                      prev.includes(item.label) ? prev.filter((x) => x !== item.label) : [...prev, item.label]
                    )
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setExpandedItems((prev) =>
                        prev.includes(item.label) ? prev.filter((x) => x !== item.label) : [...prev, item.label]
                      );
                    }
                  }}
                  className="group relative w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 cursor-pointer"
                  style={{
                    color: active ? accent : textSec,
                    backgroundColor: active ? `${accent}1a` : "transparent",
                  }}
                  onMouseEnter={(e) => {
                    if (active) return;
                    e.currentTarget.style.color = textPri;
                    e.currentTarget.style.backgroundColor = hover;
                  }}
                  onMouseLeave={(e) => {
                    if (active) return;
                    e.currentTarget.style.color = textSec;
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  <span className="w-5 h-5 flex-shrink-0">{item.icon}</span>
                  {isOpen && (
                    <>
                      <span className="flex-1 text-left text-base font-medium">{item.label}</span>
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        className={`flex-shrink-0 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
                      >
                        <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </>
                  )}
                </button>

                {expanded && isOpen && (
                  <div id={submenuId} role="group" aria-label={`${item.label} submenu`} className="mt-1 space-y-1">
                    {item.children.map((child) => {
                      const childActive = pathname === child.href || pathname?.startsWith(child.href + "/");
                      return (
                        <Link
                          key={child.label}
                          href={child.href}
                          aria-current={childActive ? "page" : undefined}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-base transition-all duration-200 border-l-2 ml-2"
                          style={{
                            borderLeftColor: childActive ? accent : "transparent",
                            color: childActive ? accent : textSec,
                            backgroundColor: childActive ? `${accent}1a` : "transparent",
                            fontWeight: childActive ? 500 : 400,
                          }}
                          onMouseEnter={(e) => {
                            if (childActive) return;
                            e.currentTarget.style.color = textPri;
                            e.currentTarget.style.backgroundColor = hover;
                          }}
                          onMouseLeave={(e) => {
                            if (childActive) return;
                            e.currentTarget.style.color = textSec;
                            e.currentTarget.style.backgroundColor = "transparent";
                          }}
                        >
                          <span className="w-2 h-2 ml-4" />
                          <span >{child.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          return (
            <Link
              key={item.label}
              href={item.href}
              target={item.target}
              rel={item.rel}
              aria-current={active ? "page" : undefined}
              className="flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 border-l-2"
              style={{
                borderLeftColor: active ? accent : "transparent",
                color: active ? accent : textSec,
                backgroundColor: active ? `${accent}1a` : "transparent",
                fontWeight: active ? 500 : 400,
              }}
              onMouseEnter={(e) => {
                if (active) return;
                e.currentTarget.style.color = textPri;
                e.currentTarget.style.backgroundColor = hover;
              }}
              onMouseLeave={(e) => {
                if (active) return;
                e.currentTarget.style.color = textSec;
                e.currentTarget.style.backgroundColor = "transparent";
              }}
            >
              <span className="w-5 h-5 flex-shrink-0">{item.icon}</span>
              {isOpen && (
                <span className="flex items-center gap-1.5">
                  <span className="text-base font-medium">{item.label}</span>
                  {item.target === "_blank" && (
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 opacity-70">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                      <polyline points="15 3 21 3 21 9" />
                      <line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                  )}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}