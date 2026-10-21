import { QueryClient } from '@tanstack/react-query';


export const queryClientInstance = new QueryClient({
	defaultOptions: {
		queries: {
			refetchOnWindowFocus: false,
			retry: 1,
		},
	},
});
// Shared query keys so every page reads the same cached settings/catalogue instead of refetching.
export const appQueryKeys = {
	settings: ['app-settings'],
	experiments: ['experiment-templates'],
};
