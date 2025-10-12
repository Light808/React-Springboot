import axios from "axios";

const API_URL = "http://localhost:8080/api/chat";

// sendMessage sends a message to the chat API and returns the response
export const sendMessage = async (message) => {
  try {
    const res = await axios.post(API_URL, { message });
    return res.data.reply;
  } catch (err) {
    console.error("Lỗi gọi API ChatGPT:", err);
    throw err;
  }
};

export const getChatHistory = async () => {
  try {
    const res = await axios.get(`${API_URL}/history`);
    return res.data;
  } catch (err) {
    console.error("Lỗi lấy lịch sử chat:", err);
    return [];
  }
};
