import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

const ANILIST_GRAPHQL = 'https://graphql.anilist.co';

export type EntryStatus = 'CURRENT' | 'PLANNING' | 'COMPLETED' | 'DROPPED' | 'PAUSED' | 'REPEATING';

export interface AnimeEntry {
  mediaId: number;
  title: string;
  status: EntryStatus;
  /** 0–10 scale (POINT_10_DECIMAL); null when the user left it unscored */
  score: number | null;
  /** Episodes watched (relevant for CURRENT entries) */
  progress: number;
  genres: string[];
  studios: string[];
  format: string | null;
  year: number | null;
  cover: string | null;
  episodes: number | null;
  /** AniList site-wide average, 0–100; null for obscure titles */
  averageScore: number | null;
  popularity: number;
}

export interface AnilistUserList {
  id: number;
  name: string;
  avatar: string | null;
  entries: AnimeEntry[];
}

export interface AnilistUserHit {
  id: number;
  name: string;
  avatar: string | null;
  completed: number;
}

const USER_LISTS_QUERY = `
query ($name: String) {
  MediaListCollection(userName: $name, type: ANIME, forceSingleCompletedList: true) {
    user { id name avatar { medium } }
    lists {
      isCustomList
      entries {
        status
        score(format: POINT_10_DECIMAL)
        progress
        media {
          id
          title { userPreferred }
          format
          seasonYear
          episodes
          genres
          popularity
          averageScore
          coverImage { medium }
          studios(isMain: true) { nodes { name } }
        }
      }
    }
  }
}`;

const USER_SEARCH_QUERY = `
query ($search: String) {
  Page(perPage: 6) {
    users(search: $search) {
      id
      name
      avatar { medium }
      statistics { anime { count } }
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
  popularity: number | null;
  averageScore: number | null;
  coverImage: { medium: string | null } | null;
  studios: { nodes: { name: string }[] } | null;
}

interface GqlListsResponse {
  data: {
    MediaListCollection: {
      user: { id: number; name: string; avatar: { medium: string | null } | null };
      lists: {
        isCustomList: boolean;
        entries: { status: EntryStatus; score: number; progress: number | null; media: GqlMedia }[];
      }[];
    } | null;
  } | null;
  errors?: { message: string }[];
}

interface GqlSearchResponse {
  data: {
    Page: {
      users: {
        id: number;
        name: string;
        avatar: { medium: string | null } | null;
        statistics: { anime: { count: number } | null } | null;
      }[];
    } | null;
  } | null;
}

@Injectable({ providedIn: 'root' })
export class AnilistService {
  private readonly http = inject(HttpClient);

  private async gql<T>(query: string, variables: Record<string, unknown>, who: string): Promise<T> {
    return firstValueFrom(this.http.post<T>(ANILIST_GRAPHQL, { query, variables })).catch((err) => {
      const message: string = err?.error?.errors?.[0]?.message ?? '';
      if (message === 'User not found' || err?.status === 404) {
        throw new Error(`AniList user "${who}" not found`);
      }
      throw new Error(`AniList request failed${message ? ': ' + message : ''}`);
    });
  }

  /** Fetch a user's full anime list — every status, public data, no auth. */
  async getUserLists(userName: string): Promise<AnilistUserList> {
    const res = await this.gql<GqlListsResponse>(
      USER_LISTS_QUERY,
      { name: userName.trim() },
      userName,
    );

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
          status: e.status,
          score: e.score > 0 ? e.score : null,
          progress: e.progress ?? 0,
          genres: m.genres ?? [],
          studios: (m.studios?.nodes ?? []).map((s) => s.name),
          format: m.format,
          year: m.seasonYear,
          cover: m.coverImage?.medium ?? null,
          episodes: m.episodes,
          averageScore: m.averageScore,
          popularity: m.popularity ?? 0,
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

  /** Search AniList users by name prefix. */
  async searchUsers(search: string): Promise<AnilistUserHit[]> {
    const res = await this.gql<GqlSearchResponse>(USER_SEARCH_QUERY, { search }, search);
    return (res.data?.Page?.users ?? []).map((u) => ({
      id: u.id,
      name: u.name,
      avatar: u.avatar?.medium ?? null,
      completed: u.statistics?.anime?.count ?? 0,
    }));
  }
}
