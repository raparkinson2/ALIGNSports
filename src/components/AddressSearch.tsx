import { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator, Keyboard } from 'react-native';
import { MapPin, Search, X, Navigation } from 'lucide-react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import { cn } from '@/lib/cn';

interface AddressSearchProps {
  value: string;
  onChangeText: (text: string) => void;
  onSelectLocation?: (name: string, address: string) => void;
  placeholder?: string;
}

interface AddressSuggestion {
  id: string;
  name: string;
  address: string;
  fullAddress: string;
}

export function AddressSearch({
  value,
  onChangeText,
  onSelectLocation,
  placeholder = 'Search for a place or address...'
}: AddressSearchProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchQuery, setSearchQuery] = useState(value);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const isTappingSuggestionRef = useRef(false);

  // Get user location on mount for better search results
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          setUserLocation({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          });
        }
      } catch (error) {
        console.log('Could not get user location:', error);
      }
    })();
  }, []);

  // Sync with external value changes
  useEffect(() => {
    if (value !== searchQuery && !isFocused) {
      setSearchQuery(value);
    }
  }, [value]);

  // Debounced search
  useEffect(() => {
    if (!searchQuery || searchQuery.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const timer = setTimeout(() => {
      searchPlaces(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const searchPlaces = async (query: string) => {
    if (query.length < 2) return;

    setIsLoading(true);
    try {
      // Use Nominatim OpenStreetMap API for place search (free, no API key required)
      // This supports venue names, addresses, and POIs
      const params = new URLSearchParams({
        q: query,
        format: 'json',
        addressdetails: '1',
        limit: '6',
        countrycodes: 'us,ca', // Limit to US and Canada for sports venues
      });

      // Add user location for better results if available
      if (userLocation) {
        params.append('viewbox', `${userLocation.longitude - 1},${userLocation.latitude + 1},${userLocation.longitude + 1},${userLocation.latitude - 1}`);
        params.append('bounded', '0'); // Prefer but don't limit to viewbox
      }

      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?${params.toString()}`,
        {
          headers: {
            'User-Agent': 'TeamScheduleApp/1.0',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Search failed');
      }

      const results = await response.json();

      if (results && results.length > 0) {
        const formattedResults: AddressSuggestion[] = results.map((result: {
          place_id: number;
          display_name: string;
          name?: string;
          address?: {
            amenity?: string;
            building?: string;
            leisure?: string;
            sport?: string;
            house_number?: string;
            road?: string;
            city?: string;
            town?: string;
            village?: string;
            state?: string;
            postcode?: string;
          };
        }, index: number) => {
          const addr = result.address || {};

          // Get venue/place name
          const venueName = result.name || addr.amenity || addr.building || addr.leisure || '';

          // Build street address
          const streetParts = [addr.house_number, addr.road].filter(Boolean);
          const street = streetParts.join(' ');

          // Build city/state
          const city = addr.city || addr.town || addr.village || '';
          const state = addr.state || '';
          const cityState = [city, state].filter(Boolean).join(', ');

          // Full address for display
          const fullAddress = [street, cityState, addr.postcode].filter(Boolean).join(', ');

          return {
            id: `${result.place_id}-${index}`,
            name: venueName || street || result.display_name.split(',')[0],
            address: cityState || result.display_name,
            fullAddress: fullAddress || result.display_name,
          };
        });

        // Remove duplicates
        const uniqueResults = formattedResults.filter(
          (result, index, self) =>
            index === self.findIndex(r => r.fullAddress === result.fullAddress)
        );

        setSuggestions(uniqueResults);
        setShowSuggestions(uniqueResults.length > 0);
      } else {
        // Fallback to expo-location geocoding
        await fallbackGeocode(query);
      }
    } catch (error) {
      console.log('Place search error, trying fallback:', error);
      await fallbackGeocode(query);
    } finally {
      setIsLoading(false);
    }
  };

  const fallbackGeocode = async (query: string) => {
    try {
      const results = await Location.geocodeAsync(query);

      if (results.length > 0) {
        const addressPromises = results.slice(0, 5).map(async (result, index) => {
          try {
            const reverseResults = await Location.reverseGeocodeAsync({
              latitude: result.latitude,
              longitude: result.longitude,
            });

            if (reverseResults.length > 0) {
              const addr = reverseResults[0];
              const name = addr.name || addr.street || '';
              const streetAddress = [addr.streetNumber, addr.street].filter(Boolean).join(' ');
              const cityState = [addr.city, addr.region].filter(Boolean).join(', ');
              const fullAddress = [streetAddress, cityState, addr.postalCode].filter(Boolean).join(', ');

              return {
                id: `fallback-${index}-${result.latitude}-${result.longitude}`,
                name: name,
                address: cityState,
                fullAddress: fullAddress || query,
              };
            }
            return null;
          } catch {
            return null;
          }
        });

        const addressResults = await Promise.all(addressPromises);
        const validResults = addressResults.filter((r): r is AddressSuggestion => r !== null);

        const uniqueResults = validResults.filter(
          (result, index, self) =>
            index === self.findIndex(r => r.fullAddress === result.fullAddress)
        );

        setSuggestions(uniqueResults);
        setShowSuggestions(uniqueResults.length > 0);
      }
    } catch (error) {
      console.log('Fallback geocode error:', error);
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSelectSuggestion = (suggestion: AddressSuggestion) => {
    isTappingSuggestionRef.current = true;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Build a display value that includes venue name if available
    const displayValue = suggestion.name && suggestion.name !== suggestion.fullAddress.split(',')[0]
      ? `${suggestion.name}, ${suggestion.fullAddress}`
      : suggestion.fullAddress;

    onChangeText(displayValue);
    setSearchQuery(displayValue);

    // Also pass the venue name if callback is provided
    if (onSelectLocation) {
      onSelectLocation(suggestion.name, suggestion.fullAddress);
    }

    setShowSuggestions(false);
    setSuggestions([]);
    Keyboard.dismiss();

    // Reset the ref after a short delay
    setTimeout(() => {
      isTappingSuggestionRef.current = false;
    }, 100);
  };

  const handleChangeText = (text: string) => {
    setSearchQuery(text);
    onChangeText(text);
    if (text.length >= 2) {
      setShowSuggestions(true);
    }
  };

  const handleClear = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSearchQuery('');
    onChangeText('');
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const handleFocus = () => {
    setIsFocused(true);
    if (suggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    // Only hide suggestions if we're not tapping on one
    // Use a longer delay to allow the tap to register
    setTimeout(() => {
      if (!isTappingSuggestionRef.current) {
        setShowSuggestions(false);
      }
    }, 300);
  };

  return (
    <View className="relative z-50">
      {/* Input Container */}
      <View
        className={cn(
          'flex-row items-center bg-slate-800 rounded-xl px-4 border',
          isFocused ? 'border-cyan-500/50' : 'border-transparent'
        )}
      >
        <Search size={18} color={isFocused ? '#67e8f9' : '#64748b'} />
        <TextInput
          value={searchQuery}
          onChangeText={handleChangeText}
          placeholder={placeholder}
          placeholderTextColor="#64748b"
          className="flex-1 py-3 px-3 text-white text-lg"
          onFocus={handleFocus}
          onBlur={handleBlur}
          autoCorrect={false}
          autoCapitalize="words"
        />
        {isLoading ? (
          <ActivityIndicator size="small" color="#67e8f9" />
        ) : searchQuery.length > 0 ? (
          <Pressable onPress={handleClear} hitSlop={8}>
            <X size={18} color="#64748b" />
          </Pressable>
        ) : null}
      </View>

      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <Animated.View
          entering={FadeIn.duration(150)}
          exiting={FadeOut.duration(100)}
          className="absolute top-full left-0 right-0 mt-2 bg-slate-800 rounded-xl border border-slate-700 overflow-hidden"
          style={{ zIndex: 100 }}
        >
          {suggestions.map((suggestion, index) => (
            <Pressable
              key={suggestion.id}
              onPressIn={() => {
                // Set flag before onBlur fires to prevent hiding suggestions
                isTappingSuggestionRef.current = true;
              }}
              onPress={() => handleSelectSuggestion(suggestion)}
              className={cn(
                'flex-row items-center px-4 py-3 active:bg-slate-700',
                index !== suggestions.length - 1 && 'border-b border-slate-700/50'
              )}
            >
              <View className="w-10 h-10 rounded-full bg-cyan-500/20 items-center justify-center mr-3">
                <MapPin size={18} color="#67e8f9" />
              </View>
              <View className="flex-1">
                <Text className="text-white font-medium" numberOfLines={1}>
                  {suggestion.name}
                </Text>
                <Text className="text-slate-400 text-sm" numberOfLines={1}>
                  {suggestion.address}
                </Text>
              </View>
              <Navigation size={16} color="#64748b" />
            </Pressable>
          ))}
        </Animated.View>
      )}

      {/* Loading indicator when searching */}
      {isLoading && searchQuery.length >= 2 && !showSuggestions && (
        <Animated.View
          entering={FadeIn.duration(150)}
          className="absolute top-full left-0 right-0 mt-2 bg-slate-800 rounded-xl border border-slate-700 p-4"
        >
          <View className="flex-row items-center justify-center">
            <ActivityIndicator size="small" color="#67e8f9" />
            <Text className="text-slate-400 ml-3">Searching places...</Text>
          </View>
        </Animated.View>
      )}
    </View>
  );
}
