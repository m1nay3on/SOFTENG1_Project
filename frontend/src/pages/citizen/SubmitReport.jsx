import { useState } from "react";

const MAX_EVIDENCE_SIZE = 5 * 1024 * 1024;
const MAX_EVIDENCE_COUNT = 5;

export default function SubmitReport({
  setActive,
  user,
  onSubmit,
}) {
  const [form, setForm] = useState({
    category: "",
    description: "",
    location: "",
    evidence: [],
  });

  const [evidenceLoading, setEvidenceLoading] =
    useState(false);

  const [formError, setFormError] =
    useState("");

  function updateField(field, value) {
    setForm((previousForm) => ({
      ...previousForm,
      [field]: value,
    }));

    if (formError) {
      setFormError("");
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    setFormError("");

    if (evidenceLoading) {
      return;
    }

    if (
      !form.category ||
      !form.description.trim() ||
      !form.location.trim()
    ) {
      setFormError(
        "Please complete the category, description, and location before submitting."
      );
      return;
    }

    const report = {
      id: `PF-${String(Date.now()).slice(-4)}`,

      issue: form.category,

      category: form.category,

      location: form.location.trim(),

      date: new Date().toLocaleDateString(
        "en-US",
        {
          month: "long",
          day: "numeric",
          year: "numeric",
        }
      ),

      time: new Date().toLocaleTimeString(
        "en-US",
        {
          hour: "numeric",
          minute: "2-digit",
        }
      ),

      priority: "Medium",

      status: "New",

      description: form.description.trim(),

      reporter:
        `${user.firstName} ${user.lastName}`,

      reporterEmail: user.email,

      evidence: form.evidence,
    };

    onSubmit(report);
  }

  function handleEvidenceChange(event) {
    const files = Array.from(
      event.target.files || []
    );

    event.target.value = "";
    setFormError("");

    if (!files.length) {
      return;
    }

    if (
      form.evidence.length + files.length >
      MAX_EVIDENCE_COUNT
    ) {
      setFormError(
        `A report can include up to ${MAX_EVIDENCE_COUNT} photos.`
      );
      return;
    }

    const invalidType = files.find(
      (file) =>
        !["image/png", "image/jpeg"].includes(
          file.type
        )
    );

    if (invalidType) {
      setFormError(
        "Please choose PNG or JPEG images."
      );
      return;
    }

    const oversizedFile = files.find(
      (file) =>
        file.size > MAX_EVIDENCE_SIZE
    );

    if (oversizedFile) {
      setFormError(
        "Each photo must be 5 MB or smaller."
      );
      return;
    }

    setEvidenceLoading(true);

    Promise.all(
      files.map(
        (file) =>
          new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = () => {
              if (
                typeof reader.result !== "string"
              ) {
                reject(
                  new Error(
                    `Could not read ${file.name}.`
                  )
                );
                return;
              }

              resolve({
                filename: file.name,
                contentType: file.type,
                dataUrl: reader.result,
              });
            };

            reader.onerror = () =>
              reject(
                new Error(
                  `Could not read ${file.name}.`
                )
              );

            reader.readAsDataURL(file);
          })
      )
    )
      .then((evidence) => {
        setForm((previousForm) => ({
          ...previousForm,
          evidence: [
            ...previousForm.evidence,
            ...evidence,
          ],
        }));
      })
      .catch((error) => {
        setFormError(
          error.message ||
            "The selected photo could not be loaded."
        );
      })
      .finally(() => {
        setEvidenceLoading(false);
      });
  }

  function removeEvidence(indexToRemove) {
    setForm((previousForm) => ({
      ...previousForm,
      evidence:
        previousForm.evidence.filter(
          (_, index) =>
            index !== indexToRemove
        ),
    }));

    setFormError("");
  }

  return (
    <main className="main">
      <button
        type="button"
        className="back-btn"
        onClick={() =>
          setActive("Dashboard")
        }
      >
        ← Back to Dashboard
      </button>

      <p className="eyebrow">
        REPORT AN ISSUE
      </p>

      <h1>Submit Damage Report</h1>

      <p className="subtitle">
        Provide accurate details so the
        issue can be verified and
        assigned.
      </p>

      <section className="form-grid">
        <form
          className="panel form"
          onSubmit={handleSubmit}
        >
          <label htmlFor="reporter-name">
            Reporter Name
          </label>

          <input
            id="reporter-name"
            name="reporterName"
            className="readonly-input"
            value={`${user.firstName} ${user.lastName}`}
            disabled
            readOnly
          />

          <small>
            Automatically filled from
            your account.
          </small>

          <label htmlFor="report-category">
            Category
          </label>

          <select
            id="report-category"
            name="category"
            value={form.category}
            required
            onChange={(event) =>
              updateField(
                "category",
                event.target.value
              )
            }
          >
            <option value="">
              Select an issue type
            </option>

            <option value="Road Damage">
              Road Damage
            </option>

            <option value="Streetlight">
              Streetlight
            </option>

            <option value="Drainage">
              Drainage
            </option>

            <option value="Public Facility">
              Public Facility
            </option>
          </select>

          <label htmlFor="report-description">
            Description
          </label>

          <textarea
            id="report-description"
            name="description"
            placeholder="Describe the damage or issue..."
            value={form.description}
            required
            onChange={(event) =>
              updateField(
                "description",
                event.target.value
              )
            }
          />

          <label htmlFor="report-location">
            Exact Location
          </label>

          <input
            id="report-location"
            name="location"
            type="text"
            placeholder="Street / Barangay / Landmark"
            value={form.location}
            required
            onChange={(event) =>
              updateField(
                "location",
                event.target.value
              )
            }
          />

          <label
            htmlFor="report-evidence"
            className="evidence-upload-label"
          >
            Photo Evidence
          </label>

          <input
            id="report-evidence"
            name="evidence"
            className="evidence-file-input"
            type="file"
            accept="image/png,image/jpeg"
            multiple
            disabled={
              evidenceLoading ||
              form.evidence.length >=
                MAX_EVIDENCE_COUNT
            }
            onChange={handleEvidenceChange}
          />

          <small>
            Select up to{" "}
            {MAX_EVIDENCE_COUNT} PNG or JPEG
            photos. Each photo must be 5 MB
            or smaller (
            {form.evidence.length}/
            {MAX_EVIDENCE_COUNT} selected).
          </small>

          {formError && (
            <div
              className="login-error report-form-error"
              role="alert"
              aria-live="polite"
            >
              <span
                className="login-error-icon"
                aria-hidden="true"
              >
                ⚠
              </span>

              <span>{formError}</span>
            </div>
          )}

          {evidenceLoading && (
            <p
              className="form-status"
              role="status"
              aria-live="polite"
            >
              Loading selected photo...
            </p>
          )}

          {form.evidence.length > 0 && (
            <div
              className="evidence-gallery evidence-preview"
              aria-label="Selected photo evidence"
            >
              {form.evidence.map(
                (photo, index) => (
                  <figure
                    className="evidence-image"
                    key={`${photo.filename}-${index}`}
                  >
                    <img
                      src={photo.dataUrl}
                      alt={`Selected evidence ${index + 1}: ${photo.filename}`}
                    />

                    <figcaption>
                      <span>
                        {photo.filename}
                      </span>

                      <button
                        className="remove-evidence"
                        type="button"
                        onClick={() =>
                          removeEvidence(index)
                        }
                        disabled={
                          evidenceLoading
                        }
                        aria-label={`Remove ${photo.filename}`}
                      >
                        Remove
                      </button>
                    </figcaption>
                  </figure>
                )
              )}
            </div>
          )}

          <button
            className="gold"
            type="submit"
            disabled={evidenceLoading}
          >
            {evidenceLoading
              ? "Loading Photo..."
              : "Submit Report"}
          </button>
        </form>

        <aside
          className="panel information-panel"
          aria-labelledby="submission-process-heading"
        >
          <p className="eyebrow">
            HOW IT WORKS
          </p>

          <h2 id="submission-process-heading">
            Submission Process
          </h2>

          <div className="process-step">
            <span aria-hidden="true">
              01
            </span>

            <div>
              <strong>Submit</strong>

              <p>
                Send your infrastructure
                concern.
              </p>
            </div>
          </div>

          <div className="process-step">
            <span aria-hidden="true">
              02
            </span>

            <div>
              <strong>Verify</strong>

              <p>
                An inspector reviews
                your report.
              </p>
            </div>
          </div>

          <div className="process-step">
            <span aria-hidden="true">
              03
            </span>

            <div>
              <strong>Assign</strong>

              <p>
                The issue is assigned
                for action.
              </p>
            </div>
          </div>

          <div className="process-step">
            <span aria-hidden="true">
              04
            </span>

            <div>
              <strong>Track</strong>

              <p>
                Follow the repair
                progress.
              </p>
            </div>
          </div>
        </aside>
      </section>
    </main>
  );
}