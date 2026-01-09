"use client";

import * as React from "react";
import { X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

export type ColumnType = "string" | "number" | "date" | "boolean";

export type FilterOperator =
  | "equals"
  | "contains"
  | "startsWith"
  | "endsWith"
  | "gt"
  | "gte"
  | "lt"
  | "lte"
  | "before"
  | "after"
  | "between";

export interface SearchFilter {
  id: string;
  column: string;
  operator: FilterOperator;
  value: string;
  type: ColumnType;
}

interface SearchableColumn {
  id: string;
  label: string;
  type: ColumnType;
}

interface MultiColumnSearchProps {
  columns: SearchableColumn[];
  filters: SearchFilter[];
  onFiltersChange: (filters: SearchFilter[]) => void;
  placeholder?: string;
  disabled?: boolean;
}

// Get available operators for each column type
const getOperatorsForType = (type: ColumnType): FilterOperator[] => {
  switch (type) {
    case "string":
      return ["equals", "contains", "startsWith", "endsWith"];
    case "number":
      return ["equals", "gt", "gte", "lt", "lte"];
    case "date":
      return ["equals", "before", "after"];
    case "boolean":
      return ["equals"];
    default:
      return ["equals", "contains"];
  }
};

// Get display label for operators
const getOperatorLabel = (operator: FilterOperator): string => {
  const labels: Record<FilterOperator, string> = {
    equals: "Equals",
    contains: "Contains",
    startsWith: "Starts with",
    endsWith: "Ends with",
    gt: "Greater than",
    gte: "Greater or equal",
    lt: "Less than",
    lte: "Less or equal",
    before: "Before",
    after: "After",
    between: "Between",
  };
  return labels[operator];
};

export function MultiColumnSearch({
  columns,
  filters,
  onFiltersChange,
  placeholder = "Search...",
  disabled = false,
}: MultiColumnSearchProps) {
  const [selectedColumn, setSelectedColumn] = React.useState<string>(
    columns[0]?.id || "",
  );
  const [selectedOperator, setSelectedOperator] =
    React.useState<FilterOperator>("contains");
  const [searchInput, setSearchInput] = React.useState("");

  // Get current column info
  const currentColumn = React.useMemo(
    () => columns.find((c) => c.id === selectedColumn),
    [columns, selectedColumn],
  );

  // Update operator when column changes
  React.useEffect(() => {
    if (currentColumn) {
      const availableOps = getOperatorsForType(currentColumn.type);
      // Default to first available operator for the type
      if (currentColumn.type === "string") {
        setSelectedOperator("contains");
      } else if (currentColumn.type === "number") {
        setSelectedOperator("equals");
      } else if (currentColumn.type === "date") {
        setSelectedOperator("equals");
      } else {
        setSelectedOperator(availableOps[0]);
      }
    }
  }, [currentColumn]);

  const handleAddFilter = () => {
    if (!searchInput.trim() || !selectedColumn || !currentColumn) return;

    const newFilter: SearchFilter = {
      id: `${selectedColumn}-${selectedOperator}-${Date.now()}`,
      column: selectedColumn,
      operator: selectedOperator,
      value: searchInput.trim(),
      type: currentColumn.type,
    };

    onFiltersChange([...filters, newFilter]);
    setSearchInput("");
  };

  const handleRemoveFilter = (filterId: string) => {
    onFiltersChange(filters.filter((f) => f.id !== filterId));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddFilter();
    }
  };

  const getColumnLabel = (columnId: string) => {
    return columns.find((c) => c.id === columnId)?.label || columnId;
  };

  // Get input type based on column type
  const getInputType = () => {
    if (!currentColumn) return "text";
    switch (currentColumn.type) {
      case "number":
        return "number";
      case "date":
        return "date";
      default:
        return "text";
    }
  };

  // Get placeholder based on column type and operator
  const getPlaceholder = () => {
    if (!currentColumn) return placeholder;
    switch (currentColumn.type) {
      case "number":
        return "Enter number...";
      case "date":
        return "Select date...";
      default:
        return placeholder;
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        {/* Column Selector */}
        <Select
          value={selectedColumn}
          onValueChange={setSelectedColumn}
          disabled={disabled}
        >
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue placeholder="Select column" />
          </SelectTrigger>
          <SelectContent>
            {columns.map((column) => (
              <SelectItem key={column.id} value={column.id}>
                {column.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Operator Selector */}
        <Select
          value={selectedOperator}
          onValueChange={(value) =>
            setSelectedOperator(value as FilterOperator)
          }
          disabled={disabled}
        >
          <SelectTrigger className="w-full sm:w-[140px]">
            <SelectValue placeholder="Operator" />
          </SelectTrigger>
          <SelectContent>
            {currentColumn &&
              getOperatorsForType(currentColumn.type).map((op) => (
                <SelectItem key={op} value={op}>
                  {getOperatorLabel(op)}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>

        {/* Value Input */}
        <div className="flex-1 w-full">
          <Input
            type={getInputType()}
            placeholder={getPlaceholder()}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
          />
        </div>

        {/* Add Button */}
        <Button
          type="button"
          size="sm"
          onClick={handleAddFilter}
          disabled={disabled || !searchInput.trim()}
          className="w-full sm:w-auto"
        >
          <Plus className="h-4 w-4 mr-1" />
          <span className="sm:inline">Add Filter</span>
        </Button>
      </div>

      {/* Active Filters */}
      {filters.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {filters.map((filter) => (
            <Badge key={filter.id} variant="secondary" className="px-3 py-1">
              <span className="font-semibold">
                {getColumnLabel(filter.column)}
              </span>
              <span className="mx-1 text-muted-foreground">
                {getOperatorLabel(filter.operator)}
              </span>
              <span>{filter.value}</span>
              <button
                type="button"
                onClick={() => handleRemoveFilter(filter.id)}
                disabled={disabled}
                className="ml-2 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
