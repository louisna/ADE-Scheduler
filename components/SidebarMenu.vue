<template>
  <div>
    <!-- Sidebar -->
    <nav
      id="sidebar"
      class="col-xl-2 col-md-3 d-md-block bg-light sidebar collapse"
    >
      <div class="sidebar-sticky p-2 m-3">
        <slot />
      </div>
    </nav>

    <!-- Toggle button  -->
    <button v-if="!hideaction" class="btn btn-dark rounded-pill btn-nav" style="z-index: 1050;" @click="toggle">
      <i v-if="show" style="font-size: 32px;" :class="iconclassonshow" />
      <i v-else style="font-size: 32px;" :class="iconclassonhide" />
    </button>
  </div>
</template>

<script>
import { Collapse } from 'bootstrap';

export default {
  props: {
    iconclassonshow: {
      type: String,
      default: 'bi bi-chevron-up'
    },
    iconclassonhide: {
      type: String,
      default: 'bi bi-chevron-down'
    },
    hideaction: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      show: false,
    };
  },
  mounted() {
    this.nav = new Collapse(document.getElementById('sidebar'), {
      toggle: false,
    });
  },
  methods: {
    toggle() {
      this.show = !this.show;
      if (this.show) {
        this.nav.show();
      } else {
        this.nav.hide();
      }
    },
    open() {
      if (!this.show) {
        this.show = true;
        this.nav.show();
      }
    },
    close() {
      if (this.show) {
        this.show = false;
        this.nav.hide();
      }
    },
  },
};
</script>

<style lang="scss" scoped>
@import '../static/css/bootstrap.scss';
@import 'bootstrap-icons/font/bootstrap-icons.css';

.sidebar {
  position: fixed;
  top: 0;
  bottom: 0;
  left: 0;
  z-index: 4; /* Behind the navbar */
  padding: 56px 0 0; /* Height of navbar */
  box-shadow: inset -1px 0 0 rgba(0, 0, 0, 0.1);
}

.sidebar-sticky {
  position: relative;
  top: 0;
  height: calc(100vh - 101px);
  overflow-x: hidden;
  overflow-y: auto;
}

@media (max-width: 767.98px) {
  .sidebar {
    width: 100%;
  }
}

@supports ((position: -webkit-sticky) or (position: sticky)) {
  .sidebar-sticky {
    position: -webkit-sticky;
    position: sticky;
  }
}

.btn-nav {
  position: fixed;
  z-index: 5;
  bottom: 20px;
  right: 20px;
  width: 60px;
  height: 60px;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.4);
}
@media (min-width: 767.98px) {
  .btn-nav {
    display: none;
  }
}
</style>
