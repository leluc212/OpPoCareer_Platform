
const API_URL = import.meta.env.VITE_TRANSLATE_API || import.meta.env.VITE_API_URL;

/**
 * Service to handle dynamic translations using the Hybrid Translation backend.
 */
class TranslationService {
  constructor() {
    this.cache = new Map();
  }

  /**
   * Translates text to the target language.
   * @param {string} text - The text to translate.
   * @param {string} targetLang - The target language code (e.g., 'en', 'vi').
   * @param {string} sourceLang - The source language code (defaults to 'vi').
   * @returns {Promise<Object>} - The translation result.
   */
  async translate(text, targetLang = 'en', sourceLang = 'vi') {
    if (!text) return { translatedText: '', type: 'none' };
    if (targetLang === sourceLang) return { translatedText: text, type: 'original' };

    const cacheKey = `${text}_${targetLang}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          targetLang,
          sourceLang,
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      const result = {
        translatedText: data.translatedText || text,
        type: data.type || 'machine',
        cached: data.cached || false,
      };

      this.cache.set(cacheKey, result);
      return result;
    } catch (error) {
      if (error.name === 'AbortError') {
        console.error('❌ Translation request timed out');
      } else {
        console.error('❌ Translation service error:', error);
      }
      return { translatedText: text, type: 'error' };
    }
  }

  /**
   * Clear the in-memory cache.
   */
  clearCache() {
    this.cache.clear();
  }
}

export const translationService = new TranslationService();
