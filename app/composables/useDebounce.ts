// Debounce для поиска: значение «выпускается» только после паузы во вводе —
// запросы на API не уходят на каждый введённый символ.

export function useDebouncedRef<T>(source: Ref<T>, delay = 350): Ref<T> {
  const debounced = ref(source.value) as Ref<T>
  let timer: ReturnType<typeof setTimeout> | undefined

  watch(source, (value) => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      debounced.value = value
    }, delay)
  })

  onBeforeUnmount(() => {
    if (timer) clearTimeout(timer)
  })

  return debounced
}
