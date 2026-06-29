"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "../components/AuthProvider";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [error, setError] = useState("");
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    if (!username.trim()) {
      newErrors.username = "Email is required";
    } else if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(username)
    ) {
      newErrors.username = "Please enter a valid email address";
    }

    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 6) {
      newErrors.password =
        "Password must be at least 6 characters";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isLoading) return;

    setError("");

    if (!validateForm()) return;

    try {
      setIsLoading(true);

      const user = await login({
        username,
        password,
      });

      if (user.role === "admin") {
        router.push("/ManageReports");
      } else if (user.role === "retailer") {
        router.push("/retailerPlanogram");
      } else {
        router.push("/");
      }
    } catch (err) {
      setError(err?.message || "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  const clearFieldError = (field) => {
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <form
          onSubmit={handleSubmit}
          className="bg-white border border-slate-200 shadow-2xl rounded-3xl p-8"
        >
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="flex items-center gap-4">
            <Image
              src="/logo.avif"
              alt="Logo"
              width={120}
              height={120}
              priority
              className="object-contain"
            />
            {/* <Image
              src="/Parkers Kitchen.png"
              alt="Logo"
              width={60}
              height={60}
              priority
              className="object-contain"
            /> */}
            </div>
            <h1 className="mt-4 text-3xl font-bold text-slate-800">
              Welcome Back
            </h1>

            <p className="mt-2 text-sm text-slate-500 text-center">
              Sign in to continue to your account
            </p>
          </div>

          {/* Server Error */}
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
              <p className="mt-2 text-sm text-red-500">
                {errors.username}
              </p>
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
                onClick={() =>
                  setShowPassword(!showPassword)
                }
                className="absolute cursor-pointer right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
              >
                {showPassword ? (
                  /* Eye Off */
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 3l18 18"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M10.584 10.587A2 2 0 0013.414 13.417"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9.88 5.09A10.94 10.94 0 0112 4c5 0 9.27 3.11 11 8-0.51 1.44-1.31 2.75-2.32 3.84"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6.228 6.228C4.22 7.59 2.68 9.61 2 12c1.73 4.89 6 8 10 8 1.61 0 3.16-.32 4.58-.91"
                    />
                  </svg>
                ) : (
                  /* Eye */
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2 12s4-8 10-8 10 8 10 8-4 8-10 8-10-8-10-8z"
                    />
                    <circle
                      cx="12"
                      cy="12"
                      r="3"
                    />
                  </svg>
                )}
              </button>
            </div>

            {errors.password && (
              <p className="mt-2 text-sm text-red-500">
                {errors.password}
              </p>
            )}
          </div>

          {/* Login Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full cursor-pointer h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition disabled:bg-blue-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <svg
                  className="animate-spin h-5 w-5"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    className="opacity-20"
                  />

                  <path
                    fill="currentColor"
                    className="opacity-90"
                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                  />
                </svg>

                Signing In...
              </>
            ) : (
              "Login"
            )}
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

          {/* Footer */}
          <div className="mt-6 text-center text-xs text-slate-500">
            Secure access to the platform
          </div>
        </form>
      </div>
    </div>
  );
}