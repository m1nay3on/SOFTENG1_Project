import { useState } from "react";
import FeedbackMessage from "../../components/FeedbackMessage";

const MAX_EVIDENCE_SIZE = 5 * 1024 * 1024;
const MAX_EVIDENCE_COUNT = 5;

export default function SubmitReport({
  setActive,
  user,
  onSubmit,
}) {
  const [form, setForm] =
    useState({
      category: "",
      description: "",
      location: "",
      evidence: [],
    });
  const [evidenceLoading, setEvidenceLoading] = useState(false);
  const [validationMessage, setValidationMessage] = useState("");

  function handleSubmit(e) {
    e.preventDefault();

    if (evidenceLoading) {
      return;
    }

    if (
      !form.category ||
      !form.description.trim() ||
      !form.location.trim()
    ) {
      setValidationMessage("Please complete the category, description, and location before submitting.");

      return;
    }
    setValidationMessage("");

    const report = {
      id: `PF-${String(
        Date.now()
      ).slice(-4)}`,

      issue: form.category,

      category:
        form.category,

      location:
        form.location.trim(),

      date:
        new Date().toLocaleDateString(
          "en-US",
          {
            month: "long",
            day: "numeric",
            year: "numeric",
          }
        ),

      time:
        new Date().toLocaleTimeString(
          "en-US",
          {
            hour: "numeric",
            minute: "2-digit",
          }
        ),

      priority: "Medium",

      status: "New",

      description:
        form.description.trim(),

      reporter:
        `${user.firstName} ${user.lastName}`,

      reporterEmail:
        user.email,

      evidence:
        form.evidence,
    };

    onSubmit(report);
  }

  function handleEvidenceChange(e) {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (!files.length) return;

    if (form.evidence.length + files.length > MAX_EVIDENCE_COUNT) {
      setValidationMessage(`A report can include up to ${MAX_EVIDENCE_COUNT} photos.`);
      return;
    }

    const invalidType = files.find((file) => !["image/png", "image/jpeg"].includes(file.type));
    if (invalidType) {
      setValidationMessage("Please choose PNG or JPEG images.");
      return;
    }

    const oversizedFile = files.find((file) => file.size > MAX_EVIDENCE_SIZE);
    if (oversizedFile) {
      setValidationMessage("Each photo must be 5 MB or smaller.");
      return;
    }

    setValidationMessage("");
    setEvidenceLoading(true);
    Promise.all(files.map((file) => new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result !== "string") {
          reject(new Error(`Could not read ${file.name}.`));
          return;
        }
        resolve({
          filename: file.name,
          contentType: file.type,
          dataUrl: reader.result,
        });
      };
      reader.onerror = () => reject(new Error(`Could not read ${file.name}.`));
      reader.readAsDataURL(file);
    })))
      .then((evidence) => {
        setForm((previousForm) => ({
          ...previousForm,
          evidence: [...previousForm.evidence, ...evidence],
        }));
      })
      .catch((error) => {
        setValidationMessage(error.message);
      })
      .finally(() => {
        setEvidenceLoading(false);
      });
  }

  function removeEvidence(indexToRemove) {
    setForm((previousForm) => ({
      ...previousForm,
      evidence: previousForm.evidence.filter((_, index) => index !== indexToRemove),
    }));
  }

  return (
    <main className="main">

      <button
        className="back-btn"
        type="button"
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
          <FeedbackMessage
            message={validationMessage}
            onDismiss={() => setValidationMessage("")}
          />

          <label>
            Reporter Name

            <input
              className="readonly-input"
              value={`${user.firstName} ${user.lastName}`}
              disabled
              readOnly
            />

            <small>
              Automatically filled from
              your account.
            </small>
          </label>

          <label>
            Category

            <select
              value={form.category}
              required
              onChange={(e) =>
                setForm({
                  ...form,
                  category:
                    e.target.value,
                })
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
          </label>

          <label>
            Description

            <textarea
              placeholder="Describe the damage or issue..."
              value={
                form.description
              }
              required
              onChange={(e) =>
                setForm({
                  ...form,
                  description:
                    e.target.value,
                })
              }
            />
          </label>

          <label>
            Exact Location

            <input
              placeholder="Street / Barangay / Landmark"
              value={
                form.location
              }
              required
              onChange={(e) =>
                setForm({
                  ...form,
                  location:
                    e.target.value,
                })
              }
            />
          </label>

          <label className="evidence-upload-label">
            Photo Evidence

            <input
              className="evidence-file-input"
              type="file"
              accept="image/png,image/jpeg"
              multiple
              disabled={evidenceLoading || form.evidence.length >= MAX_EVIDENCE_COUNT}
              onChange={handleEvidenceChange}
            />
            <small>
              Select up to {MAX_EVIDENCE_COUNT} PNG or JPEG photos. Each photo must be 5 MB or smaller
              ({form.evidence.length}/{MAX_EVIDENCE_COUNT} selected).
            </small>
          </label>

          {evidenceLoading && (
            <p role="status">Loading selected photo...</p>
          )}

          {form.evidence.length > 0 && (
            <div className="evidence-gallery evidence-preview">
              {form.evidence.map((photo, index) => (
                <figure className="evidence-image" key={`${photo.filename}-${index}`}>
                  <img src={photo.dataUrl} alt={`Selected evidence ${index + 1}`} />
                  <figcaption>
                    {photo.filename}
                    <button
                      className="remove-evidence"
                      type="button"
                      onClick={() => removeEvidence(index)}
                      disabled={evidenceLoading}
                      aria-label={`Remove ${photo.filename}`}
                    >
                      Remove
                    </button>
                  </figcaption>
                </figure>
              ))}
            </div>
          )}

          <button
            className="gold"
            type="submit"
            disabled={evidenceLoading}
          >
            Submit Report
          </button>

        </form>

        <aside className="panel information-panel">

          <p className="eyebrow">
            HOW IT WORKS
          </p>

          <h2>
            Submission Process
          </h2>

          <div className="process-step">
            <span>01</span>

            <div>
              <strong>
                Submit
              </strong>

              <p>
                Send your infrastructure
                concern.
              </p>
            </div>
          </div>

          <div className="process-step">
            <span>02</span>

            <div>
              <strong>
                Verify
              </strong>

              <p>
                An inspector reviews
                your report.
              </p>
            </div>
          </div>

          <div className="process-step">
            <span>03</span>

            <div>
              <strong>
                Assign
              </strong>

              <p>
                The issue is assigned
                for action.
              </p>
            </div>
          </div>

          <div className="process-step">
            <span>04</span>

            <div>
              <strong>
                Track
              </strong>

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

/* =========================================================
   MY REPORTS
========================================================= */
