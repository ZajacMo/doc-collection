<script setup>
import { House, DocumentCopy, Setting, Management } from '@element-plus/icons-vue'

// defineProps 和 defineEmits 是 Vue 3 编译器宏，不需要导入

// 定义props
const props = defineProps({
  activeMenuItem: {
    type: String,
    required: true
  },
  userInfo: {
    type: Object,
    default: null
  }
})

// 定义emits
const emit = defineEmits(['menu-select'])

// 处理菜单项选择
const handleMenuSelect = (index) => {
  emit('menu-select', index)
}
</script>

<template>
  <el-aside class="aside">
    <el-menu 
      :default-active="activeMenuItem"
      class="el-menu-vertical-demo"
      @select="handleMenuSelect"
    >
      <el-menu-item index="1">
        <el-icon><House /></el-icon>
        <span slot="title">首页</span>
      </el-menu-item>
      <el-menu-item index="2">
        <el-icon><DocumentCopy /></el-icon>
        <span slot="title">作业</span>
      </el-menu-item>
      <el-menu-item index="3" v-show="userInfo?.user?.role === 'admin' || userInfo?.role === 'admin'">
        <el-icon><Management /></el-icon>
        <span slot="title">管理</span>
      </el-menu-item>
    </el-menu>
  </el-aside>
</template>

<style scoped>
.aside {
  background-color: #304156;
  color: white;
  flex-shrink: 0;
  width: 240px;
  @media (max-width: 968px) {
    width: 100px;
  }
  @media (max-width: 580px) {
    width: 60px;
  }
}

.el-menu-vertical-demo {
  background-color: #304156;
  border-right: none;
  height: 100%;
}

.el-menu-vertical-demo .el-menu-item {
  color: rgba(255, 255, 255, 0.65);
}

.el-menu-vertical-demo .el-menu-item:hover {
  background-color: #0a5aa5;
  color: white;
}

.el-menu-vertical-demo .el-menu-item.is-active {
  background-color: #16538b;
  color: white;
}

/* 当导航栏宽度为60px时，只显示图标 */
@media (max-width: 580px) {
  .el-menu-item span {
    display: none;
  }
  
  .el-menu-item {
    padding: 0 10px !important;
    width: 60px;
    text-align: center;
  }
  
  .el-menu-item__content {
    justify-content: center;
  }
}
</style>