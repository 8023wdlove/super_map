<!--
 * @Author: 8023wdlove 1096186073@qq.com
 * @Date: 2025-12-22 10:37:06
 * @LastEditors: 8023wdlove 1096186073@qq.com
 * @LastEditTime: 2025-12-22 17:25:30
 * @FilePath: \super_map\src\components\CimScence3.vue
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
-->
<template>
  <div class="cim-container">
    <!-- 工具栏 -->
    <div class="toolbar">
      <button
        :class="{ active: mode === 'view' }"
        @click="switchMode('view')"
      >
        浏览模式
      </button>
      <button
        :class="{ active: mode === 'mark' }"
        @click="switchMode('mark')"
      >
        标注模式
      </button>
    </div>

    <!-- Cesium 容器 -->
    <div ref="cesiumContainer" class="viewer"></div>
  </div>
</template>

<script>
  var Cesium = window.Cesium
export default {
  name: 'CimBuildingMark',

  data() {
    return {
      viewer: null,

      mode: 'view', // view | mark

      buildings: [{"id":"B1766367858955","name":"楼宇1","polygon":[[120.70013292796999,30.228904649827328],[120.70075216210172,30.228412802415725],[120.70025507798933,30.227956311549498],[120.69963855306183,30.228445551633985]]},{"id":"B1766367898325","name":"楼宇2","polygon":[[120.70026054905289,30.229027411656997],[120.70074995944161,30.229485494444408],[120.70145713714633,30.229137657873807],[120.70087344690299,30.228541101071713],[120.70135793585284,30.22898785855223],[120.70087230522344,30.228542095444197],[120.70146432198848,30.22913110840188],[120.70087936746577,30.228536305591977]]},{"id":"B1766368070818","name":"楼宇3","polygon":[[120.7014921740352,30.229119300565202],[120.70087939923387,30.22961144991627],[120.70137632995674,30.23007862431539],[120.70198969645685,30.22959020011411]]},{"id":"B1766368117174","name":"楼宇4","polygon":[[120.70198193545072,30.229341334097747],[120.70260874419543,30.228865368250258],[120.70183446977846,30.228139150529653],[120.70121618832201,30.22862807900197]]},{"id":"B1766368135697","name":"楼宇5","polygon":[[120.7008755788008,30.22830258391388],[120.70148874419347,30.227825139480302],[120.70100241096075,30.227350885669974],[120.70038349883524,30.227840796683573]]}],

      // 标注相关
      drawPoints: [],
      drawHandler: null,
      pickHandler: null,
      tempEntity: null
    }
  },

  mounted() {
    this.initViewer()
    this.loadBuildings()
    this.switchMode('view')
  },

  beforeDestroy() {
    this.clearAllHandlers()
    if (this.viewer) {
      this.viewer.destroy()
      this.viewer = null
    }
  },

  methods: {
    /* ================= 初始化 ================= */

    initViewer() {
      this.viewer = new Cesium.Viewer(this.$refs.cesiumContainer, {
        animation: false,
        timeline: false,
        baseLayerPicker: false
      })

      // ⚠️ 这里加载你的超图场景
      const sceneUrl =
        'http://61.156.58.251:8195/portalproxy/040a2c991be35feb/iserver/services/3D-local3DCache-zhigu/rest/realspace'

      this.viewer.scene.open(sceneUrl, undefined, {
        autoSetView: false
      }).then(() => {
        console.log('✅ 场景加载完成')
        this.viewer.scene.camera.setView({
          destination: Cesium.Cartesian3.fromDegrees(
            120.6993527020927,
            30.225959572531785,
            244.1596275128751
          ),
          orientation: {
            heading: Cesium.Math.toRadians(20.109777932369102),
            pitch: Cesium.Math.toRadians(-34.44299809647591),
            roll: 0
          }
      })
      })
    },

    loadBuildings() {
      const cache = localStorage.getItem('BUILDINGS')
      if (cache) {
        this.buildings = JSON.parse(cache)
      }
    },

    /* ================= 模式切换 ================= */

    switchMode(target) {
      if (this.mode === target) return

      this.clearAllHandlers()
      this.clearTemp()

      this.mode = target

      if (target === 'view') {
        this.enablePickMode()
      }

      if (target === 'mark') {
        this.enableMarkMode()
      }
    },

    clearAllHandlers() {
      if (this.pickHandler) {
        this.pickHandler.destroy()
        this.pickHandler = null
      }
      if (this.drawHandler) {
        this.drawHandler.destroy()
        this.drawHandler = null
      }
    },

    clearTemp() {
      this.drawPoints = []
      if (this.tempEntity) {
        this.viewer.entities.remove(this.tempEntity)
        this.tempEntity = null
      }
    },

    /* ================= 浏览模式 ================= */

    enablePickMode() {
      this.pickHandler = new Cesium.ScreenSpaceEventHandler(
        this.viewer.scene.canvas
      )

      this.pickHandler.setInputAction(click => {
        console.log('click position:', click.position)
        const cartesian = this.viewer.scene.pickPosition(click.position)
        if (!cartesian) return

        const carto = Cesium.Cartographic.fromCartesian(cartesian)
        const lng = Cesium.Math.toDegrees(carto.longitude)
        const lat = Cesium.Math.toDegrees(carto.latitude)

        this.handleBuildingPick(lng, lat)
      }, Cesium.ScreenSpaceEventType.LEFT_CLICK)
    },

    // handleBuildingPick(lng, lat) {
    //   for (const building of this.buildings) {
    //     if (this.isPointInPolygon([lng, lat], building.polygon)) {
    //       console.log('✅ 选中楼宇:', building.name)
    //       // 这里后面可以接：裁切 / flyTo
    //       return
    //     }
    //   }
    //   console.log('点在空白处')
    // },

    /* ================= 标注模式 ================= */

    enableMarkMode() {
      this.drawPoints = []

      this.drawHandler = new Cesium.ScreenSpaceEventHandler(
        this.viewer.scene.canvas
      )

      // 左键加点
      this.drawHandler.setInputAction(click => {
        const cartesian = this.viewer.scene.pickPosition(click.position)
        if (!cartesian) return

        const carto = Cesium.Cartographic.fromCartesian(cartesian)
        const lng = Cesium.Math.toDegrees(carto.longitude)
        const lat = Cesium.Math.toDegrees(carto.latitude)

        this.drawPoints.push([lng, lat])
        this.updateTempPolygon()
      }, Cesium.ScreenSpaceEventType.LEFT_CLICK)

      // 右键结束
      this.drawHandler.setInputAction(() => {
        this.finishDrawBuilding()
      }, Cesium.ScreenSpaceEventType.RIGHT_CLICK)
    },

    updateTempPolygon() {
      if (!this.tempEntity) {
        this.tempEntity = this.viewer.entities.add({
          polygon: {
            hierarchy: new Cesium.CallbackProperty(() => {
              return new Cesium.PolygonHierarchy(
                Cesium.Cartesian3.fromDegreesArray(
                  this.drawPoints.flat()
                )
              )
            }, false),
            material: Cesium.Color.YELLOW.withAlpha(0.4)
          }
        })
      }
    },

    finishDrawBuilding() {
      if (this.drawPoints.length < 3) {
        alert('至少需要 3 个点')
        return
      }

      const building = {
        id: 'B' + Date.now(),
        name: `楼宇${this.buildings.length + 1}`,
        polygon: [...this.drawPoints]
      }

      this.buildings.push(building)

      localStorage.setItem(
        'BUILDINGS',
        JSON.stringify(this.buildings)
      )

      console.log('✅ 楼宇已保存:', building)

      this.switchMode('view')
    },

    /* ================= 工具方法 ================= */

    isPointInPolygon(point, polygon) {
      let inside = false
      const [x, y] = point

      for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const xi = polygon[i][0], yi = polygon[i][1]
        const xj = polygon[j][0], yj = polygon[j][1]

        const intersect =
          yi > y !== yj > y &&
          x < ((xj - xi) * (y - yi)) / (yj - yi) + xi

        if (intersect) inside = !inside
      }

      return inside
    },

    handleBuildingPick(lng, lat) {
      for (const building of this.buildings) {
        if (this.isPointInPolygon([lng, lat], building.polygon)) {
          this.clipAndFocusBuilding(building)
          return
        }
      }

    // 点空白 → 还原
    this.clearClip()
    this.clearFocusEffect()
    },
    clipBuilding(building) {
      const layers = this.viewer.scene.layers
      // 兜底高度（没有就给一个）
      const minHeight = building.minHeight ?? 0
      const maxHeight = building.maxHeight ?? 100
      console.log('🏢 楼宇高度范围:', minHeight, maxHeight)
      // 清空之前的裁切
      // layers.removeAllClipPlanes()
      for (let i = 0; i < layers.length; i++) {
        layers.get(i).clippingPlanes = null
      }
      // 构造裁切多边形
      const positions = building.polygon.map(p =>
        Cesium.Cartesian3.fromDegrees(p[0], p[1])
      )
      // 创建裁切面集合
      const clipPlanes = []
      for (let i = 0; i < positions.length; i++) {
        const p1 = positions[i]
        const p2 = positions[(i + 1) % positions.length]
        const up = Cesium.Cartesian3.normalize(
          Cesium.Cartesian3.subtract(p2, p1, new Cesium.Cartesian3()),
          new Cesium.Cartesian3()
        )
        const normal = Cesium.Cartesian3.cross(
          up,
          Cesium.Cartesian3.UNIT_Z,
          new Cesium.Cartesian3()
        )
        Cesium.Cartesian3.normalize(normal, normal)
        clipPlanes.push(
          new Cesium.ClippingPlane(normal, 0)
        )
      }
      const clippingPlaneCollection = new Cesium.ClippingPlaneCollection({
        planes: clipPlanes,
        unionClippingRegions: true,
        edgeWidth: 1,
        edgeColor: Cesium.Color.YELLOW
      })
      // 应用到所有 S3M 图层
      for (let i = 0; i < layers.length; i++) {
        layers.get(i).clippingPlanes = clippingPlaneCollection
      }
      console.log('✅ 裁切完成')
    },
    // focusBuilding(building) {
    //   const { polygon, minHeight = 0, maxHeight = 100 } = building
    //   console.log('🏢 聚焦楼宇:', minHeight, maxHeight)
    //   // 计算 polygon 中心点
    //   let lng = 0, lat = 0
    //   polygon.forEach(p => {
    //     lng += p[0]
    //     lat += p[1]
    //   })
    //   lng /= polygon.length
    //   lat /= polygon.length

    //   this.viewer.scene.camera.flyTo({
    //     destination: Cesium.Cartesian3.fromDegrees(
    //       lng,
    //       lat,
    //       maxHeight * 2.5
    //     ),
    //     orientation: {
    //       heading: Cesium.Math.toRadians(0),
    //       pitch: Cesium.Math.toRadians(-45),
    //       roll: 0
    //     },
    //     duration: 1.2
    //   })
    // },
    focusBuilding(building) {
  const { polygon, minHeight = 0, maxHeight = 100 } = building
      console.log('🏢 聚焦楼宇:', minHeight, maxHeight)
  const sphere = this.getPolygonBoundingSphere(
    polygon,
    minHeight,
    maxHeight
  )

  this.viewer.scene.camera.flyToBoundingSphere(
    sphere,
    {
      duration: 1.2,
      offset: new Cesium.HeadingPitchRange(
        Cesium.Math.toRadians(0),
        Cesium.Math.toRadians(-45),
        sphere.radius * 2.0
      )
    }
  )
},


    applyFocusEffect() {
      const layers = this.viewer.scene.layers
      console.log('🏢 应用聚焦效果', layers)
      for (let i = 0; i < layers.length; i++) {
        const layer = layers.get(i)
        // 所有图层先半透明
        layer.style3D = new Cesium.Cesium3DTileStyle({
          color: 'color("gray", 0.2)'
        })
      }
    },
    clearFocusEffect() {
      const layers = this.viewer.scene.layers
      for (let i = 0; i < layers.length; i++) {
        layers.get(i).style3D = null
      }
    },
    clipAndFocusBuilding(building) {
      this.clearClip()
      this.clipBuilding(building)
      this.applyFocusEffect(building)
      this.focusBuilding(building)
    },
    clearClip() {
      const layers = this.viewer.scene.layers
      for (let i = 0; i < layers.length; i++) {
        layers.get(i).clippingPlanes = null
      }
    },
getPolygonBoundingSphere(polygon, minHeight = 0, maxHeight = 100) {
  const positions = []

  polygon.forEach(([lng, lat]) => {
    positions.push(
      Cesium.Cartesian3.fromDegrees(lng, lat, minHeight),
      Cesium.Cartesian3.fromDegrees(lng, lat, maxHeight)
    )
  })

  return Cesium.BoundingSphere.fromPoints(positions)
}








  }
}
/**
 * [{"id":"B1766367858955","name":"楼宇1","polygon":[[120.70013292796999,30.228904649827328],[120.70075216210172,30.228412802415725],[120.70025507798933,30.227956311549498],[120.69963855306183,30.228445551633985]]},{"id":"B1766367898325","name":"楼宇2","polygon":[[120.70026054905289,30.229027411656997],[120.70074995944161,30.229485494444408],[120.70145713714633,30.229137657873807],[120.70087344690299,30.228541101071713],[120.70135793585284,30.22898785855223],[120.70087230522344,30.228542095444197],[120.70146432198848,30.22913110840188],[120.70087936746577,30.228536305591977]]},{"id":"B1766368070818","name":"楼宇3","polygon":[[120.7014921740352,30.229119300565202],[120.70087939923387,30.22961144991627],[120.70137632995674,30.23007862431539],[120.70198969645685,30.22959020011411]]},{"id":"B1766368117174","name":"楼宇4","polygon":[[120.70198193545072,30.229341334097747],[120.70260874419543,30.228865368250258],[120.70183446977846,30.228139150529653],[120.70121618832201,30.22862807900197]]},{"id":"B1766368135697","name":"楼宇5","polygon":[[120.7008755788008,30.22830258391388],[120.70148874419347,30.227825139480302],[120.70100241096075,30.227350885669974],[120.70038349883524,30.227840796683573]]}]
 */
</script>

<style scoped>
.cim-container {
  position: relative;
  width: 100%;
  height: 100%;
}

.viewer {
  width: 100%;
  height: 100%;
}

.toolbar {
  position: absolute;
  top: 10px;
  left: 10px;
  z-index: 10;
}

.toolbar button {
  margin-right: 8px;
  padding: 6px 12px;
  cursor: pointer;
}

.toolbar button.active {
  background: #409eff;
  color: #fff;
}
</style>