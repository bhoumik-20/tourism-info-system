import { useState } from "react";
import { api } from "../services/api";
import { useApp } from "../context/AppContext";
import { Modal, ErrorMessage } from "./UI";

export default function PlanForm({
  kind = "trips",
  item,
  tripNo,
  onClose,
  onSaved,
}) {
  const { userId, data, act } = useApp();
  const nameKey = kind === "trips" ? "tripName" : "itineraryName";
  const numberKey = kind === "trips" ? "tripNo" : "itineraryNo";
  const label = kind === "trips" ? "trip" : "itinerary";
  const [form, setForm] = useState({
    [nameKey]: item?.[nameKey] || "",
    description: item?.description || "",
    startDate: item?.startDate || "",
    endDate: item?.endDate || "",
    status: item?.status || "Planned",
    tripNo: item?.tripNo || tripNo || data.trips[0]?.tripNo || "",
  });
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const field = (name) => ({
    value: form[name],
    onChange: (e) => setForm({ ...form, [name]: e.target.value }),
  });
  async function submit(e) {
    e.preventDefault();
    setPending(true);
    setError("");
    try {
      const result = await act(
        () => api.writePlan(kind, userId, item?.[numberKey], form),
        `${label === "trip" ? "Trip" : "Itinerary"} ${item ? "updated" : "created"}`,
      );
      onSaved?.(result);
      onClose();
    } catch (e) {
      setError(e.message);
    } finally {
      setPending(false);
    }
  }
  return (
    <Modal
      title={`${item ? "Edit" : "Create"} ${label}`}
      onClose={() => !pending && onClose()}
    >
      <form className="form-stack" onSubmit={submit}>
        <p className="muted">
          A little planning makes room for more discoveries.
        </p>
        <label>
          {label === "trip" ? "Trip" : "Itinerary"} name
          <input
            required
            autoFocus
            maxLength={150}
            placeholder={
              kind === "trips" ? "A weekend in Bengaluru" : "A day of discovery"
            }
            {...field(nameKey)}
          />
        </label>
        {kind === "itineraries" && (
          <label>
            Trip
            <select required {...field("tripNo")}>
              <option value="">Choose a trip</option>
              {data.trips.map((t) => (
                <option value={t.tripNo} key={t.tripNo}>
                  {t.tripName}
                </option>
              ))}
            </select>
          </label>
        )}
        <div className="form-row">
          <label>
            Start date
            <input
              required={kind === "itineraries"}
              type="date"
              {...field("startDate")}
              onInput={field("startDate").onChange}
            />
          </label>
          <label>
            End date
            <input
              required={kind === "itineraries"}
              type="date"
              min={form.startDate || undefined}
              {...field("endDate")}
              onInput={field("endDate").onChange}
            />
          </label>
        </div>
        <label>
          Description
          <textarea
            rows={3}
            maxLength={1000}
            placeholder="What are you looking forward to?"
            {...field("description")}
          />
        </label>
        {kind === "trips" && (
          <label>
            Status
            <select {...field("status")}>
              {[
                ...new Set([
                  "Planned",
                  "Ongoing",
                  "Completed",
                  "Cancelled",
                  form.status,
                ]),
              ].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
        )}
        {kind === 'trips' && form.status.trim().toUpperCase() === 'COMPLETED' && item?.status?.trim().toUpperCase() !== 'COMPLETED' && <p className="error-message">Completing a trip makes it, its itineraries and POI memberships read-only.</p>}
        <ErrorMessage>{error}</ErrorMessage>
        <div className="modal-actions">
          <button
            className="button secondary"
            type="button"
            disabled={pending}
            onClick={onClose}
          >
            Cancel
          </button>
          <button className="button primary" disabled={pending}>
            {pending ? "Saving…" : item ? "Save changes" : `Create ${label}`}
          </button>
        </div>
      </form>
    </Modal>
  );
}
