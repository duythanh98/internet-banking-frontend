<template>
  <div class="app-container">
    <el-row class="filter-container" type="flex" justify="space-between">
      <el-col>
        <el-form ref="filter" :model="filter" :rules="filterRules" @submit.native.prevent>
          <el-form-item prop="keyword">
            <el-input
              v-model="filter.keyword"
              class="filter-item"
              :placeholder="$t('Tìm kiếm')"
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
            >{{ $t('Tìm kiếm') }}</el-button>
          </el-form-item>
        </el-form>
      </el-col>
      <el-col style="text-align: right">
        <el-button
          v-waves
          class="filter-item"
          style="margin-left: 10px;"
          type="success"
          icon="el-icon-circle-plus"
          @click="$router.push({name: 'AddCountry'})"
        >{{ $t('Thêm mới') }}</el-button>
        <el-button
          class="filter-item"
          style="margin-left: 10px;"
          type="primary"
          icon="el-icon-refresh"
          @click="reload"
        >{{ $t('Tải lại') }}</el-button>
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
      <el-table-column label="Số tài khoản" prop="account" sortable align="center" />
      <el-table-column label="Số dư hiện tại" prop="deposit" sortable />
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
          { min: 1, max: 32, message: this.$t('Từ khoá từ {min} tới {max} kí tự', { min: 1, max: 32 }), trigger: 'change' }
        ]
      },
      sorts: []
    };
  },
  methods: {
    async reload() {
      this.loading = true;
      try {
        const result = await this.$store.dispatch('user/getAccounts');

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
        this.sorts = [[column.prop, column.order.startsWith('asc') ? 'asc' : 'desc']];
      } else {
        this.sorts = [];
      }

      this.reload();
    }
  }
};
</script>
