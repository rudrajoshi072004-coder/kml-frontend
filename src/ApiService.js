import axios from "axios";

const IS_DEV = process.env.NODE_ENV === "development";
const BASE_URL = IS_DEV ? "" : "https://distress-kml.up.railway.app";

export async function generateDistressReport({ file, startDate, endDate }) {
  const params = new URLSearchParams();
  if (startDate) params.set("start_date", startDate);
  if (endDate) params.set("end_date", endDate);

  const formData = new FormData();
  formData.append("file", file);

  const query = params.toString();
  const url = `${BASE_URL}/road-distressSinglepipeline${query ? `?${query}` : ""}`;

  const response = await axios.post(url, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
}
