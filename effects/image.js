/* ==== Effect: Image ==== */
ktk.Tokenr.import({
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
  render: function(editor) {
    var self = this
    ctx = editor.dom.getContext('2d');
    ctx.drawImage(self.image, self.offsetX.value, self.offsetY.value, self.sizeX.value, self.sizeY.value);
    if (self.isSelected()) {
      editor.selectionBox.style.left = parseFloat(self.offsetX.value) * editor.zoom + 'px';
      editor.selectionBox.style.top = parseFloat(self.offsetY.value) * editor.zoom +'px';
      editor.selectionBox.style.width = parseFloat(self.sizeX.value) * editor.zoom +'px';
      editor.selectionBox.style.height = parseFloat(self.sizeY.value) * editor.zoom +'px';
      editor.selectionBox.classList.add('active')
    }
  },
  focus: function(editor) {
    var self = this
    editor.selectionBox.style.left = parseFloat(self.offsetX.value) * editor.zoom + 'px';
    editor.selectionBox.style.top = parseFloat(self.offsetY.value) * editor.zoom +'px';
    editor.selectionBox.style.width = parseFloat(self.sizeX.value) * editor.zoom +'px';
    editor.selectionBox.style.height = parseFloat(self.sizeY.value) * editor.zoom +'px';
    editor.selectionBox.classList.add('active')
    editor.emit('render')
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
          size_x: self.image.naturalWidth ? self.image.naturalWidth : 512,
          size_y: self.image.naturalHeight ? self.image.naturalHeight : 512,
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
      value: '512',
      oninput: function() {
        editor.emit('render')
      }
    })
    self.sizeY = editor.effects.fab('input', {
      type: 'number',
      style: 'width: 4em',
      value: '512',
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
