import type {TextStyle} from '@model/shapes'
import type {CSSProperties} from 'react'
import {gradientCSS} from './fillCSS'

export function textStrokeCSS(text: Pick<TextStyle, 'stroke' | 'textStrokeGradient'>): CSSProperties {
    if (!text.stroke || text.stroke.width <= 0) return {}
    if (text.textStrokeGradient) return {}  // handled by textGradientSpanCSS
    return {
        WebkitTextStroke: `${text.stroke.width}px ${text.stroke.color}`,
    }
}

/**
 * Returns a CSSProperties fragment for all extra text styling fields.
 * Spread this into any style object that renders text.
 * NOTE: Does NOT include gradient styles — use textGradientSpanCSS for those.
 */
export function textExtraCSS(
    text: Pick<TextStyle, 'textShadow' | 'lineHeight' | 'letterSpacing' | 'textDecoration' | 'textTransform' | 'textGradient' | 'textStrokeGradient' | 'fontVariantCaps' | 'fontVariationSettings'>
): CSSProperties {
    const result: CSSProperties = {}
    // Skip textShadow when gradient is active — the gradient span handles it via
    // filter:drop-shadow so the shadow renders behind the gradient-clipped text.
    const hasGradient = !!(text.textGradient || text.textStrokeGradient)
    if (text.textShadow && !hasGradient) {
        const {offsetX, offsetY, blur, color} = text.textShadow
        result.textShadow = `${offsetX}px ${offsetY}px ${blur}px ${color}`
    }
    if (text.lineHeight != null) result.lineHeight = text.lineHeight
    if (text.letterSpacing != null) result.letterSpacing = `${text.letterSpacing}px`
    if (text.textDecoration && text.textDecoration !== 'none') result.textDecoration = text.textDecoration
    if (text.textTransform && text.textTransform !== 'none') result.textTransform = text.textTransform
    if (text.fontVariantCaps === 'small-caps') result.fontVariant = 'small-caps'
    if (text.fontVariationSettings && Object.keys(text.fontVariationSettings).length > 0) {
        result.fontVariationSettings = Object.entries(text.fontVariationSettings)
            .map(([tag, v]) => `'${tag}' ${v}`)
            .join(', ')
        if ('opsz' in text.fontVariationSettings) {
            result.fontOpticalSizing = 'none'
        }
    }
    return result
}

/**
 * Returns gradient CSS to apply to an inline <span> wrapping text content.
 * Using a <span> (inline element) ensures background-clip: text clips reliably.
 * Returns null when no gradient is set.
 *
 * Shadows: CSS paints text-shadow AFTER background (including background-clip:text),
 * so an inherited shadow sits on top of the gradient. We cancel it on this span and
 * use filter:drop-shadow instead, which is applied after compositing so it correctly
 * appears behind the visible gradient text.
 */
export function textGradientSpanCSS(
    text: Pick<TextStyle, 'textGradient' | 'textStrokeGradient' | 'stroke' | 'textShadow'>
): CSSProperties | null {
    const dropShadow = text.textShadow
        ? `drop-shadow(${text.textShadow.offsetX}px ${text.textShadow.offsetY}px ${text.textShadow.blur}px ${text.textShadow.color})`
        : undefined

    // Fill gradient takes full precedence
    if (text.textGradient) {
        return {
            display: 'inline-block',
            background: gradientCSS(text.textGradient),
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textShadow: 'none',
            ...(dropShadow ? {filter: dropShadow} : {}),
            // translateZ(0) forces a dedicated GPU compositing layer, which causes the
            // browser to re-apply background-clip on every repaint instead of using a
            // stale cached clip when the gradient angle/stops change.
            transform: 'translateZ(0)',
        }
    }
    // Stroke gradient: gradient shows on the stroke outline via paint-order + background-clip
    if (text.textStrokeGradient && text.stroke && text.stroke.width > 0) {
        return {
            display: 'inline-block',
            background: gradientCSS(text.textStrokeGradient),
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            WebkitTextStroke: `${text.stroke.width}px transparent`,
            paintOrder: 'stroke fill',
            textShadow: 'none',
            ...(dropShadow ? {filter: dropShadow} : {}),
            transform: 'translateZ(0)',
        }
    }
    return null
}

/**
 * Returns a stable key string that changes whenever the gradient CSS changes.
 * Use as the `key` prop on gradient spans to force remount when gradient updates,
 * working around the Chrome bug where background-clip:text isn't re-applied
 * when React only patches the background property.
 */
export function textGradientKey(text: Pick<TextStyle, 'textGradient' | 'textStrokeGradient'>): string | undefined {
    if (text.textGradient) return gradientCSS(text.textGradient)
    if (text.textStrokeGradient) return `stroke:${gradientCSS(text.textStrokeGradient)}`
    return undefined
}

/** @deprecated use textExtraCSS */
export function textShadowCSS(text: Pick<TextStyle, 'textShadow'>): { textShadow?: string } {
    if (!text.textShadow) return {}
    const {offsetX, offsetY, blur, color} = text.textShadow
    return {textShadow: `${offsetX}px ${offsetY}px ${blur}px ${color}`}
}
