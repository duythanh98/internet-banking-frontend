<template>
  <div>
    <el-row :gutter="40" class="panel-group">
      <el-col :xs="12" :sm="16" :lg="16" class="card-panel-col">
        <div class="card-panel" @click="$router.push({name: 'Account'})">
          <div class="card-panel-icon-wrapper icon-people">
            <svg-icon icon-class="peoples" class-name="card-panel-icon" />
          </div>
          <div
            class="card-panel-description"
            style="flex-direction: column; justify-content: center; align-items: flex-start"
          >
            <div class="card-panel-text">
              <div><span style="display: inline-block; width: 120px">Tài khoản:</span>&nbsp;<span>{{ account.account_number }}</span></div>
              <div style="margin-top: 10px"><span style="display: inline-block; width: 120px">Số dư:</span>&nbsp;<span>{{ account.balance | toThousandFilter }}đ</span></div>
            </div>
          </div>
        </div>
      </el-col>
      <el-col :xs="12" :sm="8" :lg="8" class="card-panel-col">
        <div class="card-panel" @click="$router.push({name: 'Transfer'})">
          <div class="card-panel-icon-wrapper icon-lock">
            <svg-icon icon-class="lock" class-name="card-panel-icon" />
          </div>
          <div class="card-panel-description">
            <div class="card-panel-text">
              Chuyển khoản
            </div>
          </div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="40" class="panel-group">
      <el-col :xs="12" :sm="8" :lg="8" class="card-panel-col">
        <div class="card-panel" @click="$router.push({name: 'ReminderList'})">
          <div class="card-panel-icon-wrapper icon-payment">
            <svg-icon icon-class="payment" class-name="card-panel-icon" />
          </div>
          <div class="card-panel-description">
            <div class="card-panel-text">
              Nhắc nợ
            </div>
          </div>
        </div>
      </el-col>
      <el-col :xs="12" :sm="8" :lg="8" class="card-panel-col">
        <div class="card-panel" @click="$router.push({name: 'TransactionList'})">
          <div class="card-panel-icon-wrapper icon-transaction">
            <svg-icon icon-class="transaction" class-name="card-panel-icon" />
          </div>
          <div class="card-panel-description">
            <div class="card-panel-text">
              Lịch sử giao dịch
            </div>
          </div>
        </div>
      </el-col>
      <el-col :xs="12" :sm="8" :lg="8" class="card-panel-col">
        <div class="card-panel" @click="$router.push({name: 'ContactList'})">
          <div class="card-panel-icon-wrapper icon-contact">
            <svg-icon icon-class="contact" class-name="card-panel-icon" />
          </div>
          <div class="card-panel-description">
            <div class="card-panel-text">
              Liên hệ
            </div>
          </div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script>
export default {
  data() {
    return {
      account: {
        account_number: '',
        balance: 0
      }
    };
  },
  created() {
    this.reload();
  },
  methods: {
    handleSetLineChartData(type) {
      this.$emit('handleSetLineChartData', type);
    },
    async reload() {
      try {
        const res = await this.$store.dispatch('user/getMyAccount');
        this.account = res;
      } catch (err) {
        this.$notify.error({ message: err instanceof Error ? err.message : 'Có lỗi xảy ra', position: 'bottom-right' });
      }
    }
  }
};
</script>

<style lang="scss" scoped>
.panel-group {

  .card-panel-col {
    margin-bottom: 32px;
  }

  .card-panel {
    height: 108px;
    cursor: pointer;
    font-size: 12px;
    position: relative;
    overflow: hidden;
    color: #666;
    background: #fff;
    box-shadow: 4px 4px 40px rgba(0, 0, 0, .05);
    border-color: rgba(0, 0, 0, .05);

    &:hover {
      .card-panel-icon-wrapper {
        color: #fff;
      }

      .icon-people {
        background: #40c9c6;
      }

      .icon-lock {
        background: #957dad;
      }

      .icon-payment {
        background: #36a3f7;
      }

      .icon-transaction {
        background: #f4516c;
      }

      .icon-contact {
        background: #34bfa3
      }
    }

    .icon-people {
      color: #40c9c6;
    }

    .icon-lock {
      color: #957dad;
    }

    .icon-payment {
      color: #36a3f7;
    }

    .icon-transaction {
      color: #f4516c;
    }

    .icon-contact {
      color: #34bfa3
    }

    .card-panel-icon-wrapper {
      float: left;
      margin: 14px 0 0 14px;
      padding: 16px;
      transition: all 0.38s ease-out;
      border-radius: 6px;
    }

    .card-panel-icon {
      float: left;
      font-size: 48px;
    }

    .card-panel-description {
      display: flex;
      align-items: center;
      height: 100%;
      font-weight: bold;
      margin: auto 26px auto 120px;

      .card-panel-text {
        color: rgba(0, 0, 0, 0.45);
        font-size: 20px;
      }

      .card-panel-num {
        font-size: 20px;
      }
    }
  }
}

@media (max-width:550px) {
  .card-panel-description {
    display: none;
  }

  .card-panel-icon-wrapper {
    float: none !important;
    width: 100%;
    height: 100%;
    margin: 0 !important;

    .svg-icon {
      display: block;
      margin: 14px auto !important;
      float: none !important;
    }
  }
}
</style>
