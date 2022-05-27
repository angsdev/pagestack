<template>
  <article :id="id" class="ps-page" :class="[{ 'ps-scrollable': scrollable }, $attrs.class]">
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