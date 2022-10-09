<template>
  <article :id="id" :class="[ 'ps-page', $attrs.class, { 'ps-scrollable': scrollable } ]">
    <slot/>
  </article>
</template>

<script>
  export default {
    name: 'SinglePage',
    props: {
      id: {
        type: String,
        required: true
      },
      scrollable: {
        type: Boolean,
        default: false
      }
    }
  }
</script>