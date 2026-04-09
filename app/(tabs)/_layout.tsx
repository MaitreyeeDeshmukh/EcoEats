// app/(tabs)/_layout.tsx
import { Tabs } from "expo-router";
import {
	ClipboardText,
	House,
	Leaf,
	MapPin,
	Plus,
	User,
} from "phosphor-react-native";

export default function TabsLayout() {
	return (
		<Tabs
			screenOptions={{
				headerShown: false,
				tabBarActiveTintColor: "#1B4332",
				tabBarInactiveTintColor: "#6B7280",
				tabBarStyle: {
					backgroundColor: "#F8F6F0",
					borderTopWidth: 1,
					borderTopColor: "#E5E7EB",
					paddingBottom: 8,
					paddingTop: 8,
					height: 60,
				},
				tabBarLabelStyle: {
					fontFamily: "DM Sans",
					fontSize: 11,
					fontWeight: "500",
				},
			}}
		>
			<Tabs.Screen
				name="index"
				options={{
					title: "Feed",
					tabBarIcon: ({ color, size }) => <House size={size} color={color} />,
				}}
			/>
			<Tabs.Screen
				name="map"
				options={{
					title: "Map",
					tabBarIcon: ({ color, size }) => <MapPin size={size} color={color} />,
				}}
			/>
			<Tabs.Screen
				name="post"
				options={{
					title: "Post",
					tabBarIcon: ({ color, size }) => <Plus size={size} color={color} />,
				}}
			/>
			<Tabs.Screen
				name="claims"
				options={{
					title: "Claims",
					tabBarIcon: ({ color, size }) => (
						<ClipboardText size={size} color={color} />
					),
				}}
			/>
			<Tabs.Screen
				name="impact"
				options={{
					title: "Impact",
					tabBarIcon: ({ color, size }) => <Leaf size={size} color={color} />,
				}}
			/>
			<Tabs.Screen
				name="profile"
				options={{
					title: "Profile",
					tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
				}}
			/>
		</Tabs>
	);
}
