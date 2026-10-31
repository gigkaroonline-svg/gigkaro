export const BLOG_PAGE_SIZE = 12;

export function blogListHref(page: number) {
  return page <= 1 ? "/blog/" : `/blog/page/${page}/`;
}
