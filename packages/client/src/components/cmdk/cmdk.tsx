// MIT License

// Copyright (c) 2022 Paco Coursey

// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

// The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
import {
  createContext,
  createEffect,
  createMemo,
  createSignal,
  on,
  onCleanup,
  onMount,
  Show,
  useContext,
} from 'solid-js'

import { commandScore } from './command-score'

import type { JSX } from 'solid-js/jsx-runtime'

interface Children {
  children?: JSX.Element
}
interface ReactRef<T> {
  current?: T | null
}
type DivProps = JSX.HTMLAttributes<HTMLDivElement> & { forwardedRef?: ReactRef<HTMLDivElement> }

// type LoadingProps = Children & DivProps & {
//   /** Estimated progress of loading asynchronous options. */
//   progress?: number
// }
type EmptyProps = Children & DivProps & {}
// type SeparatorProps = DivProps & {
//   /** Whether this separator should always be rendered. Useful if you disable automatic filtering. */
//   alwaysRender?: boolean
// }
// type DialogProps = RadixDialog.DialogProps & CommandProps & {
//   /** Provide a className to the Dialog overlay. */
//   overlayClassName?: string
//   /** Provide a className to the Dialog content. */
//   contentClassName?: string
//   /** Provide a custom element the Dialog should portal into. */
//   container?: HTMLElement
// }
type ListProps = Children & DivProps & {}
export type ItemProps = Children & Omit<DivProps, 'disabled' | 'onSelect' | 'value'> & {
  /** Whether this item is currently disabled. */
  disabled?: boolean
  /** Event handler for when this item is selected, either via click or keyboard selection. */
  onSelect?: (value: string) => void
  /**
   * A unique value for this item.
   * If no value is provided, it will be inferred from `children` or the rendered `textContent`. If your `textContent` changes between renders, you _must_ provide a stable, unique `value`.
   */
  value?: string
  /** Whether this item is forcibly rendered regardless of filtering. */
  forceMount?: boolean
}
// type GroupProps = Children & Omit<DivProps, 'heading' | 'value'> & {
//   /** Optional heading to render for this group. */
//   heading?: JSX.Element
//   /** If no heading is provided, you must provide a value that is unique for this group. */
//   value?: string
//   /** Whether this group is forcibly rendered regardless of filtering. */
//   forceMount?: boolean
// }
type InputProps = Omit<JSX.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type'> & {
  /**
   * Optional controlled state for the value of the search input.
   */
  value?: string
  /**
   * Event handler called when the search value changes.
   */
  onValueChange?: (search: string) => void
  forwardedRef?: ReactRef<HTMLInputElement>
}
type CommandProps = Children & DivProps & {
  /**
   * Accessible label for this command menu. Not shown visibly.
   */
  label?: string
  /**
   * Optionally set to `false` to turn off the automatic filtering and sorting.
   * If `false`, you must conditionally render valid items based on the search query yourself.
   */
  shouldFilter?: boolean
  /**
   * Custom filter function for whether each command menu item should matches the given search query.
   * It should return a number between 0 and 1, with 1 being the best match and 0 being hidden entirely.
   * By default, uses the `command-score` library.
   */
  filter?: (value: string, search: string) => number
  /**
   * Optional default item value when it is initially rendered.
   */
  defaultValue?: string
  /**
   * Optional controlled state of the selected command menu item.
   */
  value?: string
  /**
   * Event handler called when the selected item of the menu changes.
   */
  onValueChange?: (value: string) => void
  /**
   * Optionally set to `true` to turn on looping around when using the arrow keys.
   */
  loop?: boolean
  forwardedRef?: (ref: HTMLDivElement) => void
}

interface Context {
  value: (id: string, value: string) => void
  item: (id: string, groupId?: string) => () => void
  group: (id: string) => () => void
  filter: () => boolean
  label?: string
  commandRef: ReactRef<HTMLDivElement | null>
  // Ids
  listId: string
  labelId: string
  inputId: string
}
interface State {
  search: string
  value: string
  filtered: { count: number; items: Map<string, number>; groups: Set<string> }
}
interface Store {
  subscribe: (callback: () => void) => () => void
  snapshot: () => State
  setState: <K extends keyof State>(key: K, value: State[K], opts?: any) => void
  emit: () => void
}
interface Group {
  id: string
  forceMount?: boolean
}

