import MD5 from 'crypto-js/md5'

/**
 * Berechnet den MD5-Hash einer E-Mail-Adresse für Gravatar
 */
export function getGravatarHash(email: string): string {
  const normalizedEmail = email.trim().toLowerCase()
  return MD5(normalizedEmail).toString()
}

/**
 * Generiert eine Gravatar-URL basierend auf der E-Mail-Adresse
 * 
 * @param email - E-Mail-Adresse des Nutzers
 * @param size - Größe des Avatars in Pixeln (Standard: 80)
 * @param defaultImage - Fallback-Bild wenn kein Gravatar vorhanden (Standard: "404")
 * @param rating - Maximale Bewertung des Bildes (Standard: "g" für allgemein)
 * @returns Gravatar-URL
 */
export function getGravatarUrl(
  email: string,
  size: number = 80,
  defaultImage: string = '404',
  rating: string = 'g'
): string {
  const hash = getGravatarHash(email)
  const params = new URLSearchParams({
    s: size.toString(),
    d: defaultImage,
    r: rating
  })
  
  return `https://www.gravatar.com/avatar/${hash}?${params.toString()}`
}

