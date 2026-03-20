<template>
  <el-card class="page-card">
    <template #header>
      <div class="card-header">
        <div class="title-wrap">
          <div class="title">排行榜查看</div>
          <div class="desc">查看挑战排行榜和积分排行榜，辅助管理员运营活动</div>
        </div>

        <div class="actions">
          <el-button @click="refreshCurrent">刷新</el-button>
        </div>
      </div>
    </template>

    <el-tabs v-model="activeTab">
      <el-tab-pane label="挑战排行榜" name="challenge">
        <div class="filter-bar">
          <el-select
            v-model="challengeQuery.challengeId"
            placeholder="选择挑战"
            clearable
            filterable
            style="width: 260px"
          >
            <el-option
              v-for="item in challengeOptions"
              :key="item.id"
              :label="item.title"
              :value="item.id"
            />
          </el-select>

          <el-input
            v-model="challengeQuery.keyword"
            placeholder="用户名 / 昵称 / 挑战名"
            clearable
            style="width: 240px"
          />

          <el-button type="primary" @click="searchChallenge">查询</el-button>
          <el-button @click="resetChallenge">重置</el-button>
        </div>

        <el-table :data="challengeList" border v-loading="challengeLoading">
          <el-table-column prop="rankNo" label="排名" width="80" />
          <el-table-column prop="challengeTitle" label="挑战名称" min-width="180" show-overflow-tooltip />
          <el-table-column prop="challengeType" label="类型" width="100">
            <template #default="{ row }">
              <el-tag>{{ typeText(row.challengeType) }}</el-tag>
            </template>
          </el-table-column>

          <el-table-column label="用户信息" min-width="180">
            <template #default="{ row }">
              <div>{{ row.nickname || "-" }}</div>
              <div class="sub-text">{{ row.username || "-" }}</div>
            </template>
          </el-table-column>

          <el-table-column prop="progressValue" label="当前进度" width="100" />
          <el-table-column prop="targetValue" label="目标值" width="100" />

          <el-table-column label="是否完成" width="100">
            <template #default="{ row }">
              <el-tag v-if="row.finished === 1" type="success">已完成</el-tag>
              <el-tag v-else type="info">未完成</el-tag>
            </template>
          </el-table-column>

          <el-table-column prop="finishTime" label="完成时间" width="180" />
          <el-table-column prop="createTime" label="参与时间" width="180" />
        </el-table>

        <div class="pager">
          <el-pagination
            v-model:current-page="challengePage.pageNum"
            v-model:page-size="challengePage.pageSize"
            :total="challengePage.total"
            layout="total, sizes, prev, pager, next, jumper"
            :page-sizes="[10, 20, 50]"
            @current-change="fetchChallengeRank"
            @size-change="onChallengeSizeChange"
          />
        </div>
      </el-tab-pane>

      <el-tab-pane label="积分排行榜" name="point">
        <div class="filter-bar">
          <el-input
            v-model="pointQuery.keyword"
            placeholder="用户名 / 昵称"
            clearable
            style="width: 240px"
          />

          <el-button type="primary" @click="searchPoint">查询</el-button>
          <el-button @click="resetPoint">重置</el-button>
        </div>

        <el-table :data="pointList" border v-loading="pointLoading">
          <el-table-column prop="rankNo" label="排名" width="80" />

          <el-table-column label="用户信息" min-width="200">
            <template #default="{ row }">
              <div>{{ row.nickname || "-" }}</div>
              <div class="sub-text">{{ row.username || "-" }}</div>
            </template>
          </el-table-column>

          <el-table-column prop="totalPoints" label="总积分" width="120">
            <template #default="{ row }">
              <span class="point-text">{{ row.totalPoints }}</span>
            </template>
          </el-table-column>

          <el-table-column prop="lastPointTime" label="最近积分时间" width="180" />
        </el-table>

        <div class="pager">
          <el-pagination
            v-model:current-page="pointPage.pageNum"
            v-model:page-size="pointPage.pageSize"
            :total="pointPage.total"
            layout="total, sizes, prev, pager, next, jumper"
            :page-sizes="[10, 20, 50]"
            @current-change="fetchPointRank"
            @size-change="onPointSizeChange"
          />
        </div>
      </el-tab-pane>
    </el-tabs>
  </el-card>
