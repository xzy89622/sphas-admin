<template>
  <div class="rich-editor-wrap">
    <div class="toolbar-wrap">
      <Toolbar
        class="rich-toolbar"
        :editor="editorRef"
        :defaultConfig="toolbarConfig"
        mode="default"
      />
    </div>

    <div class="editor-wrap" :class="{ focused: isFocused }">
      <Editor
        class="rich-editor"
        v-model="localHtml"
        :defaultConfig="editorConfig"
        mode="default"
        @onCreated="handleCreated"
        @onFocus="handleFocus"
        @onBlur="handleBlur"
        @onChange="handleChange"
      />
    </div>

    <div class="editor-tip">
      当前为精简富文本模式：支持加粗、斜体、下划线、删除线、插入链接、撤销、重做。
    </div>
  </div>
</template>

<script setup>
import { ref, shallowRef, watch, onBeforeUnmount } from "vue";
import { Editor, Toolbar } from "@wangeditor/editor-for-vue";

const props = defineProps({
  modelValue: {
    type: String,
    default: "",
  },
});

const emit = defineEmits(["update:modelValue"]);

const editorRef = shallowRef(null);
const isFocused = ref(false);
const localHtml = ref("");

const normalizeHtml = (html) => {
  const value = String(html || "").trim();
  if (
    !value ||
    value === "<p><br></p>" ||
    value === "<p></p>" ||
    value === "<br>" ||
    value === "<div><br></div>"
  ) {
    return "";
  }
  return value;
};

const toolbarConfig = {
  toolbarKeys: [
    "bold",
    "italic",
    "underline",
    "through",
    "|",
    "insertLink",
    "|",
    "undo",
    "redo",
  ],
};

const editorConfig = {
  placeholder: "请输入内容...",
  autoFocus: false,
  scroll: false,
  MENU_CONF: {
    insertLink: {
      checkLink(text, url) {
        const safeUrl = String(url || "").trim();
        if (!safeUrl) return "链接地址不能为空";
        if (
          !/^https?:\/\//i.test(safeUrl) &&
          !/^mailto:/i.test(safeUrl) &&
          !/^tel:/i.test(safeUrl)
        ) {
          return "链接需以 http://、https://、mailto: 或 tel: 开头";
        }
        return true;
      },
    },
  },
};

const syncToParent = (html) => {
  emit("update:modelValue", normalizeHtml(html));
};

const handleCreated = (editor) => {
  editorRef.value = editor;
};

const handleFocus = () => {
  isFocused.value = true;
};

const handleBlur = () => {
  isFocused.value = false;
};

const handleChange = (editor) => {
  const html = editor.getHtml();
  syncToParent(html);
};

watch(
  () => props.modelValue,
  (val) => {
    const incoming = normalizeHtml(val);
    const current = normalizeHtml(localHtml.value);
    if (incoming !== current) {
      localHtml.value = incoming;
    }
  },
  { immediate: true }
);

watch(localHtml, (val) => {
  const normalized = normalizeHtml(val);
  if (normalized !== normalizeHtml(props.modelValue)) {
    syncToParent(normalized);
  }
});

onBeforeUnmount(() => {
  if (editorRef.value) {
    editorRef.value.destroy();
  }
});
</script>

<style scoped>
.rich-editor-wrap {
  width: 100%;
  border: 1px solid #dbe3ee;
  border-radius: 18px;
  background: #ffffff;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.04);
}

.toolbar-wrap {
  padding: 12px 14px;
  border-bottom: 1px solid #e9eef5;
  background: linear-gradient(180deg, #fbfcfe 0%, #f7f9fc 100%);
}

.editor-wrap {
  min-height: 320px;
  background: #fff;
  transition: all 0.2s ease;
}

.editor-wrap.focused {
  box-shadow: inset 0 0 0 2px rgba(64, 158, 255, 0.08);
}

.rich-toolbar {
  border: none !important;
  background: transparent !important;
}

.rich-editor {
  min-height: 320px;
}

:deep(.w-e-bar) {
  border: none !important;
  background: transparent !important;
  flex-wrap: wrap;
  row-gap: 8px;
}

:deep(.w-e-bar-divider) {
  margin: 0 6px !important;
}

:deep(.w-e-menu) {
  min-width: 40px;
  height: 40px !important;
  padding: 0 10px !important;
  margin: 0 4px 0 0 !important;
  border: 1px solid #d7deea !important;
  border-radius: 12px !important;
  background: #fff !important;
  color: #334155 !important;
  transition: all 0.18s ease !important;
}

:deep(.w-e-menu:hover) {
  color: #1677ff !important;
  border-color: #7cb3ff !important;
  background: #f3f8ff !important;
  box-shadow: 0 4px 10px rgba(22, 119, 255, 0.08) !important;
}

:deep(.w-e-menu.w-e-active) {
  color: #1677ff !important;
  border-color: #7cb3ff !important;
  background: #eef6ff !important;
}

:deep(.w-e-text-container) {
  border: none !important;
  background: #fff !important;
}

:deep(.w-e-scroll) {
  min-height: 320px !important;
}

:deep(.w-e-text-placeholder) {
  top: 18px !important;
  color: #b4bdc9 !important;
}

:deep(.w-e-text) {
  padding: 18px 18px 22px !important;
  color: #1f2937 !important;
  font-size: 14px !important;
  line-height: 1.95 !important;
  word-break: break-word !important;
}

:deep(.w-e-text p) {
  margin: 0 0 12px !important;
}

:deep(.w-e-text a) {
  color: #2563eb !important;
  text-decoration: underline !important;
}

.editor-tip {
  padding: 10px 16px 14px;
  border-top: 1px dashed #edf1f6;
  background: #fcfdff;
  color: #94a3b8;
  font-size: 12px;
  line-height: 1.6;
}
</style>