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
        <el-button
          v-waves
          class="filter-item"
          style="margin-left: 10px;"
          type="success"
          icon="el-icon-circle-plus"
          @click="$router.push({name: 'AddContact'})"
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
      <el-table-column label="ID" prop="id" sortable align="right" header-align="center" width="70" />
      <el-table-column label="Số tài khoản" prop="account_number" align="right" header-align="center" sortable />
      <el-table-column label="Tên gợi nhớ" prop="name" align="left" header-align="center" sortable />
      <el-table-column label="Ngân hàng" prop="bank_name" align="center" header-align="center" sortable />
      <el-table-column label="Thao tác" align="center">
        <template slot-scope="{row}">
          <el-button
            type="primary"
            icon="el-icon-edit"
            size="small"
            @click="$router.push({name: 'EditContact', params: {id: row.id}})"
          />
          <el-popconfirm
            title="Bạn có muốn xoá người nhận này không?"
            confirm-button-text="Đồng ý"
            cancel-button-text="Không"
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
          { min: 1, max: 32, message: 'Từ khoá từ 1 tới 32 kí tự', trigger: 'change' }
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
        const result = await this.$store.dispatch('user/getContacts', { id: 'me' });

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
    async remove(id) {
      try {
        await this.$store.dispatch('user/deleteContact', { contactId: id });

        this.$notify.success({ message: 'Xoá thành công', position: 'bottom-right' });
        this.reload();
        this.$emit('reload-completed');
      } catch (err) {
        this.$notify.error(err instanceof Error ? err.message : 'Có lỗi xảy ra');
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
    }
  }
};
</script>
