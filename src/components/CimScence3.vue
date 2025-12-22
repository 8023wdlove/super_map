<template>
  <div class="cim-root">
    <div ref="viewerContainer" class="viewer"></div>

    <!-- 简单操作面板 -->
    <div class="panel">
      <div
        v-for="b in buildings"
        :key="b.id"
        class="btn"
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
console.log('Cesium in CimScence3:', Cesium)
export default {
  name: 'CimSceneClipPlane',

  data() {
    return {
      viewer: null,
      clipper: null,
      sceneLayerName: '',

      // 示例楼宇数据（你可替换）
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
    console.log(Cesium,888888888888)
    this.initViewer()
  },

  methods: {
    /* =============================
       初始化 Viewer + 场景
       ============================= */
    initViewer() {
      this.viewer = new Cesium.Viewer(this.$refs.viewerContainer, {
        infoBox: false,
        selectionIndicator: false
      })

      const url =
        'http://61.156.58.251:8195/portalproxy/040a2c991be35feb/iserver/services/3D-local3DCache-zhigu/rest/realspace'

      this.viewer.scene.open(url).then(layers => {
        const layer = layers[0]
        this.sceneLayerName = layer.name
        this.initClipper()
      })
    },

    /* =============================
       初始化 TSClipPlane
       ============================= */
    initClipper() {
      this.clipper = new Cesium.TSClipPlane(this.viewer, {
        ClipPlaneShow: false,
        clipPlaneScale: 1
      })
    },

    /* =============================
       楼宇聚焦裁切（核心）
       ============================= */
    focusBuilding(building) {
      console.log('📍:', this.clipper)
      if (!this.clipper) return

      const { polygon, minHeight = 0, maxHeight = 100 } = building
      console.log('🏢 聚焦裁切楼宇:', building.name, minHeight, maxHeight)
      const bbox = this.calcBBox(polygon)

      const centerLng = bbox.centerLng
      const centerLat = bbox.centerLat

      // 1️⃣ 清除旧裁切
      this.clipper.clear()

      // 2️⃣ 四个侧面裁剪
      const planes = [
        { lng: bbox.minLng, lat: centerLat, alt: 0 },
        { lng: bbox.maxLng, lat: centerLat, alt: 0 },
        { lng: centerLng, lat: bbox.minLat, alt: 0 },
        { lng: centerLng, lat: bbox.maxLat, alt: 0 }
      ]

      planes.forEach(p => {
        this.clipper.setClipPlane(p, [this.sceneLayerName])
      })

      // 3️⃣ 顶部裁剪（高度）
      this.clipper.setClipPlane(
        { lng: centerLng, lat: centerLat, alt: maxHeight },
        [this.sceneLayerName]
      )

      // 4️⃣ 相机飞行聚焦
      this.viewer.scene.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(
          centerLng,
          centerLat,
          maxHeight * 2.5
        ),
        orientation: {
          heading: Cesium.Math.toRadians(0),
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
      if (this.clipper) {
        this.clipper.clear()
      }
    },

    /* =============================
       polygon → bbox
       ============================= */
    calcBBox(polygon) {
      let minLng = Infinity
      let maxLng = -Infinity
      let minLat = Infinity
      let maxLat = -Infinity

      polygon.forEach(([lng, lat]) => {
        minLng = Math.min(minLng, lng)
        maxLng = Math.max(maxLng, lng)
        minLat = Math.min(minLat, lat)
        maxLat = Math.max(maxLat, lat)
      })

      return {
        minLng,
        maxLng,
        minLat,
        maxLat,
        centerLng: (minLng + maxLng) / 2,
        centerLat: (minLat + maxLat) / 2
      }
    }
  }
}
</script>

<style scoped>
.cim-root {
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
  top: 12px;
  left: 12px;
  background: rgba(0,0,0,0.6);
  padding: 10px;
}
.btn {
  cursor: pointer;
  color: #fff;
  margin-bottom: 6px;
}
</style>
