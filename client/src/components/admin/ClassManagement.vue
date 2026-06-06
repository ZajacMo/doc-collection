<template>
  <div class="class-management">
    <!-- 班级操作 -->
    <div class="class-actions">
      <el-button type="primary" @click="showAddDialog">
        添加班级
      </el-button>
    </div>

    <!-- 班级搜索 -->
    <div class="class-search">
      <el-input
        v-model="searchKeyword"
        placeholder="搜索班级（名称/年级）"
        @keyup.enter="handleSearch"
      >
        <el-button @click="handleSearch">搜索</el-button>
      </el-input>
    </div>

    <!-- 班级表格 -->
    <el-table
      :data="paginatedClasses"
      style="width: 100%"
      stripe
      border
      max-height="600"
    >
      <el-table-column type="index" label="序号" width="80"></el-table-column>
      <el-table-column prop="name" label="班级名称" min-width="150"></el-table-column>
      <el-table-column prop="grade" label="年级" width="120">
        <template #default="{ row }">
          {{ row.grade || '-' }}
        </template>
      </el-table-column>
      <el-table-column prop="description" label="描述" min-width="200">
        <template #default="{ row }">
          {{ row.description || '-' }}
        </template>
      </el-table-column>
      <el-table-column prop="createdAt" label="创建时间" width="180">
        <template #default="{ row }">
          {{ row.createdAt ? formatDate(row.createdAt) : '-' }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="280" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" size="small" @click="showStudentDialog(row)">
            管理学生
          </el-button>
          <el-button type="primary" size="small" @click="showEditDialog(row)">
            编辑
          </el-button>
          <el-button type="danger" size="small" @click="deleteClass(row.id, row.name)">
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 班级分页 -->
    <div class="class-pagination">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        :total="filteredClasses.length"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

    <!-- 添加/编辑班级对话框 -->
    <el-dialog
      :title="dialogType === 'add' ? '添加班级' : '编辑班级'"
      v-model="dialogVisible"
      width="500px"
    >
      <el-form ref="formRef" :model="formData" :rules="rules" label-width="100px">
        <el-form-item label="班级名称" prop="name">
          <el-input v-model="formData.name" placeholder="如：计算机1班"></el-input>
        </el-form-item>
        <el-form-item label="年级">
          <el-input v-model="formData.grade" placeholder="如：2023级（可选）"></el-input>
        </el-form-item>
        <el-form-item label="描述">
          <el-input
            v-model="formData.description"
            type="textarea"
            :rows="3"
            placeholder="班级描述（可选）"
          ></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit">确定</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 管理班级学生对话框 -->
    <el-dialog
      title="管理班级学生"
      v-model="studentDialogVisible"
      width="600px"
    >
      <div v-if="currentClass" class="student-dialog-header">
        <p><strong>{{ currentClass.name }}</strong> — 已选 {{ selectedStudentIds.length }} 人</p>
      </div>
      <div class="student-select-toolbar">
        <el-button size="small" @click="selectAllStudents">全选</el-button>
        <el-button size="small" @click="clearAllStudents">清空</el-button>
      </div>
      <el-select
        v-model="selectedStudentIds"
        multiple
        filterable
        placeholder="搜索学号或姓名选择学生"
        style="width: 100%"
      >
        <el-option
          v-for="stu in allStudents"
          :key="stu.id"
          :label="`${stu.name}（${stu.studentId}）`"
          :value="stu.id"
        />
      </el-select>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="studentDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveClassStudents">保存</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { formatDate } from '@/utils/date';
import {
  getAllClasses,
  createClass,
  updateClass,
  deleteClass as deleteClassAPI,
  getClassStudents,
  setClassStudents
} from '../../services/classService';
import { getAllUsers } from '../../services/userService';

const emit = defineEmits(['data-updated']);

// 数据
const allClasses = ref([]);
const allStudents = ref([]);
const searchKeyword = ref('');
const currentPage = ref(1);
const pageSize = ref(20);

// 班级对话框
const dialogVisible = ref(false);
const dialogType = ref('add');
const currentEditId = ref(null);
const formRef = ref(null);
const formData = ref({
  name: '',
  grade: '',
  description: ''
});

const rules = {
  name: [
    { required: true, message: '请输入班级名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符之间', trigger: 'blur' }
  ]
};

// 学生管理对话框
const studentDialogVisible = ref(false);
const currentClass = ref(null);
const selectedStudentIds = ref([]);

// 加载数据
const loadData = async () => {
  try {
    const [classesData, usersData] = await Promise.all([
      getAllClasses(),
      getAllUsers()
    ]);
    allClasses.value = Array.isArray(classesData) ? classesData : [];
    allStudents.value = Array.isArray(usersData)
      ? usersData.filter(u => u.role === 'student')
      : [];
  } catch (error) {
    ElMessage.error('加载班级数据失败');
    console.error(error);
  }
};

onMounted(() => {
  loadData();
});

// 过滤
const filteredClasses = computed(() => {
  let result = [...allClasses.value];
  if (searchKeyword.value) {
    const kw = searchKeyword.value.toLowerCase();
    result = result.filter(cls =>
      (cls.name?.toLowerCase() || '').includes(kw) ||
      (cls.grade?.toLowerCase() || '').includes(kw)
    );
  }
  return result;
});

const paginatedClasses = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  return filteredClasses.value.slice(start, start + pageSize.value);
});

