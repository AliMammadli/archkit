import React, { Suspense, useEffect, useState, useRef } from "react"
import { Canvas } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera, Html, useGLTF, useTexture, useProgress } from "@react-three/drei"
import { proxy, useSnapshot } from 'valtio'
import { useSpring, animated } from 'react-spring'
import { useGesture } from 'react-use-gesture'
import { Environment } from './Environment'


const state = proxy({
    current: null,
    option: 'wallpaper_6',
    price: 12,
    totalCost: 0,
    floorHeight: 2,
    isAnimating: false,
    sort: 'best',
    selectedWalls: [],
    surfaces: {
        wall_1: 'Wallpaper Thin Brown Stripes',
        wall_2: 'Wallpaper Thin Brown Stripes',
        wall_3: 'Wallpaper Thin Brown Stripes',
        wall_4: 'Wallpaper Thin Brown Stripes',
        flour: 'Color M00',
        ceiling: 'Color M00',
    },
    building: {
        year: '',
        lighting: '',
        heating: '',
        window: '',
        floors: '',
        type: '',
        area: ''
    },
    owner: {
        name: ''
    }
})

const initialCameraPos = [7.4001, 2, -11.002]
const initialControlsTarget = [7.4, 2, -11]


const Model = (props) => {
    const dragDelta = useRef(0)
    const group = useRef()
    const marker = useRef()
    const cameraRef = useRef()
    const orbitControls = useRef()
    const snap = useSnapshot(state)
    const { nodes, materials } = useGLTF('showroom.gltf')
    const texture = useTexture('marker.png')
    const [hovered, setHovered] = useState(null)
    const [markerPos, setMarkerPos] = useState([4, 0.32, -4])

    const [isAnimating, setIsAnimating] = useState(false)

    const Navigation = ({ cameraPosition }) => {
        if (isAnimating) {
            cameraRef.current.position.set(...cameraPosition)
        }
        return null
    }

    const AnimatedNavigation = animated(Navigation)
    const AnimatedOrbitControls = animated(OrbitControls)

    const [cameraValues, setCameraValues] = useState({
        cachedPos: initialCameraPos,
        cachedTarget: initialControlsTarget,
        pos: initialCameraPos,
        target: initialControlsTarget
    })

    const spring = useSpring({
        pos: cameraValues.pos,
        target: cameraValues.target,
        from: {
            pos: cameraValues.cachedPos,
            target: cameraValues.cachedTarget
        },
        config: { tension: 110, friction: 20, mass: 0.7 },
        onRest: () => setIsAnimating(false)
    })

    const bind = useGesture({
        onPointerOver: ({ event }) => (event.stopPropagation(), setHovered(event.object.material.name)),
        onPointerOut: ({ event }) => event.intersections.length === 0 && setHovered(null),
        onPointerEnter: ({ event }) => (event.stopPropagation(), markerVisible(event)),
        onPointerMissed: () => (state.current = null),
        onPointerMove: ({ event }) => (event.stopPropagation(), updateMarker(event)),
        onDragStart: () => (marker.current.visible = false, setIsAnimating(false)),
        onDrag: ({ first, last, elapsedTime }) => (updateDelta(first, last, elapsedTime)),
        onDragEnd: () => (marker.current.visible = true, document.body.style.cursor = 'pointer'),
        onClick: ({ event }) => (event.stopPropagation(), (state.current = `${event.object.name}: "${event.object.material.name}"`, updateCamera(event)))
    })

    useEffect(() => {
        marker.current.rotation.x = -Math.PI / 2
    }, [marker])

    const updateMarker = (e) => {
        setMarkerPos([e.point.x, snap.floorHeight < 3 ? 0.32 : 3.47, e.point.z])
    }

    const markerVisible = (e) => {
        var floors = ['first_floor_0', 'second_floor_0', 'marker']
        if (floors.includes(e.object.name)) {
            marker.current.visible = true
            document.body.style.cursor = 'pointer'
        } else {
            marker.current.visible = false
            document.body.style.cursor = 'grab'
        }
    }

    const updateDelta = (first, last, elapsedTime) => {
        marker.current.visible = false
        document.body.style.cursor = 'grabbing'
        if (first) {
            dragDelta.current = elapsedTime
        }

        if (last) {
            dragDelta.current = elapsedTime - dragDelta.current
        }
    }

    const updateCamera = (e) => {
        if (dragDelta.current < 170) {
            let objName = e.object.name.slice(0, 13)
            var nextPos = [e.point.x, snap.floorHeight, e.point.z]
            var floors = ['first_floor_0', 'second_floor_0', 'stairs_treads', 'stairs_risers', 'marker']
            // console.log(snap.selectedWalls)
            if (objName === 'stairs_treads' || objName === 'stairs_risers') {
                if (cameraValues.pos[1] < 3) {
                    nextPos = [3, 5, -16]
                    state.floorHeight = 5
                } else {
                    nextPos[1] = 2
                    state.floorHeight = 2
                }
            } else if (objName === 'first_floor_0') {
                nextPos[1] = 2
                state.floorHeight = 2
            }

            if (floors.includes(e.object.name) || floors.includes(objName)) {
                if (!isAnimating) {
                    setIsAnimating(true)
                    setCameraValues({
                        cachedPos: cameraValues.pos,
                        cachedTarget: cameraValues.cachedTarget,
                        pos: nextPos,
                        target: nextPos
                    })
                    orbitControls.current.target.set(...nextPos)
                    orbitControls.current.update()
                }
            } else {
                if (e.object.material === materials[`${snap.option}`]) {
                    e.object.material = materials['Color M00']
                    state.selectedWalls = state.selectedWalls.filter(wall => wall !== e.object.name)
                    state.totalCost -= e.object.area / 40 * state.price
                } else {
                    e.object.material = materials[`${snap.option}`]
                    state.selectedWalls.push(e.object.name)
                    state.totalCost += e.object.area / 40 * state.price
                }
            }

        }
    }

    return (
        <>
            <group ref={group} {...props} {...bind()} dispose={null}>
                <group>
                    <group name="root">
                        <mesh name="mesh_298" geometry={nodes.mesh_298.geometry} material={nodes.mesh_298.material} />
                        <mesh name="mesh_298_1" geometry={nodes.mesh_298_1.geometry} material={nodes.mesh_298_1.material} />
                        <mesh name="mesh_298_2" geometry={nodes.mesh_298_2.geometry} material={nodes.mesh_298_2.material} />
                        <mesh name="mesh_298_3" geometry={nodes.mesh_298_3.geometry} material={nodes.mesh_298_3.material} />
                        <mesh name="mesh_298_4" geometry={nodes.mesh_298_4.geometry} material={materials['Wood Lumber ButtJoined']} />
                        <mesh name="mesh_298_5" geometry={nodes.mesh_298_5.geometry} material={nodes.mesh_298_5.material} />
                        <mesh name="mesh_298_6" geometry={nodes.mesh_298_6.geometry} material={nodes.mesh_298_6.material} />
                        <mesh name="mesh_298_7" geometry={nodes.mesh_298_7.geometry} material={nodes.mesh_298_7.material} />
                        <mesh name="mesh_298_8" geometry={nodes.mesh_298_8.geometry} material={nodes.mesh_298_8.material} />
                        <mesh name="mesh_298_9" geometry={nodes.mesh_298_9.geometry} material={nodes.mesh_298_9.material} />
                        <mesh name="mesh_298_10" geometry={nodes.mesh_298_10.geometry} material={materials.wallpaper_1} />
                        <mesh name="mesh_298_11" geometry={nodes.mesh_298_11.geometry} material={materials.wallpaper_2} />
                        <mesh name="mesh_298_12" geometry={nodes.mesh_298_12.geometry} material={materials.wallpaper_3} />
                        <mesh name="mesh_298_13" geometry={nodes.mesh_298_13.geometry} material={materials.wallpaper_4} />
                        <mesh name="mesh_298_14" geometry={nodes.mesh_298_14.geometry} material={materials.wallpaper_5} />
                        <mesh name="mesh_298_15" geometry={nodes.mesh_298_15.geometry} material={materials.wallpaper_6} />
                        <mesh name="mesh_298_16" geometry={nodes.mesh_298_16.geometry} material={materials.wallpaper_7} />
                        <mesh name="mesh_298_17" geometry={nodes.mesh_298_17.geometry} material={materials.wallpaper_8} />
                        <mesh name="mesh_298_18" geometry={nodes.mesh_298_18.geometry} material={materials.ceiling_1} />
                        <mesh name="mesh_298_19" geometry={nodes.mesh_298_19.geometry} material={materials.ceiling_2} />
                        <group name="Window_Fixed">
                            <mesh name="Window_Fixed_Main_Frame" geometry={nodes.Window_Fixed_Main_Frame.geometry} material={nodes.Window_Fixed_Main_Frame.material} />
                            <mesh name="Glazing" geometry={nodes.Glazing.geometry} material={nodes.Glazing.material} />
                            <mesh name="Glazing_1" geometry={nodes.Glazing_1.geometry} material={nodes.Glazing_1.material} />
                        </group>
                        <group name="Window_Sliding">
                            <mesh name="Window_Sliding_Main_Frame" geometry={nodes.Window_Sliding_Main_Frame.geometry} material={nodes.Window_Sliding_Main_Frame.material} />
                            <mesh name="Window_Sliding_Casement" geometry={nodes.Window_Sliding_Casement.geometry} material={nodes.Window_Sliding_Casement.material}>
                                <mesh name="Glazing_68" geometry={nodes.Glazing_68.geometry} material={nodes.Glazing_68.material} />
                                <mesh name="Glazing_69" geometry={nodes.Glazing_69.geometry} material={nodes.Glazing_69.material} />
                            </mesh>
                            <mesh name="Window_Sliding_Casement_1" geometry={nodes.Window_Sliding_Casement_1.geometry} material={nodes.Window_Sliding_Casement_1.material}>
                                <mesh name="Glazing_70" geometry={nodes.Glazing_70.geometry} material={nodes.Glazing_70.material} />
                                <mesh name="Glazing_71" geometry={nodes.Glazing_71.geometry} material={nodes.Glazing_71.material} />
                            </mesh>
                        </group>
                        <group name="Window_Fixed#1">
                            <mesh name="Window_Fixed_Main_Frame#1" geometry={nodes['Window_Fixed_Main_Frame#1'].geometry} material={nodes['Window_Fixed_Main_Frame#1'].material} />
                            <mesh name="Glazing_2" geometry={nodes.Glazing_2.geometry} material={nodes.Glazing_2.material} />
                            <mesh name="Glazing_3" geometry={nodes.Glazing_3.geometry} material={nodes.Glazing_3.material} />
                        </group>
                        <group name="Window_Fixed#2">
                            <mesh name="Window_Fixed_Main_Frame#2" geometry={nodes['Window_Fixed_Main_Frame#2'].geometry} material={nodes['Window_Fixed_Main_Frame#2'].material} />
                            <mesh name="Glazing_4" geometry={nodes.Glazing_4.geometry} material={nodes.Glazing_4.material} />
                            <mesh name="Glazing_5" geometry={nodes.Glazing_5.geometry} material={nodes.Glazing_5.material} />
                        </group>
                        <group name="Window_Fixed#3">
                            <mesh name="Window_Fixed_Main_Frame#3" geometry={nodes['Window_Fixed_Main_Frame#3'].geometry} material={nodes['Window_Fixed_Main_Frame#3'].material} />
                            <mesh name="Glazing_6" geometry={nodes.Glazing_6.geometry} material={nodes.Glazing_6.material} />
                            <mesh name="Glazing_7" geometry={nodes.Glazing_7.geometry} material={nodes.Glazing_7.material} />
                        </group>
                        <group name="Window_Fixed#4">
                            <mesh name="Window_Fixed_Main_Frame#4" geometry={nodes['Window_Fixed_Main_Frame#4'].geometry} material={nodes['Window_Fixed_Main_Frame#4'].material} />
                            <mesh name="Glazing_8" geometry={nodes.Glazing_8.geometry} material={nodes.Glazing_8.material} />
                            <mesh name="Glazing_9" geometry={nodes.Glazing_9.geometry} material={nodes.Glazing_9.material} />
                        </group>
                        <group name="Window_Fixed#5">
                            <mesh name="Window_Fixed_Main_Frame#5" geometry={nodes['Window_Fixed_Main_Frame#5'].geometry} material={nodes['Window_Fixed_Main_Frame#5'].material} />
                            <mesh name="Glazing_10" geometry={nodes.Glazing_10.geometry} material={nodes.Glazing_10.material} />
                            <mesh name="Glazing_11" geometry={nodes.Glazing_11.geometry} material={nodes.Glazing_11.material} />
                        </group>
                        <group name="Window_Fixed#6">
                            <mesh name="Window_Fixed_Main_Frame#6" geometry={nodes['Window_Fixed_Main_Frame#6'].geometry} material={nodes['Window_Fixed_Main_Frame#6'].material} />
                            <mesh name="Glazing_12" geometry={nodes.Glazing_12.geometry} material={nodes.Glazing_12.material} />
                            <mesh name="Glazing_13" geometry={nodes.Glazing_13.geometry} material={nodes.Glazing_13.material} />
                        </group>
                        <group name="Window_Fixed#7">
                            <mesh name="Window_Fixed_Main_Frame#7" geometry={nodes['Window_Fixed_Main_Frame#7'].geometry} material={nodes['Window_Fixed_Main_Frame#7'].material} />
                            <mesh name="Glazing_14" geometry={nodes.Glazing_14.geometry} material={nodes.Glazing_14.material} />
                            <mesh name="Glazing_15" geometry={nodes.Glazing_15.geometry} material={nodes.Glazing_15.material} />
                        </group>
                        <group name="Window_Fixed#8">
                            <mesh name="Window_Fixed_Main_Frame#8" geometry={nodes['Window_Fixed_Main_Frame#8'].geometry} material={nodes['Window_Fixed_Main_Frame#8'].material} />
                            <mesh name="Glazing_16" geometry={nodes.Glazing_16.geometry} material={nodes.Glazing_16.material} />
                            <mesh name="Glazing_17" geometry={nodes.Glazing_17.geometry} material={nodes.Glazing_17.material} />
                        </group>
                        <group name="Window_Fixed#9">
                            <mesh name="Window_Fixed_Main_Frame#9" geometry={nodes['Window_Fixed_Main_Frame#9'].geometry} material={nodes['Window_Fixed_Main_Frame#9'].material} />
                            <mesh name="Glazing_18" geometry={nodes.Glazing_18.geometry} material={nodes.Glazing_18.material} />
                            <mesh name="Glazing_19" geometry={nodes.Glazing_19.geometry} material={nodes.Glazing_19.material} />
                        </group>
                        <group name="Window_Fixed#10">
                            <mesh name="Window_Fixed_Main_Frame#10" geometry={nodes['Window_Fixed_Main_Frame#10'].geometry} material={nodes['Window_Fixed_Main_Frame#10'].material} />
                            <mesh name="Glazing_20" geometry={nodes.Glazing_20.geometry} material={nodes.Glazing_20.material} />
                            <mesh name="Glazing_21" geometry={nodes.Glazing_21.geometry} material={nodes.Glazing_21.material} />
                        </group>
                        <group name="Window_Fixed#11">
                            <mesh name="Window_Fixed_Main_Frame#11" geometry={nodes['Window_Fixed_Main_Frame#11'].geometry} material={nodes['Window_Fixed_Main_Frame#11'].material} />
                            <mesh name="Glazing_22" geometry={nodes.Glazing_22.geometry} material={nodes.Glazing_22.material} />
                            <mesh name="Glazing_23" geometry={nodes.Glazing_23.geometry} material={nodes.Glazing_23.material} />
                        </group>
                        <group name="Window_Fixed#12">
                            <mesh name="Window_Fixed_Main_Frame#12" geometry={nodes['Window_Fixed_Main_Frame#12'].geometry} material={nodes['Window_Fixed_Main_Frame#12'].material} />
                            <mesh name="Glazing_24" geometry={nodes.Glazing_24.geometry} material={nodes.Glazing_24.material} />
                            <mesh name="Glazing_25" geometry={nodes.Glazing_25.geometry} material={nodes.Glazing_25.material} />
                        </group>
                        <group name="Window_Fixed#13">
                            <mesh name="Window_Fixed_Main_Frame#13" geometry={nodes['Window_Fixed_Main_Frame#13'].geometry} material={nodes['Window_Fixed_Main_Frame#13'].material} />
                            <mesh name="Glazing_26" geometry={nodes.Glazing_26.geometry} material={nodes.Glazing_26.material} />
                            <mesh name="Glazing_27" geometry={nodes.Glazing_27.geometry} material={nodes.Glazing_27.material} />
                        </group>
                        <group name="Window_Fixed#14">
                            <mesh name="Window_Fixed_Main_Frame#14" geometry={nodes['Window_Fixed_Main_Frame#14'].geometry} material={nodes['Window_Fixed_Main_Frame#14'].material} />
                            <mesh name="Glazing_28" geometry={nodes.Glazing_28.geometry} material={nodes.Glazing_28.material} />
                            <mesh name="Glazing_29" geometry={nodes.Glazing_29.geometry} material={nodes.Glazing_29.material} />
                        </group>
                        <group name="Window_Fixed#15">
                            <mesh name="Window_Fixed_Main_Frame#15" geometry={nodes['Window_Fixed_Main_Frame#15'].geometry} material={nodes['Window_Fixed_Main_Frame#15'].material} />
                            <mesh name="Glazing_30" geometry={nodes.Glazing_30.geometry} material={nodes.Glazing_30.material} />
                            <mesh name="Glazing_31" geometry={nodes.Glazing_31.geometry} material={nodes.Glazing_31.material} />
                        </group>
                        <group name="Window_Fixed#17">
                            <mesh name="Window_Fixed_Main_Frame#17" geometry={nodes['Window_Fixed_Main_Frame#17'].geometry} material={nodes['Window_Fixed_Main_Frame#17'].material} />
                            <mesh name="Glazing_32" geometry={nodes.Glazing_32.geometry} material={nodes.Glazing_32.material} />
                            <mesh name="Glazing_33" geometry={nodes.Glazing_33.geometry} material={nodes.Glazing_33.material} />
                        </group>
                        <group name="Window_Fixed#18">
                            <mesh name="Window_Fixed_Main_Frame#18" geometry={nodes['Window_Fixed_Main_Frame#18'].geometry} material={nodes['Window_Fixed_Main_Frame#18'].material} />
                            <mesh name="Glazing_34" geometry={nodes.Glazing_34.geometry} material={nodes.Glazing_34.material} />
                            <mesh name="Glazing_35" geometry={nodes.Glazing_35.geometry} material={nodes.Glazing_35.material} />
                        </group>
                        <group name="Window_Fixed#19">
                            <mesh name="Window_Fixed_Main_Frame#19" geometry={nodes['Window_Fixed_Main_Frame#19'].geometry} material={nodes['Window_Fixed_Main_Frame#19'].material} />
                            <mesh name="Glazing_36" geometry={nodes.Glazing_36.geometry} material={nodes.Glazing_36.material} />
                            <mesh name="Glazing_37" geometry={nodes.Glazing_37.geometry} material={nodes.Glazing_37.material} />
                        </group>
                        <group name="Window_Fixed#20">
                            <mesh name="Window_Fixed_Main_Frame#20" geometry={nodes['Window_Fixed_Main_Frame#20'].geometry} material={nodes['Window_Fixed_Main_Frame#20'].material} />
                            <mesh name="Glazing_38" geometry={nodes.Glazing_38.geometry} material={nodes.Glazing_38.material} />
                            <mesh name="Glazing_39" geometry={nodes.Glazing_39.geometry} material={nodes.Glazing_39.material} />
                        </group>
                        <group name="Window_Fixed#21">
                            <mesh name="Window_Fixed_Main_Frame#21" geometry={nodes['Window_Fixed_Main_Frame#21'].geometry} material={nodes['Window_Fixed_Main_Frame#21'].material} />
                            <mesh name="Glazing_40" geometry={nodes.Glazing_40.geometry} material={nodes.Glazing_40.material} />
                            <mesh name="Glazing_41" geometry={nodes.Glazing_41.geometry} material={nodes.Glazing_41.material} />
                        </group>
                        <group name="Window_Fixed#22">
                            <mesh name="Window_Fixed_Main_Frame#22" geometry={nodes['Window_Fixed_Main_Frame#22'].geometry} material={nodes['Window_Fixed_Main_Frame#22'].material} />
                            <mesh name="Glazing_42" geometry={nodes.Glazing_42.geometry} material={nodes.Glazing_42.material} />
                            <mesh name="Glazing_43" geometry={nodes.Glazing_43.geometry} material={nodes.Glazing_43.material} />
                        </group>
                        <group name="Window_Fixed#24">
                            <mesh name="Window_Fixed_Main_Frame#24" geometry={nodes['Window_Fixed_Main_Frame#24'].geometry} material={nodes['Window_Fixed_Main_Frame#24'].material} />
                            <mesh name="Glazing_44" geometry={nodes.Glazing_44.geometry} material={nodes.Glazing_44.material} />
                            <mesh name="Glazing_45" geometry={nodes.Glazing_45.geometry} material={nodes.Glazing_45.material} />
                        </group>
                        <group name="Window_Fixed#25">
                            <mesh name="Window_Fixed_Main_Frame#25" geometry={nodes['Window_Fixed_Main_Frame#25'].geometry} material={nodes['Window_Fixed_Main_Frame#25'].material} />
                            <mesh name="Glazing_46" geometry={nodes.Glazing_46.geometry} material={nodes.Glazing_46.material} />
                            <mesh name="Glazing_47" geometry={nodes.Glazing_47.geometry} material={nodes.Glazing_47.material} />
                        </group>
                        <group name="Window_Fixed#26">
                            <mesh name="Window_Fixed_Main_Frame#26" geometry={nodes['Window_Fixed_Main_Frame#26'].geometry} material={nodes['Window_Fixed_Main_Frame#26'].material} />
                            <mesh name="Glazing_48" geometry={nodes.Glazing_48.geometry} material={nodes.Glazing_48.material} />
                            <mesh name="Glazing_49" geometry={nodes.Glazing_49.geometry} material={nodes.Glazing_49.material} />
                        </group>
                        <group name="Window_Fixed#27">
                            <mesh name="Window_Fixed_Main_Frame#27" geometry={nodes['Window_Fixed_Main_Frame#27'].geometry} material={nodes['Window_Fixed_Main_Frame#27'].material} />
                            <mesh name="Glazing_50" geometry={nodes.Glazing_50.geometry} material={nodes.Glazing_50.material} />
                            <mesh name="Glazing_51" geometry={nodes.Glazing_51.geometry} material={nodes.Glazing_51.material} />
                        </group>
                        <group name="Window_Fixed#28">
                            <mesh name="Window_Fixed_Main_Frame#28" geometry={nodes['Window_Fixed_Main_Frame#28'].geometry} material={nodes['Window_Fixed_Main_Frame#28'].material} />
                            <mesh name="Glazing_52" geometry={nodes.Glazing_52.geometry} material={nodes.Glazing_52.material} />
                            <mesh name="Glazing_53" geometry={nodes.Glazing_53.geometry} material={nodes.Glazing_53.material} />
                        </group>
                        <group name="Window_Sliding#1">
                            <mesh name="Window_Sliding_Main_Frame#1" geometry={nodes['Window_Sliding_Main_Frame#1'].geometry} material={nodes['Window_Sliding_Main_Frame#1'].material} />
                            <mesh name="Window_Sliding_Casement#2" geometry={nodes['Window_Sliding_Casement#2'].geometry} material={nodes['Window_Sliding_Casement#2'].material}>
                                <mesh name="Glazing_72" geometry={nodes.Glazing_72.geometry} material={nodes.Glazing_72.material} />
                                <mesh name="Glazing_73" geometry={nodes.Glazing_73.geometry} material={nodes.Glazing_73.material} />
                            </mesh>
                            <mesh name="Window_Sliding_Casement#2_1" geometry={nodes['Window_Sliding_Casement#2_1'].geometry} material={nodes['Window_Sliding_Casement#2_1'].material}>
                                <mesh name="Glazing_74" geometry={nodes.Glazing_74.geometry} material={nodes.Glazing_74.material} />
                                <mesh name="Glazing_75" geometry={nodes.Glazing_75.geometry} material={nodes.Glazing_75.material} />
                            </mesh>
                        </group>
                        <group name="Window_Fixed#30">
                            <mesh name="Window_Fixed_Main_Frame#30" geometry={nodes['Window_Fixed_Main_Frame#30'].geometry} material={nodes['Window_Fixed_Main_Frame#30'].material} />
                            <mesh name="Glazing_54" geometry={nodes.Glazing_54.geometry} material={nodes.Glazing_54.material} />
                            <mesh name="Glazing_55" geometry={nodes.Glazing_55.geometry} material={nodes.Glazing_55.material} />
                        </group>
                        <group name="Window_Fixed#34">
                            <mesh name="Window_Fixed_Main_Frame#34" geometry={nodes['Window_Fixed_Main_Frame#34'].geometry} material={nodes['Window_Fixed_Main_Frame#34'].material} />
                            <mesh name="Glazing_56" geometry={nodes.Glazing_56.geometry} material={nodes.Glazing_56.material} />
                            <mesh name="Glazing_57" geometry={nodes.Glazing_57.geometry} material={nodes.Glazing_57.material} />
                        </group>
                        <group name="Window_Fixed#35">
                            <mesh name="Window_Fixed_Main_Frame#35" geometry={nodes['Window_Fixed_Main_Frame#35'].geometry} material={nodes['Window_Fixed_Main_Frame#35'].material} />
                            <mesh name="Glazing_58" geometry={nodes.Glazing_58.geometry} material={nodes.Glazing_58.material} />
                            <mesh name="Glazing_59" geometry={nodes.Glazing_59.geometry} material={nodes.Glazing_59.material} />
                        </group>
                        <group name="Window_Fixed#36">
                            <mesh name="Window_Fixed_Main_Frame#36" geometry={nodes['Window_Fixed_Main_Frame#36'].geometry} material={nodes['Window_Fixed_Main_Frame#36'].material} />
                            <mesh name="Glazing_60" geometry={nodes.Glazing_60.geometry} material={nodes.Glazing_60.material} />
                            <mesh name="Glazing_61" geometry={nodes.Glazing_61.geometry} material={nodes.Glazing_61.material} />
                        </group>
                        <group name="Window_Fixed#37">
                            <mesh name="Window_Fixed_Main_Frame#37" geometry={nodes['Window_Fixed_Main_Frame#37'].geometry} material={nodes['Window_Fixed_Main_Frame#37'].material} />
                            <mesh name="Glazing_62" geometry={nodes.Glazing_62.geometry} material={nodes.Glazing_62.material} />
                            <mesh name="Glazing_63" geometry={nodes.Glazing_63.geometry} material={nodes.Glazing_63.material} />
                        </group>
                        <group name="Window_Fixed#38">
                            <mesh name="Window_Fixed_Main_Frame#38" geometry={nodes['Window_Fixed_Main_Frame#38'].geometry} material={nodes['Window_Fixed_Main_Frame#38'].material} />
                            <mesh name="Glazing_64" geometry={nodes.Glazing_64.geometry} material={nodes.Glazing_64.material} />
                            <mesh name="Glazing_65" geometry={nodes.Glazing_65.geometry} material={nodes.Glazing_65.material} />
                        </group>
                        <group name="Window_Fixed#39">
                            <mesh name="Window_Fixed_Main_Frame#39" geometry={nodes['Window_Fixed_Main_Frame#39'].geometry} material={nodes['Window_Fixed_Main_Frame#39'].material} />
                            <mesh name="Glazing_66" geometry={nodes.Glazing_66.geometry} material={nodes.Glazing_66.material} />
                            <mesh name="Glazing_67" geometry={nodes.Glazing_67.geometry} material={nodes.Glazing_67.material} />
                        </group>
                        <group name="out_Rail_0">
                            <mesh name="mesh_116" geometry={nodes.mesh_116.geometry} material={nodes.mesh_116.material} />
                            <mesh name="mesh_116_1" geometry={nodes.mesh_116_1.geometry} material={materials['Wood Veneer 02']} />
                        </group>
                        <group name="Rail">
                            <mesh name="mesh_117" geometry={nodes.mesh_117.geometry} material={nodes.mesh_117.material} />
                            <mesh name="mesh_117_1" geometry={nodes.mesh_117_1.geometry} material={materials['Translucent Glass Gray2']} />
                            <mesh name="mesh_117_2" geometry={nodes.mesh_117_2.geometry} material={nodes.mesh_117_2.material} />
                        </group>
                        <mesh name="entry_wall_0" area={83} geometry={nodes.entry_wall_0.geometry} material={nodes.entry_wall_0.material} />
                        <mesh name="entry_wall_1" area={253} geometry={nodes.entry_wall_1.geometry} material={nodes.entry_wall_1.material} />
                        <group name="stairs_skirt_0">
                            <mesh name="mesh_120" geometry={nodes.mesh_120.geometry} material={nodes.mesh_120.material} />
                            <mesh name="mesh_120_1" geometry={nodes.mesh_120_1.geometry} material={nodes.mesh_120_1.material} />
                        </group>
                        <mesh name="stairs_treads_0" geometry={nodes.stairs_treads_0.geometry} material={nodes.stairs_treads_0.material} />
                        <mesh name="stairs_treads_0_1" geometry={nodes.stairs_treads_0_1.geometry} material={nodes.stairs_treads_0_1.material} />
                        <mesh name="stairs_treads_0_2" geometry={nodes.stairs_treads_0_2.geometry} material={nodes.stairs_treads_0_2.material} />
                        <mesh name="stairs_treads_0_3" geometry={nodes.stairs_treads_0_3.geometry} material={nodes.stairs_treads_0_3.material} />
                        <mesh name="stairs_treads_0_4" geometry={nodes.stairs_treads_0_4.geometry} material={nodes.stairs_treads_0_4.material} />
                        <mesh name="stairs_treads_0_5" geometry={nodes.stairs_treads_0_5.geometry} material={nodes.stairs_treads_0_5.material} />
                        <mesh name="stairs_treads_0_6" geometry={nodes.stairs_treads_0_6.geometry} material={nodes.stairs_treads_0_6.material} />
                        <mesh name="stairs_treads_0_7" geometry={nodes.stairs_treads_0_7.geometry} material={nodes.stairs_treads_0_7.material} />
                        <mesh name="stairs_treads_0_8" geometry={nodes.stairs_treads_0_8.geometry} material={nodes.stairs_treads_0_8.material} />
                        <mesh name="stairs_treads_0_9" geometry={nodes.stairs_treads_0_9.geometry} material={nodes.stairs_treads_0_9.material} />
                        <mesh name="stairs_treads_0_10" geometry={nodes.stairs_treads_0_10.geometry} material={nodes.stairs_treads_0_10.material} />
                        <mesh name="stairs_treads_0_11" geometry={nodes.stairs_treads_0_11.geometry} material={nodes.stairs_treads_0_11.material} />
                        <mesh name="stairs_treads_0_12" geometry={nodes.stairs_treads_0_12.geometry} material={nodes.stairs_treads_0_12.material} />
                        <mesh name="stairs_treads_0_13" geometry={nodes.stairs_treads_0_13.geometry} material={nodes.stairs_treads_0_13.material} />
                        <mesh name="stairs_treads_0_14" geometry={nodes.stairs_treads_0_14.geometry} material={nodes.stairs_treads_0_14.material} />
                        <mesh name="stairs_treads_0_15" geometry={nodes.stairs_treads_0_15.geometry} material={nodes.stairs_treads_0_15.material} />
                        <mesh name="stairs_treads_0_16" geometry={nodes.stairs_treads_0_16.geometry} material={nodes.stairs_treads_0_16.material} />
                        <mesh name="stairs_treads_0_17" geometry={nodes.stairs_treads_0_17.geometry} material={nodes.stairs_treads_0_17.material} />
                        <mesh name="stairs_treads_0_18" geometry={nodes.stairs_treads_0_18.geometry} material={nodes.stairs_treads_0_18.material} />
                        <mesh name="stairs_treads_0_19" geometry={nodes.stairs_treads_0_19.geometry} material={nodes.stairs_treads_0_19.material} />
                        <mesh name="stairs_treads_0_20" geometry={nodes.stairs_treads_0_20.geometry} material={nodes.stairs_treads_0_20.material} />
                        <mesh name="stairs_risers_0" geometry={nodes.stairs_risers_0.geometry} material={nodes.stairs_risers_0.material} />
                        <mesh name="stairs_risers_0_1" geometry={nodes.stairs_risers_0_1.geometry} material={nodes.stairs_risers_0_1.material} />
                        <mesh name="stairs_risers_0_2" geometry={nodes.stairs_risers_0_2.geometry} material={nodes.stairs_risers_0_2.material} />
                        <mesh name="stairs_risers_0_3" geometry={nodes.stairs_risers_0_3.geometry} material={nodes.stairs_risers_0_3.material} />
                        <mesh name="stairs_risers_0_4" geometry={nodes.stairs_risers_0_4.geometry} material={nodes.stairs_risers_0_4.material} />
                        <mesh name="stairs_risers_0_5" geometry={nodes.stairs_risers_0_5.geometry} material={nodes.stairs_risers_0_5.material} />
                        <mesh name="stairs_risers_0_6" geometry={nodes.stairs_risers_0_6.geometry} material={nodes.stairs_risers_0_6.material} />
                        <mesh name="stairs_risers_0_7" geometry={nodes.stairs_risers_0_7.geometry} material={nodes.stairs_risers_0_7.material} />
                        <mesh name="stairs_risers_0_8" geometry={nodes.stairs_risers_0_8.geometry} material={nodes.stairs_risers_0_8.material} />
                        <mesh name="stairs_risers_0_9" geometry={nodes.stairs_risers_0_9.geometry} material={nodes.stairs_risers_0_9.material} />
                        <mesh name="stairs_risers_0_10" geometry={nodes.stairs_risers_0_10.geometry} material={nodes.stairs_risers_0_10.material} />
                        <mesh name="stairs_risers_0_11" geometry={nodes.stairs_risers_0_11.geometry} material={nodes.stairs_risers_0_11.material} />
                        <mesh name="stairs_risers_0_12" geometry={nodes.stairs_risers_0_12.geometry} material={nodes.stairs_risers_0_12.material} />
                        <mesh name="stairs_risers_0_13" geometry={nodes.stairs_risers_0_13.geometry} material={nodes.stairs_risers_0_13.material} />
                        <mesh name="stairs_risers_0_14" geometry={nodes.stairs_risers_0_14.geometry} material={nodes.stairs_risers_0_14.material} />
                        <mesh name="stairs_risers_0_15" geometry={nodes.stairs_risers_0_15.geometry} material={nodes.stairs_risers_0_15.material} />
                        <mesh name="stairs_risers_0_16" geometry={nodes.stairs_risers_0_16.geometry} material={nodes.stairs_risers_0_16.material} />
                        <mesh name="stairs_risers_0_17" geometry={nodes.stairs_risers_0_17.geometry} material={nodes.stairs_risers_0_17.material} />
                        <mesh name="stairs_risers_0_18" geometry={nodes.stairs_risers_0_18.geometry} material={nodes.stairs_risers_0_18.material} />
                        <mesh name="stairs_risers_0_19" geometry={nodes.stairs_risers_0_19.geometry} material={nodes.stairs_risers_0_19.material} />
                        <mesh name="stairs_risers_0_20" geometry={nodes.stairs_risers_0_20.geometry} material={nodes.stairs_risers_0_20.material} />
                        <mesh name="stairs_risers_0_21" geometry={nodes.stairs_risers_0_21.geometry} material={nodes.stairs_risers_0_21.material} />
                        <mesh name="dining_beam_0" geometry={nodes.dining_beam_0.geometry} material={nodes.dining_beam_0.material} />
                        <mesh name="stairs_wall_0" geometry={nodes.stairs_wall_0.geometry} material={nodes.stairs_wall_0.material} />
                        <group name="stairs_wall_1">
                            <mesh name="mesh_167" geometry={nodes.mesh_167.geometry} material={nodes.mesh_167.material} />
                            <mesh name="mesh_167_1" geometry={nodes.mesh_167_1.geometry} material={materials['0136_Charcoal']} />
                            <mesh name="stair_handrail_0" geometry={nodes.stair_handrail_0.geometry} material={nodes.stair_handrail_0.material} />
                        </group>
                        <mesh name="stairs_wall_2" area={60} geometry={nodes.stairs_wall_2.geometry} material={nodes.stairs_wall_2.material} />
                        <mesh name="wc_wall_0" geometry={nodes.wc_wall_0.geometry} material={nodes.wc_wall_0.material} />
                        <mesh name="wc_wall_1" geometry={nodes.wc_wall_1.geometry} material={nodes.wc_wall_1.material} />
                        <mesh name="wc_wall_2" geometry={nodes.wc_wall_2.geometry} material={nodes.wc_wall_2.material} />
                        <mesh name="wc_wall_3" geometry={nodes.wc_wall_3.geometry} material={nodes.wc_wall_3.material} />
                        <mesh name="wc_floor_0" geometry={nodes.wc_floor_0.geometry} material={materials['Marble Carrara Floor Tile']} />
                        <mesh name="wc_ceiling_0" geometry={nodes.wc_ceiling_0.geometry} material={nodes.wc_ceiling_0.material} />
                        <mesh name="corridor_wall_1" area={45} geometry={nodes.corridor_wall_1.geometry} material={nodes.corridor_wall_1.material} />
                        <mesh name="corridor_wall_0" area={80} geometry={nodes.corridor_wall_0.geometry} material={nodes.corridor_wall_0.material} />
                        <mesh name="wc_studs_0" geometry={nodes.wc_studs_0.geometry} material={nodes.wc_studs_0.material} />
                        <mesh name="corridor_wall_2" area={51} geometry={nodes.corridor_wall_2.geometry} material={nodes.corridor_wall_2.material} />
                        <mesh name="mud_studs_0" geometry={nodes.mud_studs_0.geometry} material={nodes.mud_studs_0.material} />
                        <mesh name="mud_wall_0" geometry={nodes.mud_wall_0.geometry} material={nodes.mud_wall_0.material} />
                        <mesh name="mud_wall_1" geometry={nodes.mud_wall_1.geometry} material={nodes.mud_wall_1.material} />
                        <mesh name="mud_wall_2" geometry={nodes.mud_wall_2.geometry} material={nodes.mud_wall_2.material} />
                        <mesh name="mud_wall_3" geometry={nodes.mud_wall_3.geometry} material={nodes.mud_wall_3.material} />
                        <mesh name="mud_wall_4" geometry={nodes.mud_wall_4.geometry} material={nodes.mud_wall_4.material} />
                        <mesh name="mud_wall_5" geometry={nodes.mud_wall_5.geometry} material={nodes.mud_wall_5.material} />
                        <mesh name="corridor_wall_3" area={16} geometry={nodes.corridor_wall_3.geometry} material={nodes.corridor_wall_3.material} />
                        <mesh name="corridor_wall_4" area={25} geometry={nodes.corridor_wall_4.geometry} material={nodes.corridor_wall_4.material} />
                        <mesh name="kitchen_wall_0" area={6} geometry={nodes.kitchen_wall_0.geometry} material={nodes.kitchen_wall_0.material} />
                        <mesh name="kitchen_wall_1" area={22} geometry={nodes.kitchen_wall_1.geometry} material={nodes.kitchen_wall_1.material} />
                        <mesh name="kitchen_wall_2" area={105} geometry={nodes.kitchen_wall_2.geometry} material={nodes.kitchen_wall_2.material} />
                        <mesh name="kitchen_wall_3" area={30} geometry={nodes.kitchen_wall_3.geometry} material={nodes.kitchen_wall_3.material} />
                        <mesh name="corridor_wall_5" area={64} geometry={nodes.corridor_wall_5.geometry} material={nodes.corridor_wall_5.material} />
                        <mesh name="corridor_wall_6" area={39} geometry={nodes.corridor_wall_6.geometry} material={nodes.corridor_wall_6.material} />
                        <mesh name="corridor_wall_7" area={20} geometry={nodes.corridor_wall_7.geometry} material={nodes.corridor_wall_7.material} />
                        <mesh name="mbed_studs_0" geometry={nodes.mbed_studs_0.geometry} material={nodes.mbed_studs_0.material} />
                        <mesh name="mbed_wall_0" geometry={nodes.mbed_wall_0.geometry} material={nodes.mbed_wall_0.material} />
                        <mesh name="mbed_wall_1" geometry={nodes.mbed_wall_1.geometry} material={nodes.mbed_wall_1.material} />
                        <mesh name="mbed_wall_2" geometry={nodes.mbed_wall_2.geometry} material={nodes.mbed_wall_2.material} />
                        <mesh name="mbed_wall_3" geometry={nodes.mbed_wall_3.geometry} material={nodes.mbed_wall_3.material} />
                        <mesh name="mbath_studs_0" geometry={nodes.mbath_studs_0.geometry} material={nodes.mbath_studs_0.material} />
                        <mesh name="mbath_wall_0" geometry={nodes.mbath_wall_0.geometry} material={nodes.mbath_wall_0.material} />
                        <mesh name="mbath_wall_1" geometry={nodes.mbath_wall_1.geometry} material={nodes.mbath_wall_1.material} />
                        <group name="mbath_wc_studs_0">
                            <mesh name="mesh_203" geometry={nodes.mesh_203.geometry} material={nodes.mesh_203.material} />
                            <mesh name="mesh_203_1" geometry={nodes.mesh_203_1.geometry} material={nodes.mesh_203_1.material} />
                        </group>
                        <mesh name="mbath_wc_wall_1" geometry={nodes.mbath_wc_wall_1.geometry} material={nodes.mbath_wc_wall_1.material} />
                        <mesh name="mbath_wc_wall_0" geometry={nodes.mbath_wc_wall_0.geometry} material={nodes.mbath_wc_wall_0.material} />
                        <mesh name="mbath_wc_wall_2" geometry={nodes.mbath_wc_wall_2.geometry} material={nodes.mbath_wc_wall_2.material} />
                        <mesh name="mbath_wc_wall_3" geometry={nodes.mbath_wc_wall_3.geometry} material={nodes.mbath_wc_wall_3.material} />
                        <mesh name="mbath_wall_2" geometry={nodes.mbath_wall_2.geometry} material={nodes.mbath_wall_2.material} />
                        <mesh name="mbath_wall_3" geometry={nodes.mbath_wall_3.geometry} material={nodes.mbath_wall_3.material} />
                        <mesh name="mbath_wic_studs_0" geometry={nodes.mbath_wic_studs_0.geometry} material={nodes.mbath_wic_studs_0.material} />
                        <mesh name="mbath_wic_wall_0" geometry={nodes.mbath_wic_wall_0.geometry} material={nodes.mbath_wic_wall_0.material} />
                        <mesh name="mbath_wic_wall_1" geometry={nodes.mbath_wic_wall_1.geometry} material={nodes.mbath_wic_wall_1.material} />
                        <mesh name="mbath_wic_wall_2" geometry={nodes.mbath_wic_wall_2.geometry} material={nodes.mbath_wic_wall_2.material} />
                        <mesh name="mbath_wic_wall_3" geometry={nodes.mbath_wic_wall_3.geometry} material={nodes.mbath_wic_wall_3.material} />
                        <mesh name="mbath_wic_wall_4" geometry={nodes.mbath_wic_wall_4.geometry} material={nodes.mbath_wic_wall_4.material} />
                        <mesh name="mbath_wic_wall_5" geometry={nodes.mbath_wic_wall_5.geometry} material={nodes.mbath_wic_wall_5.material} />
                        <mesh name="mbath_wic_wall_6" geometry={nodes.mbath_wic_wall_6.geometry} material={nodes.mbath_wic_wall_6.material} />
                        <mesh name="mbath_wic_wall_7" geometry={nodes.mbath_wic_wall_7.geometry} material={nodes.mbath_wic_wall_7.material} />
                        <mesh name="mbath_wall_4" geometry={nodes.mbath_wall_4.geometry} material={nodes.mbath_wall_4.material} />
                        <mesh name="mbath_wall_5" geometry={nodes.mbath_wall_5.geometry} material={nodes.mbath_wall_5.material} />
                        <mesh name="living_wall_4" area={171} geometry={nodes.living_wall_4.geometry} material={nodes.living_wall_4.material} />
                        <mesh name="living_wall_5" area={280} geometry={nodes.living_wall_5.geometry} material={nodes.living_wall_5.material} />
                        <mesh name="living_wall_6" area={28} geometry={nodes.living_wall_6.geometry} material={nodes.living_wall_6.material} />
                        <mesh name="dining_wall_1" area={16} geometry={nodes.dining_wall_1.geometry} material={nodes.dining_wall_1.material} />
                        <mesh name="dining_wall_0" area={265} geometry={nodes.dining_wall_0.geometry} material={nodes.dining_wall_0.material} />
                        <mesh name="living_wall_o" area={16} geometry={nodes.living_wall_o.geometry} material={nodes.living_wall_o.material} />
                        <mesh name="living_wall_1" area={100} geometry={nodes.living_wall_1.geometry} material={nodes.living_wall_1.material} />
                        <mesh name="living_wall_2" area={16} geometry={nodes.living_wall_2.geometry} material={nodes.living_wall_2.material} />
                        <mesh name="living_wall_3" area={120} geometry={nodes.living_wall_3.geometry} material={nodes.living_wall_3.material} />
                        <mesh name="fireplace_mantel_0" geometry={nodes.fireplace_mantel_0.geometry} material={nodes.fireplace_mantel_0.material} />
                        <mesh name="fireplace_wall_0" geometry={nodes.fireplace_wall_0.geometry} material={nodes.fireplace_wall_0.material} />
                        <mesh name="fireplace_wall_1" geometry={nodes.fireplace_wall_1.geometry} material={nodes.fireplace_wall_1.material} />
                        <mesh name="fireplace_wall_2" geometry={nodes.fireplace_wall_2.geometry} material={nodes.fireplace_wall_2.material} />
                        <mesh name="fireplace_surround_0" geometry={nodes.fireplace_surround_0.geometry} material={nodes.fireplace_surround_0.material} />
                        <mesh name="fireplace_surround_1" geometry={nodes.fireplace_surround_1.geometry} material={nodes.fireplace_surround_1.material} />
                        <mesh name="fireplace_surround_2" geometry={nodes.fireplace_surround_2.geometry} material={nodes.fireplace_surround_2.material} />
                        <mesh name="fireplace_throat_0" geometry={nodes.fireplace_throat_0.geometry} material={nodes.fireplace_throat_0.material} />
                        <mesh name="fireplace_cladding_0" geometry={nodes.fireplace_cladding_0.geometry} material={materials['Granite Dark Gray']} />
                        <mesh name="mbath_floor_0" geometry={nodes.mbath_floor_0.geometry} material={nodes.mbath_floor_0.material} />
                        <mesh name="mbath_wc_floor_0" geometry={nodes.mbath_wc_floor_0.geometry} material={materials['Marble Carrara Gold Floor Tile']} />
                        <mesh name="mbath_wic_floor_0" geometry={nodes.mbath_wic_floor_0.geometry} material={materials['Suede Dark Gray']} />
                        <mesh name="mbath_ceiling_0" geometry={nodes.mbath_ceiling_0.geometry} material={nodes.mbath_ceiling_0.material} />
                        <mesh name="mbath_wc_ceiling_0" geometry={nodes.mbath_wc_ceiling_0.geometry} material={nodes.mbath_wc_ceiling_0.material} />
                        <mesh name="mbath_wic_ceiling_0" geometry={nodes.mbath_wic_ceiling_0.geometry} material={nodes.mbath_wic_ceiling_0.material} />
                        <mesh name="mbed_ceiling_0" geometry={nodes.mbed_ceiling_0.geometry} material={nodes.mbed_ceiling_0.material} />
                        <mesh name="kitchen_ceiling_0" geometry={nodes.kitchen_ceiling_0.geometry} material={nodes.kitchen_ceiling_0.material} />
                        <mesh name="dining_ceiling_0" geometry={nodes.dining_ceiling_0.geometry} material={nodes.dining_ceiling_0.material} />
                        <mesh name="balcony_joist_0" geometry={nodes.balcony_joist_0.geometry} material={nodes.balcony_joist_0.material} />
                        <mesh name="balcony_facia_0" geometry={nodes.balcony_facia_0.geometry} material={nodes.balcony_facia_0.material} />
                        <mesh name="balcony_facia_1" geometry={nodes.balcony_facia_1.geometry} material={nodes.balcony_facia_1.material} />
                        <mesh name="balcony_facia_2" geometry={nodes.balcony_facia_2.geometry} material={nodes.balcony_facia_2.material} />
                        <mesh name="living_ceiling_0" geometry={nodes.living_ceiling_0.geometry} material={nodes.living_ceiling_0.material} />
                        <mesh name="mud_ceiling_0" geometry={nodes.mud_ceiling_0.geometry} material={nodes.mud_ceiling_0.material} />
                        <mesh name="landing_skirts_0" geometry={nodes.landing_skirts_0.geometry} material={nodes.landing_skirts_0.material} />
                        <mesh name="landing_wall_0" geometry={nodes.landing_wall_0.geometry} material={nodes.landing_wall_0.material} />
                        <mesh name="lanfing_wall_2" geometry={nodes.lanfing_wall_2.geometry} material={nodes.lanfing_wall_2.material} />
                        <mesh name="lanfing_wall_3" geometry={nodes.lanfing_wall_3.geometry} material={nodes.lanfing_wall_3.material} />
                        <mesh name="lanfing_wall_4" geometry={nodes.lanfing_wall_4.geometry} material={nodes.lanfing_wall_4.material} />
                        <mesh name="lanfing_wall_5" geometry={nodes.lanfing_wall_5.geometry} material={nodes.lanfing_wall_5.material} />
                        <mesh name="lanfing_wall_6" geometry={nodes.lanfing_wall_6.geometry} material={nodes.lanfing_wall_6.material} />
                        <mesh name="lanfing_wall_7" geometry={nodes.lanfing_wall_7.geometry} material={nodes.lanfing_wall_7.material} />
                        <mesh name="bed_studs_0" geometry={nodes.bed_studs_0.geometry} material={nodes.bed_studs_0.material} />
                        <mesh name="bed_wall_0" geometry={nodes.bed_wall_0.geometry} material={nodes.bed_wall_0.material} />
                        <mesh name="bed_wall_2" geometry={nodes.bed_wall_2.geometry} material={nodes.bed_wall_2.material} />
                        <mesh name="bed_wall_3" geometry={nodes.bed_wall_3.geometry} material={nodes.bed_wall_3.material} />
                        <mesh name="loft_studs_0" geometry={nodes.loft_studs_0.geometry} material={nodes.loft_studs_0.material} />
                        <mesh name="loft_wall_0" geometry={nodes.loft_wall_0.geometry} material={nodes.loft_wall_0.material} />
                        <mesh name="loft_wall_1" geometry={nodes.loft_wall_1.geometry} material={nodes.loft_wall_1.material} />
                        <mesh name="loft_wall_2" geometry={nodes.loft_wall_2.geometry} material={nodes.loft_wall_2.material} />
                        <mesh name="loft_wall_3" geometry={nodes.loft_wall_3.geometry} material={nodes.loft_wall_3.material} />
                        <mesh name="loft_wall_4" geometry={nodes.loft_wall_4.geometry} material={nodes.loft_wall_4.material} />
                        <mesh name="loft_wall_5" geometry={nodes.loft_wall_5.geometry} material={nodes.loft_wall_5.material} />
                        <mesh name="loft_studs_1" geometry={nodes.loft_studs_1.geometry} material={nodes.loft_studs_1.material} />
                        <mesh name="loft_ceiling_0" geometry={nodes.loft_ceiling_0.geometry} material={nodes.loft_ceiling_0.material} />
                        <mesh name="bath_studs_0" geometry={nodes.bath_studs_0.geometry} material={nodes.bath_studs_0.material} />
                        <mesh name="bath_wall_0" geometry={nodes.bath_wall_0.geometry} material={nodes.bath_wall_0.material} />
                        <mesh name="bath_wall_1" geometry={nodes.bath_wall_1.geometry} material={nodes.bath_wall_1.material} />
                        <mesh name="bath_wall_2" geometry={nodes.bath_wall_2.geometry} material={nodes.bath_wall_2.material} />
                        <mesh name="bath_wall_3" geometry={nodes.bath_wall_3.geometry} material={nodes.bath_wall_3.material} />
                        <mesh name="bath_wall_4" geometry={nodes.bath_wall_4.geometry} material={nodes.bath_wall_4.material} />
                        <mesh name="bath_wall_5" geometry={nodes.bath_wall_5.geometry} material={nodes.bath_wall_5.material} />
                        <mesh name="bath_ceiling_0" geometry={nodes.bath_ceiling_0.geometry} material={nodes.bath_ceiling_0.material} />
                        <mesh name="bath_floor_0" geometry={nodes.bath_floor_0.geometry} material={nodes.bath_floor_0.material} />
                        <mesh name="second_floor_0" geometry={nodes.second_floor_0.geometry} material={nodes.second_floor_0.material} />
                        <mesh name="first_floor_0" geometry={nodes.first_floor_0.geometry} material={nodes.first_floor_0.material} />
                        <group name="out_stairs_0">
                            <mesh name="mesh_286" geometry={nodes.mesh_286.geometry} material={nodes.mesh_286.material} />
                            <mesh name="mesh_286_1" geometry={nodes.mesh_286_1.geometry} material={nodes.mesh_286_1.material} />
                        </group>
                        <mesh name="out_floor_0" geometry={nodes.out_floor_0.geometry} material={materials.out_floor_texture} />
                        <group name="out_roofs_beam_0">
                            <mesh name="mesh_288" geometry={nodes.mesh_288.geometry} material={nodes.mesh_288.material} />
                            <mesh name="mesh_288_1" geometry={nodes.mesh_288_1.geometry} material={nodes.mesh_288_1.material} />
                        </group>
                        <mesh name="out_fireplace_walls_0" geometry={nodes.out_fireplace_walls_0.geometry} material={materials['Brick Tumbled']} />
                        <mesh name="landing_ceiling_0" geometry={nodes.landing_ceiling_0.geometry} material={nodes.landing_ceiling_0.material} />
                        <group name="out_roofs_0">
                            <mesh name="mesh_291" geometry={nodes.mesh_291.geometry} material={nodes.mesh_291.material} />
                            <mesh name="mesh_291_1" geometry={nodes.mesh_291_1.geometry} material={nodes.mesh_291_1.material} />
                        </group>
                        <mesh name="balcony_floor_skirt_0" geometry={nodes.balcony_floor_skirt_0.geometry} material={nodes.balcony_floor_skirt_0.material} />
                        <mesh name="lanfing_wall_1" geometry={nodes.lanfing_wall_1.geometry} material={nodes.lanfing_wall_1.material} />
                        <mesh name="bed_ceiling_0" geometry={nodes.bed_ceiling_0.geometry} material={nodes.bed_ceiling_0.material} />
                        <mesh name="bed_wall_3_1" geometry={nodes.bed_wall_3_1.geometry} material={nodes.bed_wall_3_1.material} />
                        <group name="out_walls_0">
                            <mesh name="mesh_296" geometry={nodes.mesh_296.geometry} material={materials.out_walls_texture} />
                            <mesh name="mesh_296_1" geometry={nodes.mesh_296_1.geometry} material={nodes.mesh_296_1.material} />
                        </group>
                        <mesh name="stair_handrail_1" geometry={nodes.stair_handrail_1.geometry} material={nodes.stair_handrail_1.material} />
                    </group>
                </group>

                <mesh ref={marker} name="marker" position={markerPos} >
                    <planeGeometry args={[.4, .4, 1, 1]} />
                    <meshBasicMaterial transparent={true} opacity={.5} depthWrite={false} map={texture} />
                </mesh>
            </group>

            <PerspectiveCamera ref={cameraRef} makeDefault position={initialCameraPos} fov={50} near={0.01} far={1500} />
            <AnimatedNavigation cameraPosition={spring.pos} />
            <AnimatedOrbitControls ref={orbitControls} target={initialControlsTarget} enableZoom={true} enablePan={true} maxPolarAngle={Math.PI} dampingFactor={0.065} />
        </>
    )
}


