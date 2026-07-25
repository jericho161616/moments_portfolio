export type Category = "bw" | "film" | "events" | "portraits" | "travel";

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
  film: "Film",
  events: "Events",
  portraits: "Portraits",
  travel: "Travel",
};

/**
 * Drop new shoots in here. Each entry becomes one gallery tile.
 * Put the actual file in public/images/<category>/<file>.jpg and
 * set `image` to that path — until then it renders a placeholder.
 */
export const photos: Photo[] = [
  { id: "coastal-road", title: "Coastal Road, Ektar", category: "film", image: "/images/film/DSC00059.jpg" },
  { id: "dsc00011", title: "", category: "travel", size: "wide", image: "/images/color/dsc00011.jpg" },
  { id: "dsc00071", title: "", category: "travel", size: "tall", image: "/images/color/dsc00071.jpg" },
  { id: "dsc09737", title: "", category: "bw", size: "wide", image: "/images/bw/dsc09737.jpg" },
  { id: "dsc00085", title: "", category: "travel", image: "/images/color/dsc00085.jpg" },
  { id: "dsc09663", title: "", category: "travel", image: "/images/color/dsc09663.jpg" },
  { id: "dsc00031", title: "", category: "travel", size: "wide", image: "/images/color/dsc00031.jpg" },
  { id: "dsc09958", title: "", category: "travel", image: "/images/color/dsc09958.jpg" },
  { id: "dsc09562", title: "", category: "travel", image: "/images/color/dsc09562.jpg" },
  { id: "dsc09771", title: "", category: "travel", size: "wide", image: "/images/color/dsc09771.jpg" },
  { id: "dsc09847", title: "", category: "travel", size: "wide", image: "/images/color/dsc09847.jpg" },
  { id: "dsc09849", title: "", category: "travel", size: "tall", image: "/images/color/dsc09849.jpg" },
  { id: "dsc09853", title: "", category: "travel", size: "tall", image: "/images/color/dsc09853.jpg" },
  { id: "dsc09949", title: "", category: "bw", size: "wide", image: "/images/bw/dsc09949.jpg" },
  { id: "copy-of-dsc05729-1", title: "", category: "travel", size: "tall", image: "/images/color/copy-of-dsc05729-1.jpg" },
  { id: "copy-of-dsc06452-1", title: "", category: "travel", image: "/images/color/copy-of-dsc06452-1.jpg" },
  { id: "copy-of-dsc07335-1", title: "", category: "travel", size: "wide", image: "/images/color/copy-of-dsc07335-1.jpg" },
  { id: "copy-of-dsc07400-1", title: "", category: "travel", size: "tall", image: "/images/color/copy-of-dsc07400-1.jpg" },
  { id: "copy-of-dsc05742-1", title: "", category: "travel", size: "wide", image: "/images/color/copy-of-dsc05742-1.jpg" },
  { id: "dsc04652", title: "", category: "travel", image: "/images/color/dsc04652.jpg" },
  { id: "dsc09697", title: "", category: "travel", image: "/images/color/dsc09697.jpg" },
  { id: "dsc09731", title: "", category: "travel", image: "/images/color/dsc09731.jpg" },
];
