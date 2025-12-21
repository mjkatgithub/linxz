import { createLogger } from '~/lib/logger'
import { privacyContact } from '~/config/privacy'

const log = createLogger('api')

/**
 * API-Endpunkt für Kontaktdaten der Datenschutzerklärung
 * Diese Werte werden aus config/privacy.ts gelesen
 */
export default defineEventHandler((event) => {
  try {
    log.info('Privacy contact data loaded', { 
      name: privacyContact.name.substring(0, 15) + '...',
      email: privacyContact.email.substring(0, 15) + '...'
    })
    
    return {
      name: privacyContact.name,
      address: privacyContact.address,
      email: privacyContact.email
    }
  } catch (error) {
    log.error('Error fetching privacy contact data', { 
      error: (error as Error).message 
    })
    
    return {
      name: '[Ihr Name]',
      address: '[Ihre Adresse]',
      email: '[Ihre E-Mail-Adresse]'
    }
  }
})

