<template>
  <el-config-provider>
    <MainView />
  </el-config-provider>
</template>

<style lang="scss">
@import url('https://fonts.googleapis.com/css2?family=Patrick+Hand+SC&display=swap');

body {
  font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB',
    'Microsoft YaHei', Arial, sans-serif;
}
</style>
<script lang="ts">
import { defineComponent } from 'vue';
import MainView from './MainView.vue';

export default defineComponent({
  components: {
    MainView,
  },
});
</script>
