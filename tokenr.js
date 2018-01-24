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
var rand = function(mi, ma) {
  var min = Math.ceil(mi);
  var max = Math.floor(ma+1);
  var r = Math.floor(Math.random() * (max - min)) + min;
  return r
}
var names = [
  'orc',
  'half-orc',
  'tengu',
  'goblin',
  'dryad',
  'elf',
  'halfling',
  'kobold',
  'dragon',
  'barbarian',
  'wizard',
  'fighter',
  'ranger',
  'druid',
  'bard',
  'rogue',
  'monk',
  'skeleton'
]
var name = names[rand(0, names.length)]
/* ======================== Editor ======================== */
var editor = new ktk.Emitter()
/* ======== Properties ======== */
editor.dom          = null
editor.isDragging         = false
editor.backBuffer   = document.createElement('canvas')
editor.overlay      = document.createElement('canvas')
editor.transparentColor = [255, 0, 255]
editor.desiredWidth = 1024;
editor.desiredHeight = 1024;
editor.scrollX = 0;
editor.scrollY = 0;
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
    effects.list[i].run(editor)
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
  }
  if (index < 0 || index >= effects.listDoms.length) {
    effects.selected = -1;
  } else {
    effects.selected = index;
    effects.listDoms[effects.selected].classList.add("selected")
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
    type: 'button', value: 'remove', onclick: function(e) {
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
    /* ==== Effect: Border Stroke ==== */
    effects.emit('import', {
      name: 'border stroke',
      image: null,
      canvas: null,
      width: null,
      color: null,
      setup: function(editor) {
        var self = this;
        self.image = new Image();
        self.image.onload = function() {
          editor.emit('render');
        }
        self.canvas = document.createElement('canvas');
      },
      update: function(editor) {
        var self = this;
        var w = editor.dom.width
        var hw = editor.dom.width/2
        var h = editor.dom.height
        var hh = editor.dom.height/2
        var lw = parseInt(self.width.value)
        self.canvas.width = w*2
        self.canvas.height = h
        ctx = self.canvas.getContext('2d')
        // stroke our alpha mask
        ctx.beginPath()
        ctx.arc(w+hw, hh, hw-lw, 0, Math.PI*2, true)
        ctx.closePath()
        ctx.fill()
        // stroke our border
        ctx.beginPath()
        ctx.strokeStyle = self.color.value;
        ctx.lineWidth = lw
        ctx.arc(hw, hh, hw-lw, 0, Math.PI*2, true)
        ctx.closePath()
        ctx.stroke()
        self.image.src = self.canvas.toDataURL();
      },
      run: function(editor) {
        var self = this;
        var ctx = editor.dom.getContext('2d');
        ctx.globalCompositeOperation = 'destination-in'
        ctx.drawImage(self.image, self.image.width/2, 0, self.image.width/2, self.image.height, 0, 0, self.image.width/2, self.image.height)
        ctx.globalCompositeOperation = 'source-over'
        ctx.drawImage(self.image, 0, 0, self.image.width/2, self.image.height, 0, 0, self.image.width/2, self.image.height)
        ctx.globalCompositeOperation = 'source-over'
      },
      view: function(editor) {
        var self = this;
        self.color = effects.fab('input', {
          type: 'color',
          value: '#fff',
          oninput: function(e) {
            self.update(editor);
            editor.emit('render');
          }
        });
        self.width = effects.fab('input', {
          type: 'number',
          style: 'width: 4em',
          value: 10,
          oninput: function(e) {
            self.update(editor);
            editor.emit('render');
          }
        });
        self.update(editor);
        return [self.color, self.width];
      }
    });
    /* ==== Effect: Image ==== */
    effects.emit('import', {
      name: 'image',
      src: null,
      loadListener: null,
      image: null,
      offsetX: null,
      offsetY: null,
      sizeX: null,
      sizeY: null,
      mouseDown: null,
      mouseWheel: null,
      run: function(editor) {
        var self = this
        ctx = editor.dom.getContext('2d');
        ctx.drawImage(self.image, self.offsetX.value, self.offsetY.value, self.sizeX.value, self.sizeY.value);
      },
      import: function(editor) {
        // Add 'drop' event listener to the editor view.
        editor.dom.addEventListener('drop', function(e) {
          editor.effects.emit('add', 'image')
          editor.effects.select(editor.effects.list.length-1)
          editor.effects.list[editor.effects.list.length-1].onDrop(e)
        }, false)

        // Add 'mouse'-related handlers for managing image effect selection and focus.
        var mouse_x = 0, mouse_y = 0, effect_index = -1
        function mouseDown(e) {
          var rect = editor.dom.getBoundingClientRect()
          var x = e.clientX - rect.left
          var y = e.clientY - rect.top

          // Iterate through our effects from last to first.
          for (var i = editor.effects.list.length-1; i >= 0; i--) {
            if (editor.effects.list[i].name !== 'image') continue
            var effect = editor.effects.list[i];
            // Do some collision detection.
            var l = parseFloat(effect.offsetX.value)
              , r = (l + parseFloat(effect.sizeX.value))
              , t = parseFloat(effect.offsetY.value)
              , b = (t + parseFloat(effect.sizeY.value))
            l *= editor.zoom, r *= editor.zoom, t *= editor.zoom, b *= editor.zoom
            if (x >= l && x <= r && y >= t && y <= b) {
              editor.effects.select(effect.getIndex())
              effect_index = i;
              e.preventDefault();
              e.stopImmediatePropagation()
              editor.dom.addEventListener('mousemove', mouseMove);
              editor.dom.addEventListener('mouseup', mouseUp);
              document.addEventListener('mouseout', mouseUp);
              mouse_x = e.clientX
              mouse_y = e.clientY
              break;
            } else {
              continue
            }
          }
        }
        function mouseUp(e) {
          if (effect_index == -1) return;
          var effect = editor.effects.list[effect_index]
          effect.transform({
            offset_x: Math.round(parseFloat(effect.offsetX.value)),
            offset_y: Math.round(parseFloat(effect.offsetY.value))
          })
          editor.dom.removeEventListener('mouseup', mouseUp);
          editor.dom.removeEventListener('mousemove', mouseMove);
          document.removeEventListener('mouseout', mouseUp);
          editor.emit('render')
          effect_index = -1;
        }
        function mouseMove(e) {
          if (effect_index == -1) return;
          var effect = editor.effects.list[effect_index]
          var delta_x = mouse_x - e.clientX
          var delta_y = mouse_y - e.clientY
          effect.transform({
            offset_x: parseFloat(effect.offsetX.value) - delta_x * editor.zoomInv,
            offset_y: parseFloat(effect.offsetY.value) - delta_y * editor.zoomInv
          })
          mouse_x = e.clientX
          mouse_y = e.clientY
          editor.emit('render')
        }
        editor.dom.addEventListener('mousedown', mouseDown);
      },
      remove: function(editor) {
        editor.dom.removeEventListener(this.wheelEvent, this.mouseWheel);
      },
      transform: function(t) {
        var self = this
        if (t.size_x !== undefined) self.sizeX.value = t.size_x
        if (t.size_y !== undefined) self.sizeY.value = t.size_y
        if (t.offset_x !== undefined) self.offsetX.value = t.offset_x
        if (t.offset_y !== undefined) self.offsetY.value = t.offset_y
      },
      setup: function(editor) {
        var self = this;
        self.wheelEvent = "onwheel" in document.createElement("div") ? "wheel" : document.onmousewheel !== undefined ? "mousewheel" : "DOMMouseScroll";
        self.mouseWheel = function(e) {
          if (!self.isSelected()) return
          e.preventDefault()
          var deltaY = 0;
          if (self.wheelEvent == 'mousewheel') {
            deltaY = - 1/40 * e.wheelDelta
          } else {
            deltaY = e.deltaY || e.detail
          }
          var scale = editor.dom.height / editor.dom.offsetHeight
          deltaY *= scale;
          var ar = parseFloat(self.sizeX.value) / parseFloat(self.sizeY.value);
          self.transform({
            size_x: parseFloat(self.sizeX.value) + deltaY * ar,
            size_y: parseFloat(self.sizeY.value) + deltaY,
            offset_x: parseFloat(self.offsetX.value) - (deltaY * ar / 2),
            offset_y: parseFloat(self.offsetY.value) - (deltaY / 2)
          })
          editor.emit('render')
        }
        editor.dom.addEventListener(self.wheelEvent, self.mouseWheel, false);
        // Add handlers for dropping images/urls onto the input field or the image.
        self.onDrop = function(e) {
          e.preventDefault()
          if (!self.isSelected()) return
      
          var data = e.dataTransfer.items
          // Allow URL pasting
          if (data[0].kind == 'string') {
            data[0].getAsString(function(src) {
              src = src.split('\n')[0]
            })
          } else {
            var src = data[0].getAsFile()
            if (!src.type.match(/image.*/)) {
              alert("The dropped file is not an image: " + src.type)
            } else {
              var reader = new FileReader()
              reader.onload = function (e) {
                self.image.src = e.target.result;
              }
              reader.readAsDataURL(src)
            }
          }
        }
      },
      view: function(editor) {
        var self = this
        self.src = effects.fab('input', {
          value: '',
          oninput: function(e) {
            self.image.src = e.target.value;
          },
          ondrop: self.onDrop
        })
        self.image = effects.fab('img', {
          onload: function(e) {
            self.transform({
              size_x: self.image.naturalWidth ? self.image.naturalWidth : 512,
              size_y: self.image.naturalHeight ? self.image.naturalHeight : 512,
              offset_x: Math.floor(editor.dom.width/2 - parseInt(self.sizeX.value)/2),
              offset_y: Math.floor(editor.dom.height/2 - parseInt(self.sizeY.value)/2)
            })
            editor.emit('render');
          },
          ondrop: self.onDrop
        })
        var offsetContainer = effects.fab('div');
        self.offsetX = effects.fab('input', {
          type: 'number',
          style: 'width: 4em',
          value: 0,
          oninput: function() {
            editor.emit('render')
          }
        });
        self.offsetY = effects.fab('input', {
          type: 'number',
          style: 'width: 4em',
          value: 0,
          oninput: function() {
            editor.emit('render')
          }
        });
        offsetContainer.appendChild(self.offsetX);
        offsetContainer.appendChild(self.offsetY);

        var sizeContainer = effects.fab('div');
        self.sizeX = effects.fab('input', {
          type: 'number',
          style: 'width: 4em',
          value: '512',
          oninput: function() {
            editor.emit('render')
          }
        })
        self.sizeY = effects.fab('input', {
          type: 'number',
          style: 'width: 4em',
          value: '512',
          oninput: function() {
            editor.emit('render')
          }
        })
        sizeContainer.appendChild(self.sizeX)
        sizeContainer.appendChild(self.sizeY)
        var containers = effects.fab('div', { className: 'cols' })
        containers.appendChild(offsetContainer)
        containers.appendChild(sizeContainer)
        return [self.image, self.src, containers]
      }
    })
    /* ==== Effect: Image Fill ==== */
    /* ==== Effect: Color Fill ==== */
    effects.emit('import', {
      name: 'color fill',
      color: '#000',
      alpha: 1.0,
      run: function(editor) {
        ctx = editor.dom.getContext('2d')
        ctx.globalAlpha = this.alpha
        ctx.fillStyle = this.color
        ctx.fillRect(0, 0, editor.dom.width, editor.dom.height)
        ctx.globalAlpha = 1.0
      },
      view: function(editor) {
        var self = this
        var color = effects.fab('input', {
          type: 'color',
          oninput: function(e) {
            self.color = e.target.value
            editor.emit('render')
          }
        })
        var alphaSlider = effects.fab('input', {
          type: 'range',
          size: 3,
          min: 0,
          max: 100,
          step: 1,
          value: 100,
          oninput: function(e) {
            self.alpha = parseInt(alphaSlider.value)/100
            editor.emit('render')
          }
        })
        return [color, alphaSlider]
      }
    })
    /* ==== Effect: Linear Gradient ==== */
    effects.emit('import', {
      name: 'linear gradient',
      aAlpha: 1.0,
      aColor: '#000000',
      bAlpha: 0.0,
      bColor: '#000000',
      containerType: 'cols',
      run: function(editor) {
        function hexToRgb(hex) {
          var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
          return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
          } : null;
        }
        var ctx = editor.dom.getContext('2d')
        var gradient = ctx.createLinearGradient(0, 0, 0, editor.dom.height)
        var aColor = hexToRgb(this.aColor)
        var bColor = hexToRgb(this.bColor)
        gradient.addColorStop(0, 'rgba('+aColor.r+','+aColor.g+','+aColor.b+', '+this.aAlpha+')')
        gradient.addColorStop(1, 'rgba('+bColor.r+','+bColor.g+','+bColor.b+', '+this.bAlpha+')')
        ctx.fillStyle = gradient
        ctx.fillRect(0, 0, editor.dom.width, editor.dom.height)
      },
      view: function(editor) {
        var self = this
        var containerA = effects.fab('div')
        var colorA  = effects.fab('input', { type: 'color' })
        colorA.oninput = function(e) { self.aColor = e.target.value; editor.emit('render') }
        var alphaA = effects.fab('input', { type: 'range', min: 0, max: 100, step: 1, value: 100 })
        alphaA.oninput = function(e) { self.aAlpha = e.target.value / 100; editor.emit('render') }
        containerA.appendChild(colorA); containerA.appendChild(alphaA)

        var containerB = effects.fab('div')
        var colorB  = effects.fab('input', { type: 'color' })
        colorB.oninput = function(e) { self.bColor = e.target.value; editor.emit('render') }
        var alphaB = effects.fab('input', { type: 'range', min: 0, max: 100, step: 1, value: 0 })
        alphaB.oninput = function(e) { self.bAlpha = e.target.value / 100; editor.emit('render') }
        containerB.appendChild(colorB); containerB.appendChild(alphaB);
        return [containerA, containerB]
      }
    })
  }
}
})()
