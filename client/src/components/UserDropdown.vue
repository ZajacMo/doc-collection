<template slot-scope="scope">
  <el-dropdown>
    <span class="el-dropdown-link">
      <i class="el-icon-user"></i>
      {{ userInfo?.name || '管理员' }}
      <i class="el-icon-arrow-down el-icon--right"></i>
    </span>
    <template #dropdown>
      <el-dropdown-menu>
        <el-dropdown-item @click.native="onGoToProfile">
          个人中心
        </el-dropdown-item>
        <el-dropdown-item @click.native="onLogout">
            退出登录
        </el-dropdown-item>
      </el-dropdown-menu>
    </template>
  </el-dropdown>
</template>

<script>

export default {
  name: 'UserDropdown',
  props: {
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
  }
};
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