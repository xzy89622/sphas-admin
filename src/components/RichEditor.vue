<template>
  <div class="editor-wrap">
    <Toolbar
      class="toolbar"
      :editor="editorRef"
      :defaultConfig="toolbarConfig"
      mode="default"
    />
    <Editor
      class="editor"
      v-model="html"
      :defaultConfig="editorConfig"
      mode="default"
      @onCreated="handleCreated"
    />
  </div>
</template>

<script setup>
import { onBeforeUnmount, ref, watch } from "vue";
import { Editor, Toolbar } from "@wangeditor/editor-for-vue";

// v-model
const props = defineProps({
  modelValue: { type: String, default: "" },
});
const emit = defineEmits(["update:modelValue"]);

const editorRef = ref(null);
const html = ref(props.modelValue);

watch(
  () => props.modelValue,
  (v) => {
    // 避免循环赋值
    if (v !== html.value) html.value = v || "";
  }
);

watch(html, (v) => {
  emit("update:modelValue", v || "");
});

// 工具栏配置：你可以按需要裁剪
const toolbarConfig = {
  toolbarKeys: [
    "headerSelect",
    "bold",
    "italic",
    "underline",
    "through",
    "color",
    "bgColor",
    "bulletedList",
    "numberedList",
    "quote",
    "code",
    "divider",
    "link",
    "undo",
    "redo",
  ],
};

const editorConfig = {
  placeholder: "请输入内容...",
};

const handleCreated = (editor) => {
  editorRef.value = editor;
};

onBeforeUnmount(() => {
  const editor = editorRef.value;
  if (editor) editor.destroy();
});
</script>

<style scoped>
.editor-wrap {
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  overflow: hidden;
  background: #fff;
}

.toolbar {
  border-bottom: 1px solid #e5e7eb;
}

/* ✅ 关键：固定高度，消掉“height < 300px”警告 */
.editor {
  min-height: 360px;
  padding: 8px 10px;
}
</style>
