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
      <el-table-column label="ID" prop="id" sortable align="center" width="70" />
      <el-table-column label="Người nhắc nợ" prop="from_name" sortable />
      <el-table-column label="Người nợ" prop="to_name" sortable />
      <el-table-column label="Số tiền" prop="amount" sortable />
      <el-table-column label="Lời nhắc" prop="note" sortable />
      <el-table-column label="Trạng thái" prop="status" sortable />
      <el-table-column label="Ngày tạo" prop="created_at" sortable />
      <el-table-column label="Thao tác" align="center">
        <template slot-scope="{row}">
          <el-button
            type="primary"
            icon="el-icon-edit"
            size="small"
            @click="$router.push({name: 'EditReminder', params: {id: row.id}})"
          />
          <el-button
            type="danger"
            icon="el-icon-delete"
            size="small"
            @click="onRemoving(row.id)"
          />
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

    <el-dialog title="Xoá lời nhắc" :visible.sync="isRemovingShowing" width="60%">
      <el-form
        ref="removingForm"
        :model="removingForm"
        label-width="80px"
        :rules="removingRules"
        style="margin-top: 20px"
        @validate="removingFormValidated"
        @submit.native.prevent
      >
        <el-form-item label-width="0" prop="note">
          <el-input
            v-model="removingForm.note"
            type="textarea"
            :autosize="{ minRows: 2, maxRows: 2}"
          />
        </el-form-item>
        <el-row type="flex" justify="center" style="margin-top: 10px;">
          <el-button
            type="primary"
            :disabled="removingFormInvalid || submitting"
            :loading="submitting"
            @click="remove"
          >Xác nhận</el-button>
          <el-button
            type="danger"
            :disabled="submitting"
            @click="isRemovingShowing = false"
          >Huỷ bỏ</el-button>
        </el-row>
      </el-form>
    </el-dialog>
  </div>
</template>

<script>
import waves from '@/directive/waves';
import permission from '@/directive/permission';

export default {
  directives: { waves, permission },
  data() {
    return {
      isRemovingShowing: false,
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
      removingForm: {
        note: ''
      },
      loading: false,
      filterRules: {
        keyword: [
          { min: 1, max: 32, message: 'Từ khoá từ 1 tới 32 kí tự', trigger: 'change' }
        ]
      },
      removingRules: {
        note: [
          { required: true, message: 'Lí do xoá không được để trống', trigger: 'change' },
          { min: 1, max: 150, message: 'Từ khoá từ 1 tới 150 kí tự', trigger: 'change' }
        ]
      },
      removingFormValidateResult: {
        note: false
      },
      sorts: []
    };
  },
  computed: {
    removingFormInvalid() {
      return Object.values(this.removingFormValidateResult).some(t => t === false);
    }
  },
  created() {
    this.reload();
  },
  methods: {
    async reload() {
      this.loading = true;
      try {
        const result = await this.$store.dispatch('user/getReminders', { id: 'me' });

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
    async remove() {
      this.submitting = true;
      try {
        await this.$store.dispatch('user/deleteReminder', { userId: 'me', reminderId: this.reminderId });

        this.$notify.success({ message: 'Xoá thành công', position: 'bottom-right' });
        this.reload();
        this.$emit('reload-completed');
      } catch (err) {
        this.$notify.error(err instanceof Error ? err.message : 'Có lỗi xảy ra');
      } finally {
        this.submitting = false;
        this.isRemovingShowing = false;
        this.reminderId = 0;
      }
    },
    onRemoving(id) {
      this.reminderId = id;
      this.isRemovingShowing = true;
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
    removingFormValidated(name, valid) {
      this.removingFormValidateResult[name] = valid !== false;
    }
  }
};
</script>
