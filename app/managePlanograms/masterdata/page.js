'use client'
import { useEffect } from "react";
import { useRouter } from "next/navigation";
export default function LegacyRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace("/manageReports"); }, [router]);
  return (
    <div className="p-8 text-center text-gray-600">
      <p>This page has moved. Redirecting to Manage Reports…</p>
      <p className="mt-2 text-sm">Please select a retailer to access its Planogram. New routes: <code>/retailerPlanogram/:retailerId/masterdata</code></p>
    </div>
  );
}
