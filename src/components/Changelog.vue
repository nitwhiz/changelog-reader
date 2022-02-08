<template>
  <div class="changelog" v-html="changelogMarkdown"></div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import useRepository from '../composables/useRepository';
import ChangelogReader from '../common/ChangelogReader';

export default defineComponent({
  props: {
    version1: {
      type: String,
      required: true,
    },
    version2: {
      type: String,
      required: true,
    },
  },
  setup() {
    const { releases, getReleasesBetween } = useRepository();

    return {
      releases,
      getReleasesBetween,
    };
  },
  computed: {
    changelogMarkdown() {
      return new ChangelogReader(
        this.getReleasesBetween(this.releases, this.version1, this.version2),
      ).parse();
    },
  },
});
</script>

<style lang="scss">
.changelog {
  overflow: hidden;

  code {
    background-color: #f8f8f8;
    padding: 3px 5px;
    border-radius: 4px;
    font-family: monospace;
    color: #333333;
  }

  pre {
    code {
      display: block;
      padding: 8px 16px;
    }
  }

  img {
    max-width: 100%;
  }

  ul,
  ol {
    margin: 0;

    li {
      font-size: 14px;
      line-height: 24px;

      p {
        margin: 8px 0;

        &:last-child {
          margin-bottom: 0;
        }

        &:first-child {
          margin-top: 0;
        }
      }
    }
  }
}
</style>
