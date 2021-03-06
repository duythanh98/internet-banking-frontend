<template>
  <div class="app-container">
    <el-row class="filter-container" type="flex" justify="space-between">
      <el-col>
        <el-form ref="filter" :model="filter" :rules="filterRules" @submit.native.prevent>
          <el-form-item prop="keyword">
            <el-input
              v-model="filter.keyword"
              class="filter-item"
              placeholder="Tìm kiếm"
              style="width: 200px;"
              @keyup.enter.native="handleFilter"
            />
            <el-button
              v-waves
              class="filter-item"
              style="margin-left: 10px;"
              type="primary"
              icon="el-icon-search"
              @click="handleFilter"
            >Tìm kiếm</el-button>
          </el-form-item>
        </el-form>
      </el-col>
      <el-col style="text-align: right">
        <template>
          <el-button
            v-if="permissions.includes('admin')"
            v-waves
            class="filter-item"
            style="margin-left: 10px;"
            type="success"
            icon="el-icon-circle-plus"
            @click="$router.push({name: 'AddAdmin'})"
          >Thêm quản trị viên</el-button>

          <el-button
            v-else-if="permissions.includes('employee')"
            v-waves
            class="filter-item"
            style="margin-left: 10px;"
            type="success"
            icon="el-icon-circle-plus"
            @click="$router.push({name: 'AddEmployee'})"
          >Thêm nhân viên</el-button>

          <el-button
            v-else
            v-waves
            class="filter-item"
            style="margin-left: 10px;"
            type="success"
            icon="el-icon-circle-plus"
            @click="$router.push({name: 'AddCustomer'})"
          >Thêm khách hàng</el-button>
        </template>
        <el-button
          class="filter-item"
          style="margin-left: 10px;"
          type="primary"
          icon="el-icon-refresh"
          @click="reload"
        >Tải lại</el-button>
      </el-col>
    </el-row>

    <el-table
      v-loading="loading"
      :data="pagination.data"
      border
      fit
      sortable="custom"
      highlight-current-row
      style="width: 100%;"
      :row-class-name="tableRowClassName"
    >
      <el-table-column label="ID" prop="id" sortable align="right" header-align="center" width="70" />
      <el-table-column label="Tên người dùng" prop="name" align="left" header-align="center" sortable />
      <el-table-column label="Tên đăng nhập" prop="username" align="left" header-align="center" sortable />
      <el-table-column label="Email" prop="email" align="left" header-align="center" sortable />
      <el-table-column label="Số điện thoại" prop="phone" align="right" header-align="center" sortable />
      <el-table-column label="Số tài khoản" prop="account.account_number" align="right" header-align="center" sortable>
        <template slot-scope="{row}">
          <div>{{ row.account ? row.account.account_number : 'Không có' }}</div>
        </template>
      </el-table-column>
      <el-table-column label="Quyền" prop="permission" align="center" header-align="center" sortable>
        <template slot-scope="{row}">
          <div>{{ row.permission ? permissionTypes[row.permission] : 'Không biết' }}</div>
        </template>
      </el-table-column>
      <el-table-column label="Thao tác" align="center">
        <template v-if="currentUserPermission <= +row.permission" slot-scope="{row}">
          <el-button
            v-if="!row.deleted_at"
            type="primary"
            icon="el-icon-edit"
            size="small"
            @click="$router.push({name: 'ViewUser', params: {id: row.id}})"
          />
          <el-popconfirm
            v-if="!row.deleted_at"
            title="Bạn có muốn khoá tài khoản này không?"
            confirm-button-text="Đồng ý"
            cancel-button-text="Không"
            @onConfirm="remove(row.id)"
          >
            <el-button slot="reference" type="danger" icon="el-icon-lock" size="small" />
          </el-popconfirm>
          <el-popconfirm
            v-else
            title="Bạn có muốn khôi phục tài khoản này không?"
            confirm-button-text="Đồng ý"
            cancel-button-text="Không"
            @onConfirm="restore(row.id)"
          >
            <el-button slot="reference" type="success" icon="el-icon-refresh-left" size="small" />
          </el-popconfirm>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      v-show="pagination.total > 0"
      :page-sizes="[10, 20, 30, 50]"
      :page-size="+pagination.per_page"
      layout="total, sizes, prev, pager, next, jumper"
      :total="pagination.total"
      style="margin-top: 10px"
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
    />
  </div>
</template>

<script>
import waves from '@/directive/waves';
import permission from '@/directive/permission';

export default {
  directives: { waves, permission },
  props: {
    permissions: {
      type: Array,
      default() {
        return [];
      }
    }
  },
  data() {
    return {
      isLoaded: false,
      pagination: {
        data: [],
        total: 0,
        current_page: 1,
        per_page: 10,
        last_page: 0
      },
      filter: {
        keyword: ''
      },
      loading: false,
      filterRules: {
        keyword: [
          { min: 1, max: 32, message: 'Từ khoá từ 1 tới 32 kí tự', trigger: 'change' }
        ]
      },
      sorts: [],
      permissionTypes: {
        '1': 'Quản trị viên',
        '2': 'Giao dịch viên',
        '3': 'Khách hàng'
      }
    };
  },
  computed: {
    currentUserPermission() {
      const roles = this.$store.getters.roles;
      if (roles.includes('admin')) {
        return 1;
      } else if (roles.includes('employee')) {
        return 2;
      }
      return 3;
    }
  },
  created() {
    this.reload();
  },
  methods: {
    async reload() {
      this.loading = true;
      try {
        const result = await this.$store.dispatch('user/getUsers',
          { ...this.pagination, keyword: this.filter.keyword,
            permission: this.permissions.length > 0 ? this.permissions.join(',') : '' });

        this.pagination = result;
        this.loading = false;
        this.isLoaded = true;

        this.$emit(this.permissions[0] + '-reload-completed');
      } catch (err) {
        this.$notify.error({ message: err instanceof Error ? err.message : 'Có lỗi xảy ra', position: 'bottom-right' });
      } finally {
        this.loading = false;
      }
    },
    async restore(id) {
      try {
        await this.$store.dispatch('user/restoreUser', { id });

        this.$notify.success({ message: 'Khôi phục tài khoản thành công', position: 'bottom-right' });
        this.reload();
        this.$emit('reload-completed');
      } catch (err) {
        this.$notify.error({ message: err instanceof Error ? err.message : 'Có lỗi xảy ra', position: 'bottom-right' });
      }
    },
    async remove(id) {
      try {
        await this.$store.dispatch('user/deleteUser', { id });

        this.$notify.success({ message: 'Khoá tài khoản thành công', position: 'bottom-right' });
        this.reload();
        this.$emit('reload-completed');
      } catch (err) {
        this.$notify.error({ message: err instanceof Error ? err.message : 'Có lỗi xảy ra', position: 'bottom-right' });
      }
    },
    load() {
      if (!this.isLoaded) {
        this.reload();
      }
    },
    handleFilter() {
      this.pagination.current_page = 1;
      this.reload();
    },
    handleSizeChange(val) {
      this.pagination.per_page = val;
      this.reload();
    },
    handleCurrentChange(val) {
      this.pagination.current_page = val;
      this.reload();
    },
    handleSortChange(column) {
      if (column.order) {
        this.sorts = [[column.prop, column.order.startsWith('asc') ? 'asc' : 'desc']];
      } else {
        this.sorts = [];
      }

      this.reload();
    },
    tableRowClassName({ row, rowIndex }) {
      if (row.deleted_at) {
        return 'deleted-row';
      }
      return '';
    }
  }
};
</script>

<style>
.el-table .deleted-row {
  color: #ccc !important;
}
</style>
