export const typeLabels = {
  places: "Place",
  restaurants: "Restaurant",
  activities: "Activity",
  events: "Event",
};
export function filterPois(records, filters = {}) {
  const search = (filters.search || "").trim().toLowerCase();
  return records
    .filter((p) => {
      if (
        search &&
        !`${p.name} ${p.description || ""}`.toLowerCase().includes(search)
      )
        return false;
      if (filters.city && p.cityId !== Number(filters.city)) return false;
      if (filters.type && p.type !== filters.type) return false;
      if (
        filters.minRating &&
        (p.averageRating === null ||
          p.averageRating < Number(filters.minRating))
      )
        return false;
      for (const [key, field] of [
        ["category", "categories"],
        ["cuisine", "cuisines"],
        ["season", "seasons"],
      ]) {
        if (
          filters[key] &&
          !p[field]?.some(
            (value) => value.toLowerCase() === filters[key].toLowerCase(),
          )
        )
          return false;
      }
      for (const [key, field] of [
        ["priceRange", "priceRange"],
        ["activityType", "activityType"],
        ["difficulty", "difficultyLevel"],
        ["eventType", "eventType"],
      ]) {
        if (
          filters[key] &&
          p[field]?.toLowerCase() !== filters[key].toLowerCase()
        )
          return false;
      }
      if (filters.delivery && p.deliveryAvailable !== filters.delivery)
        return false;
      if (filters.parking && p.parkingAvailable !== filters.parking)
        return false;
      if (
        filters.maxCost !== undefined &&
        filters.maxCost !== "" &&
        (p.cost === null || p.cost > Number(filters.maxCost))
      )
        return false;
      if (filters.from && (!p.endDate || p.endDate < filters.from))
        return false;
      if (filters.to && (!p.startDate || p.startDate > filters.to))
        return false;
      return true;
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}
export function planBody(form, kind) {
  const nameKey = kind === "trips" ? "tripName" : "itineraryName";
  const name = form[nameKey]?.trim();
  if (!name) throw new Error("Please enter a name.");
  if (new TextEncoder().encode(name).length > 150)
    throw new Error("The name must fit within 150 UTF-8 bytes.");
  if (new TextEncoder().encode(form.description || "").length > 1000)
    throw new Error("The description is too long.");
  for (const date of [form.startDate, form.endDate]) {
    if (
      date &&
      (!/^\d{4}-\d{2}-\d{2}$/.test(date) ||
        date.startsWith("0000") ||
        Number.isNaN(Date.parse(date)) ||
        new Date(`${date}T00:00:00Z`).toISOString().slice(0, 10) !== date)
    )
      throw new Error("Please enter valid dates.");
  }
  if (form.startDate && form.endDate && form.endDate < form.startDate)
    throw new Error("The end date must be on or after the start date.");
  return {
    [nameKey]: name,
    startDate: form.startDate || null,
    endDate: form.endDate || null,
    description: form.description?.trim() || null,
    ...(kind === "trips"
      ? { status: form.status || "Planned" }
      : { tripNo: Number(form.tripNo) }),
  };
}
