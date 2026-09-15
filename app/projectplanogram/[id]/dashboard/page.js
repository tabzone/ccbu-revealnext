"use client";
import React from "react";
import AppLayout from "@/app/components/layout/AppLayout";
import useAppTheme from "@/app/hooks/useAppTheme";

const Page = () => {
  const th = useAppTheme();
  const { bg, bgSub, border, textPri, textSec, hover, accent, isDark } = th;
  return (
    <AppLayout>
      <div
        className="relative w-full h-full flex flex-col"
        style={{ backgroundColor: th.bg, color: th.textSec }}
      >
        <div
          className="flex flex-col md:flex-row gap-6 mb-2 relative rounded-xl border p-4"
          style={{ backgroundColor: th.bgSub, borderColor: th.border, color: th.textPri }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = th.hover)}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = th.bgSub)}
        >
          <span style={{ color: th.textPri }} className="text-sm font-medium">
            Dashboard
          </span>
          <span style={{ color: th.textSec }} className="text-sm">
            Overview placeholder
          </span>
          <button
            type="button"
            style={{ backgroundColor: th.accent, color: "#fff" }}
            className="px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition ml-auto"
          >
            Action
          </button>
        </div>
      </div>
    </AppLayout>
  );
};

export default Page;
