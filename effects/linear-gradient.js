/* ==== Effect: Linear Gradient ==== */
ktk.Tokenr.import({
  name: 'linear gradient',
  aAlpha: 1.0,
  aColor: '#000000',
  bAlpha: 0.0,
  bColor: '#000000',
  containerType: 'cols',
  render: function(editor) {
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
    var containerA  = editor.effects.fab('div')
    var colorA      = editor.effects.fab('input', { type: 'color' })
    colorA.oninput = function(e) { self.aColor = e.target.value; editor.emit('render') }
    var alphaA = editor.effects.fab('input', { type: 'range', min: 0, max: 100, step: 1, value: 100 })
    alphaA.oninput = function(e) { self.aAlpha = e.target.value / 100; editor.emit('render') }
    containerA.appendChild(colorA); containerA.appendChild(alphaA)

    var containerB = editor.effects.fab('div')
    var colorB  = editor.effects.fab('input', { type: 'color' })
    colorB.oninput = function(e) { self.bColor = e.target.value; editor.emit('render') }
    var alphaB = editor.effects.fab('input', { type: 'range', min: 0, max: 100, step: 1, value: 0 })
    alphaB.oninput = function(e) { self.bAlpha = e.target.value / 100; editor.emit('render') }
    containerB.appendChild(colorB); containerB.appendChild(alphaB);
    return [containerA, containerB]
  }
})
