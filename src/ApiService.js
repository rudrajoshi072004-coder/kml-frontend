import axios from "axios";

const BASE_URL = "https://distress-kml.up.railway.app";

export async function generateDistressReport(formData) {
  const url = `${BASE_URL}/road-distressSinglepipeline`;
  const response = await axios.post(url, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
}

