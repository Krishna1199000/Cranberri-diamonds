"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, FileSpreadsheet, X, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface UploadError {
  row: number;
  stockId: string;
  field?: string;
  message: string;
}

interface UploadResult {
  success: boolean;
  totalRows: number;
  successCount: number;
  errorCount: number;
  duplicateCount: number;
  errors: UploadError[];
  message?: string;
}

interface ExcelUploadProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: () => void;
}

export function ExcelUpload({ isOpen, onClose, onUploadSuccess }: ExcelUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const validExtensions = [".xlsx", ".xls", ".csv"];
      const fileExtension = selectedFile.name.substring(selectedFile.name.lastIndexOf(".")).toLowerCase();
      
      if (!validExtensions.includes(fileExtension)) {
        toast.error("Please select a valid Excel file (.xlsx, .xls, or .csv)");
        return;
      }
      
      setFile(selectedFile);
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error("Please select a file to upload");
      return;
    }

    setUploading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/inventory-items/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      const data: UploadResult = await response.json();

      if (response.ok && data.success) {
        setResult(data);
        toast.success(`Successfully uploaded ${data.successCount} items!`);
        if (data.errorCount > 0 || data.duplicateCount > 0) {
          toast.warning(
            `${data.errorCount} errors and ${data.duplicateCount} duplicates found. Check details below.`
          );
        }
        if (data.successCount > 0) {
          onUploadSuccess();
        }
      } else {
        setResult(data);
        toast.error(data.message || "Upload failed");
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload file. Please try again.");
      setResult({
        success: false,
        totalRows: 0,
        successCount: 0,
        errorCount: 0,
        duplicateCount: 0,
        errors: [],
        message: "Network error. Please check your connection and try again.",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Upload Inventory via Excel</DialogTitle>
          <DialogDescription>
            Upload inventory items from an Excel file. Only unique Stock IDs will be uploaded.
            Duplicates will be skipped.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* File Selection */}
          <div className="space-y-2">
            <Label htmlFor="excel-file">Select Excel File</Label>
            <div className="flex items-center gap-4">
              <Input
                id="excel-file"
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileSelect}
                className="flex-1"
                disabled={uploading}
              />
              {file && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <FileSpreadsheet className="h-4 w-4" />
                  <span className="truncate max-w-[200px]">{file.name}</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setFile(null);
                      if (fileInputRef.current) {
                        fileInputRef.current.value = "";
                      }
                    }}
                    disabled={uploading}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
            <p className="text-xs text-gray-500">
              Expected columns: Stock ID, Status, Location, Held By, Video, images, certificate, shape, carat, color, clarity, Lab, report no, cut, polish, symmetry, Measurement(length), Measurement(width), measurement(depth), Ratio, table, depth, Growth type, Flourence, Price P/Ct (Asking), price, Green Price P/Ct, Red Price P/Ct. Asking/Green/Red price tiers are required.
            </p>
          </div>

          {/* Upload Button */}
          <Button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="w-full"
          >
            {uploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Upload File
              </>
            )}
          </Button>

          {/* Results */}
          {result && (
            <div className="space-y-4 border-t pt-4">
              <div className="grid grid-cols-4 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{result.totalRows}</div>
                  <div className="text-xs text-gray-600">Total Rows</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{result.successCount}</div>
                  <div className="text-xs text-gray-600">Success</div>
                </div>
                <div className="text-center p-3 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">{result.duplicateCount}</div>
                  <div className="text-xs text-gray-600">Duplicates</div>
                </div>
                <div className="text-center p-3 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{result.errorCount}</div>
                  <div className="text-xs text-gray-600">Errors</div>
                </div>
              </div>

              {result.errors.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    Error Details ({result.errors.length})
                  </h4>
                  <div className="max-h-60 overflow-y-auto border rounded-lg">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="px-3 py-2 text-left">Row</th>
                          <th className="px-3 py-2 text-left">Stock ID</th>
                          <th className="px-3 py-2 text-left">Field</th>
                          <th className="px-3 py-2 text-left">Error</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {result.errors.map((error, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-3 py-2">{error.row}</td>
                            <td className="px-3 py-2 font-mono text-xs">
                              {error.stockId || "N/A"}
                            </td>
                            <td className="px-3 py-2">{error.field || "General"}</td>
                            <td className="px-3 py-2 text-red-600">{error.message}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {result.successCount > 0 && (
                <div className="flex items-center gap-2 text-green-600 text-sm">
                  <CheckCircle className="h-4 w-4" />
                  <span>
                    {result.successCount} item(s) successfully uploaded to inventory.
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

