let apiUrl = process.env.REACT_APP_API_URL;
if (!apiUrl) {
  try {
    const host = typeof window !== "undefined" ? window.location.hostname : "";
    if (host === "localhost" || host === "127.0.0.1") {
      apiUrl = "http://localhost:3001";
    } else {
      apiUrl = "https://kml-backend-production.up.railway.app";
    }
  } catch (_) {
    apiUrl = "https://kml-backend-production.up.railway.app";
  }
}
export default apiUrl;
