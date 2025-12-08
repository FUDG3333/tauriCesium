import { Layout, Button } from 'antd';
import { Viewer } from "resium";
import * as Cesium from "cesium";
import { useEffect, useRef } from "react";
import { isUndefined, isNull } from 'lodash';
// 现在就是想想可视化的plan B
function App() {
    const { Header, Sider, Content } = Layout;
    const cesiumRef = useRef<any>(null);

    useEffect(() => {
        if (!isUndefined(cesiumRef.current.cesiumElement) && !isNull(cesiumRef.current.cesiumElement)) {
            const cesiumViewer = cesiumRef.current.cesiumElement as Cesium.Viewer;

            // 保持 useEffect 中的原有加载逻辑不变 (如果你不希望它在初始化时加载，可以注释或移除它)
            Cesium.Cesium3DTileset.fromUrl('http://localhost:8080/Data/tileset.json').then((tileset) => {
                // Cesium.Cesium3DTileset.fromUrl('/Tile_1/Tile_1.json').then((tileset) => {
                console.log(tileset);
                cesiumViewer.scene.primitives.add(tileset);
                cesiumViewer.zoomTo(tileset);
            });
        }
    }, [])

    return (
        <Layout style={{
            position: "absolute", left: 0, top: 0, height: "100vh", width: "100vw",
        }}>
            <Header>
                {/* 保持第一个 Button 不变 */}
                <Button onClick={() => {
                    console.log(cesiumRef);
                }}>Log Ref</Button>

                {/* 第二个 Button：只修改加载逻辑 */}
                <Button onClick={async () => {
                    if (!isUndefined(cesiumRef.current.cesiumElement) && !isNull(cesiumRef.current.cesiumElement)) {
                        const cesiumViewer = cesiumRef.current.cesiumElement as Cesium.Viewer;

                        // 设置背景和视图样式 (保留你原有的样式设置)
                        cesiumViewer.scene.backgroundColor = Cesium.Color.BLACK;
                        cesiumViewer.scene.globe.show = false;
                        cesiumViewer.imageryLayers.removeAll();

                        // --- 瓦片加载逻辑开始 ---

                        // 1. 清除旧的图元
                        cesiumViewer.scene.primitives.removeAll();

                        // 2. 定义要加载的路径
                        const tilesetPaths = [
                          '/3DTiles/Data/Tile_1/Tile_1.json',   
                          '/3DTiles/Data/Tile_10/Tile_10.json',   
                          '/3DTiles/Data/Tile_23/Tile_23.json',   
                          '/3DTiles/Data/Tile_24/Tile_24.json',   
                          '/3DTiles/Data/Tile_40/Tile_40.json',   
                          '/3DTiles/Data/Tile_42/Tile_42.json',   
                          '/3DTiles/Data/Tile_43/Tile_43.json',   
                          '/3DTiles/Data/Tile_44/Tile_44.json',   
                          '/3DTiles/Data/Tile_45/Tile_45.json',   
                          '/3DTiles/Data/Tile_46/Tile_46.json',   
                        ];

                        let firstTileset: Cesium.Cesium3DTileset | null = null;

                        // 3. 异步循环加载
                        for (const path of tilesetPaths) {
                            try {
                                console.log(`正在加载瓦片集: ${path}`);
                                const tileset = await Cesium.Cesium3DTileset.fromUrl(path);

                                cesiumViewer.scene.primitives.add(tileset);

                                if (isNull(firstTileset)) {
                                    firstTileset = tileset;
                                }
                            } catch (error) {
                                console.error(`加载瓦片集失败: ${path}`, error);
                            }
                        }

                        // 4. 飞向第一个加载成功的瓦片集
                        if (!isNull(firstTileset)) {
                            cesiumViewer.zoomTo(firstTileset);
                            console.log("已飞向加载的瓦片集。");
                        }
                        // --- 瓦片加载逻辑结束 ---
                    }
                }}>Load Tilesets</Button>
            </Header>
            <Layout>
                <Sider>

                </Sider>
                <Content style={{ height: "100%", width: "100%" }}>
                    <Viewer
                        // full
                        ref={cesiumRef}
                        // imageryProvider={false}  // 关闭默认地球影像
                        baseLayerPicker={false}  // 关闭图层选择器
                        // terrainProvider={new Cesium.EllipsoidTerrainProvider()} // 用空地形
                        skyBox={false}    // 关闭天空盒
                        skyAtmosphere={false}  // 关闭大气
                        infoBox={false}
                        navigationHelpButton={false}
                        animation={false}
                        timeline={false}

                    />
                    {/* <Viewer style={{ width: "100%", height: "100%" }} infoBox={false} ref={cesiumRef} /> */}
                </Content>
            </Layout>
        </Layout>
    );
}

export default App;