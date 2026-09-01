/**
 * App-level AniList OAuth client — SITE OWNER setup, end users never see this.
 *
 * Register once at https://anilist.co/settings/developer:
 *   Name:         AniMatch
 *   Redirect URL: https://<your-domain>/auth/callback
 * then paste the client ID here and redeploy. From that point "Connect AniList"
 * is a single click: approve on AniList, land back signed in.
 *
 * The ID is public by design (implicit grant, no secret). For local development
 * against a second client, override it per-browser via
 * localStorage.setItem('animatch.clientId', '<dev id>').
 */
export const ANILIST_CLIENT_ID = '';

/** Well-known public profiles used for "try it live" sample links. */
export const SAMPLE_PAIR = { a: 'Anime', b: 'Kira' };
export const SAMPLE_GROUP = ['Anime', 'Kira', 'akirakira', 'yuki'];
