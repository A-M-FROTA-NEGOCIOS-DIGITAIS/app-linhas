type ClassValue = string | undefined | null | false | Record<string, boolean>

export function cn(...inputs: ClassValue[]): string {
  return inputs
    .flatMap((input) => {
      if (!input) return []
      if (typeof input === 'string') return [input]
      return Object.entries(input)
        .filter(([, v]) => v)
        .map(([k]) => k)
    })
    .join(' ')
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

export function calculateAge(birthDate: string): number {
  const today = new Date()
  const birth = new Date(birthDate)
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age
}

export function getMoonPhase(): string {
  const now = new Date()
  const lp = 2551443
  const newMoon = new Date(1970, 0, 7, 20, 35, 0)
  const phase = ((now.getTime() - newMoon.getTime()) / 1000) % lp
  const age = Math.floor(phase / (24 * 3600))
  if (age < 2) return 'New Moon'
  if (age < 7) return 'Waxing Crescent'
  if (age < 10) return 'First Quarter'
  if (age < 15) return 'Waxing Gibbous'
  if (age < 17) return 'Full Moon'
  if (age < 22) return 'Waning Gibbous'
  if (age < 26) return 'Last Quarter'
  return 'Waning Crescent'
}

export function getZodiacSign(date: string): string {
  const d = new Date(date)
  const m = d.getMonth() + 1
  const day = d.getDate()
  if ((m === 3 && day >= 21) || (m === 4 && day <= 19)) return 'Aries'
  if ((m === 4 && day >= 20) || (m === 5 && day <= 20)) return 'Taurus'
  if ((m === 5 && day >= 21) || (m === 6 && day <= 20)) return 'Gemini'
  if ((m === 6 && day >= 21) || (m === 7 && day <= 22)) return 'Cancer'
  if ((m === 7 && day >= 23) || (m === 8 && day <= 22)) return 'Leo'
  if ((m === 8 && day >= 23) || (m === 9 && day <= 22)) return 'Virgo'
  if ((m === 9 && day >= 23) || (m === 10 && day <= 22)) return 'Libra'
  if ((m === 10 && day >= 23) || (m === 11 && day <= 21)) return 'Scorpio'
  if ((m === 11 && day >= 22) || (m === 12 && day <= 21)) return 'Sagittarius'
  if ((m === 12 && day >= 22) || (m === 1 && day <= 19)) return 'Capricorn'
  if ((m === 1 && day >= 20) || (m === 2 && day <= 18)) return 'Aquarius'
  return 'Pisces'
}

export function compressImage(file: File, maxSize = 1024, quality = 0.85): Promise<string> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      let { width, height } = img
      if (width > maxSize || height > maxSize) {
        if (width > height) { height = (height / width) * maxSize; width = maxSize }
        else { width = (width / height) * maxSize; height = maxSize }
      }
      canvas.width = width
      canvas.height = height
      canvas.getContext('2d')!.drawImage(img, 0, 0, width, height)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/jpeg', quality))
    }
    img.onerror = reject
    img.src = url
  })
}
