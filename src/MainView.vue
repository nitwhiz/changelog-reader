<template>
  <el-container>
    <el-header class="header">
      <el-image
        fit="scale-down"
        :src="iconSrc"
        style="width: 32px; height: 32px; margin-right: 8px"
      />
      <span>ChangelogReader</span>
    </el-header>
    <el-main>
      <!-- project -->
      <el-row :gutter="10" el-row>
        <el-col :span="1"></el-col>
        <el-col :span="12" class="repo-wrapper">
          <el-input v-model="query.repo" placeholder="pnpm/pnpm">
            <template #prepend>Repository</template>
            <template #append>
              <el-button @click="queryRepo">Load</el-button>
            </template>
          </el-input>
        </el-col>
        <el-col :span="3" class="pre-switch">
          <span>Prereleases</span>
          <el-switch v-model="query.preReleases" :disabled="!isLoaded" />
        </el-col>
        <el-col :span="4">
          <VersionPicker
            v-model="query.version1"
            :disabled="!isLoaded"
            :pre-releases="query.preReleases"
            class="version-1"
            placeholder="Select Version"
          />
        </el-col>
        <el-col :span="4">
          <VersionPicker
            v-model="query.version2"
            :disabled="!isLoaded"
            :pre-releases="query.preReleases"
            class="version-2"
            placeholder="Select Version"
          />
        </el-col>
        <el-col :span="1"></el-col>
      </el-row>
      <!-- changelog -->
      <el-row
        v-if="isLoaded && validVersions"
        :gutter="10"
        justify="space-between"
      >
        <el-col :span="1"></el-col>
        <el-col :span="22">
          <h1>Changes for {{ cmpHeadline }}</h1>
          <Changelog :version1="version1" :version2="version2" />
        </el-col>
        <el-col :span="1"></el-col>
      </el-row>
    </el-main>
  </el-container>
</template>

<script lang="ts">
import { computed, defineComponent, ref, watch } from 'vue';
import VersionPicker from './components/VersionPicker.vue';
import Changelog from './components/Changelog.vue';
import useRepository, { sortVersions } from './composables/useRepository';
import { valid } from 'semver';

export default defineComponent({
  components: {
    VersionPicker,
    Changelog,
  },
  setup() {
    const { repo, releases, lastError } = useRepository();

    const version1 = ref('');
    const version2 = ref('');

    const preReleases = ref(false as boolean);

    const query = ref({
      repo: '',
      preReleases: false,
      version1: '',
      version2: '',
    });

    const queryRepo = () => {
      if (repo.value !== query.value.repo) {
        repo.value = query.value.repo;

        query.value.preReleases = false;
        query.value.version1 = '';
        query.value.version2 = '';
      }
    };

    watch(
      [
        () => query.value.preReleases,
        () => query.value.version1,
        () => query.value.version2,
      ],
      () => {
        preReleases.value = query.value.preReleases;
        version1.value = query.value.version1;
        version2.value = query.value.version2;
      },
    );

    watch(lastError, () => {
      if (lastError) {
        ElNotification({
          title: `Unable to fetch releases for ${repo.value}`,
          message: `Error: ${lastError.value}`,
          type: 'error',
        });
      }
    });

    const validVersions = computed(() => {
      return (
        version1.value &&
        version2.value &&
        valid(version1.value) &&
        valid(version2.value)
      );
    });

    watch(
      () => query.value.repo,
      () => {
        query.value.preReleases = false;
        query.value.version1 = '';
        query.value.version2 = '';
      },
    );

    const isLoaded = computed(() => {
      return (
        query.value.repo === repo.value &&
        Object.values(releases.value).length !== 0
      );
    });

    const cmpHeadline = computed(() => {
      if (!validVersions) {
        return '';
      }

      const { lower, greater } = sortVersions(version1.value, version2.value);

      return `>=${lower} <=${greater}`;
    });

    return {
      query,
      repo,
      preReleases,
      version1,
      version2,
      releases,
      validVersions,
      isLoaded,
      queryRepo,
      cmpHeadline,
    };
  },
  computed: {
    iconSrc() {
      return `${import.meta.env.BASE_URL}clipboard.png`;
    },
  },
});
</script>

<style lang="scss" scoped>
.header {
  font-family: 'Patrick Hand SC', sans-serif;
  font-size: 32px;

  display: flex;
  align-items: center;
  justify-content: center;
}

.el-row {
  margin-bottom: 20px;
}

.load-wrapper button {
  width: 100%;
}

.repo-wrapper,
.pre-switch {
  display: flex;
  justify-content: center;
  align-items: center;

  & > span {
    margin-right: 12px;
  }
}
</style>
