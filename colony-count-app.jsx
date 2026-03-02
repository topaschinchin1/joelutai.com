import { useState, useRef, useCallback } from "react";

const API_URL = "https://colony-analysis-api.onrender.com";

function HemolysisIcon({ type }) {
  const colors = { alpha: "#22d3ee", beta: "#f87171", gamma: "#a78bfa", unknown: "#94a3b8" };
  const labels = { alpha: "α Alpha", beta: "β Beta", gamma: "γ Gamma", unknown: "Unknown" };
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 12px", background: `${colors[type] || colors.unknown}18`, border: `1px solid ${colors[type] || colors.unknown}40`, borderRadius: 100, fontSize: 13, fontWeight: 600, color: colors[type] || colors.unknown }}>
      {labels[type] || "Unknown"}
    </span>
  );
}

function StatCard({ label, value, sub, color = "#10b981" }) {
  return (
    <div style={{ background: "rgba(148,163,184,0.04)", border: "1px solid rgba(148,163,184,0.08)", borderRadius: 14, padding: "20px 24px", flex: 1, minWidth: 140 }}>
      <div style={{ fontSize: 12, color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>{label}</div>
      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 32, fontWeight: 500, color }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: "#475569", marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

export default function ColonyCountApp() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [detectionMode, setDetectionMode] = useState("auto");
  const [colonySize, setColonySize] = useState("auto");
  const [mediaType, setMediaType] = useState("blood_agar");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [email, setEmail] = useState("");
  const [emailSubmitted, setEmailSubmitted] = useState(false);
  const [emailError, setEmailError] = useState(null);
  const fileRef = useRef(null);

  const handleFile = useCallback((f) => {
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      setError("Please upload an image file (JPG, PNG)");
      return;
    }
    if (f.size > 15 * 1024 * 1024) {
      setError("Image must be under 15MB");
      return;
    }
    setFile(f);
    setError(null);
    setResult(null);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(f);
  }, []);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer?.files?.[0];
    handleFile(f);
  }, [handleFile]);

  const validateEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

  const analyze = async () => {
    if (!file) return;
    if (!emailSubmitted) {
      if (!email || !validateEmail(email)) {
        setEmailError("Please enter a valid email address");
        return;
      }
      setEmailSubmitted(true);
      setEmailError(null);
      // Log email + usage (fire and forget)
      try {
        // Log email + usage to n8n webhook → Google Sheets + welcome email
        fetch("https://joelut.app.n8n.cloud/webhook/colony-signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            timestamp: new Date().toISOString(),
            detection_mode: detectionMode,
            colony_size: colonySize,
            media_type: mediaType,
            filename: file.name,
          }),
        }).catch(() => {});
      } catch (e) { /* silent */ }
    }
    setLoading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append("image", file);
    formData.append("media_type", mediaType);
    formData.append("detection_mode", detectionMode);
    formData.append("colony_size", colonySize);

    try {
      const res = await fetch(`${API_URL}/analyze`, { method: "POST", body: formData });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data = await res.json();
      if (data.status === "error") throw new Error(data.message || "Analysis failed");
      setResult(data);
    } catch (err) {
      if (err.message.includes("Failed to fetch") || err.message.includes("NetworkError")) {
        setError("API is waking up (free tier cold start). Please wait 30-60 seconds and try again.");
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setError(null);
    // Keep email submitted — don't re-gate returning users
  };

  const confidenceColor = (c) => {
    if (!c) return "#94a3b8";
    if (c >= 0.9) return "#10b981";
    if (c >= 0.7) return "#fbbf24";
    return "#f87171";
  };

  return (
    <div style={{ background: "#0a0f1a", color: "#e2e8f0", minHeight: "100vh", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&family=Instrument+Serif&display=swap" rel="stylesheet" />

      {/* Ambient */}
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, pointerEvents: "none", zIndex: 0 }}>
        <div style={{ position: "absolute", top: "-15%", right: "-8%", width: 500, height: 500, background: "radial-gradient(circle, rgba(16,185,129,0.06) 0%, transparent 70%)", borderRadius: "50%" }} />
      </div>

      {/* Header */}
      <header style={{ position: "relative", zIndex: 1, borderBottom: "1px solid rgba(148,163,184,0.08)", padding: "0 24px" }}>
        <div style={{ maxWidth: 960, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 60 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: "linear-gradient(135deg, #059669, #10b981)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>🔬</div>
            <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: "-0.02em" }}>ColonyCount<span style={{ color: "#10b981" }}>API</span></span>
          </div>
          <div style={{ fontSize: 12, color: "#475569", fontFamily: "'DM Mono', monospace" }}>v1.8.0-opencfu</div>
        </div>
      </header>

      <main style={{ position: "relative", zIndex: 1, maxWidth: 960, margin: "0 auto", padding: "40px 24px 80px" }}>
        {/* Title */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <h1 style={{ fontFamily: "'Instrument Serif', serif", fontSize: "clamp(28px, 4vw, 40px)", fontWeight: 400, margin: "0 0 8px" }}>
            Automated Colony Counter
          </h1>
          <p style={{ color: "#64748b", fontSize: 15, margin: 0 }}>
            Upload a plate image. Get an accurate colony count with hemolysis classification.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: result ? "1fr 1fr" : "1fr", gap: 24, maxWidth: result ? 960 : 560, margin: "0 auto", transition: "all 0.4s ease" }}>
          {/* Left: Upload + Settings */}
          <div>
            {/* Upload zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              onClick={() => !file && fileRef.current?.click()}
              style={{
                border: `2px dashed ${dragOver ? "#10b981" : file ? "rgba(148,163,184,0.15)" : "rgba(148,163,184,0.12)"}`,
                borderRadius: 16,
                padding: file ? 0 : 48,
                textAlign: "center",
                cursor: file ? "default" : "pointer",
                background: dragOver ? "rgba(16,185,129,0.05)" : "rgba(148,163,184,0.02)",
                transition: "all 0.3s",
                overflow: "hidden",
                position: "relative",
              }}
            >
              <input ref={fileRef} type="file" accept="image/*" onChange={(e) => handleFile(e.target.files?.[0])} style={{ display: "none" }} />
              {preview ? (
                <div style={{ position: "relative" }}>
                  <img src={preview} alt="Plate" style={{ width: "100%", display: "block", borderRadius: 14 }} />
                  <button onClick={(e) => { e.stopPropagation(); reset(); }} style={{ position: "absolute", top: 10, right: 10, width: 32, height: 32, borderRadius: 8, background: "rgba(0,0,0,0.7)", border: "none", color: "white", fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(8px)" }}>✕</button>
                  {loading && (
                    <div style={{ position: "absolute", inset: 0, background: "rgba(10,15,26,0.8)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, backdropFilter: "blur(4px)" }}>
                      <div style={{ width: 40, height: 40, border: "3px solid rgba(16,185,129,0.2)", borderTop: "3px solid #10b981", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
                      <div style={{ fontSize: 14, color: "#94a3b8" }}>Analyzing plate...</div>
                      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.6 }}>🧫</div>
                  <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>Drop your plate image here</div>
                  <div style={{ fontSize: 13, color: "#64748b" }}>or click to browse • JPG, PNG up to 15MB</div>
                </>
              )}
            </div>

            {/* Settings */}
            {file && (
              <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Media Type</label>
                  <select value={mediaType} onChange={(e) => setMediaType(e.target.value)} style={{ width: "100%", padding: "10px 12px", background: "rgba(148,163,184,0.06)", border: "1px solid rgba(148,163,184,0.12)", borderRadius: 10, color: "#e2e8f0", fontSize: 13, fontFamily: "'Plus Jakarta Sans', sans-serif", outline: "none", cursor: "pointer", appearance: "none" }}>
                    <option value="blood_agar">Blood Agar</option>
                    <option value="nutrient_agar">Nutrient Agar</option>
                    <option value="macconkey_agar">MacConkey</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Detection</label>
                  <select value={detectionMode} onChange={(e) => setDetectionMode(e.target.value)} style={{ width: "100%", padding: "10px 12px", background: "rgba(148,163,184,0.06)", border: "1px solid rgba(148,163,184,0.12)", borderRadius: 10, color: "#e2e8f0", fontSize: 13, fontFamily: "'Plus Jakarta Sans', sans-serif", outline: "none", cursor: "pointer", appearance: "none" }}>
                    <option value="auto">Auto</option>
                    <option value="sensitive">Sensitive</option>
                    <option value="strict">Strict</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Colony Size</label>
                  <select value={colonySize} onChange={(e) => setColonySize(e.target.value)} style={{ width: "100%", padding: "10px 12px", background: "rgba(148,163,184,0.06)", border: "1px solid rgba(148,163,184,0.12)", borderRadius: 10, color: "#e2e8f0", fontSize: 13, fontFamily: "'Plus Jakarta Sans', sans-serif", outline: "none", cursor: "pointer", appearance: "none" }}>
                    <option value="auto">Auto</option>
                    <option value="small">Small</option>
                    <option value="medium">Medium</option>
                    <option value="large">Large</option>
                  </select>
                </div>
              </div>
            )}

            {/* Email gate */}
            {file && !emailSubmitted && (
              <div style={{ marginTop: 16, padding: "20px", background: "rgba(16,185,129,0.04)", border: "1px solid rgba(16,185,129,0.12)", borderRadius: 14 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#e2e8f0", marginBottom: 4 }}>Enter your email to analyze</div>
                <div style={{ fontSize: 12, color: "#64748b", marginBottom: 12 }}>We'll send you the results and notify you about new features. No spam.</div>
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    type="email"
                    placeholder="researcher@university.edu"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setEmailError(null); }}
                    onKeyDown={(e) => e.key === "Enter" && analyze()}
                    style={{ flex: 1, padding: "11px 14px", background: "rgba(148,163,184,0.06)", border: emailError ? "1px solid rgba(248,113,113,0.4)" : "1px solid rgba(148,163,184,0.12)", borderRadius: 10, color: "#e2e8f0", fontSize: 14, fontFamily: "'Plus Jakarta Sans', sans-serif", outline: "none" }}
                  />
                  <button onClick={analyze} disabled={loading} style={{ padding: "11px 20px", background: "linear-gradient(135deg, #059669, #10b981)", color: "white", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif", whiteSpace: "nowrap" }}>
                    Analyze
                  </button>
                </div>
                {emailError && <div style={{ fontSize: 12, color: "#fca5a5", marginTop: 6 }}>{emailError}</div>}
              </div>
            )}

            {/* Analyze button (after email submitted) */}
            {file && emailSubmitted && !result && (
              <button onClick={analyze} disabled={loading} style={{ width: "100%", marginTop: 16, padding: "14px 24px", background: loading ? "rgba(16,185,129,0.3)" : "linear-gradient(135deg, #059669, #10b981)", color: "white", border: "none", borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif", transition: "all 0.2s", boxShadow: loading ? "none" : "0 0 24px rgba(16,185,129,0.2)" }}>
                {loading ? "Analyzing..." : "Analyze Plate"}
              </button>
            )}

            {/* Error */}
            {error && (
              <div style={{ marginTop: 16, padding: "14px 18px", background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)", borderRadius: 12, fontSize: 13, color: "#fca5a5", lineHeight: 1.6 }}>
                {error}
              </div>
            )}
          </div>

          {/* Right: Results */}
          {result && (
            <div style={{ animation: "fadeIn 0.5s ease" }}>
              <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(10px) } to { opacity: 1; transform: translateY(0) } }`}</style>

              {/* Colony Count - Hero Stat */}
              <div style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.15)", borderRadius: 16, padding: "28px 32px", marginBottom: 16, textAlign: "center" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#10b981", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>Colony Count</div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 64, fontWeight: 500, color: "#10b981", lineHeight: 1 }}>{result.colony_count}</div>
                <div style={{ fontSize: 13, color: "#64748b", marginTop: 8 }}>CFU detected</div>
              </div>

              {/* Hemolysis + Confidence */}
              <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
                <div style={{ flex: 1, background: "rgba(148,163,184,0.04)", border: "1px solid rgba(148,163,184,0.08)", borderRadius: 14, padding: "16px 20px" }}>
                  <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Hemolysis</div>
                  <HemolysisIcon type={result.hemolysis?.type} />
                  <div style={{ fontSize: 12, color: "#475569", marginTop: 6 }}>
                    Confidence: <span style={{ color: confidenceColor(result.hemolysis?.confidence), fontFamily: "'DM Mono', monospace" }}>{result.hemolysis?.confidence ? `${(result.hemolysis.confidence * 100).toFixed(0)}%` : "N/A"}</span>
                  </div>
                </div>
                <div style={{ flex: 1, background: "rgba(148,163,184,0.04)", border: "1px solid rgba(148,163,184,0.08)", borderRadius: 14, padding: "16px 20px" }}>
                  <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Decision</div>
                  <div style={{ fontSize: 13, color: "#e2e8f0", lineHeight: 1.5 }}>
                    {result.decision_label || "N/A"}
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
                <StatCard label="Avg Size" value={`${result.colony_statistics?.average_size_px?.toFixed(0) || 0}`} sub="pixels" />
                <StatCard label="Circularity" value={result.colony_statistics?.average_circularity?.toFixed(2) || "0"} sub="0-1 scale" />
                <StatCard label="Coverage" value={`${result.plate_info?.plate_coverage_pct?.toFixed(0) || 0}%`} sub="plate area" />
              </div>

              {/* Debug accordion */}
              <details style={{ background: "rgba(148,163,184,0.04)", border: "1px solid rgba(148,163,184,0.08)", borderRadius: 14, overflow: "hidden" }}>
                <summary style={{ padding: "14px 20px", fontSize: 13, fontWeight: 600, color: "#94a3b8", cursor: "pointer", userSelect: "none" }}>
                  Debug Data & Raw Response
                </summary>
                <div style={{ padding: "0 20px 16px", maxHeight: 300, overflow: "auto" }}>
                  <pre style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#64748b", lineHeight: 1.7, whiteSpace: "pre-wrap", wordBreak: "break-all", margin: 0 }}>
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </div>
              </details>

              {/* New analysis */}
              <button onClick={reset} style={{ width: "100%", marginTop: 16, padding: "12px 24px", background: "rgba(148,163,184,0.08)", color: "#e2e8f0", border: "1px solid rgba(148,163,184,0.15)", borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                Analyze Another Plate
              </button>
            </div>
          )}
        </div>

        {/* How it works - shown when no file */}
        {!file && (
          <div style={{ maxWidth: 560, margin: "48px auto 0" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 20, textAlign: "center" }}>How it works</div>
            <div style={{ display: "flex", gap: 16 }}>
              {[
                { step: "1", icon: "📸", title: "Upload", desc: "Drop a plate image" },
                { step: "2", icon: "⚙️", title: "Configure", desc: "Select agar & mode" },
                { step: "3", icon: "🔬", title: "Analyze", desc: "Get count + hemolysis" },
              ].map((s, i) => (
                <div key={i} style={{ flex: 1, textAlign: "center", padding: 20, background: "rgba(148,163,184,0.03)", border: "1px solid rgba(148,163,184,0.06)", borderRadius: 14 }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>{s.icon}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2 }}>{s.title}</div>
                  <div style={{ fontSize: 12, color: "#64748b" }}>{s.desc}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid rgba(148,163,184,0.06)", padding: "20px 24px", textAlign: "center" }}>
        <p style={{ color: "#334155", fontSize: 12, margin: 0 }}>
          ColonyCount API v1.8.0 • Built by <span style={{ color: "#475569" }}>JoeLuT AI Solutions</span> • Houston, TX
        </p>
      </footer>
    </div>
  );
}
