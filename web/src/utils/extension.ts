import {
  type AxiosInstance,
  type ExtAxiosConfig,
  type User,
  getEventBus,
  getExtAxios,
  getExtension,
  getNsForTranslation,
  getReduxStore,
  getTheme,
  getUser,
  injectReducers,
  registerTranslation,
  toast
} from '@cloudscaile-eng/web-ext-utils';
import type { Theme } from '@mui/material/styles';
import type { Store } from 'redux';
import { APP_CONFIG } from './appConfig';

// Type for extension object returned by getExtension
type Extension = ReturnType<typeof getExtension>;

// Type for event bus returned by getEventBus
type EventBus = ReturnType<typeof getEventBus>;

class ExtensionManager {
  private extension: Extension;

  constructor(tenant: string, name: string) {
    this.extension = getExtension(tenant, name);
  }

  getExtAxios(config: ExtAxiosConfig = {}): AxiosInstance {
    return getExtAxios(this.extension, { ...config, type: 'py' });
  }

  getEventBus(): EventBus {
    return getEventBus(this.extension);
  }

  getNsForTranslation(ns: string): string {
    return getNsForTranslation(this.extension, ns);
  }

  getReduxStore(): Store {
    return getReduxStore(this.extension);
  }

  getTheme(): Theme {
    return getTheme(this.extension);
  }

  registerTranslation(ns: string, translation: Record<string, unknown>): void {
    registerTranslation(this.extension, { ns, translation });
  }

  toast(message: string, type: 'info' | 'success' | 'error' = 'info'): void {
    toast(this.extension, message, type as Parameters<typeof toast>[2]);
  }

  injectReducers(
    reducers: Record<string, unknown> = {},
    replace: string[] = [],
    whitelist: string[] = []
  ): void {
    injectReducers(this.extension, { reducers, replace, whitelist });
  }

  getUser(): User {
    return getUser(this.extension);
  }
}

export default ExtensionManager;
export const extensionManager = new ExtensionManager(
  APP_CONFIG.TENANT_NAME,
  APP_CONFIG.EXTENSION_NAME
);
