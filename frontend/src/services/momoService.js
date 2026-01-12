import axios from "axios";

const API_BASE_URL = "http://localhost:8080/api/momo";

export const createMoMoOrder = async (user, amount, description) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/create`, null, {
      params: { user, amount, description },
    });
    return response.data;
  } catch (error) {
    console.error("Error creating MoMo order:", error);
    throw error;
  }
};

export const queryMoMoOrder = async (orderId) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/query/${orderId}`);
    return response.data;
  } catch (error) {
    console.error("Error querying MoMo order:", error);
    throw error;
  }
};

