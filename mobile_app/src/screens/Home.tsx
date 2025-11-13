import { Text, View } from 'react-native';

export default function Home() {
  return (
    <View className="flex-1 items-center justify-center bg-white dark:bg-black">
      <Text className="text-3xl font-extrabold text-black dark:text-white">
        Diet is Body
      </Text>
      <Text className="mt-2 text-base text-zinc-600 dark:text-zinc-300">
        NativeWind + React Native setup complete
      </Text>
    </View>
  );
}
