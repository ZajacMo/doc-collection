<template>
  <div class="assignment-detail-container">
          <!-- 返回按钮 -->
          <div class="back-button-container">
            <el-button type="text" @click="goBack">
              <i class="el-icon-arrow-left"></i>
              返回作业列表
            </el-button>
          </div>

          <!-- 加载状态 -->
          <div v-if="loading" class="loading-container">
            <el-icon class="is-loading"><Loading /></el-icon>
            <p>加载中...</p>
          </div>

          <!-- 作业详情卡片 -->
          <div v-else-if="assignment" class="assignment-detail-card">
            <!-- 作业标题和状态 -->
            <div class="assignment-header">
              <h1 class="assignment-title">{{ assignment.title }}</h1>
              <el-tag 
                v-if="userSubmission && userSubmission.status === 'submitted' && !isAssignmentExpired(assignment.deadline)"
                type="success"
                size="large"
              >
                已提交
              </el-tag>
              <el-tag 
                v-else-if="userSubmission && (userSubmission.status === 'late' || (userSubmission.status === 'submitted' && isAssignmentExpired(assignment.deadline)))"
                type="danger"
                size="large"
              >
                已逾期
              </el-tag>
              <el-tag 
                v-else-if="isAssignmentExpired(assignment.deadline)"
                type="danger"
                size="large"
              >
                已逾期
              </el-tag>
              <el-tag 
                v-else-if="isAssignmentUrgent(assignment.deadline)"
                type="warning"
                size="large"
              >
                紧急
              </el-tag>
              <el-tag 
                v-else
                type="info"
                size="large"
              >
                进行中
              </el-tag>
            </div>

            <!-- 作业基本信息 -->
            <div class="assignment-info">
              <div class="info-row">
                <div class="info-label">创建时间：</div>
                <div class="info-value">{{ formatDate(assignment.createTime) }}</div>
              </div>
              <div class="info-row">
                <div class="info-label">截止日期：</div>
                <div class="info-value" :class="{
                  'text-danger': isAssignmentExpired(assignment.deadline),
                  'text-warning': isAssignmentUrgent(assignment.deadline)
                }">
                  {{ formatDate(assignment.deadline) }}
                  <span v-if="!isAssignmentExpired(assignment.deadline)" class="countdown">
                    （剩余：{{ getCountdown(assignment.deadline) }}）
                  </span>
                </div>
              </div>
              <div class="info-row">
                <div class="info-label">创建者：</div>
                <div class="info-value">{{ assignment.creator || '管理员' }}</div>
              </div>
            </div>

            <!-- 作业描述 -->
            <div class="assignment-description">
              <h3>作业描述</h3>
              <p>{{ assignment.description || '暂无描述' }}</p>
            </div>



            <!-- 提交作业表单 - 仅当用户未提交且作业未过期时显示 -->
            <div v-if="!userSubmission && !isAssignmentExpired(assignment.deadline)" class="submit-form-container">
              <el-form 
                ref="submitFormRef" 
                :model="submitForm" 
                :rules="submitRules" 
                label-width="100px"
              >
                <!-- 用户信息显示和手动输入选项 -->
                <el-form-item label="学号" prop="studentId">
                  <el-input 
                    v-model="submitForm.studentId" 
                    placeholder="请输入学号"
                    :disabled="submitForm.studentId && !manualInputEnabled"
                  >
                    <template slot="append">
                      <el-button 
                        size="small" 
                        type="text" 
                        @click="manualInputEnabled = !manualInputEnabled"
                      >
                        {{ manualInputEnabled ? '自动获取' : '手动输入' }}
                      </el-button>
                    </template>
                  </el-input>
                </el-form-item>
                <el-form-item label="姓名" prop="studentName">
                  <el-input 
                    v-model="submitForm.studentName" 
                    placeholder="请输入姓名"
                    :disabled="submitForm.studentName && !manualInputEnabled"
                  >
                    <template slot="append">
                      <el-button 
                        size="small" 
                        type="text" 
                        @click="manualInputEnabled = !manualInputEnabled"
                      >
                        {{ manualInputEnabled ? '自动获取' : '手动输入' }}
                      </el-button>
                    </template>
                  </el-input>
                  <el-tag v-if="!submitForm.studentId" type="warning" size="small" style="margin-top: 5px; display: block;">
                    提示：如果自动获取失败，请手动输入学号和姓名
                  </el-tag>
                </el-form-item>

                <el-form-item label="提交文件" prop="fileId">
                  <!-- 重要：当作业过期时，禁用文件上传按钮 -->
                  <!-- 添加:disabled属性并绑定到isAssignmentExpired(assignment.deadline)条件 -->
                  <!-- accept属性已移除，允许上传任意文件类型 -->
                  <el-upload
                    class="upload-demo"
                    :action="uploadUrl"
                    :headers="uploadHeaders"
                    :on-success="handleUploadSuccess"
                    :on-error="handleUploadError"
                    :before-upload="beforeUpload"
                    :data="getUploadData()"
                    :show-file-list="true"
                    :file-list="fileList"
                    :multiple="false"
                    :on-remove="handleRemove"
                    :disabled="isAssignmentExpired(assignment.deadline)"
                  >
                    <el-button 
                      size="small" 
                      type="primary"
                      :disabled="isAssignmentExpired(assignment.deadline)"
                    >
                      {{ isAssignmentExpired(assignment.deadline) ? '作业已过期，无法上传' : '选择文件' }}
                    </el-button>
                    <div slot="tip" class="el-upload__tip">
                      支持的文件大小不超过20MB
                    </div>
                  </el-upload>
                  <el-alert
                    v-if="uploadSuccess"
                    title="作业提交成功！"
                    type="success"
                    :closable="false"
                    show-icon
                  />
                </el-form-item>
              </el-form>
            </div>
            
            <!-- 已提交作业状态卡片 - 当用户已提交作业时显示 -->
            <div v-else-if="userSubmission" class="submitted-status-card">
              <el-card shadow="hover">
                <div class="submitted-header">
                  <div class="submitted-title">
                    <h3>作业提交状态</h3>
                    <el-tag 
                      :type="getSubmissionTagType()"
                      size="large"
                      class="status-tag"
                    >
                      {{ getSubmissionStatusText() }}
                    </el-tag>
                  </div>
                  
                  <el-alert 
                    v-if="userSubmission.status === 'submitted' && !isAssignmentExpired(assignment.deadline)"
                    title="恭喜您！作业已成功提交。"
                    type="success"
                    :closable="false"
                    show-icon
                    style="margin-bottom: 15px;"
                  ></el-alert>
                  
                  <el-alert 
                    v-else-if="userSubmission.status === 'submitted' && isAssignmentExpired(assignment.deadline)"
                    title="作业已提交，但已超过截止时间。"
                    type="warning"
                    :closable="false"
                    show-icon
                    style="margin-bottom: 15px;"
                  ></el-alert>
                  
                  <el-alert 
                    v-else-if="userSubmission.status === 'late'"
                    title="作业已逾期提交。"
                    type="warning"
                    :closable="false"
                    show-icon
                    style="margin-bottom: 15px;"
                  ></el-alert>
                </div>
                
                <div class="submitted-details">
                  <div class="detail-item">
                    <span class="detail-label">提交时间：</span>
                    <span class="detail-value">{{ formatDate(userSubmission.submitTime) }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">提交的文件：</span>
                    <span class="detail-value">{{ userSubmission.fileName }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">文件大小：</span>
                    <span class="detail-value">{{ formatFileSize(userSubmission.fileSize) }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">提交的学号：</span>
                    <span class="detail-value">{{ userSubmission.studentId }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">提交的姓名：</span>
                    <span class="detail-value">{{ userSubmission.studentName }}</span>
                  </div>
                </div>
                
                <div class="submitted-actions" style="margin-top: 20px; text-align: right;">
                  <el-button 
                    type="primary" 
                    size="medium"
                    @click="downloadMyFile"
                    icon="el-icon-download"
                  >
                    下载我的作业
                  </el-button>
                </div>
              </el-card>
            </div>
            
            <!-- 作业已过期提示 - 当作业已过期且用户未提交时显示 -->
            <div v-else-if="isAssignmentExpired(assignment.deadline) && !userSubmission" class="expired-notice-card">
              <el-card shadow="hover" type="danger">
                <div class="expired-content">
                  <el-alert 
                    title="作业已过期"
                    type="error"
                    description="很遗憾，该作业已超过截止日期，无法再提交。请联系老师获取帮助。"
                    show-icon
                    :closable="false"
                  ></el-alert>
                </div>
              </el-card>
            </div>

            <!-- 操作按钮 - 仅保留管理员操作 -->
            <div class="action-buttons">
              <el-button 
                v-if="userInfo?.role == 'admin'"
                type="warning" 
                size="large"
                @click="showUpdateDialog"
              >
                <i class="el-icon-edit"></i>
                编辑作业
              </el-button>
            </div>
          </div>
          

          <!-- 提交情况统计 -->
          <div v-if="assignment && userInfo?.role === 'admin'" class="submission-stats">
            <h3>提交情况统计</h3>
            <div class="stats-cards">
              <el-card class="stat-card">
                <div class="stat-content">
                  <div class="stat-number">{{ totalStudents }}</div>
                  <div class="stat-label">总人数</div>
                </div>
              </el-card>
              <el-card class="stat-card">
                <div class="stat-content">
                  <div class="stat-number">{{ submittedCount }}</div>
                  <div class="stat-label">已提交</div>
                  <div class="stat-percentage">{{ submittedPercentage }}%</div>
                </div>
              </el-card>
              <el-card class="stat-card">
                <div class="stat-content">
                  <div class="stat-number">{{ pendingCount }}</div>
                  <div class="stat-label">未提交</div>
                  <div class="stat-percentage">{{ pendingPercentage }}%</div>
                </div>
              </el-card>
            </div>
          </div>

          <!-- 提交列表 -->
          <div 
            v-if="assignment && ((userInfo?.role === 'admin' && submissionList.length > 0) || 
                              (userSubmission && userInfo?.role !== 'admin'))"
            class="submission-list"
          >
            <h3>{{ userInfo?.role === 'admin' ? '提交列表' : '我的提交记录' }}</h3>
            <el-table 
              :data="userInfo?.role === 'admin' ? submissionList : [userSubmission]" 
              style="width: 100%"
              stripe
              border
              max-height="600"
            >
              <el-table-column type="index" label="序号" min-width="60"></el-table-column>
              <el-table-column prop="studentId" label="学号" min-width="100"></el-table-column>
              <el-table-column prop="studentName" label="姓名" min-width="80"></el-table-column>
              <el-table-column prop="submitTime" label="提交时间" min-width="140">
                <template #default="scope">
                  {{ scope && scope.row ? formatDate(scope.row.submitTime) : '-' }}
                </template>
              </el-table-column>
              <el-table-column prop="fileName" label="文件名" min-width="180"></el-table-column>
              <el-table-column prop="fileSize" label="文件大小" min-width="80">
                <template #default="scope">
                  {{ scope && scope.row ? formatFileSize(scope.row.fileSize) : '-' }}
                </template>
              </el-table-column>
              <el-table-column prop="status" label="状态" min-width="80">
                <template #default="scope">
                  <el-tag v-if="scope && scope.row && scope.row.status === 'submitted'" type="success">已提交</el-tag>
                  <el-tag v-else-if="scope && scope.row && scope.row.status === 'late'" type="danger">已逾期</el-tag>
                  <span v-else>-</span>
                </template>
              </el-table-column>
              <el-table-column label="操作" min-width="120" fixed="right">
                <template #default="scope">
                  <el-button 
                    v-if="scope && scope.row && scope.row.fileId"
                    type="primary" 
                    size="small" 
                    @click="downloadFile(scope.row.fileId, scope.row.fileName)"
                  >
                    下载
                  </el-button>
                  <el-button 
                    v-if="userInfo?.role === 'admin' && scope && scope.row && scope.row.id"
                    type="danger" 
                    size="small" 
                    @click="deleteSubmission(scope.row.id)"
                  >
                    删除
                  </el-button>
                  <span v-if="!(scope && scope.row)">-</span>
                </template>
              </el-table-column>
            </el-table>
          </div>
    <!-- 复用的作业编辑对话框组件 -->
    <AssignmentFormDialog
      v-model:visible="updateDialogVisible"
      :assignment="assignment"
      dialog-type="update"
      @submit="handleUpdateAssignment"
    />
    
  </div>
</template>

<script>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AssignmentFormDialog from '../components/AssignmentFormDialog.vue';
import { ElMessage, ElMessageBox, ElLoading, ElIcon } from 'element-plus';
import { Loading } from '@element-plus/icons-vue';
import { getCurrentUserInfo, logoutUser, getCurrentUser } from '../services/userService';
import { 
  getAssignmentById, 
  updateAssignment, 
  isAssignmentExpired 
} from '../services/assignmentService';
import { 
  getSubmissionsByAssignment, 
  getSubmissionByUserAndAssignment, 
  deleteSubmission, 
  downloadFile as downloadFileAPI,
  submitAssignment
} from '../services/submissionService';

export default {
  name: 'AssignmentDetailView',
  components: {
    AssignmentFormDialog
  },
  setup() {
    const userInfo = ref(getCurrentUserInfo());
    const assignment = ref(null);
    const userSubmission = ref(null);
    const submissionList = ref([]);
    const allStudents = ref(0);
    const loading = ref(true);
    const updateDialogVisible = ref(false);
    
    // 新增：提交作业相关变量
    const submitFormRef = ref(null);
    const fileList = ref([]);
    const uploadUrl = 'http://localhost:3001/api/upload';
    const uploadHeaders = ref({});
    const uploadSuccess = ref(false);
    const originalFile = ref(null);
    const manualInputEnabled = ref(false);
    
    // 表单数据 - 添加默认值以避免空字符串问题
    const submitForm = ref({
      studentId: localStorage.getItem('studentId') || '', // 尝试从localStorage直接获取
      studentName: localStorage.getItem('studentName') || '',
      assignmentName: '',
      file: null
    });
    
    // 表单验证规则
    const submitRules = ref({
      assignmentName: [
        { required: true, message: '作业名称不能为空', trigger: 'blur' }
      ],
      studentId: [
        { required: true, message: '请输入学号', trigger: 'blur' }
      ],
      studentName: [
        { required: true, message: '请输入姓名', trigger: 'blur' }
      ]
    });
    
    // 格式化日期
    const formatDate = (dateString) => {
      if (!dateString) return '';
      const date = new Date(dateString);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    };
    
    // 检查作业是否紧急（24小时内截止）
    const isAssignmentUrgent = (deadline) => {
      const now = new Date();
      const deadlineDate = new Date(deadline);
      const diff = deadlineDate - now;
      return diff > 0 && diff < 24 * 60 * 60 * 1000;
    };
    
    // 计算剩余时间
    const getCountdown = (deadline) => {
      const now = new Date();
      const deadlineDate = new Date(deadline);
      const diff = deadlineDate - now;
      
      if (diff <= 0) return '已逾期';
      
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      
      if (days > 0) {
        return `${days}天${hours}小时`;
      } else if (hours > 0) {
        return `${hours}小时${minutes}分钟`;
      } else {
        return `${minutes}分钟`;
      }
    };
    
    // 格式化文件大小
    const formatFileSize = (bytes) => {
      if (!bytes) return '0 B';
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };
    
    // 获取提交状态标签类型
    const getSubmissionTagType = () => {
      if (userSubmission.value && userSubmission.value.status === 'submitted' && assignment.value && !isAssignmentExpired(assignment.value.deadline)) {
        return 'success'; // 按时提交
      }
      return 'danger'; // 逾期提交或已过期
    };
    
    // 获取提交状态文本
    const getSubmissionStatusText = () => {
      if (userSubmission.value && userSubmission.value.status === 'submitted' && assignment.value && !isAssignmentExpired(assignment.value.deadline)) {
        return '已提交'; // 按时提交
      }
      return '已逾期'; // 逾期提交或已过期
    };
    
    // 计算提交统计
    const totalStudents = computed(() => allStudents.value);
    const submittedCount = computed(() => submissionList.value.length);
    const pendingCount = computed(() => totalStudents.value - submittedCount.value);
    const submittedPercentage = computed(() => 
      totalStudents.value > 0 ? Math.round((submittedCount.value / totalStudents.value) * 100) : 0
    );
    const pendingPercentage = computed(() => 100 - submittedPercentage.value);
    
    // 使用Vue Router获取路由信息
    const route = useRoute();
    const router = useRouter();
    
    // 新增：提交作业相关方法
    // 获取上传数据 - 包含所有必要的表单信息
    const getUploadData = () => {
      const data = {
        studentId: submitForm.value.studentId || 
                  userInfo.value?.user?.studentId || 
                  localStorage.getItem('studentId') || '',
        studentName: submitForm.value.studentName || 
                    userInfo.value?.user?.name || 
                    localStorage.getItem('studentName') || '',
        assignmentId: getAssignmentIdFromUrl(),
        assignmentName: submitForm.value.assignmentName,
        description: submitForm.value.description || ''
      };
      return data;
    };
    
    // 上传前验证
    const beforeUpload = (file) => {
      // 不再验证文件类型，允许上传任意文件格式
      
      // 检查文件大小（20MB）
      const maxSize = 20 * 1024 * 1024;
      if (file.size > maxSize) {
        ElMessage.error('文件大小不能超过20MB');
        return false;
      }
      
      return true;
    };
    
    // 处理上传成功 - 直接提交作业到数据库，并修改前端显示的文件名为姓名-学号格式
    const handleUploadSuccess = async (response, file, fileListParam) => {
      // 更灵活地判断上传成功
      const isSuccess = response && (response.id || response.success === true || response.code === 200 || response.code === '200');
      
      if (isSuccess) {
        // 标记文件已上传成功
        uploadSuccess.value = true;
        
        // 直接使用组件传递的fileList参数更新本地fileList
        if (fileListParam && fileListParam.length > 0) {
          // 复制fileList以避免直接修改prop
          fileList.value = JSON.parse(JSON.stringify(fileListParam));
          fileList.value[0].status = 'success';
          originalFile.value = fileList.value[0].raw;
          
          // 修改前端显示的文件名：用姓名-学号覆盖原文件名
          // 获取文件扩展名
          const fileExtension = file.name.split('.').pop().toLowerCase();
          // 构建新的文件名：姓名-学号.扩展名
          const newFileName = `${submitForm.value.studentName}-${submitForm.value.studentId}.${fileExtension}`;
          // 更新显示的文件名
          fileList.value[0].name = newFileName;
        }
        
        // 直接提交作业到数据库，不再需要手动点击提交按钮
        try {
          // 表单验证
          await submitFormRef.value.validate();
          
          const assignmentId = getAssignmentIdFromUrl();
          // 使用修改后的文件名（姓名-学号格式）提交到数据库
          const formData = {
            assignmentId,
            studentId: submitForm.value.studentId,
            studentName: submitForm.value.studentName,
            assignmentName: submitForm.value.assignmentName,
            fileName: fileList.value?.[0]?.name || '', // 这里已经是修改后的姓名-学号格式的文件名
            filePath: response.path || response.filePath, // 添加文件路径
            fileSize: originalFile.value?.size || 0, // 添加文件大小
            fileId: response.id || response.fileId // 使用上传接口返回的文件ID
          };
          
          // 调用submitAssignment服务进行数据库插入操作
          await submitAssignment(formData);
          
          ElMessage.success('作业提交成功！');
          
          // 显示成功提示，并重定向到作业详情页（刷新页面）
          setTimeout(() => {
            loadData();
          }, 1500);
          
        } catch (error) {
          // 显示详细错误信息
          const errorMsg = error.response?.data?.message || error.message || '作业提交失败，请重试';
          ElMessage.error(errorMsg);
          
          // 处理文件相关错误
          if (errorMsg.includes('文件')) {
            ElMessage.warning('请重新上传文件后再尝试提交');
            uploadSuccess.value = false;
          }
        }
      } else {
        ElMessage.error('文件上传失败');
        uploadSuccess.value = false;
      }
    };
    
    // 处理上传错误
    const handleUploadError = (error) => {
      // 显示更详细的错误信息
      let errorMessage = '文件上传失败';
      if (error.response && error.response.data && error.response.data.message) {
        errorMessage = '文件上传失败: ' + error.response.data.message;
      } else if (error.message) {
        errorMessage = '文件上传失败: ' + error.message;
      }
      
      ElMessage.error(errorMessage);
      
      // 如果是学生不存在错误，尝试清除缓存并重新获取用户信息
      if (error.response?.data?.message === '学生不存在') {
        ElMessageBox.confirm(
          '检测到学生信息可能不匹配，是否清除缓存并重新获取用户信息？',
          '提示',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          }
        ).then(() => {
          localStorage.removeItem('studentId');
          localStorage.removeItem('studentName');
          // 重新加载页面
          window.location.reload();
        }).catch(() => {});
      }
    };
    
    // 处理文件移除
    const handleRemove = (file, fileList) => {
      fileList.value = fileList;
      // 清除上传状态
      uploadSuccess.value = false;
    };
    
    // 获取作业ID
    const getAssignmentIdFromUrl = () => {
      // 优先从route params获取作业ID，其次从query获取，最后从URL路径解析
      let assignmentId = route.params.id || route.query.id;
      
      // 如果都没有，则尝试从URL路径解析
      if (!assignmentId) {
        const pathSegments = window.location.pathname.split('/');
        assignmentId = pathSegments[pathSegments.length - 1];
      }
      
      console.log('Using assignmentId:', assignmentId);
      return assignmentId;
    };
    
    // 加载数据
    const loadData = async () => {
      try {
        loading.value = true;
        
        // 直接从route params获取ID，这是最可靠的方式
        let assignmentId = route.params.id;
        
        // 验证assignmentId是否有效
        if (!assignmentId || assignmentId.trim() === '') {
          throw new Error('无效的作业ID');
        }
        
        // 确保ID是字符串类型
        assignmentId = String(assignmentId);
        
        // 获取作业详情
        const assignmentData = await getAssignmentById(assignmentId);
        assignment.value = assignmentData;
        
        // 更新表单数据
        submitForm.value.assignmentName = assignmentData.title;
        
        // 从localStorage获取用户信息
        const userData = getCurrentUser();
        
        // 修正：尝试多种方式获取学生信息，确保studentId不为空
        const userIdFromUserData = userData?.user?.studentId;
        const userIdFromLocalStorage = localStorage.getItem('userInfo') ? JSON.parse(localStorage.getItem('userInfo')).user?.studentId : null;
        
        submitForm.value.studentId = userIdFromUserData || userIdFromLocalStorage || submitForm.value.studentId;
        submitForm.value.studentName = userData?.user?.name || (localStorage.getItem('userInfo') ? JSON.parse(localStorage.getItem('userInfo')).user?.name : '') || submitForm.value.studentName;
        
        // 保存到localStorage以便下次使用
        if (submitForm.value.studentId) {
          localStorage.setItem('studentId', submitForm.value.studentId);
        }
        if (submitForm.value.studentName) {
          localStorage.setItem('studentName', submitForm.value.studentName);
        }
        
        // 加载用户提交记录 - 使用用户的id字段而不是studentId
        const userSubmissionData = await getSubmissionByUserAndAssignment(userData?.user?.id, assignmentId);
        userSubmission.value = userSubmissionData;
        
        // 如果是管理员，获取所有提交记录和学生总数
        if (userData?.user?.role === 'admin') {
          const submissionListData = await getSubmissionsByAssignment(assignmentId);
          submissionList.value = submissionListData || [];
          
          // 假设总人数是从Excel加载的用户数
          // 这里简化处理，实际应该从后端获取
          allStudents.value = 50; // 示例值
        }
        
      } catch (error) {
        ElMessage.error('加载作业详情失败');
        console.error('加载作业详情失败:', error);
      } finally {
        loading.value = false;
      }
    };
    
    // 返回作业列表
    const goBack = () => {
      router.push('/assignments');
    };
    
    // goToSubmit函数已移除，因为提交按钮已删除
    
    // 跳转到个人中心
    const goToProfile = () => {
      router.push('/profile');
    };
    
    // 退出登录
    const handleLogout = () => {
      logoutUser();
    };
    
    // 显示编辑作业对话框
    const showUpdateDialog = () => {
      // 直接打开对话框，组件内部会处理表单数据的初始化
      if (assignment.value) {
        updateDialogVisible.value = true;
      } else {
        ElMessage.warning('作业数据未加载完成，请稍后再试');
      }
    };
    
    // 处理更新作业
    const handleUpdateAssignment = async (formData) => {
      try {
        // 调用更新作业接口
        const assignmentId = getAssignmentIdFromUrl();
        await updateAssignment(assignmentId, formData);
        
        ElMessage.success('作业更新成功');
        updateDialogVisible.value = false;
        
        // 重新加载数据
        loadData();
      } catch (error) {
        ElMessage.error(error.response?.data?.message || '更新作业失败');
        console.error('更新作业失败:', error);
      }
    };
    
    // 下载文件
    const downloadFile = async (fileId, fileName) => {
      try {
        await downloadFileAPI(fileId, fileName);
      } catch (error) {
        ElMessage.error('文件下载失败');
        console.error('文件下载失败:', error);
      }
    };
    
    // 下载我的文件
    const downloadMyFile = () => {
      if (userSubmission.value) {
        downloadFile(userSubmission.value.fileId, userSubmission.value.fileName);
      }
    };
    
    // 删除提交
    const deleteSubmission = async (submissionId) => {
      try {
        await ElMessageBox.confirm(
          '确定要删除此提交记录吗？删除后将无法恢复。',
          '确认删除',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          }
        );
        
        // 调用删除接口
        await deleteSubmission(submissionId);
        
        ElMessage.success('提交记录删除成功');
        
        // 重新加载数据
        loadData();
      } catch (error) {
        // 用户取消删除不会抛出错误，只有真正的错误才会显示提示
        if (error !== 'cancel') {
          ElMessage.error(error.response?.data?.message || '删除提交记录失败');
          console.error('删除提交记录失败:', error);
        }
      }
    };
    
    // 组件挂载时加载数据
    onMounted(() => {
      loadData();
    });
    
    return {
      userInfo,
      assignment,
      userSubmission,
      submissionList,
      loading,
      updateDialogVisible,
      totalStudents,
      submittedCount,
      pendingCount,
      submittedPercentage,
      pendingPercentage,
      formatDate,
      isAssignmentExpired,
      isAssignmentUrgent,
      getCountdown,
      formatFileSize,
      goBack,
      // goToSubmit函数已移除
      goToProfile,
      handleLogout,
      showUpdateDialog,
      handleUpdateAssignment,
      downloadFile,
      downloadMyFile,
      deleteSubmission,
      // 新增：提交作业相关返回值
      submitFormRef,
      fileList,
      uploadUrl,
      uploadHeaders,
      submitForm,
      submitRules,
      manualInputEnabled,
      uploadSuccess,
      originalFile,
      getUploadData,
      beforeUpload,
      handleUploadSuccess,
      handleUploadError,
      handleRemove,
      // 新增：状态识别辅助方法
      getSubmissionTagType,
      getSubmissionStatusText
    };
  }
}
</script>

<style scoped>
.assignment-detail-container {
  background-color: #f5f7fa;
  padding: 20px;
  width: 100%;
  min-height: calc(100vh - 60px); /* 考虑Header高度 */
}

/* 新增：提交表单相关样式 */
.submit-form-container {
  max-width: 800px;
  margin: 20px auto 0;
}

.assignment-title-section {
  background-color: white;
  padding: 30px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.assignment-title-section h1 {
  color: #303133;
  margin: 0 0 20px 0;
  font-size: 24px;
}

.expired-warning {
  margin-top: 20px;
}

.urgent-warning {
  margin-top: 20px;
}

.submit-form-card {
  background-color: white;
  padding: 30px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.back-button-container {
  margin-bottom: 20px;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 400px;
}

.assignment-detail-card {
  background-color: white;
  padding: 30px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.assignment-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid #e4e7ed;
}

.assignment-title {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
  margin: 0;
  flex: 1;
  margin-right: 20px;
}

.assignment-info {
  margin-bottom: 30px;
}

.info-row {
  display: flex;
  margin-bottom: 15px;
  align-items: center;
}

.info-label {
  width: 100px;
  color: #606266;
  font-weight: bold;
}

.info-value {
  color: #303133;
  font-size: 15px;
}

.countdown {
  font-size: 13px;
  color: #909399;
  margin-left: 10px;
}

.assignment-description {
  margin-bottom: 30px;
}

.assignment-description h3 {
  color: #303133;
  margin-bottom: 15px;
  font-size: 18px;
}

.assignment-description p {
  color: #606266;
  line-height: 1.8;
  font-size: 15px;
  white-space: pre-wrap;
}

/* 文件命名规则相关样式已移除 */

/* 文件类型相关样式已移除 */

.action-buttons {
  display: flex;
  gap: 10px;
}

.submission-stats {
  background-color: white;
  padding: 30px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.submission-stats h3 {
  color: #303133;
  margin-bottom: 20px;
  font-size: 18px;
}

.stats-cards {
  display: flex;
  gap: 20px;
}

.stat-card {
  flex: 1;
  min-width: 200px;
}

.stat-content {
  text-align: center;
}

.stat-number {
  font-size: 36px;
  font-weight: bold;
  color: #1890ff;
  margin-bottom: 10px;
}

.stat-label {
  font-size: 16px;
  color: #606266;
  margin-bottom: 5px;
}

.stat-percentage {
  font-size: 14px;
  color: #909399;
}

.submission-list {
  background-color: white;
  padding: 30px;
  border-radius: 8px;
}

.submission-list h3 {
  color: #303133;
  margin-bottom: 20px;
  font-size: 18px;
}

.text-danger {
  color: #f56c6c;
}

.text-warning {
  color: #e6a23c;
}

.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 5px;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .assignment-detail-card,
  .submission-stats,
  .submission-list {
    padding: 20px 15px;
  }
  
  .assignment-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }
  
  .stats-cards {
    grid-template-columns: 1fr;
  }
  
  .action-buttons {
    flex-direction: column;
    gap: 10px;
  }
  
  .action-buttons .el-button {
    width: 100%;
  }
  
  .el-table {
    overflow-x: auto;
  }
  
  /* 响应式文件命名规则样式已移除 */
}
</style>