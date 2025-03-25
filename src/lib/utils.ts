// Bootstrap utility function to combine class names
export function combineClasses(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
}

// Simple "encryption" for sensitive data - this is not secure production encryption but adds a layer of obfuscation
// In a real production app, you would want to use a proper encryption library or service
export function encryptData(data: string): string {
  if (!data) return '';
  
  // Simple Base64 encoding with a prefix to identify encrypted data
  return `JENKINS_INSIGHTS_ENC:${btoa(data)}`;
}

export function decryptData(data: string): string {
  if (!data || !data.startsWith('JENKINS_INSIGHTS_ENC:')) return data;
  
  try {
    // Remove prefix and decode Base64
    return atob(data.substring(19));
  } catch (e) {
    console.error('Failed to decrypt data:', e);
    return '';
  }
}

// Mask sensitive information in logs and display
export function maskSensitiveData(text: string): string {
  if (!text) return '';
  
  // Mask common patterns that might contain sensitive information
  return text
    .replace(/password=['"][^'"]*['"]?/gi, 'password="****"')
    .replace(/token=['"][^'"]*['"]?/gi, 'token="****"')
    .replace(/key=['"][^'"]*['"]?/gi, 'key="****"')
    .replace(/secret=['"][^'"]*['"]?/gi, 'secret="****"')
    .replace(/credential=['"][^'"]*['"]?/gi, 'credential="****"')
    .replace(/authorization:\s*bearer\s+[^\s]+/gi, 'Authorization: Bearer ****');
}

// Safe JSON parser with error handling
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T;
  } catch (e) {
    console.error('Failed to parse JSON:', e);
    return fallback;
  }
}

// Format duration in a human-readable format (e.g., "2h 30m 15s")
export function formatDuration(milliseconds: number): string {
  if (!milliseconds) return '0s';
  
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  const remainingMinutes = minutes % 60;
  const remainingSeconds = seconds % 60;
  
  let result = '';
  if (hours > 0) result += `${hours}h `;
  if (remainingMinutes > 0 || hours > 0) result += `${remainingMinutes}m `;
  result += `${remainingSeconds}s`;
  
  return result;
}

// Format date in a consistent way
export function formatDate(timestamp: number): string {
  if (!timestamp) return 'N/A';
  
  return new Date(timestamp).toLocaleString();
}
