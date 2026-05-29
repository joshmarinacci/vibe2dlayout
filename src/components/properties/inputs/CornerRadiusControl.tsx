import type {CornerRadii} from "../../../model";
import {NumberInput} from "./NumberInput";
import {LockIcon, UnlockIcon} from "lucide-react";

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
            <label className={'left align-right'}>Radius</label>
            <NumberInput
                className={'right'}
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
                className={'gutter toggle ' + (perCorner ? 'selected' : 'non-selected')}
            >
                {perCorner?<UnlockIcon size={'12'}/>:<LockIcon size={'12'}/>}
            </button>
            {perCorner && (
                <>
                    <NumberInput
                        className={'left'}
                        label={"◜"}
                        value={cornerRadii!.topLeft} min={0}
                        onChange={v => onChangeRadii({...cornerRadii!, topLeft: v})}
                        unit="px"/>
                    <NumberInput
                        className={'right'}
                        label={"◝"}
                        value={cornerRadii!.topRight}
                        min={0}
                        onChange={v => onChangeRadii({...cornerRadii!, topRight: v})}
                        unit="px"/>
                    <NumberInput
                        className={'left'}
                        label={"◟"}
                        value={cornerRadii!.bottomLeft} min={0}
                        onChange={v => onChangeRadii({...cornerRadii!, bottomLeft: v})}
                        unit="px"/>
                    <NumberInput
                        className={'right'}
                        label={"◞"}
                        value={cornerRadii!.bottomRight} min={0}
                        onChange={v => onChangeRadii({...cornerRadii!, bottomRight: v})}
                        unit="px"/>
                </>
            )}
        </>
    )
}