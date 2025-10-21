export type ResourceRecord = Record<string, unknown>;

interface InitOptions {
  resources: Record<string, Record<string, ResourceRecord>>;
  fallbackLng: string;
  debug?: boolean;
  ns?: string[];
  defaultNS?: string;
  detection?: Record<string, unknown>;
  interpolation?: Record<string, unknown>;
}

type Plugin = {
  type: string;
  init?: (services: unknown, i18n: I18nShim, options?: Record<string, unknown>) => void;
  detect?: () => string | undefined;
};

type Listener = () => void;

class I18nShim {
  private plugins: Plugin[] = [];
  public language: string;
  public options: InitOptions | null = null;
  public resources: Record<string, Record<string, ResourceRecord>> = {};
  private listeners: Set<Listener> = new Set();

  constructor() {
    this.language = 'en';
  }

  public use(plugin: Plugin): I18nShim {
    this.plugins.push(plugin);
    return this;
  }

  public init(options: InitOptions): I18nShim {
    this.options = options;
    this.resources = options.resources;
    this.language = this.detectLanguage(options.fallbackLng);

    for (const plugin of this.plugins) {
      plugin.init?.({}, this, options.detection);
    }

    return this;
  }

  private detectLanguage(fallback: string): string {
    const detector = this.plugins.find((plugin) => plugin.type === 'languageDetector');
    const detected = detector && typeof detector.detect === 'function'
      ? detector.detect()
      : undefined;
    return detected || fallback;
  }

  public changeLanguage(language: string): Promise<void> {
    this.language = language;
    this.listeners.forEach((listener) => listener());
    return Promise.resolve();
  }

  public on(event: 'languageChanged', listener: Listener): void {
    if (event === 'languageChanged') {
      this.listeners.add(listener);
    }
  }

  public off(event: 'languageChanged', listener: Listener): void {
    if (event === 'languageChanged') {
      this.listeners.delete(listener);
    }
  }

  public t(key: string, options?: Record<string, unknown>): string {
    const namespaceSeparator = ':';
    const keySeparator = '.';

    const [nsPath, keyPath] = key.includes(namespaceSeparator)
      ? key.split(namespaceSeparator)
      : [this.options?.defaultNS ?? 'common', key];

    const segments = keyPath.split(keySeparator);
    const namespaceSegments = nsPath.split(keySeparator);

    const resource = this.resources[this.language] ?? this.resources[this.options?.fallbackLng ?? 'en'] ?? {};

    let current: unknown = resource;
    for (const segment of namespaceSegments) {
      if (typeof current === 'object' && current && segment in (current as Record<string, unknown>)) {
        current = (current as Record<string, unknown>)[segment];
      }
    }

    for (const segment of segments) {
      if (typeof current === 'object' && current && segment in (current as Record<string, unknown>)) {
        current = (current as Record<string, unknown>)[segment];
      } else {
        return typeof options?.defaultValue === 'string' ? options.defaultValue : key;
      }
    }

    if (typeof current === 'string') {
      return current;
    }

    return typeof options?.defaultValue === 'string' ? options.defaultValue : key;
  }
}

const i18n = new I18nShim();

export default i18n;
export type I18nInstance = I18nShim;
