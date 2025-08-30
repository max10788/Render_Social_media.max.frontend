'use client';

/**
 * Sichere Initialisierung des Ethereum Providers
 * Vermeidet Konflikte mit bereits existierenden Providern
 */
class EthereumProviderManager {
  constructor() {
    this.initialized = false;
    this.provider = null;
  }

  /**
   * Prüft, ob bereits ein Ethereum Provider existiert
   * @returns {boolean} True, wenn ein Provider existiert
   */
  hasExistingProvider() {
    return typeof window !== 'undefined' && window.ethereum;
  }

  /**
   * Gibt den vorhandenen Provider zurück, falls vorhanden
   * @returns {Object|null} Der vorhandene Provider oder null
   */
  getExistingProvider() {
    if (this.hasExistingProvider()) {
      console.log('[Ethereum Provider] Existing provider detected:', {
        isMetaMask: window.ethereum.isMetaMask,
        request: typeof window.ethereum.request === 'function',
        on: typeof window.ethereum.on === 'function',
        removeListener: typeof window.ethereum.removeListener === 'function'
      });
      return window.ethereum;
    }
    return null;
  }

  /**
   * Versucht, einen neuen Provider zu definieren, falls keiner existiert
   * @returns {Object|null} Der Provider oder null bei Fehler
   */
  defineNewProvider() {
    if (typeof window === 'undefined') return null;
    
    // Prüfen, ob bereits ein Provider existiert
    if (this.hasExistingProvider()) {
      return this.getExistingProvider();
    }

    try {
      // Prüfen, ob die Eigenschaft überschrieben werden kann
      const descriptor = Object.getOwnPropertyDescriptor(window, 'ethereum');
      
      if (descriptor && !descriptor.configurable) {
        console.warn('[Ethereum Provider] Cannot redefine ethereum property - it is not configurable');
        return null;
      }

      // Erstellen eines Mock-Providers für Entwicklungszwecke
      const mockProvider = {
        isMetaMask: false,
        request: async ({ method, params }) => {
          console.warn(`[Mock Provider] Method ${method} called with params:`, params);
          throw new Error('Mock provider does not implement real functionality');
        },
        on: (event, callback) => {
          console.warn(`[Mock Provider] Event listener for ${event} registered`);
        },
        removeListener: (event, callback) => {
          console.warn(`[Mock Provider] Event listener for ${event} removed`);
        }
      };

      // Versuchen, den Provider zu definieren
      Object.defineProperty(window, 'ethereum', {
        value: mockProvider,
        configurable: true,
        writable: true,
        enumerable: true
      });

      console.log('[Ethereum Provider] Mock provider created successfully');
      return mockProvider;
    } catch (error) {
      console.error('[Ethereum Provider] Error defining provider:', error);
      return null;
    }
  }

  /**
   * Initialisiert den Provider und gibt ihn zurück
   * @returns {Object|null} Der initialisierte Provider oder null
   */
  async initialize() {
    if (this.initialized) {
      return this.provider;
    }

    // Zuerst prüfen, ob bereits ein Provider existiert
    this.provider = this.getExistingProvider();
    
    // Wenn kein Provider existiert, versuchen wir, einen zu erstellen
    if (!this.provider) {
      this.provider = this.defineNewProvider();
    }

    this.initialized = true;
    return this.provider;
  }
}

// Singleton-Instanz erstellen
const ethereumProviderManager = new EthereumProviderManager();

export default ethereumProviderManager;
