// Регрессия (уровень 5): двойная отправка комментария.
// Баг: RequestComments.submit() проверял только props.posting, который
// обновляется после перерендера родителя. Двойной клик / Ctrl+Enter + клик
// в пределах одного тика проскакивали guard и отправляли два POST с одинаковым
// текстом. Фикс: локальный флаг sending, выставляемый синхронно, блокировка
// формы на время отправки, снятие флага по окончании posting.
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { nextTick } from 'vue'
import RequestComments from '~/components/RequestComments.vue'

function mountComments() {
  return mount(RequestComments, {
    props: { comments: [], posting: false },
  })
}

/** Сабмит формы — тот же путь, что клик по кнопке и Ctrl+Enter */
function submitForm(wrapper: ReturnType<typeof mountComments>) {
  return wrapper.get('form').trigger('submit')
}

describe('bug: двойная отправка комментария', () => {
  it('двойной сабмит в одном тике отправляет ровно один add', async () => {
    const wrapper = mountComments()
    await wrapper.get('[data-testid="comment-input"]').setValue('Текст комментария')

    await submitForm(wrapper)
    await submitForm(wrapper) // повторный сабмит до перерендера

    expect(wrapper.emitted('add')).toHaveLength(1)
  })

  it('Ctrl+Enter затем сабмит кнопкой — один add', async () => {
    const wrapper = mountComments()
    const input = wrapper.get('[data-testid="comment-input"]')
    await input.setValue('Ещё комментарий')
    await input.trigger('keydown.ctrl.enter')
    await submitForm(wrapper)
    expect(wrapper.emitted('add')).toHaveLength(1)
  })

  it('повторная отправка заблокирована, пока идёт posting', async () => {
    const wrapper = mount(RequestComments, {
      props: { comments: [], posting: true },
    })
    await wrapper.get('[data-testid="comment-input"]').setValue('Пока сервер думает')
    const button = wrapper.get('[data-testid="comment-submit"]')
    expect(button.attributes('disabled')).toBeDefined()
    await submitForm(wrapper)
    expect(wrapper.emitted('add')).toBeUndefined()
  })

  it('после завершения posting отправка снова доступна', async () => {
    const wrapper = mountComments()
    const input = wrapper.get('[data-testid="comment-input"]')

    await input.setValue('Первый')
    await submitForm(wrapper)
    await nextTick() // родитель в этом тесте не держит posting — флаг снят

    await input.setValue('Второй')
    await submitForm(wrapper)

    expect(wrapper.emitted('add')).toHaveLength(2)
    expect(wrapper.emitted('add')?.[0]).toEqual(['Первый'])
    expect(wrapper.emitted('add')?.[1]).toEqual(['Второй'])
  })
})
