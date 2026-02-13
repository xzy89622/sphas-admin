<!-- src/views/QuestionBankManage.vue -->
<template>
  <el-card title="xxx" desc="xxx">
    <template #header>
      <div class="header">
        <div class="title">题库管理</div>

        <div class="header-actions">
          <!-- ✅ 模板下载 -->
          <el-dropdown>
            <el-button>
              模板下载 <el-icon class="el-icon--right"><ArrowDown /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="downloadCsvTemplate">下载 CSV 模板</el-dropdown-item>
                <el-dropdown-item @click="downloadJsonTemplate">下载 JSON 模板</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>

          <!-- ✅ 批量导入 -->
          <el-button type="success" @click="openImportDialog">批量导入</el-button>
<el-button
  type="danger"
  plain
  :disabled="!selectedRows.length"
  @click="batchRemove"
>
  批量删除（{{ selectedRows.length }}）
</el-button>

          <!-- ✅ 单条新增 -->
          <el-button type="primary" @click="openAdd">新增题目</el-button>

          <el-button type="warning" plain @click="generateDemoQuestions">生成示例题库</el-button>

        </div>
      </div>
    </template>

    <!-- ✅ 查询区域 -->
    <el-form class="query" inline :model="query">
      <el-form-item label="维度">
        <el-select v-model="query.dimension" clearable placeholder="全部" style="width: 160px">
          <el-option label="SPORT" value="SPORT" />
          <el-option label="DIET" value="DIET" />
          <el-option label="SLEEP" value="SLEEP" />
          <el-option label="STRESS" value="STRESS" />
        </el-select>
      </el-form-item>

      <el-form-item label="状态">
        <el-select v-model="query.status" clearable placeholder="全部" style="width: 140px">
          <el-option label="启用" :value="1" />
          <el-option label="停用" :value="0" />
        </el-select>
      </el-form-item>

      <el-form-item label="关键字">
        <el-input
          v-model="query.keyword"
          clearable
          placeholder="搜索题目内容"
          style="width: 240px"
          @keyup.enter="onSearch"
        />
      </el-form-item>

      <el-form-item>
        <el-button type="primary" @click="onSearch">查询</el-button>
        <el-button @click="onReset">重置</el-button>
      </el-form-item>
    </el-form>

    <!-- ✅ 表格 -->
    <el-table
  :data="list"
  border
  v-loading="tableLoading"
  @selection-change="(rows) => (selectedRows = rows)"
