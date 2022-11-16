<template>
  <ul :id="id" :class="[ position, $attrs.class ]">
    <slot/>
  </ul>
</template>

<script>
  export default {
    name: 'NavBar',
    props: {
      id: {
        type: String,
        required: false,
        default: 'ps-nav'
      },
      position: {
        type: String,
        required: false,
        default: 'right'
      }
    }
  }
</script>

<style lang="scss">


#ps-nav {
  position: fixed;
  height: -webkit-fit-content;
  height:    -moz-fit-content;
  height:         fit-content;
  width: -webkit-fit-content;
  width:    -moz-fit-content;
  width:         fit-content;
  padding-left: 0;
  opacity: 1;
  z-index: 1000;

  &.left,
  &.right {
    top: 0;
    bottom: 0;
    margin-top: auto;
    margin-bottom: auto;
  }
  &.top,
  &.bottom {
    left: 0;
    right: 0;
    margin-left: auto;
    margin-right: auto;
  }
  &.left {
    left: 17px;
  }
  &.top {
    top: 17px;

    li,
    [anchor] {
      display: inline-block;
    }
  }
  &.right {
    right: 17px;
  }
  &.bottom {
    bottom: 17px;

    li,
    [anchor] {
      display: inline-block;
    }
  }
  li,
  [anchor] {
    position: relative;
    display: block;
    width: 14px;
    height: 13px;
    margin: 7px;
    z-index: 1;

    &:hover > .ps-tooltip {
      visibility: visible;
      opacity: 1;
      transition: visibility 0s, opacity .3s ease;
    }
    a {
      position: relative;
      display: block;
      width: 100%;
      height: 100%;
      text-decoration: none;
      cursor: pointer;
      z-index: 1;

      &.active span {
        background:#333;
      }
      span {
        position: absolute;
        width: 8px;
        height: 8px;
        background: transparent;
        top: 2px;
        left: 2px;
        border: 1px solid #000;
        border-radius: 50%;
        z-index: 1;
      }
    }
    .ps-tooltip {
      position: absolute;
      display: block;
      max-width: 220px;
      color: #fff;
      top: -2px;
      font-size: 14px;
      font-family: arial,helvetica, sans-serif;
      white-space: nowrap;
      visibility: hidden;
      opacity: 0;
      transition: visibility .3s, opacity .3s ease;

      &.right {
        right: 20px;
      }
      &.left {
        left: 20px;
      }
    }
  }
}

</style>