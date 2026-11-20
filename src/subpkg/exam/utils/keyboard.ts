import { onMounted, onUnmounted, type Ref } from 'vue'
import { onShow, onHide } from '@dcloudio/uni-app'

export type ExamKeyEvent = { key: string; preventDefault: () => void }

// 微信 PC 的按键事件没有 DOM target / preventDefault。
export function useExamKeyboard(handle: (event: ExamKeyEvent) => void, hint: Ref<boolean>) {
  let stop: (() => void) | undefined
  const listener = (event: any) => {
    const target = event.target
    if (['INPUT', 'TEXTAREA', 'EDITOR'].includes(target?.tagName) || target?.isContentEditable) return
    const pressed = (value: unknown) => value === true || value === 'true'
    if (event.isComposing || pressed(event.altKey) || pressed(event.ctrlKey) || pressed(event.metaKey)) return
    if (typeof event.key !== 'string') return
    hint.value = true
    handle({ key: event.key, preventDefault: () => event.preventDefault?.() })
  }
  const detach = () => {
    stop?.()
    stop = undefined
  }
  const attach = () => {
    if (stop) return
    // #ifdef MP-WEIXIN
    const keyboard = wx as any
    const platform = uni.getSystemInfoSync().platform
    if (['windows', 'mac'].includes(platform) &&
        typeof keyboard.onKeyDown === 'function' && typeof keyboard.offKeyDown === 'function') {
      keyboard.onKeyDown(listener)
      stop = () => keyboard.offKeyDown(listener)
      hint.value = true
    }
    // #endif
    // #ifdef H5
    window.addEventListener('keydown', listener)
    stop = () => window.removeEventListener('keydown', listener)
    hint.value = window.matchMedia('(hover: hover) and (pointer: fine)').matches
    // #endif
  }
  onMounted(attach)
  onShow(attach)
  onHide(detach)
  onUnmounted(detach)
}
