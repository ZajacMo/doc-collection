<template>
  <!-- 作业编辑/创建对话框 -->
  <el-dialog 
    :title="dialogTitle" 
    v-model="localVisible"
    @close="handleClose"
    width="90%"
    :max-width="600"
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
      <el-form-item label="提交人员" prop="relativeStudents">
        <div style="margin-bottom:8px;">
          <el-checkbox v-model="unlimitedStudents">全部学生</el-checkbox>
        </div>
        <el-select
          v-model="formData.relativeStudents"
          multiple
          filterable
          placeholder="选择需要提交的学生（学号）"
          :disabled="unlimitedStudents"
        >
          <el-option
            v-for="stu in studentOptions"
            :key="stu.value"
            :label="`${stu.label}（${stu.value}）`"
            :value="stu.value"
          ></el-option>
        </el-select>
        <div class="form-tip">不选择表示全部学生需要提交</div>
      </el-form-item>
      <!-- 文件命名规则表单项已移除 -->
      <el-form-item label="允许的文件类型" prop="fileTypes">
        <div style="margin-bottom:8px;">
          <el-checkbox v-model="unlimitedTypes">不限提交类型</el-checkbox>
        </div>
        <el-select 
          v-model="formData.fileTypes" 
          multiple 
          placeholder="选择允许的文件类型"
          :disabled="unlimitedTypes"
        >
          <el-option 
            v-for="opt in SUPPORTED_FILE_TYPES" 
            :key="opt.value" 
            :label="opt.label" 
            :value="opt.value"
          ></el-option>
        </el-select>
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

<script>
import { ref, reactive, computed, onMounted, watch, shallowRef } from 'vue';
import { getAllUsers } from '../services/userService';

