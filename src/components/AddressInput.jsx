import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { MapPin, Search, Loader, CheckCircle, AlertCircle, Globe } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

// Lazy load OpenStreetMap service (miễn phí, không cần API key)
let geocodingService = null;
const loadGeocodingService = async () => {
  if (!geocodingService) {
    try {
      // Ưu tiên OpenStreetMap (miễn phí, không cần API key)
      const osmModule = await import('../services/openStreetMapService');
      geocodingService = osmModule.default;
      console.log('✅ Loaded OpenStreetMap service (FREE)');
    } catch (error) {
      console.warn('Failed to load OpenStreetMap service, trying Google Maps:', error);
      try {
        // Fallback to Google Maps nếu có API key
        const googleModule = await import('../services/geocodingService');
        geocodingService = googleModule.default;
        console.log('✅ Loaded Google Maps service');
      } catch (googleError) {
        console.error('Failed to load any geocoding service:', googleError);
        geocodingService = null;
      }
    }
  }
  return geocodingService;
};

const AddressInputContainer = styled.div`
  position: relative;
  width: 100%;
`;

const InputWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`;

const AddressInputField = styled.textarea`
  width: 100%;
  padding: 12px 16px 12px 44px;
  min-height: 48px;
  max-height: 120px;
  border: 2px solid ${props => 
    props.$error ? '#EF4444' : 
    props.$success ? '#10B981' : 
    props.$loading ? '#3B82F6' : '#E5E7EB'};
  border-radius: 8px;
  font-size: 14px;
  line-height: 1.4;
  transition: all 0.2s ease;
  background: ${props => props.disabled ? '#F8FAFC' : (props.$loading ? '#F0F9FF' : 'white')};
  resize: vertical;
  font-family: inherit;
  overflow-y: auto;
  
  &:focus {
    outline: none;
    border-color: ${props => 
      props.$error ? '#EF4444' : 
      props.$success ? '#10B981' : '#3B82F6'};
    box-shadow: 0 0 0 3px ${props => 
      props.$error ? 'rgba(239, 68, 68, 0.1)' : 
      props.$success ? 'rgba(16, 185, 129, 0.1)' : 'rgba(59, 130, 246, 0.1)'};
  }
  
  &:disabled {
    background-color: #F8FAFC;
    color: #64748B;
    cursor: not-allowed;
    border-color: #E2E8F0;
  }
  
  &::placeholder {
    color: #9CA3AF;
  }
`;

const IconWrapper = styled.div`
  position: absolute;
  left: 14px;
  top: 14px;
  color: ${props => 
    props.$error ? '#EF4444' : 
    props.$success ? '#10B981' : 
    props.$loading ? '#3B82F6' : '#6B7280'};
  z-index: 2;
  
  svg {
    width: 18px;
    height: 18px;
    animation: ${props => props.$loading ? 'spin 1s linear infinite' : 'none'};
  }
  
  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
`;

const SuggestionsList = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 2px solid #E5E7EB;
  border-top: none;
  border-radius: 0 0 8px 8px;
  max-height: 200px;
  overflow-y: auto;
  z-index: 1000;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
`;

const SuggestionItem = styled.div`
  padding: 12px 16px;
  cursor: pointer;
  border-bottom: 1px solid #F3F4F6;
  transition: background-color 0.2s ease;
  
  &:hover {
    background-color: #F9FAFB;
  }
  
  &:last-child {
    border-bottom: none;
  }
  
  .suggestion-main {
    font-size: 14px;
    color: #111827;
    font-weight: 500;
    margin-bottom: 2px;
  }
  
  .suggestion-secondary {
    font-size: 12px;
    color: #6B7280;
  }
`;

const StatusMessage = styled.div`
  margin-top: 6px;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
  
  &.success {
    color: #10B981;
  }
  
  &.error {
    color: #EF4444;
  }
  
  &.loading {
    color: #3B82F6;
  }
  
  svg {
    width: 14px;
    height: 14px;
    animation: ${props => props.className?.includes('loading') ? 'spin 1s linear infinite' : 'none'};
  }
  
  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
`;