const LIST_SELECTOR = '[cmdk-list-sizer=""]'
const GROUP_SELECTOR = '[cmdk-group=""]'
const GROUP_ITEMS_SELECTOR = '[cmdk-group-items=""]'
const GROUP_HEADING_SELECTOR = '[cmdk-group-heading=""]'
const ITEM_SELECTOR = '[cmdk-item=""]'
const VALID_ITEM_SELECTOR = `${ITEM_SELECTOR}:not([aria-disabled="true"])`
const SELECT_EVENT = 'cmdk-item-select'
const VALUE_ATTR = 'data-value'
const defaultFilter: CommandProps['filter'] = (value, search) => commandScore(value, search)

const CommandContext = createContext<Context>({} as Context)
const useCommand = () => useContext(CommandContext)
const StoreContext = createContext<Store>({
  snapshot() {
    return {
      /** Value of the search query. */
      search: '',
      /** Currently selected item value. */
      value: '',
      filtered: {
        /** The count of all visible items. */
        count: 0,
        /** Map from visible item id to its search score. */
        items: new Map(),
        /** Set of groups with at least one visible item. */
        groups: new Set(),
      },
    }
  },
} as Store)
const useStore = () => useContext(StoreContext)
const GroupContext = createContext<Group>(undefined)

/** Imperatively run a function on the next layout effect cycle. */
const useScheduleLayoutEffect = () => {
  const [s, ss] = createSignal<object>()
  const fns = useLazyRef(() => new Map<string | number, () => void>())

  on(s, () => {
    fns.current?.forEach(f => f())
    fns.current = new Map()
  })

  return (id: string | number, cb: () => void) => {
    fns.current?.set(id, cb)
    ss({})
  }
}
const srOnlyStyles = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  padding: '0',
  margin: '-1px',
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  borderWidth: '0',
} as const

const useId = () => {
  const id = crypto.randomUUID()
  return id
}

