import { useState, useEffect } from 'react';
import {
  View,
  Button,
  Image,
  StyleSheet,
  Alert,
  Text,
  TouchableOpacity,
  FlatList,
  TextInput,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import MapView, { Marker } from 'react-native-maps';
import Geocoder from 'react-native-geocoding';

//import { GOOGLE_GEOCODER_API } from '@env';

// Geocoding API Key Setup (replace with your actual key)
//Geocoder.init(GOOGLE_GEOCODER_API);

const RESTAURANTS = [
  "McDonald's",
  'Burger King',
  'Chick-fil-A',
  'Taco Bell',
  'Subway',
  'Great Harvest',
];

export default function UploadScreen() {
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [image, setImage] = useState<string | null>(null);
  const [ocrResults, setOcrResults] = useState<any[]>([]);
  const [location, setLocation] = useState<any>(null); // Store GPS location
  const [mapRegion, setMapRegion] = useState<any>(null); // Store map region for navigation
  const [searchQuery, setSearchQuery] = useState(''); // Location search query

  // Request permissions for media and camera
  const requestPermissions = async () => {
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    const { status: mediaStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (cameraStatus !== 'granted' || mediaStatus !== 'granted') {
      Alert.alert('Permissions required', 'Camera and media permissions are needed.');
      return false;
    }
    return true;
  };

  // Pick an image from the gallery
  const pickImageFromGallery = async () => {
    const ok = await requestPermissions();
    if (!ok) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets.length > 0) {
      setImage(result.assets[0].uri);
    }
  };

  // Take a photo using the camera
  const takePhoto = async () => {
    const ok = await requestPermissions();
    if (!ok) return;

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets.length > 0) {
      setImage(result.assets[0].uri);
    }
  };

  // Get the user's current location
  const getCurrentLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      alert('Permission denied');
      return;
    }

    const userLocation = await Location.getCurrentPositionAsync({});
    setLocation(userLocation.coords);
    setMapRegion({
      latitude: userLocation.coords.latitude,
      longitude: userLocation.coords.longitude,
      latitudeDelta: 0.0922,
      longitudeDelta: 0.0421,
    });
  };

  // Search for a location based on the search query
  const searchLocation = async (query: string) => {
    try {
      const response = await Geocoder.from(query);
      const { lat, lng } = response.results[0].geometry.location;
      setLocation({ latitude: lat, longitude: lng });
      setMapRegion({
        latitude: lat,
        longitude: lng,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      });
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Unable to find the location');
    }
  };

  const uploadImage = async () => {
    if (!image || !selectedLocation) return;

    try {
      // Convert image URI to base64 string
      const base64Image = await fetch(image)
        .then((res) => res.blob())
        .then((blob) => {
          return new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
        });

      const base64Data = base64Image.split(',')[1];

      const res = await fetch('http://192.168.1.101:3000/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageBase64: base64Data,
          restaurantName: selectedLocation, 
        }),
      });

      const text = await res.text();
      console.log('Server response:', text);

      if (!res.ok) {
        throw new Error(`Server error ${res.status}: ${text}`);
      }

      // Safe JSON parsing
      let data;
      try {
        data = JSON.parse(text);
      } catch (jsonError) {
        console.error('Error parsing JSON:', jsonError);
        Alert.alert('Parsing Error', 'Response was not valid JSON.');
        return;
      }

      setOcrResults(data);
      console.log('data', data);
    } catch (error: any) {
      console.error('Upload failed:', error);
      Alert.alert('Upload failed', error.message || 'Unknown error');
    }
  };

  const renderRestaurant = ({ item }: { item: string }) => (
    <TouchableOpacity
      style={[styles.restaurantOption, selectedLocation === item && styles.selectedRestaurant]}
      onPress={() => setSelectedLocation(item)}
    >
      <Text style={styles.restaurantText}>{item}</Text>
    </TouchableOpacity>
  );

  useEffect(() => {
    getCurrentLocation();
  }, []);

  return (
    <View style={styles.container}>
      {!selectedLocation ? (
        <>
          <Text style={styles.heading}>Select Your Restaurant</Text>
          <FlatList
            data={RESTAURANTS}
            renderItem={renderRestaurant}
            keyExtractor={(item) => item}
          />
        </>
      ) : (
        <>
          <Text style={styles.subheading}>Restaurant: {selectedLocation}</Text>
          <View style={styles.buttonGroup}>
            <Text style={styles.title}>Make sure the full menu is included in the photo for better accuracy</Text>
            <Button title="📷 Take Photo" onPress={takePhoto} />
            <Button title="🖼️ Pick from Gallery" onPress={pickImageFromGallery} />
          </View>
          {image && (
            <>
              <Image source={{ uri: image }} style={styles.preview} />
              <Button title="Upload Image" onPress={uploadImage} />
              <TouchableOpacity onPress={() => setSelectedLocation(null)}>
                <Text style={styles.changeLocation}>Change Restaurant</Text>
              </TouchableOpacity>
            </>
          )}
          {ocrResults.length > 0 && (
            <View style={styles.ocrResults}>
              <Text style={styles.ocrHeading}>OCR Results:</Text>
              {ocrResults.map((result, index) => (
                <Text key={index} style={styles.ocrText}>
                  {result.description}
                </Text>
              ))}
            </View>
          )}
        </>
      )}

      <View style={styles.searchContainer}>
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search for a location"
          style={styles.searchInput}
        />
        <Button title="Search Location" onPress={() => searchLocation(searchQuery)} />
      </View>

      {mapRegion && (
        <MapView style={{ flex: 1 }} region={mapRegion} onRegionChangeComplete={setMapRegion}>
          {location && <Marker coordinate={location} title="Your location" />}
        </MapView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 40 },
  heading: { fontSize: 22, fontWeight: 'bold', marginBottom: 12 },
  subheading: { fontSize: 18, fontWeight: '500', marginBottom: 20 },
  title: { fontSize: 14, fontWeight: '500', marginBottom: 20, textAlign: 'center' },
  restaurantOption: {
    padding: 15,
    backgroundColor: '#eee',
    borderRadius: 10,
    marginBottom: 10,
  },
  selectedRestaurant: {
    backgroundColor: '#007AFF',
  },
  restaurantText: {
    fontSize: 16,
    color: '#000',
  },
  preview: { width: '100%', height: 300, marginTop: 20, borderRadius: 12 },
  changeLocation: {
    marginTop: 15,
    color: '#007AFF',
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
  buttonGroup: {
    gap: 10,
    marginBottom: 15,
  },
  ocrResults: {
    marginTop: 20,
  },
  ocrHeading: {
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 10,
  },
  ocrText: {
    fontSize: 16,
  },
  searchContainer: {
    marginTop: 20,
    marginBottom: 20,
  },
  searchInput: {
    padding: 10,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 10,
  },
});
