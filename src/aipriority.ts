// src/aiPriority.ts

// src/aiPriority.ts

export type Listing = {
  id: string;
  quantity: string;
  cropType: string;
  location: string;
  status: "pending" | "accepted" | "rejected";
};

/**
 * AI scoring logic
 * Higher score = higher priority
 */
export function calculatePriority(listing: Listing): number {
  let score = 0;

  // ✅ Safe quantity parsing
  const qty = parseInt(listing.quantity || "0");
  if (qty >= 100) score += 50;
  else if (qty >= 50) score += 30;
  else score += 10;

  // ✅ Safe cropType check (prevents toLowerCase error)
  const crop = (listing.cropType || "").toLowerCase();
  if (crop === "rice" || crop === "paddy") score += 20;
  if (crop === "wheat") score += 15;

  // ✅ Safe status check
  const status = listing.status || "pending";
  if (status === "pending") score += 40;

  return score;
}


/**
 * Sort listings using AI
 */
export function sortListingsByAI(listings: any[]) {
  if (!Array.isArray(listings)) return [];
  return [...listings].sort(
    (a, b) => calculatePriority(b) - calculatePriority(a)
  );
}
// src/aipriority.ts

export function computePriorityScore(listing: any, collector: any) {
  const now = Date.now();

  const quantity = Number(listing.quantity || 0);
  const urgency = Number(listing.urgencyLevel || 1);
  const createdAt = Number(listing.createdAt || now);

  const ageHours = (now - createdAt) / (1000 * 60 * 60);

  const distanceKm = listing.distanceKm ?? 10;

  // Score between 0 and 1
  const score =
    0.35 * normalize(quantity, 0, 50) +
    0.30 * normalize(urgency, 1, 5) +
    0.20 * normalize(ageHours, 0, 48) +
    0.15 * (1 - normalize(distanceKm, 0, 25));

  return clamp(score, 0, 1);
}

function normalize(x: number, min: number, max: number) {
  if (max === min) return 0;
  return (x - min) / (max - min);
}

function clamp(x: number, a: number, b: number) {
  return Math.max(a, Math.min(b, x));
}

