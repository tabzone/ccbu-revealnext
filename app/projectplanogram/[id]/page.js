"use client";
import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function ProjectRootRedirect() {
  const { id } = useParams();
  const router = useRouter();
  useEffect(() => {
    if (id) router.replace(`/projectplanogram/${id}/uploads`);
  }, [id, router]);
  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-sm text-gray-500">Redirecting to project {id}...</p>
    </div>
  );
}
