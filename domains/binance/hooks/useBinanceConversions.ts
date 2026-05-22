export function useConversionQuote() {
  return { data: null, isLoading: false };
}

export function useCreateConversion() {
  return { mutateAsync: async (data: any) => data };
}

export function useBinanceConversions() {
  return { data: [], isLoading: false };
}
