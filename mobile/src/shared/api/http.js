import { Platform } from "react-native";
import Constants from "expo-constants";

export function getApiBaseUrl() {
  const envUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
  if (envUrl) {
    return envUrl.replace(/\/+$/, "");
  }

  const extraUrl = Constants.expoConfig?.extra?.apiBaseUrl?.trim();
  if (extraUrl) {
    return extraUrl.replace(/\/+$/, "");
  }

  if (Platform.OS === "android") {
    return "http://10.0.2.2:9090";
  }

  return "http://localhost:9090";
}

export async function request(path, options = {}) {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
    ...options,
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(errorBody || `Request failed with status ${response.status}`);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export { getApiBaseUrl };

