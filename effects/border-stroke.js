/* ==== Effect: Border Stroke ==== */
ktk.Tokenr.import({
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
  render: function(editor) {
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
    self.color = editor.effects.fab('input', {
      type: 'color',
      value: '#fff',
      oninput: function(e) {
        self.update(editor);
        editor.emit('render');
      }
    });
    self.width = editor.effects.fab('input', {
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
