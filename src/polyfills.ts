// Polyfills for browser environment
import { Buffer } from 'buffer'

// Make Buffer available globally
window.Buffer = Buffer
window.global = window.global || window

export {}