export const Command = (props: CommandProps) => {
  const ref: { current?: HTMLDivElement } = { current: undefined }
  const state = useRef<State>(() => ({
    /** Value of the search query. */
    search: '',
    /** Currently selected item value. */
    value: props.value ?? props.defaultValue?.toLowerCase() ?? '',
    filtered: {
      /** The count of all visible items. */
      count: 0,
      /** Map from visible item id to its search score. */
      items: new Map(),
      /** Set of groups with at least one visible item. */
      groups: new Set(),
    },
  }))
  const allItems = useRef<Set<string>>(() => new Set()) // [...itemIds]
  const allGroups = useRef<Map<string, Set<string>>>(() => new Map()) // groupId → [...itemIds]
  const ids = useRef<Map<string, string>>(() => new Map()) // id → value
  // eslint-disable-next-line @typescript-eslint/no-extra-parens
  const listeners = useRef<Set<() => void>>(() => new Set()) // [...rerenders]
  const propsRef = useAsRef(props)
  const { label, value, forwardedRef, onValueChange, filter, shouldFilter, ...etc } = props

  const listId = useId()
  const labelId = useId()
  const inputId = useId()

  const schedule = useScheduleLayoutEffect()

  // TODO
  const [store] = createSignal<Store>({
    subscribe: (cb) => {
      listeners.current?.add(cb)
      return () => listeners.current?.delete(cb)
    },
    snapshot: () => {
      return state.current
    },
    setState: (key, value, opts) => {
      if (Object.is(state.current[key], value)) {
        return
      }
      state.current[key] = value

      if (key === 'search') {
        // Filter synchronously before emitting back to children
        filterItems()
        sort()
        schedule(1, selectFirstItem)
      } else if (key === 'value') {
        if (propsRef.current?.value !== undefined) {
          // If controlled, just call the callback instead of updating state internally
          const newValue = (value ?? '') as string
          propsRef.current.onValueChange?.(newValue)
          return
          // opts is a boolean referring to whether it should NOT be scrolled into view
        } else if (!opts) {
          // Scroll the selected item into view
          schedule(5, scrollSelectedIntoView)
        }
      }

      // Notify subscribers that state has changed
      store().emit()
    },
    emit: () => {
      listeners.current.forEach(l => l())
    },
  })

  /** Controlled mode `value` handling. */
  createEffect(() => {
    if (value !== undefined) {
      const v = value.trim().toLowerCase()
      state.current.value = v
      schedule(6, scrollSelectedIntoView)
      store().emit()
    }
  }, [value])

  const [context] = createSignal<Context>({
    // Keep id → value mapping up-to-date
    value: (id, value) => {
      if (value !== ids.current.get(id)) {
        ids.current.set(id, value)
        state.current.filtered.items.set(id, score(value))
        schedule(2, () => {
          sort()
          store().emit()
        })
      }
    },
    // Track item lifecycle (mount, unmount)
    item: (id, groupId) => {
      allItems.current.add(id)

      // Track this item within the group
      if (groupId) {
        if (!allGroups.current.has(groupId)) {
          allGroups.current.set(groupId, new Set([id]))
        } else {
          allGroups.current.get(groupId)?.add(id)
        }
      }

      // Batch this, multiple items can mount in one pass
      // and we should not be filtering/sorting/emitting each time
      schedule(3, () => {
        filterItems()
        sort()

        // Could be initial mount, select the first item if none already selected
        if (!state.current.value) {
          selectFirstItem()
        }

        store().emit()
      })

      return () => {
        ids.current.delete(id)
        allItems.current.delete(id)
        state.current.filtered.items.delete(id)
        const selectedItem = getSelectedItem()

        // Batch this, multiple items could be removed in one pass
        schedule(4, () => {
          filterItems()

          // The item removed have been the selected one,
          // so selection should be moved to the first
          if (selectedItem?.getAttribute('id') === id) {
            selectFirstItem()
          }

          store().emit()
        })
      }
    },
    // Track group lifecycle (mount, unmount)
    group: (id) => {
      if (!allGroups.current.has(id)) {
        allGroups.current.set(id, new Set())
      }

      return () => {
        ids.current.delete(id)
        allGroups.current.delete(id)
      }
    },
    filter: () => {
      return !!propsRef.current?.shouldFilter
    },
    label: label || props['aria-label'],
    commandRef: ref,
    listId,
    inputId,
    labelId,
  })

  function score(value: string) {
    const filter = propsRef.current?.filter ?? defaultFilter
    return value ? filter!(value, state.current.search) : 0
  }

  /** Sorts items by score, and groups by highest item score. */
  function sort() {
    if (
      !ref.current
      || !state.current.search
      // Explicitly false, because true | undefined is the default
      || propsRef.current?.shouldFilter === false
    ) {
      return
    }

    const scores = state.current.filtered.items

    // Sort the groups
    const groups: [string, number][] = []
    state.current.filtered.groups.forEach((value) => {
      const items = allGroups.current.get(value)

      // Get the maximum score of the group's items
      let max = 0
      items?.forEach((item) => {
        const score = scores.get(item)!
        max = Math.max(score, max)
      })

      groups.push([value, max])
    })

    // Sort items within groups to bottom
    // Sort items outside of groups
    // Sort groups to bottom (pushes all non-grouped items to the top)
    const list = ref.current.querySelector(LIST_SELECTOR)

    // Sort the items
    getValidItems()
      .sort((a, b) => {
        const valueA = a.getAttribute(VALUE_ATTR)!
        const valueB = b.getAttribute(VALUE_ATTR)!
        return (scores.get(valueB) ?? 0) - (scores.get(valueA) ?? 0)
      })
      .forEach((item) => {
        const group = item.closest(GROUP_ITEMS_SELECTOR)

        if (group) {
          group.appendChild(item.parentElement === group ? item : item.closest(`${GROUP_ITEMS_SELECTOR} > *`))
        } else {
          list?.appendChild(item.parentElement === list ? item : item.closest(`${GROUP_ITEMS_SELECTOR} > *`))
        }
      })

    groups
      .sort((a, b) => b[1] - a[1])
      .forEach((group) => {
        const element = ref.current?.querySelector(`${GROUP_SELECTOR}[${VALUE_ATTR}="${group[0]}"]`)
        element?.parentElement?.appendChild(element)
      })
  }

  function selectFirstItem() {
    const item = getValidItems().find(item => !item.ariaDisabled)!
    const value = item.getAttribute(VALUE_ATTR)!
    store().setState('value', value || undefined)
  }

  /** Filters the current items. */
  function filterItems() {
    if (
      !state.current.search
      // Explicitly false, because true | undefined is the default
      || propsRef.current?.shouldFilter === false
    ) {
      state.current.filtered.count = allItems.current.size
      // Do nothing, each item will know to show itself because search is empty
      return
    }

    // Reset the groups
    state.current.filtered.groups = new Set()
    let itemCount = 0

    // Check which items should be included
    for (const id of allItems.current) {
      const value = ids.current.get(id)!
      const rank = score(value)
      state.current.filtered.items.set(id, rank)
      if (rank > 0) {
        itemCount++
      }
    }

    // Check which groups have at least 1 item shown
    for (const [groupId, group] of allGroups.current) {
      for (const itemId of group) {
        if (state.current.filtered.items.get(itemId)! > 0) {
          state.current.filtered.groups.add(groupId)
          break
        }
      }
    }

    state.current.filtered.count = itemCount
  }

  function scrollSelectedIntoView() {
    const item = getSelectedItem()

    if (item) {
      if (item.parentElement?.firstChild === item) {
        // First item in Group, ensure heading is in view
        item.closest(GROUP_SELECTOR)?.querySelector(GROUP_HEADING_SELECTOR)?.scrollIntoView({ block: 'nearest' })
      }

      // Ensure the item is always in view
      item.scrollIntoView({ block: 'nearest' })
    }
  }

  /** Getters */

  function getSelectedItem() {
    return ref.current?.querySelector(`${ITEM_SELECTOR}[aria-selected="true"]`)
  }

  function getValidItems() {
    return Array.from(ref.current!.querySelectorAll(VALID_ITEM_SELECTOR))
  }

  /** Setters */

  function updateSelectedToIndex(index: number) {
    const items = getValidItems()
    const item = items[index]
    if (item) {
      store().setState('value', item.getAttribute(VALUE_ATTR))
    }
  }

  function updateSelectedByChange(change: 1 | -1) {
    const selected = getSelectedItem()
    const items = getValidItems()
    const index = items.findIndex(item => item === selected)

    // Get item at this index
    let newSelected = items[index + change]

    if (propsRef.current?.loop) {
      newSelected
        = index + change < 0
          ? items[items.length - 1]
          : index + change === items.length
            ? items[0]
            : items[index + change]
    }

    if (newSelected) {
      store().setState('value', newSelected.getAttribute(VALUE_ATTR))
    }
  }

  function updateSelectedToGroup(change: 1 | -1) {
    const selected = getSelectedItem()
    let group = selected?.closest(GROUP_SELECTOR)
    let item: HTMLElement

    while (group && !item) {
      group = change > 0 ? findNextSibling(group, GROUP_SELECTOR) : findPreviousSibling(group, GROUP_SELECTOR)
      item = group?.querySelector(VALID_ITEM_SELECTOR)
    }

    if (item) {
      store().setState('value', item.getAttribute(VALUE_ATTR)!)
    } else {
      updateSelectedByChange(change)
    }
  }

  const last = () => updateSelectedToIndex(getValidItems().length - 1)

  const next = (e: KeyboardEvent) => {
    e.preventDefault()

    if (e.metaKey) {
      // Last item
      last()
    } else if (e.altKey) {
      // Next group
      updateSelectedToGroup(1)
    } else {
      // Next item
      updateSelectedByChange(1)
    }
  }

  const prev = (e: KeyboardEvent) => {
    e.preventDefault()

    if (e.metaKey) {
      // First item
      updateSelectedToIndex(0)
    } else if (e.altKey) {
      // Previous group
      updateSelectedToGroup(-1)
    } else {
      // Previous item
      updateSelectedByChange(-1)
    }
  }

  return (
    <div
      ref={mergeRefs([ref, forwardedRef])}
      {...etc}
      cmdk-root=""
      onKeyDown={(e) => {
        etc.onKeyDown?.(e)

        if (!e.defaultPrevented) {
          switch (e.key) {
            case 'n':
            case 'j': {
              // vim keybind down
              if (e.ctrlKey) {
                next(e)
              }
              break
            }
            case 'ArrowDown': {
              next(e)
              break
            }
            case 'p':
            case 'k': {
              // vim keybind up
              if (e.ctrlKey) {
                prev(e)
              }
              break
            }
            case 'ArrowUp': {
              prev(e)
              break
            }
            case 'Home': {
              // First item
              e.preventDefault()
              updateSelectedToIndex(0)
              break
            }
            case 'End': {
              // Last item
              e.preventDefault()
              last()
              break
            }
            case 'Enter': {
              // Trigger item onSelect
              e.preventDefault()
              const item = getSelectedItem()
              if (item) {
                const event = new Event(SELECT_EVENT)
                item.dispatchEvent(event)
              }
            }
          }
        }
      }}
    >
      <label
        cmdk-label=""
        for={context().inputId}
        id={context().labelId}
        // Screen reader only
        style={srOnlyStyles}
      >
        {label}
      </label>
      <StoreContext.Provider value={store()}>
        <CommandContext.Provider value={context()}>{props.children}</CommandContext.Provider>
      </StoreContext.Provider>
    </div>
  )
}

