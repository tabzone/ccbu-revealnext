"use client";

import { createPortal } from "react-dom";
import { apiGet, apiPost } from "@/lib/api";
import { useCallback, useEffect, useRef, useState } from "react";

const VALIDATION_POLL_INTERVAL_MS = 2500;

function normalizeValidationStatus(value) {
  const status = String(value ?? "").toLowerCase();
  if (status === "processing") return "processing";
  if (["completed", "complete", "success", "succeeded"].includes(status)) return "success";
  if (["failed", "failure", "error"].includes(status)) return "failed";
  return status || "unknown";
}

export function extractValidationRows(payload) {
  const data = payload?.data ?? payload;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.validations)) return data.validations;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.history)) return data.history;
  return [];
}

function Row({ label, value, textSec, textPri }) {
  const isEmpty = value === null || value === undefined || value === "";
  return (
    <div className="flex items-start justify-between gap-4 py-2">
      <span className="text-xs font-semibold uppercase tracking-wide whitespace-nowrap pt-0.5" style={{ color: textSec }}>
        {label}
      </span>
      <span className="text-sm font-medium text-right break-all" style={{ color: textPri }}>
        {isEmpty ? "-" : value}
      </span>
    </div>
  );
}

/**
 * Validation popup for the Weekly Sales Upload page.
 * Opens immediately on trigger, kicks off POST /retailers/{rid}/validate,
 * then polls GET /retailers/{rid}/validate/{reqid} every ~2.5s while the
 * popup stays open and the status is "Processing". Shows current progress
 * and final status only — no tabs, no history.
 */
export function ValidationModal({ retailerId, theme, onClose,fetchUnpublishedWeek }) {
  const { bg, bgSub, border, textPri, textSec, accent } = theme;

  const [phase, setPhase] = useState("starting"); // starting | processing | success | failed | error
  const [details, setDetails] = useState(null);
  const [error, setError] = useState(null);

  const closedRef = useRef(false);
  const pollTimerRef = useRef(null);

  const canClose = phase !== "starting";

  const stopPolling = useCallback(() => {
    closedRef.current = true;
    if (pollTimerRef.current) {
      clearTimeout(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }, []);

  const handleClose = useCallback(() => {
    if (!canClose) return;
    stopPolling();
    onClose();
    fetchUnpublishedWeek()
  }, [canClose, stopPolling, onClose]);

  // Applies a validate response to state. Returns true when the status is terminal.
  const applyResult = useCallback((payload) => {
    setDetails(payload);
    const normalized = normalizeValidationStatus(payload?.status);

    if (normalized === "processing") {
      setPhase("processing");
      return false;
    }
    if (normalized === "failed") {
      setPhase("failed");
      setError(payload?.error ?? "Validation failed");
    } else {
      setPhase("success");
    }
    return true;
  }, []);

  const waitForNextPoll = useCallback(() => {
    return new Promise((resolve) => {
      pollTimerRef.current = setTimeout(() => {
        pollTimerRef.current = null;
        resolve();
      }, VALIDATION_POLL_INTERVAL_MS);
    });
  }, []);

  const pollStatus = useCallback(async (reqid) => {
    while (!closedRef.current) {
      await waitForNextPoll();
      if (closedRef.current) return;

      try {
        const res = await apiGet(`/retailers/${retailerId}/validate/${reqid}`);
        if (closedRef.current) return;
        const payload = res?.data ?? res;
        if (applyResult(payload)) return;
      } catch (err) {
        if (!closedRef.current) {
          setPhase("error");
          setError(err.message);
        }
        return;
      }
    }
  }, [retailerId, applyResult, waitForNextPoll]);

  useEffect(() => {
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    closedRef.current = false;

    const startValidation = async () => {
      try {
        const res = await apiPost(`/retailers/${retailerId}/validate`);
        if (closedRef.current) return;
        const payload = res?.data ?? res;
        const terminal = applyResult(payload);
        if (!terminal && payload?.reqid && !closedRef.current) pollStatus(payload.reqid);
      } catch (err) {
        if (!closedRef.current) {
          setPhase("error");
          setError(err.message);
        }
      }
    };

    startValidation();

    return () => stopPolling();
  }, [retailerId, applyResult, pollStatus, stopPolling]);

  if (typeof document === "undefined") return null;

  const isProcessing = phase === "starting" || phase === "processing";
  const isTerminal = phase === "success" || phase === "failed";

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={handleClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ backgroundColor: bg, borderColor: border }}
        className="w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-5 border-b" style={{ borderColor: border }}>
          <h2 className="text-xl font-semibold" style={{ color: textPri }}>Validate Data</h2>
          <button
            type="button"
            onClick={handleClose}
            disabled={!canClose}
            className="text-2xl cursor-pointer leading-none hover:opacity-60 transition disabled:cursor-not-allowed disabled:opacity-40"
            style={{ color: textSec }}
            aria-label="Close"
          >
            <span aria-hidden="true">&times;</span>
          </button>
        </div>

        <div className="p-6">
          {isProcessing && (
            <div className="flex min-h-[220px] flex-col items-center justify-center gap-4 px-4 text-center">
              <div className="h-9 w-9 animate-spin rounded-full border-4 border-gray-200 border-t-transparent" style={{ borderTopColor: accent }} />
              <p className="text-sm font-medium" style={{ color: textSec }}>
                {phase === "starting"
                  ? "Starting validation..."
                  : "Validation started. Your file is currently being validated."}
              </p>
            </div>
          )}

          {phase === "success" && (
            <div className="flex flex-col items-center gap-4 px-4 pb-2 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <p className="text-sm font-medium" style={{ color: textPri }}>Validation completed successfully.</p>
            </div>
          )}

          {phase === "failed" && (
            <div className="flex flex-col items-center gap-4 px-4 pb-2 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </div>
              <p className="text-sm font-medium" style={{ color: "#dc2626" }}>{error || "Validation failed."}</p>
            </div>
          )}

          {phase === "error" && (
            <div className="flex flex-col items-center gap-4 px-4 pb-2 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </div>
              <p className="text-sm font-medium" style={{ color: "#dc2626" }}>{error || "Something went wrong."}</p>
            </div>
          )}

          {isTerminal && details && (
            <div className="mt-2 rounded-lg border px-4" style={{ borderColor: border, backgroundColor: bgSub }}>
              <Row label="Status" value={details.status} textSec={textSec} textPri={textPri} />
              {details.result !== null && details.result !== undefined && details.result !== "" && (
                <Row label="Result" value={details.result} textSec={textSec} textPri={textPri} />
              )}
              {phase === "failed" && (
                <Row label="Error" value={error} textSec={textSec} textPri={textPri} />
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 border-t px-6 py-4" style={{ borderColor: border }}>
          <button
            type="button"
            onClick={handleClose}
            disabled={!canClose}
            className="rounded-lg border cursor-pointer px-4 py-2 text-sm font-medium transition hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
            style={{ borderColor: border, color: textPri }}
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
