<template>
  <div v-loading="stepProcessing">
    <top />
    <el-steps :active="step" align-center finish-status="success" style="margin: 20px 0px">
      <el-step title="Nhập thông tin chuyển khoản" />
      <el-step title="Nhập OTP" />
      <el-step title="Hoàn tất" />
    </el-steps>
    <step-1 v-show="step === 0" v-model="transferForm" :current-account="$store.getters.account" :fee="fee" @next-step="goToOTPStep" />
    <step-2 v-show="step === 1" v-model="otp" :transfer="transfer" @next-step="transferNow" @cancel="cancel" />
    <step-3 v-show="step === 3" :account-number="transferForm.account_number" :account-name="transferForm.account_name" @new-transaction="newTransaction" />
  </div>
</template>
<script>
import top from '../top';
import TransferApi from '@/api/prod/transfer.api';
import step_1 from './step-1';
import step_2 from './step-2';
import step_3 from './step-3';

export default {
  components: {
    top,
    'step-1': step_1,
    'step-2': step_2,
    'step-3': step_3
  },
  props: {
    fee: {
      type: Object,
      default() {
        return {
          internal: 5000
        };
      }
    }
  },
  data() {
    return {
      step: 0,
      transferForm: {
        account_number: '',
        account_name: '',
        amount: 50000,
        sender_pay_fee: true
      },
      loading: false,
      formValidateResult: {
        account_number: false,
        account_name: false,
        amount: true,
        note: false
      },
      stepProcessing: false,
      transfer: {

      },
      otp: ''
    };
  },
  methods: {
    resetForm() {
      this.transferForm = {
        account_number: '',
        account_name: '',
        amount: 50000,
        sender_pay_fee: true
      };
    },
    newTransaction() {
      this.$emit('reset');
    },
    async createTransfer() {
      const api = new TransferApi();
      api.setToken(this.$store.getters.token);
      const res = await api.internalTransfer(
        this.$store.getters.account,
        this.transferForm.account_number,
        this.transferForm
      );

      if (res.isFailed()) {
        if (res.status() === 422) {
          const r = res.result();

          if (r && r.amount && Array.isArray(r.amount)) {
            if (r.amount.includes('max')) {
              throw new Error('Số tiền vượt quá số dư tài khoản');
            }

            throw new Error('Số tiền không hợp lệ');
          }
        }

        throw new Error('Có lỗi xảy ra');
      }

      this.transfer = res.result();
      this.stepProcessing = false;
    },
    async goToOTPStep() {
      this.stepProcessing = true;

      try {
        await this.createTransfer();
        this.step = 1;
      } catch (err) {
        this.$notify.error({ message: err instanceof Error ? err.message : 'Có lỗi xảy ra', position: 'bottom-right' });
      } finally {
        this.stepProcessing = false;
      }
    },
    cancel() {
      this.step = 0;
    },
    async transferNow() {
      this.stepProcessing = true;
      this.step = 2;

      const otp = this.otp;
      const transfer = new TransferApi();
      transfer.setToken(this.$store.getters.token);

      const res = await transfer.acceptTransfer(this.transfer.transfer_id, otp, this.transfer.transfer_code);

      this.stepProcessing = false;

      if (res.isFailed()) {
        switch (res.status()) {
          case 422: this.$notify.error('Bạn không đủ tiền thực hiện giao dịch này'); break;
          case 410: this.$notify.error('Hết thời gian nhập mã OTP'); break;
          default: this.$notify.error('Có lỗi xảy ra, hãy thử lại sau');
        }

        return this.cancel();
      }

      this.step = 3;
    }
  }
};
</script>
<style scoped>
.small {
  font-size: 14px;
}
</style>
