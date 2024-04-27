// Based on https://gist.github.com/ZanzyTHEbar/8f15aebf3accccc9e3301e69ead075b2
import { throttle } from '@solid-primitives/scheduled'
import clsx from 'clsx'
import {
  children,
  createEffect,
  createSignal,
  onCleanup,
  splitProps,
} from 'solid-js'

import type {
  Component,
  ComponentProps,
  JSXElement,
} from 'solid-js'

type SolidRef = (el: HTMLDivElement) => void

type ResizeProps = ComponentProps<'div'> & {
  ref?: HTMLDivElement | SolidRef
  isHorizontal?: boolean
  side: 'bottom' | 'left' | 'right' | 'top'
  onResize: (clientX: number, clientY: number) => void
  children: JSXElement | ((edgeHandler: JSXElement) => JSXElement)
}

type ResizerContentProps = ComponentProps<'div'> & {
  edgeHandler: JSXElement
  children: JSXElement | ((edgeHandler: JSXElement) => JSXElement)
}

export const ResizerContent: Component<ResizerContentProps> = (props) => {
  const [, rest] = splitProps(props, ['class', 'edgeHandler'])

  const resolvedChildren = children(() => {
    const body = props.children

    if (typeof body === 'function') {
      return body(props.edgeHandler)
    }

    return body
  })

  return (
    <div class={clsx('relative h-full', props.class)} {...rest}>
      {props.edgeHandler}
      {resolvedChildren()}
    </div>
  )
}

export const Resizer: Component<ResizeProps> = (props) => {
  const [isDragging, setIsDragging] = createSignal(false)

  const [throttledOnPointerMove, setThrottledOnPointerMove]
        = createSignal<(e: PointerEvent) => void>()

  const onResizeStart = (e: MouseEvent) => {
    // Prevents the event from bubbling up to the parent element
    e.stopPropagation()
    setIsDragging(true)
  }

  const onResizeEnd = () => setIsDragging(false)

  const setRef = (el: HTMLDivElement) => {
    if (!el) {
      return
    }
    ;(props.ref as SolidRef)?.(el)
    onCleanup(() => {
      el.removeEventListener('pointerdown', onResizeStart)
    })
  }

  createEffect(() => {
    const onPointerMove = (e: PointerEvent) => {
      if (e.buttons !== 1) {
        window.removeEventListener('pointermove', throttledOnPointerMove()!)
      }
      props.onResize(e.clientX, e.clientY)
    }

    setThrottledOnPointerMove(() => throttle(onPointerMove, 10))
  })

  createEffect(() => {
    if (isDragging()) {
      window.addEventListener('pointermove', throttledOnPointerMove()!, { passive: true })
      window.addEventListener('pointerup', onResizeEnd, { passive: true })
    } else {
      window.removeEventListener('pointermove', throttledOnPointerMove()!)
      window.removeEventListener('pointerup', onResizeEnd)
    }
  })

  // Edge handler styles based on the side prop
  const edgeHandlerStyles = {
    left: 'absolute top-0 bottom-0 left-0 w-[1px] cursor-col-resize z-50',
    right: 'absolute top-0 bottom-0 right-0 w-[2px] cursor-col-resize z-50',
    top: 'absolute top-0 left-0 right-0 h-[1px] cursor-row-resize z-50',
    bottom: 'absolute bottom-0 left-0 right-0 h-[1px] cursor-row-resize z-50',
  }

  // Handler elements
  const edgeHandler = <div class={clsx(edgeHandlerStyles[props.side], 'bg-neutral round-md rounded hover:bg-cyan-500 active:bg-cyan-500')} onMouseDown={onResizeStart} />

  return (
    <div
      ref={el => setRef(el)}
      class={clsx('relative h-full transition-all delay-300 duration-300 ease-in-out', props.class)}
    >
      {/* eslint-disable-next-line react/no-children-prop */}
      <ResizerContent children={props.children} edgeHandler={edgeHandler} />
    </div>
  )
}
