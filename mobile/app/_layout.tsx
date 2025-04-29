import { Stack } from "expo-router";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../app/lib/react-query';

export default function Layout() {
  return (
    <QueryClientProvider client={queryClient}>
      <Stack />;
    </QueryClientProvider>
  );
}