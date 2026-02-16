let apiUrl = process.env.REACT_APP_API_URL;

if (!apiUrl) {
  if (process.env.NODE_ENV === 'development') {
    apiUrl = 'http://localhost:4000';
  } else {
    apiUrl = 'https://kml-backend-production.up.railway.app';
  }
}

export default apiUrl;
