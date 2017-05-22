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
    ctx.font = '20pt Oswald'
    ctx.textAlign = 'center'

    ctx.globalAlpha = 0.25
    ctx.fillStyle = '#000'
    ctx.strokeStyle = '#fff'
    if (x >= w && x <= editor.dom.width-w
        && y >= h && y <= editor.dom.height-h) {
      ctx.fillRect(w, h, editor.dom.width-w*2, editor.dom.height-h*2)
      ctx.globalAlpha = 1.0
      ctx.fillText('Use Image as Token', editor.dom.width/2, editor.dom.height/2)
      ctx.strokeText('Use Image as Token', editor.dom.width/2, editor.dom.height/2)
    } else {
      ctx.fillRect(0, h, w, editor.dom.height-h*2)
      ctx.fillRect(0, 0, editor.dom.width, h)
      ctx.fillRect(editor.dom.width-w, h, w, editor.dom.height-h*2)
      ctx.fillRect(0, editor.dom.height-h, editor.dom.width, h)
      ctx.globalAlpha = 1.0
      ctx.fillText('Use Image as Border', editor.dom.width/2, editor.dom.height/2)
      ctx.strokeText('Use Image as Border', editor.dom.width/2, editor.dom.height/2)
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
  if (editor.tokenImage.width > 0) {
    if (editor.borderImage.width > 0) {
      ctx.drawImage(editor.borderImage, editor.borderImage.width/2, 0, editor.borderImage.width/2, editor.borderImage.height, 0, 0, editor.borderImage.width/2, editor.borderImage.height)
    }
    ctx.globalCompositeOperation = 'source-in'
    ctx.drawImage(editor.tokenImage, editor.tokenImageLeft, editor.tokenImageTop, editor.tokenImage.width * editor.tokenImageZoom, editor.tokenImage.height * editor.tokenImageZoom)
  }
  if (editor.borderImage.width > 0) {
    ctx.globalCompositeOperation = 'source-over'
    ctx.drawImage(editor.borderImage, 0, 0, editor.borderImage.width/2, editor.borderImage.height, 0, 0, editor.borderImage.width/2, editor.borderImage.height)
  }
  ctx.globalCompositeOperation = 'source-over'
  if (!editor.isDragging && editor.tokenImage.width == 0) {
    ctx.font = '20pt Oswald'
    ctx.textAlign = 'center'
    ctx.fillStyle = '#000'
    ctx.strokeStyle = '#fff'
    ctx.fillText('Drop Image here', editor.dom.width/2, editor.dom.height/2)
    ctx.strokeText('Drop Image here', editor.dom.width/2, editor.dom.height/2)
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
editor.onDrop = function(e) {
  e.preventDefault()
  if (inCenter) {
    editor.tokenImage = e.image
  } else {
    editor.borderImage = e.image
  }
}
editor.onPress = function(e) {
}
editor.onDrag = function(e) {
}
editor.onZoom = function(e) {
}
/* ================================ PUBLIC ================================ */
return {
  init: function(editorDom) {
    editor.emit('init', editorDom).emit('update')
  }
}
})()
