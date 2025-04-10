import { useState } from 'react';
import {
  View,
  Button,
  Image,
  StyleSheet,
  Alert,
  Text,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';

const RESTAURANTS = [
  "McDonald's",
  'Burger King',
  'Chick-fil-A',
  'Taco Bell',
  'Subway',
];

export default function UploadScreen() {
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [image, setImage] = useState<string | null>(null);
  const [ocrResults, setOcrResults] = useState<any[]>([]);

  const requestPermissions = async () => {
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    const { status: mediaStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (cameraStatus !== 'granted' || mediaStatus !== 'granted') {
      Alert.alert('Permissions required', 'Camera and media permissions are needed.');
      return false;
    }
    return true;
  };

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
  
  const [apiResponse, setApiResponse] = useState(null);
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
          location: selectedLocation,
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
      console.log('data', data)
    } catch (error: any) {
      console.error('Upload failed:', error);
      Alert.alert('Upload failed', error.message || 'Unknown error');
    }
  };

  const renderRestaurant = ({ item }: { item: string }) => (
    <TouchableOpacity
      style={[
        styles.restaurantOption,
        selectedLocation === item && styles.selectedRestaurant,
      ]}
      onPress={() => setSelectedLocation(item)}
    >
      <Text style={styles.restaurantText}>{item}</Text>
    </TouchableOpacity>
  );

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
});
