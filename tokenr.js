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
/* ======== Methods ======== */
editor.on('init', function(dom) {
  editor.dom = dom
  dom.addEventListener('dragover', function(e) {
    e.preventDefault()
    var w = editor.dom.width / 6
    var h = editor.dom.height / 6
    var r = editor.dom.getBoundingClientRect()
    var x = e.clientX - r.left
    var y = e.clientY - r.top

    ctx = editor.overlay.getContext('2d')
    ctx.clearRect(0, 0, editor.dom.width, editor.dom.height)
    ctx.font = '32pt Bowlby One SC'
    ctx.lineWidth = 2;
    ctx.textAlign = 'center'

    ctx.globalAlpha = 0.25
    ctx.fillStyle = '#000'
    ctx.strokeStyle = '#fff'
    if (x >= w && x <= editor.dom.width-w
        && y >= h && y <= editor.dom.height-h) {
      ctx.fillRect(w, h, editor.dom.width-w*2, editor.dom.height-h*2)
      ctx.globalAlpha = 1.0
      ctx.fillText('Use Image', editor.dom.width/2, editor.dom.height/2-24+16)
      ctx.strokeText('Use Image', editor.dom.width/2, editor.dom.height/2-24+16)
      ctx.fillText('as Token', editor.dom.width/2, editor.dom.height/2+24+16)
      ctx.strokeText('as Token', editor.dom.width/2, editor.dom.height/2+24+16)
    } else {
      ctx.fillRect(0, h, w, editor.dom.height-h*2)
      ctx.fillRect(0, 0, editor.dom.width, h)
      ctx.fillRect(editor.dom.width-w, h, w, editor.dom.height-h*2)
      ctx.fillRect(0, editor.dom.height-h, editor.dom.width, h)
      ctx.globalAlpha = 1.0
      ctx.fillText('Use Image', editor.dom.width/2, editor.dom.height/2-24+16)
      ctx.strokeText('Use Image', editor.dom.width/2, editor.dom.height/2-24+16)
      ctx.fillText('as Border', editor.dom.width/2, editor.dom.height/2+24+16)
      ctx.strokeText('as Border', editor.dom.width/2, editor.dom.height/2+24+16)
    }
    editor.isDragging = true
    editor.emit('render')
  }, true)
  dom.addEventListener('dragleave', function(e) {
    e.preventDefault()
    ctx = editor.overlay.getContext('2d')
    ctx.clearRect(0, 0, editor.dom.width, editor.dom.height)
    editor.isDragging = false
    editor.emit('render')
  })
  dom.addEventListener('drop', function(e) {
    e.preventDefault()
    ctx = editor.overlay.getContext('2d')
    ctx.clearRect(0, 0, editor.dom.width, editor.dom.height)

    var w = editor.dom.width / 6
    var h = editor.dom.height / 6
    var r = editor.dom.getBoundingClientRect()
    var x = e.clientX - r.left
    var y = e.clientY - r.top

    var data = e.dataTransfer.items
    // Allow URL pasting
    if (data[0].kind == 'string') {
      data[0].getAsString(function(src) {
        src = src.split('\n')[0]
        if (x >= w && x <= editor.dom.width-w
            && y >= h && y <= editor.dom.height-h) {
          //editor.tokenImage.src = src
        } else {
          //editor.borderImage.src = src
        }
      })
    } else {
      var src = data[0].getAsFile()
      if (!src.type.match(/image.*/)) {
        alert("The dropped file is not an image: " + src.type)
      } else {
        var reader = new FileReader()
        reader.onload = function (e) {
          if (x >= w && x <= editor.dom.width-w
              && y >= h && y <= editor.dom.height-h) {
            //editor.tokenImage.src = e.target.result
          } else {
            //editor.borderImage.src = e.target.result
          }
        }
        reader.readAsDataURL(src)
      }
    }
    editor.isDragging = false
    editor.emit('render')
  }, true)
  // field functionality
  var range   = document.getElementById('tokenr-scale-range')
  var field   = document.getElementById('tokenr-scale-field')
  range.addEventListener('input', function(e) {
    field.value = e.target.value
    var event = new Event('input');
    field.dispatchEvent(event)
  })
  field.value = range.value
  field.addEventListener('input', function(e) {
    /*var last = editor.tokenImageZoom
    range.value = field.value
    editor.tokenImageZoom = parseInt(field.value) / 100
    editor.tokenImageLeft += (editor.tokenImage.width/2) * (last - editor.tokenImageZoom) 
    editor.tokenImageTop += (editor.tokenImage.height/2) * (last - editor.tokenImageZoom) */
    editor.emit('render')
  })
  //editor.tokenImageZoom = parseInt(field.value) / 100
  var width = document.getElementById('tokenr-output-width');
  var height = document.getElementById('tokenr-output-height');
  width.addEventListener('input', function(e) {
    editor.desiredWidth = parseInt(e.target.value);
    height.value = e.target.value;
    editor.emit('update');
  });
  height.addEventListener('input', function(e) {
  });
})
editor.on('render', function() {
  ctx = editor.dom.getContext('2d')
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, editor.dom.width, editor.dom.height)
  // render background effects
  ctx.globalCompositeOperation = 'source-over'
  for (var i = 0; i < effects.list.length; i++) {
    if (!effects.list[i].isBackground) {
      continue
    }
    effects.list[i].run(editor)
  }
  // render foreground effects
  for (var i = 0; i < effects.list.length; i++) {
    if (effects.list[i].isBackground) continue
    effects.list[i].run(editor)
  }
  /*if (!editor.isDragging && editor.tokenImage.width == 0) {
    ctx.font = '32pt Bowlby One SC'
    ctx.lineWidth = 2;
    ctx.textAlign = 'center'
    ctx.fillStyle = '#000'
    ctx.strokeStyle = '#fff'
    ctx.fillText('Drop '+name+' here', editor.dom.width/2, editor.dom.height/2+16)
    ctx.strokeText('Drop '+name+' here', editor.dom.width/2, editor.dom.height/2+16)
  } else {
    ctx.drawImage(editor.overlay, 0, 0)
  }*/
})
editor.on('update', function() {
  /*var pow_width = parseInt(editor.dom.offsetWidth)-1
  pow_width |= pow_width >> 1; pow_width |= pow_width >> 2;
  pow_width |= pow_width >> 4; pow_width |= pow_width >> 8;
  pow_width |= pow_width >> 16; pow_width++;

  editor.dom.width = pow_width
  editor.dom.height = pow_width*/
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
effects.domAdd    = null
effects.domSelect = null
effects.domList   = null
effects.available = []
effects.list      = []
effects.listDoms  = []
effects.on('init', function(dom) {
  effects.domAdd = dom.querySelector('#tokenr-editor-effects-add')
  effects.domSelect = dom.querySelector('#tokenr-editor-effects-select')
  effects.domList = dom.querySelector('#tokenr-editor-effects-list')

  effects.domAdd.addEventListener('click', function(e) {
    effects.emit('add', effects.domSelect.selectedIndex)
  })
})
effects.on('import', function(obj) {
  var opt = document.createElement('option')
  opt.text = obj.name
  effects.domSelect.add(opt)
  effects.available.push(obj)
})
effects.on('add', function(index) {
  if (index < 0 || index >= effects.available.length) return
  var effect = Object.assign({}, effects.available[index])
  var effect_setup = effect.setup ? effect.setup(editor) : null;
  var effect_view = effect.view(editor) || [];
  var itemContainer = effects.fab('div', {className: 'tokenr-editor-effects-item'})
  var itemContent = effects.fab('div', {className: (effect.containerType ? effect.containerType+' ' : '') + 'tokenr-editor-effects-item-content'})
  var elBackground = effects.fab('input', {type: 'checkbox', checked: effect.isBackground})
  elBackground.addEventListener('change', function(e) {
    effect.isBackground = e.target.checked
    editor.emit('render')
  })
  itemContent.appendChild(elBackground)
  for (var i = 0; i < effect_view.length; i++) {
    itemContent.appendChild(effect_view[i])
  }
  itemContainer.appendChild(effects.fab('div', {className: 'tokenr-editor-effects-item-move'}))
  itemContainer.appendChild(itemContent)
  var _index = effects.list.length
  itemContainer.appendChild(effects.fab('input', {
    type: 'button', value: 'remove', onclick: function(e) {
      effects.emit('rem', itemContainer)
    }
  }))
  effects.domList.appendChild(itemContainer)
  effects.listDoms.push(itemContainer)
  effects.list.push(effect)
  effect.index = effects.list.length-1;
  editor.emit('render')
})
effects.on('rem', function(el) {
  var index = effects.listDoms.indexOf(el)
  if (index == -1) return
  if (effects.list[index].remove) effects.list[index].remove(editor);
  effects.listDoms[index].parentNode.removeChild(effects.listDoms[index])
  effects.listDoms.splice(index, 1)
  effects.list.splice(index, 1)
  editor.emit('render')
})
// effects - background, colorize, inner-shadow, outer-shadow
effects.fab = function(tag, props) {
  var el = document.createElement(tag)
  Object.assign(el, props)
  return el
}
/* ================================ PUBLIC ================================ */
return {
  init: function(dom) {
    editor.emit('init', dom.querySelector('#tokenr-editor')).emit('update')
    window.addEventListener('resize', function() {
      editor.emit('update');
    });
    effects.emit('init', dom.querySelector('#tokenr-editor-effects'))
    effects.emit('import', {
      name: 'border stroke',
      image: null,
      canvas: null,
      width: null,
      color: null,
      isBackground: false,
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
    effects.emit('import', {
      isBackground: false,
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
      remove: function(editor) {
        editor.dom.removeEventListener('mousedown', this.mouseDown);
        editor.dom.removeEventListener('mousewheel', this.mouseWheel);
        editor.dom.removeEventListener('DOMMouseScroll', this.mouseWheel);
      },
      setup: function(editor) {
        var self = this;
        var mouse_x = 0;
        var mouse_y = 0;
        function mouseMove(e) {
          var scale_x = editor.dom.width / editor.dom.offsetHeight
          var scale_y = editor.dom.height / editor.dom.offsetHeight
          var delta_x = mouse_x - (e.screenX * scale_x)
          var delta_y = mouse_y - (e.screenY * scale_y)
          self.offsetX.value = parseInt(self.offsetX.value) - delta_x
          self.offsetY.value = parseInt(self.offsetY.value) - delta_y
          mouse_x = (e.screenX * scale_x)
          mouse_y = (e.screenY * scale_y)
          editor.emit('render')
        }
        self.mouseDown = function(e) {
          e.preventDefault();
          editor.dom.addEventListener('mousemove', mouseMove);
          editor.dom.addEventListener('mouseup', mouseUp);
          document.addEventListener('mouseout', mouseUp);
          var scale_x = editor.dom.width / editor.dom.offsetHeight
          var scale_y = editor.dom.height / editor.dom.offsetHeight
          mouse_x = e.screenX * scale_x;
          mouse_y = e.screenY * scale_y;
        }
        function mouseUp(e) {
          self.offsetX.value = Math.round(self.offsetX.value);
          self.offsetY.value = Math.round(self.offsetY.value);
          editor.dom.removeEventListener('mouseup', mouseUp);
          editor.dom.removeEventListener('mousemove', mouseMove);
          document.removeEventListener('mouseout', mouseUp);
        }
        editor.dom.addEventListener('mousedown', self.mouseDown);
        //
        var lastWheelMoveTime = 0;
        self.mouseWheel = function(e) {
          e.preventDefault();
          var move = (e.detail ? e.detail < 0 ? 1 : -1 : e.wheelDelta < 0 ? -1 : 1)
      
          var wheelMoveTime = new Date().getTime();
          var deltaMoveTime = wheelMoveTime - (lastWheelMoveTime == 0 ? wheelMoveTime : lastWheelMoveTime);
          // only accelerate if wheeltime was < 25ms
          if (deltaMoveTime < 25) {
            move *= deltaMoveTime;
          }
          lastWheelMoveTime = wheelMoveTime;

          var scale_x = editor.dom.width / editor.dom.offsetHeight
      
          self.sizeX.value = parseInt(self.sizeX.value) + (move * scale_x)
          self.sizeY.value = parseInt(self.sizeY.value) + (move * scale_x)
          editor.emit('render')
        }
        editor.dom.addEventListener('mousewheel', self.mouseWheel, false)
        editor.dom.addEventListener('DOMMouseScroll', self.mouseWheel, false)
      },
      view: function(editor) {
        var self = this
        self.src = effects.fab('input', {
          value: '',
          oninput: function(e) {
            self.image.src = e.target.value;
          }
        })
        self.image = effects.fab('img', {
          onload: function(e) {
            self.sizeX.value = self.image.naturalWidth ? self.image.naturalWidth : 512;
            self.sizeY.value = self.image.naturalHeight ? self.image.naturalHeight : 512;
            self.offsetX.value = Math.floor(editor.dom.width/2 - self.sizeX.value/2);
            self.offsetY.value = Math.floor(editor.dom.height/2 - self.sizeY.value/2);
            editor.emit('render');
          }
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
    effects.emit('import', {
      isBackground: true,
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
    effects.emit('import', {
      name: 'linear gradient',
      isBackground: false,
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
