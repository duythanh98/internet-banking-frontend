<template>
  <div class="app-container">
    <div class="filter-container">
      <template v-if="hasCustomerRole">
        <p v-if="form.sender && currentUserId === form.sender.id">Bạn đã gửi nhắc nợ lúc {{ formatTime(form.created_at) }}</p>
        <p v-else-if="form.receiver && currentUserId === form.receiver.user.id">Bạn đã nhận nhắc nợ lúc {{ formatTime(form.created_at) }}</p>
      </template>

      <table style="width:100%">
        <tr>
          <th>Số tài khoản:</th>
          <td>{{ form.sender ? form.sender.account.account_number : '' }}</td>
        </tr>
        <tr>
          <th>Họ tên:</th>
          <td>{{ form.sender ? form.sender.name : '' }}</td>
        </tr>
        <tr>
          <th>Số tiền nợ:</th>
          <td>{{ formatMoney(form.amount) + 'đ' }}</td>
        </tr>
        <tr>
          <th>Ghi chú:</th>
          <td>{{ form.note }}</td>
        </tr>
        <tr>
          <th>Trạng thái:</th>
          <td><el-tag v-if="status[form.status]" :type="status[form.status].type || 'primary'">{{ status[form.status].text || '' }}</el-tag></td>
        </tr>
        <tr v-if="!hasCustomerRole">
          <th v-if="form.sender && +userId === form.sender.id">Thời gian:</th>
          <th v-else-if="form.receiver && +userId === form.receiver.user.id">Thời gian nhận:</th>
          <th v-else>Thời gian:</th>
          <td>{{ formatTime(form.created_at) }}</td>
        </tr>
      </table>

      <div v-if="hasCustomerRole" style="text-align: center; margin-top: 20px">
        <el-button v-if="form.status === 'created'" :disabled="submitting" :loading="submitting" type="primary" @click="payingDebt(form)">Thanh toán</el-button>
        <el-button submitting type="danger" @click="$router.push({name: 'ReminderList'})">Quay lại</el-button>
      </div>
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
  props: {
    userId: {
      type: String,
      default: ''
    }
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
        paid: { type: 'success', text: 'Đã trả' },
        created: { type: 'primary', text: 'Đã tạo' },
        cancel: { type: 'danger', text: 'Đã huỷ' }
      }
    };
  },
  computed: {
    hasCustomerRole() {
      const roles = [...this.$store.getters.roles];
      return roles.includes('customer');
    },
    currentUserId() {
      return +this.$store.getters.userInfo.id || 0;
    },
    isCurrentUser() {
      return this.userId === 'me' || +this.userId === this.currentUserId;
    }
  },
  created() {
    this.reload();
    console.log(this.$store.getters.userInfo);
  },
  methods: {
    async reload() {
      try {
        const result = await this.$store.dispatch(`user/getReminder`, { id: this.id });
        console.log(result);

        this.form = Object.assign(this.form, result);
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
    resetPaymentForm() {
      this.otp = '';
      this.transferForm.note = '';
    },
    formatMoney(amount) {
      return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    },
    formatTime(time) {
      return moment(time).format('HH:mm:SS, DD/MM/YYYY');
    }
  }
};
</script>

<style lang="scss" scoped>
table {
  width: 100%;
  font-size: 14px;
  color: #606266;
  background-color: #fff;
  border-collapse: collapse;
  border: 1px solid #dfe6ec;

  th {
    width: 40%;
    text-align: left;
    padding: 10px 20px;
    border-collapse: collapse;
    border: 1px solid #dfe6ec;
  }

  td {
    width: 60%;
    text-align: left;
    padding: 10px 20px;
    border-collapse: collapse;
    border: 1px solid #dfe6ec;
  }
}
</style>
