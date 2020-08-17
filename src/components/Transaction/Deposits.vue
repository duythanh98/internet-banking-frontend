<template>
  <div class="app-container">
    <date-filter style="margin-bottom: 20px" @transaction-load="loadTransactions" />

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
      <el-table-column label="Tên người chuyển" prop="from_name" align="left" header-align="center">
        <template slot-scope="{ row }">
          <div v-if="row.teller_id !== null">Giao dịch viên</div>
          <div v-else>{{ row.sender ? row.sender.user.name : row.from_name }}</div>
        </template>
      </el-table-column>
      <el-table-column label="Số tiền chuyển" prop="amount" align="right" header-align="center" sortable>
        <template slot-scope="{row}">
          <div>{{ row.amount | toThousandFilter }}đ</div>
        </template>
      </el-table-column>
      <el-table-column label="Ngân hàng" prop="from_bank_name" align="center" header-align="center" />
      <el-table-column label="Nội dung" prop="note" align="left" header-align="center" />
      <el-table-column label="Thời gian chuyển" prop="created_at" align="center" sortable>
        <template slot-scope="{row}">
          <div>{{ row.created_at ? formatTime(row.created_at) : 'Không biết' }}</div>
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
import moment from 'moment';
import DateFilter from './DateFilter';

export default {
  directives: { waves, permission },
  components: { DateFilter },
  props: {
    reminding: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      isLoaded: false,
      submitting: false,
      reminderId: 0,
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
      orderBy: 'desc',
      sortBy: 'created_at',
      id: this.$route.params.id || 'me',
      to: moment().toISOString(),
      from: moment().subtract(30, 'days').toISOString()
    };
  },
  methods: {
    async reload() {
      this.loading = true;
      try {
        const result = await this.$store.dispatch('user/getTransactions',
          { id: this.id, type: 'deposit', pagination: this.pagination,
            sortBy: this.sortBy, orderBy: this.orderBy, from: this.from, to: this.to });

        this.pagination = result;
        this.isLoaded = true;

        this.$emit('reload-completed');
      } catch (err) {
        this.$notify.error({ message: err instanceof Error ? err.message : 'Có lỗi xảy ra', position: 'bottom-right' });
      } finally {
        this.loading = false;
      }
    },
    loadTransactions(data) {
      if (data) {
        this.from = data.from;
        this.to = data.to;
      }
      this.reload();
    },
    load() {
      if (!this.isLoaded) {
        this.reload();
      }
    },
    handleFilter() {
      this.$refs.filter.validate(valid => {
        if (valid && this.filter.keyword) {
          this.pagination.current_page = 1;
          this.reload();
        }
        return false;
      });
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

<style scoped>
</style>
