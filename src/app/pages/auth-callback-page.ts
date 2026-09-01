import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../api/auth.service';

/** Landing spot for AniList's implicit-grant redirect (#access_token=…). */
@Component({
  selector: 'app-auth-callback-page',
  template: `
    <div class="wrap">
      <p>{{ message }}</p>
    </div>
  `,
  styles: `
    .wrap { max-width: 1120px; margin: 0 auto; padding: 40px 16px; font-size: var(--text-md); color: var(--color-text-secondary); }
  `,
})
export class AuthCallbackPage {
  message = 'Connecting your AniList account…';

  constructor() {
    const auth = inject(AuthService);
    const router = inject(Router);
    if (auth.handleCallback(window.location.hash)) {
      void router.navigate(['/profile'], { replaceUrl: true });
    } else {
      this.message = 'No AniList token found in the redirect — try connecting again.';
    }
  }
}
