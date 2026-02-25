import { Redirect } from 'expo-router';

export default function Index() {
    // Start at splash screen, which then flows to get-started → auth
    return <Redirect href="/splash" />;
}
