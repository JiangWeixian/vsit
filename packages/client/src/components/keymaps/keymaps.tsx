import { onMount, useContext } from 'solid-js'

import { VsitContext } from '../vsit-context'

/**
 * @description HotKeys support by code-mirror
 */
export const Keymaps = () => {
  const ctx = useContext(VsitContext)
  let modalBtnRef: HTMLLabelElement
  onMount(() => {
    modalBtnRef?.click()
  })
  return (
    <>
      <label for="keymaps_modal" ref={ref => modalBtnRef = ref} class="btn hidden" id="keymaps_modal_btn">open modal</label>
      <input type="checkbox" id="keymaps_modal" class="modal-toggle" />
      <div id="keymaps_modal" class="modal modal-bottom bg-base-200 fixed bottom-4 left-auto right-4 top-auto rounded p-0">
        <form method="dialog" class="modal-box flex min-w-[250px] flex-col">
          <button
            class="btn btn-sm btn-circle btn-ghost bg-base-200 text-base-content absolute right-2 top-2"
            onClick={() => {
              modalBtnRef?.click()
            }}
          >
            ✕
          </button>
          <button
            class="btn btn-sm text-base-content mt-6 flex justify-between"
            onClick={ctx?.handleExec}
          >
            <span class="mr-2">
              run
            </span>
            <p>
              <kbd class="kbd kbd-xs">⇧</kbd> <kbd class="kbd kbd-xs">⌥</kbd> <kbd class="kbd kbd-xs">S</kbd>
            </p>
          </button>
          <button
            class="btn btn-sm btn-ghost text-base-content flex justify-between"
            onClick={ctx?.handleFormat}
          >
            <span class="mr-2">
              format
            </span>
            <p>
              <kbd class="kbd kbd-xs">⇧</kbd> <kbd class="kbd kbd-xs">⌥</kbd> <kbd class="kbd kbd-xs">F</kbd>
            </p>
          </button>
        </form>
      </div>
    </>
  )
}
