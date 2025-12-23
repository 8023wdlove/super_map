<template>
  <div class="cim-container">
    <!-- 工具栏 -->
    <div class="toolbar">
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
      tempEntity: null,
      sceneUrl: 'http://61.156.58.251:8195/portalproxy/040a2c991be35feb/iserver/services/3D-local3DCache-zhigu/rest/realspace', // 替换成你的S3M或倾斜摄影服务
      tdtKey: '5f411a510fbf7d76f07aba535b0ccb70' // 替换成你申请的天地图Key
    }
  },

  mounted() {
    this.initViewer()
    this.loadBuildings()
    // this.switchMode('view')
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
            // 1️⃣ 初始化Cesium Viewer
      this.viewer = new Cesium.Viewer(this.$refs.cesiumContainer, {
        animation: false,
        timeline: false,
        baseLayerPicker: true, // 底图选择器
        orderIndependentTranslucency:false,
        terrainProvider: Cesium.EllipsoidTerrainProvider() // 暂时没有高程，可改成createWorldTerrain()
      })

      // 2️⃣ 移除默认底图
      this.viewer.imageryLayers.removeAll()

      var labelImagery = new Cesium.TiandituImageryProvider({
            mapStyle: Cesium.TiandituMapsStyle.IMG_C,//天地图全球中文注记服务
            token: this.tdtKey //由天地图官网申请的密钥
        });
      // 注记
      const tdtCia = new Cesium.TiandituImageryProvider({
        mapStyle: Cesium.TiandituMapsStyle.CIA_C,
        token: this.tdtKey
      })
      this.viewer.imageryLayers.addImageryProvider(labelImagery)
      this.viewer.imageryLayers.addImageryProvider(tdtCia)
      // 4️⃣ 加载SuperMap场景（S3M / 倾斜摄影）
      this.viewer.scene.globe.depthTestAgainstTerrain = true;
      this.viewer.scene.open(this.sceneUrl, undefined, { autoSetView: false })
        .then(() => {
          console.log('✅ 场景加载完成')
          // 5️⃣ 设置初始相机位置
          this.viewer.scene.camera.setView({
            destination: Cesium.Cartesian3.fromDegrees(
              120.6993527020927, // 经度
              30.225959572531785, // 纬度
              244.1596275128751   // 高度
            ),
            orientation: {
              heading: Cesium.Math.toRadians(20),
              pitch: Cesium.Math.toRadians(-34),
              roll: 0
            }
          })
        this.addBuildingLabels()
        this.switchMode('view')
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
      // if (this.mode === target) return
      this.clearAllHandlers()
      this.clearTemp()
      this.mode = target
      if (target === 'view') {
        this.enablePickMode()
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
        console.log('click cartesian:', cartesian)
        const carto = Cesium.Cartographic.fromCartesian(cartesian)
        const lng = Cesium.Math.toDegrees(carto.longitude)
        const lat = Cesium.Math.toDegrees(carto.latitude)

        this.handleBuildingPick(lng, lat)
      }, Cesium.ScreenSpaceEventType.LEFT_CLICK)
    },
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
          console.log('✅ 选中楼宇:', building.name)
          this.clipAndFocusBuilding(building)
          return
        }
      }
    },
    focusBuilding(building) {
      const { polygon, minHeight = 0, maxHeight = 150 } = building
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
    clipAndFocusBuilding(building) {
      this.focusBuilding(building)
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
    },
    addBuildingLabels() {
      if (!this.viewer || !this.buildings) return
      this.buildings.forEach(building => {
        const { polygon, name } = building
        if (!polygon || polygon.length === 0) return
        // 1️⃣ 计算多边形中心
        let lng = 0, lat = 0
        polygon.forEach(p => {
          lng += p[0]
          lat += p[1]
        })
        lng /= polygon.length
        lat /= polygon.length
        // 2️⃣ 计算包围球半径 + 偏移，用作标签高度
        const sphere = this.getPolygonBoundingSphere(polygon)
        const labelHeight = sphere.radius - 35 // 偏移 3 米
        console.log(`🏢 ${name} 标签高度:`, labelHeight)
        // 3️⃣ 添加标签
        this.viewer.entities.add({
          position: Cesium.Cartesian3.fromDegrees(lng, lat, labelHeight),
          label: {
            text: name,
            font: '30px sans-serif',
            fillColor: Cesium.Color.RED,          // 红色填充，更明显
            outlineColor: Cesium.Color.BLACK,     // 黑色描边
            outlineWidth: 2,
            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
            verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
            heightReference: Cesium.HeightReference.NONE,
            scaleByDistance: new Cesium.NearFarScalar(100, 1.0, 2000, 0.5)
          }
        })
      })
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
