"use server";

import { userRepository, type SearchFilter } from "@/server/userRepository";
import {
  createUserSchema,
  updateUserSchema,
  deleteUserSchema,
  type CreateUserInput,
  type UpdateUserInput,
  type UserResponse,
  type UsersResponse,
} from "@/server/userModel";
import bcrypt from "bcrypt";
import { revalidatePath } from "next/cache";

/**
 * Get all users with pagination, search, and sorting
 */
export async function getUsers(params?: {
  page?: number;
  limit?: number;
  search?: string;
  searchFilters?: SearchFilter[];
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}): Promise<
  UsersResponse & {
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }
> {
  try {
    const result = await userRepository.getAll(params);
    return {
      success: true,
      users: result.users.map((user) => ({
        id: user.id,
        name: user.name,
        npk: user.npk,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        lastLoginAt: user.lastLoginAt,
      })),
      pagination: result.pagination,
    };
  } catch (error) {
    console.error("Error fetching users:", error);
    return {
      success: false,
      message: "Failed to fetch users",
      users: [],
    };
  }
}

/**
 * Get all users for export (no pagination)
 */
export async function getAllUsersForExport(params?: {
  searchFilters?: SearchFilter[];
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}): Promise<UsersResponse> {
  try {
    const result = await userRepository.getAllForExport(params);

    return {
      success: true,
      users: result.users.map((user) => ({
        id: user.id,
        name: user.name,
        npk: user.npk,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        lastLoginAt: user.lastLoginAt,
      })),
    };
  } catch (error) {
    console.error("Error fetching all users for export:", error);
    return {
      success: false,
      message: "Failed to fetch users for export",
      users: [],
    };
  }
}

/**
 * Get user by ID
 */
export async function getUserById(id: string): Promise<UserResponse> {
  try {
    const user = await userRepository.getById(id);

    if (!user) {
      return {
        success: false,
        message: "User not found",
      };
    }

    return {
      success: true,
      message: "User retrieved successfully",
      user: {
        id: user.id,
        name: user.name,
        npk: user.npk,
        role: user.role,
        isActive: user.isActive,
      },
    };
  } catch (error) {
    console.error("Error fetching user:", error);
    return {
      success: false,
      message: "Failed to fetch user",
    };
  }
}

/**
 * Create a new user
 */
