"use client";

import { useState, useRef } from "react";
import { Download, Upload, RefreshCw, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { parseExcelFile } from "@/lib/excel";

interface ImportResult {
  successCount: number;
  failureCount: number;
  errors: Array<{ row: number; error: string }>;
}

interface ExcelImportDialogProps<T> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  onDownloadTemplate: () => Promise<void>;
  onImport: (data: T[]) => Promise<ImportResult>;
  onSuccess?: () => void;
}

export function ExcelImportDialog<T = Record<string, unknown>>({
  open,
  onOpenChange,
  title,
  description,
  onDownloadTemplate,
  onImport,
  onSuccess,
}: ExcelImportDialogProps<T>) {
  const [isImporting, setIsImporting] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
        toast.error("Please upload an Excel file (.xlsx or .xls)");
        return;
      }
      setImportFile(file);
      setImportResult(null);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      await onDownloadTemplate();
    } catch (error) {
      console.error("Template download error:", error);
      toast.error("An error occurred while downloading template");
    }
  };

  const handleImport = async () => {
    if (!importFile) {
      toast.error("Please select a file to import");
      return;
    }

    setIsImporting(true);
    const toastId = toast.loading("Importing data...");

    try {
      // Parse Excel file
      const data = await parseExcelFile<T>(importFile);

      if (data.length === 0) {
        toast.error("No data found in the Excel file", { id: toastId });
        setIsImporting(false);
        return;
      }

      // Import data
      const result = await onImport(data);

      setImportResult({
        successCount: result.successCount,
        failureCount: result.failureCount,
        errors: result.errors,
      });

      if (result.successCount > 0) {
        const message =
          result.failureCount > 0
            ? `Import completed: ${result.successCount} succeeded, ${result.failureCount} failed`
            : `Successfully imported ${result.successCount} records`;
        toast.success(message, { id: toastId });
        onSuccess?.();
      } else {
        toast.error("Import failed: No records were created", { id: toastId });
      }
    } catch (error) {
      console.error("Import error:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "An error occurred while importing",
        { id: toastId },
      );
    } finally {
      setIsImporting(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setImportFile(null);
    setImportResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden w-[95vw] sm:w-full">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            {title}
          </DialogTitle>
          <DialogDescription className="text-sm">
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* File Upload */}
          <div className="space-y-2">
            <label htmlFor="file-upload" className="text-sm font-medium">
              Select Excel File
            </label>
            <div className="flex gap-2">
              <Input
                id="file-upload"
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                disabled={isImporting}
                className="flex-1"
              />
              <Button
                variant="outline"
                onClick={handleDownloadTemplate}
                disabled={isImporting}
              >
                <Download className="mr-2 h-4 w-4" />
                Template
              </Button>
            </div>
            {importFile && (
              <p className="text-sm text-muted-foreground">
                Selected: {importFile.name}
              </p>
            )}
          </div>

          {/* Import Result */}
          {importResult && (
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-muted rounded-md">
                <div className="flex gap-4">
                  <div className="text-sm">
                    <span className="font-medium text-green-600">
                      Success: {importResult.successCount}
                    </span>
                  </div>
                  <div className="text-sm">
                    <span className="font-medium text-red-600">
                      Failed: {importResult.failureCount}
                    </span>
                  </div>
                </div>
              </div>

              {importResult.errors.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-destructive">
                    Errors ({importResult.errors.length}):
                  </p>
                  <ScrollArea className="h-[200px] w-full rounded-md border p-3">
                    <div className="space-y-2">
                      {importResult.errors.map((error, index) => (
                        <div
                          key={index}
                          className="text-sm p-2 bg-destructive/10 rounded"
                        >
                          <span className="font-medium">Row {error.row}:</span>{" "}
                          {error.error}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isImporting}
            >
              {importResult ? "Close" : "Cancel"}
            </Button>
            {!importResult && (
              <Button
                onClick={handleImport}
                disabled={!importFile || isImporting}
              >
                {isImporting ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Import
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