>
      <el-table-column type="selection" width="55" />
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="dimension" label="维度" width="120" />
      <el-table-column prop="question" label="题目" min-width="260" show-overflow-tooltip />

      <el-table-column label="选项数" width="100">
        <template #default="{ row }">
          {{ countOptions(row.optionsJson) }}
        </template>
      </el-table-column>

      <el-table-column prop="status" label="状态" width="100">
        <template #default="{ row }">
          <el-tag v-if="row.status === 1" type="success">启用</el-tag>
          <el-tag v-else type="info">停用</el-tag>
        </template>
      </el-table-column>

      <el-table-column prop="createTime" label="创建时间" width="180" />

      <el-table-column label="操作" width="240">
        <template #default="{ row }">
          <el-button size="small" @click="openEdit(row)">编辑</el-button>
          <el-button size="small" type="danger" @click="remove(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- ✅ 分页 -->
    <div class="pager">
      <el-pagination
        v-model:current-page="page.pageNum"
        v-model:page-size="page.pageSize"
        :total="page.total"
        layout="total, sizes, prev, pager, next, jumper"
        :page-sizes="[10, 20, 50]"
        @current-change="fetchList"
        @size-change="onSizeChange"
      />
    </div>
  </el-card>

  <!-- ✅ 新增/编辑弹窗 -->
  <el-dialog
    v-model="dialogVisible"
    :title="form.id ? '编辑题目' : '新增题目'"
    width="980px"
    :close-on-click-modal="false"
    destroy-on-close
  >
    <el-form label-width="90px" :model="form">
      <el-form-item label="维度" required>
        <el-select v-model="form.dimension" placeholder="请选择" style="width: 240px">
          <el-option label="SPORT" value="SPORT" />
          <el-option label="DIET" value="DIET" />
          <el-option label="SLEEP" value="SLEEP" />
          <el-option label="STRESS" value="STRESS" />
        </el-select>
      </el-form-item>

      <el-form-item label="题目" required>
        <el-input v-model="form.question" type="textarea" :rows="3" />
      </el-form-item>

      <!-- ✅ 选项可视化编辑 -->
      <el-form-item label="选项" required>
        <div class="opt-wrap">
          <div class="opt-scroll">
            <el-table :data="optionRows" border style="min-width: 860px">
              <el-table-column label="选项文本" min-width="520">
                <template #default="{ row }">
                  <el-input v-model="row.text" placeholder="例如：每天锻炼 30 分钟" />
                </template>
              </el-table-column>

              <el-table-column label="分值" width="180" align="center">
                <template #default="{ row }">
                  <el-input-number v-model="row.score" :min="0" :max="100" style="width: 140px" />
                </template>
              </el-table-column>

              <el-table-column label="操作" width="140" align="center" fixed="right">
                <template #default="{ $index }">
                  <el-button size="small" type="danger" @click="removeOption($index)">删除</el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>

          <div class="opt-actions">
            <el-button @click="addOption">新增选项</el-button>
            <el-button @click="syncOptionsJson">生成 optionsJson</el-button>
            <el-button type="primary" plain @click="showJson = !showJson">
              {{ showJson ? "隐藏" : "显示" }} optionsJson
            </el-button>
          </div>

          <el-input
            v-if="showJson"
            v-model="form.optionsJson"
            type="textarea"
            :rows="6"
            placeholder='例如：[{"text":"选项A","score":1},{"text":"选项B","score":2}]'
          />
        </div>
      </el-form-item>

      <el-form-item label="状态">
        <el-select v-model="form.status" style="width: 160px">
          <el-option :value="1" label="启用" />
          <el-option :value="0" label="停用" />
        </el-select>
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" :loading="saveLoading" @click="save">保存</el-button>
    </template>
  </el-dialog>

  <!-- ✅ 批量导入弹窗 -->
  <el-dialog
    v-model="importVisible"
    title="题库批量导入"
    width="980px"
    :close-on-click-modal="false"
    destroy-on-close
  >
    <div class="import-tips">
      <div class="tip-line">
        支持格式：<b>CSV</b> 或 <b>JSON</b>。
        建议先点顶部“模板下载”，按模板填写后再导入。
      </div>
      <div class="tip-line">
        CSV 必填列：dimension, question, status（1/0），以及至少两组选项：option1_text, option1_score...
      </div>
      <div class="tip-line">
        JSON 格式：数组，每项包含 dimension/question/status/options（数组 text+score）
      </div>
    </div>

    <div class="import-actions">
      <el-upload
        :auto-upload="false"
        :show-file-list="true"
        :limit="1"
        accept=".csv,.json"
        :on-change="onFileChange"
      >
        <el-button type="primary">选择文件（CSV/JSON）</el-button>
      </el-upload>

      <el-button :disabled="!importRows.length" @click="clearImport">清空</el-button>
    </div>

    <!-- ✅ 解析预览 -->
    <el-divider />
    <div class="import-preview-head">
      <div>导入预览（{{ importRows.length }} 条）</div>
      <div class="import-preview-right">
        <el-tag v-if="importErrors.length" type="danger">存在 {{ importErrors.length }} 条错误</el-tag>
        <el-tag v-else type="success">校验通过</el-tag>
      </div>
    </div>

    <el-table :data="importRows.slice(0, 20)" border height="320">
      <el-table-column type="index" label="#" width="60" />
      <el-table-column prop="dimension" label="维度" width="120" />
      <el-table-column prop="question" label="题目" min-width="260" show-overflow-tooltip />
      <el-table-column label="选项数" width="100">
        <template #default="{ row }">{{ row.options?.length || 0 }}</template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="100" />
      <el-table-column label="校验" width="140">
        <template #default="{ row }">
          <el-tag v-if="row.__error" type="danger">错误</el-tag>
          <el-tag v-else type="success">OK</el-tag>
        </template>
      </el-table-column>
    </el-table>

    <div v-if="importErrors.length" class="import-error-box">
      <div class="err-title">错误详情（只展示前 10 条）</div>
      <div v-for="(e, idx) in importErrors.slice(0, 10)" :key="idx" class="err-item">
        第 {{ e.index + 1 }} 条：{{ e.message }}
      </div>
    </div>

    <!-- 导入进度 -->
    <div v-if="importing" class="import-progress">
      <el-progress :percentage="importPercent" />
      <div class="import-progress-text">
        已处理：{{ importDone }}/{{ importTotal }}，成功：{{ importSuccess }}，失败：{{ importFail }}
      </div>
    </div>

   <template #footer>
  <el-button @click="importVisible = false" :disabled="importing">关闭</el-button>

  <el-button
    v-if="importRows.length && importErrors.length"
    type="warning"
    plain
    :disabled="importing"
    @click="exportErrorCsv"
  >
    导出错误明细CSV
  </el-button>

  <el-button
    type="success"
    :disabled="!importRows.length || importErrors.length || importing"
    :loading="importing"
    @click="startImport"
  >
    开始导入
  </el-button>
