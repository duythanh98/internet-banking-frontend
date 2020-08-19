<template>
  <div v-loading="loading" class="app-container">
    <div class="filter-container">
      <el-form ref="form" :model="form" :rules="rules" label-position="top" @submit.native.prevent @validate="validated">
        <el-row :gutter="10">
          <el-col :md="8" :xs="8">
            <el-form-item label="Từ ngày" prop="from">
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
          <el-col :md="8" :xs="8">
            <el-form-item label="Đến trước ngày" prop="to">
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
          <el-col :md="8" :xs="8">
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

          <el-col :md="8" :xs="8">
            <el-form-item label="Loại giao dịch" prop="type">
              <el-select v-model="form.type" style="width: 100%" placeholder="Chọn loại giao dịch">
                <el-option
                  v-for="(title, value) in types"
                  :key="value"
                  :label="title"
                  :value="value"
                />
              </el-select>
            </el-form-item>
          </el-col>

          <el-col :md="8" :xs="8" style="padding-bottom: 22px">
            <el-button type="primary" style="width: 100%" :disabled="formInvalid || submitting" icon="el-icon-folder-checked" @click="load">Xem danh sách</el-button>
          </el-col>
        </el-row>
      </el-form>
    </div>

    <template v-if="totalMoney >= 0">
      <p><strong>Tổng số tiền đã giao dịch: </strong>{{ totalMoney | toThousandFilter }}đ</p>
      <p style="margin-left: 30px">+ <strong>Chuyển tiền:</strong> {{ sum.transfer | toThousandFilter }}đ</p>
      <p style="margin-left: 30px">+ <strong>Nhận tiền:</strong> {{ sum.deposit | toThousandFilter }}đ</p>
    </template>

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
      <el-table-column label="Tên người chuyển" prop="from_name" align="left" header-align="center">
        <template slot-scope="{row}">
          <div>{{ row.sender ? row.sender.user.name : row.from_name }}</div>
        </template>
      </el-table-column>
      <el-table-column label="Ngân hàng chuyển" prop="from_bank_name" align="center" header-align="center" />
      <el-table-column label="STK người nhận" prop="to_account_number" align="right" header-align="center" />
      <el-table-column label="Tên người nhận" prop="receiver.user.name" align="left" header-align="center">
        <template slot-scope="{row}">
          <div>{{ row.receiver ? row.receiver.user.name : row.to_name }}</div>
        </template>
      </el-table-column>
      <el-table-column label="Ngân hàng nhận" prop="to_bank_name" align="center" header-align="center" />
      <el-table-column label="Loại giao dịch" prop="type" align="center" header-align="center">
        <template slot-scope="{row}">
          <el-tag v-if="row.type === 1" type="primary" style="padding: 0 0">Chuyển tiền</el-tag>
          <el-tag v-else-if="row.type === 3" type="warning" style="padding: 0 0">Nhận tiền</el-tag>
          <el-tag v-else type="info" style="padding: 0 0">Không biết</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="Số tiền chuyển" prop="amount" align="right" header-align="center" sortable>
        <template slot-scope="{row}">
          <div>{{ row.amount | toThousandFilter }}đ</div>
        </template>
      </el-table-column>
      <el-table-column label="Nội dung" prop="note" align="left" header-align="center" />
      <el-table-column label="Thời gian" prop="created_at" align="center" sortable>
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
        bankId: '',
        type: ''
      },
      formValidateResult: {
        from: false,
        to: false,
        bankId: true,
        type: true
      },
      sum: {
        deposit: -1,
        transfer: -1
      },
      pagination: {
        data: [],
        total: 0,
        current_page: 1,
        per_page: 10,
        last_page: 0
      },
      orderBy: 'desc',
      sortBy: 'created_at',
      loading: false,
      submitting: false,
      banks: { '': 'Tất cả' },
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
      },
      types: {
        '': 'Tất cả',
        'transfer': 'Chuyển tiền',
        'deposit': 'Nhận tiền'
      }
    };
  },
  computed: {
    formInvalid() {
      return (Object.values(this.formValidateResult).some(t => t === false));
    },
    totalMoney() {
      return this.sum.deposit + this.sum.transfer;
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
        const submit = {
          bankId: this.form.bankId,
          type: this.form.type,
          from: moment(this.form.from, 'YYYY-MM-DD').toISOString(),
          to: moment(this.form.to, 'YYYY-MM-DD').toISOString()
        };
        const result = await this.$store.dispatch(`user/getBankTransactions`,
          { ...submit, pagination: this.pagination, sortBy: this.sortBy, orderBy: this.orderBy });

        if (result.sum && result.transactions) {
          this.sum.deposit = result.sum.deposit.reduce((acc, v) => {
            return acc + +v.amount;
          }, 0);
          this.sum.transfer = result.sum.transfer.reduce((acc, v) => {
            return acc + +v.amount;
          }, 0);
          this.pagination = result.transactions;
        } else {
          this.pagination = result;
        }
        this.isLoaded = true;

        this.$emit('reload-completed');
      } catch (err) {
        this.$notify.error({ message: err instanceof Error ? err.message : 'Có lỗi xảy ra', position: 'bottom-right' });
      } finally {
        this.loading = false;
      }
    },
    load() {
      this.pagination.current_page = 1;
      this.pagination.total = 0;
      this.reload();
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
        this.sortBy = column.prop;
        this.orderBy = column.order.startsWith('asc') ? 'asc' : 'desc';

        this.reload();
      }
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