// 分页
const handleSearch = () => { currentPage.value = 1; };
const handleSizeChange = (size) => { pageSize.value = size; currentPage.value = 1; };
const handleCurrentChange = (current) => { currentPage.value = current; };

// 添加对话框
const showAddDialog = () => {
  dialogType.value = 'add';
  currentEditId.value = null;
  formData.value = { name: '', grade: '', description: '' };
  dialogVisible.value = true;
};

// 编辑对话框
const showEditDialog = (row) => {
  dialogType.value = 'edit';
  currentEditId.value = row.id;
  formData.value = { name: row.name, grade: row.grade || '', description: row.description || '' };
  dialogVisible.value = true;
};

// 提交班级
const handleSubmit = async () => {
  try {
    await formRef.value.validate();
    if (dialogType.value === 'add') {
      await createClass(formData.value);
      ElMessage.success('班级创建成功');
    } else {
      await updateClass(currentEditId.value, formData.value);
      ElMessage.success('班级更新成功');
    }
    dialogVisible.value = false;
    await loadData();
    emit('data-updated');
  } catch (error) {
    ElMessage.error(error.response?.data?.message || '操作失败');
  }
};

// 删除班级
const deleteClass = async (id, name) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除班级「${name}」吗？删除后将无法恢复。`,
      '确认删除',
      { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }
    );
    await deleteClassAPI(id);
    ElMessage.success('班级删除成功');
    await loadData();
    emit('data-updated');
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error.response?.data?.message || '删除失败');
    }
  }
};

// 学生管理对话框
const showStudentDialog = async (row) => {
  currentClass.value = row;
  selectedStudentIds.value = [];
  studentDialogVisible.value = true;
  try {
    const students = await getClassStudents(row.id);
    selectedStudentIds.value = Array.isArray(students)
      ? students.map(s => s.id)
      : [];
  } catch (error) {
    console.error('加载班级学生失败:', error);
  }
};

const selectAllStudents = () => {
  selectedStudentIds.value = allStudents.value.map(s => s.id);
};

const clearAllStudents = () => {
  selectedStudentIds.value = [];
};

const saveClassStudents = async () => {
  try {
    await setClassStudents(currentClass.value.id, selectedStudentIds.value);
    ElMessage.success('班级学生设置成功');
    studentDialogVisible.value = false;
    emit('data-updated');
  } catch (error) {
    ElMessage.error(error.response?.data?.message || '设置失败');
  }
};
</script>

<style scoped>
.class-management {
  background-color: var(--bg-card);
  padding: 30px;
  border-radius: var(--radius-sm);
}

.class-actions {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.class-search {
  margin-bottom: 20px;
}

.class-pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.student-dialog-header {
  margin-bottom: 12px;
}

.student-select-toolbar {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}
</style>
