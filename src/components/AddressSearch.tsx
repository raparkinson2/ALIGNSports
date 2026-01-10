import { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator, Keyboard } from 'react-native';
import { MapPin, Search, X, Navigation } from 'lucide-react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import { cn } from '@/lib/cn';

interface AddressSearchProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}

interface AddressSuggestion {
  id: string;
  name: string;
  address: string;
  fullAddress: string;
}

export function AddressSearch({ value, onChangeText, placeholder = 'Search for an address...' }: AddressSearchProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchQuery, setSearchQuery] = useState(value);

  // Debounced search
  useEffect(() => {
    if (!searchQuery || searchQuery.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const timer = setTimeout(() => {
      searchAddresses(searchQuery);
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const searchAddresses = async (query: string) => {
    if (query.length < 3) return;

    setIsLoading(true);
    try {
      // Request location permission first (needed for geocoding)
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        // If no permission, just allow manual entry
        setIsLoading(false);
        return;
      }

      // Use geocoding to find addresses
      const results = await Location.geocodeAsync(query);

      if (results.length > 0) {
        // Get reverse geocode for each result to get formatted addresses
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
                id: `${index}-${result.latitude}-${result.longitude}`,
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

        // Remove duplicates based on fullAddress
        const uniqueResults = validResults.filter(
          (result, index, self) =>
            index === self.findIndex(r => r.fullAddress === result.fullAddress)
        );

        setSuggestions(uniqueResults);
        setShowSuggestions(uniqueResults.length > 0);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    } catch (error) {
      console.log('Address search error:', error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectSuggestion = (suggestion: AddressSuggestion) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onChangeText(suggestion.fullAddress);
    setSearchQuery(suggestion.fullAddress);
    setShowSuggestions(false);
    setSuggestions([]);
    Keyboard.dismiss();
  };

  const handleChangeText = (text: string) => {
    setSearchQuery(text);
    onChangeText(text);
    if (text.length >= 3) {
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
    // Delay hiding suggestions to allow tap to register
    setTimeout(() => {
      setShowSuggestions(false);
    }, 200);
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
                  {suggestion.name || suggestion.fullAddress.split(',')[0]}
                </Text>
                <Text className="text-slate-400 text-sm" numberOfLines={1}>
                  {suggestion.address || suggestion.fullAddress}
                </Text>
              </View>
              <Navigation size={16} color="#64748b" />
            </Pressable>
          ))}
        </Animated.View>
      )}

      {/* Loading indicator when searching */}
      {isLoading && searchQuery.length >= 3 && (
        <Animated.View
          entering={FadeIn.duration(150)}
          className="absolute top-full left-0 right-0 mt-2 bg-slate-800 rounded-xl border border-slate-700 p-4"
        >
          <View className="flex-row items-center justify-center">
            <ActivityIndicator size="small" color="#67e8f9" />
            <Text className="text-slate-400 ml-3">Searching addresses...</Text>
          </View>
        </Animated.View>
      )}

      {/* Helper text */}
      {isFocused && searchQuery.length > 0 && searchQuery.length < 3 && (
        <Text className="text-slate-500 text-xs mt-2">
          Type at least 3 characters to search
        </Text>
      )}
    </View>
  );
}
