const API_BASE_URL = 'http://localhost:8080/api';

// getAllCombos
export const getAllCombos = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/combos`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching combos:', error);
    throw error;
  }
};

// get All Combos Admin
export const getAllCombosAdmin = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/combos/all`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching all combos:', error);
    throw error;
  }
};

// get Combo by ID
export const getComboById = async (id) => {
  try {
    const response = await fetch(`${API_BASE_URL}/combos/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching combo by ID:', error);
    throw error;
  }
};

// search Combos by Name
export const searchCombosByName = async (name) => {
  try {
    const response = await fetch(`${API_BASE_URL}/combos/search?name=${encodeURIComponent(name)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error searching combos by name:', error);
    throw error;
  }
};

// search Combos by Price Range
export const getCombosByPriceRange = async (minPrice, maxPrice) => {
  try {
    const response = await fetch(`${API_BASE_URL}/combos/price-range?minPrice=${minPrice}&maxPrice=${maxPrice}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching combos by price range:', error);
    throw error;
  }
};

// search Combos by Max Price
export const getCombosByMaxPrice = async (maxPrice) => {
  try {
    const response = await fetch(`${API_BASE_URL}/combos/max-price?maxPrice=${maxPrice}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching combos by max price:', error);
    throw error;
  }
};

// create Combo (Admin)
export const createCombo = async (comboData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/combos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(comboData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error creating combo:', error);
    throw error;
  }
};

// update Combo (Admin)
export const updateCombo = async (id, comboData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/combos/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(comboData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error updating combo:', error);
    throw error;
  }
};

// delete Combo (Admin)
export const deleteCombo = async (id) => {
  try {
    const response = await fetch(`${API_BASE_URL}/combos/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return true;
  } catch (error) {
    console.error('Error deleting combo:', error);
    throw error;
  }
};
