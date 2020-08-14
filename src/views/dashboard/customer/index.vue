<template>
  <div class="dashboard-editor-container">

    <panel-group />

    <div class="table-description">
      <h3>Giao dịch chuyển khoản gần đây</h3>
    </div>

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
      <el-table-column label="Thời gian" prop="created_at" align="center" sortable>
        <template slot-scope="{row}">
          <div>{{ row.created_at ? formatTime(row.created_at) : 'Không biết' }}</div>
        </template>
      </el-table-column>
      <el-table-column label="STK người nhận" prop="to_account_number" align="right" header-align="center" />
      <el-table-column label="Tên người nhận" prop="receiver.user.name" align="left" header-align="center">
        <template slot-scope="{row}">
          <div>{{ row.receiver ? row.receiver.user.name : row.to_name }}</div>
        </template>
      </el-table-column>
      <el-table-column label="Ngân hàng nhận" prop="to_bank_name" align="center" header-align="center" />
      <el-table-column label="Số tiền chuyển" prop="amount" align="right" header-align="center" sortable>
        <template slot-scope="{row}">
          <div>{{ row.amount | toThousandFilter }}đ</div>
        </template>
      </el-table-column>
      <el-table-column label="Nội dung" prop="note" align="left" header-align="center" />
    </el-table>
  </div>
</template>

<script>
import PanelGroup from './components/PanelGroup';
import moment from 'moment';

export default {
  name: 'DashboardAdmin',
  components: {
    PanelGroup
  },
  data() {
    return {
      pagination: {
        data: [],
        total: 0,
        current_page: 1,
        per_page: 10,
        last_page: 0
      },
      orderBy: 'desc',
      sortBy: 'created_at',
      loading: false,
      sum: -1
    };
  },
  created() {
    this.reload();
  },
  methods: {
    async reload() {
      this.loading = true;
      try {
        const from = moment().toISOString();
        const to = moment().subtract(30, 'days').toISOString();

        const result = await this.$store.dispatch(`user/getTransactions`,
          { id: 'me', type: 'transfer', from, to, pagination: this.pagination,
            sortBy: this.sortBy, orderBy: this.orderBy });

        this.pagination = result;
      } catch (err) {
        this.$notify.error({ message: err instanceof Error ? err.message : 'Có lỗi xảy ra', position: 'bottom-right' });
      } finally {
        this.loading = false;
      }
    },
    handleSortChange(column) {
      if (column.order) {
        this.sortBy = column.prop;
        this.orderBy = column.order.startsWith('asc') ? 'asc' : 'desc';

        this.reload();
      }
    },
    formatTime(time) {
      return moment(time).format('DD/MM/YYYY, HH:mm:SS');
    }
  }
};
</script>

<style lang="scss" scoped>
.dashboard-editor-container {
  padding: 32px;
  background-color: rgb(240, 242, 245);
  position: relative;

  .table-description {
    display: flex;
    justify-content: space-between;
  }

  .chart-wrapper {
    background: #fff;
    padding: 16px 16px 0;
    margin-bottom: 32px;
  }
}

@media (max-width:1024px) {
  .chart-wrapper {
    padding: 8px;
  }
}
</style>
