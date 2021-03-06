import eventBus from '../../core/eventBus'
import $ from '../../utils/slimJQ'
import DrawUtils from '../../draw/drawUtils'
import { setScale, setExportData } from '../../utils/utils'

const DEFAULT_CONFIG = {
  // 边框颜色
  borderColor: '#999999',
  // 修改名称回调
  onEdited: () => {}
}

class EditName {
  constructor($container, config) {
    this.$container = $container

    this.config = Object.assign({}, DEFAULT_CONFIG, config)

    this.init()
  }

  init() {
    //
    eventBus.on('edit.shape.name', this.editShapeName.bind(this))
  }

  /**
   * 编辑图形名称
   */
  editShapeName() {
    const { $container, config } = this

    const selectIds = eventBus.trigger('shape.select.getIds') || []
    if (selectIds.length === 1) {
      const element = eventBus.trigger('element.get', selectIds[0])
      const { data, plane, shape } = element
      if (shape.bpmnName === 'SequenceFlow') {
        this.editConnectionName(element)
        return true
      }

      let $edit = $container.find('.shape-name-edit')
      if ($edit.length === 0) {
        $edit = $("<textarea class='shape-name-edit'></textarea>").appendTo(
          $container.find('.bpd-designer')
        )
      }

      let $temp = $container.find('.shape-name-temp')
      if ($temp.length === 0) {
        $temp = $("<textarea class='shape-name-temp'></textarea>").appendTo(
          $container.find('.bpd-designer')
        )
      }

      $('.text-box[data-shape=' + data.id + ']').hide()

      const orders = eventBus.trigger('orders.get')

      const fontStyle = shape.fontStyle
      const textBlock = shape.getTextBlock()
      const editStyle = {
        width: textBlock.width + 'px',
        'border-color': config.borderColor,
        'line-height': Math.round(fontStyle.size * 1.25) + 'px',
        'font-size': fontStyle.size + 'px',
        'font-family': fontStyle.fontFamily,
        'font-weight': fontStyle.bold ? 'bold' : 'normal',
        'font-style': fontStyle.italic ? 'italic' : 'normal',
        'text-align': fontStyle.textAlign,
        color: 'rgb(' + fontStyle.color + ')',
        'text-decoration': fontStyle.underline ? 'underline' : 'none',
        'z-index': orders.length + 10
      }

      $edit.css(editStyle).show()
      $temp.css(editStyle)
      textBlock.x += plane.bounds.x
      textBlock.y += plane.bounds.y
      $edit.val(data.name)

      $edit
        .off()
        .on('keyup', () => {
          $temp.val($edit.val())
          $temp.scrollTop(99999)
          const tempHeight = $temp.scrollTop()
          $edit.css({ height: tempHeight })

          const shapeTextPos = {
            x: textBlock.x + textBlock.width / 2,
            y: textBlock.y + textBlock.height / 2
          }
          let editPosY = 0
          let editPadding = 5
          let editPaddingTop = 0
          let textHeight = textBlock.height

          switch (fontStyle.vAlign) {
            case 'middle':
              if (tempHeight > textHeight) {
                textHeight = tempHeight
                editPosY = shapeTextPos.y - textHeight / 2 - editPadding
                editPaddingTop = 0
              } else {
                editPosY = shapeTextPos.y - textBlock.height / 2 - editPadding
                editPaddingTop = (textBlock.height - tempHeight) / 2
                textHeight = textBlock.height - editPaddingTop
              }
              break
            default:
              editPosY = shapeTextPos.y - textBlock.height / 2 + editPadding
              if (tempHeight > textHeight) {
                textHeight = tempHeight
              } else {
                textHeight = textBlock.height
              }
              break
          }
          const editHeight = editPadding * 2 + textHeight
          const editPos = {
            x: textBlock.x + textBlock.width / 2 - editPadding,
            y: editPosY + editHeight / 2
          }
          $edit.css({
            width: textBlock.width,
            height: textHeight,
            'padding-top': editPaddingTop,
            padding: editPadding,
            left: setScale(editPos.x) - textBlock.width / 2 - 1,
            top: setScale(editPos.y) - editHeight / 2 - 1
          })
        })
        .on('blur', e => {
          this.updateShapeName(element)
        })
        .on('mousemove', e => {
          e.stopPropagation()
        })
        .on('mousedown', e => {
          e.stopPropagation()
        })

      $edit.trigger('keyup')
      $edit.select()
    }
  }

