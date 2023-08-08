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

import type { ItemProps } from '@/components/cmdk/cmdk'

type CommandValue = 'run' | 'format'

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
    switch (command) {
      case 'run':
        vsit?.handleExec()
        break
      case 'format':
        vsit?.handleFormat()
        break
    }
  }
  return (
    <>
      <label for="command_modal" ref={ref => modalBtnRef = ref} class="btn hidden" id="command_modal_btn">open modal</label>
      <input type="checkbox" id="command_modal" class="modal-toggle" />
      <div id="command_modal" class="modal bg-base-200 rounded bg-transparent p-0">
        <form method="dialog" class="modal-box flex min-w-[250px] flex-col p-0 py-2">
          <Command loop={true} label="Command Menu">
            <CommandInput forwardedRef={inputRef} placeholder="Type here" class="input input-ghost w-full border-0 focus:outline-none" />
            <div class="bg-base-content my-2 h-[1px] w-full opacity-10" />
            <CommandList>
              <CommandEmpty>No results found.</CommandEmpty>
              <Item value="Run" onSelect={handleCommand}>
                <span class="mr-2 capitalize">
                  run
                </span>
                <p>
                  <kbd class="kbd kbd-xs">⇧</kbd> <kbd class="kbd kbd-xs">⌥</kbd> <kbd class="kbd kbd-xs">S</kbd>
                </p>
              </Item>
              <Item value="Format" onSelect={handleCommand}>
                <span class="mr-2 capitalize">
                  format
                </span>
                <p>
                  <kbd class="kbd kbd-xs">⇧</kbd> <kbd class="kbd kbd-xs">⌥</kbd> <kbd class="kbd kbd-xs">F</kbd>
                </p>
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
