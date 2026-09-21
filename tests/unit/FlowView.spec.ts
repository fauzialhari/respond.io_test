import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import FlowView from '../../src/views/FlowView.vue'

describe('FlowView', () => {
  it('renders the workflow canvas placeholder', () => {
    const wrapper = mount(FlowView)

    expect(wrapper.get('h1').text()).toBe('Workflow canvas')
    expect(wrapper.find('[aria-label="Workflow canvas"]').exists()).toBe(true)
  })
})
