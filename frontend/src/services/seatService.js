/* eslint-disable no-useless-catch */
const API_BASE_URL = 'http://localhost:8080/api';

// check API connection
export async function checkApiConnection() {
  try {
    const response = await fetch(`${API_BASE_URL}/seats`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.ok;
  } catch (error) {
    console.error('API connection check failed:', error);
    return false;
  }
}

// get all seats by showtimeId
export async function getSeatsByShowtime(showtimeId) {
  try {
    const response = await fetch(`${API_BASE_URL}/seats/showtime/${showtimeId}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    throw error;
  }
}

// get all seats
export async function getAllSeats() {
  try {
    const response = await fetch(`${API_BASE_URL}/seats`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching all seats:', error);
    throw error;
  }
}

// create new seat
export async function createSeat(seatData) {
  try {
    const response = await fetch(`${API_BASE_URL}/seats`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(seatData)
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error creating seat:', error);
    throw error;
  }
}

// create multiple seats
export async function createMultipleSeats(seatsData) {
  try {
    const response = await fetch(`${API_BASE_URL}/seats/batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(seatsData)
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error creating multiple seats:', error);
    throw error;
  }
}

// update seat
export async function updateSeat(seatId, seatData) {
  try {
    const response = await fetch(`${API_BASE_URL}/seats/${seatId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(seatData)
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error updating seat:', error);
    throw error;
  }
}

// delete seat
export async function deleteSeat(seatId) {
  try {
    const response = await fetch(`${API_BASE_URL}/seats/${seatId}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return true;
  } catch (error) {
    console.error('Error deleting seat:', error);
    throw error;
  }
}

// book seat
export async function bookSeat(seatId, userId) {
  try {
    const response = await fetch(`${API_BASE_URL}/seats/${seatId}/book`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId })
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error booking seat:', error);
    throw error;
  }
}

// unbook seat
export async function unbookSeat(seatId, userId) {
  try {
    const response = await fetch(`${API_BASE_URL}/seats/${seatId}/unbook`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId })
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error unbooking seat:', error);
    throw error;
  }
}

export async function deleteSeatsByShowtime(showtimeId) {
  try {
    const response = await fetch(`${API_BASE_URL}/seats/showtime/${showtimeId}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    console.log(`Deleted all seats for showtime ${showtimeId}`);
    return true;
  } catch (error) {
    console.error('Error deleting seats by showtime:', error);
    throw error;
  }
}