import React, { useEffect, useState } from 'react';
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

const Explore = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Replace with your API URL
    const fetchData = async () => {
      try {
        const response = await fetch('http://192.168.1.101:3000/data');
        const result = await response.json();
        setData(result);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <Text>Loading...</Text>;

  return (
    <View>
      {data.map((item) => (
        <Text key={item.id}>{item.name}</Text>
      ))}
    </View>
  );
};

export default Explore;