const API_BASE_URL = 'http://localhost:8080/api';

// get all articles
export const getArticles = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/articles`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching articles:', error);
    throw error;
  }
};

// get article by id
export const getArticleById = async (id) => {
  try {
    const response = await fetch(`${API_BASE_URL}/articles/${id}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching article:', error);
    throw error;
  }
};

// get articles by movie id
export const getArticlesByMovieId = async (movieId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/articles/movie/${movieId}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching articles by movie:', error);
    throw error;
  }
};

// search articles by title
export const searchArticles = async (query) => {
  try {
    const response = await fetch(`${API_BASE_URL}/articles/search?title=${encodeURIComponent(query)}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error searching articles:', error);
    throw error;
  }
};

// get articles by category
export const getArticlesByCategory = async (category) => {
  try {
    const response = await fetch(`${API_BASE_URL}/articles/category/${category}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching articles by category:', error);
    throw error;
  }
};
  
export const getLatestArticles = async (limit = 10) => {
  try {
    const response = await fetch(`${API_BASE_URL}/articles/latest?limit=${limit}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching latest articles:', error);
    throw error;
  }
};
