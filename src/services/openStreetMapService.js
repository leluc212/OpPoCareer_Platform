// OpenStreetMap Nominatim Geocoding Service
// Miễn phí, không cần API key, nhưng có giới hạn rate limit

class OpenStreetMapService {
  constructor() {
    // Nominatim API - miễn phí từ OpenStreetMap
    this.baseUrl = 'https://nominatim.openstreetmap.org';
    this.searchUrl = `${this.baseUrl}/search`;
    this.reverseUrl = `${this.baseUrl}/reverse`;
    
    // Rate limiting: 1 request per second
    this.lastRequestTime = 0;
    this.minInterval = 1000; // 1 second
    
    console.log('🗺️ OpenStreetMapService initialized (FREE)');
  }

  /**
   * Rate limiting để tránh bị block
   */
  async waitForRateLimit() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.minInterval) {
      const waitTime = this.minInterval - timeSinceLastRequest;
      console.log(`⏳ Rate limiting: waiting ${waitTime}ms`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    this.lastRequestTime = Date.now();
  }

  /**
   * Chuẩn hóa địa chỉ Việt Nam để tăng khả năng tìm thấy trên Nominatim
   * @param {string} address - Địa chỉ gốc
   * @returns {string[]} - Mảng các biến thể địa chỉ để thử
   */
  normalizeVietnameseAddress(address) {
    const variants = [address.trim()];

    // Loại bỏ prefix "Địa điểm X:" nếu có (do dropdown thêm vào)
    const prefixRemoved = address.replace(/^Địa điểm\s*\d+\s*:\s*/i, '').trim();
    if (prefixRemoved !== address.trim()) {
      variants.push(prefixRemoved);
    }

    const base = prefixRemoved || address.trim();

    // Thêm ", Việt Nam" nếu chưa có để giúp Nominatim xác định quốc gia
    if (!base.toLowerCase().includes('việt nam') && !base.toLowerCase().includes('vietnam')) {
      variants.push(`${base}, Việt Nam`);
    }

    // Thử bỏ số nhà (Nominatim đôi khi không nhận dạng được số nhà VN)
    const noHouseNumber = base.replace(/^\d+[a-zA-Z]?\s*[,/.-]?\s*/, '').trim();
    if (noHouseNumber !== base && noHouseNumber.length > 5) {
      variants.push(noHouseNumber);
      if (!noHouseNumber.toLowerCase().includes('việt nam')) {
        variants.push(`${noHouseNumber}, Việt Nam`);
      }
    }

    // Thử bỏ các từ viết tắt / rút gọn phổ biến trong tiếng Việt
    const simplified = base
      .replace(/\b(Đường|đường|Phường|phường|Quận|quận|Thành phố|TP\.?|Xã|xã|Huyện|huyện|Thị trấn|thị trấn)\s*/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    if (simplified !== base && simplified.length > 5) {
      variants.push(simplified);
      if (!simplified.toLowerCase().includes('việt nam')) {
        variants.push(`${simplified}, Việt Nam`);
      }
    }

    // Thử chỉ giữ phần quận/huyện + thành phố (bỏ chi tiết đường/số nhà)
    const parts = base.split(',').map(p => p.trim());
    if (parts.length >= 3) {
      // Lấy 2-3 phần cuối (thường là quận, thành phố)
      const lastParts = parts.slice(-3).join(', ');
      variants.push(lastParts);
      const last2Parts = parts.slice(-2).join(', ');
      variants.push(last2Parts);
    }

    // Loại bỏ duplicates
    return [...new Set(variants)];
  }

  /**
   * Chuyển đổi địa chỉ thành tọa độ GPS (Geocoding)
   * @param {string} address - Địa chỉ cần chuyển đổi
   * @returns {Promise<Object>} - {lat, lng, formattedAddress, components}
   */
  async geocodeAddress(address) {
    if (!address || !address.trim()) {
      throw new Error('Địa chỉ không được để trống');
    }

    const addressVariants = this.normalizeVietnameseAddress(address);
    let lastError = null;

    for (const variant of addressVariants) {
      await this.waitForRateLimit();

      try {
        console.log('🔍 OSM Geocoding address:', variant);
        
        const params = new URLSearchParams({
          q: variant,
          format: 'json',
          addressdetails: '1',
          limit: '5',
          countrycodes: 'vn', // Giới hạn trong Việt Nam
          'accept-language': 'vi,en'
        });
        
        const url = `${this.searchUrl}?${params}`;
        
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'OpPoReview-JobPlatform/1.0' // Required by Nominatim
          }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();

        if (data && data.length > 0) {
          const result = data[0];
          
          const geocodeResult = {
            lat: parseFloat(result.lat),
            lng: parseFloat(result.lon),
            formattedAddress: result.display_name,
            components: this.parseAddressComponents(result.address),
            placeId: result.place_id,
            osmType: result.osm_type,
            osmId: result.osm_id,
            importance: result.importance
          };

          console.log('✅ OSM Geocoding successful:', geocodeResult);
          return geocodeResult;
        }
      } catch (error) {
        lastError = error;
        console.warn(`⚠️ OSM Geocoding attempt failed for "${variant}":`, error.message);
      }
    }

    // Tất cả biến thể đều thất bại - thử searchPlaces như fallback cuối cùng
    try {
      console.log('🔄 OSM Geocoding: trying searchPlaces as final fallback...');
      const searchResults = await this.searchPlaces(address);
      if (searchResults && searchResults.length > 0) {
        const bestMatch = searchResults[0];
        const geocodeResult = {
          lat: bestMatch.lat,
          lng: bestMatch.lng,
          formattedAddress: bestMatch.description,
          components: bestMatch.components || {},
          placeId: bestMatch.placeId,
          importance: bestMatch.importance,
          source: 'search_fallback'
        };
        console.log('✅ OSM Geocoding via searchPlaces fallback:', geocodeResult);
        return geocodeResult;
      }
    } catch (searchError) {
      console.warn('⚠️ OSM searchPlaces fallback also failed:', searchError.message);
    }

    const finalError = new Error('Không tìm thấy địa chỉ phù hợp');
    console.error('❌ OSM Geocoding error (all variants failed):', finalError);
    throw finalError;
  }

  /**
   * Chuyển đổi tọa độ GPS thành địa chỉ (Reverse Geocoding)
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude
   * @returns {Promise<Object>} - {address, components}
   */
  async reverseGeocode(lat, lng) {
    if (!lat || !lng) {
      throw new Error('Tọa độ không hợp lệ');
    }

    await this.waitForRateLimit();

    try {
      console.log('🔍 OSM Reverse geocoding:', lat, lng);
      
      const params = new URLSearchParams({
        lat: lat.toString(),
        lon: lng.toString(),
        format: 'json',
        addressdetails: '1',
        'accept-language': 'vi,en'
      });
      
      const url = `${this.reverseUrl}?${params}`;
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'OpPoReview-JobPlatform/1.0'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();

      if (data && data.display_name) {
        const reverseResult = {
          address: data.display_name,
          components: this.parseAddressComponents(data.address),
          placeId: data.place_id,
          osmType: data.osm_type,
          osmId: data.osm_id
        };

        console.log('✅ OSM Reverse geocoding successful:', reverseResult);
        return reverseResult;
      } else {
        throw new Error('Không tìm thấy địa chỉ cho tọa độ này');
      }
    } catch (error) {
      console.error('❌ OSM Reverse geocoding error:', error);
      throw error;
    }
  }

  /**
   * Tìm kiếm địa điểm với gợi ý (Search)
   * @param {string} input - Từ khóa tìm kiếm
   * @returns {Promise<Array>} - Danh sách gợi ý địa điểm
   */
  async searchPlaces(input) {
    if (!input || !input.trim()) {
      return [];
    }

    await this.waitForRateLimit();

    try {
      console.log('🔍 OSM Searching places:', input);
      
      const params = new URLSearchParams({
        q: input,
        format: 'json',
        addressdetails: '1',
        limit: '5', // Giới hạn 5 kết quả
        countrycodes: 'vn',
        'accept-language': 'vi,en'
      });
      
      const url = `${this.searchUrl}?${params}`;
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'OpPoReview-JobPlatform/1.0'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();

      if (data && data.length > 0) {
        const suggestions = data.map(item => {
          let displayName = item.display_name;
          // OpenStreetMap API Nominatim sometimes incorrectly groups all inner-city districts of HCM with Thu Duc City
          if (
            (displayName.includes('Quận 1,') || 
             displayName.includes('Quận 3,') || 
             displayName.includes('Quận 4,') || 
             displayName.includes('Quận 5,') || 
             displayName.includes('Quận 10,')) && 
             displayName.includes('Thủ Đức')
          ) {
            displayName = displayName.replace(', Thành phố Thủ Đức', '');
          }

          return {
            description: displayName,
            placeId: item.place_id,
            lat: parseFloat(item.lat),
            lng: parseFloat(item.lon),
            type: item.type,
            class: item.class,
            importance: item.importance,
            components: this.parseAddressComponents(item.address)
          };
        });

        console.log('✅ OSM Places search successful:', suggestions.length, 'results');
        return suggestions;
      } else {
        console.log('ℹ️ OSM No results found');
        return [];
      }
    } catch (error) {
      console.error('❌ OSM Places search error:', error);
      return [];
    }
  }

  /**
   * Parse address components từ Nominatim API
   * @param {Object} address - Address object từ API
   * @returns {Object} - Parsed components
   */
  parseAddressComponents(address) {
    if (!address) return {};

    const parsed = {
      houseNumber: address.house_number || '',
      road: address.road || '',
      suburb: address.suburb || address.neighbourhood || '',
      ward: address.quarter || address.suburb || '',
      district: address.city_district || address.county || '',
      city: address.city || address.town || address.village || '',
      province: address.state || '',
      country: address.country || '',
      postcode: address.postcode || ''
    };

    return parsed;
  }

  /**
   * Format địa chỉ cho Việt Nam từ components
   * @param {Object} components - Address components
   * @returns {string} - Formatted address
   */
  formatVietnameseAddress(components) {
    const parts = [];
    
    if (components.houseNumber && components.road) {
      parts.push(`${components.houseNumber} ${components.road}`);
    } else if (components.road) {
      parts.push(components.road);
    }
    
    if (components.ward) {
      parts.push(components.ward);
    }
    
    if (components.district) {
      parts.push(components.district);
    }
    
    if (components.city || components.province) {
      parts.push(components.city || components.province);
    }

    return parts.join(', ');
  }

  /**
   * Validate tọa độ GPS
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude
   * @returns {boolean}
   */
  isValidCoordinates(lat, lng) {
    return (
      typeof lat === 'number' && 
      typeof lng === 'number' &&
      lat >= -90 && lat <= 90 &&
      lng >= -180 && lng <= 180
    );
  }

  /**
   * Kiểm tra service có sẵn sàng không
   * @returns {boolean}
   */
  isConfigured() {
    return true; // OSM không cần API key
  }

  /**
   * So sánh với Google Maps
   * @returns {Object} - Comparison info
   */
  getServiceInfo() {
    return {
      name: 'OpenStreetMap Nominatim',
      cost: 'Miễn phí',
      apiKey: 'Không cần',
      rateLimit: '1 request/second',
      coverage: 'Toàn cầu',
      accuracy: 'Tốt (nhưng kém hơn Google)',
      features: {
        geocoding: true,
        reverseGeocoding: true,
        search: true,
        autocomplete: false, // Không có autocomplete thực sự
        placeDetails: false
      },
      pros: [
        'Hoàn toàn miễn phí',
        'Không cần API key',
        'Dữ liệu mở',
        'Hỗ trợ Việt Nam tốt'
      ],
      cons: [
        'Rate limit nghiêm ngặt (1 req/s)',
        'Độ chính xác kém hơn Google',
        'Không có autocomplete',
        'Ít chi tiết hơn'
      ]
    };
  }
}

// Export singleton instance
const openStreetMapService = new OpenStreetMapService();
export default openStreetMapService;