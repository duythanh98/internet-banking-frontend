<template>
  <div class="app-container">
    <div class="filter-container">
      <el-form ref="form" :model="form" :rules="rules" status-icon label-position="top" @submit.native.prevent @validate="validated">
        <el-row :gutter="20">
          <el-col :md="12" :xs="24">
            <el-form-item prop="account_number" label="Số tài khoản người nợ">
              <el-input v-model.trim="form.account_number" maxlength="16" @input="onAccountChange">
                <el-button slot="append" icon="el-icon-notebook-1" @click="showContactsList" />
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
          <el-button :disabled="formInvalid" :loading="submitting" type="primary" @click="save">Tạo lời nhắc</el-button>
        </div>
      </el-form>
    </div>
    <el-dialog title="Danh sách tài khoản" :visible.sync="contactsListShowing" width="60%">
      <div v-loading="!isContactsListLoaded">
        <el-table :data="contactLists.data" @row-click="contactListClick">
          <el-table-column property="name" label="Tên tài khoản" />
          <el-table-column property="account_number" label="Số tài khoản" />
          <el-table-column property="bank_name" label="Ngân hàng" />
        </el-table>
        <el-pagination
          style="margin-top: 10px"
          :page-size="contactLists.per_page || 10"
          :pager-count="11"
          layout="prev, pager, next"
          :total="contactLists.total || 0"
        />
      </div>
    </el-dialog>
  </div>
</template>

<script>
import AccountApi from '@/api/prod/account.api';
import ContactApi from '@/api/prod/contact.api';
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

      if (this.form.account_number === this.$store.getters.account) {
        return cb(new Error('Không thể gán nợ tài khoản của chính bạn'));
      }

      return cb();
    };

    return {
      form: {
        account_number: '',
        account_name: '',
        amount: '',
        note: ''
      },
      isLoaded: false,
      submitting: false,
      accountLoading: false,
      contactLists: {},
      contactsListShowing: false,
      isContactsListLoaded: false,
      contactsListPage: 1,
      formValidateResult: {
        account_number: false,
        account_name: false,
        amount: false,
        note: false
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
        // eslint-disable-next-line no-unused-vars
        const { account_name, ...submit } = this.form;
        await this.$store.dispatch('user/createReminder', submit);
        this.reset('form');

        this.$notify.success({ message: 'Thêm mới thành công', position: 'bottom-right' });
        this.$router.push({ name: 'ReminderList', params: { targetedTab: 'reminder' }});
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
    },
    showContactsList() {
      this.contactsListShowing = true;

      if (!this.isContactsListLoaded) {
        this.loadContactsList();
      }
    },
    async loadContactsList() {
      const contact = new ContactApi();
      this.isContactsListLoaded = false;

      contact.setToken(this.$store.getters.token);

      const res = await contact.getContact('me', this.contactsListPage, 'internal');

      if (res.isFailed() || res.status() !== 200) {
        return this.$notify.error('Có lỗi xảy ra khi tải danh sách');
      }

      this.contactLists = res.result();
      this.isContactsListLoaded = true;
    },
    contactListClick(row) {
      this.contactsListShowing = false;
      this.form.account_number = row.account_number;
      this.form.account_name = row.name;
      this.formValidateResult.account_name = true;
    }
  }
};
</script>

<style scoped>
</style>