</template>

  </el-dialog>
</template>

<script setup>
import { reactive, ref, onMounted, computed } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { ArrowDown } from "@element-plus/icons-vue";

import { qbAdminPage, qbSave, qbDelete } from "../api/questionBank";
import { usePage } from "../hooks/usePage";

/** =========================
 *  A. 列表/单条增删改查
 *  ========================= */
const query = reactive({
  dimension: "",
  status: null, // 1/0/null
  keyword: "",
});
const selectedRows = ref([]);

const { page, resetToFirstPage } = usePage(10);

const list = ref([]);
const tableLoading = ref(false);

const dialogVisible = ref(false);
const saveLoading = ref(false);

const showJson = ref(false);

const form = reactive({
  id: null,
  dimension: "",
  question: "",
  optionsJson: "",
  status: 1,
});

const optionRows = ref([]);

function countOptions(optionsJson) {
  try {
    const arr = JSON.parse(optionsJson || "[]");
    return Array.isArray(arr) ? arr.length : 0;
  } catch {
    return 0;
  }
}

function addOption() {
  optionRows.value.push({ text: "", score: 0 });
}

function removeOption(idx) {
  optionRows.value.splice(idx, 1);
}

function syncOptionsJson() {
  const cleaned = optionRows.value
    .map((x) => ({ text: String(x.text || "").trim(), score: Number(x.score || 0) }))
    .filter((x) => x.text);

  if (cleaned.length === 0) {
    ElMessage.warning("请至少填写 1 个选项文本");
    return false;
  }

  form.optionsJson = JSON.stringify(cleaned);
  return true;
}

function loadOptionsFromJson(optionsJson) {
  try {
    const arr = JSON.parse(optionsJson || "[]");
    if (Array.isArray(arr)) {
      optionRows.value = arr.map((x) => ({
        text: x?.text ?? "",
        score: Number(x?.score ?? 0),
      }));
    } else {
      optionRows.value = [];
    }
  } catch {
    optionRows.value = [];
  }
}

const fetchList = async () => {
  tableLoading.value = true;
  try {
    const pageData = await qbAdminPage({
      pageNum: page.pageNum,
      pageSize: page.pageSize,
      dimension: query.dimension || undefined,
    });

    let rows = pageData?.records || [];

    // 前端过滤 status/keyword
    if (query.status === 0 || query.status === 1) {
      rows = rows.filter((x) => x.status === query.status);
    }
    const kw = query.keyword.trim().toLowerCase();
    if (kw) {
      rows = rows.filter((x) => String(x.question || "").toLowerCase().includes(kw));
    }

    list.value = rows;
    page.total = rows.length;
  } finally {
    tableLoading.value = false;
  }
};

const onSearch = () => {
  resetToFirstPage();
  fetchList();
};

const onReset = () => {
  query.dimension = "";
  query.status = null;
  query.keyword = "";
  resetToFirstPage();
  fetchList();
};

const onSizeChange = () => {
  resetToFirstPage();
  fetchList();
};

const openAdd = () => {
  Object.assign(form, { id: null, dimension: "", question: "", optionsJson: "", status: 1 });
  optionRows.value = [];
  showJson.value = false;
  addOption();
  addOption();
  dialogVisible.value = true;
};

const openEdit = (row) => {
  Object.assign(form, { ...row });
  showJson.value = false;
  loadOptionsFromJson(form.optionsJson);
  if (optionRows.value.length === 0) {
    addOption();
    addOption();
  }
  dialogVisible.value = true;
};

