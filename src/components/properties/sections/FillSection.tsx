import type {FillStyle} from '@model/shapes'
import React, {useState} from "react";
import {CollapsibleSection} from '../CollapsibleSection'
import {ColorInput} from '../inputs/ColorInput'
import "../propsheet.css"


interface Props {
    fill: FillStyle
    onChange: (f: FillStyle) => void
}

type FillType = 'color' | 'gradient' | 'sketch'

function TabbedPanelTab<T>(props: {
    title: string,
    tab: T,
    selectedTab: T,
    setSelectedTab: (value: (((prevState: T) => T) | T)) => void,
    onChange?: () => void
}) {
    return <div
        className={'tabbed-panel-tab ' + ((props.tab === props.selectedTab) ? 'selected' : 'hidden')}
        onClick={() => {
            props.setSelectedTab(props.tab)
            if (props.onChange) {
                props.onChange()
            }
        }}
    >
        {props.title}
    </div>
}

function TabbedPanelContent<T>(props: {
    children: React.ReactNode,
    tab: T,
    selectedTab: T,
    setSelectedTab: (value: (((prevState: T) => T) | T)) => void
}) {
    return <div
        className={'tabbed-panel-content ' + ((props.tab === props.selectedTab) ? 'selected' : 'hidden')}>
        {props.children}
    </div>
}

function TabbedPanel(props: { children: React.ReactNode }) {
    return <div className={'tabbed-panel-panel'}>
        {props.children}
    </div>
}

function TabbedPanelTabs(props: { children: React.ReactNode }) {
    return <div className={'tabbed-panel-tabs'}>{props.children}</div>
}

export function FillSection({fill, onChange}: Props) {

    const switchToGradient = () => {
        const stops = [
            {color: fill.color, position: 0},
            {color: '#ffffff', position: 1},
        ]
        onChange({...fill, gradient: {type: 'linear', angle: 90, stops}})
    }

    const switchToSolid = () => onChange({...fill, gradient: null})

    const [selectedTab, setSelectedTab] = useState<FillType>("color")

    const tabProps = {
        selectedTab: selectedTab,
        setSelectedTab: setSelectedTab
    }
    return (
        <CollapsibleSection title="Fill">
            <TabbedPanel>
                <TabbedPanelTabs>
                    <TabbedPanelTab tab={'color'} title={'Color'}
                                    onChange={() => switchToSolid()} {...tabProps} />
                    <TabbedPanelTab tab={'gradient'} title={'Gradient'} {...tabProps}
                                    onChange={() => switchToGradient()}/>
                    <TabbedPanelTab tab={'sketch'} title={'Sketch'} {...tabProps} onChange={() => {
                        console.log("switch to sketch  mode");
                    }}/>
                </TabbedPanelTabs>
                <TabbedPanelContent tab={'color'} {...tabProps}>
                    <section className={'super'}>
                        <ColorInput
                            value={{color: fill.color, paletteColorId: fill.paletteColorId}}
                            onChange={ref => onChange({
                                ...fill,
                                color: ref.color,
                                paletteColorId: ref.paletteColorId
                            })}
                        />
                        <div className={'full center-v'}
                             style={{display: 'grid', gridTemplateColumns: 'subgrid'}}>
                            <label className={'s'}>Opacity</label>
                            <input style={{
                                gridColumn: 'mid1 / span 2',
                                minWidth: '20px',
                            }}
                                   type={'range'}
                                   value={Math.round(fill.opacity * 100)}
                                   min={0} max={100}
                                   onChange={e => onChange({
                                       ...fill,
                                       opacity: parseInt(e.target.value) / 100
                                   })}
                            />
                            <input className={'e'}
                                   type={'number'}
                                   value={Math.round(fill.opacity * 100)}
                                   min={0} max={100}
                                   onChange={e => onChange({
                                       ...fill,
                                       opacity: parseInt(e.target.value) / 100
                                   })}
                            />
                            <label className={'center-v'}
                                   style={{gridColumn: 'ge/span 1'}}>%</label>
                        </div>
                        <button className={'s'}>RGB/HSV</button>
                        <button className={'e'}>Palettes</button>
                    </section>
                </TabbedPanelContent>
                <TabbedPanelContent tab={'gradient'} {...tabProps}>
                    <section className={'super'}>
                        <label className={'s'}>Type</label>
                        <select className={'mid1span3'}>
                            <option>linear</option>
                        </select>
                        <label className={'s'}>Colors</label>
                        <select className={'mid1span3'}>
                            <option>grad 1</option>
                            <option>grad 2</option>
                            <option>grad 3</option>
                        </select>
                        <button className={'mid1'}>edit</button>
                    </section>
                </TabbedPanelContent>
                <TabbedPanelContent tab={'sketch'} {...tabProps}>
                    <section className={'super'}>
                        <button style={{gridColumn:'mid1/span 2'}}>sketch1</button>
                        <button style={{gridColumn:'mid1/span 2'}}>sketch1</button>
                    </section>
                </TabbedPanelContent>
            </TabbedPanel>
        </CollapsibleSection>
    )
}
