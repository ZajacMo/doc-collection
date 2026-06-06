<template>
  <!-- 作业编辑/创建对话框 -->
  <el-dialog
    :title="dialogTitle"
    v-model="localVisible"
    @close="handleClose"
    width="90%"
    :max-width="640"
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="rules"
      label-width="100px"
    >
      <el-form-item label="作业名称" prop="title">
        <el-input v-model="formData.title" placeholder="请输入作业名称"></el-input>
      </el-form-item>

      <el-form-item label="作业描述" prop="description">
        <el-input
          v-model="formData.description"
          type="textarea"
          placeholder="请输入作业描述"
          :rows="4"
        ></el-input>
      </el-form-item>

      <el-form-item label="截止日期" prop="deadline">
        <el-date-picker
          v-model="formData.deadline"
          type="datetime"
          placeholder="选择截止日期时间"
          style="width: 100%"
        ></el-date-picker>
      </el-form-item>

      <!-- 提交人员 -->
      <el-form-item label="提交人员" prop="relativeStudents" class="stacked-content">
        <el-checkbox v-model="unlimitedStudents">全部学生</el-checkbox>
        <p v-show="!unlimitedStudents" class="form-tip">取消勾选后可指定部分学生提交</p>

        <div v-show="!unlimitedStudents" class="select-box">
          <div class="select-toolbar">
            <el-button size="small" @click="selectAllStudents">全选</el-button>
            <el-button size="small" @click="clearAllStudents">清空</el-button>
            <span class="select-count">已选 {{ formData.relativeStudents.length }} 人</span>
          </div>
          <div v-if="studentGroups.length > 0" class="group-select-toolbar">
            <span style="font-size: 12px; color: var(--el-text-color-secondary);">按班级选择：</span>
            <el-button
              v-for="group in studentGroups"
              :key="group.className"
              link
              size="small"
              @click="selectGroupStudents(group)"
            >
              {{ group.className }}
            </el-button>
          </div>
          <el-select
            v-model="formData.relativeStudents"
            multiple
            filterable
            placeholder="搜索学号或姓名"
            style="width: 100%"
          >
            <el-option-group
              v-for="group in studentGroups"
              :key="group.className"
              :label="group.className"
            >
              <el-option
                v-for="stu in group.students"
                :key="stu.value"
                :label="`${stu.label}（${stu.value}）`"
                :value="stu.value"
              ></el-option>
            </el-option-group>
          </el-select>
        </div>
      </el-form-item>

      <!-- 允许的文件类型 -->
      <el-form-item label="提交类型" prop="fileTypes" class="stacked-content">
        <el-checkbox v-model="unlimitedTypes">不限提交类型</el-checkbox>

        <div v-show="!unlimitedTypes" class="select-box">
          <!-- 已选标签 -->
          <div v-if="formData.fileTypes.length > 0" class="selected-tags">
            <el-tag
              v-for="ext in formData.fileTypes"
              :key="ext"
              closable
              size="small"
              @close="removeFileType(ext)"
            >
              .{{ ext }}
            </el-tag>
          </div>

          <!-- 快捷操作 -->
          <div class="select-toolbar">
            <el-button size="small" @click="selectAllFileTypes">全选</el-button>
            <el-button size="small" @click="clearAllFileTypes">清空</el-button>
            <span class="select-count">已选 {{ formData.fileTypes.length }} 项</span>
          </div>

          <!-- 分类折叠面板 -->
          <el-collapse v-model="activeFileGroups">
            <el-collapse-item
              v-for="group in FILE_TYPE_GROUPS"
              :key="group.title"
              :title="group.title"
              :name="group.title"
            >
              <div class="group-toolbar">
                <el-button link size="small" @click="selectGroup(group)">全选本组</el-button>
                <el-button link size="small" @click="clearGroup(group)">清空本组</el-button>
              </div>
              <el-checkbox-group v-model="formData.fileTypes" class="type-checkbox-grid">
                <el-checkbox
                  v-for="opt in group.types"
                  :key="opt.value"
                  :label="opt.value"
                  border
                  size="small"
                >
                  {{ opt.label }}
                </el-checkbox>
              </el-checkbox-group>
            </el-collapse-item>
          </el-collapse>
        </div>
      </el-form-item>

      <!-- 文件大小限制 -->
      <el-form-item label="文件大小限制" prop="maxFileSize">
        <el-input-number
          v-model="formData.maxFileSize"
          :min="1"
          :max="500"
          :step="1"
          step-strictly
          style="width: 160px"
        />
        <span style="margin-left: 8px; color: var(--el-text-color-secondary);">MB</span>
      </el-form-item>
    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleCancel">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue';
import { getAllUsers } from '../services/userService';

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  assignment: {
    type: Object,
    default: null
  },
  dialogType: {
    type: String,
    default: 'create',
    validator: (value) => ['create', 'update'].includes(value)
  }
});

