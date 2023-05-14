import { useLayoutEffect } from 'react'
import { PMREMGenerator, CubeTextureLoader } from 'three'
import { useThree, useLoader } from 'react-three-fiber'
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader'
import { useAsset } from 'use-asset'

const Environment = ({ background = false, files = ['px.png', 'nx.png', 'py.png', 'ny.png', 'pz.png', 'nz.png'] }) => {

    const { gl, scene: defaultScene } = useThree()
    const isCubeMap = Array.isArray(files)
    const loader = isCubeMap ? CubeTextureLoader : RGBELoader

    const loaderResult = useLoader(loader, isCubeMap ? [files] : files, loader => loader.setPath('/envMap/'))
    const map = isCubeMap ? loaderResult[0] : loaderResult

    const texture = useAsset(() => new Promise(res => {
        const gen = new PMREMGenerator(gl)
        const texture = gen.fromEquirectangular(map)
        gen.compileEquirectangularShader()
        gen.dispose()
        map.dispose()
        res(texture.texture)
    }), map)

    useLayoutEffect(() => {
        defaultScene.environment = texture
        defaultScene.background = map
    }, [texture, background])

    return null
}

export { Environment }
