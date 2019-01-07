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
            // prepare helper element for writing string into clipboard
            const input = document.createElement('input');
            document.body.appendChild(input);
            input.value = newText;
            // Google Solution
            // input.focus();
            // input.select();

            // whatwebcando.today solution
            // clear current selection
            const selection = window.getSelection();
            selection.removeAllRanges();

            const newCopyRange = document.createRange();
            newCopyRange.selectNode(input);
            selection.addRange(newCopyRange);

            // const result = document.execCommand('copy');
            // if (result === false) {
            //     console.error('Failed to copy text with document.execCommand');
            // }

            try {
                const successful = document.execCommand('copy');
                if (successful) {
                    this.updateInternalClipboardText(newText);
                } else {
                    console.log('Failed copying text to clipboard: ', newText);
                }
            } catch (err) {
                console.log('execCommand error', err);
            } finally {
                document.body.removeChild(input);
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
