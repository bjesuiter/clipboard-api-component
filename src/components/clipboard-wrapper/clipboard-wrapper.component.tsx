import { Component, EventEmitter, Event, State, Method } from '@stencil/core';

@Component({
    tag: 'clipboard-wrapper',
    styleUrl: 'clipboard-wrapper.css'
})
export class ClipboardWrapper {
    /**
     * The text copied into and pasted from the clipboard
     */
    // @Prop() text: string;
    //
    // @Watch('text')
    // public textPropInputChanged(value: string) {
    //     this.clipboardText = value;
    // }

    /**
     * The text copied into and pasted from the clipboard
     */
    @State() clipboardText: string;
    @State() textInput: string;

    @Event() textChange: EventEmitter<string>;

    private anyNavigator = navigator as any;
    private readonly hasAsyncClipboard: boolean = false;

    constructor() {
        this.hasAsyncClipboard = this.anyNavigator.clipboard !== undefined;
        console.log('This browser has async navigator.clipboard: ', this.hasAsyncClipboard);
    }

    public componentWillLoad() {
        document.addEventListener('paste', this.onPasteEventHandler.bind(this));
    }

    public componentDidUnload() {
        document.removeEventListener('paste', this.onPasteEventHandler);
    }

    // currently not working in each version (with async clipboard and without)
    @Method()
    public writeTextToClipboard(newText: string) {
        if (this.hasAsyncClipboard) {
            this.anyNavigator.clipboard.writeText(newText)
                .then(() => this.updateInternalClipboardText(newText));
        } else {
            // Textarea solution with fixes for iOS
            // https://stackoverflow.com/questions/400212/how-do-i-copy-to-the-clipboard-in-javascript
            // prepare helper element for writing string into clipboard
            const textarea = document.createElement('textarea');

            // Move it off screen.
            textarea.style.cssText = 'position: absolute; left: -99999em';

            // Set to readonly to prevent mobile devices opening a keyboard when
            // text is .select()'ed.
            textarea.setAttribute('readonly', 'true');

            document.body.appendChild(textarea);
            textarea.value = newText;

            // Check if there is any content selected previously.
            const selected = document.getSelection().rangeCount > 0 ?
                document.getSelection().getRangeAt(0) : false;

            // iOS Safari blocks programmatic execCommand copying normally, without this hack.
            // https://stackoverflow.com/questions/34045777/copy-to-clipboard-using-javascript-in-ios
            if (navigator.userAgent.match(/ipad|ipod|iphone/i)) {
                const editable = textarea.contentEditable;
                textarea.contentEditable = 'true';
                const range = document.createRange();
                range.selectNodeContents(textarea);
                const sel = window.getSelection();
                sel.removeAllRanges();
                sel.addRange(range);
                textarea.setSelectionRange(0, 999999);
                textarea.contentEditable = editable;
            } else {
                textarea.select();
            }

            try {
                const successful = document.execCommand('copy');

                // Restore previous selection.
                if (selected) {
                    document.getSelection().removeAllRanges();
                    document.getSelection().addRange(selected);
                }

                if (successful) {
                    this.updateInternalClipboardText(newText);
                } else {
                    console.log('Failed copying text to clipboard: ', newText);
                }
            } catch (err) {
                console.log('execCommand error', err);
            } finally {
                document.body.removeChild(textarea);
            }

        }
    }

    private async onPasteEventHandler(event: any) {
        let text;
        // clipboard.readText is undefined in Firefox 64.0
        if (this.hasAsyncClipboard && this.anyNavigator.clipboard.readText !== undefined) {
            try {
                text = await this.anyNavigator.clipboard.readText();
            } catch (err) {
                console.error('Failed to read clipboard text: ', err);
            }
        } else {
            text = event.clipboardData.getData('text/plain');
        }
        console.log('Got pasted text: ', text);
        this.textChange.emit(text);
        this.clipboardText = text;
    }

    private updateInternalClipboardText(newText: string) {
        this.clipboardText = newText;
        this.textChange.emit(newText);
        console.log('Text copied to clipboard: ', newText);
    }

    private handleTextInput(event) {
        const target = event.target as HTMLInputElement;
        this.textInput = target.value;
    }

    render() {
        return [
            <div>The Clipboard Content is: {this.clipboardText}</div>,
            <input type="text" onInput={(event) => this.handleTextInput(event)}/>,
            <button onClick={() => this.writeTextToClipboard(this.textInput)}>Copy Demo Text</button>
        ];
    }
}
