import { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator, Keyboard, Modal, TouchableWithoutFeedback, ScrollView } from 'react-native';
import { MapPin, Search, X, Navigation } from 'lucide-react-native';
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
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState(value);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const inputRef = useRef<TextInput>(null);

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
    if (value !== searchQuery && !showModal) {
      setSearchQuery(value);
    }
  }, [value, showModal, searchQuery]);

  // Debounced search
  useEffect(() => {
    if (!searchQuery || searchQuery.length < 2) {
      setSuggestions([]);
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
      // Use Nominatim with location bias for better local results
      const params = new URLSearchParams({
        q: query,
        format: 'json',
        addressdetails: '1',
        limit: '10',
        countrycodes: 'us,ca', // Prioritize US and Canada results
      });

      // Add user location for much better local results
      if (userLocation) {
        // Create a larger viewbox (~100 miles radius) centered on user
        // 1 degree latitude ≈ 69 miles, 1 degree longitude varies but ~55 miles at 40° lat
        const latOffset = 1.5; // ~100 miles north/south
        const lonOffset = 2.0; // ~110 miles east/west
        params.set('viewbox', `${userLocation.longitude - lonOffset},${userLocation.latitude + latOffset},${userLocation.longitude + lonOffset},${userLocation.latitude - latOffset}`);
        // bounded=1 means prefer results in viewbox but still show others if nothing found
        params.set('bounded', '0');
        // Add lat/lon for sorting by distance
        params.set('lat', userLocation.latitude.toString());
        params.set('lon', userLocation.longitude.toString());
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
        // Sort results by distance from user if we have their location
        let sortedResults = results;
        if (userLocation) {
          sortedResults = results.sort((a: { lat: string; lon: string }, b: { lat: string; lon: string }) => {
            const distA = Math.sqrt(
              Math.pow(parseFloat(a.lat) - userLocation.latitude, 2) +
              Math.pow(parseFloat(a.lon) - userLocation.longitude, 2)
            );
            const distB = Math.sqrt(
              Math.pow(parseFloat(b.lat) - userLocation.latitude, 2) +
              Math.pow(parseFloat(b.lon) - userLocation.longitude, 2)
            );
            return distA - distB;
          });
        }

        const formattedResults: AddressSuggestion[] = sortedResults.slice(0, 8).map((result: {
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
            country?: string;
          };
        }, index: number) => {
          const addr = result.address || {};
          const venueName = result.name || addr.amenity || addr.building || addr.leisure || '';
          const streetParts = [addr.house_number, addr.road].filter(Boolean);
          const street = streetParts.join(' ');
          const city = addr.city || addr.town || addr.village || '';
          const state = addr.state || '';
          const cityState = [city, state].filter(Boolean).join(', ');
          const fullAddress = [street, cityState, addr.postcode].filter(Boolean).join(', ');

          return {
            id: `${result.place_id}-${index}`,
            name: venueName || street || result.display_name.split(',')[0],
            address: cityState || result.display_name,
            fullAddress: fullAddress || result.display_name,
          };
        });

        const uniqueResults = formattedResults.filter(
          (result, index, self) =>
            index === self.findIndex(r => r.fullAddress === result.fullAddress)
        );

        setSuggestions(uniqueResults);
      } else {
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
      }
    } catch (error) {
      console.log('Fallback geocode error:', error);
      setSuggestions([]);
    }
  };

  const handleSelectSuggestion = (suggestion: AddressSuggestion) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const displayValue = suggestion.name && suggestion.name !== suggestion.fullAddress.split(',')[0]
      ? `${suggestion.name}, ${suggestion.fullAddress}`
      : suggestion.fullAddress;

    setSearchQuery(displayValue);
    onChangeText(displayValue);

    if (onSelectLocation) {
      onSelectLocation(suggestion.name, suggestion.fullAddress);
    }

    setShowModal(false);
    setSuggestions([]);
  };

  const handleChangeText = (text: string) => {
    setSearchQuery(text);
    onChangeText(text);
  };

  const handleClear = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSearchQuery('');
    onChangeText('');
    setSuggestions([]);
  };

  const openSearch = () => {
    setShowModal(true);
  };

  const closeSearch = () => {
    setShowModal(false);
    Keyboard.dismiss();
  };

  return (
    <View>
      {/* Display Field - Tap to open search modal */}
      <Pressable
        onPress={openSearch}
        className="flex-row items-center bg-slate-800 rounded-xl px-4 py-3 border border-transparent"
      >
        <Search size={18} color="#64748b" />
        <Text
          className={cn(
            'flex-1 ml-3 text-lg',
            searchQuery ? 'text-white' : 'text-slate-500'
          )}
          numberOfLines={1}
        >
          {searchQuery || placeholder}
        </Text>
        {searchQuery.length > 0 && (
          <Pressable
            onPress={(e) => {
              e.stopPropagation();
              handleClear();
            }}
            hitSlop={8}
          >
            <X size={18} color="#64748b" />
          </Pressable>
        )}
      </Pressable>

      {/* Full Screen Search Modal */}
      <Modal
        visible={showModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeSearch}
      >
        <View className="flex-1 bg-slate-900">
          {/* Header */}
          <View className="flex-row items-center px-4 pt-4 pb-2 border-b border-slate-800">
            <Pressable onPress={closeSearch} className="p-2 -ml-2">
              <X size={24} color="#64748b" />
            </Pressable>
            <Text className="flex-1 text-white text-lg font-semibold text-center mr-8">
              Search Location
            </Text>
          </View>

          {/* Search Input */}
          <View className="px-4 py-3">
            <View className="flex-row items-center bg-slate-800 rounded-xl px-4 border border-cyan-500/50">
              <Search size={18} color="#67e8f9" />
              <TextInput
                ref={inputRef}
                value={searchQuery}
                onChangeText={handleChangeText}
                placeholder={placeholder}
                placeholderTextColor="#64748b"
                className="flex-1 py-3 px-3 text-white text-lg"
                autoFocus
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
          </View>

          {/* Results */}
          <ScrollView className="flex-1 px-4" keyboardShouldPersistTaps="handled">
            {/* Always show "Use this text" option when user has typed something */}
            {searchQuery.length >= 2 && (
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  onChangeText(searchQuery);
                  if (onSelectLocation) {
                    onSelectLocation(searchQuery, searchQuery);
                  }
                  setShowModal(false);
                }}
                className="flex-row items-center py-4 border-b border-slate-800 active:bg-slate-800/50"
              >
                <View className="w-12 h-12 rounded-full bg-green-500/20 items-center justify-center mr-4">
                  <Search size={20} color="#22c55e" />
                </View>
                <View className="flex-1">
                  <Text className="text-green-400 font-medium text-base">Use "{searchQuery}"</Text>
                  <Text className="text-slate-400 text-sm mt-0.5">Enter location manually</Text>
                </View>
              </Pressable>
            )}

            {isLoading && suggestions.length === 0 && (
              <View className="flex-row items-center justify-center py-8">
                <ActivityIndicator size="small" color="#67e8f9" />
                <Text className="text-slate-400 ml-3">Searching places...</Text>
              </View>
            )}

            {suggestions.map((suggestion) => (
              <Pressable
                key={suggestion.id}
                onPress={() => handleSelectSuggestion(suggestion)}
                className="flex-row items-center py-4 border-b border-slate-800 active:bg-slate-800/50"
              >
                <View className="w-12 h-12 rounded-full bg-cyan-500/20 items-center justify-center mr-4">
                  <MapPin size={20} color="#67e8f9" />
                </View>
                <View className="flex-1">
                  <Text className="text-white font-medium text-base" numberOfLines={1}>
                    {suggestion.name}
                  </Text>
                  <Text className="text-slate-400 text-sm mt-0.5" numberOfLines={2}>
                    {suggestion.fullAddress}
                  </Text>
                </View>
                <Navigation size={18} color="#64748b" />
              </Pressable>
            ))}

            {searchQuery.length < 2 && (
              <View className="items-center py-8">
                <Search size={48} color="#64748b" />
                <Text className="text-slate-400 mt-4">Search for a location</Text>
                <Text className="text-slate-500 text-sm mt-1">Type at least 2 characters</Text>
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}
