<template>
  <li><a :href="anchor"><span></span></a></li>
</template>

<script>
  export default {
    name: 'NavBarItem',
    props: {
      anchor: {
        type: String,
        required: false,
        default: '#'
      }
    }
  }
</script>