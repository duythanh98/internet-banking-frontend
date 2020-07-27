<template>
  <div class="app-container">
    <el-row class="filter-container" type="flex" justify="space-between">
      <el-col>
        <!-- <el-form ref="filter" :model="filter" :rules="filterRules" @submit.native.prevent>
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
        </el-form> -->
      </el-col>
      <el-col style="text-align: right">
        <el-button
          v-if="reminding"
          v-waves
          class="filter-item"
          style="margin-left: 10px;"
          type="success"
          icon="el-icon-circle-plus"
          @click="$router.push({name: 'AddReminder'})"
        >Thêm mới</el-button>
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
      @sort-change="handleSortChange"
    >
      <el-table-column label="Người chuyển" prop="from_name" align="left" header-align="center" sortable />
      <el-table-column label="Số tiền chuyển" prop="amount" align="right" header-align="center" sortable>
        <template slot-scope="{row}">
          <div>{{ row.amount | toThousandFilter }}đ</div>
        </template>
      </el-table-column>
      <el-table-column label="Ngân hàng" prop="from_bank_name" align="center" header-align="center" sortable />
      <el-table-column label="Nội dung" prop="note" align="left" header-align="center" sortable />
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

export default {
  directives: { waves, permission },
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
      sorts: []
    };
  },
  methods: {
    async reload() {
      this.loading = true;
      try {
        const result = await this.$store.dispatch('user/getTransactions',
          { type: 'deposit', pagination: this.pagination });

        this.pagination = result;
        this.loading = false;
        this.isLoaded = true;

        this.$emit('reload-completed');
      } catch (err) {
        this.$notify.error(err instanceof Error ? err.message : 'Có lỗi xảy ra');
      } finally {
        this.loading = false;
      }
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
        this.sorts = [[column.prop, column.order.startsWith('asc') ? 'asc' : 'desc']];
      } else {
        this.sorts = [];
      }

      this.reload();
    },
    formatTime(time) {
      return moment(time).format('DD/MM/YYYY, HH:mm:SS');
    }
  }
};
</script>

<style scoped>
</style>