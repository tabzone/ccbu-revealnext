"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "../components/AuthProvider";

export default function LoginPage() {
  const router = useRouter();
  const { login, completeNewPassword } = useAuth();

  // Step: 'credentials' | 'new_password'
  const [step, setStep] = useState("credentials");

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [errors, setErrors] = useState({});

  const validateCredentials = () => {
    const newErrors = {};

    if (!username.trim()) {
      newErrors.username = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(username)) {
      newErrors.username = "Please enter a valid email address";
    }

    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateNewPassword = () => {
    const newErrors = {};

    if (!newPassword) {
      newErrors.newPassword = "New password is required";
    } else if (newPassword.length < 8) {
      newErrors.newPassword = "Password must be at least 8 characters";
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCredentialsSubmit = async (e) => {
    e.preventDefault();
    if (isLoading) return;
    setError("");
    if (!validateCredentials()) return;

    try {
      setIsLoading(true);
      const result = await login({ username, password });

      if (result?.requiresNewPassword) {
        setStep("new_password");
      } else {
        router.push("/manageReports");
      }
    } catch (err) {
      setError(err?.message || "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewPasswordSubmit = async (e) => {
    e.preventDefault();
    if (isLoading) return;
    setError("");
    if (!validateNewPassword()) return;

    try {
      setIsLoading(true);
      await completeNewPassword(newPassword);
      router.push("/manageReports");
    } catch (err) {
      setError(err?.message || "Failed to set new password");
    } finally {
      setIsLoading(false);
    }
  };

  const clearFieldError = (field) => {
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  // ── New Password Step ──────────────────────────────────────────────────────
  if (step === "new_password") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <form
            onSubmit={handleNewPasswordSubmit}
            className="bg-white border border-slate-200 shadow-2xl rounded-3xl p-8"
          >
            <div className="flex flex-col items-center mb-8">
              <Image
                src="/logo.avif"
                alt="Logo"
                width={180}
                height={180}
                priority
                className="object-contain"
              />
              <h1 className="mt-4 text-3xl font-bold text-slate-800">
                Set New Password
              </h1>
              <p className="mt-2 text-sm text-slate-500 text-center">
                Your account requires a new password before you can continue.
              </p>
            </div>

            {error && (
              <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}

            {/* New Password */}
            <div className="mb-5">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  placeholder="Enter new password"
                  value={newPassword}
                  disabled={isLoading}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    clearFieldError("newPassword");
                  }}
                  className={`w-full rounded-xl border px-4 py-3 pr-12 outline-none transition
                    ${errors.newPassword
                      ? "border-red-500 focus:ring-2 focus:ring-red-200"
                      : "border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    }
                    disabled:bg-slate-100`}
                />
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute cursor-pointer right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                >
                  <EyeIcon show={showNewPassword} />
                </button>
              </div>
              {errors.newPassword && (
                <p className="mt-2 text-sm text-red-500">{errors.newPassword}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  disabled={isLoading}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    clearFieldError("confirmPassword");
                  }}
                  className={`w-full rounded-xl border px-4 py-3 pr-12 outline-none transition
                    ${errors.confirmPassword
                      ? "border-red-500 focus:ring-2 focus:ring-red-200"
                      : "border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    }
                    disabled:bg-slate-100`}
                />
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute cursor-pointer right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                >
                  <EyeIcon show={showConfirmPassword} />
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-2 text-sm text-red-500">{errors.confirmPassword}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full cursor-pointer h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition disabled:bg-blue-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? <SpinnerIcon /> : "Set Password & Continue"}
            </button>

            <div className="mt-6 text-center text-xs text-slate-500">
              Secure access to the platform
            </div>
          </form>
        </div>
      </div>
    );
  }

  // ── Credentials Step ───────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <form
          onSubmit={handleCredentialsSubmit}
          className="bg-white border border-slate-200 shadow-2xl rounded-3xl p-8"
        >
          <div className="flex flex-col items-center mb-8">
            <Image
              src="/logo.avif"
              alt="Logo"
              width={180}
              height={180}
              priority
              className="object-contain"
            />
            <h1 className="mt-4 text-3xl font-bold text-slate-500">
              Welcome Back
            </h1>
            <p className="mt-2 text-sm text-slate-500 text-center">
              Sign in to continue to your account
            </p>
          </div>

          {error && (
            <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Email */}
          <div className="mb-5">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              placeholder="Enter your email"
              value={username}
              disabled={isLoading}
              onChange={(e) => {
                setUsername(e.target.value);
                clearFieldError("username");
              }}
              className={`w-full rounded-xl border px-4 py-3 outline-none transition
                ${errors.username
                  ? "border-red-500 focus:ring-2 focus:ring-red-200"
                  : "border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                }
                disabled:bg-slate-100`}
            />
            {errors.username && (
              <p className="mt-2 text-sm text-red-500">{errors.username}</p>
            )}
          </div>

          {/* Password */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                disabled={isLoading}
                onChange={(e) => {
                  setPassword(e.target.value);
                  clearFieldError("password");
                }}
                className={`w-full rounded-xl border px-4 py-3 pr-12 outline-none transition
                  ${errors.password
                    ? "border-red-500 focus:ring-2 focus:ring-red-200"
                    : "border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  }
                  disabled:bg-slate-100`}
              />
              <button
                type="button"
                disabled={isLoading}
                onClick={() => setShowPassword(!showPassword)}
                className="absolute cursor-pointer right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
              >
                <EyeIcon show={showPassword} />
              </button>
            </div>
            {errors.password && (
              <p className="mt-2 text-sm text-red-500">{errors.password}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full cursor-pointer h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition disabled:bg-blue-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? <SpinnerIcon /> : "Login"}
          </button>

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => router.push("/forgot-password")}
              className="text-sm cursor-pointer text-blue-600 hover:text-blue-800 hover:underline"
            >
              Forgot Password?
            </button>
          </div>

          <div className="mt-6 text-center text-xs text-slate-500">
            Secure access to the platform
          </div>
        </form>
      </div>
    </div>
  );
}

function EyeIcon({ show }) {
  if (show) {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.584 10.587A2 2 0 0013.414 13.417" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.88 5.09A10.94 10.94 0 0112 4c5 0 9.27 3.11 11 8-0.51 1.44-1.31 2.75-2.32 3.84" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.228 6.228C4.22 7.59 2.68 9.61 2 12c1.73 4.89 6 8 10 8 1.61 0 3.16-.32 4.58-.91" />
      </svg>
    );
  }
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2 12s4-8 10-8 10 8 10 8-4 8-10 8-10-8-10-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <>
      <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-20" />
        <path fill="currentColor" className="opacity-90" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
      </svg>
      Signing In...
    </>
  );
}
