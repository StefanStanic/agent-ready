export type SitemapParseResult = {
  type: "urlset" | "sitemapindex" | "unknown";
  urls: string[];
  sitemapUrls: string[];
  isParseable: boolean;
};

export function parseSitemapXml(input: string): SitemapParseResult {
  const normalized = input.trim();

  if (!normalized) {
    return {
      type: "unknown",
      urls: [],
      sitemapUrls: [],
      isParseable: false
    };
  }

  const urls = collectTagContents(normalized, "loc");
  const isUrlSet = /<urlset[\s>]/i.test(normalized);
  const isSitemapIndex = /<sitemapindex[\s>]/i.test(normalized);

  return {
    type: isUrlSet ? "urlset" : isSitemapIndex ? "sitemapindex" : "unknown",
    urls: isUrlSet ? urls : [],
    sitemapUrls: isSitemapIndex ? urls : [],
    isParseable: isUrlSet || isSitemapIndex
  };
}

function collectTagContents(input: string, tagName: string): string[] {
  const pattern = new RegExp(`<${tagName}>([\\s\\S]*?)</${tagName}>`, "gi");
  const values: string[] = [];

  for (const match of input.matchAll(pattern)) {
    const value = match[1]?.trim();

    if (value) {
      values.push(value);
    }
  }

  return values;
}
