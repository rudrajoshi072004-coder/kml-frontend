import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import {
  downloadDetectDistressFinalPredicted,
  generateDistressFinalPredictedProxy,
} from "./ApiService";
import * as XLSX from "xlsx";

export default function DistressPredicted() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [projectName, setProjectName] = useState("");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [csvBlob, setCsvBlob] = useState(null);
  const [csvFilename, setCsvFilename] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const toArray = (data) => {
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.data)) return data.data;
    if (data && Array.isArray(data.results)) return data.results;
    if (data && Array.isArray(data.rows)) return data.rows;
    return data ? [data] : [];
  };

  const toYmd = (val) => {
    if (!val) return val;
    let s = String(val).trim().replace(/\//g, "-");
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
    const m = s.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
    if (m) {
      const dd = String(m[1]).padStart(2, "0");
      const mm = String(m[2]).padStart(2, "0");
      const yyyy = m[3];
      return `${yyyy}-${mm}-${dd}`;
    }
    return s;
  };

  const handleFileChange = (e) => {
    const selected = e.target.files && e.target.files[0];
    if (selected && !selected.name.toLowerCase().endsWith(".kml")) {
      setErrorMessage("Please upload a valid .kml file.");
      setFile(null);
      e.target.value = "";
      return;
    }
    setErrorMessage("");
    setFile(selected || null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMessage("");
    setErrorMessage("");
    setCsvBlob(null);

    if (!startDate || !endDate) {
      setErrorMessage("Start date and end date are required.");
      return;
    }
    if (!file) {
      setErrorMessage("KML file is required for final predicted generation.");
      return;
    }

    try {
      setLoading(true);
      let blob;
      try {
        const { blob: proxyBlob, filename: proxyName } = await generateDistressFinalPredictedProxy({
          file,
          startDate: toYmd(startDate),
          endDate: toYmd(endDate),
          projectName,
        });
        blob = proxyBlob;
        setCsvFilename(proxyName || "");
      } catch (proxyErr) {
        const proxyStatus = proxyErr && proxyErr.response && proxyErr.response.status;
        if (proxyStatus) {
          throw proxyErr;
        } else {
          const { blob: fileBlob, filename } = await downloadDetectDistressFinalPredicted({
            file,
            startDate: toYmd(startDate),
            endDate: toYmd(endDate),
            projectName,
          });
          blob = fileBlob;
          setCsvFilename(filename || "");
        }
      }

      setCsvBlob(blob);
      setErrorMessage("");
      setSuccessMessage(
        "Final predicted distress generated successfully. You can now download the Excel file."
      );
    } catch (err) {
      let detail = null;
      const status = err && err.response && err.response.status;
      if (!status && err && err.message && err.message.toLowerCase().includes("network")) {
        setErrorMessage(
          "Network error while contacting detect endpoint (likely CORS). Retrying via backend proxy failed."
        );
        setLoading(false);
        return;
      }
      if (err && err.response && err.response.data) {
        const data = err.response.data;
        if (data instanceof Blob) {
          try {
            const text = await data.text();
            if (text) detail = text;
          } catch (_) {}
        } else if (typeof data === "string") {
          detail = data;
        } else if (Array.isArray(data.detail)) {
          detail = data.detail
            .map((d) => d.msg || d.detail)
            .filter(Boolean)
            .join("; ");
        } else if (data.detail || data.message || data.error) {
          detail = data.detail || data.message || data.error;
        }
      }

      if (typeof detail === "string") {
        const trimmed = detail.trim().toLowerCase();
        if (trimmed.startsWith("<!doctype html") || trimmed.startsWith("<html")) {
          detail =
            "Service endpoint is not available. Please make sure the external API is reachable.";
        }
      }

      if (!detail && status === 404) {
        detail =
          "Service endpoint was not found (404). Please verify the API URL.";
      }

      const statusText =
        err && err.response && err.response.status
          ? ` [${err.response.status}]`
          : "";
      setErrorMessage(
        detail
          ? `${detail}${statusText}`
          : `Failed to generate predicted distress.${statusText} Please check your input and try again.`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!csvBlob) return;
    const safeStart = startDate || "start";
    const safeEnd = endDate || "end";
    const mime = csvBlob.type || "";
    const ext =
      mime.includes("spreadsheetml") || mime.includes("excel") ? "xlsx" : "csv";
    const filename =
      csvFilename && csvFilename.toLowerCase().endsWith(".xlsx")
        ? csvFilename
        : `distress_predicted_${safeStart}_${safeEnd}.${ext}`;
    const blob = csvBlob;
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="App">
      <header className="app-header">
        <div className="app-header-left">
          <button
            type="button"
            className="app-back-button"
            onClick={() => navigate("/")}
          >
            ← Back
          </button>
          <span className="app-header-title">Distress Predicted Generator</span>
        </div>
        <div className="user-info">
          {user && (
            <>
              <span>
                Welcome, <strong>{user.username}</strong>
              </span>
              <button className="logout-button" onClick={logout}>
                Logout
              </button>
            </>
          )}
        </div>
      </header>
      <main className="flex min-h-screen items-start justify-center bg-transparent px-4 pt-16 pb-10">
        <div className="w-full max-w-xl">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-50 sm:text-3xl">
              Distress Predicted Generator
            </h1>
            <p className="mt-2 text-sm text-slate-300">
              Enter a date range and project name to generate a predicted
              road distress report. Optionally upload a KML file to use the original CSV pipeline.
            </p>
          </div>
          <div className="rounded-3xl border border-slate-700/70 bg-slate-900/60 p-6 shadow-2xl shadow-cyan-500/10 backdrop-blur-2xl">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium uppercase tracking-wide text-slate-300">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    onClick={(e) => {
                      try {
                        if (typeof e.target.showPicker === "function") {
                          e.target.showPicker();
                        }
                      } catch (_) {}
                    }}
                    className="distress-date-input rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm text-slate-100 outline-none ring-0 transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/40"
                    required
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium uppercase tracking-wide text-slate-300">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    onClick={(e) => {
                      try {
                        if (typeof e.target.showPicker === "function") {
                          e.target.showPicker();
                        }
                      } catch (_) {}
                    }}
                    className="distress-date-input rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm text-slate-100 outline-none ring-0 transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/40"
                    required
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium uppercase tracking-wide text-slate-300">
                  Project Name
                </label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm text-slate-100 outline-none ring-0 transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/40"
                  placeholder="Enter project name"
                  required
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium uppercase tracking-wide text-slate-300">
                  Upload KML File
                </label>
                <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-dashed border-slate-600 bg-slate-900/80 px-3 py-2 text-sm text-slate-200 transition hover:border-cyan-400 hover:bg-slate-900">
                  <span className="truncate">
                    {file ? file.name : "Choose .kml file (optional)"}
                  </span>
                  <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-100 shadow-lg shadow-cyan-500/20">
                    Browse
                  </span>
                  <input
                    type="file"
                    accept=".kml"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
                <p className="mt-1 text-xs text-slate-400">
                  Supported format: .kml. If provided, the original CSV pipeline will be used.
                </p>
              </div>
              {errorMessage && !csvBlob && (
                <div className="rounded-lg border border-red-600/60 bg-red-900/40 px-3 py-2 text-xs text-red-100">
                  {errorMessage}
                </div>
              )}
              {successMessage && (
                <div className="rounded-lg border border-emerald-600/60 bg-emerald-900/40 px-3 py-2 text-xs text-emerald-100">
                  {successMessage}
                </div>
              )}
              <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-cyan-400 via-indigo-500 to-fuchsia-500 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-cyan-400/40 transition hover:brightness-110 disabled:cursor-not-allowed disabled:bg-slate-600 disabled:shadow-none"
                >
                  {loading && (
                    <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-slate-100 border-t-transparent" />
                  )}
                  Generate Predicted
                </button>
                <button
                  type="button"
                  onClick={handleDownload}
                  disabled={!csvBlob || loading}
                  className="inline-flex items-center justify-center rounded-full border border-slate-600/80 px-5 py-2 text-sm font-semibold text-slate-100 transition hover:border-emerald-400 hover:text-emerald-300 disabled:cursor-not-allowed disabled:border-slate-700 disabled:text-slate-500"
                >
                  Download Excel
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
