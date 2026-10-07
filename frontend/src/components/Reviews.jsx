import { useState } from "react";
import { Pencil, Trash2, Plus } from "lucide-react";
import { api } from "../services/api";
import { useApp } from "../context/AppContext";
import { useAsync } from "../hooks/useAsync";
import { Rating, Modal, ErrorMessage, Loading, dateLabel } from "./UI";
import DeleteDialog from "./DeleteDialog";

function ReviewForm({ poi, item, onClose }) {
  const { userId, act } = useApp();
  const [rating, setRating] = useState(item?.rating || 5),
    [comments, setComments] = useState(item?.comments || "");
  const [pending, setPending] = useState(false),
    [error, setError] = useState("");
  async function submit(e) {
    e.preventDefault();
    setPending(true);
    setError("");
    try {
      await act(
        () =>
          api.writeReview(userId, poi.poiId, item?.reviewId, {
            rating,
            comments,
          }),
        item ? "Review updated" : "Thanks for sharing your experience",
      );
      onClose();
    } catch (e) {
      setError(e.message);
    } finally {
      setPending(false);
    }
  }
  return (
    <Modal
      title={item ? "Edit your review" : "Share your experience"}
      onClose={() => !pending && onClose()}
    >
      <form className="form-stack" onSubmit={submit}>
        <p className="muted">Tell fellow travelers about {poi.name}.</p>
        <label>
          Your rating
          <input
            type="number"
            min="1"
            max="5"
            step="0.1"
            required
            value={rating}
            onChange={(e) => setRating(e.target.value)}
          />
        </label>
        <label>
          Your review
          <textarea
            rows={4}
            maxLength={1000}
            placeholder="What made your visit memorable?"
            value={comments}
            onChange={(e) => setComments(e.target.value)}
          />
        </label>
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
            {pending ? "Saving…" : item ? "Save changes" : "Post review"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
export default function Reviews({ poi }) {
  const { userId, revision, act } = useApp();
  const result = useAsync(
    () => api.getReviews(poi.poiId),
    [poi.poiId, revision],
  );
  const [edit, setEdit] = useState(null),
    [remove, setRemove] = useState(null);
  return (
    <section className="reviews-section" id="reviews">
      <div className="section-heading">
        <div>
          <p className="eyebrow">FROM FELLOW TRAVELERS</p>
          <h2>Little stories from real visits</h2>
          <Rating value={poi.averageRating} count={poi.reviewCount} />
        </div>
        <button className="button secondary" onClick={() => setEdit({})}>
          <Plus size={16} />
          Write a review
        </button>
      </div>
      {result.loading ? (
        <Loading />
      ) : result.error ? (
        <ErrorMessage>{result.error}</ErrorMessage>
      ) : result.data?.length ? (
        result.data.map((r) => (
          <article className="review-card" key={r.reviewId}>
            <div className="review-header">
              <span className="avatar">{r.firstName?.slice(0, 1) || "T"}</span>
              <div>
                <strong>
                  {r.firstName} {r.lastName}
                  {r.userId === userId && (
                    <span className="your-review">You</span>
                  )}
                </strong>
                <span>{dateLabel(r.reviewDate)}</span>
              </div>
              <Rating value={r.rating} />
            </div>
            {r.comments && <p>{r.comments}</p>}
            {r.lastUpdated && (
              <small className="muted">Edited {dateLabel(r.lastUpdated)}</small>
            )}
            {r.userId === userId && (
              <div className="review-actions">
                <button className="text-button" onClick={() => setEdit(r)}>
                  <Pencil size={14} />
                  Edit review
                </button>
                <button
                  className="text-button danger-text"
                  onClick={() => setRemove(r)}
                >
                  <Trash2 size={14} />
                  Delete review
                </button>
              </div>
            )}
          </article>
        ))
      ) : (
        <p className="muted">
          No reviews yet. Be the first to share your experience.
        </p>
      )}
      {edit && (
        <ReviewForm
          poi={poi}
          item={edit.reviewId ? edit : null}
          onClose={() => setEdit(null)}
        />
      )}
      {remove && (
        <DeleteDialog
          title="Delete your review?"
          text="Your rating and comments will be removed from this place."
          onClose={() => setRemove(null)}
          onDelete={() =>
            act(
              () => api.deleteReview(remove.reviewId, userId),
              "Review deleted",
            )
          }
        />
      )}
    </section>
  );
}
