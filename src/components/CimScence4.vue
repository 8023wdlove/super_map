<template>
  <div class="root">
    <div ref="viewer" class="viewer"></div>

    <div class="panel">
      <div
        v-for="b in buildings"
        :key="b.id"
        class="item"
        @click="focusBuilding(b)"
      >
        {{ b.name }}
      </div>
      <button @click="clearClip">清除裁切</button>
    </div>
  </div>
</template>

<script>
  var Cesium = window.Cesium
  console.log('Cesium:', Cesium)
export default {
  name: 'CimSceneClip',

  data() {
    return {
      viewer: null,

      // 示例楼宇数据（你的真实数据结构）
       buildings: [
        {
          id: 'B1',
          name: '楼宇 1',
          polygon: [
            [120.7001329, 30.2289046],
            [120.7007521, 30.2284128],
            [120.7002550, 30.2279563],
            [120.6996385, 30.2284455]
          ],
          minHeight: 0,
          maxHeight: 120
        },
        {
          id: 'B2',
          name: '楼宇2',
          polygon: [
            [120.7014921, 30.2291193],
            [120.7008793, 30.2296114],
            [120.7013763, 30.2300786],
            [120.7019896, 30.2295902]
          ],
          minHeight: 0,
          maxHeight: 120
        }
      ]
    }
  },

  mounted() {
    this.initViewer()
  },

  methods: {
    /* =============================
       初始化 Viewer + 场景
       ============================= */
    initViewer() {
      this.viewer = new Cesium.Viewer(this.$refs.viewer, {
        infoBox: false,
        selectionIndicator: false
      })

      const url =
        'http://61.156.58.251:8195/portalproxy/040a2c991be35feb/iserver/services/3D-local3DCache-zhigu/rest/realspace'

      this.viewer.scene.open(url)
    },

    /* =============================
       楼宇聚焦裁切（核心）
       ============================= */
    focusBuilding(building) {
      const { polygon, minHeight = 50, maxHeight = 100 } = building
      console.log('🏢 聚焦裁切楼宇:', building.name, minHeight, maxHeight)
      // 1️⃣ polygon → 中心点
      const center = this.calcCenter(polygon)

      // 2️⃣ 建立本地 ENU 坐标系
      const origin = Cesium.Cartesian3.fromDegrees(
        center.lng,
        center.lat,
        minHeight
      )

      const transform = Cesium.Transforms.eastNorthUpToFixedFrame(origin)

      // 3️⃣ polygon → ENU bbox
      const enuBBox = this.calcEnuBBox(polygon, transform)

      // 4️⃣ 构造裁剪面
      const planes = [
        // 西
        new Cesium.ClippingPlane(
          new Cesium.Cartesian3(1, 0, 0),
          -enuBBox.minX
        ),
        // 东
        new Cesium.ClippingPlane(
          new Cesium.Cartesian3(-1, 0, 0),
          enuBBox.maxX
        ),
        // 南
        new Cesium.ClippingPlane(
          new Cesium.Cartesian3(0, 1, 0),
          -enuBBox.minY
        ),
        // 北
        new Cesium.ClippingPlane(
          new Cesium.Cartesian3(0, -1, 0),
          enuBBox.maxY
        ),
        // 顶
        new Cesium.ClippingPlane(
          new Cesium.Cartesian3(0, 0, -1),
          maxHeight - minHeight
        )
      ]
      console.log('planes:', planes)

      // 5️⃣ 应用 Scene 裁剪
      this.viewer.scene.clippingPlanes =
        new Cesium.ClippingPlaneCollection({
          planes,
          modelMatrix: transform,
          unionClippingRegions: true
        })

      // 6️⃣ 相机聚焦
      this.viewer.scene.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(
          center.lng,
          center.lat,
          maxHeight * 2.5
        ),
        orientation: {
          heading: 0,
          pitch: Cesium.Math.toRadians(-45),
          roll: 0
        },
        duration: 1.2
      })
    },

    /* =============================
       清除裁切
       ============================= */
    clearClip() {
      this.viewer.scene.clippingPlanes = null
    },

    /* =============================
       polygon → 中心点
       ============================= */
    calcCenter(polygon) {
      let lng = 0
      let lat = 0
      polygon.forEach(p => {
        lng += p[0]
        lat += p[1]
      })
      return {
        lng: lng / polygon.length,
        lat: lat / polygon.length
      }
    },

    /* =============================
       polygon → ENU bbox
       ============================= */
    calcEnuBBox(polygon, transform) {
      let minX = Infinity
      let maxX = -Infinity
      let minY = Infinity
      let maxY = -Infinity

      const inv = Cesium.Matrix4.inverse(
        transform,
        new Cesium.Matrix4()
      )

      polygon.forEach(([lng, lat]) => {
        const world = Cesium.Cartesian3.fromDegrees(lng, lat, 0)
        const local = Cesium.Matrix4.multiplyByPoint(
          inv,
          world,
          new Cesium.Cartesian3()
        )

        minX = Math.min(minX, local.x)
        maxX = Math.max(maxX, local.x)
        minY = Math.min(minY, local.y)
        maxY = Math.max(maxY, local.y)
      })

      return { minX, maxX, minY, maxY }
    }
  }
}
</script>

<style scoped>
.root {
  position: relative;
  width: 100%;
  height: 100%;
}
.viewer {
  width: 100%;
  height: 100%;
}
.panel {
  position: absolute;
  top: 10px;
  left: 10px;
  background: rgba(0,0,0,0.6);
  padding: 10px;
}
.item {
  color: #fff;
  cursor: pointer;
  margin-bottom: 6px;
}
</style>
