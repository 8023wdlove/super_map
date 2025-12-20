<!--
 * @Author: 8023wdlove 1096186073@qq.com
 * @Date: 2025-12-20 16:50:38
 * @LastEditors: 8023wdlove 1096186073@qq.com
 * @LastEditTime: 2025-12-20 17:21:47
 * @FilePath: \super_map\src\components\CimScence.vue
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
-->
<template>
  <div class="cim-wrapper">
    <div ref="viewerContainer" class="viewer"></div>
  </div>
</template>

<script>
export default {
  name: 'CimScene',

  data() {
    return {
      viewer: null
    }
  },

  mounted() {
    this.initViewer()
    this.loadScene()
  },

  beforeDestroy() {
    if (this.viewer) {
      this.viewer.destroy()
      this.viewer = null
    }
  },

  methods: {
    // 初始化 Viewer
    initViewer() {
      this.viewer = new window.Cesium.Viewer(this.$refs.viewerContainer, {
        animation: false,
        timeline: false,
        baseLayerPicker: false,
        geocoder: false,
        homeButton: false,
        sceneModePicker: false,
        navigationHelpButton: false,
        fullscreenButton: false
      })

      // 防止模型被地形遮挡
      this.viewer.scene.globe.depthTestAgainstTerrain = true
    },

    // 加载超图场景
    loadScene() {
  const sceneUrl =
    'http://61.156.58.251:8195/portalproxy/040a2c991be35feb/iserver/services/3D-local3DCache-zhigu/rest/realspace'

  // ✅ 正确写法
  this.viewer.scene.open(sceneUrl)

  // 监听图层加载
  this.viewer.scene.layers.layerAddedEvent.addEventListener(layer => {
    console.log('✅ 场景图层加载完成:', layer.name)
  })
}

  }
}
</script>

<style scoped>
.cim-wrapper {
  width: 100%;
  height: 100%;
}

.viewer {
  width: 100%;
  height: 100vh;
}
</style>
