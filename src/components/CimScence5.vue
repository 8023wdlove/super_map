<template>
  <div class="scene-wrapper">
    <sm-viewer
      ref="viewer"
      :scene-url="sceneUrl"
      @scene-loaded="onSceneLoaded"
    >
      <!-- Box 裁剪组件 -->
      <sm3d-clip-box
        ref="clipBox"
        :enabled="true"
      />
    </sm-viewer>
  </div>
</template>

<script>
export default {
  name: 'AutoClipBox',

  data() {
    return {
      sceneUrl: 'http://61.156.58.251:8195/portalproxy/040a2c991be35feb/iserver/services/3D-local3DCache-zhigu/rest/realspace',

      // 👇 模拟一个“楼宇”
      building: {
        // 一个简单矩形 polygon（lng, lat）
        polygon: [
          [120.7008, 30.2290],
          [120.7014, 30.2290],
          [120.7014, 30.2294],
          [120.7008, 30.2294]
        ],
        minHeight: 0,
        maxHeight: 70
      }
    }
  },
  mounted() {
    console.log('组件已挂载',  this.$refs.viewer, this.$refs.clipBox)
    },
  methods: {
    /* 场景加载完成 */
    onSceneLoaded(viewer) {
      this.viewer = viewer
      this.applyBoxClip(this.building)
    },

    /* =============================
       核心：Box 自动裁剪
       ============================= */
    applyBoxClip(building) {
      const box = this.$refs.clipBox
      console.log('📦 clipBox:', box)
      if (!box) {
        console.warn('❌ clipBox 未就绪')
        return
      }

      // 1️⃣ 计算 polygon 范围
      const lons = building.polygon.map(p => p[0])
      const lats = building.polygon.map(p => p[1])

      const minLon = Math.min(...lons)
      const maxLon = Math.max(...lons)
      const minLat = Math.min(...lats)
      const maxLat = Math.max(...lats)

      // 2️⃣ 计算中心点
      const centerLon = (minLon + maxLon) / 2
      const centerLat = (minLat + maxLat) / 2
      const centerHeight = (building.minHeight + building.maxHeight) / 2

      // 3️⃣ Box 尺寸（米）
      const width = this.lonToMeter(maxLon - minLon, centerLat)
      const depth = this.latToMeter(maxLat - minLat)
      const height = building.maxHeight - building.minHeight

      console.log('📦 Box 参数', {
        centerLon,
        centerLat,
        centerHeight,
        width,
        depth,
        height
      })

      // 4️⃣ 应用裁剪（重点）
      box.setState({
        position: {
          lng: centerLon,
          lat: centerLat,
          height: centerHeight
        },
        dimensions: {
          x: width,
          y: depth,
          z: height
        },
        clipMode: 'keep-inside' // 只保留 Box 内
      })
    },

    /* =============================
       工具函数
       ============================= */

    // 经度 → 米
    lonToMeter(deltaLon, lat) {
      return deltaLon * 111320 * Math.cos(lat * Math.PI / 180)
    },

    // 纬度 → 米
    latToMeter(deltaLat) {
      return deltaLat * 110540
    },

    /* 清除裁剪（备用） */
    clearClip() {
      const box = this.$refs.clipBox
      box && box.clear()
    }
  }
}
</script>

<style scoped>
.scene-wrapper {
  width: 100%;
  height: 100%;
}
</style>
