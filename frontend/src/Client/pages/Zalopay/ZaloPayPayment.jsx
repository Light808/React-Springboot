/* eslint-disable no-unused-vars */
import React, { useState } from "react";
import { createZaloPayOrder } from "../../../../services/zalopayService";
import "./ZaloPayPayment.css";

const ZaloPayPayment = () => {
  const [amount, setAmount] = useState("");
  const [orderUrl, setOrderUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreateOrder = async () => {
    if (!amount) {
      alert("Vui lòng nhập số tiền!");
      return;
    }
    setLoading(true);
    try {
      const data = await createZaloPayOrder(parseInt(amount));
      setOrderUrl(data.order_url);
    } catch (error) {
      alert("Không thể tạo đơn hàng ZaloPay!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="zalopay-container">
      <div className="zalopay-box">
        <h2>Thanh toán qua ZaloPay</h2>
        <input
          type="number"
          placeholder="Nhập số tiền (VNĐ)"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <button onClick={handleCreateOrder} disabled={loading}>
          {loading ? "Đang xử lý..." : "Tạo thanh toán"}
        </button>

        {orderUrl && (
          <div className="zalopay-qr-container">
            <h3>Quét mã QR để thanh toán:</h3>
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(
                orderUrl
              )}&size=200x200`}
              alt="QR Code"
            />
            <p>
              Hoặc{" "}
              <a href={orderUrl} target="_blank" rel="noopener noreferrer">
                nhấn vào đây
              </a>{" "}
              để mở ZaloPay.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ZaloPayPayment;
