import axios from "axios";
import { searchMovies, getMovies } from "./movieService";

const API_URL = "http://localhost:8080/api/chat";
const MOVIES_STORAGE_KEY = "chat_movies_cache";

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

// sendMessageWithMovies sends a message and includes movie suggestions
export const sendMessageWithMovies = async (message) => {
  try {
    // Get AI response
    const res = await axios.post(API_URL, { message });
    const reply = res.data.reply;

    // Extract movie-related keywords from the message
    const movieKeywords = extractMovieKeywords(message);
    
    // Search for movies
    let movies = [];
    if (movieKeywords.length > 0) {
      // Try searching with keywords
      for (const keyword of movieKeywords) {
        try {
          const searchResults = await searchMovies(keyword);
          if (searchResults && searchResults.length > 0) {
            movies = [...movies, ...searchResults];
          }
        } catch (err) {
          console.warn(`Search failed for keyword "${keyword}":`, err);
        }
      }
    }

    // If no movies found, get popular/featured movies
    if (movies.length === 0) {
      try {
        const allMovies = await getMovies();
        // Get first 3-5 movies as suggestions
        movies = allMovies.slice(0, 5);
      } catch (err) {
        console.warn("Failed to fetch movies:", err);
      }
    }

    // Remove duplicates based on movie ID
    const uniqueMovies = movies.filter((movie, index, self) =>
      index === self.findIndex(m => m.id === movie.id)
    ).slice(0, 5); 
    if (uniqueMovies.length > 0) {
      try {
        const moviesCache = JSON.parse(localStorage.getItem(MOVIES_STORAGE_KEY) || "{}");
        const cacheKey = message.trim().toLowerCase();
        moviesCache[cacheKey] = {
          movies: uniqueMovies,
          reply: reply.substring(0, 100), 
          timestamp: Date.now()
        };
        localStorage.setItem(MOVIES_STORAGE_KEY, JSON.stringify(moviesCache));
      } catch (err) {
        console.warn("Failed to save movies to localStorage:", err);
      }
    }

    return {
      reply: reply,
      movies: uniqueMovies
    };
  } catch (err) {
    console.error("Lỗi gọi API ChatGPT:", err);
    throw err;
  }
};

// Extract movie-related keywords from message
const extractMovieKeywords = (message) => {
  const keywords = [];
  const lowerMessage = message.toLowerCase();

  // Common movie genres in Vietnamese and English
  const genres = [
    'hành động', 'action', 'tình cảm', 'romance', 'kinh dị', 'horror', 'thriller',
    'hài', 'comedy', 'khoa học viễn tưởng', 'sci-fi', 'science fiction', 'fantasy',
    'phiêu lưu', 'adventure', 'animation', 'hoạt hình', 'drama', 'chính kịch',
    'tài liệu', 'documentary', 'cổ trang', 'lịch sử', 'history', 'war', 'chiến tranh'
  ];

  // Check for genre mentions
  genres.forEach(genre => {
    if (lowerMessage.includes(genre)) {
      keywords.push(genre);
    }
  });

  // Extract quoted movie names or titles
  const quoteMatch = message.match(/"([^"]+)"/);
  if (quoteMatch) {
    keywords.push(quoteMatch[1]);
  }

  // If no specific keywords found, extract key words (3+ characters)
  if (keywords.length === 0) {
    const words = message.split(/\s+/).filter(word => word.length >= 3);
    keywords.push(...words.slice(0, 2)); // Take first 2 meaningful words
  }

  return keywords;
};

export const getChatHistory = async () => {
  try {
    const res = await axios.get(`${API_URL}/history`);
    const history = res.data;
    
    // Merge movies from localStorage cache
    try {
      const moviesCache = JSON.parse(localStorage.getItem(MOVIES_STORAGE_KEY) || "{}");
      
      // Match messages with cached movies
      // Strategy: For each bot message, check if previous user message has cached movies
      const historyWithMovies = history.map((msg, index) => {
        let matchedMovies = null;
        
        // If it's a bot message, look for movies in the previous user message
        if ((msg.sender === "bot" || (msg.role && msg.role !== "user")) && index > 0) {
          const prevMsg = history[index - 1];
          // Check if previous message is from user
          if (prevMsg.sender === "user" || (prevMsg.role && prevMsg.role === "user")) {
            const userMessage = (prevMsg.message || prevMsg.content || "").trim().toLowerCase();
            
            // Try exact match first
            if (moviesCache[userMessage]) {
              matchedMovies = moviesCache[userMessage].movies;
            } else {
              // Try partial match (for cases where message might have slight variations)
              for (const key in moviesCache) {
                if (userMessage.includes(key) || key.includes(userMessage)) {
                  matchedMovies = moviesCache[key].movies;
                  break;
                }
              }
            }
          }
        }
        
        return {
          ...msg,
          movies: matchedMovies
        };
      });
      
      return historyWithMovies;
    } catch (cacheErr) {
      console.warn("Failed to load movies from cache:", cacheErr);
      return history;
    }
  } catch (err) {
    console.error("Lỗi lấy lịch sử chat:", err);
    return [];
  }
};
