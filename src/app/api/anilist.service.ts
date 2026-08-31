import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

const ANILIST_GRAPHQL = 'https://graphql.anilist.co';

export interface AnimeEntry {
  mediaId: number;
  title: string;
  /** 0–10 scale (POINT_10_DECIMAL); null when the user left it unscored */
  score: number | null;
  genres: string[];
  studios: string[];
  format: string | null;
  year: number | null;
  cover: string | null;
  episodes: number | null;
}

export interface AnilistUserList {
  id: number;
  name: string;
  avatar: string | null;
  entries: AnimeEntry[];
}

const COMPLETED_LIST_QUERY = `
query ($name: String) {
  MediaListCollection(userName: $name, type: ANIME, status: COMPLETED) {
    user { id name avatar { medium } }
    lists {
      isCustomList
      entries {
        score(format: POINT_10_DECIMAL)
        media {
          id
          title { userPreferred }
          format
          seasonYear
          episodes
          genres
          coverImage { medium }
          studios(isMain: true) { nodes { name } }
        }
      }
    }
  }
}`;

interface GqlMedia {
  id: number;
  title: { userPreferred: string };
  format: string | null;
  seasonYear: number | null;
  episodes: number | null;
  genres: string[];
  coverImage: { medium: string | null } | null;
  studios: { nodes: { name: string }[] } | null;
}

interface GqlResponse {
  data: {
    MediaListCollection: {
      user: { id: number; name: string; avatar: { medium: string | null } | null };
      lists: { isCustomList: boolean; entries: { score: number; media: GqlMedia }[] }[];
    } | null;
  } | null;
  errors?: { message: string }[];
}

@Injectable({ providedIn: 'root' })
export class AnilistService {
  private readonly http = inject(HttpClient);

  /** Fetch a user's completed anime list (public data, no auth). */
  async getCompletedList(userName: string): Promise<AnilistUserList> {
    const res = await firstValueFrom(
      this.http.post<GqlResponse>(ANILIST_GRAPHQL, {
        query: COMPLETED_LIST_QUERY,
        variables: { name: userName.trim() },
      }),
    ).catch((err) => {
      const message: string = err?.error?.errors?.[0]?.message ?? '';
      if (message === 'User not found' || err?.status === 404) {
        throw new Error(`AniList user "${userName}" not found`);
      }
      throw new Error(`AniList request failed${message ? ': ' + message : ''}`);
    });

    const collection = res.data?.MediaListCollection;
    if (!collection) {
      throw new Error(res.errors?.[0]?.message ?? `No list data for "${userName}" (private profile?)`);
    }

    const byMediaId = new Map<number, AnimeEntry>();
    for (const list of collection.lists) {
      if (list.isCustomList) continue;
      for (const e of list.entries) {
        const m = e.media;
        if (byMediaId.has(m.id)) continue;
        byMediaId.set(m.id, {
          mediaId: m.id,
          title: m.title.userPreferred,
          score: e.score > 0 ? e.score : null,
          genres: m.genres ?? [],
          studios: (m.studios?.nodes ?? []).map((s) => s.name),
          format: m.format,
          year: m.seasonYear,
          cover: m.coverImage?.medium ?? null,
          episodes: m.episodes,
        });
      }
    }

    return {
      id: collection.user.id,
      name: collection.user.name,
      avatar: collection.user.avatar?.medium ?? null,
      entries: [...byMediaId.values()],
    };
  }
}
