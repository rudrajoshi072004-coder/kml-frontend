import React, { useState } from "react";
import { generateDistressReport } from "./ApiService";

const CSV_HEADERS = [
  "Date_Period",
  "Depth_m",
  "Distress",
  "Length_m",
  "Width_m",
  "latitude",
  "longitude",
  "chainage_",
  "chainage",
  "Direction",
  "Lane",
];

function jsonToCsv(data) {
  const headerLine = CSV_HEADERS.join(",");
  const rows = (Array.isArray(data) ? data : []).map((item) =>
    CSV_HEADERS.map((key) => {
      const raw = item && item[key] != null ? item[key] : "";
      const str = String(raw).replace(/"/g, '""');
      return `"${str}"`;
    }).join(",")
  );
  return [headerLine, ...rows].join("\r\n");
}

export default function DistressReport() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [csvContent, setCsvContent] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

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
    setCsvContent("");

    if (!startDate || !endDate || !file) {
      setErrorMessage("Start date, end date, and KML file are required.");
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("start_date", startDate);
      formData.append("end_date", endDate);
      formData.append("file", file);

      const data = await generateDistressReport(formData);
      const csv = jsonToCsv(data);

      if (!csv || csv.split("\n").length <= 1) {
        setErrorMessage("No data returned for the selected period.");
        return;
      }

      setCsvContent(csv);
      setSuccessMessage("Report generated successfully. You can now download the CSV file.");
    } catch (err) {
      const detail =
        (err &&
          err.response &&
          err.response.data &&
          (err.response.data.detail || err.response.data.message)) ||
        null;
      setErrorMessage(
        detail || "Failed to generate report. Please check your input and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!csvContent) return;
    const safeStart = startDate || "start";
    const safeEnd = endDate || "end";
    const filename = `distress_report_${safeStart}_${safeEnd}.csv`;
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
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
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-10">
      <div className="w-full max-w-xl">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-50 sm:text-3xl">
            Distress Report Generator
          </h1>
          <p className="mt-2 text-sm text-slate-300">
            Upload a KML file and select a date range to generate a structured road distress CSV
            report.
          </p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl shadow-black/40 backdrop-blur">
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
                  className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none ring-0 transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/40"
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
                  className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none ring-0 transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/40"
                  required
                />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium uppercase tracking-wide text-slate-300">
                Upload KML File
              </label>
              <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-dashed border-slate-600 bg-slate-900/80 px-3 py-2 text-sm text-slate-200 transition hover:border-indigo-500 hover:bg-slate-900">
                <span className="truncate">{file ? file.name : "Choose .kml file"}</span>
                <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-100">
                  Browse
                </span>
                <input
                  type="file"
                  accept=".kml"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
              <p className="mt-1 text-xs text-slate-400">Supported format: .kml only</p>
            </div>
            {errorMessage && (
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
                className="inline-flex items-center justify-center rounded-full bg-indigo-500 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:bg-slate-600 disabled:shadow-none"
              >
                {loading && (
                  <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-slate-100 border-t-transparent" />
                )}
                Generate Report
              </button>
              <button
                type="button"
                onClick={handleDownload}
                disabled={!csvContent || loading}
                className="inline-flex items-center justify-center rounded-full border border-slate-600 px-5 py-2 text-sm font-semibold text-slate-100 transition hover:border-emerald-500 hover:text-emerald-300 disabled:cursor-not-allowed disabled:border-slate-700 disabled:text-slate-500"
              >
                Download CSV
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}

