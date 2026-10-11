const types = { PLACE:'places', RESTAURANT:'restaurants', ACTIVITY:'activities', EVENT:'events' };
export function normalizeCollectionPoi(row) {
  return { ...row, name: row.name || row.poiName,
    type: types[row.poiType?.trim()] || 'pois',
    ...(typeof row.cuisines === 'string' ? { cuisines:row.cuisines.split(', ').filter(Boolean) } : {}),
    ...(typeof row.famousDishes === 'string' ? { famousDishes:row.famousDishes.split(', ').filter(Boolean) } : {}),
  };
}
export function collectionPrice(poi, money) {
  if (poi.priceStatus === 'UNKNOWN') return 'Price not listed';
  if (poi.priceStatus === 'FREE') return 'Free';
  if (poi.price !== undefined) return money(poi.price);
  return null;
}
