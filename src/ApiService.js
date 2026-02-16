import axios from "axios";
import API_URL from "./config";

export async function generateDistressReport({ file, startDate, endDate }) {
  const params = new URLSearchParams();
  if (startDate) params.set("start_date", startDate);
  if (endDate) params.set("end_date", endDate);

  const formData = new FormData();
  formData.append("file", file);

  const query = params.toString();
  const url = `${API_URL}/api/distress-report${query ? `?${query}` : ""}`;

  const response = await axios.post(url, formData);
  return response.data;
}
