<template>
  <div class="card" @click="onClick">
    <div class="top">
      <div>
        <div class="label">{{ label }}</div>
        <div class="value">{{ value }}</div>
      </div>
      <div class="icon">
        <slot name="icon" />
      </div>
    </div>

    <div v-if="desc" class="desc">{{ desc }}</div>
  </div>
</template>

<script setup>
defineProps({
  label: { type: String, required: true },
  value: { type: [String, Number], required: true },
  desc: { type: String, default: "" },
  clickable: { type: Boolean, default: false },
});

const emit = defineEmits(["click"]);

const onClick = () => {
  emit("click");
};
</script>

<style scoped>
.card {
  background: #fff;
  border-radius: 14px;
  padding: 14px 16px;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.06);
  cursor: default;
  user-select: none;
  transition: transform 0.12s ease, box-shadow 0.12s ease;
}

.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 22px rgba(0, 0, 0, 0.08);
}

.top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.label {
  font-size: 12px;
  color: #6b7280;
}

.value {
  margin-top: 6px;
  font-size: 26px;
  font-weight: 900;
  color: #111827;
  line-height: 1.1;
}

.icon {
  width: 38px;
  height: 38px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  background: rgba(17, 24, 39, 0.06);
}

.desc {
  margin-top: 10px;
  font-size: 12px;
  color: #6b7280;
}
</style>
