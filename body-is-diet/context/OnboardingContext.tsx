import { createContext, useContext, useState } from 'react';
import { UserPreferences } from '../types';
import { userApi } from '../services/api';

type OnboardingData = Partial<UserPreferences>;

type OnboardingContextType = {
    data: OnboardingData;
    update: (patch: Partial<OnboardingData>) => void;
    submit: () => Promise<void>;
};

const OnboardingContext = createContext<OnboardingContextType | null>(null);

export function useOnboarding() {
    const ctx = useContext(OnboardingContext);
    if (!ctx) throw new Error('useOnboarding must be used inside OnboardingProvider');
    return ctx;
}

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
    const [data, setData] = useState<OnboardingData>({});

    const update = (patch: Partial<OnboardingData>) =>
        setData((prev) => ({ ...prev, ...patch }));

    const submit = async () => {
        await userApi.savePreferences(data as UserPreferences);
    };

    return (
        <OnboardingContext.Provider value={{ data, update, submit }}>
            {children}
        </OnboardingContext.Provider>
    );
}
