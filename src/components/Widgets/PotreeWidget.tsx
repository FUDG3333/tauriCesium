import { useEffect, useRef } from "react";
import * as Cesium from "cesium";
import { isNull, isUndefined } from "lodash";
import {Viewer} from 'resium';

declare global {
  interface Window {
    Potree: any;
    TWEEN: any;
    cesiumViewer: any;
    Cesium: any;
  }
}

const { Potree } = window;

// 重点在于，我们想看看能不能把cesium一起放进来
const PotreeWidget = () => {
  const cesiumViewerRef = useRef<any>(null);
  // 还是试着用那个弄一下吧，虽然很呆
  useEffect(() => {
    const cesiumDom = document.getElementById("cesium-widget")!;
    if (!cesiumDom) return;
    else {
      console.log(cesiumViewerRef);
    }
  //   if (isUndefined(window.cesiumViewer)) {
  //     // const cesiumViewer = new Cesium.Viewer(cesiumDom, {
  //     //   useDefaultRenderLoop: false,
  //     //   animation: false,
  //     //   baseLayerPicker: false,
  //     //   fullscreenButton: false,
  //     //   geocoder: false,
  //     //   homeButton: false,
  //     //   infoBox: false,
  //     //   sceneModePicker: false,
  //     //   selectionIndicator: false,
  //     //   timeline: false,
  //     //   navigationHelpButton: false,
  //     //   terrainShadows: Cesium.ShadowMode.DISABLED,
  //     //   baseLayer: new Cesium.ImageryLayer(
  //     //     new Cesium.UrlTemplateImageryProvider({
  //     //       url: 'http://webst01.is.autonavi.com/appmaptile?style=7&x={x}&y={y}&z={z}'
  //     //     })
  //     //   )
  //     // });
  //     // window.cesiumViewer = cesiumViewer;
    const dom = document.getElementById("potree-widget")!;
    if (!dom) return;
    const potreeViewer = new Potree.Viewer(dom);
    potreeViewer.setEDLEnabled(false);
    potreeViewer.setFOV(60);
    potreeViewer.setPointBudget(5000000);
    potreeViewer.setBackground("skybox");
    potreeViewer.renderer.antialias = false;
    potreeViewer.renderer.setPixelRatio(window.devicePixelRatio);
    potreeViewer.scene.view.setView([100, 100, 100], [0, 0, 0]);
  //     // function loop(timestamp: number) {
  //     //   requestAnimationFrame(loop);
  //     //   // potreeViewer.update(potreeViewer.clock.getDelta(), timestamp);
  //     //   // potreeViewer.render();
  //     //   if (!isUndefined(window.cesiumViewer.toMap)) {
  //     //     cesiumViewer.render();
  //     //   }
  //     // }
  //     // requestAnimationFrame(loop);
  //   } else {
  //     console.log(window.cesiumViewer);
  //     // Cesium.Cesium3DTileset.fromUrl('http://localhost:8080/Data/tileset.json').then((tileset) => {
  //     //   console.log(tileset);
  //     //   window.cesiumViewer.scene.primitives.add(tileset);
  //     // });
  //     // 
  //   }
  });
  return (
  <Viewer id="cesium-widget" ref={cesiumViewerRef}/>
  )
}
export default PotreeWidget;