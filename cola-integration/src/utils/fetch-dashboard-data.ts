import axios from "axios";

interface ApiResponse {
  data?: any;
}

interface client {
  post: (endpoint: string, body: object) => Promise<ApiResponse>;
}

export const fetchDataFromAPI = async (
  client: client,
  endpoint: string,
  body: object
): Promise<any[]> => {
  try {
    const response: ApiResponse = await client.post(endpoint, body);

    if (endpoint === "/api/ebazaar/getdataaudit") {
      return response.data ?? [];
    } else {
      return response.data?.data ?? [];
    }
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      console.error("Axios error:", error.message);
    } else {
      console.error("Unexpected error:", error);
    }
    return [];
  }
};
