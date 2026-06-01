<template>
  <div class="assignment-management">
    <!-- 作业操作 -->
    <div class="assignment-actions">
      <el-button type="primary" @click="$emit('show-create-dialog')">

        创建作业
      </el-button>
    </div>

    <!-- 作业搜索 -->
    <div class="assignment-search">
      <el-input
        v-model="searchKeyword"
        placeholder="搜索作业名称"

        @keyup.enter="handleSearch"
      >
        <el-button @click="handleSearch">搜索</el-button>
      </el-input>
    </div>

    <!-- 作业表格 -->
    <el-table
      :data="paginatedAssignments"
      style="width: 100%"
      stripe
      border
      max-height="600"
    >
      <el-table-column type="index" label="序号" width="80"></el-table-column>
      <el-table-column prop="title" label="作业名称" min-width="180"></el-table-column>
      <el-table-column prop="createTime" label="创建时间" min-width="140">
        <template #default="{ row }">
          {{ formatDate(row.createTime) }}
        </template>
      </el-table-column>
      <el-table-column prop="deadline" label="截止日期" min-width="140">
        <template #default="{ row }">
          {{ formatDate(row.deadline) }}
        </template>
      </el-table-column>
      <el-table-column prop="creator" label="创建者" width="120"></el-table-column>
      <el-table-column label="操作" width="180" fixed="right">
        <template #default="{ row }">
          <el-button
            type="primary"
            size="small"
            @click="$emit('view-detail', row.id)"
          >
            详情
          </el-button>
          <el-button
            type="danger"
            size="small"
            @click="$emit('delete-assignment', row.id, row.title)"
          >
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 作业分页 -->
    <div class="assignment-pagination">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        :total="filteredAssignments.length"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>
  </div>
</template>

<script setup>
import { formatDate } from "@/utils/date";
import { ref, computed } from 'vue';

/**
 * 作业管理组件
 * 负责作业的展示、搜索、分页和操作
 */

const props = defineProps({
  allAssignments: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['show-create-dialog', 'view-detail', 'delete-assignment']);

const searchKeyword = ref('');
const currentPage = ref(1);
const pageSize = ref(20);

/**
 * 过滤作业数据
 * @returns {Array} 过滤后的作业列表
 */
const filteredAssignments = computed(() => {
  let result = [...props.allAssignments];

  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase();
    result = result.filter(assignment =>
      assignment.title.toLowerCase().includes(keyword) ||
      assignment.description.toLowerCase().includes(keyword)
    );
  }

  return result;
});

/**
 * 分页处理后的作业数据
 * @returns {Array} 分页后的作业列表
 */
const paginatedAssignments = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  return filteredAssignments.value.slice(start, end);
});

/**
 * 处理搜索
 */
const handleSearch = () => {
  currentPage.value = 1;
};

/**
 * 处理每页大小变化
 * @param {number} size - 新的每页大小
 */
const handleSizeChange = (size) => {
  pageSize.value = size;
  currentPage.value = 1;
};

/**
 * 处理页码变化
 * @param {number} current - 新的页码
 */
const handleCurrentChange = (current) => {
  currentPage.value = current;
};

/**
 * 格式化日期时间
 * @param {string} dateString - 日期字符串
 * @returns {string} 格式化后的日期时间字符串
 */
</script>

<style scoped>
.assignment-management {
  background-color: var(--bg-card);
  padding: 30px;
  border-radius: var(--radius-sm);
}

.assignment-actions {
  margin-bottom: 20px;
}

.assignment-search {
  margin-bottom: 20px;
}

.assignment-pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