const save = async () => {
  if (!form.dimension) return ElMessage.warning("请选择维度");
  if (!form.question.trim()) return ElMessage.warning("请输入题目");

  // 用可视化选项生成 optionsJson
  const ok = syncOptionsJson();
  if (!ok) return;

  // 再校验 JSON 合法
  try {
    const arr = JSON.parse(form.optionsJson || "[]");
    if (!Array.isArray(arr) || arr.length === 0) {
      ElMessage.warning("optionsJson 必须是非空数组");
      return;
    }
  } catch {
    ElMessage.error("optionsJson 不是合法 JSON");
    return;
  }

  saveLoading.value = true;
  try {
    await qbSave({ ...form });
    ElMessage.success("保存成功");
    dialogVisible.value = false;
    fetchList();
  } finally {
    saveLoading.value = false;
  }
};

const remove = async (row) => {
  await ElMessageBox.confirm("确认删除该题目？", "提示", { type: "warning" });
  await qbDelete(row.id);
  ElMessage.success("删除成功");
  fetchList();
};

/** =========================
 *  B. 模板下载
 *  ========================= */
function downloadBlob(filename, content, mime) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();

  URL.revokeObjectURL(url);
}

/**
 * CSV 模板格式（建议最多 6 个选项组，你也可以继续加）
 * dimension,question,status,option1_text,option1_score,option2_text,option2_score,...
 */
function downloadCsvTemplate() {
  const header = [
    "dimension",
    "question",
    "status",
    "option1_text",
    "option1_score",
    "option2_text",
    "option2_score",
    "option3_text",
    "option3_score",
    "option4_text",
    "option4_score",
  ].join(",");

  const example1 = [
    "SPORT",
    "你每周锻炼几次？",
    "1",
    "每天锻炼",
    "10",
    "每周2-3次",
    "6",
    "几乎不锻炼",
    "0",
    "",
    "",
  ].join(",");

  const example2 = [
    "DIET",
    "你每天吃蔬菜水果吗？",
    "1",
    "每天都吃",
    "10",
    "偶尔吃",
    "5",
    "几乎不吃",
    "0",
    "",
    "",
  ].join(",");

  // ✅ 关键：加 UTF-8 BOM，让 Excel 识别为 UTF-8（避免打开/保存后乱码）
  const csv = "\ufeff" + [header, example1, example2].join("\n");

  downloadBlob("question_template.csv", csv, "text/csv;charset=utf-8");
}


function downloadJsonTemplate() {
  const data = [
    {
      dimension: "SPORT",
      question: "你每周锻炼几次？",
      status: 1,
      options: [
        { text: "每天锻炼", score: 10 },
        { text: "每周2-3次", score: 6 },
        { text: "几乎不锻炼", score: 0 },
      ],
    },
    {
      dimension: "DIET",
      question: "你每天吃蔬菜水果吗？",
      status: 1,
      options: [
        { text: "每天都吃", score: 10 },
        { text: "偶尔吃", score: 5 },
        { text: "几乎不吃", score: 0 },
      ],
    },
  ];

  downloadBlob("question_template.json", JSON.stringify(data, null, 2), "application/json;charset=utf-8");
}
function exportErrorCsv() {
  if (!importErrors.value.length) {
    ElMessage.warning("当前没有错误可导出");
    return;
  }

  // 生成 CSV：index,message,dimension,question,status
  const header = ["index", "message", "dimension", "question", "status"].join(",");

  const lines = importErrors.value.map((e) => {
    const row = importRows.value[e.index] || {};
    const safe = (v) => String(v ?? "").replaceAll('"', '""'); // CSV 双引号转义
    return [
      e.index + 1,
      `"${safe(e.message)}"`,
      safe(row.dimension),
      `"${safe(row.question)}"`,
      safe(row.status),
    ].join(",");
  });

  const csv = "\ufeff" + [header, ...lines].join("\n");
  downloadBlob("question_import_errors.csv", csv, "text/csv;charset=utf-8");
  ElMessage.success("已导出错误明细 CSV");
}
async function generateDemoQuestions() {
  await ElMessageBox.confirm(
    "将自动生成 20 条示例题目（SPORT/DIET/SLEEP/STRESS 各 5 条），确认继续？",
    "提示",
    { type: "warning" }
  );

  const demos = buildDemoQuestions();

  importing.value = true;
  importTotal.value = demos.length;
  importDone.value = 0;
  importSuccess.value = 0;
  importFail.value = 0;

  const failList = [];

  try {
    for (let i = 0; i < demos.length; i++) {
      const row = demos[i];
      try {
        await qbSave({
          id: null,
          dimension: row.dimension,
          question: row.question,
          status: 1,
          optionsJson: JSON.stringify(row.options),
        });
        importSuccess.value += 1;
      } catch (e) {
        importFail.value += 1;
        failList.push(`第 ${i + 1} 条失败：${e?.message || "请求失败"}`);
      } finally {
        importDone.value += 1;
      }
    }

    if (importFail.value > 0) {
      ElMessage.warning(`生成完成：成功 ${importSuccess.value}，失败 ${importFail.value}`);
      console.warn("Demo generate fail detail:", failList);
    } else {
      ElMessage.success(`生成完成：成功 ${importSuccess.value} 条`);
    }

    await fetchList();
  } finally {
    importing.value = false;
  }
}

