import { shallowMount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import WorkflowNode from './WorkflowNode.vue'

const mountNode = (data) => shallowMount(WorkflowNode, {
  props: { data },
  global: { stubs: { Handle: true } },
})

describe('WorkflowNode', () => {
  it('renders only an icon, title, and truncated description for a message', () => {
    const wrapper = mountNode({
      parentId: 'parent',
      hasChildren: false,
      type: 'sendMessage',
      title: 'Welcome Message',
      message: 'Welcome aboard',
    })

    expect(wrapper.find('.node-icon').text()).toBe('✉')
    expect(wrapper.find('strong').text()).toBe('Welcome Message')
    expect(wrapper.text()).toContain('Welcome aboard')
    expect(wrapper.find('[aria-label="More node options"]').exists()).toBe(false)
  })

  it('uses the saved description in preference to node-type content', () => {
    const wrapper = mountNode({
      parentId: 'parent',
      hasChildren: false,
      type: 'addComment',
      title: 'Internal note',
      description: 'A short node summary',
      comment: 'This is not shown when a description exists',
    })

    expect(wrapper.find('.node-copy p').text()).toBe('A short node summary')
  })
})
