<!--
 * @Author: 8023wdlove 1096186073@qq.com
 * @Date: 2025-12-20 15:33:43
 * @LastEditors: 8023wdlove 1096186073@qq.com
 * @LastEditTime: 2025-12-22 13:53:02
 * @FilePath: \super_map\src\App.vue
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
-->
<template>
  <div id="app">
    <CimScence />
  </div>
</template>

<script>
import CimScence from '@/components/CimScence2'

export default {
  name: 'App',
  components: {
    CimScence
  }
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