function buildDemoQuestions() {
  // 每个维度 5 条，共 20 条
  return [
    // SPORT
    {
      dimension: "SPORT",
      question: "你每周运动几次？",
      options: [
        { text: "5次及以上", score: 10 },
        { text: "3-4次", score: 7 },
        { text: "1-2次", score: 4 },
        { text: "几乎不运动", score: 0 },
      ],
    },
    {
      dimension: "SPORT",
      question: "你每次运动时长通常是多少？",
      options: [
        { text: "60分钟以上", score: 10 },
        { text: "30-60分钟", score: 7 },
        { text: "10-30分钟", score: 4 },
        { text: "少于10分钟", score: 0 },
      ],
    },
    {
      dimension: "SPORT",
      question: "你是否会做力量训练？",
      options: [
        { text: "每周规律进行", score: 10 },
        { text: "偶尔进行", score: 5 },
        { text: "从不", score: 0 },
      ],
    },
    {
      dimension: "SPORT",
      question: "你日常步行/活动量如何？",
      options: [
        { text: "每天8000步以上", score: 10 },
        { text: "每天5000-8000步", score: 6 },
        { text: "每天少于5000步", score: 0 },
      ],
    },
    {
      dimension: "SPORT",
      question: "你是否久坐（连续坐超过1小时）？",
      options: [
        { text: "经常", score: 0 },
        { text: "偶尔", score: 5 },
        { text: "很少", score: 10 },
      ],
    },

    // DIET
    {
      dimension: "DIET",
      question: "你每天吃蔬菜水果吗？",
      options: [
        { text: "每天都吃", score: 10 },
        { text: "偶尔吃", score: 5 },
        { text: "几乎不吃", score: 0 },
      ],
    },
    {
      dimension: "DIET",
      question: "你每周喝含糖饮料的频率？",
      options: [
        { text: "几乎不喝", score: 10 },
        { text: "每周1-2次", score: 6 },
        { text: "每周3次及以上", score: 0 },
      ],
    },
    {
      dimension: "DIET",
      question: "你是否经常吃油炸食品？",
      options: [
        { text: "很少", score: 10 },
        { text: "偶尔", score: 5 },
        { text: "经常", score: 0 },
      ],
    },
    {
      dimension: "DIET",
      question: "你的晚餐时间通常？",
      options: [
        { text: "19点前", score: 10 },
        { text: "19-21点", score: 6 },
        { text: "21点后", score: 0 },
      ],
    },
    {
      dimension: "DIET",
      question: "你是否会暴饮暴食？",
      options: [
        { text: "几乎不会", score: 10 },
        { text: "偶尔", score: 5 },
        { text: "经常", score: 0 },
      ],
    },

    // SLEEP
    {
      dimension: "SLEEP",
      question: "你平均每天睡眠多久？",
      options: [
        { text: "7-9小时", score: 10 },
        { text: "6-7小时", score: 6 },
        { text: "少于6小时", score: 0 },
      ],
    },
    {
      dimension: "SLEEP",
      question: "你入睡是否困难？",
      options: [
        { text: "几乎不困难", score: 10 },
        { text: "偶尔困难", score: 5 },
        { text: "经常困难", score: 0 },
      ],
    },
    {
      dimension: "SLEEP",
      question: "你夜间是否会频繁醒来？",
      options: [
        { text: "很少", score: 10 },
        { text: "偶尔", score: 5 },
        { text: "经常", score: 0 },
      ],
    },
    {
      dimension: "SLEEP",
      question: "你起床后是否精神充足？",
      options: [
        { text: "精神很好", score: 10 },
        { text: "一般", score: 5 },
        { text: "很疲惫", score: 0 },
      ],
    },
    {
      dimension: "SLEEP",
      question: "你睡前会长时间使用手机吗？",
      options: [
        { text: "很少", score: 10 },
        { text: "偶尔", score: 5 },
        { text: "经常", score: 0 },
      ],
    },

    // STRESS
    {
      dimension: "STRESS",
      question: "你最近压力水平如何？",
      options: [
        { text: "很低", score: 10 },
        { text: "一般", score: 5 },
        { text: "很高", score: 0 },
      ],
    },
    {
      dimension: "STRESS",
      question: "你是否经常感到焦虑？",
      options: [
        { text: "很少", score: 10 },
        { text: "偶尔", score: 5 },
        { text: "经常", score: 0 },
      ],
    },
    {
      dimension: "STRESS",
      question: "你是否会通过运动/兴趣减压？",
      options: [
        { text: "经常", score: 10 },
        { text: "偶尔", score: 5 },
        { text: "从不", score: 0 },
      ],
    },
    {
      dimension: "STRESS",
      question: "你是否有足够的休闲时间？",
      options: [
        { text: "充足", score: 10 },
        { text: "一般", score: 5 },
        { text: "很少", score: 0 },
      ],
    },
    {
      dimension: "STRESS",
      question: "你最近情绪波动是否明显？",
      options: [
        { text: "不明显", score: 10 },
        { text: "偶尔", score: 5 },
        { text: "很明显", score: 0 },
      ],
    },
  ];
}
// ✅ 统一标准化 key：同维度 + 同题目（去首尾空格、合并空白、转小写）
function buildQuestionKey(dimension, question) {
  const d = String(dimension || "").trim().toUpperCase();
  const q = String(question || "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
  return `${d}__${q}`;
}

// ✅ 从当前列表构建“已有题目集合”（用于导入去重）
function buildExistingKeySet() {
  const set = new Set();
  for (const row of list.value || []) {
    set.add(buildQuestionKey(row.dimension, row.question));
  }
  return set;
}

/** =========================
 *  C. 批量导入（CSV/JSON）
 *  ========================= */
const importVisible = ref(false);
const importRows = ref([]); // 标准化后的数据：{dimension,question,status,options:[{text,score}], __error?}
const importErrors = ref([]); // {index, message}
const importing = ref(false);

const importTotal = ref(0);
const importDone = ref(0);
const importSuccess = ref(0);
const importFail = ref(0);

const importPercent = computed(() => {
  if (!importTotal.value) return 0;
  return Math.floor((importDone.value / importTotal.value) * 100);
});

function openImportDialog() {
  importVisible.value = true;
  clearImport();
}

function clearImport() {
  importRows.value = [];
  importErrors.value = [];
  importing.value = false;

  importTotal.value = 0;
  importDone.value = 0;
  importSuccess.value = 0;
  importFail.value = 0;
}

// 维度合法性
const DIM_SET = new Set(["SPORT", "DIET", "SLEEP", "STRESS"]);

// 校验一条导入行（返回错误信息或空字符串）
function validateImportRow(row) {
  if (!DIM_SET.has(row.dimension)) return "dimension 必须是 SPORT/DIET/SLEEP/STRESS";
  if (!String(row.question || "").trim()) return "question 不能为空";
  if (!(row.status === 0 || row.status === 1)) return "status 必须是 1 或 0";
  if (!Array.isArray(row.options) || row.options.length < 2) return "options 至少 2 个选项";
  for (const opt of row.options) {
    if (!String(opt.text || "").trim()) return "options.text 不能为空";
    const sc = Number(opt.score);
    if (Number.isNaN(sc) || sc < 0 || sc > 100) return "options.score 必须是 0-100 的数字";
  }
  return "";
}

// CSV 解析：简单版（不支持带引号逗号转义），模板不含复杂符号即可
function parseCsv(text) {
  const lines = text
    .split(/\r?\n/)
    .map((x) => x.trim())
    .filter((x) => x.length > 0);

  if (lines.length < 2) return [];

  const header = lines[0].split(",").map((x) => x.trim());
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",").map((x) => x.trim());
    const obj = {};
    header.forEach((h, idx) => {
      obj[h] = cols[idx] ?? "";
    });
    rows.push(obj);
  }

  return rows;
}

