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
/* ======================== Editor ======================== */
var editor = new ktk.Emitter()
/* ======== Properties ======== */
editor.dom          = null
editor.tokenImage   = new Image()
editor.tokenImageLeft   = 0
editor.tokenImageTop    = 0
editor.tokenImageZoom   = 1
editor.lastWheelMoveTime  = 0
editor.lastMousePositionX = 0
editor.lastMousePositionY = 0
editor.isDragging         = false
editor.borderImage  = new Image()
editor.borderImageLeft  = 0
editor.borderImageTop   = 0
editor.backBuffer   = document.createElement('canvas')
editor.overlay      = document.createElement('canvas')
editor.transparentColor = [255, 0, 255]
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
          editor.tokenImage.src = src
        } else {
          editor.borderImage.src = src
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
            editor.tokenImage.src = e.target.result
          } else {
            editor.borderImage.src = e.target.result
          }
        }
        reader.readAsDataURL(src)
      }
    }
    editor.isDragging = false
    editor.emit('render')
  }, true)
  editor.tokenImage.addEventListener('load', function() {
    editor.tokenImageLeft = Math.floor(editor.dom.width/2 - editor.tokenImage.width*editor.tokenImageZoom/2)
    editor.tokenImageTop = Math.floor(editor.dom.height/2 - editor.tokenImage.height*editor.tokenImageZoom/2)
    editor.emit('render')
  }, true)
  editor.borderImage.addEventListener('load', function() {
    editor.borderImageLeft = Math.floor(editor.dom.width/2 - editor.borderImage.width/4)
    editor.borderImageTop = Math.floor(editor.dom.height/2 - editor.borderImage.height/2)
    editor.dom.width  = editor.borderImage.width/2
    editor.dom.height = editor.borderImage.height
    editor.emit('render')
  }, true)
  // create default border image
  ;(function() {
    editor.backBuffer.width = 1024;
    editor.backBuffer.height = 512;
    ctx = editor.backBuffer.getContext('2d')
    // stroke our alpha mask
    ctx.beginPath()
    ctx.arc(768, 256, 246, 246, Math.PI*2, true)
    ctx.closePath()
    ctx.fill()
    // stroke our border
    ctx.beginPath()
    ctx.lineWidth = 10
    ctx.arc(256, 256, 246, 246, Math.PI*2, true)
    ctx.closePath()
    ctx.stroke()
    editor.borderImage.src = editor.backBuffer.toDataURL()
  })()
  // mouse functionality
  function onMouseMove(e) {
    var x = e.clientX - editor.lastMousePositionX
    var y = e.clientY - editor.lastMousePositionY
    editor.tokenImageLeft += x
    editor.tokenImageTop += y
    editor.lastMousePositionX = e.clientX
    editor.lastMousePositionY = e.clientY
    editor.emit('render')
  }
  function onMouseDown(e) {
    e.preventDefault()

    editor.lastMousePositionX = e.clientX
    editor.lastMousePositionY = e.clientY
    dom.addEventListener('mousemove', onMouseMove, false)
    window.addEventListener('mouseup', onMouseUp, false)
  }
  function onMouseUp(e) {
    dom.removeEventListener('mousemove', onMouseMove)
    window.removeEventListener('mouseup', onMouseUp)
  }
  dom.addEventListener('mousedown', onMouseDown, false)
  function onMouseWheel(e) {
    e.preventDefault();
    var move = (e.detail ? e.detail < 0 ? 1 : -1 : e.wheelDelta < 0 ? -1 : 1)

    var wheelMoveTime = new Date().getTime();
    var deltaMoveTime = wheelMoveTime - (editor.lastWheelMoveTime == 0 ? wheelMoveTime : editor.lastWheelMoveTime);
    // only accelerate if wheeltime was < 15ms
    if (deltaMoveTime < 15) {
      move *= deltaMoveTime;
    }
    editor.lastWheelMoveTime = wheelMoveTime;

    field.value = parseInt(field.value) + move;
    var event = new Event('input');
    field.dispatchEvent(event)
  }
  dom.addEventListener('mousewheel', onMouseWheel, false);
  dom.addEventListener('DOMMouseScroll', onMouseWheel, false);
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
    var last = editor.tokenImageZoom
    range.value = field.value
    editor.tokenImageZoom = parseInt(field.value) / 100
    editor.tokenImageLeft += (editor.tokenImage.width/2) * (last - editor.tokenImageZoom) 
    editor.tokenImageTop += (editor.tokenImage.height/2) * (last - editor.tokenImageZoom) 
    editor.emit('render')
  })
  editor.tokenImageZoom = parseInt(field.value) / 100
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
  // render token
  var targetWidth = editor.tokenImage.width * editor.tokenImageZoom
  var targetHeight = editor.tokenImage.height * editor.tokenImageZoom
  ctx.drawImage(editor.tokenImage, editor.tokenImageLeft, editor.tokenImageTop, targetWidth, targetHeight)
  // render foreground effects
  for (var i = 0; i < effects.list.length; i++) {
    if (effects.list[i].isBackground) continue
    effects.list[i].run(editor)
  }
  if (editor.borderImage.width > 0) {
    // alpha mask
    ctx.globalCompositeOperation = 'destination-in'
    ctx.drawImage(editor.borderImage, editor.borderImage.width/2, 0, editor.borderImage.width/2, editor.borderImage.height, 0, 0, editor.borderImage.width/2, editor.borderImage.height)
    ctx.globalCompositeOperation = 'source-over'
    ctx.drawImage(editor.borderImage, 0, 0, editor.borderImage.width/2, editor.borderImage.height, 0, 0, editor.borderImage.width/2, editor.borderImage.height)
  }
  ctx.globalCompositeOperation = 'source-over'
  if (!editor.isDragging && editor.tokenImage.width == 0) {
    ctx.font = '32pt Bowlby One SC'
    ctx.lineWidth = 2;
    ctx.textAlign = 'center'
    ctx.fillStyle = '#000'
    ctx.strokeStyle = '#fff'
    var name = names[rand(0, names.length)]
    ctx.fillText('Drop '+name+' here', editor.dom.width/2, editor.dom.height/2+16)
    ctx.strokeText('Drop '+name+' here', editor.dom.width/2, editor.dom.height/2+16)
  } else {
    ctx.drawImage(editor.overlay, 0, 0)
  }
})
editor.on('update', function() {
  editor.dom.width   = parseInt(editor.dom.offsetWidth)
  editor.dom.height  = parseInt(editor.dom.offsetHeight)
  editor.backBuffer.width = editor.dom.width
  editor.backBuffer.height = editor.dom.height
  editor.overlay.width = editor.dom.width
  editor.overlay.height = editor.dom.height
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
  var effect_view = effect.view(editor);
  var el = effects.fab('div', {className: 'tokenr-effects-item'})
  var elBackground = effects.fab('input', {type: 'checkbox', checked: effect.isBackground})
  elBackground.addEventListener('change', function(e) {
    effect.isBackground = e.target.checked
    editor.emit('render')
  })
  el.appendChild(elBackground)
  for (var i = 0; i < effect_view.length; i++) {
    el.appendChild(effect_view[i])
  }
  var _index = effects.list.length
  el.appendChild(effects.fab('input', {
    type: 'button', value: 'remove', onclick: function(e) {
      effects.emit('rem', el)
    }
  }))
  effects.domList.appendChild(el)
  effects.listDoms.push(el)
  effects.list.push(effect)
  editor.emit('render')
})
effects.on('rem', function(el) {
  var index = effects.listDoms.indexOf(el)
  if (index == -1) return
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
    effects.emit('init', dom.querySelector('#tokenr-editor-effects'))
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
