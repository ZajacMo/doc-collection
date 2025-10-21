<template>
<!-- 需要在script部分导入这些图标 -->
  <div class="admin-panel-container">
          <!-- 页面标题 -->
          <div class="page-header">
            <h2>管理中心</h2>
          </div>

          <!-- 管理选项卡 -->
          <el-tabs v-model="activeTab" type="border-card" style="width: 100%">
            <!-- 系统概览 -->
            <el-tab-pane label="系统概览" name="overview">
              <div class="overview-section">
                <div class="overview-cards">
                  <el-card class="overview-card">
                    <div class="overview-content">
                      <div class="overview-icon">
                        <i class="el-icon-user"></i>
                      </div>
                      <div class="overview-info">
                        <div class="overview-number">{{ totalUsers }}</div>
                        <div class="overview-label">总用户数</div>
                      </div>
                    </div>
                  </el-card>
                  <el-card class="overview-card">
                    <div class="overview-content">
                      <div class="overview-icon">
                        <i class="el-icon-document-copy"></i>
                      </div>
                      <div class="overview-info">
                        <div class="overview-number">{{ totalAssignments }}</div>
                        <div class="overview-label">总作业数</div>
                      </div>
                    </div>
                  </el-card>
                  <el-card class="overview-card">
                    <div class="overview-content">
                      <div class="overview-icon">
                        <i class="el-icon-upload2"></i>
                      </div>
                      <div class="overview-info">
                        <div class="overview-number">{{ totalSubmissions }}</div>
                        <div class="overview-label">总提交数</div>
                      </div>
                    </div>
                  </el-card>
                  <el-card class="overview-card">
                    <div class="overview-content">
                      <div class="overview-icon">
                        <i class="el-icon-calendar"></i>
                      </div>
                      <div class="overview-info">
                        <div class="overview-number">{{ pendingAssignments }}</div>
                        <div class="overview-label">待截止作业</div>
                      </div>
                    </div>
                  </el-card>
                </div>

                <!-- 近期活动 -->
                <div class="recent-activities">
                  <h3>近期活动</h3>
                  <el-table 
                    :data="recentActivitiesData" 
                    style="width: 100%"
                    stripe
                    border
                    max-height="400"
                  >
                    <el-table-column prop="time" label="时间" min-width="120">
                      <template #default="{ row }">
                        {{ row && row.time ? formatDate(row.time) : '-' }}
                      </template>
                    </el-table-column>
                    <el-table-column prop="user" label="用户" min-width="100"></el-table-column>
                    <el-table-column prop="action" label="操作" min-width="200"></el-table-column>
                    <el-table-column prop="details" label="详情" min-width="150"></el-table-column>
                  </el-table>
                </div>
              </div>
            </el-tab-pane>

            <!-- 用户管理 -->
            <el-tab-pane label="用户管理" name="users">
              <div class="user-management">
                <!-- 用户操作 -->
                <div class="user-actions">
                  <el-button type="primary" @click="showImportUserDialog">
                    <i class="el-icon-upload2"></i>
                    导入用户
                  </el-button>
                  <el-button type="primary" @click="showAddUserDialog">
                    <i class="el-icon-plus"></i>
                    添加用户
                  </el-button>
                </div>

                <!-- 用户搜索 -->
                <div class="user-search">
                  <el-input 
                    v-model="userSearchKeyword" 
                    placeholder="搜索用户（学号/姓名/班级）" 
                    prefix-icon="el-icon-search"
                    @keyup.enter.native="handleUserSearch"
                  >
                    <el-button slot="append" icon="el-icon-search" @click="handleUserSearch"></el-button>
                  </el-input>
                </div>

                <!-- 用户表格 -->
                <el-table 
                  :data="filteredUsers" 
                  style="width: 100%"
                  stripe
                  border
                  max-height="600"
                >
                  <el-table-column type="index" label="序号" width="80"></el-table-column>
                  <el-table-column prop="studentId" label="学号" width="120"></el-table-column>
                  <el-table-column prop="name" label="姓名" width="120"></el-table-column>
                  <el-table-column prop="class" label="班级" width="120"></el-table-column>
                  <el-table-column prop="role" label="角色" width="100">
                    <template #default="{ row }">
                      <el-tag 
                        v-if="row && row.role === 'admin'"
                        type="danger"
                      >
                        管理员
                      </el-tag>
                      <el-tag 
                        v-else-if="row"
                        type="primary"
                      >
                        学生
                      </el-tag>
                      <span v-else>-</span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="createTime" label="创建时间" width="180">
                    <template #default="{ row }">
                      {{ row && row.createTime ? formatDate(row.createTime) : '-' }}
                    </template>
                  </el-table-column>
                  <el-table-column label="操作" width="180" fixed="right">
                    <template #default="{ row }">
                      <template v-if="row">
                        <el-button 
                          type="primary" 
                          size="small" 
                          @click="editUser(row)"
                        >
                          编辑
                        </el-button>
                        <el-button 
                          v-if="row.role !== 'admin'"
                          type="danger" 
                          size="small" 
                          @click="deleteUser(row.studentId, row.name)"
                        >
                          删除
                        </el-button>
                        <span v-else>-</span>
                      </template>
                      <span v-else>-</span>
                    </template>
                  </el-table-column>
                </el-table>

                <!-- 用户分页 -->
                <div class="user-pagination">
                  <el-pagination
                    v-model="userCurrentPage"
                    :page-sizes="[10, 20, 50, 100]"
                    :page-size="userPageSize"
                    layout="total, sizes, prev, pager, next, jumper"
                    :total="filteredUsers.length"
                    @size-change="handleUserSizeChange"
                    @current-change="handleUserCurrentChange"
                  />
                </div>
              </div>
            </el-tab-pane>

            <!-- 作业管理 -->
            <el-tab-pane label="作业管理" name="assignments">
              <div class="assignment-management">
                <!-- 作业操作 -->
                <div class="assignment-actions">
                  <el-button type="primary" @click="showCreateAssignmentDialog">
                    <i class="el-icon-plus"></i>
                    创建作业
                  </el-button>
                </div>

                <!-- 作业搜索 -->
                <div class="assignment-search">
                  <el-input 
                    v-model="assignmentSearchKeyword" 
                    placeholder="搜索作业名称" 
                    prefix-icon="el-icon-search"
                    @keyup.enter.native="handleAssignmentSearch"
                  >
                    <el-button slot="append" icon="el-icon-search" @click="handleAssignmentSearch"></el-button>
                  </el-input>
                </div>

                <!-- 作业表格 -->
                <el-table 
                  :data="filteredAssignments" 
                  style="width: 100%"
                  stripe
                  border
                  max-height="600"
                >
                  <el-table-column type="index" label="序号" width="80"></el-table-column>
                  <el-table-column prop="title" label="作业名称" min-width="180"></el-table-column>
                  <el-table-column prop="createTime" label="创建时间" min-width="140">
                    <template #default="{ row }">
                      {{ formatDate(row.createTime) }}
                    </template>
                  </el-table-column>
                  <el-table-column prop="deadline" label="截止日期" min-width="140">
                    <template #default="{ row }">
                      {{ formatDate(row.deadline) }}
                    </template>
                  </el-table-column>
                  <el-table-column prop="creator" label="创建者" width="120"></el-table-column>
                  <el-table-column label="操作" width="180" fixed="right">
                    <template #default="{ row }">
                      <el-button 
                        type="primary" 
                        size="small" 
                        @click="goToAssignmentDetail(row.id)"
                      >
                        详情
                      </el-button>
                      <el-button 
                        type="danger" 
                        size="small" 
                        @click="deleteAssignment(row.id, row.title)"
                      >
                        删除
                      </el-button>
                    </template>
                  </el-table-column>
                </el-table>

                <!-- 作业分页 -->
                <div class="assignment-pagination">
                  <el-pagination
                    v-model="assignmentCurrentPage"
                    :page-sizes="[10, 20, 50, 100]"
                    :page-size="assignmentPageSize"
                    layout="total, sizes, prev, pager, next, jumper"
                    :total="filteredAssignments.length"
                    @size-change="handleAssignmentSizeChange"
                    @current-change="handleAssignmentCurrentChange"
                  />
                </div>
              </div>
            </el-tab-pane>

            <!-- 提交管理 -->
            <el-tab-pane label="提交管理" name="submissions">
              <div class="submission-management">
                <!-- 提交筛选和搜索 -->
                <div class="submission-filter">
                  <el-row :gutter="20">
                    <el-col :span="8">
                      <el-select v-model="submissionAssignmentFilter" placeholder="选择作业">
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
                      <el-select v-model="submissionStatusFilter" placeholder="选择状态">
                        <el-option label="全部" value="all"></el-option>
                        <el-option label="已提交" value="submitted"></el-option>
                        <el-option label="已逾期" value="late"></el-option>
                      </el-select>
                    </el-col>
                    <el-col :span="8">
                      <el-input 
                        v-model="submissionSearchKeyword" 
                        placeholder="搜索用户（学号/姓名）" 
                        prefix-icon="el-icon-search"
                        @keyup.enter.native="handleSubmissionSearch"
                      >
                        <el-button slot="append" icon="el-icon-search" @click="handleSubmissionSearch"></el-button>
                      </el-input>
                    </el-col>
                  </el-row>
                </div>

                <!-- 提交表格 -->
                <el-table 
                  :data="filteredSubmissions" 
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
                        @click="row && downloadSubmissionFile(row.id, row.fileName)"
                      >
                        下载
                      </el-button>
                      <el-button 
                        type="danger" 
                        size="small" 
                        :disabled="!row"
                        @click="row && deleteSubmission(row.id)"
                      >
                        删除
                      </el-button>
                    </template>
                  </el-table-column>
                </el-table>

                <!-- 提交分页 -->
                <div class="submission-pagination">
                  <el-pagination
                    v-model="submissionCurrentPage"
                    :page-sizes="[10, 20, 50, 100]"
                    :page-size="submissionPageSize"
                    layout="total, sizes, prev, pager, next, jumper"
                    :total="filteredSubmissions.length"
                    @size-change="handleSubmissionSizeChange"
                    @current-change="handleSubmissionCurrentChange"
                  />
                </div>
              </div>
            </el-tab-pane>
          </el-tabs>

    <!-- 导入用户对话框 -->
    <el-dialog 
      title="导入用户" 
      :visible.sync="importUserDialogVisible"
      width="600px"
    >
      <el-upload
        class="upload-excel"
        :action="uploadExcelUrl"
        :headers="uploadHeaders"
        :on-success="handleImportSuccess"
        :on-error="handleImportError"
        :before-upload="beforeImportExcel"
        accept=".xls,.xlsx"
        :show-file-list="false"
      >
        <el-button size="small" type="primary">点击上传Excel文件</el-button>
        <div slot="tip" class="el-upload__tip">
          请上传包含用户信息的Excel文件，支持.xls和.xlsx格式
        </div>
      </el-upload>
      <div class="import-template">
        <el-button type="text" @click="downloadTemplate">下载导入模板</el-button>
      </div>
      <div slot="footer" class="dialog-footer">
        <el-button @click="importUserDialogVisible = false">取消</el-button>
      </div>
    </el-dialog>

    <!-- 添加用户对话框 -->
    <el-dialog 
      title="添加用户" 
      :visible.sync="addUserDialogVisible"
      width="500px"
    >
      <el-form 
        ref="addUserFormRef" 
        :model="addUserForm" 
        :rules="addUserRules" 
        label-width="100px"
      >
        <el-form-item label="学号" prop="studentId">
          <el-input v-model="addUserForm.studentId"></el-input>
        </el-form-item>
        <el-form-item label="姓名" prop="name">
          <el-input v-model="addUserForm.name"></el-input>
        </el-form-item>
        <el-form-item label="班级" prop="class">
          <el-input v-model="addUserForm.class"></el-input>
        </el-form-item>
        <el-form-item label="角色" prop="role">
          <el-select v-model="addUserForm.role">
            <el-option label="学生" value="student"></el-option>
            <el-option label="管理员" value="admin"></el-option>
          </el-select>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="addUserDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleAddUser">确定</el-button>
      </div>
    </el-dialog>

    <!-- 编辑用户对话框 -->
    <el-dialog 
      title="编辑用户" 
      :visible.sync="editUserDialogVisible"
      width="500px"
    >
      <el-form 
        ref="editUserFormRef" 
        :model="editUserForm" 
        :rules="editUserRules" 
        label-width="100px"
      >
        <el-form-item label="学号" prop="studentId">
          <el-input v-model="editUserForm.studentId" :disabled="true"></el-input>
        </el-form-item>
        <el-form-item label="姓名" prop="name">
          <el-input v-model="editUserForm.name"></el-input>
        </el-form-item>
        <el-form-item label="班级" prop="class">
          <el-input v-model="editUserForm.class"></el-input>
        </el-form-item>
        <el-form-item label="角色" prop="role">
          <el-select v-model="editUserForm.role">
            <el-option label="学生" value="student"></el-option>
            <el-option label="管理员" value="admin"></el-option>
          </el-select>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="editUserDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleEditUser">确定</el-button>
      </div>
    </el-dialog>

    <!-- 创建作业对话框 -->
    <el-dialog 
      title="创建作业" 
      :visible.sync="createAssignmentDialogVisible"
      width="600px"
    >
      <el-form 
        ref="createAssignmentFormRef" 
        :model="createAssignmentForm" 
        :rules="createAssignmentRules" 
        label-width="100px"
      >
        <el-form-item label="作业名称" prop="title">
          <el-input v-model="createAssignmentForm.title"></el-input>
        </el-form-item>
        <el-form-item label="作业描述" prop="description">
          <el-input 
            v-model="createAssignmentForm.description" 
            type="textarea" 
            placeholder="请输入作业描述"
            :rows="4"
          ></el-input>
        </el-form-item>
        <el-form-item label="截止日期" prop="deadline">
          <el-date-picker
            v-model="createAssignmentForm.deadline"
            type="datetime"
            placeholder="选择截止日期时间"
            style="width: 100%"
          ></el-date-picker>
        </el-form-item>
        <el-form-item label="文件命名规则" prop="namingRule">
          <el-input 
            v-model="createAssignmentForm.namingRule" 
            placeholder="例如：{学号}_{姓名}_{作业名称}_{提交日期}"
          ></el-input>
          <div class="form-tip">支持的变量：{学号}, {姓名}, {作业名称}, {提交日期}</div>
        </el-form-item>
        <el-form-item label="允许的文件类型" prop="fileTypes">
          <el-select 
            v-model="createAssignmentForm.fileTypes" 
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
      <div slot="footer" class="dialog-footer">
        <el-button @click="createAssignmentDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleCreateAssignment">确定</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { User, SwitchButton } from '@element-plus/icons-vue';
