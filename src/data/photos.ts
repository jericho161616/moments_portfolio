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
  { id: "dsc00011", title: "DSC00011", category: "color", size: "wide", image: "/images/color/dsc00011.jpg" },
  { id: "dsc00071", title: "DSC00071", category: "color", size: "tall", image: "/images/color/dsc00071.jpg" },
  { id: "dsc09737", title: "DSC09737", category: "bw", size: "wide", image: "/images/bw/dsc09737.jpg" },
  { id: "dsc00085", title: "DSC00085", category: "color", image: "/images/color/dsc00085.jpg" },
  { id: "dsc09663", title: "DSC09663", category: "color", image: "/images/color/dsc09663.jpg" },
  { id: "dsc00031", title: "DSC00031", category: "color", size: "wide", image: "/images/color/dsc00031.jpg" },
  { id: "dsc09958", title: "DSC09958", category: "color", image: "/images/color/dsc09958.jpg" },
];
