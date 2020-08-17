<template>
  <el-row gutters="20">
    <div>
      <el-radio v-model="timeSpan" label="1">7 ngày</el-radio>
      <el-radio v-model="timeSpan" label="2">30 ngày</el-radio>
      <el-radio v-model="timeSpan" label="3">Tuỳ chỉnh</el-radio>

      <el-button type="primary" style="margin-left: 20px" :disabled="formInvalid || loading" icon="el-icon-folder-checked" @click="load">Xem danh sách</el-button>

    </div>

    <el-form v-if="timeSpan === '3'" ref="form" :model="form" style="margin-top: 20px" :rules="rules" label-position="top" @submit.native.prevent @validate="validated">
      <el-row :gutter="10">
        <el-col :md="12" :xs="12">
          <el-form-item label="Ngày bắt đầu" prop="from">
            <el-date-picker
              v-model="form.from"
              format="dd/MM/yyyy"
              value-format="yyyy-MM-dd"
              type="date"
              placeholder="Chọn ngày bắt đầu"
              style="width: 100%;"
            />
          </el-form-item>
        </el-col>
        <el-col :md="12" :xs="12">
          <el-form-item label="Ngày kết thúc" prop="to">
            <el-date-picker
              v-model="form.to"
              format="dd/MM/yyyy"
              value-format="yyyy-MM-dd"
              type="date"
              placeholder="Chọn ngày kết thúc"
              style="width: 100%;"
            />
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
  </el-row>
</template>

<script>
import moment from 'moment';

export default {
  data() {
    const isBeforeToDay = (rule, value, cb) => {
      if (this.form.from && this.form.to &&
          moment(this.form.from, 'YYYY-MM-DD').isAfter(moment(this.form.to, 'YYYY-MM-DD'))) {
        cb(new Error('Ngày bắt đầu phải trước ngày kết thúc'));
      }
      cb();
    };

    const isAfterFromDay = (rule, value, cb) => {
      if (this.form.from && this.form.to &&
          moment(this.form.from, 'YYYY-MM-DD').isAfter(moment(this.form.to, 'YYYY-MM-DD'))) {
        cb(new Error('Ngày kết thúc phải sau ngày bắt đầu'));
      }
      cb();
    };

    return {
      form: {
        from: '',
        to: ''
      },
      formValidateResult: {
        from: false,
        to: false
      },
      rules: {
        from: [
          {
            required: true,
            message: 'Ngày bắt đầu không được để trống',
            trigger: ['blur', 'change']
          },
          {
            validator: isBeforeToDay,
            trigger: ['blur', 'change']
          }
        ],
        to: [
          {
            required: true,
            message: 'Ngày kết thúc không được để trống',
            trigger: ['blur', 'change']
          },
          {
            validator: isAfterFromDay,
            trigger: ['blur', 'change']
          }
        ]
      },
      timeSpan: '2',
      loading: false
    };
  },
  computed: {
    formInvalid() {
      return this.timeSpan === '3' && (Object.values(this.formValidateResult).some(t => t === false));
    }
  },
  methods: {
    load() {
      let to = moment().toISOString();
      let from = to;

      switch (this.timeSpan) {
        case '1':
          from = moment().subtract(7, 'days').toISOString(); break;
        case '2':
          from = moment().subtract(30, 'days').toISOString(); break;
        case '3':
          from = moment(this.form.from, 'YYYY-MM-DD').toISOString();
          to = moment(this.form.to, 'YYYY-MM-DD').toISOString(); break;
      }

      const emitData = { from, to };

      this.$emit('transaction-load', emitData);
    },
    validated(name, valid) {
      this.formValidateResult[name] = valid !== false;
    }
  }
};
</script>
