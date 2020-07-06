<template>
  <div class="app-container">
    <div class="filter-container">
      <el-form ref="form" :model="form" :rules="rules" status-icon label-position="top" @submit.native.prevent @validate="validated">
        <el-row :gutter="20">
          <el-col :md="12" :xs="24">
            <el-form-item prop="account_number" label="Số tài khoản người nhận">
              <el-input v-model.trim="form.account_number" maxlength="16" @input="onAccountChange" />
            </el-form-item>
          </el-col>
          <el-col :md="12" :xs="24">
            <el-form-item prop="account_name" label="Tên tài khoản">
              <el-input v-model="form.account_name" readonly="readonly">
                <el-button v-if="accountLoading" slot="prepend" icon="el-icon-loading" />
              </el-input>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :md="12" :xs="24">
            <el-form-item prop="name" label="Tên gợi nhớ">
              <el-input v-model.trim="form.name" maxlength="150" />
            </el-form-item>
          </el-col>
          <el-col :md="12" :xs="24" />
        </el-row>
        <div style="text-align: center; margin-top: 20px">
          <el-button :disabled="formInvalid" :loading="submitting" type="success">Thêm mới</el-button>
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
        account_number: '',
        name: ''
      },
      isLoaded: false,
      submitting: false,
      accountLoading: false,
      formValidateResult: {
        account_number: false,
        name: false
      },
      rules: {
        account_number: [
          {
            required: true,
            trigger: 'change',
            validator: accountNumberValidator
          }
        ]
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
        await this.$store.dispatch('user/createContact', this.form);
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
