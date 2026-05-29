export interface TierInventoryItem {
  stockId: string;
  pricePerCarat: number | null;
  greenPricePerCarat: number | null;
  redPricePerCarat: number | null;
}

export interface DocumentItemWithPricing {
  stockId?: string | null;
  pricePerCarat: number;
  enteredPricePerCarat?: number | null;
  carat?: number;
  total?: number;
  [key: string]: unknown;
}

export function isLotBStockId(stockId?: string | null): boolean {
  return Boolean(stockId?.startsWith("LOT-B-"));
}

export function isInventoryStockId(stockId?: string | null): boolean {
  return Boolean(stockId?.trim() && !isLotBStockId(stockId));
}

export function getEnteredPrice(item: DocumentItemWithPricing): number {
  return Number(item.enteredPricePerCarat ?? item.pricePerCarat);
}

export function validateInventoryTierPricing(
  items: DocumentItemWithPricing[],
  inventoryByStockId: Map<string, TierInventoryItem>,
  userRole: string
): { ok: true } | { ok: false; error: string; status: number } {
  for (const item of items) {
    if (!isInventoryStockId(item.stockId)) continue;

    const inventoryItem = inventoryByStockId.get(item.stockId!.trim());
    if (!inventoryItem) continue;

    const asking = inventoryItem.pricePerCarat;
    const green = inventoryItem.greenPricePerCarat;
    const red = inventoryItem.redPricePerCarat;
    const entered = getEnteredPrice(item);

    if (asking == null || green == null || red == null) {
      return {
        ok: false,
        error: `Pricing tiers missing for stock ID ${item.stockId}. Please update inventory tiers first.`,
        status: 400,
      };
    }

    if (green > asking || red > green) {
      return {
        ok: false,
        error: `Invalid tier order for stock ID ${item.stockId}. Expected Asking >= Green >= Red.`,
        status: 400,
      };
    }

    if (entered > asking) {
      return {
        ok: false,
        error: `Price for stock ID ${item.stockId} cannot be higher than Asking price.`,
        status: 400,
      };
    }

    if (entered < red && userRole !== "admin") {
      return {
        ok: false,
        error: `Price for stock ID ${item.stockId} is below Red floor and requires Admin.`,
        status: 403,
      };
    }
  }

  return { ok: true };
}

/** Replace line-item prices with asking price for inventory stones before persisting or previewing documents. */
export function normalizeItemsToAskingPrices<T extends DocumentItemWithPricing>(
  items: T[],
  inventoryByStockId: Map<string, TierInventoryItem>
): T[] {
  return items.map((item) => {
    if (!isInventoryStockId(item.stockId)) {
      return item;
    }

    const inventoryItem = inventoryByStockId.get(item.stockId!.trim());
    if (!inventoryItem?.pricePerCarat) {
      return item;
    }

    const asking = Number(inventoryItem.pricePerCarat);
    const carat = Number(item.carat) || 0;

    return {
      ...item,
      pricePerCarat: asking,
      total: Number((carat * asking).toFixed(2)),
    };
  });
}

export async function fetchInventoryTierMap(
  stockIds: string[],
  findMany: (args: {
    where: { stockId: { in: string[] } };
    select: {
      stockId: true;
      pricePerCarat: true;
      greenPricePerCarat: true;
      redPricePerCarat: true;
    };
  }) => Promise<TierInventoryItem[]>
): Promise<Map<string, TierInventoryItem>> {
  if (stockIds.length === 0) {
    return new Map();
  }

  const inventoryItems = await findMany({
    where: { stockId: { in: stockIds } },
    select: {
      stockId: true,
      pricePerCarat: true,
      greenPricePerCarat: true,
      redPricePerCarat: true,
    },
  });

  return new Map(inventoryItems.map((item) => [item.stockId, item]));
}

export function collectInventoryStockIds(items: DocumentItemWithPricing[]): string[] {
  return Array.from(
    new Set(
      items
        .map((item) => item.stockId?.trim())
        .filter((id): id is string => Boolean(id) && isInventoryStockId(id))
    )
  );
}