const emit = defineEmits(['update:visible', 'cancel', 'submit']);

// ============ 文件类型分组配置 ============
const FILE_TYPE_GROUPS = [
  {
    title: '文档',
    types: [
      { label: '.pdf', value: 'pdf' },
      { label: '.doc', value: 'doc' },
      { label: '.docx', value: 'docx' },
      { label: '.xls', value: 'xls' },
      { label: '.xlsx', value: 'xlsx' },
      { label: '.ppt', value: 'ppt' },
      { label: '.pptx', value: 'pptx' }
    ]
  },
  {
    title: '图片',
    types: [
      { label: '.png', value: 'png' },
      { label: '.jpg', value: 'jpg' },
      { label: '.jpeg', value: 'jpeg' },
      { label: '.gif', value: 'gif' }
    ]
  },
  {
    title: '压缩',
    types: [
      { label: '.zip', value: 'zip' },
      { label: '.rar', value: 'rar' },
      { label: '.7z', value: '7z' }
    ]
  },
  {
    title: '代码 / 文本',
    types: [
      { label: '.txt', value: 'txt' },
      { label: '.md', value: 'md' },
      { label: '.csv', value: 'csv' },
      { label: '.json', value: 'json' },
      { label: '.xml', value: 'xml' },
      { label: '.c', value: 'c' },
      { label: '.cpp', value: 'cpp' },
      { label: '.java', value: 'java' },
      { label: '.py', value: 'py' },
      { label: '.js', value: 'js' },
      { label: '.ts', value: 'ts' },
      { label: '.html', value: 'html' },
      { label: '.css', value: 'css' }
    ]
  }
];

const ALL_FILE_TYPE_VALUES = FILE_TYPE_GROUPS.flatMap(g => g.types.map(t => t.value));

// ============ 本地状态 ============
const localVisible = ref(props.visible);
const formRef = ref(null);
const unlimitedTypes = ref(true);
const unlimitedStudents = ref(true);
const studentOptions = ref([]);
const studentGroups = ref([]);
const activeFileGroups = ref(['文档', '图片']);

// ============ 表单数据 ============
const formData = reactive({
  title: '',
  description: '',
  deadline: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000),
  fileTypes: [],
  relativeStudents: [],
  maxFileSize: 20
});

// ============ 验证规则 ============
const fileTypesValidator = (rule, value, callback) => {
  if (unlimitedTypes.value) return callback();
  if (!Array.isArray(value) || value.length < 1) return callback(new Error('请至少选择一种文件类型'));
  callback();
};

const rules = {
  title: [
    { required: true, message: '请输入作业名称', trigger: 'blur' },
    { min: 2, max: 100, message: '作业名称长度在 2 到 100 个字符之间', trigger: 'blur' }
  ],
  deadline: [
    { required: true, message: '请选择截止日期', trigger: 'change' }
  ],
  fileTypes: [
    { validator: fileTypesValidator, trigger: 'change' }
  ]
};

// ============ 计算属性 ============
const dialogTitle = computed(() => props.dialogType === 'create' ? '创建作业' : '编辑作业');

// ============ 数据加载 ============
const loadStudentOptions = async () => {
  try {
    const users = await getAllUsers();
    const students = Array.isArray(users) ? users.filter(u => u.role === 'student') : [];

    studentOptions.value = students.map(s => ({ label: s.name, value: s.studentId }));

    // 按 classes 数组分组（一个学生可出现在多个班级组中）
    const groupMap = new Map();
    for (const s of students) {
      const userClasses = s.classes || [];
      if (userClasses.length > 0) {
        for (const cls of userClasses) {
          const className = cls.name?.trim() || '未分组';
          if (!groupMap.has(className)) {
            groupMap.set(className, new Map());
          }
          groupMap.get(className).set(s.studentId, { label: s.name, value: s.studentId });
        }
      } else if (s.className?.trim()) {
        // 兼容旧数据：使用 className 字段
        const className = s.className.trim();
        if (!groupMap.has(className)) {
          groupMap.set(className, new Map());
        }
        groupMap.get(className).set(s.studentId, { label: s.name, value: s.studentId });
      } else {
        const className = '未分组';
        if (!groupMap.has(className)) {
          groupMap.set(className, new Map());
        }
        groupMap.get(className).set(s.studentId, { label: s.name, value: s.studentId });
      }
    }

    const sortedEntries = [...groupMap.entries()].sort((a, b) => {
      if (a[0] === '未分组') return 1;
      if (b[0] === '未分组') return -1;
      return a[0].localeCompare(b[0], 'zh-CN');
    });
    studentGroups.value = sortedEntries.map(([className, studentMap]) => ({
      className,
      students: [...studentMap.values()]
    }));
  } catch (e) {
    studentOptions.value = [];
    studentGroups.value = [];
  }
};

