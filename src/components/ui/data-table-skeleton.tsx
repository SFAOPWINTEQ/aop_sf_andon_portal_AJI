import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ColumnDef } from "@tanstack/react-table";
import { flexRender } from "@tanstack/react-table";

interface DataTableSkeletonProps {
  columnCount: number;
  rowCount?: number;
  columns?: ColumnDef<any, any>[];
}

export function DataTableSkeleton({
  columnCount,
  rowCount = 10,
  columns = [],
}: DataTableSkeletonProps) {
  // Use fixed widths to avoid hydration mismatch (no Math.random())
  const widthVariations = ["70%", "80%", "75%", "85%", "65%"];

  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.length > 0
              ? columns.map((column, index) => (
                  <TableHead key={column.id || index}>
                    {typeof column.header === "function"
                      ? flexRender(column.header, {
                          column: { id: column.id || `col-${index}` },
                        } as any)
                      : column.header}
                  </TableHead>
                ))
              : Array.from({ length: columnCount }).map((_, index) => (
                  <TableHead key={index}>
                    <Skeleton className="h-8 w-[80%]" />
                  </TableHead>
                ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: rowCount }).map((_, rowIndex) => (
            <TableRow key={rowIndex}>
              {Array.from({ length: columnCount }).map((_, cellIndex) => {
                // Last column is typically actions
                if (cellIndex === columnCount - 1) {
                  return (
                    <TableCell key={cellIndex}>
                      <Skeleton className="h-8 w-8 rounded-md" />
                    </TableCell>
                  );
                }
                // First few columns might be badges or shorter content
                if (cellIndex < 2) {
                  return (
                    <TableCell key={cellIndex}>
                      <Skeleton
                        className="h-5 rounded-full"
                        style={{
                          width:
                            widthVariations[
                              (rowIndex + cellIndex) % widthVariations.length
                            ],
                        }}
                      />
                    </TableCell>
                  );
                }
                // Other columns
                return (
                  <TableCell key={cellIndex}>
                    <Skeleton
                      className="h-4"
                      style={{
                        width:
                          widthVariations[
                            (rowIndex + cellIndex) % widthVariations.length
                          ],
                      }}
                    />
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
