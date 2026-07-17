"use client";

import AppLayout from "@/app/components/layout/AppLayout";
import { DeleteModal } from "@/app/components/modal/DeleteModal";
import { UserModal } from "@/app/components/modal/UserModal";
import { UsersTable } from "@/app/components/table/UsersTable";
import { Toast } from "@/app/components/Toast";
import useAppTheme from "@/app/hooks/useAppTheme";
import { useUsersPage } from "@/app/hooks/useUsersPage";

const ALLOWED_ROLES = ["Admin", "Manager"];
const ROLE_OPTIONS = ["Admin", "Manager"];

export default function UsersPage() {
  const th = useAppTheme();

  const {
    users,
    total,
    loading,
    apiError,
    page,
    sortBy,
    sortDir,
    totalPages,
    modal,
    deleteTarget,
    toasts,
    statusUpdatingUserId,
    setPage,
    handleSort,
    handleAddUser,
    handleEditUser,
    handleDeleteUser,
    handleSaveUser,
    handleDeleteConfirm,
    handleToggleStatus,
    setModal,
    setDeleteTarget,
    dismissToast,
    fetchUsers,
  } = useUsersPage({ allowedRoles: ALLOWED_ROLES });

  return (
    <AppLayout>
      <div className="h-full flex flex-col gap-4">
        {/* Page header */}
        <div className="flex-shrink-0">
          <div className="flex items-start justify-between mb-4">
            {/* <div>
              <h1 style={{ color: th.textPri }} className="text-3xl font-bold">Users</h1>
              <p style={{ color: th.textSec }} className="mt-1 text-sm">
                {loading ? "Loading…" : `${total} user${total !== 1 ? "s" : ""} total`}
              </p>
            </div> */}
            <button
              onClick={handleAddUser}
              style={{ backgroundColor: th.accent }}
              className="flex items-center gap-2 px-5 cursor-pointer py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90 transition"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Create User
            </button>
          </div>
        </div>

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
          roleOptions={ROLE_OPTIONS}
          onClose={() => setModal(null)}
          onSaved={handleSaveUser}
          theme={th}
        />
      )}

      {deleteTarget && (
        <DeleteModal
          displayName={`${deleteTarget.fname} ${deleteTarget.lname}`}
          detailLine1={deleteTarget.email}
          detailLine2={deleteTarget.role || "Manager"}
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