</template>

<script setup>
import { reactive, ref, onMounted, watch } from "vue";
import { usePage } from "../hooks/usePage";
import {
  leaderboardChallengeOptions,
  leaderboardChallengeRank,
  leaderboardPointRank,
} from "../api/leaderboard";

const activeTab = ref("challenge");

const challengeOptions = ref([]);
const challengeList = ref([]);
const challengeLoading = ref(false);
const pointList = ref([]);
const pointLoading = ref(false);

const { page: challengePage, resetToFirstPage: resetChallengeFirstPage } = usePage(10);
const { page: pointPage, resetToFirstPage: resetPointFirstPage } = usePage(10);

const challengeQuery = reactive({
  challengeId: null,
  keyword: "",
});

const pointQuery = reactive({
  keyword: "",
});

function typeText(v) {
  const map = {
    STEP: "步数挑战",
    RUN: "跑步挑战",
    DIET: "饮食挑战",
    CUSTOM: "自定义挑战",
  };
  return map[v] || v || "-";
}

async function fetchChallengeOptions() {
  challengeOptions.value = (await leaderboardChallengeOptions()) || [];
}

async function fetchChallengeRank() {
  challengeLoading.value = true;
  try {
    const pageData = await leaderboardChallengeRank({
      pageNum: challengePage.pageNum,
      pageSize: challengePage.pageSize,
      challengeId: challengeQuery.challengeId || undefined,
      keyword: challengeQuery.keyword || undefined,
    });

    challengeList.value = pageData?.records || [];
    challengePage.total = pageData?.total || 0;
  } finally {
    challengeLoading.value = false;
  }
}

async function fetchPointRank() {
  pointLoading.value = true;
  try {
    const pageData = await leaderboardPointRank({
      pageNum: pointPage.pageNum,
      pageSize: pointPage.pageSize,
      keyword: pointQuery.keyword || undefined,
    });

    pointList.value = pageData?.records || [];
    pointPage.total = pageData?.total || 0;
  } finally {
    pointLoading.value = false;
  }
}

function searchChallenge() {
  resetChallengeFirstPage();
  fetchChallengeRank();
}

function resetChallenge() {
  challengeQuery.challengeId = null;
  challengeQuery.keyword = "";
  resetChallengeFirstPage();
  fetchChallengeRank();
}

function onChallengeSizeChange() {
  resetChallengeFirstPage();
  fetchChallengeRank();
}

function searchPoint() {
  resetPointFirstPage();
  fetchPointRank();
}

function resetPoint() {
  pointQuery.keyword = "";
  resetPointFirstPage();
  fetchPointRank();
}

function onPointSizeChange() {
  resetPointFirstPage();
  fetchPointRank();
}

function refreshCurrent() {
  if (activeTab.value === "challenge") {
    fetchChallengeRank();
  } else {
    fetchPointRank();
  }
}

watch(activeTab, (val) => {
  if (val === "challenge" && challengeList.value.length === 0) {
    fetchChallengeRank();
  }
  if (val === "point" && pointList.value.length === 0) {
    fetchPointRank();
  }
});

onMounted(async () => {
  await fetchChallengeOptions();
  await fetchChallengeRank();
});
</script>

<style scoped>
.page-card {
  border-radius: 14px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.title-wrap .title {
  font-size: 18px;
  font-weight: 700;
  color: #1f2937;
}

.title-wrap .desc {
  margin-top: 6px;
  font-size: 13px;
  color: #6b7280;
}

.actions {
  display: flex;
  gap: 10px;
}

.filter-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.pager {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

.sub-text {
  margin-top: 4px;
  font-size: 12px;
  color: #6b7280;
}

.point-text {
  font-weight: 700;
  color: #2563eb;
}
</style>