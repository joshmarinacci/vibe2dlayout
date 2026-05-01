import type {MimeType} from '@model/shapes'

export interface ImageAsset {
    id: string
    name: string
    src: string         // base64 data URI OR http(s) URL
    mimeType: MimeType
    width?: number      // intrinsic pixel dimensions (known for uploaded files)
    height?: number
}
