type Listing = {
  lat?: number;
  lng?: number;
  quantity?: string;
  createdAt?: number;
};

export function getDemandZones(listings: Listing[]) {
  const zones: Record<
    string,
    { lat: number; lng: number; totalQty: number; count: number; score: number }
  > = {};

  for (const l of listings) {
    if (!l.lat || !l.lng) continue;

    const qty = Number(l.quantity || 0);
    const ageHours = l.createdAt
      ? (Date.now() - l.createdAt) / (1000 * 60 * 60)
      : 0;

    // Fresh listings contribute more
    const freshnessWeight = ageHours < 6 ? 1.5 : ageHours < 24 ? 1.2 : 1.0;

    // Grid bucket (0.05 degrees ≈ 5km-ish)
    const key = makeZoneKey(l.lat, l.lng);

    if (!zones[key]) {
      zones[key] = {
        lat: roundTo(l.lat, 2),
        lng: roundTo(l.lng, 2),
        totalQty: 0,
        count: 0,
        score: 0,
      };
    }

    zones[key].totalQty += qty;
    zones[key].count += 1;
    zones[key].score += qty * freshnessWeight;
  }

  // Convert to array + sort by score
  return Object.values(zones).sort((a, b) => b.score - a.score);
}

function makeZoneKey(lat: number, lng: number) {
  const latBucket = Math.floor(lat / 0.05) * 0.05;
  const lngBucket = Math.floor(lng / 0.05) * 0.05;
  return `${latBucket.toFixed(2)},${lngBucket.toFixed(2)}`;
}

function roundTo(value: number, decimals: number) {
  const p = Math.pow(10, decimals);
  return Math.round(value * p) / p;
}
