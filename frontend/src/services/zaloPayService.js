import axios from "axios";

const API_BASE_URL = "http://localhost:8080/api/zalopay";

export const createZaloPayOrder = async (user, amount, description) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/create`, null, {
      params: { user, amount, description },
    });
    return response.data;
  } catch (error) {
    console.error("Error creating ZaloPay order:", error);
    throw error;
  }
};

export const queryZaloPayOrder = async (appTransId) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/query/${appTransId}`);
    return response.data;
  } catch (error) {
    console.error("Error querying ZaloPay order:", error);
    throw error;
  }
};
