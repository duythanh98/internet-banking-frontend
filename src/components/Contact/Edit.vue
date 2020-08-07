<template>
  <div class="app-container">
    <div class="filter-container">
      <el-form ref="form" :model="form" :rules="rules" status-icon label-position="top" @submit.native.prevent @validate="validated">
        <el-row :gutter="20">
          <el-col :md="12" :xs="24">
            <el-form-item prop="account_number" label="Số tài khoản người nhận">
              <el-input v-model.trim="form.account_number" readonly @input="onAccountChange" />
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
              <el-input v-model="form.name" maxlength="150" />
            </el-form-item>
          </el-col>
          <el-col :md="12" :xs="24">
            <el-form-item prop="bank_name" label="Ngân hàng">
              <el-input v-model="form.bank_name" readonly />
            </el-form-item>
          </el-col>
        </el-row>
        <div v-if="hasChanged" style="text-align: center; margin-top: 20px">
          <el-button :disabled="formInvalid || submitting" :loading="submitting" type="primary" @click="save">Lưu lại</el-button>
          <el-button :disabled="formInvalid || submitting" type="danger" @click="reset">Đặt lại</el-button>
        </div>
      </el-form>
    </div>
  </div>
</template>

<script>
import AccountApi from '@/api/prod/account.api';
import permission from '@/directive/permission';
import TransferApi from '@/api/prod/transfer.api';

export default {
  directives: { permission },

  data() {
    const accountNumberValidator = (rule, value, cb) => {
      if (!value || !/^\d+$/.test(value)) {
        return cb(new Error('Số tài khoản chỉ bao gồm kí tự số'));
      }

      if (value === this.currentAccount) {
        return cb(new Error('Không thể nhập tài khoản nguồn'));
      }

      return cb();
    };

    return {
      form: {
        account_number: '',
        name: '',
        bank_id: '0',
        bank_name: ''
      },
      originalData: {
        name: ''
      },
      isLoaded: false,
      submitting: false,
      accountLoading: false,
      banks: { 0: 'TeaBank' },
      id: this.$route.params.id || 0,
      formValidateResult: {
        account_number: false,
        bank_id: true,
        name: true
      },
      rules: {
        account_number: [
          {
            required: true,
            trigger: 'change',
            validator: accountNumberValidator
          }
        ],
        name: [
          {
            min: 1,
            max: 150,
            message: 'Tên gợi nhớ từ 1 tới 150 kí tự',
            trigger: 'change'
          }
        ],
        bank_id: [
          {
            required: true,
            message: 'Ngân hàng Không được bỏ trống',
            trigger: 'change'
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
      return Object.keys(this.originalData).some(k => this.originalData[k] !== this.form[k]);
    }
  },
  created() {
    this.getBanks();
    this.reload();
  },
  methods: {
    async save() {
      this.submitting = true;

      try {
        const name = this.form.name || this.form.account_name;

        await this.$store.dispatch('user/editContact', { id: this.id, name });
        this.form.name = name;
        this.originalData.name = name;

        this.$notify.success({ message: 'Chỉnh sửa thành công', position: 'bottom-right' });
      } catch (err) {
        this.$notify.error({ message: err instanceof Error ? err.message : 'Có lỗi xảy ra', position: 'bottom-right' });
      } finally {
        this.submitting = false;
      }
    },
    async reload() {
      try {
        const result = await this.$store.dispatch('user/getContact', { id: this.id });

        Object.keys(this.form).forEach(k => {
          this.form[k] = result[k];
        });
        this.onAccountChange(this.form.account_number);
        this.originalData.name = result.name;
      } catch (err) {
        this.$notify.error({ message: err instanceof Error ? err.message : 'Có lỗi xảy ra', position: 'bottom-right' });
      }
    },
    async onAccountChange(accountNumber) {
      const isValid = accountNumber && /^\d+$/.test(accountNumber) && accountNumber !== this.currentAccount;
      this.formValidateResult.account_name = false;

      if (!isValid) {
        this.form.account_name = '';
        return false;
      }

      this.form.account_name = 'Đang tìm kiếm';
      this.formValidateResult.account_name = false;
      this.formValidateResult = { ...this.formValidateResult };

      this.accountLoading = true;
      const api = new AccountApi();
      api.setToken(this.$store.state.user.token);
      let res = null;

      if (this.form.bank_id === '0' || !this.form.bank_id) {
        res = await api.getUserNameByAccountNumber(accountNumber);
      } else {
        res = await api.getExternalAccount(accountNumber, this.form.bank_id);
      }

      this.accountLoading = false;

      if (!res.isFailed()) {
        const result = res.result();

        if (!result) {
          this.validForm = false;
          this.form.account_name = 'Không tìm thấy';
          return;
        }

        this.form.account_name = (typeof result === 'string' ? result : result.name);
        this.formValidateResult.account_name = true;
      }
    },
    onSelectChange() {
      this.onAccountChange(this.form.account_number);
    },
    async getBanks() {
      const api = new TransferApi();
      api.setToken(this.$store.state.user.token);

      const res = await api.getFee();

      const result = res.result();
      if (result.external) {
        result.external.forEach(b => {
          this.banks[b.bank_id] = b.bank_name;
        });
        this.banks = { ...this.banks };
      }
    },
    reset() {
      Object.keys(this.originalData).forEach(k => {
        this.form[k] = this.originalData[k];
      });
    },
    validated(name, valid) {
      this.formValidateResult[name] = valid !== false;
    }
  }
};
</script>

<style scoped>
</style>
