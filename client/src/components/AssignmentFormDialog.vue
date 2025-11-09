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
      <!-- 文件命名规则表单项已移除 -->
      <el-form-item label="允许的文件类型" prop="fileTypes">
        <el-select 
          v-model="formData.fileTypes" 
          multiple 
          placeholder="选择允许的文件类型"
        >
          <el-option label="PDF" value="pdf"></el-option>
          <el-option label="Word文档" value="doc"></el-option>
          <el-option label="Word文档" value="docx"></el-option>
          <el-option label="Excel表格" value="xls"></el-option>
          <el-option label="Excel表格" value="xlsx"></el-option>
          <el-option label="PPT演示" value="ppt"></el-option>
          <el-option label="PPT演示" value="pptx"></el-option>
          <el-option label="ZIP压缩" value="zip"></el-option>
          <el-option label="RAR压缩" value="rar"></el-option>
          <el-option label="图片" value="jpg"></el-option>
          <el-option label="图片" value="jpeg"></el-option>
          <el-option label="图片" value="png"></el-option>
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
import { ref, reactive, computed, onMounted, watch } from 'vue';

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
    
    // 表单引用
    const formRef = ref(null);
    
    // 表单数据
    const formData = reactive({
      title: '',
      description: '',
      deadline: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000), // 默认一周后
      fileTypes: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'zip', 'rar']
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
        {
          required: true,
          message: '请至少选择一种文件类型',
          trigger: 'change',
          type: 'array',
          min: 1
        }
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
      } else if (props.assignment) {
        // 编辑模式：使用传入的作业数据
        formData.title = props.assignment.title || '';
        formData.description = props.assignment.description || '';
        formData.deadline = props.assignment.deadline ? new Date(props.assignment.deadline) : new Date();
        formData.fileTypes = Array.isArray(props.assignment.fileTypes) ? [...props.assignment.fileTypes] : [];
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
        emit('submit', { ...formData });
      } catch (error) {
        // 表单验证失败，不执行后续操作
        console.log('表单验证失败');
      }
    };
    
    // 监听对话框可见状态变化
    watch(() => props.visible, (newVisible) => {
      if (newVisible) {
        // 对话框打开时重置表单
        resetForm();
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
      handleClose
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