export default {
  name: 'AssignmentFormDialog',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    // 编辑模式时传入的作业数据
    assignment: {
      type: Object,
      default: null
    },
    // 对话框类型：'create' 或 'update'
    dialogType: {
      type: String,
      default: 'create',
      validator: (value) => {
        return ['create', 'update'].includes(value);
      }
    }
  },
  emits: ['update:visible', 'cancel', 'submit'],
  setup(props, { emit }) {
    const SUPPORTED_FILE_TYPES = shallowRef([
      { label: 'PDF', value: 'pdf' },
      { label: 'Word 文档', value: 'doc' },
      { label: 'Word 文档', value: 'docx' },
      { label: 'Excel 表格', value: 'xls' },
      { label: 'Excel 表格', value: 'xlsx' },
      { label: 'PPT 演示', value: 'ppt' },
      { label: 'PPT 演示', value: 'pptx' },
      { label: '文本', value: 'txt' },
      { label: 'Markdown', value: 'md' },
      { label: '图片', value: 'png' },
      { label: '图片', value: 'jpg' },
      { label: '图片', value: 'jpeg' },
      { label: '图片', value: 'gif' },
      { label: '数据', value: 'csv' },
      { label: '数据', value: 'json' },
      { label: '数据', value: 'xml' },
      { label: '压缩包', value: 'zip' },
      { label: '压缩包', value: 'rar' },
      { label: '压缩包', value: '7z' },
      { label: '代码', value: 'c' },
      { label: '代码', value: 'cpp' },
      { label: '代码', value: 'java' },
      { label: '代码', value: 'py' },
      { label: '代码', value: 'js' },
      { label: '代码', value: 'ts' },
      { label: '网页', value: 'html' },
      { label: '网页', value: 'css' }
    ]);
    // 本地响应式引用，用于存储visible状态
    const localVisible = ref(props.visible);
    
    // 监听props中的visible变化，同步到本地变量
    watch(() => props.visible, (newValue) => {
      localVisible.value = newValue;
    });
    
    // 监听本地visible变化，发出update事件
    watch(localVisible, (newValue) => {
      emit('update:visible', newValue);
    });
    
    // 表单引用与开关声明（确保在任何引用之前）
    const formRef = ref(null);
    const unlimitedTypes = ref(false);
    const unlimitedStudents = ref(true);
    const studentOptions = ref([]);
    const fileTypesValidator = (rule, value, callback) => {
      if (unlimitedTypes.value) return callback();
      if (!Array.isArray(value) || value.length < 1) return callback(new Error('请至少选择一种文件类型'));
      callback();
    };
    const loadStudentOptions = async () => {
      try {
        const users = await getAllUsers();
        const students = Array.isArray(users) ? users.filter(u => u.role === 'student') : [];
        studentOptions.value = students.map(s => ({ label: s.name, value: s.studentId }));
      } catch (e) {
        studentOptions.value = [];
      }
    };

    // 表单数据
    const formData = reactive({
      title: '',
      description: '',
      deadline: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000), // 默认一周后
      fileTypes: ['pdf', 'png', 'jpg', 'jg', 'zip', 'rar'],
      relativeStudents: []
    });
    
    // 表单验证规则
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
      ],
      relativeStudents: [
        { required: false, trigger: 'change' }
      ]
    };
    
    // 对话框标题
    const dialogTitle = computed(() => {
      return props.dialogType === 'create' ? '创建作业' : '编辑作业';
    });
    
    // 处理对话框关闭
    const handleClose = () => {
      localVisible.value = false;
    };

    // 重置表单
    const resetForm = () => {
      // 重置表单数据
      if (props.dialogType === 'create') {
        // 创建模式：使用默认值
        formData.title = '';
        formData.description = '';
        formData.deadline = new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000);
        formData.fileTypes = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'zip', 'rar'];
        formData.relativeStudents = [];
        unlimitedTypes.value = false;
        unlimitedStudents.value = true;
      } else if (props.assignment) {
        // 编辑模式：使用传入的作业数据
        formData.title = props.assignment.title || '';
        formData.description = props.assignment.description || '';
        formData.deadline = props.assignment.deadline ? new Date(props.assignment.deadline) : new Date();
        formData.fileTypes = Array.isArray(props.assignment.fileTypes) ? [...props.assignment.fileTypes] : [];
        unlimitedTypes.value = Array.isArray(formData.fileTypes) && formData.fileTypes.length === 0;
        formData.relativeStudents = Array.isArray(props.assignment.relativeStudents) ? [...props.assignment.relativeStudents] : [];
        unlimitedStudents.value = formData.relativeStudents.length === 0;
      }
      
      // 重置表单验证状态
      if (formRef.value) {
        formRef.value.resetFields();
      }
    };
    
    // 处理取消
    const handleCancel = () => {
      localVisible.value = false;
      emit('cancel');
    };
    
    // 处理提交
    const handleSubmit = async () => {
      try {
        // 表单验证
        await formRef.value.validate();
        
        // 提交表单数据
        const payload = { ...formData };
        if (unlimitedTypes.value) {
          payload.fileTypes = [];
        }
        if (unlimitedStudents.value) {
          payload.relativeStudents = [];
        }
        emit('submit', payload);
      } catch (error) {
        // 表单验证失败，不执行后续操作
        console.log('表单验证失败');
      }
    };
    
    // 监听对话框可见状态变化
    watch(() => props.visible, (newVisible) => {
      if (newVisible) {
        resetForm();
        loadStudentOptions();
      }
    }, { immediate: true });
    
    // 监听作业数据变化（编辑模式下）
    watch(() => props.assignment, () => {
      if (props.visible && props.dialogType === 'update') {
        resetForm();
      }
    }, { deep: true });
    
    return {
      formRef,
      formData,
      rules,
      dialogTitle,
      localVisible,
      handleCancel,
      handleSubmit,
      handleClose,
      SUPPORTED_FILE_TYPES,
      unlimitedTypes,
      unlimitedStudents,
      studentOptions
    };
  }
};
</script>

<style scoped>
.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 5px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>
