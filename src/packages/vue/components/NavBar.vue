<template>
  <ul :id="id" :class="`${position} ${$attrs.class || ''}`">
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