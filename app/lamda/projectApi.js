import { lambdaPost } from "./lambdaClient";

/**
 * Direct API call to create project - bypasses Next.js /api route.
 * Reusable globally: import { createProject } from "@/app/lamda/projectApi"
 */
export const createProject = (payload) => lambdaPost("/createproject", payload);
