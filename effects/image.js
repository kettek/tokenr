/* ==== Effect: Image ==== */
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

ktk.Tokenr.import({
  name: 'image',
  src: null,
  loadListener: null,
  image: null,
  offsetX: null,
  offsetY: null,
  sizeX: null,
  sizeY: null,
  mouseWheel: null,
  undefinedName: '',
  selectionBox: null,   // Global selectionBox set in `import()`
  render: function(editor) {
    var self = this
    ctx = editor.dom.getContext('2d');
    ctx.drawImage(self.image, self.offsetX.value, self.offsetY.value, self.sizeX.value, self.sizeY.value);
    if (self.isSelected()) {
      self.selectionBox.style.left = parseFloat(self.offsetX.value) * editor.zoom + 'px';
      self.selectionBox.style.top = parseFloat(self.offsetY.value) * editor.zoom +'px';
      self.selectionBox.style.width = parseFloat(self.sizeX.value) * editor.zoom +'px';
      self.selectionBox.style.height = parseFloat(self.sizeY.value) * editor.zoom +'px';
      self.selectionBox.classList.add('active')
    }
    if (!self.image.src) {
      var string = 'Drop ' + self.undefinedName + ' here!';
      ctx.font = self.sizeX.value / (string.length/1.5) +'px Bowlby One SC'
      ctx.fillStyle = '#000'
      ctx.textAlign = 'center'
      ctx.fillText(string, parseFloat(self.offsetX.value) + parseFloat(self.sizeX.value)/2, parseFloat(self.offsetY.value) + parseFloat(self.sizeY.value)/2)
      ctx.lineWidth = 3
      ctx.strokeStyle = '#fff'
      ctx.strokeText(string, parseFloat(self.offsetX.value) + parseFloat(self.sizeX.value)/2, parseFloat(self.offsetY.value) + parseFloat(self.sizeY.value)/2)
    }
  },
  focus: function(editor) {
    var self = this
    self.selectionBox.style.left = parseFloat(self.offsetX.value) * editor.zoom + 'px';
    self.selectionBox.style.top = parseFloat(self.offsetY.value) * editor.zoom +'px';
    self.selectionBox.style.width = parseFloat(self.sizeX.value) * editor.zoom +'px';
    self.selectionBox.style.height = parseFloat(self.sizeY.value) * editor.zoom +'px';
    self.selectionBox.classList.add('active')
    editor.emit('render')
  },
  defocus: function(editor) {
    var self = this
    self.selectionBox.classList.remove('active')
  },
  import: function(editor) {
    // Add our selectionBox to the editor view.
    this.selectionBox = document.createElement('div')
    this.selectionBox.className = 'tokenr-view-selection-box'
    editor.dom.parentNode.appendChild(this.selectionBox)

    // Add 'drop' event listener to the editor view.
    editor.dom.addEventListener('drop', function(e) {
      var rect = editor.dom.getBoundingClientRect()
      var x = e.clientX - rect.left
      var y = e.clientY - rect.top

      // Iterate through our effects from last to first.
      if (editor.effects.selected >= 0 && editor.effects.selected < editor.effects.list.length && editor.effects.list[editor.effects.selected].name == 'image') {
        var effect = editor.effects.list[editor.effects.selected];
        // Do some collision detection.
        var l = parseFloat(effect.offsetX.value)
          , r = (l + parseFloat(effect.sizeX.value))
          , t = parseFloat(effect.offsetY.value)
          , b = (t + parseFloat(effect.sizeY.value))
        l *= editor.zoom, r *= editor.zoom, t *= editor.zoom, b *= editor.zoom
        if (x >= l && x <= r && y >= t && y <= b) {
        } else {
          editor.effects.emit('add', 'image')
          editor.effects.select(editor.effects.list.length-1)
        }
      } else {
        editor.effects.emit('add', 'image')
        editor.effects.select(editor.effects.list.length-1)
      }
      editor.effects.list[editor.effects.selected].onDrop(e)
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
    self.undefinedName = names[rand(0, names.length-1)]
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
    self.src = editor.effects.fab('input', {
      value: '',
      oninput: function(e) {
        self.image.src = e.target.value;
      },
      ondrop: self.onDrop
    })
    self.image = editor.effects.fab('img', {
      onload: function(e) {
        self.transform({
          size_x: self.image.naturalWidth ? self.image.naturalWidth : editor.desiredWidth,
          size_y: self.image.naturalHeight ? self.image.naturalHeight : editor.desiredHeight,
          offset_x: Math.floor(editor.dom.width/2 - parseInt(self.sizeX.value)/2),
          offset_y: Math.floor(editor.dom.height/2 - parseInt(self.sizeY.value)/2)
        })
        editor.emit('render');
      },
      ondrop: self.onDrop
    })
    var offsetContainer = editor.effects.fab('div');
    self.offsetX = editor.effects.fab('input', {
      type: 'number',
      style: 'width: 4em',
      value: 0,
      oninput: function() {
        editor.emit('render')
      }
    });
    self.offsetY = editor.effects.fab('input', {
      type: 'number',
      style: 'width: 4em',
      value: 0,
      oninput: function() {
        editor.emit('render')
      }
    });
    offsetContainer.appendChild(self.offsetX);
    offsetContainer.appendChild(self.offsetY);

    var sizeContainer = editor.effects.fab('div');
    self.sizeX = editor.effects.fab('input', {
      type: 'number',
      style: 'width: 4em',
      value: editor.desiredWidth,
      oninput: function() {
        editor.emit('render')
      }
    })
    self.sizeY = editor.effects.fab('input', {
      type: 'number',
      style: 'width: 4em',
      value: editor.desiredHeight,
      oninput: function() {
        editor.emit('render')
      }
    })
    sizeContainer.appendChild(self.sizeX)
    sizeContainer.appendChild(self.sizeY)
    var containers = editor.effects.fab('div', { className: 'cols' })
    containers.appendChild(offsetContainer)
    containers.appendChild(sizeContainer)
    return [self.image, self.src, containers]
  }
})
