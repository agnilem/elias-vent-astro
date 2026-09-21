import data from "../content/site.json";
import { getCollection } from "astro:content";

export const site = data;

/** Projects in display order, used by the carousel and the case study pages. */
export async function getProjects() {
  const all = await getCollection("projects");
  return all.sort((a, b) => a.data.order - b.data.order);
}