/**
 * Command menu item. Becomes active on pointer enter or through keyboard navigation.
 * Preferably pass a `value`, otherwise the value will be inferred from `children` or
 * the rendered item's `textContent`.
 */
export const CommandItem = (props: ItemProps) => {
  const id = useId()
  const ref: ReactRef<HTMLDivElement> = { current: null }
  const groupContext = useContext(GroupContext)
  const context = useCommand()!
  const propsRef = useAsRef(props)
  const forceMount = propsRef.current?.forceMount ?? groupContext?.forceMount

  onMount(() => {
    return context.item?.(id, groupContext?.id)
  })

  const value = useValue(id, ref, [props.value, props.children, ref])

  const store = useStore()!
  const selected = useCmdk(state => state?.value && state?.value === value.current)
  const render = useCmdk(state =>
    forceMount ? true : context.filter?.() === false ? true : !state.search ? true : (state.filtered?.items?.get?.(id) as number) > 0,
  )

  createEffect(() => {
    const element = ref.current
    if (!element || props.disabled) {
      return
    }
    element.addEventListener(SELECT_EVENT, onSelect)
    onCleanup(() => element.removeEventListener(SELECT_EVENT, onSelect))
  })

  function onSelect() {
    select()
    propsRef.current?.onSelect?.(value.current!)
  }

  function select() {
    store.setState('value', value.current!, true)
  }

  const { disabled, value: _, onSelect: __, forwardedRef, ...etc } = props

  return (
    <Show when={render()}>
      <div
        ref={mergeRefs([ref, forwardedRef])}
        {...etc}
        id={id}
        cmdk-item=""
        role="option"
        aria-disabled={disabled || undefined}
        aria-selected={selected() || undefined}
        data-disabled={disabled || undefined}
        data-selected={selected() || undefined}
        onPointerMove={disabled ? undefined : select}
        onClick={disabled ? undefined : onSelect}
      >
        {props.children}
      </div>
    </Show>
  )
}

