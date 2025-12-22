/*
 * @Author: 8023wdlove 1096186073@qq.com
 * @Date: 2025-12-20 15:33:43
 * @LastEditors: 8023wdlove 1096186073@qq.com
 * @LastEditTime: 2025-12-22 13:21:12
 * @FilePath: \super_map\src\main.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import Vue from 'vue'
import App from './App.vue'
import VueiClient3D from '@supermap/vue-iclient3d-webgl'
import '@supermap/vue-iclient3d-webgl/dist/styles/vue-iclient3d-webgl.min.css'

Vue.config.productionTip = false
Vue.use(VueiClient3D)
new Vue({
  render: h => h(App),
}).$mount('#app')
