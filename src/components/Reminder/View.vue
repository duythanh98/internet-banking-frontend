<template>
  <div class="app-container">
    <div class="filter-container">
      <el-form ref="form" :model="form" status-icon label-position="top" @submit.native.prevent>
        <el-row :gutter="20">
          <el-col :md="12" :xs="24">
            <el-form-item prop="account_number" label="Số tài khoản người nhắc nợ">
              <el-input v-model.trim="form.account_number" readonly />
            </el-form-item>
          </el-col>
          <el-col :md="12" :xs="24">
            <el-form-item prop="account_name" label="Tên người nhắc nợ">
              <el-input v-model="form.sender.name" readonly>
                <el-button v-if="accountLoading" slot="prepend" icon="el-icon-loading" />
              </el-input>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :md="12" :xs="24">
            <el-form-item prop="amount" label="Số tiền nợ">
              <el-input :value="formatMoney(form.amount) + 'đ'" readonly />
            </el-form-item>
          </el-col>
          <el-col :md="12" :xs="24">
            <el-form-item prop="note" label="Lời nhắc">
              <el-input :value="form.note" readonly />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :md="12" :xs="24">
            <el-form-item prop="amount" label="Ngày nhắc">
              <el-input :value="formatDate(form.created_at)" readonly />
            </el-form-item>
          </el-col>
          <el-col :md="12" :xs="24">
            <el-form-item prop="note" label="Trạng thái">
              <el-input :value="status[form.status] || ''" readonly />
            </el-form-item>
          </el-col>
        </el-row>
        <div style="text-align: center; margin-top: 20px">
          <el-button v-if="form.status === 'created'" :disabled="submitting" :loading="submitting" type="primary" @click="payingDebt(form)">Thanh toán</el-button>
          <el-button submitting type="danger" @click="$router.push({name: 'ReminderList'})">Quay lại</el-button>
        </div>
      </el-form>
    </div>

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
  </div>
</template>

<script>
import moment from 'moment';
import step_1 from './step/step-1';
import step_2 from './step/step-2';
import AccountApi from '@/api/prod/account.api';
import TransferApi from '@/api/prod/transfer.api';
import permission from '@/directive/permission';

export default {
  directives: { permission },
  components: {
    'step-1': step_1,
    'step-2': step_2
  },
  data() {
    return {
      form: {
        account_number: '',
        account_name: '',
        status: '',
        amount: '',
        note: ''
      },
      transferForm: {
        note: '',
        sender_pay_fee: true
      },
      otp: '',
      step: 0,
      transfer: {},
      selectedDebt: {},
      submitting: false,
      accountLoading: false,
      stepProcessing: false,
      debtPaymentShowing: false,
      id: this.$route.params.id || 0,
      status: {
        paid: 'Đã trả',
        created: 'Đã tạo',
        cancel: 'Đã huỷ'
      }
    };
  },
  computed: {
  },
  created() {
    this.reload();
  },
  methods: {
    async reload() {
      try {
        const result = await this.$store.dispatch(`user/getReminder`, { id: this.id });
        console.log(result);

        this.form = Object.assign(this.form, result);
        // this.onAccountChange(result.account_id);
      } catch (err) {
        this.$notify.error({ message: err instanceof Error ? err.message : 'Có lỗi xảy ra', position: 'bottom-right' });
      }
    },
    async onAccountChange(accountNumber) {
      const isValid = accountNumber && /^\d{16}$/.test(accountNumber) && accountNumber !== this.currentAccount;
      this.formValidateResult.account_name = false;

      if (!isValid) {
        this.form.account_name = '';
        return false;
      }

      this.form.account_name = 'Đang tìm kiếm';

      this.accountLoading = true;
      const api = new AccountApi();
      api.setToken(this.$store.state.user.token);
      const res = await api.getUserNameByAccountNumber(accountNumber);

      this.accountLoading = false;

      if (!res.isFailed()) {
        const result = res.result();

        if (!result) {
          this.validForm = false;
          this.form.account_name = 'Không tìm thấy';
          return;
        }

        this.form.account_name = result.name;
        this.formValidateResult.account_name = true;
      }
    },
    payingDebt(debt) {
      this.selectedDebt = debt;
      this.debtPaymentShowing = true;
    },
    async payDebt() {
      try {
        const result = await this.$store.dispatch('user/payDebt', { reminderId: this.selectedDebt.id });

        console.log(result);
        this.transfer = result;
      } catch (err) {
        this.$notify.error({ message: err instanceof Error ? err.message : 'Có lỗi xảy ra', position: 'bottom-right' });
      } finally {
        this.stepProcessing = false;
      }
    },
    async goToOTPStep() {
      this.stepProcessing = true;

      try {
        await this.payDebt();
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
          // case 422: this.$notify.error('Bạn không đủ tiền thực hiện giao dịch này'); break;
          case 410: this.$notify.error('Hết thời gian nhập mã OTP'); break;
          default: this.$notify.error('Có lỗi xảy ra, hãy thử lại sau');
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
    resetPaymentForm() {
      this.otp = '';
      this.transferForm.note = '';
    },
    formatMoney(amount) {
      return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    },
    formatDate(time) {
      return moment(time).format('DD/MM/YYYY');
    }
  }
};
</script>

<style scoped>
</style>
