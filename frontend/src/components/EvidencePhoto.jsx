import { useEffect, useRef, useState } from "react";
import { api } from "../services/api";

export default function EvidencePhoto({
  report,
  clickable = false,
}) {
  const [requestState, setRequestState] = useState({
    key: "",
    photos: [],
    error: "",
  });

  const [selectedPhoto, setSelectedPhoto] =
    useState(null);

  const closeButtonRef = useRef(null);
  const triggerButtonRef = useRef(null);

  const requestKey =
    report?.id && report.evidence
      ? `${report.id}:${report.evidence}`
      : "";

  useEffect(() => {
    if (!requestKey) {
      return undefined;
    }

    let active = true;

    api
      .get(
        `/reports/${encodeURIComponent(
          report.id
        )}/photos`
      )
      .then((photos) => {
        if (active) {
          setRequestState({
            key: requestKey,
            photos: photos.filter(
              (item) => item.dataUrl
            ),
            error: "",
          });
        }
      })
      .catch((requestError) => {
        if (active) {
          setRequestState({
            key: requestKey,
            photos: [],
            error:
              requestError.message ||
              "Unable to load evidence photos.",
          });
        }
      });

    return () => {
      active = false;
    };
  }, [report?.id, report?.evidence, requestKey]);

  useEffect(() => {
    if (!selectedPhoto) {
      return undefined;
    }

    closeButtonRef.current?.focus();

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setSelectedPhoto(null);
      }
    }

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );

      triggerButtonRef.current?.focus();
    };
  }, [selectedPhoto]);

  function openPhoto(photo, event) {
    triggerButtonRef.current =
      event.currentTarget;

    setSelectedPhoto(photo);
  }

  function closePhoto() {
    setSelectedPhoto(null);
  }

  const currentState =
    requestState.key === requestKey
      ? requestState
      : {
          photos: [],
          error: "",
          loading: Boolean(requestKey),
        };

  if (currentState.loading) {
    return (
      <p role="status" aria-live="polite">
        Loading evidence photo...
      </p>
    );
  }

  if (currentState.error) {
    return (
      <p role="alert">
        Unable to load evidence photo:{" "}
        {currentState.error}
      </p>
    );
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
    <div
      className="evidence-gallery"
      aria-label="Report evidence photos"
    >
      {currentState.photos.map(
        (photo, index) => (
          <figure
            className="evidence-image"
            key={`${photo.filename}-${index}`}
          >
            {clickable ? (
              <button
                className="evidence-expand"
                type="button"
                onClick={(event) =>
                  openPhoto(photo, event)
                }
                aria-label={`View ${photo.filename} full size`}
              >
                <img
                  src={photo.dataUrl}
                  alt={`Evidence ${index + 1} for report ${
                    report.id
                  }`}
                />

                <span>
                  Click to enlarge
                </span>
              </button>
            ) : (
              <img
                src={photo.dataUrl}
                alt={`Evidence ${index + 1} for report ${
                  report.id
                }`}
              />
            )}

            <figcaption>
              {photo.filename}
            </figcaption>
          </figure>
        )
      )}

      {selectedPhoto && (
        <div className="evidence-lightbox">
          <button
            className="evidence-lightbox-backdrop"
            type="button"
            onClick={closePhoto}
            aria-label="Close enlarged photo"
          />

          <section
            className="evidence-lightbox-content"
            role="dialog"
            aria-modal="true"
            aria-labelledby="evidence-lightbox-title"
          >
            <button
              ref={closeButtonRef}
              className="evidence-lightbox-close"
              type="button"
              onClick={closePhoto}
              aria-label="Close enlarged photo"
            >
              ×
            </button>

            <img
              src={selectedPhoto.dataUrl}
              alt={`Full-size evidence for report ${report.id}`}
            />

            <p id="evidence-lightbox-title">
              {selectedPhoto.filename}
            </p>
          </section>
        </div>
      )}
    </div>
  );
}