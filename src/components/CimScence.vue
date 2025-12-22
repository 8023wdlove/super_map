<!--
 * @Author: 8023wdlove 1096186073@qq.com
 * @Date: 2025-12-20 16:50:38
 * @LastEditors: 8023wdlove 1096186073@qq.com
 * @LastEditTime: 2025-12-22 09:11:21
 * @FilePath: \super_map\src\components\CimScence.vue
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
-->
<template>
  <div class="cim-wrapper" @click="printCamareData">
    <div ref="viewerContainer" class="viewer"></div>
  </div>
</template>

<script>
var Cesium = window.Cesium
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
    this.bindPickEvent()
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
loadScene() {
  const sceneUrl =
    'http://61.156.58.251:8195/portalproxy/040a2c991be35feb/iserver/services/3D-local3DCache-zhigu/rest/realspace'

  // this.viewer.scene.open(sceneUrl).then(layers => {
  //   console.log(layers, 'layers')
  //    const layer = layers[0]
  //     this.viewer.scene.camera.setView({
  //       destination: Cesium.Cartesian3.fromDegrees(
  //         layer.lon,
  //         layer.lat,
  //         600
  //       ),
  //       orientation: {
  //         heading: Cesium.Math.toRadians(0),
  //         pitch: Cesium.Math.toRadians(-40),
  //         roll: 0
  //       }
  //     })
  // })
//   this.viewer.scene.open(sceneUrl).then(layers2 => {
//   // const layer = layers[0]

//   // const sphere =
//   //   layer.boundingSphere ||
//   //   layer._boundingSphere ||
//   //   layer._rootBoundingSphere

//   // if (!sphere) {
//   //   console.warn('❌ 未获取到包围球')
//   //   return
//   // }

//   // this.viewer.scene.camera.flyToBoundingSphere(
//   //   sphere,
//   //   {
//   //     duration: 1.5,
//   //     offset: new Cesium.HeadingPitchRange(
//   //       Cesium.Math.toRadians(0),     // 朝向
//   //       Cesium.Math.toRadians(-45),   // 俯视角
//   //       sphere.radius * 2.5           // 距离
//   //     )
//   //   }
//   // )

// const timer = setInterval(() => {
//   const layers = layers2
//   if (layers && layers.length > 0) {
//     // 等一帧，避免被内部定位覆盖
//     setTimeout(() => {
//       this.viewer.scene.camera.setView({
//         destination: Cesium.Cartesian3.fromDegrees(
//           120.69907041390569,
//           30.226167163989896,
//           188.72458855776162
//         ),
//         orientation: {
//           heading: Cesium.Math.toRadians(20.109635792329428),
//           pitch: Cesium.Math.toRadians(-34.44299809647591),
//           roll: 0
//         }
//       })
//     }, 100)

//     clearInterval(timer)
//   }
// }, 300)

// })


  // // 等待 layers 和事件对象就绪
  // const timer = setInterval(() => {
  //   const layers = this.viewer.scene.layers

  //   if (layers && layers.layerAddedEvent) {
  //     console.log('✅ layers 就绪，开始监听')

  //     layers.layerAddedEvent.addEventListener(layer => {
  //       console.log('✅ 场景图层加载完成:', layer.name)
  //     })

  //     clearInterval(timer)
  //   }
  // }, 200)
  /**
   * heading
: 
20.109777932369102
height
: 
244.1596275128751
lat
: 
30.225959572531785
lng
: 
120.6993527020927
pitch
: 
-34.44573405504975
roll
: 
359.9999999999987
   */
//   this.viewer.scene.open(sceneUrl, undefined, {
//   autoSetView: false
// }).then(() => {
//   this.viewer.scene.camera.setView({
//     destination: Cesium.Cartesian3.fromDegrees(
//       120.69907041390569,
//       30.226167163989896,
//       188.72458855776162
//     ),
//     orientation: {
//       heading: Cesium.Math.toRadians(20.109635792329428),
//       pitch: Cesium.Math.toRadians(-34.44299809647591),
//       roll: 0
//     }
//   })
// })
this.viewer.scene.open(sceneUrl, undefined, {
  autoSetView: false
}).then(() => {
  this.viewer.scene.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(
      120.6993527020927,
      30.225959572531785,
      244.1596275128751
    ),
    orientation: {
      heading: Cesium.Math.toRadians(20.109777932369102),
      pitch: Cesium.Math.toRadians(-34.44573405504975),
      roll: 0
    },
    duration: 1.5
  })
})


},
printCamareData() {
  const camera = this.viewer.scene.camera
  const pos = Cesium.Cartographic.fromCartesian(camera.position)

  console.log({
    lng: Cesium.Math.toDegrees(pos.longitude),
    lat: Cesium.Math.toDegrees(pos.latitude),
    height: pos.height,
    heading: Cesium.Math.toDegrees(camera.heading),
    pitch: Cesium.Math.toDegrees(camera.pitch),
    roll: Cesium.Math.toDegrees(camera.roll)
  })
},
bindPickEvent() {
  const viewer = this.viewer
  const handler = new Cesium.ScreenSpaceEventHandler(
    viewer.scene.canvas
  )
handler.setInputAction(movement => {
  const picked = this.viewer.scene.pick(movement.position)
  console.log('picked:', picked)
}, Cesium.ScreenSpaceEventType.LEFT_CLICK)

  // handler.setInputAction(movement => {
  //   const picked = viewer.scene.pick(movement.position)

  //   if (!Cesium.defined(picked)) {
  //     console.log('未拾取到对象')
  //     return
  //   }

  //   // 判断是不是 S3M 建筑
  //   if (picked instanceof Cesium.Cesium3DTileFeature) {
  //     console.log('✅ 拾取到 S3M 建筑', picked)

  //     // 建筑属性
  //     const properties = picked.getPropertyNames().reduce(
  //       (obj, key) => {
  //         obj[key] = picked.getProperty(key)
  //         return obj
  //       },
  //       {}
  //     )

  //     console.table(properties)

  //     // 高亮
  //     this.highlightFeature(picked)
  //   }
  // }, Cesium.ScreenSpaceEventType.LEFT_CLICK)
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
