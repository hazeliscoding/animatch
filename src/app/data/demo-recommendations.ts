// Demo state for the Recommendations page, styled after the design's data.

import { RecommendationView } from '../logic/recommendation-engine';

export const DEMO_RECOMMENDATIONS: RecommendationView[] = [
  {
    title: 'Monster',
    meta: 'TV · 2004 · 74 ep',
    genres: 'Mystery / Thriller / Drama',
    cover: null,
    predicted: 9.1,
    avg: 87,
    reason: "Fits both users' Thriller taste",
  },
  {
    title: 'Ping Pong the Animation',
    meta: 'TV · 2014 · 11 ep',
    genres: 'Sports / Drama',
    cover: null,
    predicted: 8.8,
    avg: 84,
    reason: 'Loved site-wide · 84/100',
  },
  {
    title: 'The Tatami Galaxy',
    meta: 'TV · 2010 · 11 ep',
    genres: 'Comedy / Psychological',
    cover: null,
    predicted: 8.6,
    avg: 83,
    reason: "Fits both users' Comedy taste",
  },
  {
    title: 'Sonny Boy',
    meta: 'TV · 2021 · 12 ep',
    genres: 'Sci-Fi / Mystery',
    cover: null,
    predicted: 8.2,
    avg: 77,
    reason: "Fits both users' Sci-Fi taste",
  },
  {
    title: 'Land of the Lustrous',
    meta: 'TV · 2017 · 12 ep',
    genres: 'Action / Drama / Fantasy',
    cover: null,
    predicted: 8.0,
    avg: 81,
    reason: 'Popular with AniList users',
  },
];
