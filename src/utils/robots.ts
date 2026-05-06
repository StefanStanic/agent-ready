export type RobotsGroup = {
  userAgents: string[];
  allow: string[];
  disallow: string[];
  rawDirectives: Array<{ key: string; value: string }>;
};

export type RobotsParseResult = {
  groups: RobotsGroup[];
  sitemapUrls: string[];
  contentSignals: string[];
  isParseable: boolean;
};

export function parseRobotsTxt(input: string): RobotsParseResult {
  const lines = input
    .split(/\r?\n/)
    .map((line) => stripComment(line).trim())
    .filter(Boolean);

  const groups: RobotsGroup[] = [];
  const sitemapUrls: string[] = [];
  const contentSignals: string[] = [];
  let currentGroup: RobotsGroup | null = null;
  let sawDirective = false;

  for (const line of lines) {
    const separatorIndex = line.indexOf(":");

    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim().toLowerCase();
    const value = line.slice(separatorIndex + 1).trim();

    if (!key || !value) {
      continue;
    }

    sawDirective = true;

    switch (key) {
      case "user-agent":
        if (!currentGroup || currentGroup.allow.length > 0 || currentGroup.disallow.length > 0) {
          currentGroup = createGroup();
          groups.push(currentGroup);
        }

        currentGroup.userAgents.push(value);
        currentGroup.rawDirectives.push({ key, value });
        break;
      case "allow":
      case "disallow":
        if (!currentGroup) {
          currentGroup = createGroup();
          groups.push(currentGroup);
        }

        currentGroup[key].push(value);
        currentGroup.rawDirectives.push({ key, value });
        break;
      case "sitemap":
        sitemapUrls.push(value);
        break;
      case "content-signal":
        contentSignals.push(
          ...value
            .split(",")
            .map((entry) => entry.trim().toLowerCase())
            .filter(Boolean)
        );
        break;
      default:
        if (!currentGroup) {
          currentGroup = createGroup();
          groups.push(currentGroup);
        }

        currentGroup.rawDirectives.push({ key, value });
    }
  }

  return {
    groups,
    sitemapUrls,
    contentSignals,
    isParseable: sawDirective
  };
}

function createGroup(): RobotsGroup {
  return {
    userAgents: [],
    allow: [],
    disallow: [],
    rawDirectives: []
  };
}

function stripComment(line: string): string {
  const commentIndex = line.indexOf("#");

  if (commentIndex === -1) {
    return line;
  }

  return line.slice(0, commentIndex);
}
