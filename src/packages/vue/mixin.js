export default {
  data(){
    return {}
  },
  methods: {

  },
  mounted(){

    const pageStackOptions = this.$pagestack.options;
    this.$pagestack.defineConfig(pageStackOptions);
    this.$pagestack.init();
  }
}