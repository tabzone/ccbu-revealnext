"use client";

export function Toast({ toasts, onDismiss }) {
  if (!toasts.length) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl min-w-[280px] max-w-[400px] pointer-events-auto"
          style={{
            backgroundColor: toast.type === "error" ? "#dc2626" : "#16a34a",
            color: "#fff",
          }}
        >
          {toast.type === "error" ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="flex-shrink-0">
              <circle cx="12" cy="12" r="10" />
              <path d="M15 9l-6 6M9 9l6 6" strokeLinecap="round" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="flex-shrink-0">
              <path d="M20 6L9 17L4 12" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
          <p className="text-sm font-medium flex-1">{toast.message}</p>
          <button
            onClick={() => onDismiss(toast.id)}
            className="ml-1 hover:opacity-70 transition flex-shrink-0"
            aria-label="Dismiss"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}
