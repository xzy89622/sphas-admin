// src/hooks/usePage.js
import { reactive } from "vue";

/**
 * ✅ 通用分页状态
 * 任何分页列表页都可以复用
 */
export function usePage(initPageSize = 10) {
  const page = reactive({
    pageNum: 1,
    pageSize: initPageSize,
    total: 0,
  });

  // 重置到第一页（通常用于“点击查询/重置筛选条件”时）
  const resetToFirstPage = () => {
    page.pageNum = 1;
  };

  return { page, resetToFirstPage };
}