function normalizeFromCsvRow(raw) {
  // dimension/question/status
  const dimension = String(raw.dimension || "").trim().toUpperCase();
  const question = String(raw.question || "").trim();
  const status = Number(String(raw.status || "1").trim()) === 0 ? 0 : 1;

  // options：optionN_text + optionN_score
  const options = [];
  for (let n = 1; n <= 10; n++) {
    const tKey = `option${n}_text`;
    const sKey = `option${n}_score`;
    const text = String(raw[tKey] || "").trim();
    if (!text) continue;
    const score = Number(String(raw[sKey] || "0").trim());
    options.push({ text, score: Number.isNaN(score) ? 0 : score });
  }

  return { dimension, question, status, options };
}

function normalizeFromJsonItem(item) {
  const dimension = String(item?.dimension || "").trim().toUpperCase();
  const question = String(item?.question || "").trim();
  const status = Number(item?.status) === 0 ? 0 : 1;

  const options = Array.isArray(item?.options)
    ? item.options.map((x) => ({
        text: String(x?.text || "").trim(),
        score: Number(x?.score ?? 0),
      }))
    : [];

  return { dimension, question, status, options };
}

async function onFileChange(file) {
  const rawFile = file?.raw;
  if (!rawFile) return;

  clearImport();

  const name = rawFile.name.toLowerCase();

  // ✅ 用 ArrayBuffer + TextDecoder，尝试 UTF-8，失败/乱码再尝试 GBK
  const buf = await rawFile.arrayBuffer();

  const decodeSmart = (arrayBuffer) => {
    // 1) 先尝试 utf-8
    let text = new TextDecoder("utf-8", { fatal: false }).decode(arrayBuffer);

    // 2) 如果出现大量替换字符 �，说明很可能是 GBK/ANSI
    //    用一个简单判定：包含 � 并且中文比例很低
    const hasReplacement = text.includes("�");
    if (hasReplacement) {
      try {
        // Chrome/Edge 一般支持 gbk 解码
        const gbkText = new TextDecoder("gbk", { fatal: false }).decode(arrayBuffer);
        // 如果 gbk 解码后替换字符更少，就用 gbk
        if (countChar(gbkText, "�") < countChar(text, "�")) {
          text = gbkText;
        }
      } catch {
        // 某些环境不支持 gbk，就保留 utf-8
      }
    }

    return text;
  };

  const countChar = (str, ch) => {
    let n = 0;
    for (const c of str) if (c === ch) n++;
    return n;
  };

  const text = decodeSmart(buf);

  let normalized = [];

  try {
    if (name.endsWith(".json")) {
      const arr = JSON.parse(text);
      if (!Array.isArray(arr)) {
        ElMessage.error("JSON 文件必须是数组");
        return;
      }
      normalized = arr.map(normalizeFromJsonItem);
    } else if (name.endsWith(".csv")) {
      const csvRows = parseCsv(text);
      normalized = csvRows.map(normalizeFromCsvRow);
    } else {
      ElMessage.error("仅支持 CSV 或 JSON");
      return;
    }
  } catch (e) {
    ElMessage.error("解析失败：文件格式不正确（或编码异常）");
    return;
  }

  // ✅ 校验并标记错误
  const errors = [];
  const rowsWithCheck = normalized.map((r, idx) => {
    const msg = validateImportRow(r);
    if (msg) {
      errors.push({ index: idx, message: msg });
      return { ...r, __error: msg };
    }
    return { ...r, __error: "" };
  });

  importRows.value = rowsWithCheck;
  importErrors.value = errors;

  if (rowsWithCheck.length === 0) {
    ElMessage.warning("文件里没有有效数据");
  } else if (errors.length) {
    ElMessage.error(`解析成功，但有 ${errors.length} 条数据校验不通过`);
  } else {
    ElMessage.success(`解析成功，共 ${rowsWithCheck.length} 条，校验通过`);
  }
}


