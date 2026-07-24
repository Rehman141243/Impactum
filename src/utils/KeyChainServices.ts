// src/utils/keychainService.ts
import * as Keychain from 'react-native-keychain';

const TOKEN_SERVICE = 'com.impactum.auth.tokens';
const BIOMETRIC_SERVICE = 'com.impactum.auth.biometric';

/* ---------------- Tokens (access + refresh) ---------------- */

export async function saveTokens(accessToken: string, refreshToken: string) {
  await Keychain.setGenericPassword(
    'tokens',
    JSON.stringify({ accessToken, refreshToken }),
    {
      service: TOKEN_SERVICE,
      accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    },
  );
}

export async function getTokens(): Promise<{ accessToken: string; refreshToken: string } | null> {
  try {
    const result = await Keychain.getGenericPassword({ service: TOKEN_SERVICE });
    if (!result) return null;
    return JSON.parse(result.password);
  } catch {
    return null;
  }
}

export async function clearTokens() {
  await Keychain.resetGenericPassword({ service: TOKEN_SERVICE });
}


export async function isBiometricAvailable(): Promise<boolean> {
  const type = await Keychain.getSupportedBiometryType();
  return type !== null;
}

export async function getBiometryTypeLabel(): Promise<string> {
  const type = await Keychain.getSupportedBiometryType();
  if (type === Keychain.BIOMETRY_TYPE.FACE_ID) return 'Face ID';
  if (type === Keychain.BIOMETRY_TYPE.TOUCH_ID) return 'Touch ID';
  if (type === Keychain.BIOMETRY_TYPE.FINGERPRINT) return 'Fingerprint';
  if (type === Keychain.BIOMETRY_TYPE.FACE) return 'Face Unlock';
  if (type === Keychain.BIOMETRY_TYPE.IRIS) return 'Iris Scan';
  return 'Biometrics';
}

export async function saveBiometricCredentials(email: string, password: string) {
  await Keychain.setGenericPassword(email, password, {
    service: BIOMETRIC_SERVICE,
    accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_CURRENT_SET,
    accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
}

export async function hasBiometricCredentials(): Promise<boolean> {
  try {
    const result = await Keychain.hasGenericPassword({ service: BIOMETRIC_SERVICE });
    return !!result;
  } catch {
    return false;
  }
}

export async function getBiometricCredentials(
  promptTitle = 'Log in',
): Promise<{ email: string; password: string } | null> {
  try {
    const result = await Keychain.getGenericPassword({
      service: BIOMETRIC_SERVICE,
      authenticationPrompt: { title: promptTitle },
    });
    if (!result) return null;
    return { email: result.username, password: result.password };
  } catch {
    return null; // cancel ya fail hone par yahan aayega
  }
}

export async function clearBiometricCredentials() {
  await Keychain.resetGenericPassword({ service: BIOMETRIC_SERVICE });
}