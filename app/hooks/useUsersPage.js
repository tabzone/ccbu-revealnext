"use client";

import { apiGet, apiPut } from "@/lib/api";
import { PAGE_SIZE } from "@/data/constants";
import { useCallback, useEffect, useState } from "react";

// ─── Helper: Frontend sorting ──────────────────────────────────────────────────

function sortUsers(users, sortBy, sortDir) {
  if (!sortBy) return users;

  const sorted = [...users].sort((a, b) => {
    const aVal = a[sortBy];
    const bVal = b[sortBy];

    // Handle null/undefined
    if (aVal == null && bVal == null) return 0;
    if (aVal == null) return 1;
    if (bVal == null) return -1;

    // String comparison
    if (typeof aVal === "string" && typeof bVal === "string") {
      return aVal.localeCompare(bVal);
    }

    // Numeric comparison
    if (aVal < bVal) return -1;
    if (aVal > bVal) return 1;
    return 0;
  });

  return sortDir === "desc" ? sorted.reverse() : sorted;
}

/**
 * Shared state/handlers for a users listing page (table + create/edit/delete modals).
 * allowedRoles – case-insensitive list of roles to keep in the displayed list.
 */
export function useUsersPage({ retailerId, allowedRoles } = {}) {
  const allowedRolesLower = allowedRoles?.map((r) => r.toLowerCase());

  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(null);

  const [opts, setOpts] = useState({ roles: [] });

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(0);
  const [sortBy, setSortBy] = useState("");
  const [sortDir, setSortDir] = useState("asc");

  // Debounce the search query separately
  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(searchQuery); }, 400);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const handleSort = (key) => {
    if (sortBy === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(key);
      setSortDir("asc");
    }
    setPage(0);
  };

  const [modal, setModal] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [statusUpdatingUserId, setStatusUpdatingUserId] = useState(null);

  const addToast = (message, type = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  };

  const dismissToast = (id) => setToasts((prev) => prev.filter((t) => t.id !== id));

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setApiError(null);
    try {
      let res;
      if (debouncedSearch) {
        // Search API: only q parameter
        res = await apiGet("/searchusers", {
          q: debouncedSearch,
        });
      } else {
        // List API: pagination + filters only (no sort params)
        res = await apiGet("/users", {
          skip: page * PAGE_SIZE,
          limit: PAGE_SIZE,
          role: roleFilter,
          active: statusFilter,
        });
      }
      const payload = res?.data ?? res;
      let fetchedUsers = payload?.users ?? [];

      if (allowedRolesLower) {
        fetchedUsers = fetchedUsers.filter((u) => allowedRolesLower.includes(u.role?.toLowerCase()));
      }

      // Apply frontend sorting
      fetchedUsers = sortUsers(fetchedUsers, sortBy, sortDir);

      setUsers(fetchedUsers);
      setTotal(payload?.total ?? 0);
    } catch (err) {
      setApiError(err.message);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, debouncedSearch, roleFilter, statusFilter, sortBy, sortDir, allowedRoles]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  // Populate filter dropdowns
  useEffect(() => {
    apiGet("/users", { limit: 100 })
      .then((res) => {
        const u = (res?.data ?? res)?.users ?? [];
        setOpts({
          roles: [...new Set(u.map((x) => x.role).filter(Boolean))].sort(),
        });
      })
      .catch(() => { });
  }, []);

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const hasFilters = searchQuery || roleFilter || statusFilter;

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setPage(0);
  };

  const handleFilterChange = (setter) => (e) => {
    setter(e.target.value);
    setPage(0);
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setRoleFilter("");
    setStatusFilter("");
    setPage(0);
  };

  const handleAddUser = () => setModal("add");

  const handleEditUser = (user) => setModal(user);

  const handleDeleteUser = (user) => setDeleteTarget(user);

  const handleSaveUser = (result) => {
    setModal(null);
    fetchUsers();
    addToast(result?.message ?? "User saved successfully");
  };

  const handleDeleteConfirm = (result) => {
    setDeleteTarget(null);
    fetchUsers();
    addToast(result?.message ?? "User deleted successfully");
  };

  const handleToggleStatus = async (user) => {
    if (statusUpdatingUserId === user.userid) return;

    const isActive = typeof user.active === "boolean"
      ? user.active
      : user.status === "Active";
    const nextActive = !isActive;

    setStatusUpdatingUserId(user.userid);
    try {
      const body = { active: nextActive };
      const status = nextActive ? "activated" : "deactivated";
      await apiPut(`/users/${user.userid}/status`, body);
      setUsers((prev) =>
        prev.map((u) =>
          u.userid === user.userid
            ? {
              ...u,
              active: nextActive,
              status: nextActive ? "Active" : "Inactive",
            }
            : u
        )
      );
      addToast(`User ${status} successfully`);
    } catch (err) {
      addToast(err.message, "error");
    } finally {
      setStatusUpdatingUserId(null);
    }
  };

  return {
    retailerId,
    users,
    total,
    loading,
    apiError,
    opts,
    searchQuery,
    roleFilter,
    statusFilter,
    page,
    sortBy,
    sortDir,
    totalPages,
    hasFilters,
    modal,
    deleteTarget,
    toasts,
    statusUpdatingUserId,
    setPage,
    setRoleFilter,
    setStatusFilter,
    handleSort,
    handleSearchChange,
    handleFilterChange,
    handleClearFilters,
    handleAddUser,
    handleEditUser,
    handleDeleteUser,
    handleSaveUser,
    handleDeleteConfirm,
    handleToggleStatus,
    setModal,
    setDeleteTarget,
    addToast,
    dismissToast,
    fetchUsers,
  };
}
