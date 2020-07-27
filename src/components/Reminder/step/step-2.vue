<template>
  <div style="text-align: center">
    <p>Vui lòng nhập OTP ứng với mã giao dịch: <strong>{{ transfer.transfer_code || 'Không có' }}</strong></p>
    <el-form ref="otpForm" v-model="form" :rules="validationRules" @validate="validated">
      <el-row :gutter="20">
        <el-col :md="12" :xs="24">
          <el-form-item prop="otp" label="Mã OTP">
            <el-input v-model.trim="form.otp" maxlength="6" @input="$emit('input', form.otp)" />
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
    <div style="text-align: center; margin-top: 20px">
      <el-button :disabled="formInvalid" type="primary" @click="nextStep">Thanh toán</el-button>
      <el-button type="danger" @click="cancel">Huỷ bỏ</el-button>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    transfer: {
      type: Object,
      required: true
    },
    value: {
      type: String,
      required: false,
      default: ''
    }
  },
  data() {
    const validator = (rule, v, cb) => {
      v = this.form.otp;
      cb(typeof v === 'string' && /^\d{6}$/.test(v) ? void 0 : new Error('Mã OTP 6 kí tự số'));
    };

    return {
      form: {
        otp: ''
      },
      validationRules: {
        otp: [
          {
            required: true, trigger: 'change', validator
          }
        ]
      },
      formValidateResult: {
        otp: false
      }
    };
  },
  computed: {
    formInvalid() {
      return Object.values(this.formValidateResult).some(t => t === false);
    }
  },
  watch: {
    value(newVal) {
      if (newVal !== this.form.otp) {
        this.form.otp = newVal;
      }
    }
  },
  methods: {
    validated(name, valid) {
      this.formValidateResult[name] = valid !== false;
    },
    nextStep() {
      this.$emit('next-step');
    },
    cancel() {
      this.$emit('cancel');
    }
  }
};
</script>
