import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Progress, best scores and settings live on the phone.
export async function load(key, fallback) {
  try {
    const v = await AsyncStorage.getItem('cr_' + key);
    return v == null ? fallback : JSON.parse(v);
  } catch {
    return fallback;
  }
}

export async function save(key, value) {
  try {
    await AsyncStorage.setItem('cr_' + key, JSON.stringify(value));
  } catch {}
}

// The Anthropic API key goes in the phone's secure storage (Keychain / Keystore).
const KEY = 'anthropic_api_key';
const secureAvailable = Platform.OS !== 'web';

export async function getApiKey() {
  try {
    return secureAvailable ? await SecureStore.getItemAsync(KEY) : await AsyncStorage.getItem(KEY);
  } catch {
    return null;
  }
}

const keyListeners = new Set();
export function onKeyChange(fn) {
  keyListeners.add(fn);
  return () => keyListeners.delete(fn);
}

export async function setApiKey(value) {
  if (secureAvailable) await SecureStore.setItemAsync(KEY, value);
  else await AsyncStorage.setItem(KEY, value);
  keyListeners.forEach((fn) => fn(value));
}

export async function removeApiKey() {
  if (secureAvailable) await SecureStore.deleteItemAsync(KEY);
  else await AsyncStorage.removeItem(KEY);
  keyListeners.forEach((fn) => fn(null));
}
