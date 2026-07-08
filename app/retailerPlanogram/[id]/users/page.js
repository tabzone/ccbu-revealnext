"use client";

import { FilterBar } from "@/app/components/FilterBar";
import AppLayout from "@/app/components/layout/AppLayout";
import { DeleteModal } from "@/app/components/modal/DeleteModal";
import { UserModal } from "@/app/components/modal/UserModal";
import { UsersTable } from "@/app/components/table/UsersTable";
import { Toast } from "@/app/components/Toast";
import { useTheme } from "@/app/components/ThemeProvider";
import { apiGet, apiPut } from "@/lib/api";
import { PAGE_SIZE } from "@/data/constants";
import { useParams } from "next/navigation";
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

export default function MasterUsersPage() {
  const params = useParams();
  const retailerId = params?.id;
  const { theme: mode } = useTheme();
  const isDark = mode === "dark";

  const th = {
    bg: isDark ? "#191919" : "#ffffff",
    bgSub: isDark ? "#2a2a2a" : "#f9fafb",
    bgDrop: isDark ? "#242424" : "#ffffff",
    border: isDark ? "#333333" : "#e5e7eb",
    textPri: isDark ? "#e5e7eb" : "#1f2937",
    textSec: isDark ? "#9ca3af" : "#6b7280",
    hover: isDark ? "#242424" : "#f9fafb",
    accent: isDark ? "#f87171" : "#dc2626",
  };

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

      // Apply frontend sorting
      fetchedUsers = sortUsers(fetchedUsers, sortBy, sortDir);

      setUsers(fetchedUsers);
      setTotal(payload?.total ?? 0);
    } catch (err) {
      setApiError(err.message);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, roleFilter, statusFilter, sortBy, sortDir]);

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
  // const handleToggleStatus = async (user) => {
  //   try {
  //     await apiPut(`/users/${user.userid}/status`, {
  //       status: user.status === "Active" ? "Inactive" : "Active",
  //     });

  //     setUsers((prev) =>
  //       prev.map((u) =>
  //         u.userid === user.userid
  //           ? {
  //             ...u,
  //             status: u.status === "Active" ? "Inactive" : "Active",
  //           }
  //           : u
  //       )
  //     );

  //     addToast("User status updated successfully");
  //   } catch (err) {
  //     addToast(err.message, "error");
  //   }
  // };

  return (
    <AppLayout>
      <div className="h-full flex flex-col gap-4">
        {/* Page header */}
        <div className="flex-shrink-0">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 style={{ color: th.textPri }} className="text-3xl font-bold">Master Users</h1>
              <p style={{ color: th.textSec }} className="mt-1 text-sm">
                {loading ? "Loading…" : `${total} user${total !== 1 ? "s" : ""} total`}
              </p>
            </div>
            <button
              onClick={handleAddUser}
              style={{ backgroundColor: th.accent }}
              className="flex items-center gap-2 px-5 cursor-pointer py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90 transition"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Add User
            </button>
          </div>
        </div>

        {/* Filter and Table */}
        {/* <FilterBar
          searchQuery={searchQuery}
          searchPlaceholder="Search users by name or email…"
          dropdowns={[
            {
              allLabel: "All Roles",
              value: roleFilter,
              options: opts.roles,
              onChange: handleFilterChange(setRoleFilter)
            },
            {
              allLabel: "All Statuses",
              value: statusFilter,
              options: ["active", "inactive"],
              onChange: handleFilterChange(setStatusFilter)
            },
          ]}
          hasFilters={hasFilters}
          onSearchChange={handleSearchChange}
          onClearFilters={handleClearFilters}
          theme={th}
        /> */}

        <UsersTable
          users={users}
          total={total}
          page={page}
          totalPages={totalPages}
          loading={loading}
          apiError={apiError}
          sortBy={sortBy}
          sortDir={sortDir}
          onPageChange={setPage}
          onSort={handleSort}
          onEdit={handleEditUser}
          onDelete={handleDeleteUser}
          onToggleStatus={handleToggleStatus}
          statusUpdatingUserId={statusUpdatingUserId}
          onRetry={fetchUsers}
          theme={th}
        />
      </div>

      {/* Modals */}
      {modal && (
        <UserModal
          user={modal === "add" ? null : modal}
          retailerId={retailerId}
          onClose={() => setModal(null)}
          onSaved={handleSaveUser}
          theme={th}
        />
      )}

      {deleteTarget && (
        <DeleteModal
          displayName={`${deleteTarget.fname} ${deleteTarget.lname}`}
          detailLine1={deleteTarget.email}
          detailLine2={deleteTarget.role || "User"}
          apiPath={`/users/${deleteTarget.userid}`}
          onClose={() => setDeleteTarget(null)}
          onDeleted={handleDeleteConfirm}
          theme={th}
        />
      )}

      <Toast toasts={toasts} onDismiss={dismissToast} />
    </AppLayout>
  );
}