const AsyncModels = () => {
    // const posX = useControl('Pos X', { type: 'number', group: 'MESH', min: -20, max: 20 })
    // const posY = useControl('Pos Y', { type: 'number', group: 'MESH', min: -20, max: 20 })
    // const posZ = useControl('Pos Z', { type: 'number', group: 'MESH', min: -20, max: 20 })

    return (
        <mesh>
            <Model />
        </mesh>
    )
}

const PointLight = () => {
    const posX = 3.73 // useControl('Pos X', { type: 'number', group: 'LIGHT', value: 3.73, min: -20, max: 20 })
    const posY = 1.87 // useControl('Pos Y', { type: 'number', group: 'LIGHT', value: 1.87, min: -20, max: 20 })
    const posZ = -4.13 // useControl('Pos Z', { type: 'number', group: 'LIGHT', value: , min: -20, max: 20 })

    return (
        <>
            <pointLight position={[posX, posY, posZ]} />
        </>
    )
}

const AmbLight = () => {
    return (
        <ambientLight intensity={0.5} />
    )
}

const Picker = () => {
    const snap = useSnapshot(state)
    const scrollRef = useRef(null)

    const options = [
        {
            id: 'ceiling_1',
            name: 'Tradizione Italiana',
            type: 'Vinyl',
            brightness: '0.72',
            durability: '0.98',
            price: 11,
            eco: '★★★☆☆',
            ecoIndex: 3,
            link: 'https://www.wallcover.com/953723-memory-2-as-creation-non-woven-wallpaper.html'
        },
        {
            id: 'ceiling_2',
            name: 'Satin Flowers',
            type: 'Vinyl',
            brightness: '0.93',
            durability: '0.95',
            price: 9,
            eco: '★★★☆☆',
            ecoIndex: 3,
            link: 'https://www.wallcover.com/384831-wallpaper-jungle-monkey-monstera-leaves-tendrils-gray-white.html'
        },
        {
            id: 'wallpaper_1',
            name: 'Tradizione Italiana',
            type: 'Vinyl',
            brightness: '0.72',
            durability: '0.98',
            price: 11,
            eco: '★★★☆☆',
            ecoIndex: 3,
            link: 'https://www.wallcover.com/953723-memory-2-as-creation-non-woven-wallpaper.html'
        },
        {
            id: 'wallpaper_2',
            name: 'Satin Flowers',
            type: 'Vinyl',
            brightness: '0.93',
            durability: '0.95',
            price: 9,
            eco: '★★★☆☆',
            ecoIndex: 3,
            link: 'https://www.wallcover.com/384831-wallpaper-jungle-monkey-monstera-leaves-tendrils-gray-white.html'
        },
        {
            id: 'wallpaper_3',
            name: 'Elite',
            type: 'Flock',
            brightness: '0.67',
            durability: '0.81',
            price: 17,
            eco: '★★★★☆',
            ecoIndex: 4,
            link: 'https://www.wallcover.com/32615-city-glam-marburg-wallpaper.html'
        },
        {
            id: 'wallpaper_4',
            name: 'Splendida',
            type: 'Paper',
            brightness: '0.34',
            durability: '0.72',
            price: 14,
            eco: '★★★★★',
            link: 'https://www.wallcover.com/17140-van-gogh-bn-wallcoverings-non-woven-wallpaper.html'
        },
        {
            id: 'wallpaper_5',
            name: 'Metropolis',
            type: 'Paper',
            brightness: '0.90',
            durability: '0.68',
            eco: '★★★★★',
            ecoIndex: 5,
            link: 'https://www.wallcover.com/384811-wallpaper-flowers-birds-blossoms-red-yellow-gray.html'
        },
        {
            id: 'wallpaper_6',
            name: 'Villa Dorata',
            type: 'Vinyl',
            brightness: '0.53',
            durability: '0.93',
            price: 12,
            eco: '★★★☆☆',
            ecoIndex: 3,
            link: 'https://www.wallcover.com/384821-wallpaper-jungle-monstera-leaves-tendrils-green-white.html'
        },
        {
            id: 'wallpaper_7',
            name: 'Unica',
            type: 'Vinyl',
            brightness: '0.81',
            durability: '0.96',
            price: 10,
            eco: '★★★☆☆',
            ecoIndex: 3,
            link: 'https://www.wallcover.com/935834-versace-home-as-creation-satin-wallpaper.html'
        },
        {
            id: 'wallpaper_8',
            name: 'Nova',
            type: 'Paper',
            brightness: '0.46',
            durability: '0.65',
            price: 15,
            eco: '★★★★★',
            ecoIndex: 5,
            link: 'https://www.wallcover.com/53126-la-veneziana-2-marburg-non-woven-wallpaper.html'
        }
    ]

    const styles = {
        dashboard: {
            display: 'flex',
            margin: 20,
            padding: 10,
            borderRadius: 14,
            position: 'absolute',
            top: 0,
            light: 0,
            backgroundColor: '#F5F5F59A',
            backdropFilter: 'blur(20px)'
        },
        owner: {
            // fontWeight: 'normal',
            // fontSize: 14,
            // color: '##1d1d1f'
        },
        sortView: {
            position: 'absolute',
            top: 0,
            right: 0,
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            width: 280,
            borderRadius: 14,
            marginRight: 20,
            marginTop: 10,
            backgroundColor: '#F5F5F59A',
            backdropFilter: 'blur(20px)',
        },
        sortLabel: {
            fontWeight: 'normal',
            fontSize: 17,
            color: '#1d1d1f',
            margin: 3,
        },

        menu: {
            width: 200,
            height: 'calc(100% - 40px)',
            margin: 20,
            borderRadius: 14,
            position: 'absolute',
            top: 0,
            right: 0,
            backgroundColor: '#F5F5F59A',
            backdropFilter: 'blur(20px)',
            overflowY: 'scroll'
        },
        card: {
            height: '180px',
            borderRadius: 10,
            margin: 10,
            boxShadow: "0px 0px 5px #9E9E9E",
            overflow: 'hidden',
            backgroundColor: '#F9F9F9C8',
        },
        material: {
            width: '100%',
        },
        descripiton: {
            margin: 10
        },
        details: {
            fontWeight: 'normal',
            fontSize: 14,
            color: '#1d1d1f',
            margin: 3,
        },
        score: {
            fontWeight: 'normal',
            fontSize: 14,
            color: '#34c759'
        },
        buy: {
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            width: 61,
            height: 36,
            color: '#fff',
            textDecoration: 'none',
            backgroundColor: '#0071e3',
            borderRadius: 18
        },
        more: {
            color: '#06c',
            textDecoration: 'none',
            marginRight: 10
        }
    }

    options.forEach(e => {
        e.lIndex = Math.floor((Math.abs(+e.brightness - +snap.building.lighting) + 0.06) * 100) / 100
        e.dIndex = (Math.floor((+e.durability / (+snap.building.heating / +snap.building.area)) * 100) / 200)
    })

    if (snap.sort === 'best') {
        options.sort((a, b) => (a.lIndex + a.dIndex + (a.eco / 5)) < (b.lIndex + b.dIndex + (b.eco / 5)) ? 1 : -1)
    } else if (snap.sort === 'eco') {
        options.sort((a, b) => a.eco < b.eco ? -1 : 1)
    } else if (snap.sort === 'light') {
        options.sort((a, b) => a.lIndex < b.lIndex ? 1 : -1)
    } else if (snap.sort === 'durability') {
        options.sort((a, b) => a.dIndex < b.dIndex ? 1 : -1)
    }


    return (
        <>
            <div style={styles.dashboard}>
                <h2 style={{ margin: 0 }}>Total cost:</h2>
                <h2 style={{ color: '#34c759', margin: '0 0 0 5px' }}>€{Math.floor(snap.totalCost * 100) / 100}</h2>
            </div>

            {/* <div style={styles.sortView} >
                <div>
                    <h3 style={styles.sortLabel}>&nbsp;Sort:</h3>
                </div>
                <div onClick={() => (state.sort = 'best', scrollRef.current?.scrollIntoView({ behavior: "smooth" }))} style={{ margin: 5, borderRadius: 7, backgroundColor: snap.sort === 'best' ? '#fff' : 'transparent' }}>
                    <h3 style={{ fontWeight: 'normal', fontSize: 17, margin: 3, color: snap.sort === 'best' ? '#1d1d1f' : '#3c3c4399' }}>Best</h3>
                </div>
                <div onClick={() => (state.sort = 'eco', scrollRef.current?.scrollIntoView({ behavior: "smooth" }))} style={{ margin: 5, borderRadius: 7, backgroundColor: snap.sort === 'eco' ? '#fff' : 'transparent' }}>
                    <h3 style={{ fontWeight: 'normal', fontSize: 17, margin: 3, color: snap.sort === 'eco' ? '#1d1d1f' : '#3c3c4399' }}>Eco</h3>
                </div>
                <div onClick={() => (state.sort = 'light', scrollRef.current?.scrollIntoView({ behavior: "smooth" }))} style={{ margin: 5, borderRadius: 7, backgroundColor: snap.sort === 'light' ? '#fff' : 'transparent' }}>
                    <h3 style={{ fontWeight: 'normal', fontSize: 17, margin: 3, color: snap.sort === 'light' ? '#1d1d1f' : '#3c3c4399' }}>Light</h3>
                </div>
                <div onClick={() => (state.sort = 'durability', scrollRef.current?.scrollIntoView({ behavior: "smooth" }))} style={{ margin: 5, borderRadius: 7, backgroundColor: snap.sort === 'durability' ? '#fff' : 'transparent' }}>
                    <h3 style={{ fontWeight: 'normal', fontSize: 17, margin: 3, color: snap.sort === 'durability' ? '#1d1d1f' : '#3c3c4399' }}>Durability</h3>
                </div>
            </div> */}

            <div style={styles.menu} >
                <div style={{ display: 'flex', flexDirection: 'column' }} >
                    <div ref={scrollRef} ></div>
                    {options.map((e) => {
                        return (
                            <div onClick={() => (state.option = e.id, state.price = e.price)} style={styles.card} >
                                {/* <div> */}
                                <img src={`/${e.id}_img.jpg`} style={styles.material} />
                                {/* </div> */}
                                {/* <div style={styles.descripiton} >
                                    <h3 style={styles.details}>Collection: {e.name}</h3>
                                    <h3 style={styles.details}>Type: {e.type}</h3>
                                    <h3 style={styles.details}>Light index: {e.lIndex}</h3>
                                    <h3 style={styles.details}>Durability index: {e.dIndex}</h3>
                                    <h3 style={styles.details}>Cost (per roll): €{e.price}</h3>
                                    <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', marginTop: -10 }} >
                                        <h3 style={styles.details}>Eco-friendly:</h3>
                                        <h3 style={styles.score}>&nbsp;{e.eco}</h3>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }} >
                                        <a style={styles.buy} href={e.link} target = "_blank">Buy</a>
                                        <a style={styles.more} href={e.link} target = "_blank">{"Learn more >"}</a>
                                    </div>
                                </div> */}
                            </div>
                        )
                    })}
                </div>
            </div>
        </>
    )
}

const Loader = () => {
    const { active, progress, errors, item, loaded, total } = useProgress()
    return (
        <Html center>
            <h1 style={{ margin: 10, marginBottom: 0, color: '#FF5454' }} >{`${progress}%`}</h1>
        </Html>
    )
}

export const App = () => {
    return (
        <div style={{ position: 'fixed', height: '100vh', width: '100%' }} >
            <Canvas onCreated={state => state.gl.setClearColor(0x262626, 1)} >
                <PointLight />
                <AmbLight />
                <Suspense fallback={<Loader />}>
                    <AsyncModels />
                    {/* <Environment files={['px.png', 'nx.png', 'py.png', 'ny.png', 'pz.png', 'nz.png']} background={true} /> */}
                </Suspense>
            </Canvas>
            <Picker />
        </div>
    )
}