"use client"

import { apiPost, apiPut } from "@/lib/api";
import { useState, useEffect } from "react";

export function UserModal({
    user,
    retailerId,
    roleOptions = ["Manager", "User"],
    onClose,
    onSaved,
    theme,
}) {
    const isAdd = !user;

    const [formData, setFormData] = useState({
        fname: user?.fname ?? "",
        lname: user?.lname ?? "",
        email: user?.email ?? "",
        temp_password: user?.temp_password ?? "",
        role: user?.role ?? roleOptions[roleOptions.length - 1],
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        setError(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            //   const method = isAdd ? "POST" : "PUT";
            //   const endpoint = isAdd ? "/users" : `/users/${user.uid}`;

            //   const response = await fetch(endpoint, {
            //     method,
            //     headers: { "Content-Type": "application/json" },
            //     body: JSON.stringify(formData),
            //   });
            const retailerFields = retailerId != null
                ? isAdd
                    ? { retailerid: retailerId, retailer: String(retailerId) }
                    : { retailerid: retailerId }
                : {};
            const payload = { ...formData, ...retailerFields };
            const savedUser = isAdd
                ? await apiPost("/users", payload)
                : await apiPut(`/users/${user.userid}`, payload);
            // if (!response.ok) {
            //     const errorData = await response.json();
            //     throw new Error(errorData.message || "Failed to save user");
            // }

            // const result = await response.json();
            // onSaved(result);
            onSaved(savedUser);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className="fixed inset-0 flex items-center justify-center p-4 z-50"
            style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
            onClick={onClose}
        >
            <div
                className="w-full max-w-md rounded-xl shadow-lg"
                style={{ backgroundColor: theme.bg }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div
                    className="flex items-center justify-between p-4 border-b"
                    style={{ borderColor: theme.border }}
                >
                    <h2 style={{ color: theme.textPri }} className="text-lg font-bold">
                        {isAdd ? "Add User" : "Edit User"}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-1 hover:opacity-75 transition cursor-pointer"
                        style={{ color: theme.textSec }}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    {/* Error Message */}
                    {error && (
                        <div
                            className="p-3 rounded-lg text-sm"
                            style={{ backgroundColor: "#fee2e2", color: "#991b1b" }}
                        >
                            {error}
                        </div>
                    )}

                    {/* First Name */}
                    <div>
                        <label style={{ color: theme.textPri }} className="block text-sm font-medium mb-1">
                            First Name *
                        </label>
                        <input
                            type="text"
                            name="fname"
                            value={formData.fname}
                            onChange={handleChange}
                            required
                            className="w-full px-3 py-2 rounded-lg border text-sm transition focus:outline-none focus:ring-2"
                            style={{
                                borderColor: theme.border,
                                backgroundColor: theme.bgSub,
                                color: theme.textPri,
                                "--tw-ring-color": theme.accent,
                            }}
                            placeholder="John"
                        />
                    </div>

                    {/* Last Name */}
                    <div>
                        <label style={{ color: theme.textPri }} className="block text-sm font-medium mb-1">
                            Last Name *
                        </label>
                        <input
                            type="text"
                            name="lname"
                            value={formData.lname}
                            onChange={handleChange}
                            required
                            className="w-full px-3 py-2 rounded-lg border text-sm transition focus:outline-none focus:ring-2"
                            style={{
                                borderColor: theme.border,
                                backgroundColor: theme.bgSub,
                                color: theme.textPri,
                                "--tw-ring-color": theme.accent,
                            }}
                            placeholder="Doe"
                        />
                    </div>

                    {/* Email */}
                    <div>
                        <label style={{ color: theme.textPri }} className="block text-sm font-medium mb-1">
                            Email *
                        </label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            disabled={!isAdd}
                            className="w-full px-3 py-2 rounded-lg border text-sm transition focus:outline-none focus:ring-2 disabled:opacity-50"
                            style={{
                                borderColor: theme.border,
                                backgroundColor: theme.bgSub,
                                color: theme.textPri,
                                "--tw-ring-color": theme.accent,
                            }}
                            placeholder="john@example.com"
                        />
                    </div>

                    {/* Temporary Password */}
                    {isAdd && (
                        <div>
                            <label style={{ color: theme.textPri }} className="block text-sm font-medium mb-1">
                                Temporary Password *
                            </label>
                            <input
                                type="password"
                                name="temp_password"
                                value={formData.temp_password}
                                onChange={handleChange}
                                required={isAdd}
                                className="w-full px-3 py-2 rounded-lg border text-sm transition focus:outline-none focus:ring-2"
                                style={{
                                    borderColor: theme.border,
                                    backgroundColor: theme.bgSub,
                                    color: theme.textPri,
                                    "--tw-ring-color": theme.accent,
                                }}
                                placeholder="Enter temporary password"
                            />
                            <p style={{ color: theme.textSec }} className="text-xs mt-1">
                                User will need to change this password on first login
                            </p>
                        </div>
                    )}

                    {/* Role */}
                    {isAdd && (<div>
                        <label style={{ color: theme.textPri }} className="block text-sm font-medium mb-1">
                            Role *
                        </label>
                        <select
                            name="role"
                            value={formData.role}
                            onChange={handleChange}
                            className="w-full px-3 py-2 rounded-lg border text-sm transition focus:outline-none focus:ring-2"
                            style={{
                                borderColor: theme.border,
                                backgroundColor: theme.bgSub,
                                color: theme.textPri,
                                "--tw-ring-color": theme.accent,
                            }}
                        >
                            {roleOptions.map((role) => (
                                <option key={role} value={role}>{role}</option>
                            ))}
                        </select>
                    </div>
                    )}
                    {/* Buttons */}
                    <div className="flex gap-2 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 cursor-pointer py-2 rounded-lg border text-sm font-medium transition hover:opacity-75"
                            style={{
                                borderColor: theme.border,
                                color: theme.textPri,
                                backgroundColor: theme.bgSub,
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-4 cursor-pointer py-2 rounded-lg text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
                            style={{ backgroundColor: theme.accent }}
                        >
                            {loading ? "Saving…" : isAdd ? "Create User" : "Update User"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}