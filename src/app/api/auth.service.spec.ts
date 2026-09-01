import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
  });

  it('parses the implicit-grant fragment and stores the token', () => {
    const auth = TestBed.inject(AuthService);
    expect(auth.handleCallback('#access_token=abc123&token_type=Bearer&expires_in=31536000')).toBe(true);
    expect(auth.token()).toBe('abc123');
    expect(auth.connected()).toBe(true);
    expect(localStorage.getItem('animatch.token')).toBe('abc123');
  });

  it('rejects a fragment without a token', () => {
    const auth = TestBed.inject(AuthService);
    expect(auth.handleCallback('#error=access_denied')).toBe(false);
    expect(auth.connected()).toBe(false);
  });

  it('drops expired tokens on startup', () => {
    localStorage.setItem('animatch.token', 'stale');
    localStorage.setItem('animatch.tokenExpiry', String(Date.now() - 1000));
    const auth = TestBed.inject(AuthService);
    expect(auth.token()).toBeNull();
    expect(localStorage.getItem('animatch.token')).toBeNull();
  });

  it('logout clears the session', () => {
    const auth = TestBed.inject(AuthService);
    auth.handleCallback('#access_token=abc123');
    auth.logout();
    expect(auth.connected()).toBe(false);
    expect(localStorage.getItem('animatch.token')).toBeNull();
  });

  it('ships configured with the app client id', () => {
    const auth = TestBed.inject(AuthService);
    expect(auth.configured()).toBe(true);
    expect(auth.authorizeUrl()).toContain('client_id=49943');
    expect(auth.authorizeUrl()).toContain('response_type=token');
  });

  it('refuses login when the client id is cleared, and accepts overrides', () => {
    const auth = TestBed.inject(AuthService);
    auth.setClientId('');
    expect(auth.configured()).toBe(false);
    expect(auth.login()).toBe(false);
    auth.setClientId(' 4242 ');
    expect(auth.configured()).toBe(true);
    expect(auth.authorizeUrl()).toContain('client_id=4242');
  });
});
