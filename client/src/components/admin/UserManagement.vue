<template>
  <div class="user-management">
    <!-- 用户操作 -->
    <div class="user-actions">
      <el-button type="primary" @click="$emit('show-import-dialog')">
        导入用户
      </el-button>
      <el-button type="primary" @click="$emit('show-add-dialog')">
        添加用户
      </el-button>
    </div>

    <!-- 用户搜索 -->
    <div class="user-search">
      <el-input
        v-model="searchKeyword"
        placeholder="搜索用户（学号/姓名/班级）"
        @keyup.enter="handleSearch"
      >
        <el-button @click="handleSearch">搜索</el-button>
      </el-input>
    </div>

    <!-- 用户表格 -->
    <el-table
      :data="paginatedUsers"
      style="width: 100%"
      stripe
      border
      max-height="600"
    >
      <el-table-column type="index" label="序号" width="80"></el-table-column>
      <el-table-column prop="studentId" label="学号" width="120"></el-table-column>
      <el-table-column prop="name" label="姓名" width="120"></el-table-column>
      <el-table-column prop="className" label="班级" width="120"></el-table-column>
      <el-table-column prop="role" label="角色" width="100">
        <template #default="{ row }">
          <el-tag
            v-if="row && row.role === 'admin'"
            type="danger"
          >
            管理员
          </el-tag>
          <el-tag
            v-else-if="row"
            type="primary"
          >
            学生
          </el-tag>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column prop="createdAt" label="创建时间" width="180">
        <template #default="{ row }">
          {{ row && row.createdAt ? formatDate(row.createdAt) : '-' }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="280" fixed="right">
        <template #default="{ row }">
          <template v-if="row">
            <el-button
              type="primary"
              size="small"
              @click="$emit('edit-user', row)"
            >
              编辑
            </el-button>
            <el-button
              v-if="row.role !== 'admin'"
              type="warning"
              size="small"
              @click="$emit('reset-password', row.id, row.name, row.studentId)"
            >
              重置密码
            </el-button>
            <el-button
              v-if="row.role !== 'admin'"
              type="danger"
              size="small"
              @click="$emit('delete-user', row.id, row.name)"
            >
              删除
            </el-button>
            <span v-else>-</span>
          </template>
          <span v-else>-</span>
        </template>
      </el-table-column>
    </el-table>

    <!-- 用户分页 -->
    <div class="user-pagination">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        :total="filteredUsers.length"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>
  </div>
</template>

<script setup>
import { formatDate } from "@/utils/date";
import { ref, computed } from 'vue';

const props = defineProps({
  allUsers: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['show-import-dialog', 'show-add-dialog', 'edit-user', 'delete-user', 'reset-password']);

const searchKeyword = ref('');
const currentPage = ref(1);
const pageSize = ref(20);

/**
 * 过滤用户数据
 * @returns {Array} 过滤后的用户列表
 */
const filteredUsers = computed(() => {
  let result = [...props.allUsers];

  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase();
    result = result.filter(user =>
      user.studentId?.toLowerCase().includes(keyword) ||
      user.name?.toLowerCase().includes(keyword) ||
      user.className?.toLowerCase().includes(keyword)
    );
  }

  return result;
});

/**
 * 分页处理后的用户数据
 * @returns {Array} 分页后的用户列表
 */
const paginatedUsers = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  return filteredUsers.value.slice(start, end);
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
</script>

<style scoped>
.user-management {
  background-color: var(--bg-card);
  padding: 30px;
  border-radius: var(--radius-sm);
}

.user-actions {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.user-search {
  margin-bottom: 20px;
}

.user-pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
