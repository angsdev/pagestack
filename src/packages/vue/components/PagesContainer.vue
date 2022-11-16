<template>
  <article :id="id" :class="$attrs.class">
    <slot/>
  </article>
</template>

<script>
  export default {
    name: 'PagesContainer',
    props: {
      id: {
        type: String,
        required: false,
        default: 'ps-pages'
      }
    }
  }
</script>

<style lang="scss">

  html,
  body {
    margin: 0;
    padding: 0;
    overscroll-behavior-y: contain;
    -webkit-tap-highlight-color: transparent;
  }
  #pages {
    overflow: hidden;
    -ms-touch-action: none;  /* Touch detection for Windows 8 */
        touch-action: none;   /* IE 11 on Windows Phone 8.1*/

    .ps-page {
      position: absolute;
      width: 100%;
      height: 100%;
      backface-visibility: hidden;
      -webkit-transition:all 1s cubic-bezier(.55,.085,0,.99);
          -moz-transition:all 1s cubic-bezier(.55,.085,0,.99);
            -o-transition:all 1s cubic-bezier(.55,.085,0,.99);
              transition:all 1s cubic-bezier(.55,.085,0,.99);

      &.scrolled-left {
        -webkit-transform: translate3d(-100%, 0, 0);
            -moz-transform: translate3d(-100%, 0, 0);
            -ms-transform: translate3d(-100%, 0, 0);
                transform: translate3d(-100%, 0, 0);
      }
      &.scrolled-up {
        -webkit-transform: translate3d(0, -100%, 0);
          -moz-transform: translate3d(0, -100%, 0);
            -ms-transform: translate3d(0, -100%, 0);
                transform: translate3d(0, -100%, 0);
      }
      &.scrolled-right {
        -webkit-transform: translate3d(100%, 0, 0);
          -moz-transform: translate3d(100%, 0, 0);
            -ms-transform: translate3d(100%, 0, 0);
                transform: translate3d(100%, 0, 0);
      }
      &.scrolled-down {
        -webkit-transform: translate3d(0, 100%, 0);
          -moz-transform: translate3d(0, 100%, 0);
            -ms-transform: translate3d(0, 100%, 0);
                transform: translate3d(0, 100%, 0);
      }
      &.ps-scrollable {
        height: 100%;
        overflow-y: scroll;
      }
      &.ps-table {
        display: table;

        /*
        Enables vertical centering by wrapping the content and the use of table and table-cell
        */
        .ps-tableCell {
          display: table-cell;
          width: 100%;
          height: 100%;
          vertical-align: middle;
        }
      }
    }
  }
  
</style>