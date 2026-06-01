<template>
  <el-dropdown>
    <span class="el-dropdown-link">

      {{ userInfo?.user?.name || userInfo?.name || '管理员' }}

    </span>
    <template #dropdown>
      <el-dropdown-menu>
        <el-dropdown-item @click="onGoToProfile">
          个人中心
        </el-dropdown-item>
        <el-dropdown-item @click="onLogout">
            退出登录
        </el-dropdown-item>
      </el-dropdown-menu>
    </template>
  </el-dropdown>
</template>

<script setup>
import { formatDate } from "@/utils/date";

const props = defineProps({
  userInfo: {
    type: Object,
    default: null
  },
  onGoToProfile: {
    type: Function,
    required: true
  },
  onLogout: {
    type: Function,
    required: true
  }
});
</script>

<style scoped>
.el-dropdown-link {
  cursor: pointer;
  color: white;
  display: flex;
  align-items: center;
}

.el-dropdown-link i {
  margin-right: 5px;
}
</style>
