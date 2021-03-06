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
          v-if="reminding && isCurrentCustomer"
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
      <el-table-column v-if="reminding" label="Người nợ" prop="receiver.user.name" align="left" header-align="center" sortable />
      <el-table-column v-else label="Người nhắc nợ" prop="sender.name" align="left" header-align="center" sortable />
      <el-table-column v-if="reminding" label="Số tài khoản" prop="receiver.account_number" align="right" header-align="center" sortable />
      <el-table-column label="Số tiền" prop="amount" align="right" header-align="center" sortable>
        <template slot-scope="{row}">
          <div>{{ row.amount | toThousandFilter }}đ</div>
        </template>
      </el-table-column>
      <el-table-column label="Ghi chú" prop="note" align="left" header-align="center" sortable />
      <el-table-column v-if="filterStatus.length <= 0" label="Trạng thái" column-key="status" prop="status" align="center" :filters="statusFilter" filter-placement="bottom-end" sortable>
        <template slot-scope="{row}">
          <el-tag :type="status[row.status].type">{{ status[row.status].text }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column :label="reminding ? 'Ngày gửi' : 'Ngày nhận'" prop="created_at" align="center" sortable>
        <template slot-scope="{row}">
          <div>{{ row.created_at ? formatDate(row.created_at) : 'Không biết' }}</div>
        </template>
      </el-table-column>
      <el-table-column label="Thao tác" align="center">
        <template slot-scope="{row}">
          <el-button
            v-if="!reminding && row.status === 'created' && isCurrentCustomer"
            type="primary"
            size="small"
            @click="payingDebt(row)"
          ><svg-icon icon-class="payment" /></el-button>
          <el-button
            type="primary"
            size="small"
            style="margin: 0 5px"
            @click="$router.push({name: 'ViewReminder', params: {id: row.id, userId: '' + id}})"
          ><svg-icon icon-class="eye-open" /></el-button>
          <el-button
            v-if="row.status === 'created' && isCurrentCustomer"
            type="danger"
            icon="el-icon-delete"
            size="small"
            style="margin: 0"
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

    <el-dialog title="Thanh toán nợ" :visible.sync="debtPaymentShowing" width="60%">
      <div>
        <div v-loading="stepProcessing">
          <el-steps :active="step" align-center finish-status="success" style="margin: 20px 0px">
            <el-step title="Thông tin thanh toán" />
            <el-step title="Nhập OTP" />
          </el-steps>
          <step-1 v-show="step === 0" v-model="transferForm" :debt-info="selectedDebt" @next-step="goToOTPStep" @cancel="cancel" />
          <step-2 v-show="step === 1" v-model="otp" :transfer="transfer" @next-step="transferNow" @cancel="cancel" />
        </div>
      </div>
    </el-dialog>

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
import step_1 from './step/step-1';
import step_2 from './step/step-2';
import TransferApi from '@/api/prod/transfer.api';

export default {
  directives: { waves, permission },
  components: {
    'step-1': step_1,
    'step-2': step_2
  },
  props: {
    reminding: {
      type: Boolean,
      default: false
    },
    filterStatus: {
      type: Array,
      default() {
        return [];
      }
    }
  },
  data() {
    return {
      isRemovingShowing: false,
      debtPaymentShowing: false,
      stepProcessing: false,
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
      transferForm: {
        note: '',
        sender_pay_fee: true
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
        paid: { type: 'success', text: 'Đã trả' },
        created: { type: 'primary', text: 'Đã tạo' },
        cancel: { type: 'danger', text: 'Đã huỷ' }
      },
      statusFilter: [
        { text: 'Đã tạo', value: 'created' },
        { text: 'Đã trả', value: 'paid' },
        { text: 'Đã huỷ', value: 'cancel' }
      ],
      selectedDebt: {},
      transfer: {},
      otp: '',
      sorts: [],
      step: 0,
      id: this.$route.params.id || 'me'
    };
  },
  computed: {
    removingFormInvalid() {
      return Object.values(this.removingFormValidateResult).some(t => t === false);
    },
    isCurrentCustomer() {
      const roles = [...this.$store.getters.roles];
      return roles.includes('customer');
    }
  },
  methods: {
    async reload() {
      this.loading = true;
      try {
        const result = await this.$store.dispatch(`user/getReminders`,
          { id: this.id, type: this.reminding ? 'reminders' : 'debts',
            status: this.filterStatus.length > 0 ? this.filterStatus : this.filter.status });

        this.pagination = result;
        this.isLoaded = true;

        console.log(result);

        this.$emit('reload-completed');
      } catch (err) {
        this.$notify.error({ message: err instanceof Error ? err.message : 'Có lỗi xảy ra', position: 'bottom-right' });
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
        this.$notify.error({ message: err instanceof Error ? err.message : 'Có lỗi xảy ra', position: 'bottom-right' });
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
    payingDebt(debt) {
      this.selectedDebt = debt;
      this.debtPaymentShowing = true;
    },
    async goToOTPStep() {
      this.stepProcessing = true;

      try {
        const result = await this.$store.dispatch('user/payDebt', { reminderId: this.selectedDebt.id });

        console.log(result);
        this.transfer = result;
        this.step = 1;
      } catch (err) {
        this.$notify.error({ message: err instanceof Error ? err.message : 'Có lỗi xảy ra', position: 'bottom-right' });
      } finally {
        this.stepProcessing = false;
      }
    },
    async transferNow() {
      this.submitting = true;
      this.stepProcessing = true;

      const otp = this.otp;
      const transfer = new TransferApi();
      transfer.setToken(this.$store.getters.token);

      const res = await transfer.acceptTransfer(this.transfer.transfer_id, otp, this.transfer.transfer_code);

      this.stepProcessing = false;
      console.log(res);

      if (res.isFailed()) {
        switch (res.status()) {
          case 422: {
            const r = res.result();

            if (r && r.opt_code && Array.isArray(r.opt_code)) {
              if (r.opt_code.includes('invalid')) {
                this.$notify.error({ message: 'Mã OTP không đúng', position: 'bottom-right' });
              }
            } else if (r && r.amount && Array.isArray(r.amount)) {
              if (r.amount.includes('max')) {
                this.$notify.error({ message: 'Bạn không đủ tiền thực hiện giao dịch này', position: 'bottom-right' });
              }
            } else {
              this.$notify.error({ message: 'Có lỗi xảy ra, hãy thử lại sau', position: 'bottom-right' });
            }
            break;
          }
          case 410: this.$notify.error({ message: 'Hết thời gian nhập mã OTP', position: 'bottom-right' }); break;
          default: this.$notify.error({ message: 'Có lỗi xảy ra, hãy thử lại sau', position: 'bottom-right' });
        }

        this.submitting = false;
        this.stepProcessing = false;

        return this.cancel();
      }

      this.step = 0;
      this.submitting = false;
      this.stepProcessing = false;
      this.debtPaymentShowing = false;

      this.resetPaymentForm();
      this.reload();
    },
    cancel() {
      this.step = 0;
      this.debtPaymentShowing = false;
      this.resetPaymentForm();
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
    },
    reset(formName) {
      this.$refs[formName].resetFields();
    },
    resetPaymentForm() {
      this.otp = '';
      this.transferForm.note = '';
    }
  }
};
</script>

<style scoped>
</style>
