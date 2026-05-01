export interface PaletteColor {
    id: string
    name: string
    color: string  // hex
}

export interface ColorPalette {
    id: string
    name: string
    colors: PaletteColor[]
}

export const DEFAULT_PALETTE: ColorPalette = {
    id: 'default',
    name: 'Colors',
    colors: [
        {id: 'black', name: 'Black', color: '#000000'},
        {id: 'white', name: 'White', color: '#ffffff'},
        {id: 'light-gray', name: 'Light Gray', color: '#e5e7eb'},
        {id: 'gray', name: 'Gray', color: '#9ca3af'},
        {id: 'dark-gray', name: 'Dark Gray', color: '#374151'},
        {id: 'blue', name: 'Blue', color: '#3b82f6'},
        {id: 'green', name: 'Green', color: '#22c55e'},
        {id: 'red', name: 'Red', color: '#ef4444'},
        {id: 'yellow', name: 'Yellow', color: '#eab308'},
        {id: 'orange', name: 'Orange', color: '#f97316'},
        {id: 'purple', name: 'Purple', color: '#a855f7'},
        {id: 'brown', name: 'Brown', color: '#92400e'},
        {id: 'teal', name: 'Teal', color: '#14b8a6'},
        {id: 'pink', name: 'Pink', color: '#ec4899'},
    ],
}