// ============ 文件类型快捷操作 ============
const removeFileType = (ext) => {
  const idx = formData.fileTypes.indexOf(ext);
  if (idx > -1) formData.fileTypes.splice(idx, 1);
};

const selectAllFileTypes = () => {
  formData.fileTypes = [...ALL_FILE_TYPE_VALUES];
};

const clearAllFileTypes = () => {
  formData.fileTypes = [];
};

const selectGroup = (group) => {
  const groupValues = group.types.map(t => t.value);
  const set = new Set(formData.fileTypes);
  groupValues.forEach(v => set.add(v));
  formData.fileTypes = [...set];
};

const clearGroup = (group) => {
  const groupValues = new Set(group.types.map(t => t.value));
  formData.fileTypes = formData.fileTypes.filter(v => !groupValues.has(v));
};

// ============ 学生快捷操作 ============
const selectAllStudents = () => {
  formData.relativeStudents = studentOptions.value.map(s => s.value);
};

const clearAllStudents = () => {
  formData.relativeStudents = [];
};

const selectGroupStudents = (group) => {
  const groupIds = group.students.map(s => s.value);
  const set = new Set(formData.relativeStudents);
  groupIds.forEach(id => set.add(id));
  formData.relativeStudents = [...set];
};

// ============ 对话框控制 ============
watch(() => props.visible, (newValue) => {
  localVisible.value = newValue;
});

watch(localVisible, (newValue) => {
  emit('update:visible', newValue);
});

const handleClose = () => {
  localVisible.value = false;
};

const resetForm = () => {
  if (props.dialogType === 'create') {
    formData.title = '';
    formData.description = '';
    formData.deadline = new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000);
    formData.fileTypes = [];
    formData.relativeStudents = [];
    formData.maxFileSize = 20;
    unlimitedTypes.value = true;
    unlimitedStudents.value = true;
  } else if (props.assignment) {
    formData.title = props.assignment.title || '';
    formData.description = props.assignment.description || '';
    formData.deadline = props.assignment.deadline ? new Date(props.assignment.deadline) : new Date();
    formData.fileTypes = Array.isArray(props.assignment.fileTypes) ? [...props.assignment.fileTypes] : [];
    unlimitedTypes.value = Array.isArray(formData.fileTypes) && formData.fileTypes.length === 0;
    formData.relativeStudents = Array.isArray(props.assignment.relativeStudents) ? [...props.assignment.relativeStudents] : [];
    unlimitedStudents.value = formData.relativeStudents.length === 0;
    formData.maxFileSize = props.assignment.maxFileSize || 20;
  }

  if (formRef.value) {
    formRef.value.resetFields();
  }
};

const handleCancel = () => {
  localVisible.value = false;
  emit('cancel');
};

const handleSubmit = async () => {
  try {
    await formRef.value.validate();

    const payload = { ...formData };
    if (unlimitedTypes.value) {
      payload.fileTypes = [];
    }
    if (unlimitedStudents.value) {
      payload.relativeStudents = [];
    }
    emit('submit', payload);
  } catch (error) {
    console.log('表单验证失败');
  }
};

watch(() => props.visible, (newVisible) => {
  if (newVisible) {
    resetForm();
    loadStudentOptions();
  }
}, { immediate: true });

watch(() => props.assignment, () => {
  if (props.visible && props.dialogType === 'update') {
    resetForm();
  }
}, { deep: true });
</script>

<style scoped>
/* content 垂直排列的表单项 */
.stacked-content :deep(.el-form-item__content) {
  display: block;
}

/* 提示文字 */
.form-tip {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin: 4px 0 0 0;
  line-height: 1.5;
}

/* 底部按钮 */
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

/* 统一的选择区域容器 */
.select-box {
  margin-top: 12px;
  border: 1px solid var(--el-border-color);
  border-radius: var(--el-border-radius-base);
  padding: 12px;
  background: var(--el-fill-color-lighter);
}

/* 已选标签 */
.selected-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 10px;
  padding-bottom: 10px;
  border-bottom: 1px dashed var(--el-border-color-light);
}

/* 工具栏 */
.select-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}

.select-count {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-left: auto;
}

/* 组内工具栏 */
.group-toolbar {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}

/* 类型复选框网格 */
.type-checkbox-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.type-checkbox-grid :deep(.el-checkbox) {
  margin-right: 0;
  min-width: 76px;
  justify-content: center;
}

/* 折叠面板去默认内边距 */
.select-box :deep(.el-collapse) {
  border: none;
}

.select-box :deep(.el-collapse-item__header) {
  padding-left: 0;
  padding-right: 0;
  font-size: 14px;
  font-weight: 500;
}

.select-box :deep(.el-collapse-item__wrap) {
  padding-left: 0;
  padding-right: 0;
}

.select-box :deep(.el-collapse-item__content) {
  padding-bottom: 8px;
}

/* 按班级快速选择 */
.group-select-toolbar {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 10px;
  flex-wrap: wrap;
}
</style>
