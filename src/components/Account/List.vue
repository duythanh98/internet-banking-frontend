<template>
  <div class="app-container">
    <el-row class="filter-container" type="flex" justify="space-between">
      <el-col />
      <el-col style="text-align: right">

        <el-popconfirm
          title="Bạn có chắc chắn muốn khoá tài khoản này không?"
          confirm-button-text="Đồng ý"
          cancel-button-text="Không"
          @onConfirm="lock"
        >
          <el-button
            slot="reference"
            class="filter-item"
            style="margin-left: 10px;"
            type="danger"
            icon="el-icon-lock"
          >Khoá tài khoản</el-button>
        </el-popconfirm>
        <el-button
          class="filter-item"
          style="margin-left: 10px;"
          type="primary"
          icon="el-icon-refresh"
          @click="reload"
        >Tải lại</el-button>
      </el-col>
    </el-row>

    <h3 style="color: #606266;">Tài khoản thanh toán</h3>
    <el-table
      v-loading="loading"
      :data="account"
      border
      fit
      sortable="custom"
      highlight-current-row
      style="width: 100%;"
      @sort-change="handleSortChange"
    >
      <el-table-column label="Số tài khoản" prop="account_number" align="left" header-align="center" />
      <el-table-column label="Số dư hiện tại" prop="balance" align="right" header-align="center">
        <template slot-scope="{ row }">
          <div>{{ row.balance | toThousandFilter }}đ</div>
        </template>
      </el-table-column>
    </el-table>

    <h3 style="margin-top: 30px; color: #606266;">Tài khoản tiết kiệm</h3>
    <el-table
      v-loading="loading"
      :data="pagination.data"
      border
      fit
      sortable="custom"
      highlight-current-row
      style="width: 100%;"
      @sort-change="handleSortChange"
    >
      <el-table-column label="Số tài khoản" prop="account_number" sortable align="left" header-align="center" />
      <el-table-column label="Số dư hiện tại" prop="balance" sortable align="right" header-align="center">
        <template slot-scope="{ row }">
          <div>{{ row.balance | toThousandFilter }}đ</div>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      v-show="pagination.total > 0"
      :page-sizes="[5, 10, 15, 20]"
      :page-size="pagination.limit"
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
  data() {
    return {
      isLoaded: false,
      account: [],
      pagination: {
        data: [],
        total: 0,
        page: 1,
        limit: 10,
        lastPage: 0
      },
      filter: {
        keyword: ''
      },
      loading: false,
      filterRules: {
        keyword: [
          {
            min: 1,
            max: 32,
            message: 'Từ khoá từ 1 tới 32 kí tự',
            trigger: 'change'
          }
        ]
      },
      sorts: []
    };
  },
  created() {
    this.reload();
  },
  methods: {
    async reload() {
      this.loading = true;
      try {
        const promises = [
          this.$store.dispatch('user/getMyAccount'),
          this.$store.dispatch('user/getAccounts')
        ];
        const results = await Promise.all(promises);

        this.account = [results[0]];
        this.pagination = results[1];
        this.isLoaded = true;

        this.$emit('reload-completed');
      } catch (err) {
        this.$notify.error({ message: err instanceof Error ? err.message : 'Có lỗi xảy ra', position: 'bottom-right' });
      } finally {
        this.loading = false;
      }
    },
    load() {
      if (!this.isLoaded) {
        this.reload();
      }
    },
    async lock() {
      try {
        await this.$store.dispatch('user/deleteUser', { id: 'me' });

        this.$notify.success({ message: 'Khoá tài khoản thành công. Vui lòng liên hệ với ngân hàng khi cần mở khoá tài khoản', position: 'bottom-right' });
        this.logout();
      } catch (err) {
        this.$notify.error({ message: err instanceof Error ? err.message : 'Có lỗi xảy ra', position: 'bottom-right' });
      }
    },
    async logout() {
      await this.$store.dispatch('user/logout');
      this.$router.push(`/login?redirect=${this.$route.fullPath}`);
    },
    handleFilter() {
      this.$refs.filter.validate(valid => {
        if (valid && this.filter.keyword) {
          this.pagination.page = 1;
          this.reload();
        }
        return false;
      });
    },
    handleSizeChange(val) {
      this.pagination.limit = val;
      this.reload();
    },
    handleCurrentChange(val) {
      this.pagination.page = val;
      this.reload();
    },
    handleSortChange(column) {
      if (column.order) {
        this.sorts = [
          [column.prop, column.order.startsWith('asc') ? 'asc' : 'desc']
        ];
      } else {
        this.sorts = [];
      }

      this.reload();
    }
  }
};
</script>
