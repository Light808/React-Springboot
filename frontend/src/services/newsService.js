const API_BASE_URL = 'http://localhost:8080/api';

// Get all news articles
export const getAllNews = async (page = 0, size = 10, category = null, featured = null, search = null) => {
  try {
    let url = `${API_BASE_URL}/news?page=${page}&size=${size}`;
    
    if (category) url += `&category=${encodeURIComponent(category)}`;
    if (featured !== null) url += `&featured=${featured}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (data.success) {
      return data.news;
    } else {
      throw new Error(data.message || 'Cannot fetch news');
    }
  } catch (error) {
    console.error('Error fetching news:', error);
    throw new Error('Cannot fetch news');
  }
};

// Get news by ID
export const getNewsById = async (id) => {
  try {
    const response = await fetch(`${API_BASE_URL}/news/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (data.success) {
      return data.news;
    } else {
      throw new Error(data.message || 'Cannot fetch news article');
    }
  } catch (error) {
    console.error('Error fetching news article:', error);
    throw new Error('Cannot fetch news article');
  }
};

// Get featured news
export const getFeaturedNews = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/news/featured`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (data.success) {
      return data.news;
    } else {
      throw new Error(data.message || 'Cannot fetch featured news');
    }
  } catch (error) {
    console.error('Error fetching featured news:', error);
    throw new Error('Cannot fetch featured news');
  }
};

// Get news by category
export const getNewsByCategory = async (category) => {
  try {
    const response = await fetch(`${API_BASE_URL}/news/category/${encodeURIComponent(category)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (data.success) {
      return data.news;
    } else {
      throw new Error(data.message || 'Cannot fetch news by category');
    }
  } catch (error) {
    console.error('Error fetching news by category:', error);
    throw new Error('Cannot fetch news by category');
  }
};

// Search news
export const searchNews = async (query) => {
  try {
    const response = await fetch(`${API_BASE_URL}/news/search?q=${encodeURIComponent(query)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (data.success) {
      return data.news;
    } else {
      throw new Error(data.message || 'Cannot search news');
    }
  } catch (error) {
    console.error('Error searching news:', error);
    throw new Error('Cannot search news');
  }
};

// Get news categories
export const getNewsCategories = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/news/categories`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (data.success) {
      return data.categories;
    } else {
      throw new Error(data.message || 'Cannot fetch news categories');
    }
  } catch (error) {
    console.error('Error fetching news categories:', error);
    throw new Error('Cannot fetch news categories');
  }
};

// Get popular news
export const getPopularNews = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/news/popular`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (data.success) {
      return data.news;
    } else {
      throw new Error(data.message || 'Cannot fetch popular news');
    }
  } catch (error) {
    console.error('Error fetching popular news:', error);
    throw new Error('Cannot fetch popular news');
  }
};

// Get recent news
export const getRecentNews = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/news/recent`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (data.success) {
      return data.news;
    } else {
      throw new Error(data.message || 'Cannot fetch recent news');
    }
  } catch (error) {
    console.error('Error fetching recent news:', error);
    throw new Error('Cannot fetch recent news');
  }
};

// Create news (Admin only)
export const createNews = async (newsData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/news`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newsData),
    });

    const data = await response.json();

    if (data.success) {
      return data.news;
    } else {
      throw new Error(data.message || 'Cannot create news article');
    }
  } catch (error) {
    console.error('Error creating news:', error);
    throw new Error('Cannot create news article');
  }
};

// Update news (Admin only)
export const updateNews = async (id, newsData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/news/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newsData),
    });

    const data = await response.json();

    if (data.success) {
      return data.news;
    } else {
      throw new Error(data.message || 'Cannot update news article');
    }
  } catch (error) {
    console.error('Error updating news:', error);
    throw new Error('cannot update news article');
  }
};

export const deleteNews = async (id) => {
  try {
    const response = await fetch(`${API_BASE_URL}/news/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (data.success) {
      return true;
    } else {
      throw new Error(data.message || 'cannot delete news');
    }
  } catch (error) {
    console.error('Error deleting news:', error);
    throw new Error('cannot delete news');
  }
};