import UserDropdown from '../components/UserDropdown.vue';
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { getCurrentUser, logoutUser, getAllUsers, createUser, updateUser, deleteUser, importUsers } from '../services/userService';
import { getAllAssignments, createAssignment as createAssignmentAPI, deleteAssignment as deleteAssignmentAPI } from '../services/assignmentService';
import { getAllSubmissions, deleteSubmission as deleteSubmissionAPI, downloadFile, handleFileDownload } from '../services/submissionService';

export default {
  name: 'AdminPanelView',
  components: {
    User,
    SwitchButton,
    UserDropdown
  },
  setup() {
    const router = useRouter();
    const userInfo = ref(getCurrentUser());
    const activeTab = ref('overview');
    const allUsers = ref([]);
    const allAssignments = ref([]);
    const allSubmissions = ref([]);
    const recentActivitiesData = ref([]);
    
    // 用户相关
    const userSearchKeyword = ref('');
    const userCurrentPage = ref(1);
    const userPageSize = ref(20);
    const importUserDialogVisible = ref(false);
    const addUserDialogVisible = ref(false);
    const editUserDialogVisible = ref(false);
    const addUserFormRef = ref(null);
    const editUserFormRef = ref(null);
    const addUserForm = ref({
      studentId: '',
      name: '',
      class: '',
      role: 'student'
    });
    const editUserForm = ref({
      studentId: '',
      name: '',
      class: '',
      role: 'student'
    });
    const addUserRules = ref({
      studentId: [
        { required: true, message: '请输入学号', trigger: 'blur' },
        { min: 2, max: 20, message: '学号长度在 2 到 20 个字符之间', trigger: 'blur' }
      ],
      name: [
        { required: true, message: '请输入姓名', trigger: 'blur' },
        { min: 2, max: 20, message: '姓名长度在 2 到 20 个字符之间', trigger: 'blur' }
      ],
      class: [
        { required: true, message: '请输入班级', trigger: 'blur' },
        { min: 2, max: 20, message: '班级长度在 2 到 20 个字符之间', trigger: 'blur' }
      ]
    });
    const editUserRules = ref({
      name: [
        { required: true, message: '请输入姓名', trigger: 'blur' },
        { min: 2, max: 20, message: '姓名长度在 2 到 20 个字符之间', trigger: 'blur' }
      ],
      class: [
        { required: true, message: '请输入班级', trigger: 'blur' },
        { min: 2, max: 20, message: '班级长度在 2 到 20 个字符之间', trigger: 'blur' }
      ]
    });
    
    // 作业相关
    const assignmentSearchKeyword = ref('');
    const assignmentCurrentPage = ref(1);
    const assignmentPageSize = ref(20);
    const createAssignmentDialogVisible = ref(false);
    const createAssignmentFormRef = ref(null);
    const createAssignmentForm = ref({
      title: '',
      description: '',
      deadline: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000), // 默认一周后
      namingRule: '{学号}_{姓名}_{作业名称}_{提交日期}',
      fileTypes: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'zip', 'rar']
    });
    const createAssignmentRules = ref({
      title: [
        { required: true, message: '请输入作业名称', trigger: 'blur' },
        { min: 2, max: 100, message: '作业名称长度在 2 到 100 个字符之间', trigger: 'blur' }
      ],
      description: [{ required: true, message: '请输入作业描述', trigger: 'blur' }],
      deadline: [{ required: true, message: '请选择截止日期', trigger: 'change' }],
      namingRule: [{ required: true, message: '请输入文件命名规则', trigger: 'blur' }],
      fileTypes: [{
        required: true,
        message: '请至少选择一种文件类型',
        trigger: 'change',
        type: 'array',
        min: 1
      }]
    });
    
    // 提交相关
    const submissionAssignmentFilter = ref('all');
    const submissionStatusFilter = ref('all');
    const submissionSearchKeyword = ref('');
    const submissionCurrentPage = ref(1);
    const submissionPageSize = ref(20);
    
    // 上传配置
    const uploadExcelUrl = '/api/users/import';
    const uploadHeaders = ref({
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    });
    
    // 格式化日期
    const formatDate = (dateString) => {
      if (!dateString) return '';
      const date = new Date(dateString);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    };
    
    // 系统概览数据
    const totalUsers = computed(() => allUsers.value.length);
    const totalAssignments = computed(() => allAssignments.value.length);
    const totalSubmissions = computed(() => allSubmissions.value.length);
    const pendingAssignments = computed(() => {
      const now = new Date();
      return allAssignments.value.filter(a => new Date(a.deadline) > now).length;
    });
    
    // 过滤用户
    const filteredUsers = computed(() => {
      let result = [...allUsers.value];
      
      if (userSearchKeyword.value) {
        const keyword = userSearchKeyword.value.toLowerCase();
        result = result.filter(user => 
          user.studentId.toLowerCase().includes(keyword) ||
          user.name.toLowerCase().includes(keyword) ||
          user.class.toLowerCase().includes(keyword)
        );
      }
      
      // 分页处理
      const start = (userCurrentPage.value - 1) * userPageSize.value;
      const end = start + userPageSize.value;
      return result.slice(start, end);
    });
    
    // 过滤作业
    const filteredAssignments = computed(() => {
      let result = [...allAssignments.value];
      
      if (assignmentSearchKeyword.value) {
        const keyword = assignmentSearchKeyword.value.toLowerCase();
        result = result.filter(assignment => 
          assignment.title.toLowerCase().includes(keyword) ||
          assignment.description.toLowerCase().includes(keyword)
        );
      }
      
      // 分页处理
      const start = (assignmentCurrentPage.value - 1) * assignmentPageSize.value;
      const end = start + assignmentPageSize.value;
      return result.slice(start, end);
    });
    
    // 过滤提交
    const filteredSubmissions = computed(() => {
      let result = [...allSubmissions.value];
      
      // 按作业筛选
      if (submissionAssignmentFilter.value !== 'all') {
        result = result.filter(submission => submission.assignmentId === submissionAssignmentFilter.value);
      }
      
      // 按状态筛选
      if (submissionStatusFilter.value !== 'all') {
        result = result.filter(submission => submission.status === submissionStatusFilter.value);
      }
      
      // 按关键词搜索
      if (submissionSearchKeyword.value) {
        const keyword = submissionSearchKeyword.value.toLowerCase();
        result = result.filter(submission => 
          submission.studentId.toLowerCase().includes(keyword) ||
          submission.studentName.toLowerCase().includes(keyword)
        );
      }
      
      // 分页处理
      const start = (submissionCurrentPage.value - 1) * submissionPageSize.value;
      const end = start + submissionPageSize.value;
      return result.slice(start, end);
    });
    
    // 加载数据
    const loadData = async () => {
      try {
        // 获取所有用户
        const usersData = await getAllUsers();
        allUsers.value = Array.isArray(usersData) ? usersData : [];
        
        // 获取所有作业
        const assignmentsData = await getAllAssignments();
        allAssignments.value = Array.isArray(assignmentsData) ? assignmentsData : [];
        
        // 获取所有提交并添加作业标题
        const submissionsData = await getAllSubmissions();
        if (Array.isArray(submissionsData)) {
          allSubmissions.value = submissionsData.map(submission => {
            const assignment = allAssignments.value.find(a => a.id === submission.assignmentId);
            return {
              ...submission,
              assignmentTitle: assignment?.title || '未知作业'
            };
          });
        } else {
          allSubmissions.value = [];
        }
        
        // 生成近期活动数据
        generateRecentActivities();
        
      } catch (error) {
        ElMessage.error('加载数据失败');
        console.error('加载数据失败:', error);
        // 确保数据始终是数组，防止表格渲染错误
        allUsers.value = [];
        allAssignments.value = [];
        allSubmissions.value = [];
      }
    };
    
    // 生成近期活动数据（模拟）
    const generateRecentActivities = () => {
      const activities = [];
      
      // 安全处理用户提交作业
      if (Array.isArray(allSubmissions.value) && allSubmissions.value.length > 0) {
        const recentSubmissions = [...allSubmissions.value]
          .filter(submission => submission && submission.submitTime && submission.studentName)
          .sort((a, b) => new Date(b.submitTime) - new Date(a.submitTime))
          .slice(0, 10);
        
        recentSubmissions.forEach(submission => {
          activities.push({
            time: submission.submitTime,
            user: submission.studentName,
            action: '提交了作业',
            details: submission.assignmentTitle || '未知作业'
          });
        });
      }
      
      // 安全处理创建作业
      if (Array.isArray(allAssignments.value) && allAssignments.value.length > 0) {
        const recentAssignments = [...allAssignments.value]
          .filter(assignment => assignment && assignment.createTime && assignment.title)
          .sort((a, b) => new Date(b.createTime) - new Date(a.createTime))
          .slice(0, 5);
        
        recentAssignments.forEach(assignment => {
          activities.push({
            time: assignment.createTime,
            user: assignment.creator || '管理员',
            action: '创建了作业',
            details: assignment.title
          });
        });
      }
      
      // 按时间排序并确保数据安全
      recentActivitiesData.value = activities
        .filter(activity => activity && activity.time)
        .sort((a, b) => new Date(b.time) - new Date(a.time))
        .slice(0, 15);
    };
    
    // 菜单选择功能已在Nav组件中实现
    
    // 退出登录
    const handleLogout = async () => {
      try {
        await logoutUser();
        router.push('/login');
      } catch (error) {
        ElMessage.error('退出登录失败');
      }
    };
    
    // 跳转到个人中心
    const goToProfile = () => {
      router.push('/profile');
    };
    
    // 跳转到作业详情
    const goToAssignmentDetail = (assignmentId) => {
      window.location.href = `/assignments/${assignmentId}`;
    };
    
    // 导入用户相关
    const showImportUserDialog = () => {
      importUserDialogVisible.value = true;
    };
    
    const beforeImportExcel = (file) => {
      const fileExtension = file.name.split('.').pop().toLowerCase();
      if (!['xls', 'xlsx'].includes(fileExtension)) {
        ElMessage.error('只支持.xls和.xlsx格式的Excel文件');
        return false;
      }
      return true;
    };
    
    const handleImportSuccess = (response) => {
      if (response.success) {
        ElMessage.success(`成功导入 ${response.data.successCount} 个用户`);
        if (response.data.failedCount > 0) {
          ElMessage.warning(`有 ${response.data.failedCount} 个用户导入失败`);
        }
        importUserDialogVisible.value = false;
        loadData();
      } else {
        ElMessage.error(response.message || '用户导入失败');
      }
    };
    
    const handleImportError = (error) => {
      ElMessage.error('用户导入失败，请重试');
      console.error('用户导入失败:', error);
    };
    
    const downloadTemplate = () => {
      // 这里应该提供一个模板文件下载链接
      ElMessage.info('模板下载功能待实现');
    };
    
    // 添加用户相关
    const showAddUserDialog = () => {
      addUserForm.value = {
        studentId: '',
        name: '',
        class: '',
        role: 'student'
      };
      addUserDialogVisible.value = true;
    };
    
    const handleAddUser = async () => {
      try {
        // 表单验证
        await addUserFormRef.value.validate();
        
        // 调用添加用户接口
        await createUser(addUserForm.value);
        
        ElMessage.success('用户添加成功');
        addUserDialogVisible.value = false;
        
        // 重新加载数据
        loadData();
      } catch (error) {
        ElMessage.error(error.response?.data?.message || '用户添加失败');
        console.error('用户添加失败:', error);
      }
    };
    
    // 编辑用户相关
    const editUser = (user) => {
      editUserForm.value = { ...user };
      editUserDialogVisible.value = true;
    };
    
    const handleEditUser = async () => {
      try {
        // 表单验证
        await editUserFormRef.value.validate();
        
        // 调用更新用户接口
        await updateUser(editUserForm.value.studentId, editUserForm.value);
        
        ElMessage.success('用户编辑成功');
        editUserDialogVisible.value = false;
        
        // 重新加载数据
        loadData();
      } catch (error) {
        ElMessage.error(error.response?.data?.message || '用户编辑失败');
        console.error('用户编辑失败:', error);
      }
    };
    
    // 删除用户
    const deleteUser = async (studentId, userName) => {
      try {
        await ElMessageBox.confirm(
          `确定要删除用户「${userName}」吗？删除后将无法恢复。`,
          '确认删除',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          }
        );
        
        // 调用删除接口
        await deleteUser(studentId);
        
        ElMessage.success('用户删除成功');
        
        // 重新加载数据
        loadData();
      } catch (error) {
        // 用户取消删除不会抛出错误，只有真正的错误才会显示提示
        if (error !== 'cancel') {
          ElMessage.error(error.response?.data?.message || '用户删除失败');
          console.error('用户删除失败:', error);
        }
      }
    };
    
    // 用户搜索和分页
    const handleUserSearch = () => {
      userCurrentPage.value = 1;
    };
    
    const handleUserSizeChange = (size) => {
      userPageSize.value = size;
      userCurrentPage.value = 1;
    };
    
    const handleUserCurrentChange = (current) => {
      userCurrentPage.value = current;
    };
    
    // 创建作业相关
    const showCreateAssignmentDialog = () => {
      createAssignmentForm.value = {
        title: '',
        description: '',
        deadline: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000),
        namingRule: '{学号}_{姓名}_{作业名称}_{提交日期}',
        fileTypes: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'zip', 'rar']
      };
      createAssignmentDialogVisible.value = true;
    };
    
    const handleCreateAssignment = async () => {
      try {
        // 表单验证
        await createAssignmentFormRef.value.validate();
        
        // 调用创建作业接口
        await createAssignmentAPI(createAssignmentForm.value);
        
        ElMessage.success('作业创建成功');
        createAssignmentDialogVisible.value = false;
        
        // 重新加载数据
        loadData();
      } catch (error) {
        ElMessage.error(error.response?.data?.message || '作业创建失败');
        console.error('作业创建失败:', error);
      }
    };
    
    // 删除作业
    const deleteAssignment = async (assignmentId, assignmentTitle) => {
      try {
        await ElMessageBox.confirm(
          `确定要删除作业「${assignmentTitle}」吗？删除后将无法恢复。`,
          '确认删除',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          }
        );
        
        // 调用删除接口
        await deleteAssignmentAPI(assignmentId);
        
        ElMessage.success('作业删除成功');
        
        // 重新加载数据
        loadData();
      } catch (error) {
        // 用户取消删除不会抛出错误，只有真正的错误才会显示提示
        if (error !== 'cancel') {
          ElMessage.error(error.response?.data?.message || '作业删除失败');
          console.error('作业删除失败:', error);
        }
      }
    };
    
    // 作业搜索和分页
    const handleAssignmentSearch = () => {
      assignmentCurrentPage.value = 1;
    };
    
    const handleAssignmentSizeChange = (size) => {
      assignmentPageSize.value = size;
      assignmentCurrentPage.value = 1;
    };
    
    const handleAssignmentCurrentChange = (current) => {
      assignmentCurrentPage.value = current;
    };
    
    // 提交搜索和分页
    const handleSubmissionSearch = () => {
      submissionCurrentPage.value = 1;
    };
    
    const handleSubmissionSizeChange = (size) => {
      submissionPageSize.value = size;
      submissionCurrentPage.value = 1;
    };
    
    const handleSubmissionCurrentChange = (current) => {
      submissionCurrentPage.value = current;
    };
    
    // 下载提交文件
    const downloadSubmissionFile = async (fileId, fileName) => {
      try {
        // 调用downloadFile只传递submission ID
        const response = await downloadFile(fileId);
        // 使用handleFileDownload处理blob响应并触发下载
        handleFileDownload(response.data, fileName);
        ElMessage.success(`文件「${fileName}」下载成功`);
      } catch (error) {
        ElMessage.error('文件下载失败');
        console.error('文件下载失败:', error);
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
        await deleteSubmissionAPI(submissionId);
        
        ElMessage.success('提交记录删除成功');
        
        // 重新加载数据
        loadData();
      } catch (error) {
        // 用户取消删除不会抛出错误，只有真正的错误才会显示提示
        if (error !== 'cancel') {
          ElMessage.error(error.response?.data?.message || '提交记录删除失败');
          console.error('提交记录删除失败:', error);
        }
      }
    };
    
    // 组件挂载时加载数据
    onMounted(() => {
      loadData();
    });
    
    return {
      User,
      SwitchButton,
      UserDropdown,
      userInfo,
      activeTab,
      allUsers,
      allAssignments,
      allSubmissions,
      recentActivitiesData,
      userSearchKeyword,
      userCurrentPage,
      userPageSize,
      importUserDialogVisible,
      addUserDialogVisible,
      editUserDialogVisible,
      addUserFormRef,
      editUserFormRef,
      addUserForm,
      editUserForm,
      assignmentSearchKeyword,
      assignmentCurrentPage,
      assignmentPageSize,
      createAssignmentDialogVisible,
      createAssignmentFormRef,
      createAssignmentForm,
      submissionAssignmentFilter,
      submissionStatusFilter,
      submissionSearchKeyword,
      submissionCurrentPage,
      submissionPageSize,
      uploadExcelUrl,
      uploadHeaders,
      totalUsers,
      totalAssignments,
      totalSubmissions,
      pendingAssignments,
      filteredUsers,
      filteredAssignments,
      filteredSubmissions,
      formatDate,
      handleLogout,
      goToProfile,
      goToAssignmentDetail,
      showImportUserDialog,
      beforeImportExcel,
      handleImportSuccess,
      handleImportError,
      downloadTemplate,
      showAddUserDialog,
      handleAddUser,
      editUser,
      handleEditUser,
      deleteUser,
      handleUserSearch,
      handleUserSizeChange,
      handleUserCurrentChange,
      showCreateAssignmentDialog,
      handleCreateAssignment,
      deleteAssignment,
      handleAssignmentSearch,
      handleAssignmentSizeChange,
      handleAssignmentCurrentChange,
      handleSubmissionSearch,
      handleSubmissionSizeChange,
      handleSubmissionCurrentChange,
      downloadSubmissionFile,
      deleteSubmission
    };
  }
};
</script>

