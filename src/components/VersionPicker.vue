<template>
  <el-select
    v-model="modelValue"
    :disabled="disabled"
    :placeholder="placeholder"
    class="select"
    filterable
    @update:modelValue="(e) => $emit('update:modelValue', e.value)"
  >
    <el-option-group
      v-for="releaseGroup in releasesByGroup"
      :key="releaseGroup.name"
      :label="releaseGroup.name"
    >
      <el-option
        v-for="item in releaseGroup.releases"
        :key="item.id"
        :value="item.tag_name"
      >
        <div class="release-option">
          <div class="name">{{ item.name || item.tag_name }}</div>
          <div class="date">{{ humanizeDate(item.created_at) }}</div>
        </div>
      </el-option>
    </el-option-group>
  </el-select>
</template>

<script lang="ts">
import { defineComponent, watch } from 'vue';
import useRepository from '../composables/useRepository';

export default defineComponent({
  props: {
    placeholder: {
      type: String,
      default: 'Version',
    },
    preReleases: {
      type: Boolean,
      default: false,
    },
    disabled: {
      type: Boolean,
      default: false,
    },
  },
  setup(props) {
    const { repo, includePreReleases, releasesByGroup } = useRepository();

    watch(
      () => props.preReleases,
      (v) => {
        includePreReleases.value = v;
      },
    );

    return {
      includePreReleases,
      releasesByGroup,
    };
  },
  data() {
    return {
      modelValue: '',
    };
  },
  methods: {
    humanizeDate(date: string): string {
      return new Date(date).toLocaleDateString(undefined, {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
    },
  },
});
</script>

<style lang="scss" scoped>
.select {
  width: 100%;
}

.release-option {
  display: flex;
  justify-content: space-between;

  .name {
    font-weight: bold;
  }

  .date {
    font-size: 75%;
    color: #888888;
  }
}
</style>
