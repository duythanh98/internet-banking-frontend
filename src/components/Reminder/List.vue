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
          @click="$router.push({name: 'AddReminder'})"
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
      <el-table-column label="ID" prop="id" sortable align="center" width="145" />
      <el-table-column label="Người nhắc nợ" prop="from" sortable />
      <el-table-column label="Người nợ" prop="account" sortable />
      <el-table-column label="Số tiền" prop="amount" sortable />
      <el-table-column label="Lời nhắc" prop="note" sortable />
      <el-table-column label="Trạng thái" prop="status" sortable />
      <el-table-column label="Ngày tạo" prop="created_at" sortable />
      <el-table-column :label="$t('Thao tác')" align="center">
        <template slot-scope="{row}">
          <el-button
            type="primary"
            icon="el-icon-edit"
            size="small"
            @click="$router.push({name: 'EditReminder', params: {id: row.id}})"
          />
          <el-popconfirm
            :title="$t('Bạn có muốn xoá lời nhắc này không?')"
            :confirm-button-text="$t('Đồng ý')"
            :cancel-button-text="$t('Không')"
            @onConfirm="remove(row.id)"
          >
            <el-button slot="reference" type="danger" icon="el-icon-delete" size="small" />
          </el-popconfirm>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      v-show="pagination.total > 0"
      :page-sizes="[10, 20, 30, 50]"
      :page-size="pagination.per_page"
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
          { min: 1, max: 32, message: this.$t('Từ khoá từ {min} tới {max} kí tự', { min: 1, max: 32 }), trigger: 'change' }
        ]
      },
      sorts: []
    };
  },
  methods: {
    async reload() {
      this.loading = true;
      this.$store.dispatch('getReminders')
        .then((result) => {
          this.pagination = result;
          this.loading = false;
          this.isLoaded = true;
          this.$emit('reload-completed');
        })
        .catch((err) => {
          this.$notify.error(err.message);
          this.loading = false;
        });

      // const response = await api.getReminders(
      //   this.pagination.per_page,
      //   this.pagination.current_page,
      //   this.sorts
      // );
    },
    async remove(id) {
      this.$store.dispatch('getReminders', { id })
        .then(() => {
          this.$notify.success({ message: this.$t('Xoá thành công'), position: 'bottom-right' });
          this.reload();
        })
        .catch((err) => {
          this.$notify.error(err.message);
        });
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
    }
  }
};
</script>