const CoordinatesDisplay = styled.div`
  margin-top: 8px;
  padding: 8px 12px;
  background: #F0F9FF;
  border: 1px solid #BFDBFE;
  border-radius: 6px;
  font-size: 12px;
  color: #1E40AF;
  
  .coords-label {
    font-weight: 600;
    margin-bottom: 4px;
  }
  
  .coords-values {
    font-family: monospace;
    display: flex;
    gap: 16px;
  }
`;

const AddressInput = ({ 
  value = '', 
  onChange, 
  onCoordinatesChange,
  placeholder,
  required = false,
  showCoordinates = true,
  disabled = false,
  className 
}) => {
  const { language } = useLanguage();
  const [inputValue, setInputValue] = useState(value);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(''); // 'success', 'error', 'loading'
  const [statusMessage, setStatusMessage] = useState('');
  const [coordinates, setCoordinates] = useState(null);
  const [debounceTimer, setDebounceTimer] = useState(null);
  
  const inputRef = useRef(null);
  const containerRef = useRef(null);

  const translations = {
    vi: {
      placeholder: 'Nhập địa chỉ cụ thể (VD: số 47 đường 5B, Long Bình, Thủ Đức)',
      searching: 'Đang tìm kiếm địa chỉ...',
      geocoding: 'Đang lấy tọa độ GPS...',
      success: 'Đã lấy địa chỉ thành công',
      error: 'Không thể lấy được địa chỉ',
      noResults: 'Không tìm thấy địa chỉ phù hợp',
      apiNotConfigured: 'Đang sử dụng OpenStreetMap (miễn phí)',
      coordinates: 'Tọa độ GPS:',
      latitude: 'Vĩ độ',
      longitude: 'Kinh độ',
      osmNote: 'Sử dụng dữ liệu OpenStreetMap'
    },
    en: {
      placeholder: 'Enter specific address (e.g., 47 5B Street, Long Binh, Thu Duc)',
      searching: 'Searching addresses...',
      geocoding: 'Getting GPS coordinates...',
      success: 'GPS coordinates retrieved successfully',
      error: 'Unable to get GPS coordinates',
      noResults: 'No matching addresses found',
      apiNotConfigured: 'Using OpenStreetMap (free)',
      coordinates: 'GPS Coordinates:',
      latitude: 'Latitude',
      longitude: 'Longitude',
      osmNote: 'Using OpenStreetMap data'
    }
  };

  const t = translations[language];

  // Debounced search function
  const searchAddresses = async (query) => {
    if (!query || query.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const service = await loadGeocodingService();
    if (!service) {
      setStatus('error');
      setStatusMessage('Không có geocoding service nào khả dụng');
      return;
    }

    try {
      setLoading(true);
      setStatus('loading');
      setStatusMessage(t.searching);

      const results = await service.searchPlaces(query);
      
      if (results && results.length > 0) {
        setSuggestions(results);
        setShowSuggestions(true);
        setStatus('');
        setStatusMessage('');
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
        setStatus('error');
        setStatusMessage(t.noResults);
      }
    } catch (error) {
      console.error('Address search error:', error);
      setSuggestions([]);
      setShowSuggestions(false);
      setStatus('error');
      setStatusMessage(error.message || t.error);
    } finally {
      setLoading(false);
    }
  };

  // Handle input change with debouncing
  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    
    // Clear previous timer
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    
    // Set new timer
    const timer = setTimeout(() => {
      searchAddresses(newValue);
    }, 500); // 500ms debounce
    
    setDebounceTimer(timer);
    
    // Call parent onChange
    if (onChange) {
      onChange(newValue);
    }
  };

  // Handle suggestion selection
  const handleSuggestionSelect = async (suggestion) => {
    try {
      setLoading(true);
      setStatus('loading');
      setStatusMessage(t.geocoding);
      setShowSuggestions(false);
      
      const service = await loadGeocodingService();
      if (!service) {
        throw new Error('Geocoding service not available');
      }
      
      // For OpenStreetMap, we already have coordinates in suggestion
      // For Google Maps, we need to get place details
      let newAddress, newCoords;
      
      if (suggestion.lat && suggestion.lng) {
        // OpenStreetMap format - coordinates already available
        newAddress = suggestion.description;
        newCoords = {
          lat: suggestion.lat,
          lng: suggestion.lng
        };
      } else if (suggestion.placeId && service.getPlaceDetails) {
        // Google Maps format - need to get place details
        const placeDetails = await service.getPlaceDetails(suggestion.placeId);
        newAddress = placeDetails.formattedAddress;
        newCoords = {
          lat: placeDetails.lat,
          lng: placeDetails.lng
        };
      } else {
        // Fallback - geocode the description
        const result = await service.geocodeAddress(suggestion.description);
        newAddress = result.formattedAddress;
        newCoords = {
          lat: result.lat,
          lng: result.lng
        };
      }
      
      setInputValue(newAddress);
      setCoordinates(newCoords);
      setStatus('success');
      setStatusMessage(t.success);
      
      // Call parent callbacks
      if (onChange) {
        onChange(newAddress);
      }
      if (onCoordinatesChange) {
        onCoordinatesChange(newCoords);
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      setStatus('error');
      setStatusMessage(error.message || t.error);
    } finally {
      setLoading(false);
    }
  };

  // Handle manual geocoding when user types and presses Enter
  const handleKeyPress = async (e) => {
    if (e.key === 'Enter' && inputValue && !showSuggestions) {
      e.preventDefault();
      await geocodeCurrentInput();
    }
  };

  // Geocode current input value
  const geocodeCurrentInput = async () => {
    const service = await loadGeocodingService();
    if (!inputValue || !service) {
      return;
    }

    try {
      setLoading(true);
      setStatus('loading');
      setStatusMessage(t.geocoding);
      
      const result = await service.geocodeAddress(inputValue);
      
      if (result) {
        const newCoords = {
          lat: result.lat,
          lng: result.lng
        };
        
        setCoordinates(newCoords);
        setStatus('success');
        setStatusMessage(t.success);
        
        // Update input with formatted address
        if (result.formattedAddress !== inputValue) {
          setInputValue(result.formattedAddress);
          if (onChange) {
            onChange(result.formattedAddress);
          }
        }
        
        if (onCoordinatesChange) {
          onCoordinatesChange(newCoords);
        }
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      setStatus('error');
      setStatusMessage(error.message || t.error);
    } finally {
      setLoading(false);
    }
  };

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Update input value when prop changes
  useEffect(() => {
    if (value !== inputValue) {
      setInputValue(value);
    }
  }, [value]);

  // Cleanup debounce timer
  useEffect(() => {
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [debounceTimer]);

  const getIcon = () => {
    if (loading) return <Loader style={{ animation: 'spin 1s linear infinite' }} />;
    if (status === 'success') return <CheckCircle />;
    if (status === 'error') return <AlertCircle />;
    return <MapPin />;
  };

  return (
    <AddressInputContainer ref={containerRef} className={className}>
      <InputWrapper>
        <IconWrapper 
          $loading={loading} 
          $success={status === 'success'} 
          $error={status === 'error'}
        >
          {getIcon()}
        </IconWrapper>
        
        <AddressInputField
          ref={inputRef}
          as="textarea"
          rows={2}
          value={inputValue}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          placeholder={placeholder || t.placeholder}
          required={required}
          disabled={disabled}
          $loading={loading}
          $success={status === 'success'}
          $error={status === 'error'}
        />
      </InputWrapper>

      {showSuggestions && suggestions.length > 0 && (
        <SuggestionsList>
          {suggestions.map((suggestion, index) => (
            <SuggestionItem
              key={index}
              onClick={() => handleSuggestionSelect(suggestion)}
            >
              <div className="suggestion-main">
                {suggestion.description}
              </div>
              {suggestion.types && (
                <div className="suggestion-secondary">
                  {suggestion.types.join(', ')}
                </div>
              )}
            </SuggestionItem>
          ))}
        </SuggestionsList>
      )}

      {statusMessage && status !== 'success' && (
        <StatusMessage className={status}>
          {status === 'loading' && <Loader style={{ animation: 'spin 1s linear infinite' }} />}
          {status === 'error' && <AlertCircle />}
          {statusMessage}
        </StatusMessage>
      )}

      {/* GPS coordinates are saved internally but not displayed to user */}
    </AddressInputContainer>
  );
};

export default AddressInput;