  /**
   * 更新图形名称
   */
  updateShapeName(element) {
    const { data } = element
    const $edit = this.$container.find('.shape-name-edit')
    const shapeName = $edit.val()
    if ($edit.length && $edit.is(':visible')) {
      if (shapeName !== data.name) {
        data.name = shapeName
        eventBus.trigger('element.update', element)
        this.config.onEdited(setExportData(element))
      }
      // 渲染图形
      eventBus.trigger('shape.render', {
        type: element.shape.bpmnName,
        element
      })
      $edit.remove()
    }
  }

  /**
   * 更新连线名称
   */
  editConnectionName(element) {
    const { $container, config } = this
    const { data, plane, shape } = element
    const $shape = $container.find('.shape-box[data-id=' + data.id + ']')
    const $text = $shape.find('.text-box[data-shape=' + data.id + ']')
    let $edit = $container.find('.connection-name-edit')
    if ($edit.length === 0) {
      $edit = $("<textarea class='connection-name-edit'></textarea>").appendTo(
        $container.find('.bpd-designer')
      )
    }

    $text.hide()

    const orders = eventBus.trigger('orders.get')

    const fontStyle = shape.fontStyle
    const lineHeight = Math.round(fontStyle.size * 1.25)
    const editStyle = {
      'border-color': config.borderColor,
      'line-height': lineHeight + 'px',
      'font-size': fontStyle.size + 'px',
      'font-family': fontStyle.fontFamily,
      'font-weight': fontStyle.bold ? 'bold' : 'normal',
      'font-style': fontStyle.italic ? 'italic' : 'normal',
      'text-align': fontStyle.textAlign,
      color: 'rgb(' + fontStyle.color + ')',
      'text-decoration': fontStyle.underline ? 'underline' : 'none',
      padding: 5,
      'z-index': orders.length + 10
    }

    $edit.css(editStyle)
    $edit
      .val(data.name)
      .show()
      .select()

    const midPoint = DrawUtils.getConnectionMidpoint(shape)

    $edit
      .off()
      .on('keyup', () => {
        const name = $edit.val()
        const replaceName = name
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/\n/g, '<br/>')

        $text.html(replaceName + '<br />')

        let width = $text.width()
        if (width < 50) {
          width = 50
        }
        let height = $text.height()
        if (height < lineHeight) {
          height = lineHeight
        }
        $edit.css({
          left: midPoint.x - width / 2 - 1 - 5,
          top: midPoint.y - height / 2 - 1 - 5,
          width,
          height
        })
      })
      .on('blur', () => {
        this.updateConnectionName(element)
      })
      .on('mousemove', e => {
        e.stopPropagation()
      })
      .on('mousedown', e => {
        e.stopPropagation()
      })

    $edit.trigger('keyup')
  }

  /**
   * 更新连线名称
   * @param {*} element
   */
  updateConnectionName(element) {
    const { data } = element
    const $edit = this.$container.find('.connection-name-edit')
    const connectionName = $edit.val()
    if ($edit.length && $edit.is(':visible')) {
      if (connectionName !== data.name) {
        data.name = connectionName
        eventBus.trigger('element.update', element)
        this.config.onEdited(setExportData(element))
      }
      // 渲染连线
      eventBus.trigger('connection.render', {
        element
      })
      $edit.remove()
    }
  }
}

export default EditName