// 开始导入：逐条调用 qbSave
async function startImport() {
  if (!importRows.value.length) return;
  if (importErrors.value.length) {
    ElMessage.error("存在校验错误，请修正后再导入");
    return;
  }

  importing.value = true;

  // ✅ 1) 文件内去重
  const seenInFile = new Set();
  const uniqueRows = [];
  let dupInFile = 0;

  for (const r of importRows.value) {
    const key = buildQuestionKey(r.dimension, r.question);
    if (seenInFile.has(key)) {
      dupInFile += 1;
      continue;
    }
    seenInFile.add(key);
    uniqueRows.push(r);
  }

  // ✅ 2) 与数据库已有数据去重（基于当前列表 list）
  // 注意：如果你当前列表用了筛选（维度/关键字），list 可能不是全量。
  // 建议：导入前先把查询条件重置为“全部”，再 fetchList 一次（最稳）。
  const existingSet = buildExistingKeySet();
  const finalRows = [];
  let dupInDb = 0;

  for (const r of uniqueRows) {
    const key = buildQuestionKey(r.dimension, r.question);
    if (existingSet.has(key)) {
      dupInDb += 1;
      continue;
    }
    finalRows.push(r);
  }

  importTotal.value = finalRows.length;
  importDone.value = 0;
  importSuccess.value = 0;
  importFail.value = 0;

  const failList = [];

  try {
    for (let i = 0; i < finalRows.length; i++) {
      const row = finalRows[i];

      try {
        const payload = {
          id: null,
          dimension: row.dimension,
          question: row.question,
          status: row.status,
          optionsJson: JSON.stringify(row.options),
        };

        await qbSave(payload);
        importSuccess.value += 1;

        // ✅ 成功后把 key 加入 existingSet，避免同一批次重复写入
        existingSet.add(buildQuestionKey(row.dimension, row.question));
      } catch (e) {
        importFail.value += 1;
        failList.push(`第 ${i + 1} 条失败：${e?.message || "请求失败"}`);
      } finally {
        importDone.value += 1;
      }
    }
  } finally {
    importing.value = false;
  }

  // ✅ 导入后刷新列表
  await fetchList();

  // ✅ 汇总提示
  const totalOrigin = importRows.value.length;
  const totalFinal = finalRows.length;

  if (importFail.value > 0) {
    ElMessage.warning(
      `导入完成：原始 ${totalOrigin} 条，文件内重复跳过 ${dupInFile}，数据库重复跳过 ${dupInDb}，实际导入 ${totalFinal}，成功 ${importSuccess.value}，失败 ${importFail.value}`
    );
    console.warn("Import fail detail:", failList);
  } else {
    ElMessage.success(
      `导入完成：原始 ${totalOrigin} 条，文件内重复跳过 ${dupInFile}，数据库重复跳过 ${dupInDb}，实际导入 ${totalFinal}，成功 ${importSuccess.value}`
    );
  }
}

