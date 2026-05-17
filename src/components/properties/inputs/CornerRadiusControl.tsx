import type {CornerRadii} from "../../../model";
import {NumberInput} from "./NumberInput";

interface CornerRadiusControlProps {
    cornerRadius: number
    cornerRadii?: CornerRadii
    onChangeUniform: (v: number) => void
    onChangeRadii: (r: CornerRadii | undefined) => void
}

export function CornerRadiusControl({
                                        cornerRadius,
                                        cornerRadii,
                                        onChangeUniform,
                                        onChangeRadii
                                    }: CornerRadiusControlProps) {
    const perCorner = !!cornerRadii

    const togglePerCorner = () => {
        if (perCorner) {
            onChangeRadii(undefined)
        } else {
            onChangeRadii({
                topLeft: cornerRadius,
                topRight: cornerRadius,
                bottomRight: cornerRadius,
                bottomLeft: cornerRadius
            })
        }
    }

    return (
        <>
            <section className={'super'}>
                <label className={'s'}>Radius</label>
                <NumberInput
                    value={perCorner ? Math.round((cornerRadii!.topLeft + cornerRadii!.topRight + cornerRadii!.bottomRight + cornerRadii!.bottomLeft) / 4) : cornerRadius}
                    min={0}
                    onChange={v => {
                        if (perCorner) {
                            onChangeRadii({
                                topLeft: v,
                                topRight: v,
                                bottomRight: v,
                                bottomLeft: v
                            })
                        } else {
                            onChangeUniform(v)
                        }
                    }}
                    unit="px"
                />
                <button
                    onClick={togglePerCorner}
                    title={perCorner ? 'Use uniform radius' : 'Set per-corner radius'}
                    className={'mid2'}
                >⌗
                </button>
                {perCorner && (
                    <>
                        <label className={'s'}>TL</label>
                        <NumberInput value={cornerRadii!.topLeft} min={0}
                                     onChange={v => onChangeRadii({...cornerRadii!, topLeft: v})}
                                     unit="px"/>
                        <label className={'mid2'}>TR</label>
                        <NumberInput value={cornerRadii!.topRight} min={0}
                                     onChange={v => onChangeRadii({...cornerRadii!, topRight: v})}
                                     unit="px"/>
                        <label className={'s'}>BR</label>
                        <NumberInput value={cornerRadii!.bottomRight} min={0}
                                     onChange={v => onChangeRadii({...cornerRadii!, bottomRight: v})}
                                     unit="px"/>
                        <label className={'mid2'}>BL</label>
                        <NumberInput value={cornerRadii!.bottomLeft} min={0}
                                     onChange={v => onChangeRadii({...cornerRadii!, bottomLeft: v})}
                                     unit="px"/>
                    </>
                )}
            </section>
        </>
    )
}