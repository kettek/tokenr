var ktk = ktk || {}
ktk.Emitter = ktk.Emitter || function() {
  this._events = []
  this.on = function(name, cb) {
    if (!this._events[name]) this._events[name] = []
    this._events[name].push(cb)
    return this
  }
  this.rem = function(name, cb) {
    if (!this._events[name]) return this
    this._events[name].splice(this._events[name].indexOf(cb), 1)
    return this
  }
  this.emit = function(name, e) {
    if (!this._events[name]) return this
    for (var i = 0; i < this._events[name].length; i++) {
      this._events[name][i](e)
    }
    return this
  }
}
/**
*/
ktk.Tokenr = (function() {
/* ================================ PRIVATE ================================ */
/* ======================== Editor ======================== */
var editor = new ktk.Emitter()
/* ======== Properties ======== */
editor.dom          = null
editor.backBuffer   = document.createElement('canvas')
editor.overlay      = document.createElement('canvas')
editor.desiredWidth = 1024;
editor.desiredHeight = 1024;
editor.zoom    = 1.0;
editor.zoomInv = 1.0;
/* ======== Methods ======== */
editor.on('init', function(dom) {
  editor.dom = dom
  var width = document.getElementById('tokenr-output-width');
  var height = document.getElementById('tokenr-output-height');
  width.addEventListener('input', function(e) {
    editor.desiredWidth = parseInt(e.target.value);
    height.value = e.target.value;
    editor.desiredHeight = parseInt(height.value)
    editor.emit('update');
  });
  height.addEventListener('input', function(e) {
  });
})
editor.on('render', function() {
  function scaleView() {
    var r = editor.dom.parentNode.getBoundingClientRect()
    var view = r.height > r.width ? r.width : r.height
    editor.zoom = view / editor.desiredWidth
    editor.zoomInv = editor.desiredWidth / view
    editor.dom.style.width = editor.desiredWidth * editor.zoom + 'px'
    editor.dom.style.height = editor.desiredHeight * editor.zoom + 'px'
  }
  scaleView()
  ctx = editor.dom.getContext('2d')
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, editor.dom.width, editor.dom.height)
  // render effects
  ctx.globalCompositeOperation = 'source-over'
  for (var i = 0; i < effects.list.length; i++) {
    effects.list[i].render(editor)
  }
})
editor.on('update', function() {
  editor.dom.width = editor.desiredWidth;
  editor.dom.height = editor.desiredWidth;

  // Update our effects if they desire
  for (var i = 0; i < effects.list.length; i++) {
    if (effects.list[i].update) effects.list[i].update(editor);
  }

  editor.emit('render')
  return this
})

/* Tokenr Effects
* Effects are added to Tokenr by passing an effect object as the parameter to
* the editor's import event. These objects should contain the following properties,
* with optional properties surrounded by brackets.
*   * `import`
*     - Called once during the importing of the effect.
*     - Setup shared logic for all instances of the effect.
*   * `setup`
*     - Called once during the creation of the effect.
*     - Setup instance logic and structures.
*   * `view`
*     - Called once during the creation of the effect and after `setup`.
*     - Return an array of DOM elements that represent the effect's controls
*   * `update`
*     - Called whenever the editor should force internal recalculations from
*       canvas size changes and similar. Calls `render` afterwards.
*     - Update internal data to match the dimensions of the canvas, etc.
*   * `render`
*     - Called whenever the editor renders the token view.
*     - Render the effects to the editor's canvas.
*   * `focus`
*     - Called whenever the effect is selected in the effects list.
*     - Display overlays.
*   * `defocus`
*     - Called whenever the effect is deselected in the effects list.
*     - Hide overlays.
*/
/* effect: {[import], [setup], view, render, [focus], [unfocus]} */
var effects = new ktk.Emitter()
editor.effects = effects;
effects.domAdd    = null
effects.domSelect = null
effects.domList   = null
effects.available = []
effects.list      = []
effects.listDoms  = []
effects.selected  = -1
effects.syncList  = function() {
  var remap = [], list = [], listDoms = [];
  for (var i = 0; i < effects.listDoms.length; i++) {
    remap.push([i, Array.prototype.indexOf.call(effects.domList.children, effects.listDoms[i])])
  }
  for (var i = 0; i < remap.length; i++) {
    list[remap[i][1]] = effects.list[remap[i][0]]
    listDoms[remap[i][1]] = effects.listDoms[remap[i][0]]
  }
  effects.list = list
  effects.listDoms = listDoms
  editor.emit('render')
}
effects.select   = function(index) {
  if (effects.selected >= 0 && effects.listDoms[effects.selected]) {
    effects.listDoms[effects.selected].classList.remove("selected")
    if (effects.list[effects.selected].defocus) effects.list[effects.selected].defocus(editor)
  }
  if (index < 0 || index >= effects.listDoms.length) {
    effects.selected = -1;
  } else {
    effects.selected = index;
    effects.listDoms[effects.selected].classList.add("selected")
    if (effects.list[effects.selected].focus) effects.list[effects.selected].focus(editor)
  }
}

effects.on('init', function(dom) {
  effects.domAdd = dom.querySelector('#tokenr-effects-add')
  effects.domSelect = dom.querySelector('#tokenr-effects-select')
  effects.domList = dom.querySelector('#tokenr-effects-list')

  effects.domAdd.addEventListener('click', function(e) {
    effects.emit('add', effects.domSelect.selectedIndex)
  })
})
effects.on('import', function(obj) {
  var opt = document.createElement('option')
  opt.text = obj.name
  effects.domSelect.add(opt)
  effects.available.push(obj)
  if (obj.import) {
    obj.import(editor)
    delete obj.import
  }
  // TODO: Sort imports alphabetically (or otherwise)
})
effects.on('add', function(index) {
  if (typeof index === "string") {
    index = effects.available.map(function(e) { return e.name }).indexOf(index)
  }
  if (index < 0 || index >= effects.available.length) return
  var effect = Object.assign({}, effects.available[index])
  var selected_index = -1
  var itemContainer = effects.fab('div', {className: 'tokenr-effects-item', onmousedown: function(e) {
    effects.select(Array.prototype.indexOf.call(effects.domList.children, this))
  }})
  effect.dom = itemContainer
  var effect_setup = effect.setup ? effect.setup(editor) : null
  var effect_view = effect.view(editor) || []

  effect.isSelected = function() {
    return this.getIndex() == effects.selected
  }
  effect.getIndex = function() {
    return Array.prototype.indexOf.call(effects.domList.children, this.dom)
  }
  var itemContent = effects.fab('div', {className: (effect.containerType ? effect.containerType+' ' : '') + 'tokenr-effects-item-content'})
  for (var i = 0; i < effect_view.length; i++) {
    itemContent.appendChild(effect_view[i])
  }
  // DODGY item movement code
  function mouseUp(e) {
    window.removeEventListener('mouseup', mouseUp)
    if (selected_index < 0) return
    var selected_dom = effects.listDoms[selected_index]
    var selected_effect = effects.list[selected_index]
    selected_dom.style.opacity = ''
    for (var i = 0; i < effects.listDoms.length; i++) {
      var dom = effects.listDoms[i]
      var effect = effects.list[i]
      var r = dom.getBoundingClientRect()
      if (e.clientY >= r.top && e.clientY <= r.bottom) {
        if (i >= selected_index) {
          effects.domList.insertBefore(selected_dom, dom.nextSibling)
        } else {
          effects.domList.insertBefore(selected_dom, dom)
        }
        break;
      }
    }
    effects.syncList();
    selected_index = null;
  }
  // DODGY item movement code END
  itemContainer.appendChild(effects.fab('div', {
    className: 'tokenr-effects-item-move',
    onmousedown: function(e) {
      selected_index = Array.prototype.indexOf.call(effects.domList.children, this.parentNode);
      effects.listDoms[selected_index].style.opacity = 0.5
      window.addEventListener('mouseup', mouseUp)
    }
  }))
  itemContainer.appendChild(itemContent)
  itemContainer.appendChild(effects.fab('input', {
    type: 'button', className: 'tokenr-effects-item-remove', value: 'remove', onclick: function(e) {
      effects.emit('rem', itemContainer)
    }
  }))
  effects.domList.appendChild(itemContainer)
  effects.listDoms.push(itemContainer)
  effects.list.push(effect)
  if (effects.selected < 0) {
    effects.select(0);
  }
  editor.emit('render')
})
effects.on('rem', function(el) {
  var index = effects.listDoms.indexOf(el)
  if (index == -1) return
  if (index == effects.selected) {
    effects.select(index+1 < effects.listDoms.length ? index+1 : index-1);
  }
  if (effects.list[index].remove) effects.list[index].remove(editor)
  effects.listDoms[index].parentNode.removeChild(effects.listDoms[index])
  effects.listDoms.splice(index, 1)
  effects.list.splice(index, 1)
  editor.emit('render')
})
effects.fab = function(tag, props) {
  var el = document.createElement(tag)
  Object.assign(el, props)
  return el
}
/* ================================ PUBLIC ================================ */
return {
  init: function(dom) {
    function preventDefault(e) { e.preventDefault() }
    editor.emit('init', dom.querySelector('#tokenr-view-canvas')).emit('update')
    dom.addEventListener('drop', preventDefault, true)
    dom.addEventListener('dragleave', preventDefault, true)
    dom.addEventListener('dragover', preventDefault, true)

    window.addEventListener('resize', function() {
      editor.emit('update');
    });
    effects.emit('init', dom.querySelector('#tokenr-effects'))
  },
  import: function(effect, cb) {
    if (typeof effect === 'string') {
      var script = document.createElement('script');
      script.setAttribute('type', 'text/javascript')
      script.setAttribute('src', effect)
      script.addEventListener('load', function(e) { cb(script) });
      script.addEventListener('error', function(e) { alert(e); });
      document.getElementsByTagName('head')[0].appendChild(script);
    } else if (typeof effect === 'object') {
      if (effect.constructor === Array) {
        var s = this
        function next(i, cb) {
          if (i >= effect.length) {
            if (cb) cb()
            return
          }
          s.import(effect[i], function() {
            next(++i, cb)
          })
        }
        next(0)
      } else {
        effects.emit('import', effect)
      }
    }
  }
}
})()
