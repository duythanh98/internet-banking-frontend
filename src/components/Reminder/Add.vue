<template>
  <div class="app-container">
    <div class="filter-container">
      <el-form ref="form" :model="form" :rules="rules" status-icon label-position="top" @submit.native.prevent @validate="validated">
        <el-row :gutter="20">
          <el-col :md="12" :xs="24">
            <el-form-item prop="account_number" label="Số tài khoản người nợ">
              <el-input v-model.trim="form.account_number" maxlength="16" @input="onAccountChange">
                <el-button slot="append" icon="el-icon-notebook-1" />
              </el-input>
            </el-form-item>
          </el-col>
          <el-col :md="12" :xs="24">
            <el-form-item prop="account_name" label="Tên người nợ">
              <el-input v-model="form.account_name" readonly="readonly">
                <el-button v-if="accountLoading" slot="prepend" icon="el-icon-loading" />
              </el-input>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :md="12" :xs="24">
            <el-form-item prop="amount" label="Số tiền nợ">
              <el-input v-model.number="form.amount" max="1000000000" min="1" maxlength="10" />
            </el-form-item>
          </el-col>
          <el-col :md="12" :xs="24">
            <el-form-item prop="note" label="Lời nhắc">
              <el-input v-model="form.note" maxlength="150" />
            </el-form-item>
          </el-col>
        </el-row>
        <div style="text-align: center; margin-top: 20px">
          <el-button :disabled="formInvalid" :loading="submitting" type="primary">Tạo lời nhắc</el-button>
        </div>
      </el-form>
    </div>
  </div>
</template>

<script>
import AccountApi from '@/api/prod/account.api';
import permission from '@/directive/permission';

export default {
  directives: { permission },

  data() {
    const amountValidator = (rule, value, cb) => {
      if (typeof value !== 'number' || value < 1 || value > 1000000000) {
        return cb(new Error('Số tiền từ 1 - 1,000,000,000'));
      }

      if (!this.form.sender_pay_fee) {
        if (value - this.transferFee <= 0) {
          return cb(new Error(`Số tiền từ ${1 + this.transferFee} - 1,000,000,000`));
        }
      }

      return cb();
    };

    const accountNumberValidator = (rule, value, cb) => {
      if (!value || !/^\d{16}$/.test(value)) {
        return cb(new Error('Số tài khoản gồm 16 chữ số'));
      }

      if (value === this.currentAccount) {
        return cb(new Error('Không thể nhập tài khoản nguồn'));
      }

      return cb();
    };

    return {
      form: {
        account: '',
        account_name: '',
        amount: '',
        note: '',
        status: ''
      },
      icon: null,
      isLoaded: false,
      submitting: false,
      accountLoading: false,
      formValidateResult: {
        account: false,
        account_name: false,
        amount: false,
        note: false,
        status: false
      },
      rules: {
        account_number: [
          {
            required: true,
            trigger: 'change',
            validator: accountNumberValidator
          }
        ],
        amount: [
          {
            required: true,
            trigger: 'change',
            validator: amountValidator
          }
        ],
        note: [{
          required: true,
          trigger: 'change',
          validator(rule, value, cb) {
            return cb(value && value.length > 0 && value.length <= 150 ? undefined : new Error('Ghi chú từ 1 - 150 kí tự'));
          }
        }]
      }
    };
  },
  computed: {
    formInvalid() {
      return Object.values(this.formValidateResult).some(t => t === false);
    },
    hasChanged() {
      return Object.keys(this.form).some(k => this.form[k] !== '');
    }
  },
  methods: {
    async save() {
      this.submitting = true;

      try {
        await this.$store.dispatch('user/createReminder', this.form);
        this.reset('form');

        this.$notify.success({ message: this.$t('Thêm mới thành công'), position: 'bottom-right' });
        this.$router.push({ name: 'ListCountry' });
      } catch (err) {
        this.$notify.error(err instanceof Error ? err.message : 'Có lỗi xảy ra');
      } finally {
        this.submitting = false;
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
    reset(formName) {
      this.$refs[formName].resetFields();
    },
    validated(name, valid) {
      this.formValidateResult[name] = valid !== false;
    }
  }
};
</script>

<style scoped>
</style>
