import { Injectable, computed, signal } from '@angular/core';

export interface ViewerIdentity {
  id: number;
  name: string;
  avatar: string | null;
}

/**
 * AniList OAuth, implicit grant — the right fit for a backend-less SPA.
 * Register a client at https://anilist.co/settings/developer with this app's
 * URL as the redirect URI (e.g. https://your-app.vercel.app/auth/callback),
 * then either set DEFAULT_CLIENT_ID at build time or paste the ID into the
 * profile page at runtime (persisted to localStorage).
 */
const DEFAULT_CLIENT_ID = '';

const TOKEN_KEY = 'animatch.token';
const EXPIRY_KEY = 'animatch.tokenExpiry';
const CLIENT_ID_KEY = 'animatch.clientId';

@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly token = signal<string | null>(this.readStoredToken());
  readonly connected = computed(() => this.token() !== null);
  /** Populated by the app shell once the token is verified against AniList. */
  readonly viewer = signal<ViewerIdentity | null>(null);

  readonly clientId = signal<string>(localStorage.getItem(CLIENT_ID_KEY) || DEFAULT_CLIENT_ID);
  readonly configured = computed(() => this.clientId().trim().length > 0);

  private readStoredToken(): string | null {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return null;
    const expiry = Number(localStorage.getItem(EXPIRY_KEY) ?? 0);
    if (expiry && Date.now() > expiry) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(EXPIRY_KEY);
      return null;
    }
    return token;
  }

  setClientId(id: string) {
    const trimmed = id.trim();
    this.clientId.set(trimmed);
    if (trimmed) localStorage.setItem(CLIENT_ID_KEY, trimmed);
    else localStorage.removeItem(CLIENT_ID_KEY);
  }

  authorizeUrl(): string {
    return `https://anilist.co/api/v2/oauth/authorize?client_id=${encodeURIComponent(this.clientId())}&response_type=token`;
  }

  /** Redirect to AniList's consent screen. Returns false when unconfigured. */
  login(): boolean {
    if (!this.configured()) return false;
    window.location.href = this.authorizeUrl();
    return true;
  }

  /**
   * Parse the implicit-grant fragment (#access_token=…&expires_in=…) that
   * AniList appends to the redirect URI. Returns true when a token landed.
   */
  handleCallback(fragment: string): boolean {
    const params = new URLSearchParams(fragment.replace(/^#/, ''));
    const token = params.get('access_token');
    if (!token) return false;
    const expiresIn = Number(params.get('expires_in') ?? 0);
    localStorage.setItem(TOKEN_KEY, token);
    if (expiresIn > 0) {
      localStorage.setItem(EXPIRY_KEY, String(Date.now() + expiresIn * 1000));
    } else {
      localStorage.removeItem(EXPIRY_KEY);
    }
    this.token.set(token);
    return true;
  }

  logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(EXPIRY_KEY);
    this.token.set(null);
    this.viewer.set(null);
  }
}
