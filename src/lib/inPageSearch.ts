// In-page search: walks text nodes inside the currently-rendered markdown
// article (.prose-playbook), wraps matches in <mark data-search-hit>, and
// provides navigation between them. Pure DOM, no React state.

const MARK_ATTR = "data-search-hit";
const ACTIVE_ATTR = "data-search-active";
const ARTICLE_SELECTOR = ".prose-playbook";

function getArticle(): HTMLElement | null {
  return document.querySelector(ARTICLE_SELECTOR);
}

/** Remove all existing highlight marks (preserves surrounding text). */
export function clearHighlights(): void {
  const article = getArticle();
  if (!article) return;
  const marks = article.querySelectorAll<HTMLElement>(`mark[${MARK_ATTR}]`);
  marks.forEach(m => {
    const parent = m.parentNode;
    if (!parent) return;
    while (m.firstChild) parent.insertBefore(m.firstChild, m);
    parent.removeChild(m);
    parent.normalize();
  });
}

/**
 * Highlight all case-insensitive matches of `query` inside the article and
 * return the list of mark elements in document order. Returns [] if no match
 * or the article isn't mounted.
 */
export function highlightMatches(query: string): HTMLElement[] {
  clearHighlights();
  const article = getArticle();
  const q = query.trim();
  if (!article || !q) return [];

  const lowerQ = q.toLowerCase();
  const walker = document.createTreeWalker(article, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      // Skip inside <pre><code> blocks to keep syntax highlighting intact.
      let p: Node | null = node.parentNode;
      while (p && p !== article) {
        if (p instanceof HTMLElement && (p.tagName === "PRE" || p.tagName === "CODE")) {
          return NodeFilter.FILTER_REJECT;
        }
        p = p.parentNode;
      }
      return node.nodeValue && node.nodeValue.length > 0
        ? NodeFilter.FILTER_ACCEPT
        : NodeFilter.FILTER_REJECT;
    },
  });

  const textNodes: Text[] = [];
  let n: Node | null = walker.nextNode();
  while (n) {
    textNodes.push(n as Text);
    n = walker.nextNode();
  }

  const marks: HTMLElement[] = [];
  for (const textNode of textNodes) {
    const text = textNode.nodeValue ?? "";
    const lower = text.toLowerCase();
    let idx = lower.indexOf(lowerQ);
    if (idx === -1) continue;

    const parent = textNode.parentNode;
    if (!parent) continue;

    const frag = document.createDocumentFragment();
    let cursor = 0;
    while (idx !== -1) {
      if (idx > cursor) {
        frag.appendChild(document.createTextNode(text.slice(cursor, idx)));
      }
      const mark = document.createElement("mark");
      mark.setAttribute(MARK_ATTR, "");
      mark.textContent = text.slice(idx, idx + q.length);
      frag.appendChild(mark);
      marks.push(mark);
      cursor = idx + q.length;
      idx = lower.indexOf(lowerQ, cursor);
    }
    if (cursor < text.length) {
      frag.appendChild(document.createTextNode(text.slice(cursor)));
    }
    parent.replaceChild(frag, textNode);
  }

  return marks;
}

/** Mark one hit as the active one (stronger highlight) and scroll to it. */
export function setActiveMark(marks: HTMLElement[], index: number): void {
  marks.forEach(m => m.removeAttribute(ACTIVE_ATTR));
  if (index < 0 || index >= marks.length) return;
  const active = marks[index];
  active.setAttribute(ACTIVE_ATTR, "");
  active.scrollIntoView({ behavior: "smooth", block: "center" });
}
