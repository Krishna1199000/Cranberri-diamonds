import { NextRequest, NextResponse } from "next/server";
import { PrismaClient, DiamondStatus, Prisma } from "@prisma/client";
import { getSession } from "@/lib/session";
import * as XLSX from "xlsx";

const prisma = new PrismaClient();

interface UploadError {
  row: number;
  stockId: string;
  field?: string;
  message: string;
}

interface ExcelRow {
  [key: string]: any;
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication and admin role
    const session = await getSession();
    if (!session || (session as { role?: string })?.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Admin access required." },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { success: false, message: "No file provided" },
        { status: 400 }
      );
    }

    // Read file buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Parse Excel file
    let workbook: XLSX.WorkBook;
    try {
      workbook = XLSX.read(buffer, { type: "buffer" });
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid Excel file format",
          totalRows: 0,
          successCount: 0,
          errorCount: 0,
          duplicateCount: 0,
          errors: [],
        },
        { status: 400 }
      );
    }

    // Get first sheet
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Convert to JSON
    const rows: ExcelRow[] = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      defval: null,
    });

    if (rows.length < 2) {
      return NextResponse.json(
        {
          success: false,
          message: "Excel file must have at least a header row and one data row",
          totalRows: 0,
          successCount: 0,
          errorCount: 0,
          duplicateCount: 0,
          errors: [],
        },
        { status: 400 }
      );
    }

    // Get headers (first row)
    const headers = rows[0] as string[];
    const normalizedHeaders = headers.map((h) =>
      h ? String(h).trim().toLowerCase() : ""
    );

    // Helper function to get column index by name (case-insensitive, flexible matching)
    const getColumnIndex = (searchNames: string[]): number | null => {
      for (const searchName of searchNames) {
        const index = normalizedHeaders.findIndex((h) =>
          h.includes(searchName.toLowerCase())
        );
        if (index !== -1) return index;
      }
      return null;
    };

    // Map column names (handle variations)
    const stockIdIdx = getColumnIndex(["stock id", "stockid"]);
    const statusIdx = getColumnIndex(["status"]);
    const locationIdx = getColumnIndex(["location"]);
    const heldByIdx = getColumnIndex(["held by", "heldby", "held"]);
    const videoIdx = getColumnIndex(["video"]);
    const imageIdx = getColumnIndex(["images", "image", "img"]);
    const certificateIdx = getColumnIndex(["certificate", "cert"]);
    const shapeIdx = getColumnIndex(["shape"]);
    const caratIdx = getColumnIndex(["carat"]);
    const colorIdx = getColumnIndex(["color"]);
    const clarityIdx = getColumnIndex(["clarity"]);
    const labIdx = getColumnIndex(["lab", "laboratory"]);
    const reportNoIdx = getColumnIndex(["report no", "reportno", "report"]);
    const cutIdx = getColumnIndex(["cut"]);
    const polishIdx = getColumnIndex(["polish"]);
    const symmetryIdx = getColumnIndex(["symmetry", "sym"]);
    const measurementLengthIdx = getColumnIndex([
      "measurement(length)",
      "measurement (length)",
      "length",
    ]);
    const measurementWidthIdx = getColumnIndex([
      "measurement(width)",
      "measurement (width)",
      "width",
    ]);
    const measurementDepthIdx = getColumnIndex([
      "measurement(depth)",
      "measurement (depth)",
    ]);
    const ratioIdx = getColumnIndex(["ratio"]);
    const tableIdx = getColumnIndex(["table"]);
    const depthIdx = getColumnIndex(["depth"]);
    const growthTypeIdx = getColumnIndex(["growth type", "growthtype", "growth"]);
    const flourenceIdx = getColumnIndex(["flourence", "fluorescence", "flourescence"]);
    const pricePerCaratIdx = getColumnIndex([
      "price p/ct",
      "price p/ct",
      "pricepercarat",
      "price per carat",
    ]);
    const priceIdx = getColumnIndex(["price", "final amount", "finalamount"]);
    const greenPricePerCaratIdx = getColumnIndex([
      "green price p/ct",
      "greenpricepercarat",
      "green price per carat",
      "green price p/ct",
    ]);
    const greenPriceIdx = getColumnIndex([
      "green price",
      "greenprice",
      "green total price",
    ]);
    const redPricePerCaratIdx = getColumnIndex([
      "red price p/ct",
      "redpricepercarat",
      "red price per carat",
      "red price p/ct",
    ]);
    const redPriceIdx = getColumnIndex([
      "red price",
      "redprice",
      "red total price",
    ]);

    // Validate required columns
    if (stockIdIdx === null) {
      return NextResponse.json(
        {
          success: false,
          message: "Required column 'Stock ID' not found in Excel file",
          totalRows: 0,
          successCount: 0,
          errorCount: 0,
          duplicateCount: 0,
          errors: [],
        },
        { status: 400 }
      );
    }

    const errors: UploadError[] = [];
    const processedStockIds = new Set<string>();
    const duplicateStockIds = new Set<string>();
    let successCount = 0;
    let updateCount = 0;

    // Helper function to normalize Stock ID for comparison (handles CDS-001 vs CDS-01 vs CDS-1)
    const normalizeStockId = (stockId: string): string => {
      if (!stockId) return '';
      // Convert to uppercase and remove extra spaces
      let normalized = stockId.toUpperCase().trim();
      // Try to normalize number patterns (e.g., CDS-001 -> CDS-1, CDS-01 -> CDS-1)
      // Match pattern like "CDS-001" or "CDS-01" and normalize to "CDS-1"
      normalized = normalized.replace(/-0+(\d+)$/, '-$1'); // Remove leading zeros after dash
      return normalized;
    };

    // Get all existing inventory items to check for duplicates by normalized Stock ID
    const existingItems = await prisma.inventoryItem.findMany({
      select: { id: true, stockId: true, createdAt: true },
      orderBy: { createdAt: 'desc' }
    });
    
    // Create a map of normalized Stock ID to the latest existing item
    const existingStockIdMap = new Map<string, { id: string; stockId: string; createdAt: Date }>();
    for (const item of existingItems) {
      const normalized = normalizeStockId(item.stockId);
      if (!existingStockIdMap.has(normalized)) {
        existingStockIdMap.set(normalized, item);
      } else {
        const existing = existingStockIdMap.get(normalized)!;
        // Keep the one with latest createdAt
        if (new Date(item.createdAt) > new Date(existing.createdAt)) {
          existingStockIdMap.set(normalized, item);
        }
      }
    }

    // Process rows (skip header row, start from index 1)
    const dataRows = rows.slice(1);
    const validStatuses = Object.values(DiamondStatus);

    // Fetch all shipments once to map "Held By" company names
    const shipments = await prisma.shipment.findMany({
      select: { id: true, companyName: true },
    });
    const shipmentMap = new Map(
      shipments.map((s) => [s.companyName.toLowerCase().trim(), s.id])
    );

    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i] as any[];
      const rowNumber = i + 2; // +2 because we start from row 2 (after header)

      // Skip completely empty rows
      if (!row || row.every((cell) => cell === null || cell === undefined || cell === "")) {
        continue;
      }

      const stockId = stockIdIdx !== null && row[stockIdIdx] 
        ? String(row[stockIdIdx]).trim() 
        : null;

      if (!stockId) {
        errors.push({
          row: rowNumber,
          stockId: "",
          field: "Stock ID",
          message: "Stock ID is required",
        });
        continue;
      }

      const normalizedStockId = normalizeStockId(stockId);

      // Check for duplicates within the Excel file itself - if same normalized ID appears, keep the last one
      const isDuplicateInFile = processedStockIds.has(normalizedStockId);
      if (isDuplicateInFile) {
        duplicateStockIds.add(stockId);
      }

      processedStockIds.add(normalizedStockId);

      // Check if stock ID (or similar normalized version) already exists in database
      const existingItem = existingStockIdMap.get(normalizedStockId);
      const isUpdate = existingItem !== undefined && existingItem.id && !existingItem.id.toString().startsWith('pending-');

      // Extract and validate fields
      const status =
        statusIdx !== null && row[statusIdx]
          ? String(row[statusIdx]).trim().toUpperCase()
          : "AVAILABLE";

      if (!validStatuses.includes(status as DiamondStatus)) {
        errors.push({
          row: rowNumber,
          stockId,
          field: "Status",
          message: `Invalid status: ${status}. Must be one of: ${validStatuses.join(", ")}`,
        });
        continue;
      }

      const shape =
        shapeIdx !== null && row[shapeIdx] ? String(row[shapeIdx]).trim() : null;
      if (!shape) {
        errors.push({
          row: rowNumber,
          stockId,
          field: "Shape",
          message: "Shape is required",
        });
        continue;
      }

      const carat =
        caratIdx !== null && row[caratIdx]
          ? parseFloat(String(row[caratIdx]))
          : null;
      if (carat === null || isNaN(carat) || carat <= 0) {
        errors.push({
          row: rowNumber,
          stockId,
          field: "Carat",
          message: "Valid carat (size) is required and must be a positive number",
        });
        continue;
      }

      const color =
        colorIdx !== null && row[colorIdx] ? String(row[colorIdx]).trim() : null;
      if (!color) {
        errors.push({
          row: rowNumber,
          stockId,
          field: "Color",
          message: "Color is required",
        });
        continue;
      }

      const clarity =
        clarityIdx !== null && row[clarityIdx]
          ? String(row[clarityIdx]).trim()
          : null;
      if (!clarity) {
        errors.push({
          row: rowNumber,
          stockId,
          field: "Clarity",
          message: "Clarity is required",
        });
        continue;
      }

      // Allow blank/empty values for optional technical fields
      const lab =
        labIdx !== null && row[labIdx] && String(row[labIdx]).trim() !== ""
          ? String(row[labIdx]).trim()
          : null;

      const polish =
        polishIdx !== null && row[polishIdx] && String(row[polishIdx]).trim() !== ""
          ? String(row[polishIdx]).trim()
          : null;

      const sym =
        symmetryIdx !== null && row[symmetryIdx] && String(row[symmetryIdx]).trim() !== ""
          ? String(row[symmetryIdx]).trim()
          : null;

      let pricePerCarat: number | null = null;
      if (pricePerCaratIdx !== null && row[pricePerCaratIdx] !== null && row[pricePerCaratIdx] !== undefined && String(row[pricePerCaratIdx]).trim() !== "") {
        const parsed = parseFloat(String(row[pricePerCaratIdx]));
        if (!isNaN(parsed) && parsed >= 0) {
          pricePerCarat = parsed;
        }
      }

      if (pricePerCarat === null) {
        errors.push({
          row: rowNumber,
          stockId,
          field: "Price P/Ct",
          message: "Asking price per carat is required",
        });
        continue;
      }

      // Calculate finalAmount - use provided price or calculate from pricePerCarat if available
      let finalAmount: number = 0;
      if (priceIdx !== null && row[priceIdx] !== null && row[priceIdx] !== undefined && String(row[priceIdx]).trim() !== "") {
        const parsedPrice = parseFloat(String(row[priceIdx]));
        if (!isNaN(parsedPrice) && parsedPrice >= 0) {
          finalAmount = parsedPrice;
        }
      } else if (pricePerCarat !== null && pricePerCarat > 0 && carat > 0) {
        // Calculate if price not provided but pricePerCarat is available
        finalAmount = carat * pricePerCarat;
      }

      // Extract optional fields
      const location =
        locationIdx !== null && row[locationIdx]
          ? String(row[locationIdx]).trim()
          : null;

      const heldByCompany =
        heldByIdx !== null && row[heldByIdx]
          ? String(row[heldByIdx]).trim()
          : null;

      let heldByShipmentId: string | null = null;
      if (heldByCompany) {
        const shipmentId = shipmentMap.get(heldByCompany.toLowerCase().trim());
        if (shipmentId) {
          heldByShipmentId = shipmentId;
        } else {
          // Warning: shipment not found, but continue with null
          // Could add to errors if strict validation is needed
        }
      }

      const videoUrl =
        videoIdx !== null && row[videoIdx] ? String(row[videoIdx]).trim() : null;
      const imageUrl =
        imageIdx !== null && row[imageIdx] ? String(row[imageIdx]).trim() : null;
      const certUrl =
        certificateIdx !== null && row[certificateIdx]
          ? String(row[certificateIdx]).trim()
          : null;
      const certificateNo =
        reportNoIdx !== null && row[reportNoIdx]
          ? String(row[reportNoIdx]).trim()
          : null;
      const cut =
        cutIdx !== null && row[cutIdx] ? String(row[cutIdx]).trim() : null;

      // Build measurement string from length, width, depth
      let measurement: string | null = null;
      const length =
        measurementLengthIdx !== null && row[measurementLengthIdx]
          ? String(row[measurementLengthIdx]).trim()
          : null;
      const width =
        measurementWidthIdx !== null && row[measurementWidthIdx]
          ? String(row[measurementWidthIdx]).trim()
          : null;
      const measurementDepth =
        measurementDepthIdx !== null && row[measurementDepthIdx]
          ? String(row[measurementDepthIdx]).trim()
          : null;

      if (length || width || measurementDepth) {
        const parts: string[] = [];
        if (length) parts.push(`L:${length}`);
        if (width) parts.push(`W:${width}`);
        if (measurementDepth) parts.push(`D:${measurementDepth}`);
        measurement = parts.join(" × ");
      }

      // Extract new fields
      const ratioValue =
        ratioIdx !== null && row[ratioIdx]
          ? parseFloat(String(row[ratioIdx]))
          : null;
      const tableValue =
        tableIdx !== null && row[tableIdx]
          ? parseFloat(String(row[tableIdx]))
          : null;
      const depthValue =
        depthIdx !== null && row[depthIdx]
          ? parseFloat(String(row[depthIdx]))
          : null;
      const growthType =
        growthTypeIdx !== null && row[growthTypeIdx]
          ? String(row[growthTypeIdx]).trim()
          : null;
      const flourence =
        flourenceIdx !== null && row[flourenceIdx]
          ? String(row[flourenceIdx]).trim()
          : null;
      const greenPricePerCarat =
        greenPricePerCaratIdx !== null && row[greenPricePerCaratIdx] !== null && row[greenPricePerCaratIdx] !== undefined && String(row[greenPricePerCaratIdx]).trim() !== ""
          ? parseFloat(String(row[greenPricePerCaratIdx]))
          : null;
      const greenPrice =
        greenPriceIdx !== null && row[greenPriceIdx] !== null && row[greenPriceIdx] !== undefined && String(row[greenPriceIdx]).trim() !== ""
          ? parseFloat(String(row[greenPriceIdx]))
          : null;
      const redPricePerCarat =
        redPricePerCaratIdx !== null && row[redPricePerCaratIdx] !== null && row[redPricePerCaratIdx] !== undefined && String(row[redPricePerCaratIdx]).trim() !== ""
          ? parseFloat(String(row[redPricePerCaratIdx]))
          : null;
      const redPrice =
        redPriceIdx !== null && row[redPriceIdx] !== null && row[redPriceIdx] !== undefined && String(row[redPriceIdx]).trim() !== ""
          ? parseFloat(String(row[redPriceIdx]))
          : null;
      
      if (greenPricePerCarat === null || isNaN(greenPricePerCarat)) {
        errors.push({
          row: rowNumber,
          stockId,
          field: "Green Price P/Ct",
          message: "Green price per carat is required",
        });
        continue;
      }

      if (redPricePerCarat === null || isNaN(redPricePerCarat)) {
        errors.push({
          row: rowNumber,
          stockId,
          field: "Red Price P/Ct",
          message: "Red price per carat is required",
        });
        continue;
      }

      if (greenPricePerCarat > pricePerCarat) {
        errors.push({
          row: rowNumber,
          stockId,
          field: "Green Price P/Ct",
          message: "Green price per carat cannot be greater than asking price per carat",
        });
        continue;
      }

      if (redPricePerCarat > greenPricePerCarat) {
        errors.push({
          row: rowNumber,
          stockId,
          field: "Red Price P/Ct",
          message: "Red price per carat cannot be greater than green price per carat",
        });
        continue;
      }

      // Calculate greenPrice from greenPricePerCarat if greenPrice not provided
      const finalGreenPrice = greenPrice !== null && !isNaN(greenPrice)
        ? greenPrice
        : (greenPricePerCarat !== null && !isNaN(greenPricePerCarat) && carat > 0)
          ? greenPricePerCarat * carat
          : null;
      
      // Calculate redPrice from redPricePerCarat if redPrice not provided
      const finalRedPrice = redPrice !== null && !isNaN(redPrice)
        ? redPrice
        : (redPricePerCarat !== null && !isNaN(redPricePerCarat) && carat > 0)
          ? redPricePerCarat * carat
          : null;

      // Prepare data for create/update
      const itemData: Prisma.InventoryItemCreateInput | Prisma.InventoryItemUpdateInput = {
        stockId,
        shape,
        size: carat,
        color,
        clarity,
        polish: polish || null,
        sym: sym || null,
        lab: lab || null,
        pricePerCarat: pricePerCarat || null,
        finalAmount: finalAmount || 0,
        status: status as DiamondStatus,
        location: location || null,
        certificateNo: certificateNo || null,
        cut: cut || null,
        videoUrl: videoUrl || null,
        imageUrl: imageUrl || null,
        certUrl: certUrl || null,
        measurement: measurement || null,
        ratio: ratioValue !== null && !isNaN(ratioValue) ? ratioValue : null,
        table: tableValue !== null && !isNaN(tableValue) ? tableValue : null,
        depth: depthValue !== null && !isNaN(depthValue) ? depthValue : null,
        growthType: growthType || null,
        flourence: flourence || null,
        greenPricePerCarat: greenPricePerCarat !== null && !isNaN(greenPricePerCarat) ? greenPricePerCarat : null,
        greenPrice: finalGreenPrice !== null && !isNaN(finalGreenPrice) ? finalGreenPrice : null,
        redPricePerCarat: redPricePerCarat !== null && !isNaN(redPricePerCarat) ? redPricePerCarat : null,
        redPrice: finalRedPrice !== null && !isNaN(finalRedPrice) ? finalRedPrice : null,
      };

      // Add shipment relationship if status requires it and shipment is found
      if (
        (status === "HOLD" || status === "MEMO" || status === "SOLD") &&
        heldByShipmentId
      ) {
        if (isUpdate) {
          (itemData as Prisma.InventoryItemUpdateInput).heldByShipment = {
            connect: { id: heldByShipmentId },
          };
        } else {
          (itemData as Prisma.InventoryItemCreateInput).heldByShipment = {
            connect: { id: heldByShipmentId },
          };
        }
      } else if (isUpdate) {
        // Disconnect shipment if status changed and no shipment provided
        (itemData as Prisma.InventoryItemUpdateInput).heldByShipment = {
          disconnect: true,
        };
      }

      // Create or update inventory item using upsert
      try {
        // First check for exact stockId match
        const exactMatch = await prisma.inventoryItem.findUnique({
          where: { stockId },
        });
        
        if (exactMatch) {
          // Update exact match - don't update stockId as it's the same
          const updateData = { ...itemData } as Prisma.InventoryItemUpdateInput;
          delete (updateData as any).stockId; // Don't update stockId field
          await prisma.inventoryItem.update({
            where: { id: exactMatch.id },
            data: updateData,
          });
          updateCount++;
          successCount++;
        } else if (isUpdate && existingItem) {
          // Update by normalized Stock ID (handles similar IDs like CDS-001 vs CDS-01)
          // Keep the existing Stock ID in database, but update all other fields
          const updateData = { ...itemData } as Prisma.InventoryItemUpdateInput;
          // Option 1: Keep original Stock ID (recommended to avoid unique constraint issues)
          // Option 2: Update Stock ID if the uploaded one is different (might fail if new ID exists)
          // We'll keep the original Stock ID to be safe
          delete (updateData as any).stockId; // Don't change the Stock ID in database
          await prisma.inventoryItem.update({
            where: { id: existingItem.id },
            data: updateData,
          });
          updateCount++;
          successCount++;
        } else {
          // Create new item - but first check if exact Stock ID already exists (race condition)
          try {
            await prisma.inventoryItem.create({
              data: itemData as Prisma.InventoryItemCreateInput,
            });
            successCount++;
          } catch (createError: any) {
            // If unique constraint violation, try to update instead
            if (createError.code === 'P2002' && createError.meta?.target?.includes('stockId')) {
              const existing = await prisma.inventoryItem.findUnique({
                where: { stockId },
              });
              if (existing) {
                const updateData = { ...itemData } as Prisma.InventoryItemUpdateInput;
                delete (updateData as any).stockId;
                await prisma.inventoryItem.update({
                  where: { id: existing.id },
                  data: updateData,
                });
                updateCount++;
                successCount++;
              } else {
                throw createError; // Re-throw if we can't handle it
              }
            } else {
              throw createError; // Re-throw other errors
            }
          }
        }
      } catch (dbError) {
        console.error(`Error ${isUpdate ? 'updating' : 'creating'} item for Stock ID ${stockId}:`, dbError);
        errors.push({
          row: rowNumber,
          stockId,
          field: "Database",
          message:
            dbError instanceof Error
              ? dbError.message
              : `Failed to ${isUpdate ? 'update' : 'create'} inventory item`,
        });
      }
    }

    const totalRows = dataRows.length;
    const errorCount = errors.length;
    const duplicateCount = duplicateStockIds.size;

    return NextResponse.json({
      success: successCount > 0,
      totalRows,
      successCount,
      errorCount,
      duplicateCount,
      errors,
      updateCount,
      message:
        successCount > 0
          ? `Successfully processed ${successCount} item(s) (${successCount - updateCount} created, ${updateCount} updated). ${errorCount} error(s), ${duplicateCount} duplicate(s) handled.`
          : `Upload failed. ${errorCount} error(s), ${duplicateCount} duplicate(s).`,
    });
  } catch (error) {
    console.error("Excel upload error:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred during upload",
        totalRows: 0,
        successCount: 0,
        errorCount: 0,
        duplicateCount: 0,
        errors: [],
      },
      { status: 500 }
    );
  }
}