export async function createUser(data: CreateUserInput): Promise<UserResponse> {
  try {
    // Validate input
    const validation = createUserSchema.safeParse(data);

    if (!validation.success) {
      return {
        success: false,
        message: validation.error.issues[0].message,
      };
    }

    const { name, npk, password, role, isActive } = validation.data;

    // Check if NPK already exists
    const npkExists = await userRepository.npkExists(npk);
    if (npkExists) {
      return {
        success: false,
        message: "NPK already exists",
      };
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await userRepository.create({
      name,
      npk,
      password: hashedPassword,
      role,
      isActive,
    });

    revalidatePath("/users");

    return {
      success: true,
      message: "User created successfully",
      user: {
        id: user.id,
        name: user.name,
        npk: user.npk,
        role: user.role,
        isActive: user.isActive,
      },
    };
  } catch (error) {
    console.error("Error creating user:", error);
    return {
      success: false,
      message: "Failed to create user",
    };
  }
}

/**
 * Update a user
 */
export async function updateUser(
  id: string,
  data: UpdateUserInput,
): Promise<UserResponse> {
  try {
    // Validate input
    const validation = updateUserSchema.safeParse(data);

    if (!validation.success) {
      return {
        success: false,
        message: validation.error.issues[0].message,
      };
    }

    const validatedData = validation.data;

    // Check if user exists
    const existingUser = await userRepository.getById(id);
    if (!existingUser) {
      return {
        success: false,
        message: "User not found",
      };
    }

    // Check if NPK is being changed and if it already exists
    if (validatedData.npk) {
      const npkExists = await userRepository.npkExists(validatedData.npk, id);
      if (npkExists) {
        return {
          success: false,
          message: "NPK already exists",
        };
      }
    }

    // Hash password if provided
    const updateData: Record<string, unknown> = { ...validatedData };
    if (validatedData.password) {
      updateData.password = await bcrypt.hash(validatedData.password, 10);
    }

    // Update user
    const user = await userRepository.update(id, updateData);

    revalidatePath("/users");

    return {
      success: true,
      message: "User updated successfully",
      user: {
        id: user.id,
        name: user.name,
        npk: user.npk,
        role: user.role,
        isActive: user.isActive,
      },
    };
  } catch (error) {
    console.error("Error updating user:", error);
    return {
      success: false,
      message: "Failed to update user",
    };
  }
}

/**
 * Delete a user
 */
export async function deleteUser(id: string): Promise<UserResponse> {
  try {
    // Validate input
    const validation = deleteUserSchema.safeParse({ id });

    if (!validation.success) {
      return {
        success: false,
        message: validation.error.issues[0].message,
      };
    }

    // Check if user exists
    const existingUser = await userRepository.getById(id);
    if (!existingUser) {
      return {
        success: false,
        message: "User not found",
      };
    }

    // Delete user
    await userRepository.delete(id);

    revalidatePath("/users");

    return {
      success: true,
      message: "User deleted successfully",
    };
  } catch (error) {
    console.error("Error deleting user:", error);
    return {
      success: false,
      message: "Failed to delete user",
    };
  }
}

/**
 * Toggle user active status
 */
export async function toggleUserActive(id: string): Promise<UserResponse> {
  try {
    const user = await userRepository.toggleActive(id);

    revalidatePath("/users");

    return {
      success: true,
      message: `User ${user.isActive ? "activated" : "deactivated"} successfully`,
      user: {
        id: user.id,
        name: user.name,
        npk: user.npk,
        role: user.role,
        isActive: user.isActive,
      },
    };
  } catch (error) {
    console.error("Error toggling user status:", error);
    return {
      success: false,
      message: "Failed to toggle user status",
    };
  }
}

/**
 * Get user template data for Excel import
 */
export async function getUserTemplateData() {
  try {
    return {
      success: true,
      templateData: [
        {
          name: "John Doe",
          npk: "12345",
          password: "password123",
          role: "USER",
          isActive: "TRUE",
        },
      ],
      instructions: {
        title: "User Import Instructions",
        description: "Use this template to import multiple users at once.",
        fields: [
          {
            field: "name",
            description: "Full name of the user",
            required: true,
          },
          {
            field: "npk",
            description: "Employee ID (must be unique)",
            required: true,
          },
          {
            field: "password",
            description: "Initial password for the user",
            required: true,
          },
          {
            field: "role",
            description: "User role: ADMIN or USER",
            required: true,
          },
          {
            field: "isActive",
            description: "Active status: TRUE or FALSE",
            required: false,
          },
        ],
      },
    };
  } catch (error) {
    console.error("Error generating template data:", error);
    return {
      success: false,
      message: "Failed to generate template data",
    };
  }
}

/**
 * Import users from Excel data
 */
export async function importUsers(
  data: Array<{
    name: string;
    npk: string;
    password: string;
    role: string;
    isActive?: string;
  }>,
) {
  const results = {
    successCount: 0,
    failureCount: 0,
    errors: [] as Array<{ row: number; error: string }>,
  };

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const rowNumber = i + 2; // +2 for 1-based index and header row

    try {
      // Validate required fields
      if (!row.name?.trim()) {
        results.errors.push({ row: rowNumber, error: "Name is required" });
        results.failureCount++;
        continue;
      }

      if (!row.npk?.trim()) {
        results.errors.push({ row: rowNumber, error: "NPK is required" });
        results.failureCount++;
        continue;
      }

      if (!row.password?.trim()) {
        results.errors.push({ row: rowNumber, error: "Password is required" });
        results.failureCount++;
        continue;
      }

      if (!row.role?.trim()) {
        results.errors.push({ row: rowNumber, error: "Role is required" });
        results.failureCount++;
        continue;
      }

      // Validate role
      const validRoles = ["ADMIN", "USER", "VIEWER"];
      const roleUpper = row.role.trim().toUpperCase();
      if (!validRoles.includes(roleUpper)) {
        results.errors.push({
          row: rowNumber,
          error: `Invalid role. Must be one of: ${validRoles.join(", ")}`,
        });
        results.failureCount++;
        continue;
      }

      // Parse isActive
      let isActive = true;
      if (row.isActive !== undefined && row.isActive !== null) {
        const isActiveStr = String(row.isActive).trim().toUpperCase();
        if (isActiveStr === "FALSE" || isActiveStr === "0") {
          isActive = false;
        }
      }

      // Check if NPK already exists
      const exists = await userRepository.npkExists(row.npk.trim());
      if (exists) {
        results.errors.push({
          row: rowNumber,
          error: `NPK "${row.npk}" already exists`,
        });
        results.failureCount++;
        continue;
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(row.password.trim(), 10);

      // Create user
      await userRepository.create({
        name: row.name.trim(),
        npk: row.npk.trim(),
        password: hashedPassword,
        role: roleUpper as "ADMIN" | "USER" | "VIEWER",
        isActive,
      });

      results.successCount++;
    } catch (error) {
      console.error(`Error importing row ${rowNumber}:`, error);
      results.errors.push({
        row: rowNumber,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      });
      results.failureCount++;
    }
  }

  // Revalidate path if any users were created
  if (results.successCount > 0) {
    revalidatePath("/users");
  }

  return results;
}
