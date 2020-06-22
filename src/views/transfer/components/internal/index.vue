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
  </div>
</template>
<script>
import top from '../top';
import TransferApi from '@/api/prod/transfer.api';
import step_1 from './step-1';
import step_2 from './step-2';

export default {
  components: {
    top,
    'step-1': step_1,
    'step-2': step_2
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
        this.$notify.error(err instanceof Error ? err.message : 'Có lỗi xảy ra');
      } finally {
        this.stepProcessing = false;
      }
    },
    cancel() {
      this.step = 0;
    },
    async transferNow() {
      const otp = this.otp;
      const transfer = new TransferApi();
      transfer.setToken(this.$store.getters.token);

      transfer.acceptTransfer(this.transfer.transfer_id, otp);
    }
  }
};
</script>
<style scoped>
.small {
  font-size: 14px;
}
</style>
