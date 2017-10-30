import {
    mergeArray,
    getDescendantTextNodes,
    getAfterStartDescendantTextNodes,
    getBeforeEndDescendantTextNodes
} from './util'

import commands from '../commands'

// for IE 11
if (!Text.prototype.contains) {
    Text.prototype.contains = function contains(otherNode) {
        return this === otherNode
    }
}


/**
 * Created by peak on 2017/2/14.
 */
export default class RangeHandler {
    /**
     * build range handler
     * @param {Range} range
     */
    constructor(range) {
        if (!range || !(range instanceof Range)) {
            throw new TypeError('cant\'t resolve range')
        }
        this.range = range
    }


    /**
     * find all the text nodes in range
     */
    getAllTextNodesInRange() {
        const startContainer = this.range.startContainer
        const endContainer = this.range.endContainer
        const rootEl = this.range.commonAncestorContainer
        const textNodes = []

        if (startContainer === endContainer) {
            if (startContainer.nodeType === Node.TEXT_NODE) {
                return [startContainer]
            }
            const childNodes = startContainer.childNodes
            for (let i = this.range.startOffset; i < this.range.endOffset; i++) {
                mergeArray(textNodes, getDescendantTextNodes(childNodes[i]))
            }
            return textNodes
        }

        let startIndex = 0
        let endIndex = 0
        for (let i = 0; i < rootEl.childNodes.length; i++) {
            const node = rootEl.childNodes[i]
            if (node.contains(startContainer)) {
                startIndex = i
            }
            if (node.contains(endContainer)) {
                endIndex = i
            }
        }

        for (let i = startIndex; i <= endIndex; i++) {
            const node = rootEl.childNodes[i]
            if (i === startIndex) {
                if (node.nodeType === Node.TEXT_NODE) {
                    textNodes.push(node)
                } else if (node.nodeType === Node.ELEMENT_NODE) {
                    mergeArray(textNodes, getAfterStartDescendantTextNodes(node, startContainer))
                }
            } else if (i === endIndex) {
                if (node.nodeType === Node.TEXT_NODE) {
                    textNodes.push(node)
                } else if (node.nodeType === Node.ELEMENT_NODE) {
                    mergeArray(textNodes, getBeforeEndDescendantTextNodes(node, endContainer))
                }
            } else if (node.nodeType === Node.TEXT_NODE) {
                textNodes.push(node)
            } else if (node.nodeType === Node.ELEMENT_NODE) {
                mergeArray(textNodes, getDescendantTextNodes(node))
            }
        }
        return textNodes
    }

    /**
     * execute edit command
     * @param {String} command
     * @param arg
     */
    execCommand(command, arg) {
        const existCommand = commands[command]
        if (existCommand) {
            existCommand(this, arg)
            return
        }
        document.execCommand(command, false, arg)
    }
}
