import cx from 'clsx'
import { focusIfNeed } from 'focus-if-need'
import { onMount } from 'solid-js'

import { useVsitContext } from '../vsit-context'
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/cmdk/cmdk'
import { SimpleIconsPrettier } from '@/components/icons/prettier'

import type { ItemProps } from '@/components/cmdk/cmdk'
import type { JSXElement } from 'solid-js'

type CommandValue = 'first two thirds' | 'format' | 'left half' | 'run'

const Item = (props: ItemProps) => {
  return (
    <CommandItem
      onSelect={(v) => {
        props.onSelect?.(v)
      }}
      value={props.value}
      class={
        cx(
          'bordered text-base-content data-[selected=true]:border-secondary data-[selected=true]:bg-neutral cursor-pointer border-0 border-l-4 border-transparent px-4 py-2',
          'flex',
          'justify-between',
        )
      }
    >
      {props.children}
    </CommandItem>
  )
}

interface ItemTextProps {
  icon: JSXElement
  text: string
}

const ItemText = (props: ItemTextProps) => {
  return (
    <span class="mr-2 flex items-center gap-4 capitalize">
      <span class="inline-flex h-6 w-6 items-center">
        {props.icon}
      </span>
      {props.text}
    </span>
  )
}

export const VsitCmdk = () => {
  let modalBtnRef: HTMLLabelElement | null = null
  let modalOpen = false
  const inputRef: { current?: HTMLInputElement } = { current: undefined }
  const vsit = useVsitContext()
  onMount(() => {
    document.addEventListener('keydown', (e) => {
      // Toggle
      if (e.key === 'j' && e.metaKey) {
        modalBtnRef?.click()
        modalOpen = true
        modalOpen && focusIfNeed.focus('command_modal_input', inputRef)
        return
      }
      // Close
      if (e.key === 'Escape' && modalOpen === true) {
        modalBtnRef?.click()
        modalOpen = false
      }
    })
  })
  const handleCommand = (v: string) => {
    const command: CommandValue = v.toLowerCase() as CommandValue
    console.log(command)
    switch (command) {
      case 'run':
        vsit?.handleExec()
        break
      case 'format':
        vsit?.handleFormat()
        break
      case 'left half':
        vsit?.handleResize('50%')
        break
      case 'first two thirds':
        vsit?.handleResize(`${66.7}%`)
        break
    }
    // Close modal after command
    modalBtnRef?.click()
  }
  return (
    <>
      <label for="command_modal" ref={ref => modalBtnRef = ref} class="btn hidden" id="command_modal_btn">open modal</label>
      <input type="checkbox" id="command_modal" class="modal-toggle" />
      <div id="command_modal" class="modal bg-base-200 rounded bg-transparent p-0">
        <form method="dialog" class="modal-box border-neutral flex min-w-[250px] flex-col rounded border p-0 py-2 shadow-md">
          <Command shouldFilter={true} loop={true} label="Command Menu">
            <CommandInput forwardedRef={inputRef} placeholder="Type here" class="input input-ghost w-full border-0 focus:outline-none" />
            <div class="bg-base-content my-2 h-[1px] w-full opacity-10" />
            <CommandList>
              <CommandEmpty>No results found.</CommandEmpty>
              <Item value="Run" onSelect={handleCommand}>
                <ItemText
                  icon={
                    <i class="gg-terminal/0.65" />
                  }
                  text="run"
                />
                <p>
                  <kbd class="kbd kbd-xs">⇧</kbd> <kbd class="kbd kbd-xs">⌥</kbd> <kbd class="kbd kbd-xs">S</kbd>
                </p>
              </Item>
              <Item value="Format" onSelect={handleCommand}>
                <ItemText
                  icon={
                    <SimpleIconsPrettier class="ml-1" />
                  }
                  text="format"
                />
                <p>
                  <kbd class="kbd kbd-xs">⇧</kbd> <kbd class="kbd kbd-xs">⌥</kbd> <kbd class="kbd kbd-xs">F</kbd>
                </p>
              </Item>
              <Item value="left half" onSelect={handleCommand}>
                <ItemText
                  icon={
                    <i class="gg-view-split/0.75" />
                  }
                  text="left half"
                />
              </Item>
              <Item value="first two thirds" onSelect={handleCommand}>
                <ItemText
                  icon={
                    <i class="gg-dock-right/0.75" />
                  }
                  text="first two thirds"
                />
              </Item>
            </CommandList>
          </Command>
          <div class="bg-base-content my-2 h-[1px] w-full opacity-10" />
          <div class="flex justify-end px-4">
            <p class="flex items-center gap-2">
              <span class="text-xs">Close</span>
              <kbd class="kbd kbd-sm">esc</kbd>
            </p>
          </div>
        </form>
      </div>
    </>
  )
}
