<!-- src/components/PageContainer.vue -->
<template>
  <div class="app-page">
    <div class="app-card page-shell">
      <!-- 顶部标题区 -->
      <div class="page-head">
        <div>
          <div class="page-title">{{ title }}</div>
          <div v-if="desc" class="page-desc">{{ desc }}</div>
        </div>

        <div class="page-extra">
          <slot name="extra" />
        </div>
      </div>

      <!-- 内容区 -->
      <div class="page-body">
        <slot />
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: { type: String, default: "" },
  desc: { type: String, default: "" },
});
</script>

<style scoped>
.page-shell {
  padding: 0;
}
.page-head {
  padding: 16px;
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}
.page-title {
  font-size: 18px;
  font-weight: 900;
  color: #0f172a;
}
.page-desc {
  margin-top: 4px;
  font-size: 12px;
  color: var(--muted);
}
.page-extra {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
}
.page-body {
  padding: 16px;
}
</style>
