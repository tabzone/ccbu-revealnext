"use client";

import { useParams, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { lambdaGet } from "@/app/lamda/lambdaClient";

let cache = { id: null, project: null };

function extractRetailerId(project) {
  if (!project) return null;
  return (
    project.retailerid ??
    project.retailerId ??
    project.retailID ??
    project.retailId ??
    project.retailer_id ??
    project.baseCallPoints ??
    project.basecallpoints ??
    project.baseCallpoints ??
    project.retailer ??
    project.retailerID ??
    null
  );
}

export function useProject() {
  const params = useParams();
  const pathname = usePathname();
  const id = params?.id;
  const isProjectPlanogram = pathname?.startsWith("/projectplanogram");
  const [project, setProject] = useState(() => (cache.id === id ? cache.project : null));
  const [loading, setLoading] = useState(() => !(cache.id === id && cache.project));
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;
    if (!isProjectPlanogram) return;
    if (cache.id === id && cache.project) {
      setProject(cache.project);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    lambdaGet(`/getproject/${id}`)
      .then((data) => {
        if (cancelled) return;
        const proj = data?.project || data;
        cache = { id, project: proj };
        setProject(proj);
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err.message || "Failed to load project");
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id, isProjectPlanogram]);

  const retailerId = extractRetailerId(project);

  return { project, retailerId, loading, error, id };
}

export function getRetailerIdFromProject(project) {
  return extractRetailerId(project);
}
