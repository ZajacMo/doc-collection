<template>
  <div class="submission-management">
    <!-- 提交筛选和搜索 -->
    <div class="submission-filter">
      <el-row :gutter="20">
        <el-col :span="8">
          <el-select v-model="assignmentFilter" placeholder="选择作业"
            @change="handleFilterChange"
          >
            <el-option label="全部作业" value="all"></el-option>
            <el-option 
              v-for="assignment in allAssignments" 
              :key="assignment.id" 
              :label="assignment.title" 
              :value="assignment.id"
            ></el-option>
          </el-select>
        </el-col>
        <el-col :span="8">
          <el-select v-model="statusFilter" placeholder="选择状态"
            @change="handleFilterChange"
          >
            <el-option label="全部" value="all"></el-option>
            <el-option label="已提交" value="submitted"></el-option>
            <el-option label="已逾期" value="late"></el-option>
          </el-select>
        </el-col>
        <el-col :span="8">
          <el-input 
            v-model="searchKeyword" 
            placeholder="搜索用户（学号/姓名）" 
            prefix-icon="el-icon-search"
            @keyup.enter.native="handleSearch"
          >
            <el-button slot="append" icon="el-icon-search" @click="handleSearch"></el-button>
          </el-input>
        </el-col>
      </el-row>
    </div>

    <!-- 提交表格 -->
    <el-table 
      :data="paginatedSubmissions" 
      style="width: 100%"
      stripe
      border
      max-height="600"
    >
      <el-table-column type="index" label="序号" width="80"></el-table-column>
      <el-table-column prop="assignmentTitle" label="作业名称" min-width="180"></el-table-column>
      <el-table-column prop="studentId" label="学号" width="100"></el-table-column>
      <el-table-column prop="studentName" label="姓名" width="80"></el-table-column>
      <el-table-column prop="submitTime" label="提交时间" min-width="140">
        <template #default="{ row }">
          {{ row && row.submitTime ? formatDate(row.submitTime) : '-' }}
        </template>
      </el-table-column>
      <el-table-column prop="fileName" label="文件名" min-width="180"></el-table-column>
      <el-table-column prop="status" label="状态" min-width="80">
        <template #default="{ row }">
          <el-tag 
            v-if="row && row.status === 'submitted'"
            type="success"
          >
            已提交
          </el-tag>
          <el-tag 
            v-else-if="row && row.status === 'late'"
            type="danger"
          >
            已逾期
          </el-tag>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" min-width="120" fixed="right">
        <template #default="{ row }">
          <el-button 
            type="primary" 
            size="small" 
            :disabled="!row"
            @click="row && $emit('download-file', row.id, row.fileName)"
          >
            下载
          </el-button>
          <el-button 
            type="danger" 
            size="small" 
            :disabled="!row"
            @click="row && $emit('delete-submission', row.id)"
          >
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 提交分页 -->
    <div class="submission-pagination">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        :total="filteredSubmissions.length"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue';

/**
 * 提交管理组件
 * 负责作业提交的展示、筛选、搜索、分页和操作
 */
export default {
  name: 'SubmissionManagement',
  props: {
    allSubmissions: {
      type: Array,
      default: () => []
    },
    allAssignments: {
      type: Array,
      default: () => []
    }
  },
  emits: ['download-file', 'delete-submission'],
  setup(props, { emit }) {
    const assignmentFilter = ref('all');
    const statusFilter = ref('all');
    const searchKeyword = ref('');
    const currentPage = ref(1);
    const pageSize = ref(20);

    /**
     * 过滤提交数据
     * @returns {Array} 过滤后的提交列表
     */
    const filteredSubmissions = computed(() => {
      let result = [...props.allSubmissions];
      
      // 按作业筛选
      if (assignmentFilter.value !== 'all') {
        result = result.filter(submission => submission.assignmentId === assignmentFilter.value);
      }
      
      // 按状态筛选
      if (statusFilter.value !== 'all') {
        result = result.filter(submission => submission.status === statusFilter.value);
      }
      
      // 按关键词搜索
      if (searchKeyword.value) {
        const keyword = searchKeyword.value.toLowerCase();
        result = result.filter(submission => 
          submission.studentId.toLowerCase().includes(keyword) ||
          submission.studentName.toLowerCase().includes(keyword)
        );
      }
      
      return result;
    });

    /**
     * 分页处理后的提交数据
     * @returns {Array} 分页后的提交列表
     */
    const paginatedSubmissions = computed(() => {
      const start = (currentPage.value - 1) * pageSize.value;
      const end = start + pageSize.value;
      return filteredSubmissions.value.slice(start, end);
    });

    /**
     * 处理筛选条件变化
     */
    const handleFilterChange = () => {
      currentPage.value = 1;
    };

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
    const formatDate = (dateString) => {
      if (!dateString) return '';
      const date = new Date(dateString);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    };

    return {
      assignmentFilter,
      statusFilter,
      searchKeyword,
      currentPage,
      pageSize,
      filteredSubmissions,
      paginatedSubmissions,
      handleFilterChange,
      handleSearch,
      handleSizeChange,
      handleCurrentChange,
      formatDate
    };
  }
};
</script>

<style scoped>
.submission-management {
  background-color: white;
  padding: 30px;
  border-radius: 8px;
}

.submission-filter {
  margin-bottom: 20px;
}

.submission-pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>