<style scoped>
.admin-panel-container {
  height: calc(100vh - 60px);
  width: 100%;
  padding: 20px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.full-height-container {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
}

.header {
  background-color: #1890ff;
  color: white;
  height: 60px;
  flex-shrink: 0;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 100%;
  padding: 0 20px;
}

.header-title {
  display: flex;
  align-items: center;
  font-size: 20px;
  font-weight: bold;
}

.header-title i {
  margin-right: 10px;
}

.header-user {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.aside {
  background-color: #304156;
  color: white;
}


.page-header {
  margin-bottom: 20px;
}

.page-header h2 {
  color: #303133;
  margin: 0;
}

/* 概览部分 */
.overview-section {
  background-color: white;
  padding: 30px;
  border-radius: 8px;
}

.overview-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.overview-card {
  text-align: center;
  height: 120px;
}

.overview-content {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15px;
}

.overview-icon {
  font-size: 48px;
  color: #1890ff;
}

.overview-info {
  text-align: left;
}

.overview-number {
  font-size: 32px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 5px;
}

.overview-label {
  font-size: 14px;
  color: #909399;
}

.recent-activities {
  margin-top: 30px;
}

.recent-activities h3 {
  color: #303133;
  margin-bottom: 20px;
  font-size: 18px;
}

/* 用户管理部分 */
.user-management {
  background-color: white;
  padding: 30px;
  border-radius: 8px;
}

.user-actions {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.user-search {
  margin-bottom: 20px;
}

.user-pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

/* 作业管理部分 */
.assignment-management {
  background-color: white;
  padding: 30px;
  border-radius: 8px;
}

.assignment-actions {
  margin-bottom: 20px;
}

.assignment-search {
  margin-bottom: 20px;
}

.assignment-pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

/* 提交管理部分 */
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

/* 对话框样式 */
.upload-excel {
  margin-bottom: 20px;
}

.import-template {
  text-align: right;
}

.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 5px;
}

  /* 响应式调整 */
  @media (max-width: 768px) {
    .content-container {
      padding: 15px;
    }
    
    .dashboard-cards {
      grid-template-columns: 1fr;
      gap: 15px;
    }
    
    .card {
      padding: 20px 15px;
    }
    
    .quick-actions {
      grid-template-columns: 1fr;
      gap: 15px;
    }
    
    .quick-actions .el-button {
      padding: 15px;
    }
    
    .recent-activities {
      padding: 20px 15px;
    }
    
    .activity-item {
      padding: 15px 0;
    }
    
    .activity-content {
      flex: 1;
    }
  }
</style>