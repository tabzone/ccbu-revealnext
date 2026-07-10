"use client";

import { useEffect, useState } from "react";
import {
  fetchUserAttributes,
  updateUserAttributes,
  updatePassword,
} from "aws-amplify/auth";

import RoleGuard from "../components/RoleGuard";
import AppLayout from "../components/layout/AppLayout";
import LoadingSpinner from "../components/loading/LoadingSpinner";
import { Toast } from "../components/Toast";

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] =
    useState(false);
  const [savingPassword, setSavingPassword] =
    useState(false);

  const [form, setForm] = useState({
    given_name: "",
    family_name: "",
    email: "",
  });

  const [showPasswordForm, setShowPasswordForm] =
    useState(false);

  const [passwordForm, setPasswordForm] =
    useState({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });

  const [showPasswords, setShowPasswords] =
    useState({
      currentPassword: false,
      newPassword: false,
      confirmPassword: false,
    });

  const [toasts, setToasts] = useState([]);

  const showToast = (message, type = "success") => {
    const id = Date.now() + Math.random();

    setToasts((prev) => [
      ...prev,
      { id, message, type },
    ]);

    setTimeout(() => {
      dismissToast(id);
    }, 3000);
  };

  const dismissToast = (id) => {
    setToasts((prev) =>
      prev.filter((toast) => toast.id !== id)
    );
  };

  const toggleShowPassword = (field) => {
    setShowPasswords((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const attributes =
        await fetchUserAttributes();

      setForm({
        given_name:
          attributes.given_name || "",
        family_name:
          attributes.family_name || "",
        email: attributes.email || "",
      });
    } catch (error) {
      console.error(
        "Failed to load user:",
        error
      );
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();

    try {
      setSavingProfile(true);

      await updateUserAttributes({
        userAttributes: {
          given_name: form.given_name,
          family_name: form.family_name,
        },
      });

      showToast("Profile updated successfully", "success");
    } catch (error) {
      console.error(error);

      showToast(
        error?.message ||
          "Failed to update profile",
        "error"
      );
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    if (
      passwordForm.newPassword !==
      passwordForm.confirmPassword
    ) {
      showToast("Passwords do not match", "error");
      return;
    }

    if (
      passwordForm.newPassword.length < 8
    ) {
      showToast(
        "Password must be at least 8 characters",
        "error"
      );
      return;
    }

    try {
      setSavingPassword(true);

      await updatePassword({
        oldPassword:
          passwordForm.currentPassword,
        newPassword:
          passwordForm.newPassword,
      });

      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      setShowPasswords({
        currentPassword: false,
        newPassword: false,
        confirmPassword: false,
      });

      setShowPasswordForm(false);

      showToast("Password updated successfully", "success");
    } catch (error) {
      console.error(error);

      showToast(
        error?.message ||
          "Failed to update password",
        "error"
      );
    } finally {
      setSavingPassword(false);
    }
  };

  const fullName =
    `${form.given_name} ${form.family_name}`.trim();

  const initials =
    `${form.given_name?.[0] || ""}${form.family_name?.[0] || ""
      }`.toUpperCase() || "U";

  const EyeIcon = ({ open }) =>
    open ? (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
      >
        <path
          d="M2 12C3.5 7.5 7.5 4.5 12 4.5C16.5 4.5 20.5 7.5 22 12C20.5 16.5 16.5 19.5 12 19.5C7.5 19.5 3.5 16.5 2 12Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle
          cx="12"
          cy="12"
          r="3"
          stroke="currentColor"
          strokeWidth="1.8"
        />
      </svg>
    ) : (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
      >
        <path
          d="M3 3L21 21"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <path
          d="M10.6 5.1C11.05 5.03 11.51 5 12 5C16.5 5 20.5 8 22 12C21.5 13.3 20.8 14.47 19.9 15.47M6.5 6.6C4.6 8 3.1 9.9 2 12C3.5 16 7.5 19 12 19C13.6 19 15.1 18.6 16.4 17.9"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M9.9 9.9C9.4 10.4 9 11.15 9 12C9 13.66 10.34 15 12 15C12.85 15 13.6 14.6 14.1 14.1"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );

  if (loading) {
    return (
      <RoleGuard
        allowedRoles={[
          "admin",
          "user",
          "retailer",
        ]}
      >
        <AppLayout>
          <LoadingSpinner />
        </AppLayout>
      </RoleGuard>
    );
  }

  return (
    <AppLayout>
      <Toast toasts={toasts} onDismiss={dismissToast} />

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            My Profile
          </h1>

          <p className="text-gray-500 dark:text-gray-400 mt-2">
            Manage your account
            information and security
            settings.
          </p>
        </div>

        {/* User Card */}
        <div className="bg-white dark:bg-[#191919] rounded-2xl border border-gray-200 dark:border-[#2a2a2a] shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center gap-5">
            <div className="w-20 h-20 rounded-full bg-[#0066B3]/10 text-[#0066B3] flex items-center justify-center text-2xl font-bold">
              {initials}
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {fullName}
              </h2>

              <p className="text-gray-500 dark:text-gray-400">
                {form.email}
              </p>

              <div className="flex items-center gap-2 mt-3">
                <span className="flex items-center gap-2 text-green-600 text-sm">
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                  Active
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Information */}
        <div className="bg-white dark:bg-[#191919] rounded-2xl border border-gray-200 dark:border-[#2a2a2a] shadow-sm p-6 mb-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Profile Information
            </h2>

            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Update your personal
              information.
            </p>
          </div>

          <form
            onSubmit={
              handleProfileSubmit
            }
            className="space-y-5"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  First Name
                </label>

                <input
                  type="text"
                  value={
                    form.given_name
                  }
                  onChange={(e) =>
                    setForm({
                      ...form,
                      given_name:
                        e.target.value,
                    })
                  }
                  className="
  w-full rounded-xl
  border border-gray-300
  dark:border-[#2a2a2a]

  bg-white
  dark:bg-[#252525]

  text-gray-900
  dark:text-white

  px-4 py-3
  focus:outline-none
  focus:ring-2
  focus:ring-[#0066B3]
"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name
                </label>

                <input
                  type="text"
                  value={
                    form.family_name
                  }
                  onChange={(e) =>
                    setForm({
                      ...form,
                      family_name:
                        e.target.value,
                    })
                  }
                  className="
  w-full rounded-xl
  border border-gray-300
  dark:border-[#2a2a2a]

  bg-white
  dark:bg-[#252525]

  text-gray-900
  dark:text-white

  px-4 py-3
  focus:outline-none
  focus:ring-2
  focus:ring-[#0066B3]
"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>

              <input
                type="email"
                value={form.email}
                disabled
                className="
  w-full rounded-xl
  border border-gray-300
  dark:border-[#2a2a2a]

  bg-white
  dark:bg-[#252525]

  text-gray-900
  dark:text-white

  px-4 py-3
  focus:outline-none
  focus:ring-2
  focus:ring-[#0066B3]
"
              />
            </div>

            <button
              type="submit"
              disabled={
                savingProfile
              }
              className="px-5 py-3 bg-[#0066B3] hover:bg-[#00589C] disabled:opacity-50 text-white rounded-xl font-medium transition-colors cursor-pointer"
            >
              {savingProfile
                ? "Saving..."
                : "Save Changes"}
            </button>
          </form>
        </div>

        {/* Security */}
        <div className="bg-white dark:bg-[#191919] rounded-2xl border border-gray-200 dark:border-[#2a2a2a] p-8 text-center dark:text-white">
          <button
            type="button"
            onClick={() =>
              setShowPasswordForm(
                !showPasswordForm
              )
            }
            className="
  w-full flex items-center justify-between p-6
  hover:bg-gray-50 dark:hover:bg-[#252525]
  transition-colors
  cursor-pointer
"
          >
            <div className="text-left">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Security
              </h2>

              <p className="text-gray-500 dark:text-gray-400">
                Change your account
                password.
              </p>
            </div>

            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              className={`transition-transform duration-200 ${showPasswordForm
                ? "rotate-180"
                : ""
                }`}
            >
              <path
                d="M6 9L12 15L18 9"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          {showPasswordForm && (
            <div className="border-t border-gray-100 dark:border-[#2a2a2a] p-6">
              <form
                onSubmit={
                  handlePasswordSubmit
                }
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 text-left">
                    Current Password
                  </label>

                  <div className="relative">
                    <input
                      type={
                        showPasswords.currentPassword
                          ? "text"
                          : "password"
                      }
                      required
                      value={
                        passwordForm.currentPassword
                      }
                      onKeyDown={(e) => {
                        if (e.key === " ") {
                          e.preventDefault();
                        }
                      }}
                      onChange={(e) => {
                        const noSpaces = e.target.value.replace(/\s/g, "");
                        setPasswordForm({
                          ...passwordForm,
                          currentPassword: noSpaces,
                        });
                      }}
                      onPaste={(e) => {
                        e.preventDefault();
                        const pasted = e.clipboardData.getData("text").replace(/\s/g, "");
                        setPasswordForm((prev) => ({
                          ...prev,
                          currentPassword: prev.currentPassword + pasted,
                        }));
                      }}
                      className="
  w-full rounded-xl
  border border-gray-200 dark:border-[#2a2a2a]

  bg-gray-50 dark:bg-[#252525]

  px-4 py-3 pr-12

  text-gray-500 dark:text-gray-400
"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        toggleShowPassword(
                          "currentPassword"
                        )
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
                      tabIndex={-1}
                    >
                      <EyeIcon
                        open={
                          showPasswords.currentPassword
                        }
                      />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 text-left">
                    New Password
                  </label>

                  <div className="relative">
                    <input
                      type={
                        showPasswords.newPassword
                          ? "text"
                          : "password"
                      }
                      required
                      value={
                        passwordForm.newPassword
                      }
                      onKeyDown={(e) => {
                        if (e.key === " ") {
                          e.preventDefault();
                        }
                      }}
                      onChange={(e) => {
                        const noSpaces = e.target.value.replace(/\s/g, "");
                        setPasswordForm({
                          ...passwordForm,
                          newPassword: noSpaces,
                        });
                      }}
                      onPaste={(e) => {
                        e.preventDefault();
                        const pasted = e.clipboardData.getData("text").replace(/\s/g, "");
                        setPasswordForm((prev) => ({
                          ...prev,
                          newPassword: prev.newPassword + pasted,
                        }));
                      }}
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-[#0066B3]"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        toggleShowPassword(
                          "newPassword"
                        )
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
                      tabIndex={-1}
                    >
                      <EyeIcon
                        open={
                          showPasswords.newPassword
                        }
                      />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 text-left">
                    Confirm New
                    Password
                  </label>

                  <div className="relative">
                    <input
                      type={
                        showPasswords.confirmPassword
                          ? "text"
                          : "password"
                      }
                      required
                      value={
                        passwordForm.confirmPassword
                      }
                      onKeyDown={(e) => {
                        if (e.key === " ") {
                          e.preventDefault();
                        }
                      }}
                      onChange={(e) => {
                        const noSpaces = e.target.value.replace(/\s/g, "");
                        setPasswordForm({
                          ...passwordForm,
                          confirmPassword: noSpaces,
                        });
                      }}
                      onPaste={(e) => {
                        e.preventDefault();
                        const pasted = e.clipboardData.getData("text").replace(/\s/g, "");
                        setPasswordForm((prev) => ({
                          ...prev,
                          confirmPassword: prev.confirmPassword + pasted,
                        }));
                      }}
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-[#0066B3]"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        toggleShowPassword(
                          "confirmPassword"
                        )
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
                      tabIndex={-1}
                    >
                      <EyeIcon
                        open={
                          showPasswords.confirmPassword
                        }
                      />
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={
                    savingPassword
                  }
                  className="px-5 py-3 bg-[#0066B3] hover:bg-[#00589C] disabled:opacity-50 text-white rounded-xl font-medium transition-colors cursor-pointer"
                >
                  {savingPassword
                    ? "Updating..."
                    : "Update Password"}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}