import { gt, parse, rsort, satisfies, valid } from 'semver';
import { ref, watch } from 'vue';

export interface Release {
  url: string;
  id: string;
  tag_name: string;
  name: string;
  prerelease: boolean;
  created_at: string;
  published_at: string;
  body: string;
}

export interface ReleaseGroup {
  name: string;
  releases: Release[];
}

const lastError = ref(null as string | null);

const cache: Record<string, Record<string, Release>> = {};

const repo = ref('');
const includePreReleases = ref(false as boolean);

const releases = ref({} as Record<string, Release>);
const releasesByGroup = ref([] as ReleaseGroup[]);

const fetchReleases = () => {
  lastError.value = null;

  if (repo.value.length < 3) {
    return Promise.resolve({});
  }

  if (repo.value in cache) {
    return Promise.resolve({ ...cache[repo.value] });
  } else {
    return fetch(
      `https://api.github.com/repos/${repo.value}/releases?per_page=100&page=1`,
      // 'https://stash.nitwhiz.xyz/spnpm.json',
    )
      .then((response) => {
        if (response.ok) {
          return response.json() as Promise<Release[]>;
        }

        throw new Error(response.statusText);
      })
      .then((releases) => {
        releases.forEach((r) => {
          if (!cache[repo.value]) {
            cache[repo.value] = {
              [r.tag_name]: r,
            };
          } else {
            cache[repo.value][r.tag_name] = r;
          }
        });

        return { ...cache[repo.value] };
      })
      .catch((err) => {
        lastError.value = err.message || 'unknown';

        return {};
      });
  }
};

const getReleases = () => {
  return Object.entries(releases.value)
    .filter(([_, r]) => !(!includePreReleases.value && r.prerelease))
    .reduce((acc, curr) => {
      acc[curr[0]] = curr[1];

      return acc;
    }, {} as Record<string, Release>);
};

const getReleasesByGroup = () => {
  const sortedReleases = sortReleases(getReleases());

  const groups: ReleaseGroup[] = [];
  const majorOrder: string[] = [];
  const groupBuckets: Record<string, Release[]> = {};

  sortedReleases.forEach((r) => {
    let major: number | string | undefined = parse(r.tag_name)?.major;

    if (major === undefined) {
      major = 'Unknown';
    }

    const majorString = `Version ${major}`;

    if (!groupBuckets[majorString]) {
      groupBuckets[majorString] = [r];
      majorOrder.push(majorString);
    } else {
      groupBuckets[majorString].push(r);
    }
  });

  for (const major of majorOrder) {
    groups.push({
      name: major,
      releases: groupBuckets[major],
    });
  }

  return groups;
};

const sortReleases = (releases: Record<string, Release>) => {
  return rsort(Object.keys(releases), {
    loose: true,
    includePrerelease: true,
  }).map((tn) => releases[tn]);
};

export const sortVersions = (v1: string, v2: string) => {
  let lowerVersion = v1;
  let greaterVersion = v2;

  if (gt(v1, v2)) {
    lowerVersion = v2;
    greaterVersion = v1;
  }

  return {
    lower: lowerVersion,
    greater: greaterVersion,
  };
};

const getReleasesBetween = (
  releases: Record<string, Release>,
  v1: string,
  v2: string,
): Release[] => {
  if (!valid(v1) || !valid(v2)) {
    return [];
  }

  const { lower, greater } = sortVersions(v1, v2);

  const range = `>=${lower} <=${greater}`;

  const result: Record<string, Release> = {};

  for (const version of Object.keys(releases)) {
    if (
      satisfies(version, range, {
        includePrerelease: true,
        loose: true,
      })
    ) {
      result[version] = releases[version];
    }
  }

  return sortReleases(result);
};

watch(repo, async () => {
  releases.value = await fetchReleases();
  releasesByGroup.value = getReleasesByGroup();
});

watch(includePreReleases, async () => {
  releasesByGroup.value = getReleasesByGroup();
});

const useRepository = () => {
  return {
    lastError,
    includePreReleases,
    repo,
    releases,
    releasesByGroup,
    getReleasesBetween,
  };
};

export default useRepository;
