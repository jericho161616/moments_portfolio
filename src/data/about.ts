export interface AboutInfo {
  name: string;
  /** Paragraphs of bio copy, rendered one per <p>. */
  bio: string[];
  instagramHandle: string;
  instagramUrl: string;
  email: string;
  location: string;
  /** Path under /public, e.g. "/images/about/profile.jpg". Null shows a placeholder. */
  photo: string | null;
}

export const about: AboutInfo = {
  name: "Echo",
  bio: [
    "I'm a photographer based in Lucena, Quezon Province, working across black & white, film, portraits, events, and travel. I shoot the moments between the posed ones — the walk to the altar, the pause before a laugh, a street at the hour the light turns amber.",
    "Every roll is processed and scanned by hand, no lab in between — which means the grain, the light leaks, and the color shifts are mine to keep or lose. That's part of the deal with film.",
  ],
  instagramHandle: "@echo.frames",
  instagramUrl: "https://instagram.com",
  email: "hello@example.com",
  location: "Based in Lucena, Quezon Province",
  photo: null,
};
