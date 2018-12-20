import { Component, Prop } from '@stencil/core';

@Component({
    tag: 'clipboard-wrapper',
    styleUrl: 'clipboard-wrapper.css',
    shadow: true
})
export class ClipboardWrapper {
    /**
     * The text copied into and pasted from the clipboard
     */
    @Prop() text: string;

    private anyNavigator = navigator as any;
    private hasAsyncClipboard = false;

    constructor() {
        this.hasAsyncClipboard = this.anyNavigator.clipboard !== undefined;
    }

    public componentWillLoad() {
        document.addEventListener('onpaste', this.onPasteEventHandler.bind(this));
    }

    private async onPasteEventHandler(event: any) {
        let text;
        if (this.hasAsyncClipboard) {
            text = await this.anyNavigator.clipboard.readText();
        } else {
            text = event.clipboardData.getData('text/plain');
        }
        console.log('Got pasted text: ', text);
    }

    render() {
        return (
            <div>The Clipboard Content is {this.text}</div>
        );
    }
}
