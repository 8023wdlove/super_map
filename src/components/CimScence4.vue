<template>
  <div class="cim-container">
    <div ref="cesiumContainer" class="viewer"></div>
  </div>
</template>

<script>
var Cesium = window.Cesium
export default {
  name: 'SuperMapCesiumTdt',
  data() {
    return {
      viewer: null,
      sceneUrl: 'http://61.156.58.251:8195/portalproxy/040a2c991be35feb/iserver/services/3D-local3DCache-zhigu/rest/realspace', // 替换成你的S3M或倾斜摄影服务
      tdtKey: '5f411a510fbf7d76f07aba535b0ccb70' // 替换成你申请的天地图Key
    }
  },
  mounted() {
    this.initViewer()
  },
  beforeUnmount() {
    if (this.viewer) {
      this.viewer.destroy()
      this.viewer = null
    }
  },
  methods: {
    initViewer() {
      // 1️⃣ 初始化Cesium Viewer
      this.viewer = new Cesium.Viewer(this.$refs.cesiumContainer, {
        animation: false,
        timeline: false,
        baseLayerPicker: false, // 关闭默认底图
        orderIndependentTranslucency:false,
        terrainProvider: Cesium.EllipsoidTerrainProvider() // 暂时没有高程，可改成createWorldTerrain()
      })

      // 2️⃣ 移除默认底图
      this.viewer.imageryLayers.removeAll()

      // 3️⃣ 添加天地图WMTS影像底图
      // const tdtLayer = new Cesium.WebMapTileServiceImageryProvider({
      //   url: 'https://t0.tianditu.gov.cn/img_w/wmts',
      //   layer: 'img',
      //   style: 'default',
      //   format: 'tiles',
      //   tileMatrixSetID: 'c',
      //   maximumLevel: 18,
      //   subdomains: ['0','1','2','3','4','5','6','7'],
      //   credit: '天地图',
      //   tilingScheme: new Cesium.WebMercatorTilingScheme(),
      //   token: this.tdtKey
      // })
      var labelImagery = new Cesium.TiandituImageryProvider({
            mapStyle: Cesium.TiandituMapsStyle.VEC_C,//天地图全球中文注记服务
            token: this.tdtKey //由天地图官网申请的密钥
        });
      this.viewer.imageryLayers.addImageryProvider(labelImagery)

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
        })
    }
  }
}
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
</style>
