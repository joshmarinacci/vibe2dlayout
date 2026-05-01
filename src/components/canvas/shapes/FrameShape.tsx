import {BoxShapeBase} from "@components/canvas/shapes/BoxShapeBase.tsx";
import {makeRoughRect} from "@components/canvas/shapes/formUtils.ts";
import { fillBackground } from '@utils/fillCSS'
import { strokeBorderCSS, cornerRadiiCSS } from '@utils/strokeStyleCSS'
import type { Dispatch } from 'react'
import type { FrameShape } from '@model/shapes'
import type { AppAction } from '@store/types'
import { RoughSvgPaths } from '@utils/RoughSvgPaths'

interface Props {
  shape: FrameShape
  isSelected: boolean
  dispatch: Dispatch<AppAction>
  onClick: (e: React.MouseEvent) => void
  onDoubleClick: (e: React.MouseEvent) => void
  children?: React.ReactNode
  handDrawn: boolean
}

export function FrameShapeComp({ shape, isSelected, onClick, onDoubleClick, children, handDrawn }: Props) {
  const { transform, fill, stroke, clipChildren } = shape
  const { width, height } = transform

  return (
      <BoxShapeBase shape={shape} isSelected={isSelected} onClick={onClick} onDoubleClick={onDoubleClick} clipChildren={clipChildren}>
      {handDrawn ? (
        <svg
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible' }}
          width={width}
          height={height}
        >
          <RoughSvgPaths paths={makeRoughRect(shape)} />
        </svg>
      ) : (
        <div style={{
          position: 'absolute',
          inset: 0,
          background: fillBackground(fill),
          ...strokeBorderCSS(stroke),
          borderRadius: cornerRadiiCSS(shape.cornerRadius ?? 0, shape.cornerRadii),
        }} />
      )}
      <div style={{ position: 'absolute', inset: 0 }}>
        {children}
      </div>
      </BoxShapeBase>
  )
}
