/**
 * Utility for parsing Indian and global real estate price strings into numeric min & max values (in INR).
 * 
 * Handles formats like:
 * - "₹ 1.5 Cr - ₹ 3.5 Cr" -> { min: 15000000, max: 35000000 }
 * - "₹ 1.5 Cr" -> { min: 15000000, max: 15000000 }
 * - "₹ 85 Lakh" / "₹ 85 Lac" -> { min: 8500000, max: 8500000 }
 * - "85 L - 1.2 Cr" -> { min: 8500000, max: 12000000 }
 * - "1.5 - 3.5 Cr" -> { min: 15000000, max: 35000000 }
 * - "₹ 45,000 / mo" -> { min: 45000, max: 45000 }
 * - "₹ 2.45 Cr*" -> { min: 24500000, max: 24500000 }
 * - "25000000" or "2,50,00,000" -> { min: 25000000, max: 25000000 }
 */

export function parsePriceToNumber(str: string, fallbackMultiplier = 1): number {
  if (!str) return 0;
  const clean = str.trim().toLowerCase();

  // Check for Crore (Cr, Crore, Crores)
  if (/\bcr(ore(s)?)?\b/i.test(clean) || clean.includes('cr')) {
    const match = clean.match(/([\d,.]+)\s*cr/i);
    const num = match ? parseFloat(match[1].replace(/,/g, '')) : parseFloat(clean.replace(/[^0-9.]/g, ''));
    return isNaN(num) ? 0 : Math.round(num * 10000000);
  }

  // Check for Lakh (Lakh, Lac, Lacs, L)
  if (/\b(lac(s)?|lakh(s)?)\b/i.test(clean) || (/\bl\b/i.test(clean) && !clean.includes('lease'))) {
    const match = clean.match(/([\d,.]+)\s*(?:lac|lakh|l)/i);
    const num = match ? parseFloat(match[1].replace(/,/g, '')) : parseFloat(clean.replace(/[^0-9.]/g, ''));
    return isNaN(num) ? 0 : Math.round(num * 100000);
  }

  // Check for Thousand (k)
  if (/\bk\b/i.test(clean)) {
    const match = clean.match(/([\d,.]+)\s*k/i);
    const num = match ? parseFloat(match[1].replace(/,/g, '')) : parseFloat(clean.replace(/[^0-9.]/g, ''));
    return isNaN(num) ? 0 : Math.round(num * 1000);
  }

  // Raw numeric string (e.g. 25000000, 45,000 / mo)
  const numOnly = parseFloat(clean.replace(/[^0-9.]/g, ''));
  if (isNaN(numOnly)) return 0;

  // If a unit multiplier was passed from the second token of a range (e.g. "1.5 - 3.5 Cr")
  if (fallbackMultiplier > 1 && numOnly < 1000) {
    return Math.round(numOnly * fallbackMultiplier);
  }

  return Math.round(numOnly);
}

export function parsePriceRange(displayStr: string): { min: number; max: number } {
  if (!displayStr || !displayStr.trim()) {
    return { min: 0, max: 0 };
  }

  // Split by range separators: " - ", " to ", "–", "—"
  const parts = displayStr.split(/\s*[-–—]\s*|\s+to\s+/i).map((s) => s.trim()).filter(Boolean);

  if (parts.length >= 2) {
    // Detect if part 2 has a unit that part 1 omitted (e.g., "1.5 - 3.5 Cr")
    let unitMultiplier = 1;
    if (/\bcr(ore(s)?)?\b/i.test(parts[1]) || parts[1].toLowerCase().includes('cr')) {
      unitMultiplier = 10000000;
    } else if (/\b(lac(s)?|lakh(s)?|l)\b/i.test(parts[1])) {
      unitMultiplier = 100000;
    }

    const val1 = parsePriceToNumber(parts[0], unitMultiplier);
    const val2 = parsePriceToNumber(parts[1]);

    const min = Math.min(val1, val2);
    const max = Math.max(val1, val2);

    return {
      min: min > 0 ? min : max,
      max: max > 0 ? max : min,
    };
  }

  if (parts.length === 1) {
    const val = parsePriceToNumber(parts[0]);
    return { min: val, max: val };
  }

  return { min: 0, max: 0 };
}