async function batchRemove() {
  const rows = selectedRows.value || [];
  if (!rows.length) return;

  await ElMessageBox.confirm(
    `确认删除选中的 ${rows.length} 条题目？此操作不可恢复！`,
    "提示",
    { type: "warning" }
  );

  tableLoading.value = true;
  let ok = 0;
  let fail = 0;

  try {
    for (const r of rows) {
      try {
        await qbDelete(r.id);
        ok += 1;
      } catch (e) {
        fail += 1;
      }
    }
  } finally {
    tableLoading.value = false;
  }

  if (fail) {
    ElMessage.warning(`批量删除完成：成功 ${ok}，失败 ${fail}`);
  } else {
    ElMessage.success(`批量删除完成：成功 ${ok}`);
  }

  // 清空选中 + 刷新
  selectedRows.value = [];
  await fetchList();
}

onMounted(fetchList);
</script>

<style scoped>
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.title {
  font-weight: 800;
}
.header-actions {
  display: flex;
  gap: 10px;
  align-items: center;
}

.query {
  margin-bottom: 12px;
}
.pager {
  margin-top: 12px;
  display: flex;
  justify-content: flex-end;
}

/* 选项区域 */
.opt-wrap {
  width: 100%;
}
.opt-scroll {
  width: 100%;
  overflow-x: auto;
  padding-bottom: 6px;
}
.opt-actions {
  margin: 10px 0;
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

/* 批量导入区域 */
.import-tips {
  background: #f8fafc;
  border: 1px solid #eef2f7;
  border-radius: 10px;
  padding: 10px 12px;
  margin-bottom: 10px;
}
.tip-line {
  font-size: 12px;
  color: #475569;
  line-height: 1.6;
}

.import-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.import-preview-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
  font-weight: 700;
}

.import-error-box {
  margin-top: 10px;
  border: 1px solid #fecaca;
  background: #fff1f2;
  border-radius: 10px;
  padding: 10px 12px;
}
.err-title {
  font-weight: 800;
  margin-bottom: 6px;
  color: #9f1239;
}
.err-item {
  font-size: 12px;
  color: #9f1239;
  line-height: 1.6;
}

.import-progress {
  margin-top: 10px;
}
.import-progress-text {
  margin-top: 6px;
  font-size: 12px;
  color: #475569;
}
</style>