/**
 * Group command menu items together with a heading.
 * Grouped items are always shown together.
 */
// const Group = (props: GroupProps) => {
//   const { heading, children, forceMount, ...etc } = props
//   const id = useId()
//   const ref: ReactRef<HTMLDivElement> = { current: null }
//   const headingRef: ReactRef<HTMLDivElement> = { current: null }
//   const headingId = useId()
//   const context = useCommand()!
//   const render = useCmdk((state) =>
//     forceMount ? true : context.filter() === false ? true : !state.search ? true : state.filtered.groups.has(id),
//   )

//   onMount(() => {
//     return context.group(id)
//   })

//   useValue(id, ref, [props.value, props.heading, headingRef])

//   const contextValue = createMemo(() => ({ id, forceMount }), [forceMount])
//   const inner = <GroupContext.Provider value={contextValue()}>{children}</GroupContext.Provider>

//   return (
//     <div
//       ref={mergeRefs([ref, props.forwardedRef])}
//       {...etc}
//       cmdk-group=""
//       role="presentation"
//       hidden={render() ? undefined : true}
//     >
//       {heading && (
//         <div ref={dom => headingRef.current = dom} cmdk-group-heading="" aria-hidden={true} id={headingId}>
//           {heading}
//         </div>
//       )}
//       <div cmdk-group-items="" role="group" aria-labelledby={heading ? headingId : undefined}>
//         {inner}
//       </div>
//     </div>
//   )
// }

