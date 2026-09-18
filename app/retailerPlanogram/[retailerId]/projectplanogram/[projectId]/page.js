"use client";
import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import useAppTheme from "@/app/hooks/useAppTheme";

export default function ProjectRootRedirect() {
  const { retailerId, projectId } = useParams();
  const params = { retailerId, projectId, id: retailerId };
  const router = useRouter();
  const th = useAppTheme();
  const { bg, bgSub, border, textPri, textSec, hover, accent, isDark } = th;
  useEffect(() => {
    if (id) router.replace(`/projectplanogram/${projectId}/uploads`);
  }, [id, router]);
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: th.bg }}>
      <p className="text-sm" style={{ color: th.textSec }}>Redirecting to project {id}...</p>
    </div>
  );
}
