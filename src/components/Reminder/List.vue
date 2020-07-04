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
      @filter-change="handleFilterChange"
    >
      <el-table-column label="ID" prop="id" sortable align="right" header-align="center" width="70" />
      <el-table-column v-if="reminding" label="Người nợ" prop="receiver.user.name" align="left" header-align="center" sortable />
      <el-table-column v-else label="Người nhắc nợ" prop="sender.name" align="left" header-align="center" sortable />
      <el-table-column v-if="reminding" label="Số tài khoản" prop="receiver.account_number" align="right" header-align="center" sortable />
      <el-table-column label="Số tiền" prop="amount" align="right" header-align="center" sortable />
      <el-table-column label="Lời nhắc" prop="note" align="left" header-align="center" sortable />
      <el-table-column label="Trạng thái" prop="status" align="center" :filters="statusFilter" filter-placement="bottom-end" sortable>
        <template slot-scope="{row}">
          <div class="status" :style="{background: status[row.status].color}">{{ status[row.status].text }}</div>
        </template>
      </el-table-column>
      <el-table-column label="Ngày tạo" prop="created_at" align="center" sortable>
        <template slot-scope="{row}">
          <div>{{ formatDate(row.created_at) }}</div>
        </template>
      </el-table-column>
      <el-table-column label="Thao tác" align="center">
        <template slot-scope="{row}">
          <el-button
            v-if="!reminding && row.status === 'created'"
            type="primary"
            size="small"
          ><svg-icon icon-class="payment" /></el-button>
          <el-button
            v-if="row.status === 'created'"
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
        @validate="removingFormValidated"
        @submit.native.prevent
      >
        <el-form-item label-width="0" prop="note">
          <el-input
            v-model="removingForm.note"
            type="textarea"
            rows="3"
            maxlength="150"
            placeholder="Nhập lí do"
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
        keyword: '',
        status: []
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
      status: {
        paid: { color: '#28a745', text: 'Đã trả' },
        created: { color: '#007bff', text: 'Đã tạo' },
        cancel: { color: '#dc3545', text: 'Đã huỷ' }
      },
      statusFilter: [
        { text: 'Đã tạo', value: 'created' },
        { text: 'Đã trả', value: 'paid' },
        { text: 'Đã huỷ', value: 'cancel' }
      ],
      sorts: []
    };
  },
  computed: {
    removingFormInvalid() {
      return Object.values(this.removingFormValidateResult).some(t => t === false);
    }
  },
  methods: {
    async reload() {
      this.loading = true;
      try {
        const result = await this.$store.dispatch(`user/getReminders`,
          { id: 'me', type: this.reminding ? 'reminders' : 'debts', status: this.filter.status });

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
        await this.$store.dispatch('user/deleteReminder',
          { reminderId: this.reminderId, note: this.removingForm.note });

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
    },
    handleFilterChange(filters) {
      this.filter.status = filters.status;
      this.reload();
    },
    formatDate(time) {
      return moment(time).format('DD/MM/YYYY');
    }
  }
};
</script>

<style scoped>
.status {
  color: #fff;
  border-radius: 1.5vmin;
  height: fit-content;
  width: fit-content;
  padding: 0.3vmin 0.6vmin;
  font-size: 2.2vmin;
  margin: auto auto;
}
</style>
