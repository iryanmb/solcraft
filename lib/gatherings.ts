// Facts the app works out from the data instead of storing them ("derive, don't duplicate").

import { isGuess, isUnknown, XXX } from "./placeholders.ts";

// "184 S Candler St, Decatur, GA 30030" -> "Decatur". Unknown address -> "xxx".
export function cityOf(address: string): string {
  if (isUnknown(address)) return XXX;
  const match = address.match(/,\s*([^,]+),\s*GA\b/);
  return match ? match[1].trim() : XXX;
}

// Under $20 (CLAUDE.md): the lowest general-public price is under $20; free and donation-based
// count. Unknown (xxx) and guessed prices return null and are left out of the filter.
// The general-public price is the part before the first ";" ("$30; members $10" -> $30).
export function isUnderTwenty(cost: string): boolean | null {
  if (isUnknown(cost) || isGuess(cost)) return null;
  const general = cost.split(";")[0];
  const prices = [...general.matchAll(/\$(\d+(?:\.\d+)?)/g)].map((match) => Number(match[1]));
  if (prices.length > 0) return Math.min(...prices) < 20;
  if (/\b(free|no cover|donation)/i.test(general)) return true;
  return null;
}
