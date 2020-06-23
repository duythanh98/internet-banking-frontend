<template>
  <el-row type="flex" class="panel-group" justify="center">
    <el-col :xs="24" :sm="24" :lg="12" :md="12" class="card-panel-col">
      <div class="card-panel">
        <div class="card-panel-icon-wrapper icon-people">
          <svg-icon icon-class="peoples" class-name="card-panel-icon" />
        </div>
        <div class="card-panel-description">
          <div class="card-panel-text">
            {{ $store.state.user.info.name || 'Khách hàng' }}
          </div>
          <el-row class="panel-group">
            <el-col :xs="12" :sm="12" :lg="12" :md="12" class="card-panel-col">
              <div class="card-panel-account">
                Tài khoản
              </div>
            </el-col>
            <el-col :xs="12" :sm="12" :lg="12" :md="12" class="card-panel-col">
              <div class="card-panel-account">
                {{ $store.state.user.accountInfo.account_number }}
              </div>
            </el-col>

            <el-col :xs="12" :sm="12" :lg="12" :md="12" class="card-panel-col">
              <div class="card-panel-balance">
                Số dư
              </div>
            </el-col>
            <el-col :xs="12" :sm="12" :lg="12" :md="12" class="card-panel-col">
              <div class="card-panel-balance">
                {{ $store.state.user.accountInfo.balance | toThousandFilter }}đ
              </div>
            </el-col>
          </el-row>
        </div>
      </div>
    </el-col>
  </el-row>
</template>
<script>
export default {

};
</script>
<style lang="scss" scoped>
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
    }

    .icon-people {
      color: #40c9c6;
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
      float: right;
      font-weight: bold;
      margin: 26px;
      margin-left: 0px;

      .card-panel-text {
        line-height: 18px;
        color: black;
        font-size: 18px;
        margin-bottom: 12px;
        text-align: right;
      }

      .card-panel-balance {
        font-size: 16px;
        margin-bottom: 10px;
      }

      .card-panel-account {
        font-size: 16px;
        margin-bottom: 10px;
      }
    }
  }

.panel-group .card-panel-col:nth-child(2n+1){
  text-align: left;
}

.panel-group .card-panel-col:nth-child(2n) {
  text-align: right;
}
</style>
