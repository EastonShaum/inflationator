import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useQuery } from '@tanstack/react-query';

type VisionData = {
  _id: string;
  imageBase64: string;
  textAnnotations: string[];
  restaurantName: string[];
  timestamp: string;
};

const fetchMenus = async (): Promise<VisionData[]> => {
  const res = await fetch('http://192.168.1.101:3000/menus');
  if (!res.ok) throw new Error('Network response was not ok');
  return res.json();
};

export default function Explore() {
  const {
    data: menus,
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['menus'],
    queryFn: fetchMenus,
  });

  if (isLoading) return <Text>Loading...</Text>;
  if (error) return <Text>Error loading menus</Text>;

  return (
    <FlatList
      data={menus}
      keyExtractor={(item) => item._id}
      contentContainerStyle={styles.list}
      refreshing={isRefetching}
      onRefresh={refetch}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <Text style={styles.title}>
            {item.restaurantName?.[0] ?? 'Unnamed Restaurant'}
          </Text>
          <Text style={styles.subtitle}>
            {item.textAnnotations?.[0] ?? 'No text found'}
          </Text>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
});