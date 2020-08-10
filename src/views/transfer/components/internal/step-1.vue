<template>
  <el-form ref="transferForm" :model="transferForm" :rules="validationRules" label-position="top" @validate="validated">
    <el-row :gutter="20">
      <el-col :md="12" :xs="24">
        <el-form-item prop="account_number" label="Số tài khoản người nhận">
          <el-input v-model.trim="transferForm.account_number" maxlength="16" @input="onAccountChange" @change="onAccountChange">
            <el-button slot="append" icon="el-icon-notebook-1" @click="showContactsList" />
          </el-input>
        </el-form-item>
      </el-col>
      <el-col :md="12" :xs="24">
        <el-form-item prop="account_name" label="Tên người nhận">
          <el-input v-model="transferForm.account_name" readonly="readonly">
            <el-button v-if="accountLoading" slot="prepend" icon="el-icon-loading" />
          </el-input>
        </el-form-item>
      </el-col>
    </el-row>
    <el-row :gutter="20">
      <el-col :md="12" :xs="24">
        <el-form-item prop="amount" label="Số tiền chuyển khoản">
          <el-input v-model.number="transferForm.amount" max="1000000000" min="1" maxlength="10" />
        </el-form-item>
        <span class="small">Số tiền bạn nhập: <strong>{{ transferForm.amount | toThousandFilter }}đ</strong></span>

      </el-col>
      <el-col :md="12" :xs="24">
        <el-form-item prop="note" label="Ghi chú">
          <el-input v-model="transferForm.note" maxlength="150" />
        </el-form-item>
      </el-col>
    </el-row>
    <el-row>
      <el-col :md="12" :xs="24">
        <el-form-item>
          <el-checkbox v-model="transferForm.sender_pay_fee">Người chuyển trả phí</el-checkbox>
        </el-form-item>
      </el-col>
      <el-col :md="12" :xs="24">
        <ul class="small">
          <li>Phí giao dịch: <strong>{{ transferFee | toThousandFilter }}đ</strong></li>
          <li>Người gửi trả: <strong>{{ senderAmount | toThousandFilter }}đ</strong></li>
          <li>Người nhận hưởng: <strong>{{ receiverAmount | toThousandFilter }}đ</strong></li>
        </ul>
      </el-col>
    </el-row>
    <div style="text-align: center; margin-top: 20px">
      <el-button :disabled="formInvalid" :loading="loading" type="primary" @click="nextStep">Kế tiếp</el-button>
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
  </el-form>
</template>
<script>

import AccountApi from '@/api/prod/account.api';
import ContactApi from '../../../../api/prod/contact.api';
// import TransferApi from '@/api/prod/transfer.api';

export default {
  props: {
    value: {
      type: Object,
      default() {
        return {
          account_number: '',
          account_name: '',
          amount: 50000,
          sender_pay_fee: true
        };
      }
    },
    fee: {
      type: Object,
      default() {
        return {
          internal: 5000
        };
      }
    },
    loading: {
      type: Boolean,
      default: false
    },
    currentAccount: {
      type: String,
      default: ''
    }
  },
  data() {
    const amountValidator = (rule, value, cb) => {
      if (typeof value !== 'number' || value < 1 || value > 1000000000) {
        return cb(new Error('Số tiền từ 1 - 1,000,000,000'));
      }

      if (!this.transferForm.sender_pay_fee) {
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
      contactsListShowing: false,
      accountLoading: false,
      contactLists: {},
      isContactsListLoaded: false,
      contactsListPage: 1,
      validationRules: {
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
      },
      formValidateResult: {
        account_number: false,
        account_name: false,
        amount: true,
        note: false
      }
    };
  },
  computed: {
    formInvalid() {
      return Object.values(this.formValidateResult).some(t => t === false);
    },
    transferFee() {
      return this.fee.internal;
    },
    senderAmount() {
      return this.transferForm.amount + (this.transferForm.sender_pay_fee ? this.transferFee : 0);
    },
    receiverAmount() {
      return this.transferForm.amount - (this.transferForm.sender_pay_fee ? 0 : this.transferFee);
    },
    transferForm() {
      return this.value;
    }
  },
  watch: {
    'value.sender_pay_fee'() {
      this.$refs.transferForm.validateField('amount', () => void 0);
    }
  },
  methods: {
    async onAccountChange(accountNumber) {
      const isValid = accountNumber && /^\d{16}$/.test(accountNumber) && accountNumber !== this.currentAccount;
      this.formValidateResult.account_name = false;

      if (!isValid) {
        this.transferForm.account_name = '';
        return false;
      }

      this.transferForm.account_name = 'Đang tìm kiếm';

      this.accountLoading = true;
      const api = new AccountApi();
      api.setToken(this.$store.state.user.token);
      const res = await api.getUserNameByAccountNumber(accountNumber);

      this.accountLoading = false;

      if (!res.isFailed()) {
        const result = res.result();

        if (!result) {
          this.validForm = false;
          this.transferForm.account_name = 'Không tìm thấy';
          return;
        }

        this.transferForm.account_name = result.name;
        this.formValidateResult.account_name = true;
      }
    },
    validated(name, valid) {
      this.formValidateResult[name] = valid !== false;
    },
    nextStep() {
      this.$refs.transferForm.validate(async(isValid) => {
        if (isValid) {
          this.$emit('next-step');
        }
      });
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
        return this.$notify.error({ message: 'Có lỗi xảy ra khi tải danh sách', position: 'bottom-right' });
      }

      this.contactLists = res.result();
      this.isContactsListLoaded = true;
    },
    contactListClick(row) {
      this.contactsListShowing = false;
      this.$emit('input', { ...this.value, account_number: row.account_number, account_name: row.name });
      this.formValidateResult.account_name = true;
    }
  }
};
</script>
