// lib/utils.ts
// Utility helpers

/**
 * cn — conditional className joiner (minimal, no external dependency)
 */
export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ')
}

/**
 * Generate a random unique ID
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

/**
 * Format timestamp to HH:MM
 */
export function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString('th-TH', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Convert a File object to base64 string (data portion only, no prefix)
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      // Remove data:image/...;base64, prefix
      const base64 = result.split(',')[1]
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
