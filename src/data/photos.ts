export type Category = "bw" | "color" | "film";

export interface Photo {
  /** Unique id, also used as the placeholder swatch seed. */
  id: string;
  title: string;
  category: Category;
  /** Grid footprint on the gallery. */
  size?: "square" | "wide" | "tall";
  /**
   * Path under /public, e.g. "/images/film/coastal-road.jpg".
   * Leave null to show a placeholder tile until a real photo is added.
   */
  image: string | null;
}

export const categoryLabel: Record<Category, string> = {
  bw: "B&W",
  color: "Color",
  film: "Film",
};

/**
 * Drop new shoots in here. Each entry becomes one gallery tile.
 * Put the actual file in public/images/<category>/<file>.jpg and
 * set `image` to that path — until then it renders a placeholder.
 */
export const photos: Photo[] = [
  { id: "quiet-nave", title: "Quiet Nave", category: "bw", size: "tall", image: null },
  { id: "amber-hour", title: "Amber Hour", category: "color", image: null },
  { id: "backroad-kodak", title: "Backroad, Kodak 400", category: "film", image: "/images/film/DSC00032.jpg" },
  { id: "first-look", title: "First Look", category: "color", image: null },
  { id: "bridge-study", title: "Bridge Study", category: "bw", size: "wide", image: null },
  { id: "market-street", title: "Market Street, Portra", category: "film", image: "/images/film/DSC00034.jpg" },
  { id: "harbor-light", title: "Harbor Light", category: "color", size: "tall", image: null },
  { id: "grain-shadow", title: "Grain & Shadow", category: "bw", image: null },
  { id: "reception-dusk", title: "Reception, Dusk", category: "color", size: "wide", image: null },
  { id: "coastal-road", title: "Coastal Road, Ektar", category: "film", image: "/images/film/DSC00059.jpg" },
  { id: "test-film-4", title: "Untitled", category: "film", size: "tall", image: "/images/film/DSC09737-2.jpg" },
];
