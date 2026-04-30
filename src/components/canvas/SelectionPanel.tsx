import {computeBoundingBox} from "@components/canvas/SelectionOverlay.tsx";
import {SelectInput} from "@components/properties/inputs/SelectInput.tsx";
import type {FillStyle, FormShape, Shape, ShapeType} from "@model/shapes.ts";
import {getActiveTheme} from "@model/theme.ts";
import {createShape} from "@utils/shapeFactory.ts";
import {selectSelectedShapes, useAppDispatch, useAppState} from "../../store";

interface SelectionPanelProps {
}

export function SelectionPanel({}: SelectionPanelProps) {
    const {state} = useAppState()
    const dispatch = useAppDispatch()
    const {ids} = state.selection
    const activePageId = state.activePageId
    if (ids.length === 0) return null
    const bbox = computeBoundingBox(state)
    if(!bbox) return null
    console.log("bbox",bbox)
    const width = 200
    const height = 100

    const selected = selectSelectedShapes(state)
    if(!selected || selected.length === 0) return null
    if(selected.length > 1) {
        return null
    }
    const shape = selected[0]
    const fill:FillStyle = (shape as FormShape) .fill

    const patchFill = (f: FillStyle) => dispatch({ type: 'PATCH_SHAPE', id: shape.id, patch: { fill: f } as Partial<Shape> })
    return (
        <div style={{position: 'absolute'}} id={'selection-panel'}>
            <div style={{
                background:'white',
                width:`${width}px`,
                height:`${height}px`,
                border:'black',
                borderWidth:'1',
                borderStyle:'solid',
                position:'absolute',
                left: 300,
                top:100,
            }}>
                <label>{shape.name}</label>
                <button
                    onClick={() => {
                        patchFill({
                            color:'red',
                            opacity:1.0,
                            gradient:null,
                        })
                    }}
                >red fill</button>
                <SelectInput label={'color'} value={fill.color} options={[
                    {value:'red',label:'Red',},
                    {value:'blue',label:'Blue'},
                    {value:'green',label:'Green'}
                ]} onChange={(v) => {
                    console.log("new color is",v)
                    patchFill({
                        color:v,
                        opacity:1.0,
                        gradient:null,
                    })
                }}/>
                <button
                    onClick={(e) => {
                        const parentId = activePageId
                        e.stopPropagation()
                        e.preventDefault()
                        let type = 'rect' as ShapeType
                        let localX = 100
                        let localY = 100
                        const newShape = createShape(type, localX, localY, getActiveTheme(state.document))
                        dispatch({ type: 'ADD_SHAPE', parentId, shape: newShape })
                    }}
                >add rect</button>
                <button
                    onPointerDown={e => e.stopPropagation()}
                    onPointerUp={e => e.stopPropagation()}
                    onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        dispatch({ type: 'DELETE_SHAPES', ids: ids })
                        dispatch({ type: 'DESELECT_ALL' })
                    }}
                >delete</button>
            </div>
        </div>
    )
}