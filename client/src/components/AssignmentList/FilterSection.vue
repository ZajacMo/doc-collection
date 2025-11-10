<template>
  <div class="filter-section">
    <el-row :gutter="20">
      <el-col :span="6">
        <el-select v-model="statusFilter" placeholder="选择状态" @change="handleFilterChange">
          <el-option label="全部" value="all"></el-option>
          <el-option label="未提交" value="pending"></el-option>
          <el-option label="已提交" value="submitted"></el-option>
          <el-option label="已逾期" value="late"></el-option>
        </el-select>
      </el-col>
      <el-col :span="6">
        <el-select v-model="urgentFilter" placeholder="紧急程度" @change="handleFilterChange">
          <el-option label="全部" value="all"></el-option>
          <el-option label="紧急" value="urgent"></el-option>
          <el-option label="非紧急" value="normal"></el-option>
        </el-select>
      </el-col>
      <el-col :span="12">
        <el-input 
          v-model="searchKeyword" 
          placeholder="搜索作业名称" 
          prefix-icon="el-icon-search"
          @keyup.enter.native="handleSearch"
        >
          <el-button slot="append" icon="el-icon-search" @click="handleSearch"></el-button>
        </el-input>
      </el-col>
    </el-row>
  </div>
</template>

<script>
import { defineComponent, ref } from 'vue';

export default defineComponent({
  name: 'FilterSection',
  props: {
    initialStatusFilter: {
      type: String,
      default: 'all'
    },
    initialUrgentFilter: {
      type: String,
      default: 'all'
    },
    initialSearchKeyword: {
      type: String,
      default: ''
    }
  },
  emits: ['filter-change', 'search'],
  setup(props, { emit }) {
    const statusFilter = ref(props.initialStatusFilter);
    const urgentFilter = ref(props.initialUrgentFilter);
    const searchKeyword = ref(props.initialSearchKeyword);

    const handleFilterChange = () => {
      emit('filter-change', {
        statusFilter: statusFilter.value,
        urgentFilter: urgentFilter.value,
        searchKeyword: searchKeyword.value
      });
    };

    const handleSearch = () => {
      emit('search', {
        statusFilter: statusFilter.value,
        urgentFilter: urgentFilter.value,
        searchKeyword: searchKeyword.value
      });
    };

    return {
      statusFilter,
      urgentFilter,
      searchKeyword,
      handleFilterChange,
      handleSearch
    };
  }
});
</script>

<style scoped>
.filter-section {
  background-color: white;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
}

/* 移动端响应式样式 */
@media screen and (max-width: 768px) {
  .filter-section {
    padding: 15px;
  }
}
</style>