/**
 * A visual and semantic separator between items or groups.
 * Visible when the search query is empty or `alwaysRender` is true, hidden otherwise.
 */
// const Separator = (props: SeparatorProps) => {
//   const { alwaysRender, ...etc } = props
//   const ref: ReactRef<HTMLDivElement> = { current: null }
//   const render = useCmdk(state => !state.search)

//   if (!alwaysRender && !render()) {
//     return null
//   }
//   return <div ref={mergeRefs([ref, props.forwardedRef])} {...etc} cmdk-separator="" role="separator" />
// }

/**
 * Command menu input.
 * All props are forwarded to the underyling `input` element.
 */
export const CommandInput = (props: InputProps) => {
  const { onValueChange, forwardedRef, ...etc } = props
  const isControlled = props.value != null
  const store = useStore()!
  const search = useCmdk(state => state?.search)
  const value = useCmdk(state => state?.value)
  const context = useCommand()!

  const selectedItemId = createMemo(() => {
    const item = context.commandRef?.current?.querySelector(`${ITEM_SELECTOR}[${VALUE_ATTR}="${value()}"]`)
    return item?.getAttribute('id')
  })

  createEffect(() => {
    if (props.value != null) {
      store.setState('search', props.value)
    }
  })

  return (
    <input
      ref={mergeRefs([forwardedRef])}
      {...etc}
      cmdk-input=""
      autocomplete="off"
      autocorrect="off"
      spellcheck={false}
      aria-autocomplete="list"
      role="combobox"
      aria-expanded={true}
      aria-controls={context.listId}
      aria-labelledby={context.labelId}
      aria-activedescendant={selectedItemId()}
      id={context.inputId}
      type="text"
      value={isControlled ? props.value : search()}
      onInput={(e) => {
        if (!isControlled) {
          store.setState('search', e.target.value)
        }

        onValueChange?.(e.target.value)
      }}
    />
  )
}

/**
 * Contains `Item`, `Group`, and `Separator`.
 * Use the `--cmdk-list-height` CSS variable to animate height based on the number of results.
 */
export const CommandList = (props: ListProps) => {
  const { children, ...etc } = props
  const ref: ReactRef<HTMLDivElement> = { current: null }
  const height: ReactRef<HTMLDivElement> = { current: null }
  const context = useCommand()!

  onMount(() => {
    if (height.current && ref.current) {
      const el = height.current
      const wrapper = ref.current
      let animationFrame: number
      const observer = new ResizeObserver(() => {
        animationFrame = requestAnimationFrame(() => {
          const height = el.offsetHeight
          wrapper.style.setProperty('--cmdk-list-height', `${height.toFixed(1)}px`)
        })
      })
      observer.observe(el)
      onCleanup(() => {
        cancelAnimationFrame(animationFrame)
        observer.unobserve(el)
      })
    }
  })

  return (
    <div
      ref={mergeRefs([ref, props.forwardedRef])}
      {...etc}
      cmdk-list=""
      role="listbox"
      aria-label="Suggestions"
      id={context.listId}
      aria-labelledby={context.inputId}
    >
      <div ref={dom => height.current = dom} cmdk-list-sizer="">
        {children}
      </div>
    </div>
  )
}

