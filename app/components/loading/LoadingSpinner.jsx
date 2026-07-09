"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import logo from "@/public/logo.png"; 

export default function LoadingSpinner() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div
      className={`flex items-center justify-center min-h-screen z-[99999]
      ${mounted && document.documentElement.classList.contains("dark") ? "bg-[#191919]" : "bg-white"}`}
    >
      <Image
        src={logo}
        alt="Loading"
        width={160}
        height={37}
        priority
        className="animate-pulse"
        style={{ animationDuration: "1.4s" }}
      />
    </div>
  );
}