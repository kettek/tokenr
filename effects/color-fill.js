/* ==== Effect: Color Fill ==== */
ktk.Tokenr.import({
  name: 'color fill',
  color: '#000',
  alpha: 1.0,
  render: function(editor) {
    ctx = editor.dom.getContext('2d')
    ctx.globalAlpha = this.alpha
    ctx.fillStyle = this.color
    ctx.fillRect(0, 0, editor.dom.width, editor.dom.height)
    ctx.globalAlpha = 1.0
  },
  view: function(editor) {
    var self = this
    var color = editor.effects.fab('input', {
      type: 'color',
      oninput: function(e) {
        self.color = e.target.value
        editor.emit('render')
      }
    })
    var alphaSlider = editor.effects.fab('input', {
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
