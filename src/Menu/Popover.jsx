import React, { Component, PropTypes, createElement } from 'react'
import ReactDOM, { findDOMNode } from 'react-dom'
import focusTrap from 'focus-trap'
import noScroll from 'no-scroll'
import EventsHandler from './events-handler'
import specialAssign from '../special-assign'

const isTarget = (node, target) => (node === target || node.contains(target))

const checkedProps = {
  tag:                  PropTypes.string,
  children:             PropTypes.oneOfType([PropTypes.func, PropTypes.node]).isRequired,
  openOn:               PropTypes.oneOf(['tap', 'hover']),
  closeOnOutsideClick:  PropTypes.bool,
  closeOnItemSelection: PropTypes.bool,
  onOpen:               PropTypes.func,
  onClose:              PropTypes.func,
  onItemSelection:      PropTypes.func,
}

class Popover extends Component {
  static contextTypes = {
    ariaManager: PropTypes.object.isRequired
  }

  static propTypes = checkedProps

  static defaultProps = {
    tag:                  'div',
    openOn:               'tap',
    closeOnOutsideClick:  true,
    closeOnItemSelection: true,
    onOpen:               () => null,
    onClose:              () => null,
    onItemSelection:      () => null,
  }

  getChildContext() {
    return {
      ariaPopover: {
        open:            this.open,
        close:           this.close,
        toggle:          this.toggle,
        onItemSelection: this._onItemSelection
      }
    }
  }

  componentDidMount() {
    const { trapFocus, initialFocus, onClickOutside } = this.context.ariaManager

    this._setPopoverNode()

    if (trapFocus) {
      this._focusTrap = focusTrap(findDOMNode(this), {
        initialFocus,
        escapeDeactivates: false,
        clickOutsideDeactivates: true
      }).activate()
    }

    EventsHandler.add(this)
  }

  componentDidUpdate(lastProps, lastState, lastContext) {
    if (this.context.ariaManager.isPopoverOpen !== lastContext.ariaManager.isPopoverOpen) {
      this._setPopoverNode()
    }
  }

  componentWillUnmount() {
    if (this.context.ariaManager.trapFocus) {
      this._focusTrap.deactivate()
    }
    EventsHandler.remove(this)
  }

  _setPopoverNode() {
    this.context.ariaManager.setPopoverNode(findDOMNode(this))
  }

  _onTap(e) {
    if (this.props.openOn === 'tap') {
      this._handleTapOrHover(e)
    }
  }

  _onHover(e) {
    if (this.props.openOn === 'hover') {
      this._handleTapOrHover(e)
    }
  }

  _handleTapOrHover(e) {
    const { toggleNode, popoverNode } = this.context.ariaManager
    const { openOn, closeOnOutsideClick } = this.props
    const { target } = e

    if (toggleNode) {
      const toggleDisabled = toggleNode.getAttribute('disabled')

      if (isTarget(toggleNode, target) && toggleDisabled === null) {
        if (openOn === 'tap') {
          this.toggle(false)
        } else {
          this.open(false)
        }
        return
      }
      else if (closeOnOutsideClick && popoverNode && !isTarget(popoverNode, target)) {
        this.close(false)
        return
      }
    }

    // loop through memebers and determine if we clicked one or not
    for (let i = this._members.length; i--;) {
      const member = this._members[i]
      if (member.node === target) {
        if (member.type === 'item') {
          this._onItemSelection(member, e)
        } else {
          this._activateTab(member.id)
        }
        return
      }
    }
  }

  open = (focusFirstMember = true) => {
    const { ariaManager } = this.context
    const { freezeScroll, onOpen } = this.props

    if (ariaManager.isPopoverOpen) return;

    ariaManager.setState({ isPopoverOpen: true })

    if (freezeScroll) {
      noScroll.on()
    }

    onOpen()

    if (focusFirstMember) {
      setTimeout(() => {
        ariaManager.focusItem(0)
      }, 60)
    }
  }

  close = (focusToggle = true) => {
    const { ariaManager } = this.context
    const { freezeScroll, onClose } = this.props

    if (!ariaManager.isPopoverOpen) return;

    ariaManager.setState({ isPopoverOpen: false })

    if (freezeScroll) {
      noScroll.off()
    }

    onClose()

    if (focusToggle) {
      setTimeout(() => {
        ariaManager.toggleNode.focus()
      }, 60)
    }
  }

  toggle = (focusToggle) => {
    if (!this.context.ariaManager.isPopoverOpen) {
      this.open(focusToggle)
    } else {
      this.close(focusToggle)
    }
  }

  _onKeyDown({ keyCode }) {
    const { ariaManager } = this.context
    if (ariaManager.isPopoverOpen) {
      if (!ariaManager.trapFocus && keyCode === KEYS.tab) {
        this.close(false)
      }
      else if (keyCode === KEYS.escape) {
        this.close()
      }
    }
  }

  _onItemSelection = (item, e) => {
    const value = item.value || item.node.innerHTML

    if (this.props.closeOnItemSelection) {
      this.closePopover()
    }

    this.props.onItemSelection(value, e)
  }

  render() {
    const { type, uuid, isPopoverOpen } = this.context.ariaManager
    const { tag, children } = this.props
    const componentProps = {
      'aria-hidden': !isPopoverOpen,
      onKeyDown: this._onKeyDown
    }

    if (type === 'menu') {
      componentProps['role'] = 'menu'
    } else if (type === 'modal') {
      componentProps['role'] = 'dialog'
    } else if (type === 'alert') {
      componentProps['role'] = 'alertdialog'
    } else if (type === 'tooltip') {
      componentProps['id'] = uuid
      componentProps['role'] = 'tooltip'
    }

    if (type === 'popover') {
      componentProps['aria-labelledby'] = uuid
    }

    const props = specialAssign(componentProps, this.props, checkedProps)

    if (typeof children === 'function') {
      return children(props)
    }

    return createElement(tag, props, children)
  }
}

export default Popover
