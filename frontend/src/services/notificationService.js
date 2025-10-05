const API_BASE_URL = 'http://localhost:8080/api';

// get all notifications by user
export async function getNotificationsByUser(userId) {
  try {
    const response = await fetch(`${API_BASE_URL}/notifications/user/${userId}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching notifications:', error);
    throw error;
  }
}

// get unread notifications by user
export async function getUnreadNotificationsByUser(userId) {
  try {
    const response = await fetch(`${API_BASE_URL}/notifications/user/${userId}/unread`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching unread notifications:', error);
    throw error;
  }
}

// get unread notification count
export async function getUnreadNotificationCount(userId) {
  try {
    const response = await fetch(`${API_BASE_URL}/notifications/user/${userId}/count`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching unread notification count:', error);
    throw error;
  }
}

// create new notification
export async function createNotification(notificationData) {
  try {
    const response = await fetch(`${API_BASE_URL}/notifications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(notificationData)
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
}

// mark notification as read
export async function markNotificationAsRead(notificationId) {
  try {
    const response = await fetch(`${API_BASE_URL}/notifications/${notificationId}/read`, {
      method: 'PUT',
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
}

// mark all notifications as read
export async function markAllNotificationsAsRead(userId) {
  try {
    const response = await fetch(`${API_BASE_URL}/notifications/user/${userId}/read-all`, {
      method: 'PUT',
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return true;
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
}

// delete notification
export async function deleteNotification(notificationId) {
  try {
    const response = await fetch(`${API_BASE_URL}/notifications/${notificationId}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return true;
  } catch (error) {
    console.error('Error deleting notification:', error);
    throw error;
  }
}

// delete all notifications by user
export async function deleteAllNotificationsByUser(userId) {
  try {
    const response = await fetch(`${API_BASE_URL}/notifications/user/${userId}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return true;
  } catch (error) {
    console.error('Error deleting all notifications:', error);
    throw error;
  }
}

// helper functions to create notification
export function createBookingSuccessNotification(userId, movieTitle, seatNumbers, showTime) {
  return {
    userId: userId,
    title: 'Đặt vé thành công',
    message: `Bạn đã đặt vé thành công cho phim "${movieTitle}" tại ghế ${seatNumbers} vào ${new Date(showTime).toLocaleString('vi-VN')}`,
    type: 'booking_success',
    isRead: false,
    relatedType: 'booking'
  };
}

export function createTicketApprovedNotification(userId, movieTitle, ticketNumber) {
  return {
    userId: userId,
    title: 'Vé đã được duyệt',
    message: `Vé ${ticketNumber} cho phim "${movieTitle}" đã được admin duyệt và sẵn sàng sử dụng`,
    type: 'ticket_approved',
    isRead: false,
    relatedType: 'ticket'
  };
}

export function createTicketCancelledNotification(userId, movieTitle, ticketNumber) {
  return {
    userId: userId,
    title: 'Vé đã bị hủy',
    message: `Vé ${ticketNumber} cho phim "${movieTitle}" đã bị hủy bởi admin`,
    type: 'ticket_cancelled',
    isRead: false,
    relatedType: 'ticket'
  };
}
