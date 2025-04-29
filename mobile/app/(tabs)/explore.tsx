import { View, Text } from 'react-native';
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
  const { data: menus, isLoading, error } = useQuery({
    queryKey: ['menus'],
    queryFn: fetchMenus,
  });

  if (isLoading) return <Text>Loading...</Text>;
  if (error) return <Text>Error loading menus</Text>;

  return (
    <View>
      {menus?.map((item) => (
        <View key={item._id}>
          <Text>{item.restaurantName?.[0] ?? 'Unnamed Restaurant'}</Text>
          <Text>{item.textAnnotations?.[0] ?? 'No text detected'}</Text>
        </View>
      ))}
    </View>
  );
}