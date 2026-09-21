"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter, useParams } from "next/navigation";
import useAppTheme from "@/app/hooks/useAppTheme";
import { useAuth } from "../AuthProvider";
import { apiGet } from "@/lib/api";
import Modal from "../modal/Modal";
import { useProject } from "@/app/hooks/useProject";
import { ArrowLeft, PencilLine } from "lucide-react";

export default function Navbar({ onToggleSidebar }) {
  const pathname = usePathname();
  const router = useRouter();
  const params = useParams();
  const { theme, toggleTheme, isDark, accent, bg: headerBg, border: borderColor, textPri: textPrimary, textSec: textSecondary, hover: hoverBg, bgSub: buttonActiveBg, bgDrop: dropdownBg } = useAppTheme();
  const { logout } = useAuth();

  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef(null);
  const hoverTimeoutRef = useRef(null);

  const isProjectRoute = pathname?.includes("/projectplanogram");
  const isRetailerPlanogram = pathname?.startsWith("/retailerPlanogram") && !pathname?.includes("/projectplanogram");
  const isProjectPlanogram = isProjectRoute;
  const parts = pathname?.split("/") || [];
  const retailerId = parts[2];

  const [retailerName, setRetailerName] = useState("Retailer Planogram");
  const { project: currentProject, loading: projectLoading } = useProject();
  const projectName = currentProject?.projName || currentProject?.projectName || currentProject?.name || currentProject?.project?.projName || currentProject?.project?.projectName || "";
  const [editModal, setEditModal] = useState(false);

  useEffect(() => {
    if (!isRetailerPlanogram || !retailerId) {
      setRetailerName("Retailer Planogram");
      return;
    }

    let cancelled = false;
    setRetailerName(`Retailer ${retailerId}`);

    apiGet(`/retailers/${retailerId}`)
      .then((res) => {
        if (cancelled) return;
        const retailer = res?.data ?? res?.retailer ?? res;
        const name = retailer?.name ?? retailer?.retailer_name;
        if (name) setRetailerName(name);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [isRetailerPlanogram, retailerId]);

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

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const handleCancel = () => {
    setEditModal(false);
  };
  const closeModal = () => {
    setEditModal(false);
  };

  // Navbar-specific derived colors (not part of the shared theme palette)
  const dropdownBorder = isDark ? "#3f3f3f" : "#e5e7eb";
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
      <div className="flex items-center justify-between h-16 px-6 gap-4">

        {/* Sidebar toggle */}
        <button
          onClick={onToggleSidebar}
          className="flex items-center cursor-pointer justify-center w-9 h-9 rounded-lg transition-all duration-200 flex-shrink-0"
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
          <img src="/logo.png" alt="logo" className="h-8 w-auto" />
        </Link>
        <div style={{ height: "28px", width: "1px", backgroundColor: borderColor }} className="ml-5"/>

        {/* Project Planogram context — V3 behavior */}
        {isProjectPlanogram && (
          <div className="flex items-center gap-2">
            <Link
                href={`/retailerPlanogram/${retailerId}/masterdata`}
              className="flex items-center gap-1 px-2 py-1 border border-gray-400 ml-2 cursor-pointer text-sm"
              style={{ color: textSecondary, borderColor: dropdownBorder }}
            >
              <ArrowLeft className="w-5 h-5" />
              Exit Project
            </Link>
            {projectLoading ? (
              <div className="h-5 w-96 bg-gray-200 rounded animate-pulse"></div>
            ) : currentProject ? (
              <div className="flex gap-2 items-center ">
                <span
                  className="text-gray-600 italic text-base max-w-[150px] md:max-w-[400px] truncate block"
                  title={currentProject?.projName}
                  style={{ color: isDark ? textPrimary : "#4b5563" }}
                >
                  {currentProject?.projName}
                </span>
                <button
                  onClick={() => setEditModal(true)}
                  className="cursor-pointer text-blue-500 hover:text-blue-600"
                >
                  <PencilLine className="w-4 h-4" />
                </button>
                <button className="border px-1 border-gray-400 text-gray-400 text-sm">{currentProject?.retailerName}</button>
              </div>
            ) : null}
          </div>
        )}

        {/* Left Section - Retailer Back Button & Project Info (existing) */}
        {isRetailerPlanogram && (
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/manageReports")}
              className="flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-200 cursor-pointer"
              style={{
                color: textSecondary,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = accent;
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

            <div style={{ height: "28px", width: "1px", backgroundColor: borderColor }}  />

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
              <div className="flex flex-col gap-0.5">
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
      {/* Project Details Modal — V3 exact */}
      <Modal
        isOpen={editModal}
        onClose={handleCancel}
        maxWidth="max-w-2xl"
        maxHeight="h-[450px]"
      >
        <div className="h-full flex flex-col gap-2">
          <div className="px-6 py-2 border-b border-gray-200 flex-shrink-0">
            <h2 className="text-lg font-semibold">Project Details</h2>
          </div>
          <div className="flex flex-col gap-4 px-8 py-4 flex-1 overflow-auto">
            <div className="flex items-center gap-4">
              <label className="w-40 text-gray-700 font-medium">Project Name:</label>
              <input
                defaultValue={currentProject?.projName || ""}
                className="flex-1 border border-gray-300 rounded-md p-2 text-sm focus:outline-none opacity-60"
                placeholder="Enter project name"
                readOnly
              />
            </div>

            <div className="flex items-center gap-4">
              <label className="w-40 text-gray-700 font-medium">Retailer Name:</label>
              <input
                defaultValue={currentProject?.retailerName || ""}
                className="flex-1 border border-gray-300 rounded-md p-2 text-sm focus:outline-none opacity-60"
                placeholder="Enter retailer name"
                readOnly
              />
            </div>

            <div className="flex items-center gap-4">
              <label className="w-40 text-gray-700 font-medium">Store Extraction:</label>
              {currentProject?.storeExtraction == 1 && (
                <input
                  defaultValue='From File Name / Use PSA File Name'
                  className="flex-1 border border-gray-300 rounded-md p-2 text-sm focus:outline-none opacity-60"
                  placeholder="Enter store extraction"
                  readOnly
                />
              )}
              {currentProject?.storeExtraction == 2 && (
                <input
                  defaultValue='Use PSA File Name / Use Planogram Project Name'
                  className="flex-1 border border-gray-300 rounded-md p-2 text-sm focus:outline-none opacity-60"
                  placeholder="Enter store extraction"
                  readOnly
                />
              )}
              {currentProject?.storeExtraction == 3 && (
                <input
                  defaultValue='Use PSA File Name / Use Planogram Name'
                  className="flex-1 border border-gray-300 rounded-md p-2 text-sm focus:outline-none opacity-60"
                  placeholder="Enter store extraction"
                  readOnly
                />
              )}
              {currentProject?.storeExtraction == 4 && (
                <input
                  defaultValue='Use Planogram Description Field / Desc 1'
                  className="flex-1 border border-gray-300 rounded-md p-2 text-sm focus:outline-none opacity-60"
                  placeholder="Enter store extraction"
                  readOnly
                />
              )}
              {currentProject?.storeExtraction == 5 && (
                <input
                  defaultValue='Use Planogram Description Field / Desc 2'
                  className="flex-1 border border-gray-300 rounded-md p-2 text-sm focus:outline-none opacity-60"
                  placeholder="Enter store extraction"
                  readOnly
                />
              )}
              {currentProject?.storeExtraction == 6 && (
                <input
                  defaultValue='Use Planogram Description Field / Desc 3'
                  className="flex-1 border border-gray-300 rounded-md p-2 text-sm focus:outline-none opacity-60"
                  placeholder="Enter store extraction"
                  readOnly
                />
              )}
              {currentProject?.storeExtraction == 7 && (
                <input
                  defaultValue='Use Planogram Description Field / Desc 4'
                  className="flex-1 border border-gray-300 rounded-md p-2 text-sm focus:outline-none opacity-60"
                  placeholder="Enter store extraction"
                  readOnly
                />
              )}
              {currentProject?.storeExtraction == 8 && (
                <input
                  defaultValue='Use Planogram Description Field / Desc 5'
                  className="flex-1 border border-gray-300 rounded-md p-2 text-sm focus:outline-none opacity-60"
                  placeholder="Enter store extraction"
                  readOnly
                />
              )}
              {currentProject?.storeExtraction == 9 && (
                <input
                  defaultValue='Use Planogram Description Field / Desc 6'
                  className="flex-1 border border-gray-300 rounded-md p-2 text-sm focus:outline-none opacity-60"
                  placeholder="Enter store extraction"
                  readOnly
                />
              )}
              {currentProject?.storeExtraction == 10 && (
                <input
                  defaultValue='Use Planogram Description Field / Desc 7'
                  className="flex-1 border border-gray-300 rounded-md p-2 text-sm focus:outline-none opacity-60"
                  placeholder="Enter store extraction"
                  readOnly
                />
              )}
              {currentProject?.storeExtraction == 11 && (
                <input
                  defaultValue='Use Planogram Description Field / Desc 8'
                  className="flex-1 border border-gray-300 rounded-md p-2 text-sm focus:outline-none opacity-60"
                  placeholder="Enter store extraction"
                  readOnly
                />
              )}
              {currentProject?.storeExtraction == 12 && (
                <input
                  defaultValue='Use Planogram Description Field / Desc 9'
                  className="flex-1 border border-gray-300 rounded-md p-2 text-sm focus:outline-none opacity-60"
                  placeholder="Enter store extraction"
                  readOnly
                />
              )}
              {currentProject?.storeExtraction == 13 && (
                <input
                  defaultValue='Use Planogram Description Field / Desc 10'
                  className="flex-1 border border-gray-300 rounded-md p-2 text-sm focus:outline-none opacity-60"
                  placeholder="Enter store extraction"
                  readOnly
                />
              )}
            </div>
            <div className="flex items-center gap-4">
              <label className="w-40 text-gray-700 font-medium">Product Key:</label>
              {currentProject?.productKey ? (
                <input
                  defaultValue={currentProject?.productKey}
                  className="flex-1 border border-gray-300 rounded-md p-2 text-sm focus:outline-none opacity-60"
                  placeholder=""
                  readOnly
                />
              ) : null}
            </div>

            <div className="flex items-center gap-4">
              <label className="w-40 text-gray-700 font-medium">Reset Time:</label>
              <select
                className="flex-1 border border-gray-300 rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                defaultValue={currentProject?.projectTime}
                disabled
              >
                <option value='Q12020'>Q1 2020</option>
                <option value='Q22020'>Q2 2020</option>
                <option value='Q32020'>Q3 2020</option>
                <option value='Q42020'>Q4 2020</option>
                <option value='Q12021'>Q1 2021</option>
                <option value='Q22021'>Q2 2021</option>
                <option value='Q32021'>Q3 2021</option>
                <option value='Q42021'>Q4 2021</option>
              </select>
            </div>
          </div>

          <div className="px-6 flex items-end justify-end gap-2 flex-shrink-0 pb-2">
            <button
              onClick={handleCancel}
              className="px-4 py-2 text-sm rounded cursor-pointer border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                closeModal();
              }}
              className="px-4 py-2 text-sm cursor-pointer rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              OK
            </button>
          </div>
        </div>
      </Modal>
    </header>
  );
}
