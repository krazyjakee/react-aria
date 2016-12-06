import React, { Component, PropTypes, createElement } from 'react'
import createFocusGroup from 'focus-group'
import specialAssign from './special-assign'

const KEYS = {
  tab:        9,
  escape:     27,
  end:        35,
  home:       36,
  arrowLeft:  37,
  arrowUp:    38,
  arrowRight: 39,
  arrowDown:  40,
}

const checkedProps = {
  type:                 PropTypes.oneOf(['menu', 'popover', 'modal', 'tooltip', 'alert', 'tabs', 'accordion']).isRequired,
  tag:                  PropTypes.string,
  trapFocus:            PropTypes.bool,
  freezeScroll:         PropTypes.bool,
  activeTabId:          PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  children:             PropTypes.oneOfType([PropTypes.func, PropTypes.node]).isRequired,
  keybindings: PropTypes.shape({
    next:  PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
    prev:  PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
    first: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
    last:  PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
  }),
  wrap:                 PropTypes.bool,
  stringSearch:         PropTypes.bool,
  stringSearchDelay:    PropTypes.number,
  collapsible:          PropTypes.bool,
  accordion:            PropTypes.bool,
}

class Manager extends Component {
  static childContextTypes = {
    ariaManager: PropTypes.object.isRequired
  }

  static propTypes = checkedProps

  static defaultProps = {
    tag:                  'div',
    trapFocus:            false,
    freezeScroll:         false,
    keybindings: {
      next:  [{ keyCode: KEYS.arrowDown }, { keyCode: KEYS.arrowRight }],
      prev:  [{ keyCode: KEYS.arrowUp }, { keyCode: KEYS.arrowLeft }],
      first: { keyCode: KEYS.home },
      last:  { keyCode: KEYS.end }
    },
    wrap:                 true,
    stringSearch:         true,
    stringSearchDelay:    600,
    collapsible:          false,
  }

  constructor(props) {
    super(props)

    this.state = {
      isPopoverOpen: false
    }

    this._focusGroup  = createFocusGroup(props)
    this._toggleNode  = null
    this._popoverNode = null
    this._members     = []
    this._panels      = []
    this._activeTabId = props.activeTabId
    this._uuid        = 'RA' + Math.abs(~~(Math.random() * new Date()))
  }

  getChildContext() {
    return {
      ariaManager: {
        uuid:            this._uuid,
        type:            this.props.type,
        trapFocus:       this.props.trapFocus,
        initialFocus:    this.props.initialFocus,
        isPopoverOpen:   this.state.isPopoverOpen,
        onItemSelection: this._onItemSelection,
        setToggleNode:   this._setToggleNode,
        setPopoverNode:  this._setPopoverNode,
        addMember:       this._addMember,
        removeMember:    this._removeMember,
        addPanel:        this._addPanel,
        toggleNode:      this._toggleNode,
        popoverNode:     this._popoverNode,
        members:         this._members,
        panels:          this._panels,
        activateTab:     this._activateTab,
        focusItem:       this._focusItem,
        setState:        this.setState
      }
    }
  }

  componentWillMount() {
    this._focusGroup.activate()
  }

  componentWillUnmount() {
    this._focusGroup.deactivate()
  }

  _setToggleNode = (node) => {
    this._toggleNode = node
  }

  _setPopoverNode = (node) => {
    this._popoverNode = node
  }

  _addMember = (member) => {
    const { activeTabId } = this.props
    const { id, index, node, text } = member

    if (index === undefined) {
      this._members.push(member)
    } else {
      this._members.splice(index, 0, member)
    }

    this._focusGroup.addMember({
      node,
      text: text || node.innerHTML
    })

    if (member.type === 'tab') {
      if (activeTabId === id) {
        this._activateTab(activeTabId, true, false)
      } else {
        this._handleFirstTabSelection(id)
      }
    }
  }

  _removeMember = (member) => {
    const pos = this._members.indexOf(member)

    if (pos > -1) {
      this._members.splice(member, 1)
      this._focusGroup.removeMember(member.node)
    }
  }

  _focusItem = (index) => {
    this._focusGroup.focusNodeAtIndex(index)
  }

  _addPanel = (panel) => {
    const { activeTabId } = this.props
    const { controlledBy } = panel

    this._panels.push(panel)

    if (activeTabId === controlledBy) {
      this._activateTab(activeTabId, true, false)
    } else {
      this._handleFirstTabSelection(panel.controlledBy)
    }
  }

  _focusTab = (id) => {
    const tabToFocus = this._members.filter(tab => tab.id === id)
    if (tabToFocus) {
      tabToFocus.node.focus()
    }
  }

  _activateTab = (id, forceActivate, shouldChange = true) => {
    const { type, onChange } = this.props

    if (type === 'tabs') {
      if (id === this._activeTabId && !forceActivate) {
        return
      } else {
        this._activeTabId = id
      }
    }

    // shouldChange makes sure we don't fire callbacks when we don't need to
    if (shouldChange && typeof onChange === 'function') {
      onChange(id)

      // if onChange is being used we don't need to go any farther since the
      // user is now controlling state
      return
    }

    for (let i = this._members.length; i--;) {
      const tab = this._members[i]
      if (type === 'accordion') {
        if (tab.id === id) {
          tab.toggleActiveState()
        }
      } else {
        tab.setActiveState(id === tab.id)
      }
    }
    for (let i = this._panels.length; i--;) {
      const panel = this._panels[i]
      if (type === 'accordion') {
        if (panel.controlledBy === id) {
          panel.toggleActiveState()
        }
      } else {
        panel.setActiveState(id === panel.controlledBy)
      }
    }
  }

  _handleFirstTabSelection(id) {
    if (this.props.type === 'tabs' && !this._activeTabId || id === this._activeTabId) {
      this._activateTab(id, true, false)
    }
  }

  render() {
    const { tag, children } = this.props
    const props = specialAssign({}, this.props, checkedProps)

    if (typeof children === 'function') {
      return children(this.state.isPopoverOpen)
    }

    return createElement(tag, props, children)
  }
}

export default Manager
