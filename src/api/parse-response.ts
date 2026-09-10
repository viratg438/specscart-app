function asRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

export function unwrapProductList(data: unknown): unknown[] {
  if (Array.isArray(data)) {
    return data;
  }

  const record = asRecord(data);
  if (!record) {
    return [];
  }

  if (Array.isArray(record.products)) {
    return record.products;
  }
  if (Array.isArray(record.data)) {
    return record.data;
  }
  return [];
}

export function unwrapProduct(data: unknown): unknown | null {
  if (!data) {
    return null;
  }
  if (Array.isArray(data)) {
    return data[0] ?? null;
  }

  const record = asRecord(data);
  if (!record) {
    return null;
  }

  if (record.product) {
    return record.product;
  }
  if (record.data && !Array.isArray(record.data)) {
    return record.data;
  }
  return record;
}
