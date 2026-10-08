import { useEffect, useState } from "react";
import { api } from "../services/api";
import ModalDialog from "./ModalDialog";

export default function EvidencePhoto({ report, clickable = false }) {
  const [requestState, setRequestState] = useState({
    key: "",
    photos: [],
    error: "",
  });
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const requestKey = report?.id && report.evidence
    ? `${report.id}:${report.evidence}`
    : "";

  useEffect(() => {
    if (!requestKey) return undefined;

    let active = true;

    api.get(`/reports/${encodeURIComponent(report.id)}/photos`)
      .then((photos) => {
        if (active) {
          setRequestState({
            key: requestKey,
            photos: photos.filter((item) => item.dataUrl),
            error: "",
          });
        }
      })
      .catch((requestError) => {
        if (active) {
          setRequestState({
            key: requestKey,
            photos: [],
            error: requestError.message,
          });
        }
      });

    return () => {
      active = false;
    };
  }, [report?.id, report?.evidence, requestKey]);

  useEffect(() => {
    if (!selectedPhoto) return undefined;

    function handleKeyDown(event) {
      if (event.key === "Escape") setSelectedPhoto(null);
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedPhoto]);

  const currentState = requestState.key === requestKey
    ? requestState
    : { photos: [], error: "", loading: Boolean(requestKey) };

  if (currentState.loading) {
    return <p role="status">Loading evidence photo...</p>;
  }

  if (currentState.error) {
    return <p role="alert">Unable to load evidence photo: {currentState.error}</p>;
  }

  if (!currentState.photos.length) {
    return (
      <p>
        {report?.evidence
          ? `Uploaded file: ${report.evidence}. Image data is unavailable for this upload.`
          : "No evidence photo uploaded."}
      </p>
    );
  }

  return (
    <div className="evidence-gallery">
      {currentState.photos.map((photo, index) => (
        <figure className="evidence-image" key={`${photo.filename}-${index}`}>
          {clickable ? (
            <button
              className="evidence-expand"
              type="button"
              onClick={() => setSelectedPhoto(photo)}
              aria-label={`View ${photo.filename} full size`}
            >
              <img src={photo.dataUrl} alt={`Evidence ${index + 1} for report ${report.id}`} />
              <span>Click to enlarge</span>
            </button>
          ) : (
            <img src={photo.dataUrl} alt={`Evidence ${index + 1} for report ${report.id}`} />
          )}
          <figcaption>{photo.filename}</figcaption>
        </figure>
      ))}
      {selectedPhoto && (
        <ModalDialog
            className="evidence-lightbox-content"
            overlayClassName="evidence-lightbox"
            label={`Evidence photo: ${selectedPhoto.filename}`}
            onClose={() => setSelectedPhoto(null)}
          >
            <button
              className="evidence-lightbox-close"
              type="button"
              data-modal-autofocus
              onClick={() => setSelectedPhoto(null)}
              aria-label="Close enlarged photo"
            >
              ×
            </button>
            <img src={selectedPhoto.dataUrl} alt={`Full-size evidence for report ${report.id}`} />
            <p>{selectedPhoto.filename}</p>
        </ModalDialog>
      )}
    </div>
  );
}
