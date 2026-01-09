"use client";

import { useState, useTransition } from "react";
import { Plus, RefreshCw, Upload } from "lucide-react";
import { toast } from "sonner";
import type { SortingState } from "@tanstack/react-table";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { DataTable } from "@/components/ui/data-table";
import { getUserColumns, type User } from "@/components/users/user-columns";
import { UserForm } from "@/components/users/user-form";
import {
  deleteUser,
  getAllUsersForExport,
  getUserTemplateData,
  importUsers,
} from "@/server/userService";
import { useUsers } from "@/hooks/useUsers";
import {
  exportToExcel,
  formatDataForExport,
  createExcelTemplate,
} from "@/lib/excel";
import type { SearchFilter } from "@/components/ui/multi-column-search";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { ExcelImportDialog } from "@/components/ui/excel-import-dialog";

export default function UsersPage() {
  useDocumentTitle("Users");

  // Server-side pagination, search, and sorting state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchFilters, setSearchFilters] = useState<SearchFilter[]>([]);
  const [sorting, setSorting] = useState<SortingState>([]);

  // Extract sort parameters from sorting state
  const sortBy = sorting.length > 0 ? sorting[0].id : "createdAt";
  const sortOrder =
    sorting.length > 0 ? (sorting[0].desc ? "desc" : "asc") : "desc";

  // Use SWR hook for data fetching
  const { users, pagination, isLoading, mutate } = useUsers({
    page,
    limit: pageSize,
    searchFilters,
    sortBy,
    sortOrder,
  });

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleEdit = (user: User) => {
    setEditingUser(user);
  };

  const handleDelete = (user: User) => {
    setDeletingUser(user);
  };

  const confirmDelete = () => {
    if (!deletingUser) return;

    startTransition(async () => {
      const result = await deleteUser(deletingUser.id);
      if (result.success) {
        toast.success(result.message);
        setDeletingUser(null);
        await mutate(); // Revalidate SWR cache
      } else {
        toast.error(result.message);
      }
    });
  };

  const handleSuccess = async () => {
    setIsCreateOpen(false);
    setEditingUser(null);
    await mutate(); // Revalidate SWR cache
  };

  const handlePaginationChange = (newPagination: {
    pageIndex: number;
    pageSize: number;
  }) => {
    setPage(newPagination.pageIndex + 1); // Table uses 0-based index, API uses 1-based
    setPageSize(newPagination.pageSize);
  };

  const handleSearchFiltersChange = (filters: SearchFilter[]) => {
    setSearchFilters(filters);
    setPage(1); // Reset to first page on filter change
  };

  const handleSortingChange = (newSorting: SortingState) => {
    setSorting(newSorting);
    setPage(1); // Reset to first page on sort
  };

  const handleExport = async () => {
    const toastId = toast.loading("Preparing export...");

    try {
      // Fetch all users with current filters and sorting
      const result = await getAllUsersForExport({
        searchFilters,
        sortBy,
        sortOrder,
      });

      if (result.success && result.users) {
        const exportData = formatDataForExport(
          result.users,
          ["id"], // Exclude id field
          ["lastLoginAt", "createdAt", "updatedAt"], // Format date fields
        );

        exportToExcel(
          exportData,
          `users-export-${new Date().toISOString().split("T")[0]}`,
          "Users",
        );

        toast.success(`Successfully exported ${result.users.length} users`, {
          id: toastId,
        });
      } else {
        toast.error(result.message || "Failed to export users", {
          id: toastId,
        });
      }
    } catch (error) {
      console.error("Export error:", error);
      toast.error("An error occurred while exporting", {
        id: toastId,
      });
    }
  };

  // Handle Excel template download
  async function handleDownloadTemplate() {
    try {
      const result = await getUserTemplateData();

      if (result.success && result.templateData && result.instructions) {
        // Convert instructions object to array of strings
        const instructionStrings = [
          result.instructions.title,
          result.instructions.description,
          "",
          ...result.instructions.fields.map(
            (f: { field: string; description: string; required: boolean }) =>
              `${f.field}: ${f.description} (${f.required ? "Required" : "Optional"})`,
          ),
        ];

        createExcelTemplate(
          result.templateData,
          instructionStrings,
          "user_import_template",
          "Data",
          "Instructions",
        );
        toast.success("Template downloaded successfully");
      } else {
        toast.error(result.message || "Failed to generate template");
      }
    } catch (error) {
      console.error("Error downloading template:", error);
      toast.error("Failed to download template");
    }
  }

  // Handle Excel import
  async function handleImport(
    data: Array<{
      name: string | Date;
      npk: string | Date;
      password: string | Date;
      role: string | Date;
      isActive?: string | Date;
    }>,
  ) {
    // Transform data
    const typedData = data.map((row) => ({
      name: String(row.name || ""),
      npk: String(row.npk || ""),
      password: String(row.password || ""),
      role: String(row.role || ""),
      isActive: row.isActive ? String(row.isActive) : undefined,
    }));

    const result = await importUsers(typedData);

    // Show results
    if (result.successCount > 0) {
      toast.success(`Successfully imported ${result.successCount} user(s)`, {
        description:
          result.failureCount > 0
            ? `${result.failureCount} row(s) failed`
            : undefined,
      });
      mutate(); // Refresh the user list
    }

    if (result.errors.length > 0) {
      toast.error(`Import completed with ${result.errors.length} error(s)`, {
        description: result.errors
          .slice(0, 3)
          .map((e) => `Row ${e.row}: ${e.error}`)
          .join("\n"),
      });
    }

    if (result.successCount === 0 && result.failureCount > 0) {
      toast.error("Import failed", {
        description: "No users were imported. Please check the errors above.",
      });
    }

    return result;
  }

  const columns = getUserColumns({
    onEdit: handleEdit,
    onDelete: handleDelete,
  });

  return (
    <div className="flex flex-col">
      <div className="flex-1 p-4 sm:p-6">
        {/* Table */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <CardTitle>Users</CardTitle>
                <CardDescription className="mt-1.5">
                  Manage your users and permissions
                </CardDescription>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => mutate()}
                  disabled={isLoading}
                  className="flex-none"
                >
                  <RefreshCw
                    className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
                  />
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsImportOpen(true)}
                  className="flex-1 sm:flex-none"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  <span className="sm:inline">Import</span>
                </Button>
                <Button
                  onClick={() => setIsCreateOpen(true)}
                  className="flex-1 sm:flex-none"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  <span className="sm:inline">Add User</span>
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={columns}
              data={users}
              // Multi-column search
              useMultiColumnSearch={true}
              searchableColumns={[
                { id: "name", label: "Name", type: "string" },
                { id: "npk", label: "NPK", type: "string" },
                { id: "role", label: "Role", type: "string" },
                { id: "isActive", label: "Active", type: "boolean" },
                { id: "createdAt", label: "Created At", type: "date" },
                { id: "updatedAt", label: "Updated At", type: "date" },
                { id: "lastLoginAt", label: "Last Login", type: "date" },
              ]}
              searchFilters={searchFilters}
              onSearchFiltersChange={handleSearchFiltersChange}
              searchPlaceholder="Enter search value..."
              // Server-side props
              pageCount={pagination?.totalPages}
              pageIndex={page - 1} // Table uses 0-based index
              pageSize={pageSize}
              onPaginationChange={handlePaginationChange}
              sorting={sorting}
              onSortingChange={handleSortingChange}
              isLoading={isLoading}
              // Export
              onExport={handleExport}
              exportFilename="users"
              totalCount={pagination?.total}
            />
          </CardContent>
        </Card>
      </div>

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
            <DialogDescription className="text-sm">
              Add a new user to the system. All fields are required.
            </DialogDescription>
          </DialogHeader>
          <UserForm onSuccess={handleSuccess} />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog
        open={!!editingUser}
        onOpenChange={(open) => !open && setEditingUser(null)}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription className="text-sm">
              Update user information. Leave password blank to keep current.
            </DialogDescription>
          </DialogHeader>
          {editingUser && (
            <UserForm initialData={editingUser} onSuccess={handleSuccess} />
          )}
        </DialogContent>
      </Dialog>

      {/* Excel Import Dialog */}
      <ExcelImportDialog<{
        name: string;
        npk: string;
        password: string;
        role: string;
        isActive?: string;
      }>
        open={isImportOpen}
        onOpenChange={setIsImportOpen}
        onDownloadTemplate={handleDownloadTemplate}
        onImport={handleImport}
        title="Import Users"
        description="Upload an Excel file to import multiple users at once. Download the template to see the required format."
      />

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deletingUser}
        onOpenChange={(open: boolean) => !open && setDeletingUser(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the user{" "}
              <span className="font-semibold">{deletingUser?.name}</span>. This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
