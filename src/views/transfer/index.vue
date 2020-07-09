<template>
  <div class="app-container">
    <el-tabs v-model="activeName" v-loading="loading">
      <el-tab-pane v-if="tabs.internal" key="internal" label="Chuyển tiền nội bộ" name="internal">
        <internal :fee="fee" @reset="resetTab" />
      </el-tab-pane>
      <el-tab-pane v-if="tabs.external" key="external" label="Chuyển tiền liên ngân hàng" name="external">
        <external :fee="fee" @reset="resetTab" />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>
<script>
import internal from './components/internal/index';
import external from './components/external/index';

import TransferApi from '@/api/prod/transfer.api';

export default {
  components: {
    internal,
    external
  },
  data() {
    return {
      activeName: 'internal',
      fee: {

      },
      loading: true,
      tabs: {
        internal: true,
        external: true
      }
    };
  },
  async created() {
    const api = new TransferApi();
    api.setToken(this.$store.state.user.token);

    const res = await api.getFee();

    const result = res.result();
    this.fee = result;
    this.loading = false;
  },
  methods: {
    resetTab() {
      this.tabs[this.activeName] = false;
      this.$nextTick(() => {
        this.tabs[this.activeName] = true;
      });
    }
  }

};
</script>
