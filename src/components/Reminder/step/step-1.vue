<template>
  <div class="card-panel">
    <el-row class="panel-group">
      <el-col :xs="12" :sm="12" :md="8" style="width: 150px;" class="card-panel-col">
        <div class="card-panel-name">Người nhắc:</div>
      </el-col>
      <el-col :xs="12" :sm="12" :md="16" class="card-panel-col">
        <div class="card-panel-name">{{ debtInfo.sender.name }}</div>
      </el-col>
    </el-row>
    <el-row class="panel-group">
      <el-col :xs="12" :sm="12" :lg="12" :md="12" style="width: 150px;" class="card-panel-col">
        <div class="card-panel-account">Lời nhắc:</div>
      </el-col>
      <el-col :xs="12" :sm="12" :lg="12" :md="12" class="card-panel-col">
        <div class="card-panel-account">{{ debtInfo.note }}</div>
      </el-col>
    </el-row>
    <el-row class="panel-group">
      <el-col :xs="12" :sm="12" :lg="12" :md="12" style="width: 150px;" class="card-panel-col">
        <div class="card-panel-account">Số tiền:</div>
      </el-col>
      <el-col :xs="12" :sm="12" :lg="12" :md="12" class="card-panel-col">
        <div class="card-panel-account">{{ debtInfo.amount | toThousandFilter }}đ</div>
      </el-col>
    </el-row>
    <el-row class="panel-group">
      <el-col :xs="12" :sm="12" :lg="12" :md="12" style="width: 150px;" class="card-panel-col">
        <div class="card-panel-account">Phí:</div>
      </el-col>
      <el-col :xs="12" :sm="12" :lg="12" :md="12" class="card-panel-col">
        <div class="card-panel-account">{{ fee.internal | toThousandFilter }}đ</div>
      </el-col>
    </el-row>
    <el-row class="panel-group">
      <el-col :xs="12" :sm="12" :lg="12" :md="12" style="width: 150px;" class="card-panel-col">
        <div class="card-panel-account">Tổng cộng:</div>
      </el-col>
      <el-col :xs="12" :sm="12" :lg="12" :md="12" class="card-panel-col">
        <div class="card-panel-account">{{ (debtInfo.amount + fee.internal) | toThousandFilter }}đ</div>
      </el-col>
    </el-row>

    <el-form ref="transferForm" :model="transferForm" :rules="validationRules" label-position="left" @validate="validated">
      <el-form-item prop="note" label="Ghi chú">
        <el-input v-model="transferForm.note" maxlength="150" />
      </el-form-item>
    </el-form>

    <div style="text-align: center; margin-top: 20px">
      <el-button type="primary" :disabled="formInvalid" @click="nextStep">Xác nhận</el-button>
      <el-button type="danger" @click="cancel">Huỷ bỏ</el-button>
    </div>
  </div>
</template>

<script>
import TransferApi from '../../../api/prod/transfer.api';
export default {
  props: {
    value: {
      type: Object,
      default() {
        return {
          note: '',
          sender_pay_fee: true
        };
      }
    },
    debtInfo: {
      type: Object,
      default() {
        return {};
      }
    }
  },
  data() {
    return {
      validationRules: {
        note: [{
          required: true,
          trigger: 'change',
          validator(rule, value, cb) {
            return cb(value && value.length > 0 && value.length <= 150 ? undefined : new Error('Ghi chú từ 1 - 150 kí tự'));
          }
        }]
      },
      formValidateResult: {
        note: false
      },
      fee: {
        internal: 5000
      }
    };
  },
  computed: {
    formInvalid() {
      return Object.values(this.formValidateResult).some(t => t === false);
    },
    transferForm() {
      return this.value;
    }
  },
  async created() {
    const api = new TransferApi();
    api.setToken(this.$store.state.user.token);

    const res = await api.getFee();

    const result = res.result();
    this.fee = result;
  },
  methods: {
    nextStep() {
      this.$emit('next-step');
    },
    cancel() {
      this.$emit('cancel');
    },
    validated(name, valid) {
      this.formValidateResult[name] = valid !== false;
    }
  }
};
</script>

<style lang="scss" scoped>
.card-panel {
  width: 100%;
  cursor: pointer;
  font-size: 12px;
  overflow: hidden;
  color: #666;
  background: #fff;
  box-shadow: 4px 4px 40px rgba(0, 0, 0, 0.05);
  border-color: rgba(0, 0, 0, 0.05);

  .panel-group {
    width: 100%;
    margin-left: 20px;

    .card-panel-col:nth-child(odd) {
      font-weight: bold;
    }
  }

  .card-panel-text {
    line-height: 18px;
    color: black;
    font-size: 18px;
    margin-bottom: 12px;
    text-align: right;
  }

  .card-panel-name {
    font-size: 16px;
    margin-bottom: 10px;
  }

  .card-panel-account {
    font-size: 16px;
    margin-bottom: 10px;
  }
}
</style>
