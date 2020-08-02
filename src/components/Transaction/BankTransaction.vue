<template>
  <div v-loading="loading" class="app-container">
    <div class="filter-container">
      <el-form ref="form" :model="form" :rules="rules" label-position="top" @submit.native.prevent @validate="validated">
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

        <el-row :gutter="10" style="display: flex; align-items: flex-end">
          <el-col :md="12" :xs="12">
            <el-form-item label="Ngân hàng" prop="bankId">
              <el-select v-model="form.bankId" style="width: 100%" placeholder="Chọn ngân hàng">
                <el-option
                  v-for="(title, value) in banks"
                  :key="value"
                  :label="title"
                  :value="value"
                />
              </el-select>
            </el-form-item>
          </el-col>

          <el-col :md="8" :xs="12" style="padding-bottom: 22px">
            <el-button type="primary" style="width: 100%" :disabled="formInvalid || submitting" icon="el-icon-folder-checked" @click="reload">Xem danh sách</el-button>
          </el-col>
        </el-row>
      </el-form>
    </div>

    <p v-if="sum >= 0"><strong>Tổng số tiền đã giao dịch: </strong>{{ sum | toThousandFilter }}đ</p>

    <el-table
      v-if="pagination.total > 0"
      v-loading="loading"
      :data="pagination.data"
      border
      fit
      sortable="custom"
      highlight-current-row
      style="width: 100%;"
      @sort-change="handleSortChange"
    >
      <el-table-column label="Tên người chuyển" prop="from_name" align="left" header-align="center" sortable />
      <el-table-column label="Ngân hàng chuyển" prop="from_bank_name" align="center" header-align="center" sortable />
      <el-table-column label="STK người nhận" prop="to_account_number" align="right" header-align="center" sortable />
      <el-table-column label="Tên người nhận" prop="receiver.user.name" align="left" header-align="center" sortable />
      <el-table-column label="Ngân hàng nhận" prop="to_bank_name" align="center" header-align="center" sortable />
      <el-table-column label="Số tiền chuyển" prop="amount" align="right" header-align="center" sortable>
        <template slot-scope="{row}">
          <div>{{ row.amount | toThousandFilter }}đ</div>
        </template>
      </el-table-column>
      <el-table-column label="Nội dung" prop="note" align="left" header-align="center" sortable />
      <el-table-column label="Thời gian chuyển" prop="created_at" align="center" sortable>
        <template slot-scope="{row}">
          <div>{{ row.created_at ? formatTime(row.created_at) : 'Không biết' }}</div>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      v-show="pagination.total > 0"
      :page-sizes="[10, 20, 30, 50]"
      :page-size="+pagination.per_page"
      layout="total, sizes, prev, pager, next, jumper"
      :total="pagination.total"
      style="margin-top: 10px"
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
    />
  </div>
</template>

<script>
import moment from 'moment';
import permission from '@/directive/permission';
import TransferApi from '@/api/prod/transfer.api';

export default {
  directives: { permission },
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
        to: '',
        bankId: ''
      },
      formValidateResult: {
        from: false,
        to: false,
        bankId: true
      },
      sum: -1,
      pagination: {
        data: [],
        total: 0,
        current_page: 1,
        per_page: 10,
        last_page: 0
      },
      loading: false,
      submitting: false,
      banks: { '': 'Tất cả', 0: 'TeaBank' },
      id: this.$route.params.id || 0,
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
      }
    };
  },
  computed: {
    formInvalid() {
      return (Object.values(this.formValidateResult).some(t => t === false));
    }
  },
  created() {
    this.getBanks();
  },
  methods: {
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
    async reload() {
      this.loading = true;
      try {
        const result = await this.$store.dispatch(`user/getBankTransactions`,
          { ...this.form, ...this.pagination });

        if (result.sum && result.transactions) {
          this.sum = result.sum.reduce((acc, v) => {
            return acc + +v.amount;
          }, 0);
          this.pagination = result.transactions;
        } else {
          this.pagination = result;
        }
        this.isLoaded = true;

        this.$emit('reload-completed');
      } catch (err) {
        this.$notify.error(err instanceof Error ? err.message : 'Có lỗi xảy ra');
      } finally {
        this.loading = false;
      }
    },
    validated(name, valid) {
      this.formValidateResult[name] = valid !== false;
    },
    handleFilter() {
      this.$refs.filter.validate(valid => {
        if (valid && this.filter.keyword) {
          this.pagination.current_page = 1;
          this.reload();
        }
        return false;
      });
    },
    handleSizeChange(val) {
      this.pagination.per_page = val;
      this.reload();
    },
    handleCurrentChange(val) {
      this.pagination.current_page = val;
      this.reload();
    },
    handleSortChange(column) {
      if (column.order) {
        this.sorts = [[column.prop, column.order.startsWith('asc') ? 'asc' : 'desc']];
      } else {
        this.sorts = [];
      }

      this.reload();
    },
    formatTime(time) {
      return moment(time).format('DD/MM/YYYY, HH:mm:SS');
    }
  }
};
</script>

<style scoped>
.chart-wrapper {
  background: #fff;
  padding: 0 0;
  margin-bottom: 32px;
}
</style>
