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