/**
 * Automatically renders when there are no results for the search query.
 */
export const CommandEmpty = (props: EmptyProps) => {
  const [isFirstRender, setIsFirstRender] = createSignal(true)
  const render = useCmdk(state => state.filtered.count === 0)
  const search = useCmdk(state => state.search)

  createEffect(on(search, (i, pi) => {
    if (i !== pi && i && isFirstRender()) {
      setIsFirstRender(false)
    }
  }))

  return (
    <Show when={!isFirstRender() && render()}>
      <div {...props} cmdk-empty="" role="presentation" />
    </Show>
  )
}

/**
 * You should conditionally render this with `progress` while loading asynchronous items.
 */
// const Loading = (props: LoadingProps) => {
//   const { progress, children, ...etc } = props

//   return (
//     <div
//       ref={props.forwardedRef}
//       {...etc}
//       cmdk-loading=""
//       role="progressbar"
//       aria-valuenow={progress}
//       aria-valuemin={0}
//       aria-valuemax={100}
//       aria-label="Loading..."
//     >
//       <div aria-hidden={true}>{children}</div>
//     </div>
//   )
// }

/**
 *
 *
 * Helpers
 *
 *
 */

function findNextSibling(el: Element, selector: string) {
  let sibling = el.nextElementSibling

  while (sibling) {
    if (sibling.matches(selector)) {
      return sibling
    }
    sibling = sibling.nextElementSibling
  }
}

function findPreviousSibling(el: Element, selector: string) {
  let sibling = el.previousElementSibling

  while (sibling) {
    if (sibling.matches(selector)) {
      return sibling
    }
    sibling = sibling.previousElementSibling
  }
}

function useAsRef<T>(data: T) {
  const ref: ReactRef<T> = { current: data }

  createEffect(() => {
    ref.current = data
  }, [data])

  return ref
}

function useRef<T>(fn: () => T) {
  const ref: { current: T } = { current: fn() }

  return ref
}

function useLazyRef<T>(fn: () => T) {
  const ref: { current?: T } = {}

  if (ref.current === undefined) {
    ref.current = fn()
  }

  return ref
}

type RefCallback<T> = { bivarianceHack(instance: T | null): void }['bivarianceHack']
// ESM is still a nightmare with Next.js so I'm just gonna copy the package code in
// https://github.com/gregberge/react-merge-refs
// Copyright (c) 2020 Greg Bergé
function mergeRefs<T = any>(refs: Array<RefCallback<T> | ReactRef<T> | undefined>) {
  return (value: any) => {
    refs.filter(Boolean).forEach((ref) => {
      if (typeof ref === 'function') {
        // TODO:
        ref(value)
      } else if (ref != null) {
        ref.current = value
      }
    })
  }
}

/** Run a selector against the store state. */
function useCmdk<T = any>(selector: (state: State) => T) {
  const store = useStore()!
  const [s, ss] = createSignal<T>(selector(store.snapshot?.()))
  const cb = () => selector(store.snapshot?.())
  onMount(() => {
    store.subscribe?.(() => {
      const next = cb()
      // @ts-expect-error -- ignore
      ss(next as T)
    })
  })
  return s
}

function useValue(
  id: string,
  ref: ReactRef<HTMLElement>,
  deps: (string | JSX.Element | ReactRef<HTMLElement>)[],
) {
  const valueRef: ReactRef<string> = {}
  const context = useCommand()

  onMount(() => {
    const value = (() => {
      for (const part of deps) {
        if (typeof part === 'string') {
          return part.trim().toLowerCase()
        }

        if (part && typeof part === 'object' && 'current' in part && part.current) {
          return part.current.textContent?.trim().toLowerCase()
        }
      }
    })()

    context.value?.(id, value!)
    ref.current?.setAttribute(VALUE_ATTR, value!)
    valueRef.current = value
  })

  return valueRef
}
