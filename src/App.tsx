import { Layout, Button } from 'antd';
import { Viewer } from "resium";
import * as Cesium from "cesium";
import { useEffect, useRef, useState } from "react";
import { isUndefined, isNull } from 'lodash';

function App() {
    const { Header, Sider, Content } = Layout;
    const cesiumRef = useRef<any>(null);

    // ----------------------------
    // 存储多个摄像机状态
    // ----------------------------
    const [cameraList, setCameraList] = useState<any[]>([]);

    // ----------------------------
    // 获取当前 Camera 状态
    // ----------------------------
    const getCameraState = () => {
        const viewer = cesiumRef.current?.cesiumElement as Cesium.Viewer;
        if (!viewer) return null;

        const cam = viewer.camera;

        return {
            position: {
                x: cam.position.x,
                y: cam.position.y,
                z: cam.position.z,
            },
            direction: {
                x: cam.direction.x,
                y: cam.direction.y,
                z: cam.direction.z,
            },
            up: {
                x: cam.up.x,
                y: cam.up.y,
                z: cam.up.z,
            },
            frustum: {
                fov: cam.frustum.fov,
                near: cam.frustum.near,
                far: cam.frustum.far,
            },
        };
    };


    // ----------------------------
    // 记录当前视角
    // ----------------------------
    const handleRecordCamera = () => {
        const cam = getCameraState();
        if (!cam) return;

        setCameraList((prev) => [...prev, cam]);

        console.log("记录视角成功:", cam);
    };

    // ----------------------------
    // 将视角列表导出为 JSON 文件
    // ----------------------------
    const handleExportCameras = () => {
        const jsonStr = JSON.stringify(cameraList, null, 2);
        const blob = new Blob([jsonStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = "camera_views.json";
        a.click();

        URL.revokeObjectURL(url);

        console.log("视角 JSON 文件已导出");
    };


    // ----------------------------
    // 读取 JSON 文件并自动截图
    // ----------------------------
    // const handleImportAndScreenshot = async () => {
    //     const viewer = cesiumRef.current?.cesiumElement as Cesium.Viewer;
    //     if (!viewer) return;

    //     // 1. 创建文件选择
    //     const input = document.createElement("input");
    //     input.type = "file";
    //     input.accept = "application/json";

    //     input.onchange = async (e: any) => {
    //         const file = e.target.files[0];
    //         if (!file) return;

    //         const text = await file.text();
    //         let views = [];

    //         try {
    //             views = JSON.parse(text);
    //         } catch (err) {
    //             console.error("JSON 解析失败:", err);
    //             return;
    //         }

    //         console.log("读取到视角数量:", views.length);

    //         // 遍历每一个视角，并截图
    //         for (let i = 0; i < views.length; i++) {
    //             const cam = views[i];

    //             viewer.camera.setView({
    //                 destination: new Cesium.Cartesian3(
    //                     cam.position.x,
    //                     cam.position.y,
    //                     cam.position.z
    //                 ),
    //                 orientation: {
    //                     direction: new Cesium.Cartesian3(
    //                         cam.direction.x,
    //                         cam.direction.y,
    //                         cam.direction.z
    //                     ),
    //                     up: new Cesium.Cartesian3(
    //                         cam.up.x,
    //                         cam.up.y,
    //                         cam.up.z
    //                     ),
    //                 }
    //             });

    //             // 等待 Cesium 渲染一帧
    //             await new Promise(r => setTimeout(r, 500));

    //             // 截图
    //             const canvas = viewer.scene.canvas;
    //             const blob = await new Promise<Blob | null>((resolve) =>
    //                 canvas.toBlob(resolve)
    //             );
    //             if (!blob) continue;

    //             // 下载截图
    //             const url = URL.createObjectURL(blob);
    //             const a = document.createElement("a");
    //             a.href = url;
    //             a.download = `view_${i + 1}.png`;
    //             a.click();
    //             URL.revokeObjectURL(url);

    //             console.log(`已保存截图 view_${i + 1}.png`);
    //         }
    //     };

    //     input.click();
    // };

    const handleImportAndScreenshot = async () => {
        const viewer = cesiumRef.current?.cesiumElement as Cesium.Viewer;
        if (!viewer) return;

        // 选择 JSON 文件
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "application/json";

        input.onchange = async (e: any) => {
            const file = e.target.files[0];
            if (!file) return;

            const text = await file.text();
            let views = [];

            try {
                views = JSON.parse(text);
            } catch (err) {
                console.error("JSON 解析失败:", err);
                return;
            }

            console.log("读取到视角数量:", views.length);

            for (let i = 0; i < views.length; i++) {
                const cam = views[i];

                viewer.camera.setView({
                    destination: new Cesium.Cartesian3(
                        cam.position.x,
                        cam.position.y,
                        cam.position.z
                    ),
                    orientation: {
                        direction: new Cesium.Cartesian3(
                            cam.direction.x,
                            cam.direction.y,
                            cam.direction.z
                        ),
                        up: new Cesium.Cartesian3(
                            cam.up.x,
                            cam.up.y,
                            cam.up.z
                        ),
                    }
                });

                // 等一帧渲染
                await new Promise(r => setTimeout(r, 1000));

                // 原始 canvas
                const canvas = viewer.scene.canvas;

                // ------ 新建裁剪用的离屏 canvas ------
                const size = 1024;
                const offCanvas = document.createElement("canvas");
                offCanvas.width = size;
                offCanvas.height = size;
                const ctx = offCanvas.getContext("2d");
                if (!ctx) continue;

                // 原图大小
                const w = canvas.width;
                const h = canvas.height;

                // 从中心裁剪 512×512
                const sx = (w - size) / 2;
                const sy = (h - size) / 2;

                ctx.drawImage(canvas, sx, sy, size, size, 0, 0, size, size);

                // 导出为 JPG
                const blob: Blob | null = await new Promise(resolve => {
                    offCanvas.toBlob(resolve, "image/jpeg", 0.92);
                });
                if (!blob) continue;

                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `view_${i + 1}.jpg`;
                a.click();
                URL.revokeObjectURL(url);

                console.log(`已保存截图 view_${i + 1}.jpg`);
            }
        };

        input.click();
    };





    // ----------------------------
    // 初始化加载（保持你原来的逻辑）
    // ----------------------------
    useEffect(() => {
        if (!isUndefined(cesiumRef.current?.cesiumElement) && !isNull(cesiumRef.current?.cesiumElement)) {
            const cesiumViewer = cesiumRef.current.cesiumElement as Cesium.Viewer;

            Cesium.Cesium3DTileset.fromUrl('http://localhost:8080/Data/tileset.json').then((tileset) => {
                cesiumViewer.scene.primitives.add(tileset);
                cesiumViewer.zoomTo(tileset);
            });
        }
    }, []);

    // ----------------------------
    // 加载多 3DTiles（你的第二个按钮）
    // ----------------------------
    const handleLoadTilesets = async () => {
        if (!cesiumRef.current?.cesiumElement) return;

        const cesiumViewer = cesiumRef.current.cesiumElement as Cesium.Viewer;

        cesiumViewer.scene.backgroundColor = Cesium.Color.BLACK;
        cesiumViewer.scene.globe.show = false;
        cesiumViewer.imageryLayers.removeAll();
        cesiumViewer.scene.primitives.removeAll();



        const tilesetPaths = [
            "/3DTiles/Data/Tile_1/Tile_1.json",
            "/3DTiles/Data/Tile_10/Tile_10.json",
            "/3DTiles/Data/Tile_23/Tile_23.json",
            "/3DTiles/Data/Tile_24/Tile_24.json",
            "/3DTiles/Data/Tile_40/Tile_40.json",
            "/3DTiles/Data/Tile_42/Tile_42.json",
            "/3DTiles/Data/Tile_43/Tile_43.json",
            "/3DTiles/Data/Tile_44/Tile_44.json",
            "/3DTiles/Data/Tile_45/Tile_45.json",
            "/3DTiles/Data/Tile_46/Tile_46.json",
            "/3DTiles/Data/Tile_47/Tile_47.json",
            "/3DTiles/Data/Tile_48/Tile_48.json",
            "/3DTiles/Data/Tile_51/Tile_51.json",
            "/3DTiles/Data/Tile_52/Tile_52.json",
            "/3DTiles/Data/Tile_53/Tile_53.json",
            "/3DTiles/Data/Tile_67/Tile_67.json",
            "/3DTiles/Data/Tile_68/Tile_68.json",
            "/3DTiles/Data/Tile_69/Tile_69.json",
            "/3DTiles/Data/Tile_73/Tile_73.json",
            "/3DTiles/Data/Tile_74/Tile_74.json",
            "/3DTiles/Data/Tile_75/Tile_75.json",
            "/3DTiles/Data/Tile_76/Tile_76.json",
            "/3DTiles/Data/Tile_77/Tile_77.json",
            "/3DTiles/Data/Tile_78/Tile_78.json",
            "/3DTiles/Data/Tile_79/Tile_79.json",
            "/3DTiles/Data/Tile_80/Tile_80.json",
            "/3DTiles/Data/Tile_81/Tile_81.json",
            "/3DTiles/Data/Tile_82/Tile_82.json",
            "/3DTiles/Data/Tile_83/Tile_83.json",
            "/3DTiles/Data/Tile_84/Tile_84.json",
            "/3DTiles/Data/Tile_85/Tile_85.json",
            "/3DTiles/Data/Tile_86/Tile_86.json",
            "/3DTiles/Data/Tile_87/Tile_87.json",
            "/3DTiles/Data/Tile_88/Tile_88.json",
            "/3DTiles/Data/Tile_89/Tile_89.json",
            "/3DTiles/Data/Tile_91/Tile_91.json",
            "/3DTiles/Data/Tile_98/Tile_98.json",
            "/3DTiles/Data/Tile_99/Tile_99.json",
            "/3DTiles/Data/Tile_100/Tile_100.json",
            "/3DTiles/Data/Tile_101/Tile_101.json",
            "/3DTiles/Data/Tile_102/Tile_102.json",
            "/3DTiles/Data/Tile_103/Tile_103.json",
            "/3DTiles/Data/Tile_104/Tile_104.json",
            "/3DTiles/Data/Tile_105/Tile_105.json",
            "/3DTiles/Data/Tile_106/Tile_106.json",
            "/3DTiles/Data/Tile_107/Tile_107.json",
            "/3DTiles/Data/Tile_108/Tile_108.json",
            "/3DTiles/Data/Tile_109/Tile_109.json",
            "/3DTiles/Data/Tile_110/Tile_110.json",
            "/3DTiles/Data/Tile_115/Tile_115.json",
            "/3DTiles/Data/Tile_116/Tile_116.json",
            "/3DTiles/Data/Tile_117/Tile_117.json",
            "/3DTiles/Data/Tile_118/Tile_118.json",
            "/3DTiles/Data/Tile_119/Tile_119.json",
            "/3DTiles/Data/Tile_120/Tile_120.json",
            "/3DTiles/Data/Tile_121/Tile_121.json",
            "/3DTiles/Data/Tile_122/Tile_122.json",
            "/3DTiles/Data/Tile_123/Tile_123.json",
            "/3DTiles/Data/Tile_124/Tile_124.json",
            "/3DTiles/Data/Tile_125/Tile_125.json",
            "/3DTiles/Data/Tile_126/Tile_126.json",
            "/3DTiles/Data/Tile_127/Tile_127.json",
            "/3DTiles/Data/Tile_128/Tile_128.json",
            "/3DTiles/Data/Tile_130/Tile_130.json",
            "/3DTiles/Data/Tile_131/Tile_131.json",
            "/3DTiles/Data/Tile_132/Tile_132.json",
            "/3DTiles/Data/Tile_133/Tile_133.json",
            "/3DTiles/Data/Tile_134/Tile_134.json",
            "/3DTiles/Data/Tile_141/Tile_141.json",
            "/3DTiles/Data/Tile_142/Tile_142.json",
            "/3DTiles/Data/Tile_143/Tile_143.json",
            "/3DTiles/Data/Tile_144/Tile_144.json",
            "/3DTiles/Data/Tile_145/Tile_145.json",
            "/3DTiles/Data/Tile_146/Tile_146.json",
            "/3DTiles/Data/Tile_147/Tile_147.json",
            "/3DTiles/Data/Tile_148/Tile_148.json",
            "/3DTiles/Data/Tile_158/Tile_158.json",
            "/3DTiles/Data/Tile_159/Tile_159.json",
            "/3DTiles/Data/Tile_160/Tile_160.json",
            "/3DTiles/Data/Tile_161/Tile_161.json",
            "/3DTiles/Data/Tile_162/Tile_162.json",
            "/3DTiles/Data/Tile_163/Tile_163.json",
            "/3DTiles/Data/Tile_164/Tile_164.json",
            "/3DTiles/Data/Tile_165/Tile_165.json",
            "/3DTiles/Data/Tile_166/Tile_166.json",
            "/3DTiles/Data/Tile_167/Tile_167.json",
            "/3DTiles/Data/Tile_168/Tile_168.json",
            "/3DTiles/Data/Tile_169/Tile_169.json",
            "/3DTiles/Data/Tile_170/Tile_170.json",
            "/3DTiles/Data/Tile_171/Tile_171.json",
            "/3DTiles/Data/Tile_172/Tile_172.json",
            "/3DTiles/Data/Tile_178/Tile_178.json",
            "/3DTiles/Data/Tile_179/Tile_179.json",
            "/3DTiles/Data/Tile_180/Tile_180.json",
            "/3DTiles/Data/Tile_181/Tile_181.json",
            "/3DTiles/Data/Tile_182/Tile_182.json",
            "/3DTiles/Data/Tile_183/Tile_183.json",
            "/3DTiles/Data/Tile_193/Tile_193.json",
            "/3DTiles/Data/Tile_194/Tile_194.json",
            "/3DTiles/Data/Tile_195/Tile_195.json",
            "/3DTiles/Data/Tile_196/Tile_196.json",
            "/3DTiles/Data/Tile_197/Tile_197.json",
            "/3DTiles/Data/Tile_198/Tile_198.json",
            "/3DTiles/Data/Tile_199/Tile_199.json",
            "/3DTiles/Data/Tile_200/Tile_200.json",
            "/3DTiles/Data/Tile_201/Tile_201.json",
            "/3DTiles/Data/Tile_202/Tile_202.json",
            "/3DTiles/Data/Tile_203/Tile_203.json",
            "/3DTiles/Data/Tile_204/Tile_204.json",
            "/3DTiles/Data/Tile_205/Tile_205.json",
            "/3DTiles/Data/Tile_206/Tile_206.json",
            "/3DTiles/Data/Tile_214/Tile_214.json",
            "/3DTiles/Data/Tile_215/Tile_215.json",
            "/3DTiles/Data/Tile_216/Tile_216.json",
            "/3DTiles/Data/Tile_217/Tile_217.json",
            "/3DTiles/Data/Tile_218/Tile_218.json",
            "/3DTiles/Data/Tile_219/Tile_219.json",
            "/3DTiles/Data/Tile_223/Tile_223.json",
            "/3DTiles/Data/Tile_226/Tile_226.json",
            "/3DTiles/Data/Tile_227/Tile_227.json",
            "/3DTiles/Data/Tile_228/Tile_228.json",
            "/3DTiles/Data/Tile_229/Tile_229.json",
            "/3DTiles/Data/Tile_230/Tile_230.json",
            "/3DTiles/Data/Tile_231/Tile_231.json",
            "/3DTiles/Data/Tile_232/Tile_232.json",
            "/3DTiles/Data/Tile_233/Tile_233.json",
            "/3DTiles/Data/Tile_240/Tile_240.json",
            "/3DTiles/Data/Tile_241/Tile_241.json",
            "/3DTiles/Data/Tile_242/Tile_242.json",
            "/3DTiles/Data/Tile_246/Tile_246.json",
            "/3DTiles/Data/Tile_247/Tile_247.json",
            "/3DTiles/Data/Tile_248/Tile_248.json",
            "/3DTiles/Data/Tile_249/Tile_249.json",
            "/3DTiles/Data/Tile_250/Tile_250.json",
            "/3DTiles/Data/Tile_251/Tile_251.json",
            "/3DTiles/Data/Tile_252/Tile_252.json",
            "/3DTiles/Data/Tile_258/Tile_258.json",
            "/3DTiles/Data/Tile_261/Tile_261.json",
            "/3DTiles/Data/Tile_262/Tile_262.json",
            "/3DTiles/Data/Tile_263/Tile_263.json",
            "/3DTiles/Data/Tile_264/Tile_264.json",
            "/3DTiles/Data/Tile_265/Tile_265.json",
            "/3DTiles/Data/Tile_266/Tile_266.json",
            "/3DTiles/Data/Tile_270/Tile_270.json",
            "/3DTiles/Data/Tile_271/Tile_271.json",
            "/3DTiles/Data/Tile_272/Tile_272.json",
            "/3DTiles/Data/Tile_273/Tile_273.json",
            "/3DTiles/Data/Tile_278/Tile_278.json",
            "/3DTiles/Data/Tile_279/Tile_279.json",
            "/3DTiles/Data/Tile_280/Tile_280.json",
            "/3DTiles/Data/Tile_281/Tile_281.json",
            "/3DTiles/Data/Tile_282/Tile_282.json",
            "/3DTiles/Data/Tile_283/Tile_283.json",
            "/3DTiles/Data/Tile_284/Tile_284.json",
            "/3DTiles/Data/Tile_288/Tile_288.json",
            "/3DTiles/Data/Tile_289/Tile_289.json",
            "/3DTiles/Data/Tile_290/Tile_290.json",
            "/3DTiles/Data/Tile_291/Tile_291.json",
            "/3DTiles/Data/Tile_292/Tile_292.json",
            "/3DTiles/Data/Tile_294/Tile_294.json",
            "/3DTiles/Data/Tile_295/Tile_295.json",
            "/3DTiles/Data/Tile_296/Tile_296.json",
            "/3DTiles/Data/Tile_297/Tile_297.json",
            "/3DTiles/Data/Tile_298/Tile_298.json",
            "/3DTiles/Data/Tile_299/Tile_299.json",
            "/3DTiles/Data/Tile_300/Tile_300.json",
            "/3DTiles/Data/Tile_303/Tile_303.json",
            "/3DTiles/Data/Tile_304/Tile_304.json",
            "/3DTiles/Data/Tile_305/Tile_305.json",
            "/3DTiles/Data/Tile_306/Tile_306.json",
            '/3DTiles/Data/Tile_307/Tile_307.json',
            '/3DTiles/Data/Tile_308/Tile_308.json',
            '/3DTiles/Data/Tile_311/Tile_311.json',
            '/3DTiles/Data/Tile_312/Tile_312.json',
            '/3DTiles/Data/Tile_313/Tile_313.json',
            '/3DTiles/Data/Tile_314/Tile_314.json',
            '/3DTiles/Data/Tile_315/Tile_315.json',
            '/3DTiles/Data/Tile_316/Tile_316.json',
            '/3DTiles/Data/Tile_317/Tile_317.json',
            '/3DTiles/Data/Tile_318/Tile_318.json',
            '/3DTiles/Data/Tile_322/Tile_322.json',
            '/3DTiles/Data/Tile_323/Tile_323.json',
            '/3DTiles/Data/Tile_324/Tile_324.json',
            '/3DTiles/Data/Tile_325/Tile_325.json',
            '/3DTiles/Data/Tile_328/Tile_328.json',
            '/3DTiles/Data/Tile_329/Tile_329.json',
            '/3DTiles/Data/Tile_330/Tile_330.json',
            '/3DTiles/Data/Tile_331/Tile_331.json',
            '/3DTiles/Data/Tile_332/Tile_332.json',
            '/3DTiles/Data/Tile_333/Tile_333.json',
            '/3DTiles/Data/Tile_334/Tile_334.json',
            '/3DTiles/Data/Tile_337/Tile_337.json',
            '/3DTiles/Data/Tile_338/Tile_338.json',
            '/3DTiles/Data/Tile_339/Tile_339.json',
            '/3DTiles/Data/Tile_340/Tile_340.json',
            '/3DTiles/Data/Tile_341/Tile_341.json',
            '/3DTiles/Data/Tile_342/Tile_342.json',
            '/3DTiles/Data/Tile_346/Tile_346.json',
            '/3DTiles/Data/Tile_347/Tile_347.json',
            '/3DTiles/Data/Tile_348/Tile_348.json',
            '/3DTiles/Data/Tile_349/Tile_349.json',
            '/3DTiles/Data/Tile_350/Tile_350.json',
            '/3DTiles/Data/Tile_351/Tile_351.json',
            '/3DTiles/Data/Tile_352/Tile_352.json',
            '/3DTiles/Data/Tile_360/Tile_360.json',
            '/3DTiles/Data/Tile_361/Tile_361.json',
            '/3DTiles/Data/Tile_362/Tile_362.json',
            '/3DTiles/Data/Tile_363/Tile_363.json',
            '/3DTiles/Data/Tile_364/Tile_364.json',
            '/3DTiles/Data/Tile_365/Tile_365.json',
            '/3DTiles/Data/Tile_369/Tile_369.json',
            '/3DTiles/Data/Tile_370/Tile_370.json',
            '/3DTiles/Data/Tile_371/Tile_371.json',
            '/3DTiles/Data/Tile_372/Tile_372.json',
            '/3DTiles/Data/Tile_373/Tile_373.json',
            '/3DTiles/Data/Tile_374/Tile_374.json',
            '/3DTiles/Data/Tile_375/Tile_375.json',
            '/3DTiles/Data/Tile_379/Tile_379.json',
            '/3DTiles/Data/Tile_380/Tile_380.json',
            '/3DTiles/Data/Tile_381/Tile_381.json',
            '/3DTiles/Data/Tile_382/Tile_382.json',
            '/3DTiles/Data/Tile_383/Tile_383.json',
            '/3DTiles/Data/Tile_386/Tile_386.json',
            '/3DTiles/Data/Tile_387/Tile_387.json',
            '/3DTiles/Data/Tile_388/Tile_388.json',
            '/3DTiles/Data/Tile_389/Tile_389.json',
            '/3DTiles/Data/Tile_390/Tile_390.json',
            '/3DTiles/Data/Tile_391/Tile_391.json',
            '/3DTiles/Data/Tile_392/Tile_392.json',
            '/3DTiles/Data/Tile_393/Tile_393.json',
            '/3DTiles/Data/Tile_399/Tile_399.json',
            '/3DTiles/Data/Tile_400/Tile_400.json',
            '/3DTiles/Data/Tile_401/Tile_401.json',
            '/3DTiles/Data/Tile_402/Tile_402.json',
            '/3DTiles/Data/Tile_405/Tile_405.json',
            '/3DTiles/Data/Tile_406/Tile_406.json',
            '/3DTiles/Data/Tile_407/Tile_407.json',
            '/3DTiles/Data/Tile_408/Tile_408.json',
            '/3DTiles/Data/Tile_409/Tile_409.json',
            '/3DTiles/Data/Tile_410/Tile_410.json',
            '/3DTiles/Data/Tile_411/Tile_411.json',
            '/3DTiles/Data/Tile_415/Tile_415.json',
            '/3DTiles/Data/Tile_416/Tile_416.json',
            '/3DTiles/Data/Tile_417/Tile_417.json',
            '/3DTiles/Data/Tile_418/Tile_418.json',
            '/3DTiles/Data/Tile_422/Tile_422.json',
            '/3DTiles/Data/Tile_423/Tile_423.json',
            '/3DTiles/Data/Tile_424/Tile_424.json',
            '/3DTiles/Data/Tile_425/Tile_425.json',
            '/3DTiles/Data/Tile_426/Tile_426.json',
            '/3DTiles/Data/Tile_427/Tile_427.json',
            '/3DTiles/Data/Tile_428/Tile_428.json',
            '/3DTiles/Data/Tile_429/Tile_429.json',
            '/3DTiles/Data/Tile_435/Tile_435.json',
            '/3DTiles/Data/Tile_436/Tile_436.json',
            '/3DTiles/Data/Tile_437/Tile_437.json',
            '/3DTiles/Data/Tile_438/Tile_438.json',
            '/3DTiles/Data/Tile_439/Tile_439.json',
            '/3DTiles/Data/Tile_442/Tile_442.json',
            '/3DTiles/Data/Tile_443/Tile_443.json',
            '/3DTiles/Data/Tile_444/Tile_444.json',
            '/3DTiles/Data/Tile_445/Tile_445.json',
            '/3DTiles/Data/Tile_446/Tile_446.json',
            '/3DTiles/Data/Tile_447/Tile_447.json',
            '/3DTiles/Data/Tile_448/Tile_448.json',
            '/3DTiles/Data/Tile_449/Tile_449.json',
            '/3DTiles/Data/Tile_450/Tile_450.json',
            '/3DTiles/Data/Tile_451/Tile_451.json',
            '/3DTiles/Data/Tile_455/Tile_455.json',
            '/3DTiles/Data/Tile_456/Tile_456.json',
            '/3DTiles/Data/Tile_457/Tile_457.json',
            '/3DTiles/Data/Tile_458/Tile_458.json',
            '/3DTiles/Data/Tile_462/Tile_462.json',
            '/3DTiles/Data/Tile_463/Tile_463.json',
            '/3DTiles/Data/Tile_464/Tile_464.json',
            '/3DTiles/Data/Tile_465/Tile_465.json',
            '/3DTiles/Data/Tile_466/Tile_466.json',
            '/3DTiles/Data/Tile_467/Tile_467.json',
            '/3DTiles/Data/Tile_468/Tile_468.json',
            '/3DTiles/Data/Tile_469/Tile_469.json',
            '/3DTiles/Data/Tile_470/Tile_470.json',
            '/3DTiles/Data/Tile_471/Tile_471.json',
            '/3DTiles/Data/Tile_472/Tile_472.json',
            '/3DTiles/Data/Tile_478/Tile_478.json',
            '/3DTiles/Data/Tile_479/Tile_479.json',
            '/3DTiles/Data/Tile_480/Tile_480.json',
            '/3DTiles/Data/Tile_483/Tile_483.json',
            '/3DTiles/Data/Tile_484/Tile_484.json',
            '/3DTiles/Data/Tile_485/Tile_485.json',
            '/3DTiles/Data/Tile_486/Tile_486.json',
            '/3DTiles/Data/Tile_487/Tile_487.json',
            '/3DTiles/Data/Tile_488/Tile_488.json',
            '/3DTiles/Data/Tile_489/Tile_489.json',
            '/3DTiles/Data/Tile_490/Tile_490.json',
            '/3DTiles/Data/Tile_491/Tile_491.json',
            '/3DTiles/Data/Tile_492/Tile_492.json',
            '/3DTiles/Data/Tile_493/Tile_493.json',
            '/3DTiles/Data/Tile_494/Tile_494.json',
            '/3DTiles/Data/Tile_496/Tile_496.json',
            '/3DTiles/Data/Tile_497/Tile_497.json',
            '/3DTiles/Data/Tile_498/Tile_498.json',
            '/3DTiles/Data/Tile_502/Tile_502.json',
            '/3DTiles/Data/Tile_503/Tile_503.json',
            '/3DTiles/Data/Tile_504/Tile_504.json',
            '/3DTiles/Data/Tile_505/Tile_505.json',
            '/3DTiles/Data/Tile_506/Tile_506.json',
            '/3DTiles/Data/Tile_507/Tile_507.json',
            '/3DTiles/Data/Tile_508/Tile_508.json',
            '/3DTiles/Data/Tile_509/Tile_509.json',
            '/3DTiles/Data/Tile_510/Tile_510.json',
            '/3DTiles/Data/Tile_511/Tile_511.json',
            '/3DTiles/Data/Tile_512/Tile_512.json',
            '/3DTiles/Data/Tile_513/Tile_513.json',
            '/3DTiles/Data/Tile_514/Tile_514.json',
            '/3DTiles/Data/Tile_515/Tile_515.json',
            '/3DTiles/Data/Tile_517/Tile_517.json',
            '/3DTiles/Data/Tile_518/Tile_518.json',
            '/3DTiles/Data/Tile_520/Tile_520.json',
            '/3DTiles/Data/Tile_521/Tile_521.json',
            '/3DTiles/Data/Tile_522/Tile_522.json',
            '/3DTiles/Data/Tile_523/Tile_523.json',
            '/3DTiles/Data/Tile_524/Tile_524.json',
            '/3DTiles/Data/Tile_525/Tile_525.json',
            '/3DTiles/Data/Tile_526/Tile_526.json',
            '/3DTiles/Data/Tile_527/Tile_527.json',
            '/3DTiles/Data/Tile_528/Tile_528.json',
            '/3DTiles/Data/Tile_529/Tile_529.json',
            '/3DTiles/Data/Tile_530/Tile_530.json',
            '/3DTiles/Data/Tile_531/Tile_531.json',
            '/3DTiles/Data/Tile_532/Tile_532.json',
            '/3DTiles/Data/Tile_533/Tile_533.json',
            '/3DTiles/Data/Tile_536/Tile_536.json',
            '/3DTiles/Data/Tile_537/Tile_537.json',
            '/3DTiles/Data/Tile_538/Tile_538.json',
            '/3DTiles/Data/Tile_539/Tile_539.json',
            '/3DTiles/Data/Tile_540/Tile_540.json',
            '/3DTiles/Data/Tile_541/Tile_541.json',
            '/3DTiles/Data/Tile_542/Tile_542.json',
            '/3DTiles/Data/Tile_543/Tile_543.json',
            '/3DTiles/Data/Tile_544/Tile_544.json',
            "/3DTiles/Data/Tile_545/Tile_545.json",
            "/3DTiles/Data/Tile_546/Tile_546.json",
            "/3DTiles/Data/Tile_547/Tile_547.json",
            "/3DTiles/Data/Tile_548/Tile_548.json",
            "/3DTiles/Data/Tile_549/Tile_549.json",
            "/3DTiles/Data/Tile_550/Tile_550.json",
            "/3DTiles/Data/Tile_551/Tile_551.json",
            "/3DTiles/Data/Tile_552/Tile_552.json",
            "/3DTiles/Data/Tile_553/Tile_553.json",
            "/3DTiles/Data/Tile_557/Tile_557.json",
            "/3DTiles/Data/Tile_558/Tile_558.json",
            "/3DTiles/Data/Tile_559/Tile_559.json",
            "/3DTiles/Data/Tile_560/Tile_560.json",
            "/3DTiles/Data/Tile_561/Tile_561.json",
            "/3DTiles/Data/Tile_562/Tile_562.json",
            "/3DTiles/Data/Tile_563/Tile_563.json",
            "/3DTiles/Data/Tile_564/Tile_564.json",
            "/3DTiles/Data/Tile_565/Tile_565.json",
            "/3DTiles/Data/Tile_566/Tile_566.json",
        ];


        let firstTileset: Cesium.Cesium3DTileset | null = null;

        for (const path of tilesetPaths) {
            try {
                console.log("加载瓦片:", path);
                const tileset = await Cesium.Cesium3DTileset.fromUrl(path);

                cesiumViewer.scene.primitives.add(tileset);
                if (!firstTileset) firstTileset = tileset;
            } catch (error) {
                console.error("加载失败:", path, error);
            }
        }

        if (firstTileset) {
            cesiumViewer.zoomTo(firstTileset);
            console.log("已飞向第一个 tileset");
        }
    };

    // ----------------------------
    // JSX + Resium Viewer
    // ----------------------------
    return (
        <Layout style={{ position: "absolute", left: 0, top: 0, height: "100vh", width: "100vw" }}>
            <Header>

                <Button onClick={() => console.log(cesiumRef)}>Log Ref</Button>

                <Button onClick={handleLoadTilesets}>Load Tilesets</Button>

                {/* 新增：记录视角 */}
                <Button onClick={handleRecordCamera}>记录当前视角</Button>

                {/* 新增：导出视角文件 */}
                <Button onClick={handleExportCameras}>导出视角</Button>

                <Button onClick={handleImportAndScreenshot}>导入视角并截图</Button>


            </Header>

            <Layout>
                <Sider></Sider>

                <Content style={{ height: "100%", width: "100%" }}>

                    <Viewer
                        ref={cesiumRef}
                        baseLayerPicker={false}
                        skyBox={false}
                        skyAtmosphere={false}
                        infoBox={false}
                        navigationHelpButton={false}
                        animation={false}
                        timeline={false}

                        //下面这个截图的时候再开启，选视角的时候不开启
                        contextOptions={{
                            webgl: {
                                alpha: true,
                                depth: true,
                                stencil: true,
                                antialias: true,
                                premultipliedAlpha: true,
                                preserveDrawingBuffer: true,   // ★★★ 必须加
                            }
                        }}
                    />

                </Content>
            </Layout>
        </Layout>
    );
}

export default App;
